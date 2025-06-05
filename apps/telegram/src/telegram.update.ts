import { Update, Ctx, Start, Help, On, Hears } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { TelegramService } from './telegram.service';
import { Inject } from '@nestjs/common';
import { ORDER_SERVICE } from './constants';
import { ClientProxy } from '@nestjs/microservices';

@Update()
export class AppUpdate {
  constructor(
    private readonly telegramService: TelegramService,
    @Inject(ORDER_SERVICE) private orderClient: ClientProxy,
  ) {}
  @Start()
  async start(@Ctx() ctx: Context) {
    const inline_keyboard = Markup.keyboard([
      [{ text: 'Place order' }],
    ]).resize();
    await ctx.reply('Welcome', { reply_markup: inline_keyboard.reply_markup });
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply('Send me a sticker');
  }
  @Hears('Place order')
  async onCallbackQuery(@Ctx() ctx: Context) {
    console.log('Callback query received:', ctx);
    const obs = this.orderClient.emit('place_order', {
      chatId: ctx.chat!.id.toString(),
      message: 'Order placed successfully!',
    });

    obs.subscribe({
      next: (response) => {
        console.log('Order placed successfully:', response);
        ctx.reply('Your order has been placed successfully!');
      },
      error: (err) => {
        console.error('Error placing order:', err);
        ctx.reply('Failed to place your order. Please try again later.');
      },
    });
    // const callbackQuery = ctx.callbackQuery;
    // if (callbackQuery.data === 'place_order') {
    //   await ctx.answerCbQuery('Order placed successfully!');
    //   await ctx.reply('Your order has been placed.');
    // } else {
    //   await ctx.answerCbQuery('Unknown action');
    // }
  }

  @On('sticker')
  async on(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Hears('hi')
  async hears(@Ctx() ctx: Context) {
    const message = await this.telegramService.sendMessage(
      '12345',
      'Hello from Telegraf!',
      ctx.chat!.id.toString(), // Ensure chatId is a string
    );
    await ctx.reply(
      message.status === 'SUCCESS' ? 'Message sent!' : 'Failed to send message',
    );
  }
}
