import { Injectable } from '@nestjs/common';
import { AccountTypeV5, RestClientOptions, RestClientV5 } from 'bybit-api';
import { ConfigService } from '@nestjs/config';
import { ByBitRequestOrderData } from '../../types';
import { UtilsService } from '@app/common/utils/utils.service';

@Injectable()
export class ByBitApiService {
  public readonly client: RestClientV5;
  private readonly restOptions: RestClientOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
  ) {
    console.log('api key', this.configService.get<string>('BYBIT_API_KEY'));
    this.restOptions = {
      key: this.configService.get<string>('BYBIT_API_KEY'),
      secret: this.configService.get<string>('BYBIT_API_SECRET'),
      baseUrl: this.configService.get<string>('BYBIT_API_BASE_URL'),
      testnet: true,
    };

    this.client = new RestClientV5(this.restOptions);
  }
  async submitOrder(orderData: ByBitRequestOrderData) {
    const orderRequest = this.client.submitOrder({
      category: orderData.category,
      symbol: orderData.symbol,
      side: orderData.side,
      orderType: orderData.orderType,
      qty: orderData.qty,
      orderLinkId: orderData.orderLinkId,
    });
    const { data, error } = await this.utilsService.tryCatch(orderRequest);
    if (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
    const order = data;
    console.log('Order submitted:', order);

    return order;
  }
  async getWalletBalance(
    accountType: AccountTypeV5 = 'UNIFIED',
    coin: string = 'BTC',
  ) {
    const walletBalanceRequest = this.client.getWalletBalance({
      accountType,
      coin,
    });
    const { data, error } =
      await this.utilsService.tryCatch(walletBalanceRequest);
    if (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
    const walletBalance = data;
    console.log('Wallet balance:', walletBalance);

    return walletBalance;
  }
}
