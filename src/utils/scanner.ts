import {
  ErgoScanner,
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
  ErgoNetworkType,
  CardanoBlockFrostScanner,
} from '@rosen-bridge/scanner';
import { BitcoinEsploraScanner } from '@rosen-bridge/bitcoin-esplora-scanner';
import { BitcoinRpcScanner } from '@rosen-bridge/bitcoin-rpc-scanner';
import {
  ErgoObservationExtractor,
  CardanoKoiosObservationExtractor,
  CardanoOgmiosObservationExtractor,
  CardanoBlockFrostObservationExtractor,
} from '@rosen-bridge/observation-extractor';
import {
  BitcoinEsploraObservationExtractor,
  BitcoinRpcObservationExtractor,
} from '@rosen-bridge/bitcoin-observation-extractor';
import {
  CommitmentExtractor,
  PermitExtractor,
  EventTriggerExtractor,
  CollateralExtractor,
} from '@rosen-bridge/watcher-data-extractor';
import { ErgoUTXOExtractor } from '@rosen-bridge/address-extractor';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';

import { getConfig } from '../config/config';
import { dataSource } from '../../config/dataSource';
import { DataSource } from 'typeorm';
import * as Constants from '../config/constants';
import { EvmRpcScanner } from '@rosen-bridge/evm-rpc-scanner';
import {
  EthereumRpcObservationExtractor,
  BinanceRpcObservationExtractor,
} from '@rosen-bridge/evm-observation-extractor';
import { TokensConfig } from '../config/tokensConfig';

/**
 * Creates loggers for scanners and extractors
 * @returns loggers object
 */
const createLoggers = () => ({
  commitmentExtractorLogger: CallbackLoggerFactory.getInstance().getLogger(
    'commitment-extractor'
  ),
  eventTriggerExtractorLogger: CallbackLoggerFactory.getInstance().getLogger(
    'event-trigger-extractor'
  ),
  observationExtractorLogger: CallbackLoggerFactory.getInstance().getLogger(
    'observation-extractor'
  ),
  permitExtractorLogger:
    CallbackLoggerFactory.getInstance().getLogger('permit-extractor'),
  plainExtractorLogger:
    CallbackLoggerFactory.getInstance().getLogger('plain-extractor'),
  scannerLogger: CallbackLoggerFactory.getInstance().getLogger('scanner'),
  collateralExtractorLogger: CallbackLoggerFactory.getInstance().getLogger(
    'collateral-extractor'
  ),
});

const loggers = createLoggers();
const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

class CreateScanner {
  private static instance: CreateScanner;
  private static initialized: boolean = false;
  private ergoScanner!: ErgoScanner;
  private observationScanner!:
    | ErgoScanner
    | CardanoKoiosScanner
    | CardanoOgmiosScanner
    | CardanoBlockFrostScanner
    | BitcoinEsploraScanner
    | BitcoinRpcScanner
    | EvmRpcScanner;

  private constructor() {
    // do nothing
  }

  /**
   * initializes scanner with the configuration
   */
  static async init(): Promise<void> {
    if (!CreateScanner.initialized) {
      CreateScanner.instance = new CreateScanner();
      const allConfig = getConfig();
      const {
        general: config,
        rosen: rosenConfig,
        cardano: cardanoConfig,
        bitcoin: bitcoinConfig,
        ethereum: ethereumConfig,
        binance: binanceConfig,
      } = allConfig;

      await CreateScanner.instance.createErgoScanner(config, rosenConfig);
      switch (config.networkWatcher) {
        case Constants.BITCOIN_CHAIN_NAME:
          await CreateScanner.instance.createBitcoinScanner(bitcoinConfig, rosenConfig);
          break;
        case Constants.CARDANO_CHAIN_NAME:
          await CreateScanner.instance.createCardanoScanner(cardanoConfig, rosenConfig);
          break;
        case Constants.ETHEREUM_CHAIN_NAME:
          await CreateScanner.instance.createEthereumScanner(ethereumConfig, rosenConfig);
          break;
        case Constants.BINANCE_CHAIN_NAME:
          await CreateScanner.instance.createBinanceScanner(binanceConfig, rosenConfig);
          break;
      }
      if (!CreateScanner.instance.observationScanner)
        throw Error(
          'Observation scanner initialization failed, check the watcher network to be correct'
        );
      CreateScanner.initialized = true;
    }
  }

