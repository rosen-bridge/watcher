import config from 'config';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { SecretError } from '../errors/errors';
import * as Constants from './constants';
import { RosenConfig } from './rosenConfig';
import { cloneDeep } from 'lodash-es';
import path from 'path';
import { NetworkType } from '../types';
import { generateMnemonic } from 'bip39';
import { convertMnemonicToSecretKey } from '../utils/utils';
import { ErgoNetworkType } from '@rosen-bridge/scanner-interfaces';
import { TransportOptions } from '@rosen-bridge/winston-logger';
import { RateLimitedAxiosConfig } from '@rosen-bridge/rate-limited-axios';

const supportedNetworks: Array<NetworkType> = [
  Constants.ERGO_CHAIN_NAME,
  Constants.CARDANO_CHAIN_NAME,
  Constants.BITCOIN_CHAIN_NAME,
  Constants.BITCOIN_RUNES_CHAIN_NAME,
  Constants.DOGE_CHAIN_NAME,
  Constants.ETHEREUM_CHAIN_NAME,
  Constants.BINANCE_CHAIN_NAME,
];

interface ConfigType {
  logger: LoggerConfig;
  cardano: CardanoConfig;
  bitcoin: BitcoinConfig;
  bitcoinRunes: BitcoinRunesConfig;
  ethereum: EthereumConfig;
  binance: BinanceConfig;
  doge: DogeConfig;
  general: Config;
  rosen: RosenConfig;
  database: DatabaseConfig;
  healthCheck: HealthCheckConfig;
  notification: NotificationConfig;
}

interface ConnectionConfig {
  url: string;
  timeout: number;
  username?: string;
  password?: string;
}

const getRequiredNumber = (path: string) => {
  if (!config.has(path)) {
    throw new Error(`ImproperlyConfigured. ${path} is not defined`);
  }
  const value = config.get<number>(path);
  if (isNaN(value)) {
    throw new Error(`ImproperlyConfigured. ${path} is not a number`);
  }
  return value;
};

const getOptionalNumber = (path: string, defaultValue: number) => {
  if (config.has(path)) {
    const value = config.get<number>(path);
    if (isNaN(value)) {
      throw new Error(`ImproperlyConfigured. ${path} is not a number`);
    }
    return value;
  }
  return defaultValue;
};

const getOptionalNumberWithoutDefault = (path: string) => {
  if (config.has(path)) {
    const value = config.get<number>(path);
    if (isNaN(value)) {
      throw new Error(`ImproperlyConfigured. ${path} is not a number`);
    }
    return value;
  }
  return undefined;
};

const getRequiredString = (path: string) => {
  if (!config.has(path)) {
    throw new Error(`ImproperlyConfigured. ${path} is not defined`);
  }
  return config.get<string>(path);
};

const getOptionalString = (path: string, defaultValue = '') => {
  if (config.has(path)) {
    return config.get<string>(path);
  }
  return defaultValue;
};

class Config {
  networkPrefix: wasm.NetworkPrefix;
  networkType: string;
  scannerType: ErgoNetworkType;
  secretKey: wasm.SecretKey;
  address: string;
  explorerUrl: string;
  nodeUrl: string;
  nodeTimeout: number;
  explorerTimeout: number;
  ergoInitialHeight: number;
  ergoInterval: number;
  networkWatcher: NetworkType;
  minBoxValue: string;
  fee: string;
  commitmentCreationInterval: number;
  commitmentRedeemInterval: number;
  commitmentRevealInterval: number;
  tokenNameInterval: number;
  revenueInterval: number;
  transactionRemovingTimeout: number;
  transactionConfirmation: number;
  commitmentTimeoutConfirmation: number;
  transactionCheckingInterval: number;
  widStatusCheckInterval: number;
  minimumFeeUpdateInterval: number;
  observationConfirmation: number;
  observationValidThreshold: number;
  rosenConfigPath: string;
  rosenTokensPath: string;
  apiPort: number;
  apiKeyHash: string;
  apiAllowedOrigins: string[];
  rewardCollectionInterval: number;
  rewardCollectionThreshold: number;
  rewardCollectionAddress: string;
  eventTriggerInit: boolean;
  versionInputExtension: boolean;

