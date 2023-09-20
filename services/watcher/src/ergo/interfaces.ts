export interface TokenInfo {
  tokenId: string;
  amount: bigint;
  decimals?: number;
  name?: string;
}

export interface AddressBalance {
  nanoErgs: bigint;
  tokens: Array<TokenInfo>;
}
