import { Module } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { TransactionConsumer } from './transaction.consumer';

@Module({
  providers: [TelegramService, TransactionConsumer],
})
export class ConsumersModule {}