  constructor() {
    this.networkType = getRequiredString('ergo.network').toLowerCase();
    if (['mainnet', 'testnet'].indexOf(this.networkType) === -1)
      throw new Error(
        "ImproperlyConfigured. ergo.network doesn't set correctly in config file"
      );
    this.networkPrefix =
      this.networkType === 'mainnet'
        ? wasm.NetworkPrefix.Mainnet
        : wasm.NetworkPrefix.Testnet;

    this.scannerType = getRequiredString(
      'ergo.type'
    ).toLowerCase() as ErgoNetworkType;
    if (
      [ErgoNetworkType.Node, ErgoNetworkType.Explorer].indexOf(
        this.scannerType
      ) === -1
    )
      throw new Error(
        "ImproperlyConfigured. ergo.scanner doesn't set correctly in config file"
      );
    const mnemonic = getOptionalString('ergo.mnemonic');
    if (!mnemonic) {
      const secret = getOptionalString('ergo.secret');
      if (secret) {
        this.secretKey = wasm.SecretKey.dlog_from_bytes(
          Uint8Array.from(Buffer.from(secret, 'hex'))
        );
        console.warn(
          `Using secret key is deprecated. Please use mnemonic instead.`
        );
      } else {
        const randomMnemonic = generateMnemonic(160);
        console.warn(
          'ImproperlyConfigured. ergo.mnemonic does not exist in the config.' +
            `You can use {${randomMnemonic}} or generate one by yourself`
        );
        throw new SecretError(
          `ImproperlyConfigured. ergo.mnemonic doesn't set in config file.`
        );
      }
    } else {
      this.secretKey = convertMnemonicToSecretKey(mnemonic);
    }
    this.address = this.secretKey.get_address().to_base58(this.networkPrefix);
    this.explorerUrl = getRequiredString('ergo.explorer.url');
    if (!this.explorerUrl) {
      throw new Error(
        'ImproperlyConfigured. ergo.explorer.url is not set in the config'
      );
    }
    this.explorerTimeout = getRequiredNumber('ergo.explorer.timeout');
    this.nodeUrl = getRequiredString('ergo.node.url');
    if (this.nodeUrl === undefined) {
      throw new Error(
        'ImproperlyConfigured. ergo.node.url is not set in the config'
      );
    }
    this.nodeTimeout = getRequiredNumber('ergo.node.timeout');
    this.ergoInitialHeight = getRequiredNumber('ergo.initialHeight');
    this.ergoInterval = getRequiredNumber('ergo.interval.scanner');
    this.networkWatcher = getRequiredString('network') as NetworkType;
    if (!supportedNetworks.includes(this.networkWatcher)) {
      throw new Error(
        `ImproperlyConfigured. network is invalid, supported networks are [${supportedNetworks.join(
          ','
        )}]`
      );
    }
    this.commitmentCreationInterval = getRequiredNumber(
      'ergo.interval.commitment.creation'
    );
    this.commitmentRedeemInterval = getRequiredNumber(
      'ergo.interval.commitment.redeem'
    );
    this.commitmentRevealInterval = getRequiredNumber(
      'ergo.interval.commitment.reveal'
    );
    this.transactionCheckingInterval = getRequiredNumber(
      'ergo.interval.transaction'
    );
    this.widStatusCheckInterval = getRequiredNumber('ergo.interval.wid.status');
    this.minimumFeeUpdateInterval = getRequiredNumber(
      'ergo.interval.minimumFee'
    );
    this.transactionConfirmation = getRequiredNumber(
      'ergo.transaction.confirmation'
    );
    this.commitmentTimeoutConfirmation = getRequiredNumber(
      'ergo.transaction.commitmentTimeoutConfirmation'
    );
    this.transactionRemovingTimeout = getRequiredNumber(
      'ergo.transaction.timeout'
    );
    this.observationConfirmation = getRequiredNumber(
      'observation.confirmation'
    );
    this.observationValidThreshold = getRequiredNumber(
      'observation.validThreshold'
    );
    this.tokenNameInterval = getRequiredNumber('ergo.interval.tokenName');
    this.revenueInterval = getRequiredNumber('ergo.interval.revenue');
    if (this.ergoInterval <= this.revenueInterval) {
      throw new Error(
        'ImproperlyConfigured. Revenue interval should be less than ErgoScanner interval.'
      );
    }
    // TODO verify bigint
    // https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/34
    this.minBoxValue = getRequiredString('ergo.minBoxValue');
    this.fee = getRequiredString('ergo.fee');
    this.rosenConfigPath = getRequiredString('path.addresses');
    this.rosenTokensPath = getOptionalString(
      'path.tokens',
      path.join(this.rosenConfigPath, 'tokens.json')
    );
    this.apiPort = getOptionalNumber('api.port', 3000);
    this.apiKeyHash = getRequiredString('api.apiKeyHash');
    this.apiAllowedOrigins = config.get<string[]>('api.allowedOrigins');
    if (
      !Array.isArray(this.apiAllowedOrigins) ||
      this.apiAllowedOrigins.some((origin) => typeof origin !== 'string')
    ) {
      throw new Error('ImproperlyConfigured. Api allowed origins is invalid.');
    }
    if (this.apiAllowedOrigins.find((origin) => origin === '*')) {
      console.warn(
        'An allowed origin header with value "*" will cause all origins to be able to request this service, which may cause security issues'
      );
    }
    this.rewardCollectionInterval = getRequiredNumber(
      'rewardCollection.interval'
    );
    this.rewardCollectionThreshold = getRequiredNumber(
      'rewardCollection.threshold'
    );
    this.rewardCollectionAddress = getOptionalString(
      'rewardCollection.address',
      this.address // set default watcher address as reward address if its not specified
    );
    this.eventTriggerInit = config.get<boolean>('initialization.eventTrigger');
    this.versionInputExtension = config.get<boolean>('versionInputExtension');
  }
}

