import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { RmqService } from '@app/common';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly rmqService: RmqService,
  ) {}

  @Get()
  async createOrder() {
    await this.ordersService.createOrder();
  }
  @Get('balance')
  async getWalletBalance() {
    return this.ordersService.getWalletBalance();
  }

  @EventPattern('place_order')
  async handlePlaceOrder(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Received place_order event:', data);
    await this.ordersService.createOrder();
    this.rmqService.ack(context);
  }
}
