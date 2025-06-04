import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { SagaState } from './saga.constants';

@Injectable()
export class SagaOrchestrator {
  private readonly logger = new Logger(SagaOrchestrator.name);
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async startSaga(sagaId: string, initialData: any) {
    const state = {
      sagaId,
      state: SagaState.ORDER_INITIATED,
      history: [
        {
          state: SagaState.ORDER_INITIATED,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    await this.cacheManager.set(
      `${this.configService.get('SAGA_STATE_CACHE')}:${sagaId}`,
      JSON.stringify(state),
      3600,
    );
    this.logger.log(
      `Saga ${sagaId} initiated with state ${SagaState.ORDER_INITIATED}`,
    );
    return state;
  }

  async updateSagaState(
    sagaId: string,
    newState: SagaState,
    additionalData: any = {},
  ) {
    const currentState = await this.getSagaState(sagaId);
    if (!currentState) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    const updatedState = {
      ...currentState,
      state: newState,
      data: { ...currentState.data, ...additionalData },
      history: [
        ...currentState.history,
        { state: newState, timestamp: new Date().toISOString() },
      ],
    };

    await this.cacheManager.set(
      `${this.configService.get('SAGA_STATE_CACHE')}:${sagaId}`,
      JSON.stringify(updatedState),
      3600,
    );
    this.logger.log(`Saga ${sagaId} updated to state ${newState}`);
    return updatedState;
  }

  async getSagaState(sagaId: string): Promise<any> {
    const state = (await this.cacheManager.get(
      `${this.configService.get('SAGA_STATE_CACHE')}:${sagaId}`,
    )) as string;
    return state ? JSON.parse(state) : null;
  }

  async failSaga(sagaId: string, error: string) {
    await this.updateSagaState(sagaId, SagaState.FAILED, { error });
    this.logger.error(`Saga ${sagaId} failed: ${error}`);
  }

  async compensateSaga(sagaId: string, reason: string) {
    this.logger.warn(`Compensating Saga ${sagaId}: ${reason}`);
    await this.updateSagaState(sagaId, SagaState.FAILED, {
      reason,
      compensated: true,
    });
  }
}
