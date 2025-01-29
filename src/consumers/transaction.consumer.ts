import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  createDefaultRpcTransport,
  createJsonRpcApi,
  createRpc,
  Rpc,
  createSolanaRpc,
  SolanaRpcApi,
  signature,
} from '@solana/web3.js';
import { ConfigService } from '@nestjs/config';
import { GetAssetApi, MetaplexDASApi } from '../types/solana.types';
import { TelegramService } from 'src/telegram/telegram.service';

@Processor('transaction-queue')
export class TransactionConsumer extends WorkerHost {
  private readonly logger = new Logger(TransactionConsumer.name);
  private readonly metaplexDASRpc: Rpc<GetAssetApi>;
  private rpcConnection: Rpc<SolanaRpcApi>;

  constructor(
    private configService: ConfigService,
    private telegramService: TelegramService,
  ) {
    super();

    const api = createJsonRpcApi<MetaplexDASApi>();
    const transport = createDefaultRpcTransport({
      url: this.configService.getOrThrow<string>('METAPLEX_DAS_URL'),
    });
    const solanaRpcUrl =
      this.configService.getOrThrow<string>('SOLANA_RPC_URL');

    this.metaplexDASRpc = createRpc({ api, transport });
    this.rpcConnection = createSolanaRpc(solanaRpcUrl);
  }

  async process(job: Job<{ txId: string }>): Promise<any> {
    const { txId } = job.data;

    try {
      this.logger.log(`Processing transaction: ${txId}`);

      const transaction = await this.rpcConnection
        .getTransaction(signature(txId), {
          commitment: 'confirmed',
          encoding: 'jsonParsed',
          maxSupportedTransactionVersion: 0,
        })
        .send();

      if (!transaction) {
        this.logger.warn(`Transaction ${txId} not found`);
        return;
      }

      const contractAddress =
        transaction.transaction.message.accountKeys[1]?.pubkey;
      if (!contractAddress) {
        this.logger.warn(`No contract address found in transaction: ${txId}`);
        return;
      }

      this.logger.log(`New token contract detected: ${contractAddress}`);

      const asset = await this.metaplexDASRpc.getAsset(contractAddress).send();

      // TODO: filter nfts
      if (asset.result && asset.result.token_info) {
        this.logger.log(
          `Token Info: ${JSON.stringify(asset.result.token_info)}`,
        );

        const message =
          `🚀 *Новый токен найден!*\n\n` +
          `🚀 *${asset.result.content.metadata.symbol} | ${asset.result.content.metadata.name}*\n\n` +
          `📍 *Адрес:* \`${contractAddress}\`\n` +
          `[🔗 Посмотреть в explorer](https://solscan.io/account/${contractAddress})`;

        await this.telegramService.sendMessage(message);
      } else {
        this.logger.warn(
          `No token metadata found for contract: ${contractAddress}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing transaction ${txId}`, error);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`Failed ${job.id}`);
  }
}
