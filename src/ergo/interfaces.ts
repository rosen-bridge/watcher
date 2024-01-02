export interface TokenData {
  tokenId: string;
  amount: bigint;
  decimals?: number;
  name?: string;
  isNativeToken?: boolean;
}

export interface AddressBalance {
  nanoErgs: bigint;
  tokens: Array<TokenData>;
}
