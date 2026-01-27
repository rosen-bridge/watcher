export interface TokenInterface {
  tokenId: string;
  amount: string | bigint;
}

export interface CastReqInterface {
  tokens: TokenInterface[];
  address: string;
}
