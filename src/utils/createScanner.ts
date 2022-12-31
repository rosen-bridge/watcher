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

import { getConfig } from '../config/config';
import { dataSource } from '../../config/dataSource';
import { logger } from '../log/Logger';
import * as Constants from '../config/constants';
import {
  CommitmentExtractor,
  PermitExtractor,
  EventTriggerExtractor,
} from '@rosen-bridge/watcher-data-extractor';
import { ErgoUTXOExtractor } from '@rosen-bridge/address-extractor';

const allConfig = getConfig();
const config = allConfig.general;
const tokens = allConfig.token;
const rosenConfig = allConfig.rosen;

class CreateScanner {
  private ergoScanner: GeneralScanner<any>;
  private cardanoScanner: AbstractScanner<any>;
  observationScannerName: string;

  createErgoScanner = () => {
    if (!this.ergoScanner) {
      const ergoScannerConfig = {
        nodeUrl: config.nodeUrl,
        timeout: config.nodeTimeout * 1000,
        initialHeight: config.ergoInitialHeight,
        dataSource: dataSource,
      };
      this.ergoScanner = new ErgoNodeScanner(ergoScannerConfig, logger);
      if (config.networkWatcher == Constants.ERGO_WATCHER) {
        this.observationScannerName = this.ergoScanner.name();
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
        undefined,
        logger
      );
      this.ergoScanner.registerExtractor(commitmentExtractor);
      this.ergoScanner.registerExtractor(permitExtractor);
      this.ergoScanner.registerExtractor(eventTriggerExtractor);
      this.ergoScanner.registerExtractor(plainExtractor);
    }
    return this.ergoScanner;
  };

  createCardanoScanner = (): AbstractScanner<any> => {
    if (!this.cardanoScanner) {
      const cardanoConfig = allConfig.cardano;
      if (cardanoConfig.ogmios) {
        this.cardanoScanner = new CardanoOgmiosScanner({
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
        this.cardanoScanner.registerExtractor(observationExtractor);
        this.observationScannerName = this.cardanoScanner.name();
      } else if (cardanoConfig.koios) {
        this.cardanoScanner = new CardanoKoiosScanner({
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
        this.cardanoScanner.registerExtractor(observationExtractor);
        this.observationScannerName = this.cardanoScanner.name();
      }
    }
    return this.cardanoScanner;
  };
}

const createScanner = new CreateScanner();

export { createScanner };