class LoggerConfig {
  transports: TransportOptions[];

  constructor() {
    const logs = config.get<TransportOptions[]>('logs');
    const clonedLogs = cloneDeep(logs);
    const wrongLogTypeIndex = clonedLogs.findIndex((log) => {
      const logTypeValidation = ['console', 'file', 'loki'].includes(log.type);
      let loggerChecks = true;
      if (log.type === 'loki') {
        const overrideLokiBasicAuth = getOptionalString(
          'overrideLokiBasicAuth'
        );
        if (overrideLokiBasicAuth !== '') log.basicAuth = overrideLokiBasicAuth;
        loggerChecks =
          log.host != undefined &&
          typeof log.host === 'string' &&
          log.level != undefined &&
          typeof log.level === 'string' &&
          (log.serviceName ? typeof log.serviceName === 'string' : true) &&
          (log.basicAuth ? typeof log.basicAuth === 'string' : true);
      } else if (log.type === 'file') {
        loggerChecks =
          log.path != undefined &&
          typeof log.path === 'string' &&
          log.level != undefined &&
          typeof log.level === 'string' &&
          log.maxSize != undefined &&
          typeof log.maxSize === 'string' &&
          log.maxFiles != undefined &&
          typeof log.maxFiles === 'string';
      }
      return !(loggerChecks && logTypeValidation);
    });
    if (wrongLogTypeIndex >= 0) {
      throw new Error(
        `unexpected config at path ${`logs[${wrongLogTypeIndex}]`}: ${JSON.stringify(
          logs[wrongLogTypeIndex]
        )}`
      );
    }
    this.transports = clonedLogs;
  }
}

