export interface TokenInterface {
  tokenId: string;
  amount: string;
}

export interface CastReqInterface {
  tokens: TokenInterface[];
  address: string;
}
