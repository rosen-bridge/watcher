import * as Constants from '../config/constants';

type NetworkType =
  | typeof Constants.CARDANO_CHAIN_NAME
  | typeof Constants.ERGO_CHAIN_NAME
  | typeof Constants.BITCOIN_CHAIN_NAME
  | typeof Constants.BITCOIN_RUNES_CHAIN_NAME
  | typeof Constants.DOGE_CHAIN_NAME
  | typeof Constants.ETHEREUM_CHAIN_NAME
  | typeof Constants.BINANCE_CHAIN_NAME
  | typeof Constants.HANDSHAKE_CHAIN_NAME;

export { NetworkType };
