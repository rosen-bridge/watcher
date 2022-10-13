import config from 'config';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { SecretError } from '../errors/errors';

const NETWORK_TYPE: string | undefined = config.get?.('ergo.networkType');
const SECRET_KEY: string | undefined = config.get?.('ergo.watcherSecretKey');
const URL: string | undefined = config.get?.('cardano.node.URL');
const CARDANO_INTERVAL: number | undefined = config.get?.('cardano.interval');
const CARDANO_INITIAL_HEIGHT: number | undefined = config.get?.(
  'cardano.initialBlockHeight'
);
const ERGO_INITIAL_HEIGHT: number | undefined = config.get?.(
  'ergo.scanner.initialBlockHeight'
);
const ERGO_INTERVAL: number | undefined = config.get?.('ergo.scanner.interval');
const EXPLORER_URL: string | undefined = config.get?.('ergo.explorerUrl');
const NODE_URL: string | undefined = config.get?.('ergo.nodeUrl');
const CARDANO_TIMEOUT: number | undefined = config.get?.('cardano.timeout');
const ERGO_EXPLORER_TIMEOUT: number | undefined = config.get?.(
  'ergo.explorerTimeout'
);
const ERGO_NODE_TIMEOUT: number | undefined = config.get?.('ergo.nodeTimeout');
const NETWORK_WATCHER: string | undefined = config.get?.('network');
const NETWORK_WATCHER_TYPE: string | undefined = config.get?.('networkType');
const MIN_BOX_VALUE: string | undefined = config.get?.('minBoxValue');
const FEE: string | undefined = config.get?.('fee');
const COMMITMENT_CREATION_INTERVAL: number | undefined = config.get?.(
  'ergo.commitmentCreationInterval'
);
const COMMITMENT_REVEAL_INTERVAL: number | undefined = config.get?.(
  'ergo.commitmentRevealInterval'
);
const TRANSACTION_CHECK_INTERVAL: number | undefined = config.get?.(
  'ergo.transactions.interval'
);
const TRANSACTION_REMOVING_TIMEOUT: number | undefined = config.get?.(
  'ergo.transactions.timeout'
);
const TRANSACTION_CONFIRMATION: number | undefined = config.get?.(
  'ergo.transactions.confirmation'
);
const OBSERVATION_CONFIRMATION: number | undefined = config.get?.(
  'observation.confirmation'
);
const OBSERVATION_VALID_THRESH: number | undefined = config.get?.(
  'observation.validThreshold'
);
const supportedNetworks: Array<string> = ['ergo-node', 'cardano-koios'];
const ROSEN_CONFIG_PATH: string | undefined =
  config.get<string>('rosenConfigPath');
const ROSEN_TOKENS_PATH: string | undefined =
  config.get<string>('rosenTokensPath');
const LOGS_PATH: string | undefined = config.get<string>('logs.path');
const LOGS_LEVEL: string | undefined = config.get<string>('logs.level');
const LOGS_MAX_SIZE: string | undefined = config.get<string>('logs.maxSize');
const LOGS_MAX_FILES: string | undefined = config.get<string>('logs.maxFiles');

class Config {
  private static instance: Config;
  networkType: wasm.NetworkPrefix;
  secretKey: wasm.SecretKey;
  address: string;
  explorerUrl: string;
  nodeUrl: string;
  nodeTimeout: number;
  explorerTimeout: number;
  ergoInitialHeight: number;
  ergoInterval: number;
  networkWatcher: string;
  networkWatcherType: string;
  minBoxValue: string;
  fee: string;
  commitmentCreationInterval: number;
  commitmentRevealInterval: number;
  transactionRemovingTimeout: number;
  transactionConfirmation: number;
  transactionCheckingInterval: number;
  observationConfirmation: number;
  observationValidThreshold: number;
  rosenConfigPath: string;
  rosenTokensPath: string;
  logPath: string;
  logLevel: string;
  logMaxSize: string;
  logMaxFiles: string;

