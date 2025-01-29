import { Module } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { BullModule } from '@nestjs/bullmq';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

@Module({
  providers: [SolanaService],
  imports: [
    BullModule.registerQueue({ name: 'transaction-queue' }),
    BullBoardModule.forFeature({
      name: 'transaction-queue',
      adapter: BullMQAdapter,
    }),
  ],
})
export class SolanaModule {}