class CardanoConfig {
  type: string;
  ogmios?: {
    host: string;
    port: number;
    initialSlot: number;
    initialHash: string;
    connectionRetrialInterval: number;
    useTls?: boolean;
  };
  koios?: {
    url: string;
    timeout: number;
    initialHeight: number;
    interval: number;
    authToken?: string;
  };
  blockfrost?: {
    url?: string;
    timeout: number;
    initialHeight: number;
    interval: number;
    projectId: string;
  };

  constructor(network: string) {
    this.type = config.get<string>('cardano.type');
    if (network === Constants.CARDANO_CHAIN_NAME) {
      if (this.type === Constants.OGMIOS_TYPE) {
        const host = getRequiredString('cardano.ogmios.host');
        const port = getRequiredNumber('cardano.ogmios.port');
        const initialSlot = getRequiredNumber('cardano.initial.slot');
        const connectionRetrialInterval = getRequiredNumber(
          'cardano.ogmios.connectionRetrialInterval'
        );
        const initialHash = getRequiredString('cardano.initial.hash');
        const useTls = config.get<boolean>('cardano.ogmios.useTls');
        this.ogmios = {
          host,
          port,
          initialHash,
          initialSlot,
          connectionRetrialInterval,
          useTls,
        };
      } else if (this.type === Constants.KOIOS_TYPE) {
        const url = getRequiredString('cardano.koios.url');
        const interval = getRequiredNumber('cardano.koios.interval');
        const timeout = getRequiredNumber('cardano.koios.timeout');
        const initialHeight = getRequiredNumber('cardano.initial.height');
        const authToken = config.has('cardano.koios.authToken')
          ? config.get<string>('cardano.koios.authToken')
          : undefined;
        this.koios = { url, initialHeight, interval, timeout, authToken };
      } else if (this.type === Constants.BLOCK_FROST_TYPE) {
        const url = config.has('cardano.blockfrost.url')
          ? getRequiredString('cardano.blockfrost.url')
          : undefined;
        const interval = getRequiredNumber('cardano.blockfrost.interval');
        const timeout = getRequiredNumber('cardano.blockfrost.timeout');
        const initialHeight = getRequiredNumber('cardano.initial.height');
        const projectId = config.get<string>('cardano.blockfrost.projectId');
        this.blockfrost = { url, timeout, initialHeight, interval, projectId };
      } else {
        throw new Error(
          `Improperly configured. cardano configuration type is invalid available choices are '${Constants.OGMIOS_TYPE}', '${Constants.KOIOS_TYPE}'`
        );
      }
    }
  }
}

class BitcoinConfig {
  type: string;
  initialHeight: number;
  interval: number;
  esplora?: {
    url: string;
    timeout: number;
  };
  rpc?: {
    url: string;
    timeout: number;
    username?: string;
    password?: string;
  };

  constructor(network: string) {
    this.type = config.get<string>('bitcoin.type');
    if (
      network === Constants.BITCOIN_CHAIN_NAME ||
      network === Constants.BITCOIN_RUNES_CHAIN_NAME
    ) {
      this.initialHeight = getRequiredNumber('bitcoin.initial.height');
      this.interval = getRequiredNumber('bitcoin.interval');
      if (this.type === Constants.ESPLORA_TYPE) {
        const url = getRequiredString('bitcoin.esplora.url');
        const timeout = getRequiredNumber('bitcoin.esplora.timeout');
        this.esplora = { url, timeout };
      } else if (this.type == Constants.RPC_TYPE) {
        const url = getRequiredString('bitcoin.rpc.url');
        const timeout = getRequiredNumber('bitcoin.rpc.timeout');
        const username = getOptionalString('bitcoin.rpc.username', undefined);
        const password = getOptionalString('bitcoin.rpc.password', undefined);
        this.rpc = { url, timeout, username, password };
      } else {
        throw new Error(
          `Improperly configured. bitcoin configuration type is invalid available choices are '${Constants.ESPLORA_TYPE}'`
        );
      }
    }
  }
}

