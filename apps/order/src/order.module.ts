import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './modules/orders/orders.module';
import { ByBitApiModule } from './modules/by-bit-api/by-bit-api.module';
import { SagaModule } from './modules/saga/saga.module';
import { CacheModule } from '@nestjs/cache-manager';
// import { DatabaseModule, RmqModule, AuthModule } from '@app/common';
// import { OrdersController } from './orders.controller';
// import { OrdersService } from './orders.service';
// import { OrdersRepository } from './orders.repository';
// import { Order, OrderSchema } from './schemas/order.schema';
// import { BILLING_SERVICE } from './constants/services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/order/.env',
    }),

    OrdersModule,
    ByBitApiModule,
    SagaModule,
    CacheModule.register(),
  ],
  // controllers: [OrderController],
  //   providers: [OrdersService, OrdersRepository],
})
export class OrderModule {}
