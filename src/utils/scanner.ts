import { ErgoUTXOExtractor } from '@rosen-bridge/address-extractor';
import { BitcoinEsploraScanner, DogeEsploraScanner } from '@rosen-bridge/bitcoin-esplora-scanner';
import {
  BitcoinEsploraObservationExtractor,
  BitcoinRpcObservationExtractor,
  DogeEsploraObservationExtractor,
  DogeRpcObservationExtractor,
} from '@rosen-bridge/bitcoin-observation-extractor';
import { BitcoinRpcScanner, DogeRpcScanner } from '@rosen-bridge/bitcoin-rpc-scanner';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import {
  CardanoBlockFrostObservationExtractor,
  CardanoKoiosObservationExtractor,
  CardanoOgmiosObservationExtractor,
  ErgoObservationExtractor,
} from '@rosen-bridge/observation-extractor';
import {
  CardanoBlockFrostScanner,
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
  ErgoScanner,
} from '@rosen-bridge/scanner';
import{  ErgoNetworkType} from '@rosen-bridge/scanner-interfaces'
import {
  CollateralExtractor,
  CommitmentExtractor,
  EventTriggerExtractor,
  PermitExtractor,
} from '@rosen-bridge/watcher-data-extractor';

import {
  BinanceRpcObservationExtractor,
  EthereumRpcObservationExtractor,
} from '@rosen-bridge/evm-observation-extractor';
import { EvmRpcScanner } from '@rosen-bridge/evm-rpc-scanner';
import { dataSource } from '../../config/dataSource';
import {
  BinanceConfig,
  BitcoinConfig,
  CardanoConfig,
  Config,
  EthereumConfig,
  getConfig,
  RosenConfig,
  DogeConfig,
} from '../config/config';
import * as Constants from '../config/constants';
import { TokensConfig } from '../config/tokensConfig';
import { 
  createCardanoKoiosNetworkConnectorManager,
  createCardanoBlockfrostNetworkConnectorManager,
  createBitcoinEsploraNetworkConnectorManager,
  createBitcoinRpcNetworkConnectorManager,
  createDogeEsploraNetworkConnectorManager,
  createDogeRpcNetworkConnectorManager,
  createEvmNetworkConnectorManager,
  createErgoNodeNetworkConnectorManager,
  createErgoExplorerNetworkConnectorManager,
} from './networkConnectorManagers';

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
  private ergoScanner!: ErgoScanner;
  private observationScanner!:
    | ErgoScanner
    | CardanoKoiosScanner
    | CardanoOgmiosScanner
    | CardanoBlockFrostScanner
    | BitcoinEsploraScanner
    | BitcoinRpcScanner
    | DogeEsploraScanner
    | DogeRpcScanner
    | EvmRpcScanner;

  private constructor() {
    // do nothing
  }

  /**
   * initializes scanner with the configuration
   */
  static init = async (): Promise<void> => {
    if (!CreateScanner.instance) {
      CreateScanner.instance = new CreateScanner();
      const allConfig = getConfig();
      const {
        general: config,
        rosen: rosenConfig,
        cardano: cardanoConfig,
        bitcoin: bitcoinConfig,
        doge: dogeConfig,
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
        case Constants.DOGE_CHAIN_NAME:
          await CreateScanner.instance.createDogeScanner(dogeConfig, rosenConfig);
          break;
      }
      if (!CreateScanner.instance.observationScanner)
        throw Error(
          'Observation scanner initialization failed, check the watcher network to be correct'
        );
    }
  };

  /**
   * returns the scanner instance if initialized
   * @returns scanner instance
   */
  static getInstance = (): CreateScanner => {
    if (!CreateScanner.instance) {
      throw new Error('Scanner is not initialized');
    }
    return CreateScanner.instance;
  };

  /**
   * @returns the ergo scanner
   */
  getErgoScanner = (): ErgoScanner => {
    if (!CreateScanner.instance) {
      throw new Error('Scanner is not initialized');
    }
    return this.ergoScanner;
  };

  /**
   * @returns the observation scanner
   */
  getObservationScanner = (): ErgoScanner | CardanoKoiosScanner | CardanoOgmiosScanner | CardanoBlockFrostScanner | BitcoinEsploraScanner | BitcoinRpcScanner | DogeEsploraScanner | DogeRpcScanner | EvmRpcScanner => {
    if (!CreateScanner.instance) {
      throw new Error('Scanner is not initialized');
    }
    return this.observationScanner;
  };

  private createErgoScanner = async (config: Config, rosenConfig: RosenConfig) => {
    let networkUrl;
    if (config.scannerType === ErgoNetworkType.Node) {
      networkUrl = config.nodeUrl;
    } else {
      networkUrl = config.explorerUrl;
    }
    let networkConnectorManager;
    if (config.scannerType === ErgoNetworkType.Node) {
      networkConnectorManager = createErgoNodeNetworkConnectorManager();
    } else {
      networkConnectorManager = createErgoExplorerNetworkConnectorManager();
    }

    this.ergoScanner = new ErgoScanner(
      {
        network: networkConnectorManager,
        initialHeight: config.ergoInitialHeight,
        dataSource: dataSource,
        logger: loggers.scannerLogger
      }    );
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

  private createCardanoScanner = async (cardanoConfig: CardanoConfig, rosenConfig: RosenConfig) => {
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
            dataSource,
            initialHeight: cardanoConfig.koios.initialHeight,
            network: createCardanoKoiosNetworkConnectorManager(),
            logger: loggers.scannerLogger
          },
        );
        const observationExtractor = new CardanoKoiosObservationExtractor(
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          rosenConfig.lockAddress,
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      } else if (cardanoConfig.blockfrost) {
        this.observationScanner = new CardanoBlockFrostScanner(
          {
            dataSource,
            initialHeight: cardanoConfig.blockfrost.initialHeight,
            network: createCardanoBlockfrostNetworkConnectorManager(),
            logger: loggers.scannerLogger
          },
        );
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

  private createBitcoinScanner = async (bitcoinConfig: BitcoinConfig, rosenConfig: RosenConfig) => {
    if (!this.observationScanner) {
      if (bitcoinConfig.esplora) {
        this.observationScanner = new BitcoinEsploraScanner(
          {
            dataSource,
            initialHeight: bitcoinConfig.initialHeight,
            network: createBitcoinEsploraNetworkConnectorManager(),
            logger: loggers.scannerLogger
          },
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
            dataSource,
            initialHeight: bitcoinConfig.initialHeight,
            network: createBitcoinRpcNetworkConnectorManager(),
            logger: loggers.scannerLogger
          },
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

  private createDogeScanner = async (dogeConfig: DogeConfig, rosenConfig: RosenConfig) => {
    if (!this.observationScanner) {
      if (dogeConfig.esplora) {
        this.observationScanner = new DogeEsploraScanner(
          {
            dataSource,
            initialHeight: dogeConfig.initialHeight,
            network: createDogeEsploraNetworkConnectorManager(),
            logger: loggers.scannerLogger
          },
        );
        const observationExtractor = new DogeEsploraObservationExtractor(
          rosenConfig.lockAddress,
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      } else if (dogeConfig.rpc) {
        this.observationScanner = new DogeRpcScanner(
          {
            dataSource,
            initialHeight: dogeConfig.initialHeight,
            network: createDogeRpcNetworkConnectorManager(),
            logger: loggers.scannerLogger,
            blockRetrieveGap: dogeConfig.blockRetrieveGap * 1000,
          },
        );

        const observationExtractor = new DogeRpcObservationExtractor(
          rosenConfig.lockAddress,
          dataSource,
          TokensConfig.getInstance().getTokenMap(),
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };

  private createEthereumScanner = async (ethereumConfig: EthereumConfig, rosenConfig: RosenConfig) => {
    if (!this.observationScanner) {
      if (ethereumConfig.rpc) {
        this.observationScanner = new EvmRpcScanner(
          Constants.ETHEREUM_CHAIN_NAME,
          {
            dataSource,
            initialHeight: ethereumConfig.initialHeight,
            network: createEvmNetworkConnectorManager(Constants.ETHEREUM_CHAIN_NAME),
            logger: loggers.scannerLogger
          },
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

  private createBinanceScanner = async (binanceConfig: BinanceConfig, rosenConfig: RosenConfig) => {
    if (!this.observationScanner) {
      if (binanceConfig.rpc) {
        this.observationScanner = new EvmRpcScanner(
          Constants.BINANCE_CHAIN_NAME,
          {
            dataSource,
            initialHeight: binanceConfig.initialHeight,
            network: createEvmNetworkConnectorManager(Constants.BINANCE_CHAIN_NAME),
            logger: loggers.scannerLogger
          },
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
