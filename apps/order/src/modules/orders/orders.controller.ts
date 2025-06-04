import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async createOrder() {
    await this.ordersService.createOrder();
  }
  @Get('balance')
  async getWalletBalance() {
    return this.ordersService.getWalletBalance();
  }
}