  private constructor() {
    let networkType: wasm.NetworkPrefix = wasm.NetworkPrefix.Testnet;
    switch (NETWORK_TYPE) {
      case 'Mainnet': {
        networkType = wasm.NetworkPrefix.Mainnet;
        break;
      }
      case 'Testnet': {
        break;
      }
      default: {
        throw new Error("Network type doesn't set correctly in config file");
      }
    }

    if (SECRET_KEY === undefined || SECRET_KEY === '') {
      throw new SecretError("Secret key doesn't set in config file");
    }
    if (EXPLORER_URL === undefined) {
      throw new Error('Ergo Explorer Url is not set in the config');
    }
    if (NODE_URL === undefined) {
      throw new Error('Ergo Node Url is not set in the config');
    }
    if (ERGO_INITIAL_HEIGHT === undefined) {
      throw new Error("Ergo scanner initial height doesn't set correctly");
    }
    if (!ERGO_INTERVAL) {
      throw new Error("Ergo scanner interval doesn't set correctly");
    }
    if (ERGO_EXPLORER_TIMEOUT === undefined) {
      throw new Error("Ergo explorer timeout doesn't set correctly");
    }
    if (ERGO_NODE_TIMEOUT === undefined) {
      throw new Error("Ergo node timeout doesn't set correctly");
    }
    if (!NETWORK_WATCHER || !supportedNetworks.includes(NETWORK_WATCHER)) {
      throw new Error('Watching Bridge is not set correctly');
    }
    if (NETWORK_WATCHER_TYPE === undefined) {
      throw new Error('Network watcher type is not set correctly');
    }
    if (!COMMITMENT_CREATION_INTERVAL) {
      throw new Error('Commitment creation job interval is not set');
    }
    if (!COMMITMENT_REVEAL_INTERVAL) {
      throw new Error('Commitment reveal job interval is not set');
    }
    if (!TRANSACTION_CHECK_INTERVAL) {
      throw new Error('Transaction checking job interval is not set');
    }
    if (!TRANSACTION_CONFIRMATION) {
      throw new Error("Ergo transaction confirmation doesn't set correctly");
    }
    if (!TRANSACTION_REMOVING_TIMEOUT) {
      throw new Error("Ergo transaction timeout doesn't set correctly");
    }
    if (!OBSERVATION_CONFIRMATION) {
      throw new Error("Watcher observation confirmation doesn't set correctly");
    }
    if (!OBSERVATION_VALID_THRESH) {
      throw new Error("Watcher observation valid thresh doesn't set correctly");
    }
    if (MIN_BOX_VALUE === undefined) {
      throw new Error("Watcher min box value doesn't set correctly");
    }
    if (FEE === undefined) {
      throw new Error("Watcher Fee doesn't set correctly");
    }
    if (ROSEN_CONFIG_PATH === undefined) {
      throw new Error("RosenConfig file path doesn't set correctly");
    }
    if (ROSEN_TOKENS_PATH === undefined) {
      throw new Error("Rosen Tokens file path doesn't set correctly");
    }
    if (
      LOGS_PATH === undefined ||
      LOGS_LEVEL === undefined ||
      LOGS_MAX_SIZE === undefined ||
      LOGS_MAX_FILES === undefined
    ) {
      throw new Error("Log configs doesn't set correctly");
    }

    const secretKey = wasm.SecretKey.dlog_from_bytes(
      Buffer.from(SECRET_KEY, 'hex')
    );
    const watcherAddress: string = secretKey
      .get_address()
      .to_base58(networkType);

    this.networkType = networkType;
    this.secretKey = secretKey;
    this.address = watcherAddress;
    this.explorerUrl = EXPLORER_URL;
    this.nodeUrl = NODE_URL;
    this.explorerTimeout = ERGO_EXPLORER_TIMEOUT;
    this.nodeTimeout = ERGO_NODE_TIMEOUT;
    this.networkWatcher = NETWORK_WATCHER;
    this.networkWatcherType = NETWORK_WATCHER_TYPE;
    this.commitmentCreationInterval = COMMITMENT_CREATION_INTERVAL;
    this.commitmentRevealInterval = COMMITMENT_REVEAL_INTERVAL;
    this.transactionCheckingInterval = TRANSACTION_CHECK_INTERVAL;
    this.transactionConfirmation = TRANSACTION_CONFIRMATION;
    this.transactionRemovingTimeout = TRANSACTION_REMOVING_TIMEOUT;
    this.observationConfirmation = OBSERVATION_CONFIRMATION;
    this.observationValidThreshold = OBSERVATION_VALID_THRESH;
    this.ergoInitialHeight = ERGO_INITIAL_HEIGHT;
    this.ergoInterval = ERGO_INTERVAL;
    this.minBoxValue = MIN_BOX_VALUE;
    this.fee = FEE;
    this.rosenConfigPath = ROSEN_CONFIG_PATH;
    this.rosenTokensPath = ROSEN_TOKENS_PATH;
    this.logPath = LOGS_PATH;
    this.logLevel = LOGS_LEVEL;
    this.logMaxSize = LOGS_MAX_SIZE;
    this.logMaxFiles = LOGS_MAX_FILES;
  }

  static getConfig() {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}

class CardanoConfig {
  private static instance: CardanoConfig;
  koiosURL: string;
  interval: number;
  timeout: number;
  initialHeight: number;

  private constructor() {
    if (URL === undefined) {
      throw new Error('koios URL is not set config file');
    }
    if (CARDANO_INTERVAL === undefined) {
      throw new Error('Cardano Scanner interval is not set in the config file');
    }
    if (CARDANO_INITIAL_HEIGHT === undefined) {
      throw new Error(
        'Cardano Scanner initial height is not set in the config file'
      );
    }
    if (CARDANO_TIMEOUT === undefined) {
      throw new Error("Cardano network timeout doesn't set correctly");
    }

    this.koiosURL = URL;
    this.interval = CARDANO_INTERVAL;
    this.timeout = CARDANO_TIMEOUT;
    this.initialHeight = CARDANO_INITIAL_HEIGHT;
  }

  static getConfig() {
    if (!CardanoConfig.instance) {
      CardanoConfig.instance = new CardanoConfig();
    }
    return CardanoConfig.instance;
  }
}

export { Config, CardanoConfig };
