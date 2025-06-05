import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { RmqService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService);
  const rmqService = app.get<RmqService>(RmqService);

  app.connectMicroservice(rmqService.getOptions('ORDERS'));
  console.log('RmqService.getOptions called with ORDERS');
  console.log(rmqService.getOptions('ORDERS'));
  await app.startAllMicroservices();

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
