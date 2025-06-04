import { NestFactory } from '@nestjs/core';
import { RmqService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Настройка RabbitMQ микросервиса
  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('TELEGRAM'));

  // Запуск микросервисов
  await app.startAllMicroservices();

  // Запуск HTTP сервера (для Telegram webhook или polling)
  await app.listen(3001);

  console.log('Telegram service is running on port 3001');
  console.log('RabbitMQ microservice is connected');
}
bootstrap();
