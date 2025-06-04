import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SagaOrchestrator } from '../saga/saga.orchestrator';
import { CacheModule } from '@nestjs/cache-manager';
import { ByBitApiService } from '../by-bit-api/by-bit-api.service';
import { RmqModule, UtilsModule } from '@app/common';
import { TELEGRAM_SERVICE } from '../../constants';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register(),
    UtilsModule,
    RmqModule.register({
      name: TELEGRAM_SERVICE,
    }),
  ],
  providers: [OrdersService, ByBitApiService, SagaOrchestrator],
  controllers: [OrdersController],
})
export class OrdersModule {}
