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
import WinstonLogger from '@rosen-bridge/winston-logger';

import { getConfig } from '../config/config';
import { dataSource } from '../../config/dataSource';
import * as Constants from '../config/constants';

const allConfig = getConfig();
const {
  general: config,
  token: tokensConfig,
  rosen: rosenConfig,
  cardano: cardanoConfig,
  bitcoin: bitcoinConfig,
} = allConfig;

/**
 * Creates loggers for scanners and extractors
 * @returns loggers object
 */
const createLoggers = () => ({
  commitmentExtractorLogger: WinstonLogger.getInstance().getLogger(
    'commitment-extractor'
  ),
  eventTriggerExtractorLogger: WinstonLogger.getInstance().getLogger(
    'event-trigger-extractor'
  ),
  observationExtractorLogger: WinstonLogger.getInstance().getLogger(
    'observation-extractor'
  ),
  permitExtractorLogger:
    WinstonLogger.getInstance().getLogger('permit-extractor'),
  plainExtractorLogger:
    WinstonLogger.getInstance().getLogger('plain-extractor'),
  scannerLogger: WinstonLogger.getInstance().getLogger('scanner'),
  collateralExtractorLogger: WinstonLogger.getInstance().getLogger(
    'collateral-extractor'
  ),
});

const loggers = createLoggers();
const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

class CreateScanner {
  ergoScanner: ErgoScanner;
  observationScanner:
    | ErgoScanner
    | CardanoKoiosScanner
    | CardanoOgmiosScanner
    | CardanoBlockFrostScanner
    | BitcoinEsploraScanner
    | BitcoinRpcScanner;

  constructor() {
    this.createErgoScanner();
    if (config.networkWatcher === Constants.CARDANO_CHAIN_NAME)
      this.createCardanoScanner();
    else if (config.networkWatcher === Constants.BITCOIN_CHAIN_NAME)
      this.createBitcoinScanner();
    if (!this.observationScanner)
      throw Error(
        'Observation scanner initialization failed, check the watcher network to be correct'
      );
  }

  private createErgoScanner = () => {
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
        tokensConfig.tokens,
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
      getConfig().token.tokens,
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

  private createCardanoScanner = () => {
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
          tokensConfig.tokens,
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
          tokensConfig.tokens,
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
          tokensConfig.tokens,
          rosenConfig.lockAddress,
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };

  private createBitcoinScanner = () => {
    if (!this.observationScanner) {
      if (bitcoinConfig.esplora) {
        this.observationScanner = new BitcoinEsploraScanner(
          {
            dataSource: dataSource,
            esploraUrl: bitcoinConfig.esplora.url,
            timeout: bitcoinConfig.esplora.timeout * 1000,
            initialHeight: bitcoinConfig.initialHeight,
          },
          loggers.scannerLogger
        );
        const observationExtractor = new BitcoinEsploraObservationExtractor(
          rosenConfig.lockAddress,
          dataSource,
          tokensConfig.tokens,
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
          tokensConfig.tokens,
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };
}

const scanner = new CreateScanner();

export { scanner };
