import {
  ErgoNodeScanner,
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
  AbstractScanner,
  GeneralScanner,
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
import { logger } from '../log/Logger';
import * as Constants from '../config/constants';

const allConfig = getConfig();
const config = allConfig.general;
const tokens = allConfig.token;
const rosenConfig = allConfig.rosen;

class CreateScanner {
  ergoScanner: GeneralScanner<any>;
  observationScanner: AbstractScanner<any>;

  constructor() {
    this.createErgoScanner();
    if (config.networkWatcher == Constants.CARDANO_WATCHER)
      this.createCardanoScanner();
  }

  private createErgoScanner = () => {
    if (!this.ergoScanner) {
      const ergoScannerConfig = {
        nodeUrl: config.nodeUrl,
        timeout: config.nodeTimeout * 1000,
        initialHeight: config.ergoInitialHeight,
        dataSource: dataSource,
      };
      this.ergoScanner = new ErgoNodeScanner(ergoScannerConfig, logger);
      if (config.networkWatcher == Constants.ERGO_WATCHER) {
        this.observationScanner = this.ergoScanner;
        const observationExtractor = new ErgoObservationExtractor(
          dataSource,
          tokens,
          rosenConfig.lockAddress,
          logger
        );
        this.ergoScanner.registerExtractor(observationExtractor);
      }
      const commitmentExtractor = new CommitmentExtractor(
        Constants.COMMITMENT_EXTRACTOR_NAME,
        [rosenConfig.commitmentAddress],
        rosenConfig.RWTId,
        dataSource,
        logger
      );
      const permitExtractor = new PermitExtractor(
        Constants.PERMIT_EXTRACTOR_NAME,
        dataSource,
        rosenConfig.watcherPermitAddress,
        rosenConfig.RWTId,
        config.explorerUrl,
        logger
      );
      const eventTriggerExtractor = new EventTriggerExtractor(
        Constants.TRIGGER_EXTRACTOR_NAME,
        dataSource,
        rosenConfig.eventTriggerAddress,
        rosenConfig.RWTId,
        logger
      );
      const plainExtractor = new ErgoUTXOExtractor(
        dataSource,
        Constants.ADDRESS_EXTRACTOR_NAME,
        config.networkPrefix,
        config.explorerUrl,
        config.address,
        undefined, // Token constraint not needed
        logger
      );
      this.ergoScanner.registerExtractor(commitmentExtractor);
      this.ergoScanner.registerExtractor(permitExtractor);
      this.ergoScanner.registerExtractor(eventTriggerExtractor);
      this.ergoScanner.registerExtractor(plainExtractor);
    }
  };

  private createCardanoScanner = () => {
    if (!this.observationScanner) {
      const cardanoConfig = allConfig.cardano;
      if (cardanoConfig.ogmios) {
        this.observationScanner = new CardanoOgmiosScanner({
          nodeIp: cardanoConfig.ogmios.ip,
          nodePort: cardanoConfig.ogmios.port,
          dataSource: dataSource,
          initialHash: cardanoConfig.ogmios.initialHash,
          initialSlot: cardanoConfig.ogmios.initialSlot,
        });
        const observationExtractor = new CardanoOgmiosObservationExtractor(
          dataSource,
          tokens,
          rosenConfig.lockAddress,
          logger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      } else if (cardanoConfig.koios) {
        this.observationScanner = new CardanoKoiosScanner({
          dataSource: dataSource,
          koiosUrl: cardanoConfig.koios.url,
          timeout: cardanoConfig.koios.timeout,
          initialHeight: cardanoConfig.koios.initialHeight,
        });
        const observationExtractor = new CardanoKoiosObservationExtractor(
          dataSource,
          tokens,
          rosenConfig.lockAddress,
          logger
        );
        this.observationScanner.registerExtractor(observationExtractor);
      }
    }
  };
}

const scanner = new CreateScanner();

export { scanner };