class BitcoinRunesConfig {
  ordiscan: {
    url: string;
    apiKey: string;
  };

  constructor(network: string) {
    if (network === Constants.BITCOIN_RUNES_CHAIN_NAME) {
      this.ordiscan = {
        url: getRequiredString('bitcoinRunes.ordiscan.url'),
        apiKey: getRequiredString('bitcoinRunes.ordiscan.apiKey'),
      };
    }
  }
}

class DogeConfig {
  type: string;
  initialHeight: number;
  interval: number;
  esplora: ConnectionConfig[];
  rpc: ConnectionConfig[];

  constructor(network: string) {
    this.type = config.get<string>('doge.type');
    if (network === Constants.DOGE_CHAIN_NAME) {
      this.initialHeight = getRequiredNumber('doge.initial.height');
      this.interval = getRequiredNumber('doge.interval');

      if (this.type === Constants.ESPLORA_TYPE) {
        const esploraConfigs = config.get<ConnectionConfig[]>('doge.esplora');
        if (!Array.isArray(esploraConfigs) || esploraConfigs.length === 0) {
          throw new Error(
            'Improperly configured. doge.esplora must be a non-empty array'
          );
        }
        esploraConfigs.forEach((esploraConfig) => {
          if (!esploraConfig.url) {
            throw new Error(
              'Improperly configured. doge.esplora.url must be a non-empty string'
            );
          }
          if (!esploraConfig.timeout) {
            throw new Error(
              'Improperly configured. doge.esplora.timeout must be a non-empty number'
            );
          }
        });
        this.esplora = esploraConfigs;
      } else if (this.type === Constants.RPC_TYPE) {
        const rpcConfigs = config.get<ConnectionConfig[]>('doge.rpc');
        if (!Array.isArray(rpcConfigs) || rpcConfigs.length === 0) {
          throw new Error(
            'Improperly configured. doge.rpc must be a non-empty array'
          );
        }
        rpcConfigs.forEach((rpcConfig) => {
          if (!rpcConfig.url) {
            throw new Error(
              'Improperly configured. doge.rpc.url must be a non-empty string'
            );
          }
          if (!rpcConfig.timeout) {
            throw new Error(
              'Improperly configured. doge.rpc.timeout must be a non-empty number'
            );
          }
          RateLimitedAxiosConfig.addRule(`^${rpcConfig.url}$`, 3, 1);
        });
        this.rpc = rpcConfigs;
      } else {
        throw new Error(
          `Improperly configured. doge configuration type is invalid available choices are '${Constants.ESPLORA_TYPE}', '${Constants.RPC_TYPE}'`
        );
      }
    }
  }
}

class EthereumConfig {
  type: string;
  initialHeight: number;
  interval: number;
  rpc?: {
    url: string;
    timeout: number;
    authToken?: string;
  };

  constructor(network: string) {
    this.type = config.get<string>('ethereum.type');
    if (network === Constants.ETHEREUM_CHAIN_NAME) {
      this.initialHeight = getRequiredNumber('ethereum.initial.height');
      this.interval = getRequiredNumber('ethereum.interval');
      if (this.type == Constants.EVM_RPC_TYPE) {
        const url = getRequiredString('ethereum.rpc.url');
        const timeout = getRequiredNumber('ethereum.rpc.timeout');
        const authToken = getOptionalString(
          'ethereum.rpc.authToken',
          undefined
        );
        this.rpc = { url, timeout, authToken };
      } else {
        throw new Error(
          `Improperly configured. ethereum configuration type is invalid available choices are '${Constants.EVM_RPC_TYPE}'`
        );
      }
    }
  }
}

class BinanceConfig {
  type: string;
  initialHeight: number;
  interval: number;
  rpc?: {
    url: string;
    timeout: number;
    authToken?: string;
  };

