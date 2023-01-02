import * as Constants from '../config/constants';

type NetworkType =
  | typeof Constants.CARDANO_WATCHER
  | typeof Constants.ERGO_WATCHER;

export { NetworkType };
