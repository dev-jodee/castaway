export const NETWORK_RPC_URLS = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  testnet: "https://api.testnet.solana.com",
  devnet: "https://api.devnet.solana.com",
} as const;

export type Network = keyof typeof NETWORK_RPC_URLS;

export const DEFAULT_NETWORK: Network = "mainnet-beta";
export const DEFAULT_RPC_URL: string = NETWORK_RPC_URLS[DEFAULT_NETWORK];

export function isNetwork(value: unknown): value is Network {
  return typeof value === "string" && value in NETWORK_RPC_URLS;
}

export function normalizeNetwork(value: string | null | undefined): Network {
  return isNetwork(value) ? value : DEFAULT_NETWORK;
}

export function getNetworkRpcUrl(network: Network): string {
  return NETWORK_RPC_URLS[network];
}

export function getNetworkFromSearchParams(params: URLSearchParams): Network {
  return normalizeNetwork(params.get("network"));
}
