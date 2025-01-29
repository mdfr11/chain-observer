import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SolanaModule } from './solana/solana.module';
import { TelegramModule } from './telegram/telegram.module';
import * as Joi from 'joi';
import { ConsumersModule } from './consumers/consumers.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        SOLANA_RPC_URL: Joi.string().uri().required(),
        SOLANA_WSS_URL: Joi.string().uri().required(),
        METAPLEX_DAS_URL: Joi.string().uri().required(),
        REDIS_URL: Joi.string().uri().default('redis://redis:6379'),
        TELEGRAM_BOT_TOKEN: Joi.string().required(),
        TELEGRAM_CHAT_ID: Joi.string().required(),
      }),
    }),
    ConsumersModule,
    SolanaModule,
    TelegramModule,
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.getOrThrow<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
