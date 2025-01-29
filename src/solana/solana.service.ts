import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createSolanaRpcSubscriptions,
  RpcSubscriptions,
  SolanaRpcSubscriptionsApi,
  address,
} from '@solana/web3.js';
import { Queue } from 'bullmq';

@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private readonly wssConnection: RpcSubscriptions<SolanaRpcSubscriptionsApi>;

  constructor(
    @InjectQueue('transaction-queue') private transactionQueue: Queue,
    private configService: ConfigService,
  ) {
    const solanaWssUrl =
      this.configService.getOrThrow<string>('SOLANA_WSS_URL');

    this.wssConnection = createSolanaRpcSubscriptions(solanaWssUrl);
  }

  async onModuleInit() {
    this.logger.log('Initializing Solana contract monitoring...');
    await this.monitorNewContracts();
  }

  private async monitorNewContracts(): Promise<void> {
    try {
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const subscription = await this.wssConnection
        .logsNotifications(
          {
            // mentions: [address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')],
            mentions: [address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')],
          },
          { commitment: 'confirmed' },
        )
        .subscribe({ abortSignal });

      for await (const notification of subscription) {
        if (
          notification.value.logs?.includes(
            'Program log: Instruction: InitializeMint2',
          ) ||
          notification.value.logs?.includes(
            'Program log: Instruction: InitializeMint',
          )
        ) {
          const txId = notification.value.signature;
          this.logger.log(`New token transaction detected: ${txId}`);

          await this.transactionQueue.add('process-transaction', { txId });
        }
      }
    } catch (error) {
      this.logger.error('Error in monitorNewContracts', error);
    }
  }
}
