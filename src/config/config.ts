import config from 'config';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { SecretError } from '../errors/errors';
import { uint8ArrayToHex } from '../utils/utils';
import * as Constants from './constants';
import { RosenConfig } from './rosenConfig';
import { TokensConfig } from './tokensConfig';
import { RosenTokens } from '@rosen-bridge/tokens';
import path from 'path';
import { NetworkType } from '../types';

const supportedNetworks: Array<NetworkType> = [
  Constants.ERGO_WATCHER,
  Constants.CARDANO_WATCHER,
];

interface ConfigType {
  logger: LoggerConfig;
  cardano: CardanoConfig;
  general: Config;
  rosen: RosenConfig;
  token: RosenTokens;
  database: DatabaseConfig;
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
  transactionRemovingTimeout: number;
  transactionConfirmation: number;
  commitmentRedeemConfirmation: number;
  transactionCheckingInterval: number;
  observationConfirmation: number;
  observationValidThreshold: number;
  rosenConfigPath: string;
  rosenTokensPath: string;
  apiPort: number;

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
    const secret = getOptionalString('ergo.secret');
    if (!secret) {
      const secretKey = wasm.SecretKey.random_dlog();
      console.warn(
        'ImproperlyConfigured. ergo.secret key does not exist in the config.' +
          `you can use {${uint8ArrayToHex(
            secretKey.to_bytes()
          ).toString()}} or generate one by yourself`
      );
      throw new SecretError(
        `ImproperlyConfigured. ergo.secret doesn't set in config file.`
      );
    }
    this.secretKey = wasm.SecretKey.dlog_from_bytes(Buffer.from(secret, 'hex'));
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
    this.ergoInitialHeight = getRequiredNumber('ergo.node.initialHeight');
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
    this.transactionConfirmation = getRequiredNumber(
      'ergo.transaction.confirmation'
    );
    this.commitmentRedeemConfirmation = getRequiredNumber(
      'ergo.transaction.redeemConfirmation'
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
  }
}

class LoggerConfig {
  path: string;
  level: string;
  maxSize: string;
  maxFiles: string;
  datePattern: string;

  constructor() {
    this.path = getRequiredString('logs.path');
    this.level = getRequiredString('logs.level');
    this.maxSize = getRequiredString('logs.maxSize');
    this.maxFiles = getRequiredString('logs.maxFiles');
    this.datePattern = getOptionalString(
      'logs.datePattern',
      this.level === 'debug' ? 'YYYY-MM-DD-HH' : 'YYYY-MM-DD'
    );
  }
}

class CardanoConfig {
  type: string;
  ogmios?: {
    ip: string;
    port: number;
    initialSlot: number;
    initialHash: string;
  };
  koios?: {
    url: string;
    timeout: number;
    initialHeight: number;
    interval: number;
  };

  constructor(network: string) {
    this.type = config.get<string>('cardano.type');
    if (network === Constants.CARDANO_WATCHER) {
      if (this.type === Constants.OGMIOS_TYPE) {
        const ip = getRequiredString('cardano.ogmios.ip');
        const port = getRequiredNumber('cardano.ogmios.port');
        const initialSlot = getRequiredNumber('cardano.initial.slot');
        const initialHash = getRequiredString('cardano.initial.hash');
        this.ogmios = { ip, port, initialHash, initialSlot };
      } else if (this.type === Constants.KOIOS_TYPE) {
        const url = getRequiredString('cardano.koios.url');
        const interval = getRequiredNumber('cardano.koios.interval');
        const timeout = getRequiredNumber('cardano.koios.timeout');
        const initialHeight = getRequiredNumber('cardano.initial.height');
        this.koios = { url, initialHeight, interval, timeout };
      } else {
        throw new Error(
          `Improperly configured. cardano configuration type is invalid available choices are '${Constants.OGMIOS_TYPE}', '${Constants.KOIOS_TYPE}'`
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

let internalConfig: ConfigType | undefined;

const getConfig = (): ConfigType => {
  if (internalConfig == undefined) {
    const general = new Config();
    const logger = new LoggerConfig();
    const cardano = new CardanoConfig(general.networkWatcher);
    const rosen = new RosenConfig(
      general.networkWatcher,
      general.networkType,
      general.rosenConfigPath
    );
    const token = new TokensConfig(general.rosenTokensPath).tokens;
    const database = new DatabaseConfig();
    internalConfig = { cardano, logger, general, rosen, token, database };
  }
  return internalConfig;
};

export { getConfig };
