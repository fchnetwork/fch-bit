export interface SwapTemplate {
  id: string;
  owner: string;
  onchainAsset: string;
  onchainAccount: string;
  offchainAsset: string;
  offchainAccount: string;
  rate: number;
  state: string;
  chain: Chain;
}

export enum Chain {
  Ethereum,
  Aerum
}