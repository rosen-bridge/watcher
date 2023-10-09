export interface TokenInfo {
  tokenId: string;
  amount: bigint;
  decimals?: number;
  name?: string;
  isNative?: boolean;
}

export interface AddressBalance {
  nanoErgs: bigint;
  tokens: Array<TokenInfo>;
}