  /**
   * returns the scanner instance if initialized
   * @returns scanner instance
   */
  static getInstance(): CreateScanner {
    if (!CreateScanner.initialized) {
      throw new Error('Scanner is not initialized');
    }
    return CreateScanner.instance;
  }

  /**
   * @returns whether scanner is initialized
   */
  static isInitialized(): boolean {
    return CreateScanner.initialized;
  }

  /**
   * @returns the ergo scanner
   */
  getErgoScanner(): ErgoScanner {
    if (!CreateScanner.initialized) {
      throw new Error('Scanner is not initialized');
    }
    return this.ergoScanner;
  }

  /**
   * @returns the observation scanner
   */
  getObservationScanner(): ErgoScanner | CardanoKoiosScanner | CardanoOgmiosScanner | CardanoBlockFrostScanner | BitcoinEsploraScanner | BitcoinRpcScanner | EvmRpcScanner {
    if (!CreateScanner.initialized) {
      throw new Error('Scanner is not initialized');
    }
    return this.observationScanner;
  }

  private createErgoScanner = async (config: any, rosenConfig: any) => {
    let networkUrl;
    let networkTimeout;
    if (config.scannerType === ErgoNetworkType.Node) {
      networkTimeout = config.nodeTimeout * 1000;
      networkUrl = config.nodeUrl;
    } else if (config.scannerType === ErgoNetworkType.Explorer) {
      networkUrl = config.explorerUrl;
      networkTimeout = config.explorerTimeout * 1000;
    } else {
      logger.error(
        `Scanner type is not correct, available options are [${ErgoNetworkType.Node}], [${ErgoNetworkType.Explorer}].`
      );
      throw new Error('Scanner type is not correct');
    }
    const ergoScannerConfig = {
      type: config.scannerType,
      url: networkUrl,
      timeout: networkTimeout,
      initialHeight: config.ergoInitialHeight,
      dataSource: dataSource,
    };
    this.ergoScanner = new ErgoScanner(
      ergoScannerConfig,
      loggers.scannerLogger
    );
    if (config.networkWatcher === Constants.ERGO_CHAIN_NAME) {
      this.observationScanner = this.ergoScanner;
      const observationExtractor = new ErgoObservationExtractor(
        dataSource,
        TokensConfig.getInstance().getTokenMap(),
        rosenConfig.lockAddress,
        loggers.observationExtractorLogger
      );
      this.observationScanner.registerExtractor(observationExtractor);
    }
    const commitmentExtractor = new CommitmentExtractor(
      Constants.COMMITMENT_EXTRACTOR_NAME,
      [rosenConfig.commitmentAddress],
      rosenConfig.RWTId,
      dataSource,
      TokensConfig.getInstance().getTokenMap(),
      loggers.commitmentExtractorLogger
    );
    const permitExtractor = new PermitExtractor(
      Constants.PERMIT_EXTRACTOR_NAME,
      dataSource,
      rosenConfig.watcherPermitAddress,
      rosenConfig.RWTId,
      config.explorerUrl,
      loggers.permitExtractorLogger
    );
    const eventTriggerExtractor = new EventTriggerExtractor(
      Constants.TRIGGER_EXTRACTOR_NAME,
      dataSource,
      config.scannerType,
      networkUrl,
      rosenConfig.eventTriggerAddress,
      rosenConfig.RWTId,
      rosenConfig.watcherPermitAddress,
      rosenConfig.fraudAddress,
      loggers.eventTriggerExtractorLogger
    );
    const plainExtractor = new ErgoUTXOExtractor(
      dataSource,
      Constants.ADDRESS_EXTRACTOR_NAME,
      config.networkPrefix,
      networkUrl,
      config.scannerType,
      config.address,
      undefined, // Token constraint not needed
      loggers.plainExtractorLogger
    );
    const collateralExtractor = new CollateralExtractor(
      Constants.COLLATERAL_EXTRACTOR_NAME,
      rosenConfig.AWC,
      rosenConfig.watcherCollateralAddress,
      dataSource,
      config.explorerUrl,
      loggers.collateralExtractorLogger
    );
    this.ergoScanner.registerExtractor(commitmentExtractor);
    this.ergoScanner.registerExtractor(permitExtractor);
    this.ergoScanner.registerExtractor(eventTriggerExtractor);
    this.ergoScanner.registerExtractor(plainExtractor);
    this.ergoScanner.registerExtractor(collateralExtractor);
  };