  constructor(network: string) {
    this.type = config.get<string>('binance.type');
    if (network === Constants.BINANCE_CHAIN_NAME) {
      this.initialHeight = getRequiredNumber('binance.initial.height');
      this.interval = getRequiredNumber('binance.interval');
      if (this.type == Constants.EVM_RPC_TYPE) {
        const url = getRequiredString('binance.rpc.url');
        const timeout = getRequiredNumber('binance.rpc.timeout');
        const authToken = getOptionalString('binance.rpc.authToken', undefined);
        this.rpc = { url, timeout, authToken };
      } else {
        throw new Error(
          `Improperly configured. binance configuration type is invalid available choices are '${Constants.EVM_RPC_TYPE}'`
        );
      }
    }
  }
}

class DatabaseConfig {
  type: string;
  path = '';
  host = '';
  port = 0;
  user = '';
  password = '';
  name = '';

  constructor() {
    this.type = getRequiredString('database.type');
    if (this.type === 'sqlite') {
      this.path = getRequiredString('database.path');
    } else if (this.type === 'postgres') {
      this.host = getRequiredString('database.host');
      this.port = getRequiredNumber('database.port');
      this.user = getRequiredString('database.user');
      this.password = getRequiredString('database.password');
      this.name = getRequiredString('database.name');
    } else {
      throw new Error(
        `Improperly configured. database configuration type is invalid available choices are 'sqlite', 'postgres'`
      );
    }
  }
}

class NotificationConfig {
  discordWebHookUrl: string;
  historyCleanupTimeout?: number;
  hasBeenUnstableForAWhileWindowDuration?: number;
  hasBeenUnknownForAWhileWindowDuration?: number;
  isStillUnhealthyWindowDuration?: number;

  constructor() {
    this.discordWebHookUrl = getOptionalString(
      'notification.discordWebhookUrl'
    );
    this.historyCleanupTimeout = getOptionalNumberWithoutDefault(
      'notification.historyCleanupTimeout'
    );
    this.hasBeenUnstableForAWhileWindowDuration =
      getOptionalNumberWithoutDefault(
        'notification.windowDurations.hasBeenUnstableForAWhile'
      );
    this.hasBeenUnknownForAWhileWindowDuration =
      getOptionalNumberWithoutDefault(
        'notification.windowDurations.hasBeenUnknownForAWhile'
      );
    this.isStillUnhealthyWindowDuration = getOptionalNumberWithoutDefault(
      'notification.windowDurations.isStillUnhealthy'
    );
  }
}

class HealthCheckConfig {
  ergWarnThreshold: bigint;
  ergCriticalThreshold: bigint;
  ergoScannerWarnDiff: number;
  ergoScannerCriticalDiff: number;
  cardanoScannerWarnDiff: number;
  cardanoScannerCriticalDiff: number;
  bitcoinScannerWarnDiff: number;
  bitcoinScannerCriticalDiff: number;
  dogeScannerWarnDiff: number;
  dogeScannerCriticalDiff: number;
  ethereumScannerWarnDiff: number;
  ethereumScannerCriticalDiff: number;
  binanceScannerWarnDiff: number;
  binanceScannerCriticalDiff: number;
  ergoNodeMaxHeightDiff: number;
  ergoNodeMaxBlockTime: number;
  ergoNodeMinPeerCount: number;
  ergoNodeMaxPeerHeightDifference: number;
  permitWarnCommitmentCount: number;
  permitCriticalCommitmentCount: number;
  permitDefaultCommitmentRWT: number;
  updateInterval: number;
  logDuration: number;
  errorLogAllowedCount: number;
  warnLogAllowedCount: number;

