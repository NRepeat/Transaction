import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';
import { SagaOrchestrator } from '../saga/saga.orchestrator';
import { SagaState } from '../saga/saga.constants';
import { ByBitApiService } from '../by-bit-api/by-bit-api.service';
import { ByBitRequestOrderData } from '../../types';
import { TELEGRAM_SERVICE } from '../../constants';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    private readonly byBitApiService: ByBitApiService,
    private prisma: PrismaService,
    private readonly saga: SagaOrchestrator,
    @Inject(TELEGRAM_SERVICE) private telegramClient: ClientProxy,
  ) {}

  async createOrder() {
    try {
      const sagaId = uuidv4();
      this.logger.log(`Starting Saga ${sagaId} for order creation`);

      const orderData: ByBitRequestOrderData = {
        category: 'spot',
        symbol: 'BTCUSDT',
        side: 'Sell',
        orderType: 'Market',
        qty: '0.01',
        orderLinkId: 'link-id' + Math.floor(Math.random() * 1000000),
      };
      await this.saga.startSaga(sagaId, {
        userId: 'user-id-123',
        symbol: orderData.symbol,
        side: orderData.side,
        quantity: orderData.qty,
      });

      const existingOrder = await this.prisma.order.findUnique({
        where: { sagaId: sagaId },
      });
      if (existingOrder) {
        this.logger.warn(`Order ${sagaId} already exists, skipping creation`);
        return { order: existingOrder, bybitOrderId: null };
      }
      let order: any;
      try {
        order = await this.prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const newOrder = await tx.order.create({
              data: {
                id: sagaId,
                userId: 'user-id-123',
                sagaId: sagaId,
                symbol: orderData.symbol,
                side: orderData.side,
                category: orderData.category,
                orderId: '',
                retCode: 0,
                retMsg: '',
                orderType: orderData.orderType,
                qty: orderData.qty,
                orderLinkId: orderData.orderLinkId,
                status: 'PENDING',
              },
            });
            this.logger.log(`Order ${sagaId} created in transaction`);
            return newOrder;
          },
        );
        await this.saga.updateSagaState(sagaId, SagaState.ORDER_SAVED, {
          orderId: sagaId,
        });
      } catch (error) {
        this.logger.error(
          `Failed to save order in transaction: ${error.message}`,
        );
        await this.saga.failSaga(
          sagaId,
          `Failed to save order: ${error.message}`,
        );
        throw new Error(`Failed to save order: ${error.message}`);
      }
      let bybitOrderId: string;
      try {
        const bybitResponse = await this.byBitApiService.submitOrder(orderData);
        bybitOrderId = bybitResponse.result.orderId;
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.order.update({
            where: { id: sagaId },
            data: { status: 'PLACED' },
          });
          this.logger.log(
            `Order ${sagaId} status updated to PLACED in transaction`,
          );
        });

        await this.saga.updateSagaState(sagaId, SagaState.BYBIT_ORDER_PLACED, {
          bybitOrderId,
        });
      } catch (error) {
        await this.compensateOrder(sagaId);
        await this.saga.failSaga(
          sagaId,
          `Failed to place ByBit order: ${error.message}`,
        );
        throw new Error(
          `Order placement failed after 3 attempts: ${error.message}`,
        );
      }
      try {
        this.telegramClient.emit('send_telegram_message', {
          sagaId,
          message: `Order ${sagaId} placed successfully with ByBit Order ID: ${bybitOrderId}`,
        });
        await this.saga.updateSagaState(sagaId, SagaState.TELEGRAM_NOTIFIED);
      } catch (error) {
        this.logger.error(`Telegram timeout or error: ${error.message}`);
        // Compensating transaction
        await this.compensateOrder(sagaId);
        await this.saga.failSaga(
          sagaId,
          `Failed to notify Telegram: ${error.message}`,
        );
        throw new Error(`Telegram notification failed: ${error.message}`);
      }
      await this.saga.updateSagaState(sagaId, SagaState.COMPLETED);
      this.logger.log(`Saga ${sagaId} completed successfully`);
      return { order, bybitOrderId };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
  private async compensateOrder(sagaId: string) {
    this.logger.warn(`Compensating Saga ${sagaId}`);
    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const order = await tx.order.findUnique({ where: { id: sagaId } });
        if (order) {
          await tx.order.delete({ where: { id: sagaId } });
          this.logger.log(`Order ${sagaId} deleted as part of compensation`);
        }
      });
    } catch (error) {
      this.logger.error(
        `Compensation failed for Saga ${sagaId}: ${error.message}`,
      );
      await this.saga.failSaga(sagaId, `Compensation failed: ${error.message}`);
    }
  }
  async getWalletBalance() {
    return this.byBitApiService.getWalletBalance();
  }
}
