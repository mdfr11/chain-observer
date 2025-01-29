import { Address } from '@solana/web3.js';

export type GetAssetApiResponse = {
  result: {
    id: Address;
    content: {
      json_uri: string;
      metadata: {
        name: string;
        symbol: string;
        token_standard: any;
      };
    };
    token_info?: {
      decimals: number;
      token_program: Address;
    };
  };
};

export type GetAssetApi = {
  getAsset(address: Address): GetAssetApiResponse;
};

export type MetaplexDASApi = GetAssetApi;