  constructor() {
    this.ergWarnThreshold = BigInt(
      getRequiredString('healthCheck.asset.ergWarnThreshold')
    );
    this.ergCriticalThreshold = BigInt(
      getRequiredString('healthCheck.asset.ergCriticalThreshold')
    );
    this.ergoScannerWarnDiff = getRequiredNumber(
      'healthCheck.ergoScanner.warnDifference'
    );
    this.ergoScannerCriticalDiff = getRequiredNumber(
      'healthCheck.ergoScanner.criticalDifference'
    );
    this.ergoNodeMaxHeightDiff = getRequiredNumber(
      'healthCheck.ergoNode.maxHeightDifference'
    );
    this.ergoNodeMaxBlockTime = getRequiredNumber(
      'healthCheck.ergoNode.maxBlockTime'
    );
    this.ergoNodeMinPeerCount = getRequiredNumber(
      'healthCheck.ergoNode.minPeerCount'
    );
    this.ergoNodeMaxPeerHeightDifference = getRequiredNumber(
      'healthCheck.ergoNode.maxPeerHeightDifference'
    );
    this.cardanoScannerWarnDiff = getRequiredNumber(
      'healthCheck.cardanoScanner.warnDifference'
    );
    this.cardanoScannerCriticalDiff = getRequiredNumber(
      'healthCheck.cardanoScanner.criticalDifference'
    );
    this.bitcoinScannerWarnDiff = getRequiredNumber(
      'healthCheck.bitcoinScanner.warnDifference'
    );
    this.bitcoinScannerCriticalDiff = getRequiredNumber(
      'healthCheck.bitcoinScanner.criticalDifference'
    );
    this.dogeScannerWarnDiff = getRequiredNumber(
      'healthCheck.dogeScanner.warnDifference'
    );
    this.dogeScannerCriticalDiff = getRequiredNumber(
      'healthCheck.dogeScanner.criticalDifference'
    );
    this.ethereumScannerWarnDiff = getRequiredNumber(
      'healthCheck.ethereumScanner.warnDifference'
    );
    this.ethereumScannerCriticalDiff = getRequiredNumber(
      'healthCheck.ethereumScanner.criticalDifference'
    );
    this.binanceScannerWarnDiff = getRequiredNumber(
      'healthCheck.binanceScanner.warnDifference'
    );
    this.binanceScannerCriticalDiff = getRequiredNumber(
      'healthCheck.binanceScanner.criticalDifference'
    );
    this.permitWarnCommitmentCount = getRequiredNumber(
      'healthCheck.permit.warnCommitmentCount'
    );
    this.permitCriticalCommitmentCount = getRequiredNumber(
      'healthCheck.permit.criticalCommitmentCount'
    );
    this.updateInterval = getRequiredNumber('healthCheck.interval');
    this.logDuration = getRequiredNumber('healthCheck.logs.duration');
    this.errorLogAllowedCount = getRequiredNumber(
      'healthCheck.logs.maxAllowedErrorCount'
    );
    this.warnLogAllowedCount = getRequiredNumber(
      'healthCheck.logs.maxAllowedWarnCount'
    );
  }
}

let internalConfig: ConfigType | undefined;

const getConfig = (): ConfigType => {
  if (internalConfig == undefined) {
    const general = new Config();
    const logger = new LoggerConfig();
    const cardano = new CardanoConfig(general.networkWatcher);
    const bitcoin = new BitcoinConfig(general.networkWatcher);
    const bitcoinRunes = new BitcoinRunesConfig(general.networkWatcher);
    const doge = new DogeConfig(general.networkWatcher);
    const ethereum = new EthereumConfig(general.networkWatcher);
    const binance = new BinanceConfig(general.networkWatcher);
    const rosen = new RosenConfig(
      general.networkWatcher,
      general.networkType,
      general.rosenConfigPath
    );
    const database = new DatabaseConfig();
    const healthCheck = new HealthCheckConfig();
    const notification = new NotificationConfig();
    internalConfig = {
      cardano,
      bitcoin,
      bitcoinRunes,
      doge,
      ethereum,
      binance,
      logger,
      general,
      rosen,
      database,
      healthCheck,
      notification,
    };
  }
  return internalConfig;
};

export {
  getConfig,
  Config,
  RosenConfig,
  CardanoConfig,
  BitcoinConfig,
  BitcoinRunesConfig,
  EthereumConfig,
  BinanceConfig,
  DogeConfig,
};
