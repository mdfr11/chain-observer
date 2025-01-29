import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bot: Telegraf;
  private readonly chatId: string;

  constructor(private configService: ConfigService) {
    const botToken =
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.getOrThrow<string>('TELEGRAM_CHAT_ID');

    this.bot = new Telegraf(botToken);
  }

  async sendMessage(message: string): Promise<void> {
    try {
      this.logger.log(`Sending message to Telegram: ${message}`);
      await this.bot.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      this.logger.error('Failed to send Telegram message', error);
    }
  }
}
