import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  private readonly logger = new Logger(RmqService.name);

  constructor(private readonly configService: ConfigService) {}

  getOptions(queue: string, noAck = false): RmqOptions {
    console.log(
      `RmqService.getOptions called with queue: ${queue}, noAck: ${noAck}`,
    );
    const queueName = this.configService.get<string>(
      `RABBIT_MQ_${queue}_QUEUE`,
    );
    const rabbitUrl =
      this.configService.get<string>('RABBIT_MQ_URI') || 'amqp://localhost';

    this.logger.log(`Queue lookup: RABBIT_MQ_${queue}_QUEUE = ${queueName}`);
    this.logger.log(`RabbitMQ URL: ${rabbitUrl}`);

    if (!queueName) {
      throw new Error(`Queue name not found for RABBIT_MQ_${queue}_QUEUE`);
    }

    return {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitUrl],
        queue: queueName,
        noAck,
        persistent: true,
      },
    };
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }
}
