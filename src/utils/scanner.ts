import {
  ErgoScanner,
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
  ErgoNetworkType,
} from '@rosen-bridge/scanner';
import {
  ErgoObservationExtractor,
  CardanoKoiosObservationExtractor,
  CardanoOgmiosObservationExtractor,
} from '@rosen-bridge/observation-extractor';
import {
  CommitmentExtractor,
  PermitExtractor,
  EventTriggerExtractor,
} from '@rosen-bridge/watcher-data-extractor';
import { ErgoUTXOExtractor } from '@rosen-bridge/address-extractor';

import { getConfig } from '../config/config';
import { dataSource } from '../../config/dataSource';
import { loggerFactory } from '../log/Logger';
import * as Constants from '../config/constants';

const allConfig = getConfig();
const {
  general: config,
  token: tokensConfig,
  rosen: rosenConfig,
  cardano: cardanoConfig,
} = allConfig;

/**
 * Creates loggers for scanners and extractors
 * @returns loggers object
 */
const createLoggers = () => ({
  commitmentExtractorLogger: loggerFactory('commitment-extractor'),
  eventTriggerExtractorLogger: loggerFactory('event-trigger-extractor'),
  observationExtractorLogger: loggerFactory('observation-extractor'),
  permitExtractorLogger: loggerFactory('permit-extractor'),
  plainExtractorLogger: loggerFactory('plain-extractor'),
  scannerLogger: loggerFactory('scanner'),
});

const loggers = createLoggers();
const logger = loggerFactory(import.meta.url);

class CreateScanner {
  ergoScanner: ErgoScanner;
  observationScanner: ErgoScanner | CardanoKoiosScanner | CardanoOgmiosScanner;

  constructor() {
    this.createErgoScanner();
    if (config.networkWatcher === Constants.CARDANO_WATCHER)
      this.createCardanoScanner();
    if (!this.observationScanner)
      throw Error(
        'Observation scanner initialization failed, check the watcher network to be correct'
      );
  }

  private createErgoScanner = () => {
    let ergoScannerConfig;
    if (config.scannerType === ErgoNetworkType.Node) {
      ergoScannerConfig = {
        type: ErgoNetworkType.Node,
        url: config.nodeUrl,
        timeout: config.nodeTimeout * 1000,
        initialHeight: config.ergoInitialHeight,
        dataSource: dataSource,
      };
    } else if (config.scannerType === ErgoNetworkType.Explorer) {
      ergoScannerConfig = {
        type: ErgoNetworkType.Explorer,
        url: config.explorerUrl,
        timeout: config.explorerTimeout * 1000,
        initialHeight: config.ergoInitialHeight,
        dataSource: dataSource,
      };
    }
    if (!ergoScannerConfig) {
      logger.error(
        `Scanner type is not correct, available options are [${ErgoNetworkType.Node}], [${ErgoNetworkType.Explorer}].`
      );
      throw new Error('Scanner type is not correct');
    }
    this.ergoScanner = new ErgoScanner(
      ergoScannerConfig,
      loggers.scannerLogger
    );
    if (config.networkWatcher === Constants.ERGO_WATCHER) {
      this.observationScanner = this.ergoScanner;
      const observationExtractor = new ErgoObservationExtractor(
        dataSource,
        tokensConfig,
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
      loggers.eventTriggerExtractorLogger
    );
    const plainExtractor = new ErgoUTXOExtractor(
      dataSource,
      Constants.ADDRESS_EXTRACTOR_NAME,
      config.networkPrefix,
      config.explorerUrl,
      config.address,
      undefined, // Token constraint not needed
      loggers.plainExtractorLogger
    );
    this.ergoScanner.registerExtractor(commitmentExtractor);
    this.ergoScanner.registerExtractor(permitExtractor);
    this.ergoScanner.registerExtractor(eventTriggerExtractor);
    this.ergoScanner.registerExtractor(plainExtractor);
  };

  private createCardanoScanner = () => {
    if (!this.observationScanner) {
      if (cardanoConfig.ogmios) {
        this.observationScanner = new CardanoOgmiosScanner(
          {
            nodeIp: cardanoConfig.ogmios.ip,
            nodePort: cardanoConfig.ogmios.port,
            dataSource: dataSource,
            initialHash: cardanoConfig.ogmios.initialHash,
            initialSlot: cardanoConfig.ogmios.initialSlot,
          },
          loggers.scannerLogger
        );
        const observationExtractor = new CardanoOgmiosObservationExtractor(
          dataSource,
          tokensConfig,
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
          loggers.scannerLogger
        );
        const observationExtractor = new CardanoKoiosObservationExtractor(
          dataSource,
          tokensConfig,
          rosenConfig.lockAddress,
          loggers.observationExtractorLogger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };
}

const scanner = new CreateScanner();

export { scanner };
