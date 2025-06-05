import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { RmqModule } from '@app/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { AppUpdate } from './telegram.update';
import { CacheModule } from '@nestjs/cache-manager';
import { ORDER_SERVICE } from './constants';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/telegram/.env',
    }),
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') || '',
      }),
    }),
    RmqModule.register({
      name: ORDER_SERVICE,
    }),
    RmqModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService, AppUpdate],
})
export class AppModule {}
