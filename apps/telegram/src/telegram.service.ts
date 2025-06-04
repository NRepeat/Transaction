import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { Cache } from 'cache-manager';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectBot() private bot: Telegraf<Context>,
  ) {}

  async sendMessage(sagaId: string, message: string, chatId: string) {
    const sentKey = `telegram_sent:${sagaId}`;

    try {
      const alreadySent = await this.cacheManager.get(sentKey);
      if (alreadySent) {
        this.logger.warn(`Message for Saga ${sagaId} already sent, skipping`);
        return { status: 'SKIPPED', sagaId };
      }

      await this.cacheManager.set(sentKey, 'true', 3600); // TTL 1h
      this.logger.log(`Telegram message for Saga ${sagaId} sent: ${message}`);
      await this.bot.telegram.sendMessage(chatId, message);
      return { status: 'SUCCESS', sagaId };
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram message for Saga ${sagaId}: ${error.message}`,
      );
      return { status: 'ERROR', sagaId, error: error.message };
    }
  }
}
