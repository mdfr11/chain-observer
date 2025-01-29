import {
  address,
  Address,
  createDefaultRpcTransport,
  createJsonRpcApi,
  createRpc,
} from '@solana/web3.js';

type GetAssetApiResponse = Readonly<{
  interface: any;
  id: Address;
  content: Readonly<{
    files?: readonly {
      mime?: string;
      uri?: string;
      [key: string]: unknown;
    }[];
    json_uri: string;
    links?: readonly {
      [key: string]: unknown;
    }[];
    metadata: any;
  }>;
  /* ...etc... */
}>;

type GetAssetApi = {
  getAsset(address: Address): GetAssetApiResponse;
};

type MetaplexDASApi = GetAssetApi;

async function getTransaction() {
  const api = createJsonRpcApi<MetaplexDASApi>();

  // Set up an HTTP transport to a server that supports the custom API.
  const transport = createDefaultRpcTransport({
    url: 'https://mainnet.helius-rpc.com/?api-key=bbefa59d-ddb2-4ffe-864a-a8a7a28b2ce4',
  });

  // Create the RPC client.
  const metaplexDASRpc = createRpc({ api, transport });
  // const accountInfo = await this.rpcConnection
  //   .getAccountInfo(address.pubkey, {
  //     commitment: 'confirmed',
  //   })
  //   .send();

  // console.log(accountInfo);

  const asset = await metaplexDASRpc
    .getAsset(address('F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk'))
    .send();

  console.log('fdsgdfsgdf', asset);
}

getTransaction().then((res) => console.log(res));
