import * as Constants from '../config/constants';

type NetworkType =
  | typeof Constants.CARDANO_CHAIN_NAME
  | typeof Constants.ERGO_CHAIN_NAME;

export { NetworkType };
