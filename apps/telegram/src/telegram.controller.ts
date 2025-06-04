import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { RmqService } from '@app/common';
import { TelegramService } from './telegram.service';

@Controller()
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly rmqService: RmqService,
  ) {}

  @EventPattern('send_telegram_message')
  handleSendTelegramMessage(@Payload() data: any, @Ctx() context: RmqContext) {
    this.telegramService.sendMessage(data.sagaId, data.message, '375905624');
    this.rmqService.ack(context);
  }
}
