import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { SagaOrchestrator } from './saga.orchestrator';

@Module({
  imports: [ConfigModule, CacheModule.register()],
  providers: [SagaOrchestrator],
  exports: [SagaOrchestrator],
})
export class SagaModule {}