  private createCardanoScanner = async (cardanoConfig: any, rosenConfig: any) => {
    if (!this.observationScanner) {
      if (cardanoConfig.ogmios) {
        this.observationScanner = new CardanoOgmiosScanner(
          {
            nodeHostOrIp: cardanoConfig.ogmios.host,
            useTls: cardanoConfig.ogmios.useTls,
            nodePort: cardanoConfig.ogmios.port,
            dataSource: dataSource,
            initialHash: cardanoConfig.ogmios.initialHash,
            initialSlot: cardanoConfig.ogmios.initialSlot,
          },
          loggers.scannerLogger
        );
        const observationExtractor = new CardanoOgmiosObservationExtractor(
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          rosenConfig.lockAddress,
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      } else if (cardanoConfig.koios) {
        this.observationScanner = new CardanoKoiosScanner(
          {
            dataSource: dataSource,
            koiosUrl: cardanoConfig.koios.url,
            timeout: cardanoConfig.koios.timeout * 1000,
            initialHeight: cardanoConfig.koios.initialHeight,
          },
          loggers.scannerLogger,
          cardanoConfig.koios.authToken
        );
        const observationExtractor = new CardanoKoiosObservationExtractor(
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          rosenConfig.lockAddress,
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      } else if (cardanoConfig.blockfrost) {
        this.observationScanner = new CardanoBlockFrostScanner({
          dataSource,
          initialHeight: cardanoConfig.blockfrost.initialHeight,
          projectId: cardanoConfig.blockfrost.projectId,
          timeout: cardanoConfig.blockfrost.timeout,
          blockFrostUrl: cardanoConfig.blockfrost.url,
        });
        const observationExtractor = new CardanoBlockFrostObservationExtractor(
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          rosenConfig.lockAddress,
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };

  private createBitcoinScanner = async (bitcoinConfig: any, rosenConfig: any) => {
    if (!this.observationScanner) {
      if (bitcoinConfig.esplora) {
        this.observationScanner = new BitcoinEsploraScanner(
          {
            dataSource: dataSource as DataSource,
            esploraUrl: bitcoinConfig.esplora.url,
            timeout: bitcoinConfig.esplora.timeout * 1000,
            initialHeight: bitcoinConfig.initialHeight,
          },
          loggers.scannerLogger
        );
        const observationExtractor = new BitcoinEsploraObservationExtractor(
          rosenConfig.lockAddress,
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      } else if (bitcoinConfig.rpc) {
        this.observationScanner = new BitcoinRpcScanner(
          {
            rpcUrl: bitcoinConfig.rpc.url,
            timeout: bitcoinConfig.rpc.timeout * 1000,
            initialHeight: bitcoinConfig.initialHeight,
            dataSource: dataSource,
            username: bitcoinConfig.rpc.username,
            password: bitcoinConfig.rpc.password,
          },
          loggers.scannerLogger
        );

        const observationExtractor = new BitcoinRpcObservationExtractor(
          rosenConfig.lockAddress,
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };

  private createEthereumScanner = async (ethereumConfig: any, rosenConfig: any) => {
    if (!this.observationScanner) {
      if (ethereumConfig.rpc) {
        this.observationScanner = new EvmRpcScanner(
          Constants.ETHEREUM_CHAIN_NAME,
          {
            RpcUrl: ethereumConfig.rpc.url,
            timeout: ethereumConfig.rpc.timeout * 1000,
            initialHeight: ethereumConfig.initialHeight,
            dataSource: dataSource,
          },
          loggers.scannerLogger,
          ethereumConfig.rpc.authToken
        );

        const observationExtractor = new EthereumRpcObservationExtractor(
          rosenConfig.lockAddress,
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };

  private createBinanceScanner = async (binanceConfig: any, rosenConfig: any) => {
    if (!this.observationScanner) {
      if (binanceConfig.rpc) {
        this.observationScanner = new EvmRpcScanner(
          Constants.BINANCE_CHAIN_NAME,
          {
            RpcUrl: binanceConfig.rpc.url,
            timeout: binanceConfig.rpc.timeout * 1000,
            initialHeight: binanceConfig.initialHeight,
            dataSource: dataSource,
          },
          loggers.scannerLogger,
          binanceConfig.rpc.authToken
        );

        const observationExtractor = new BinanceRpcObservationExtractor(
          rosenConfig.lockAddress,
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };
}

export { CreateScanner };
