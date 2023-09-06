export interface TokenInfo {
  tokenId: string;
  amount: bigint;
  name?: string;
}

export interface AddressBalance {
  nanoErgs: bigint;
  tokens: Array<TokenInfo>;
}
