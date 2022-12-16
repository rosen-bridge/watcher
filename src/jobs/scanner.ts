import { CardanoConfig } from '../config/config';
import {
  ErgoNodeScanner,
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
  GeneralScanner,
} from '@rosen-bridge/scanner';
import { Config } from '../config/config';
import { dataSource } from '../../config/dataSource';
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
import { rosenConfig } from '../config/rosenConfig';
import { ErgoUTXOExtractor } from '@rosen-bridge/address-extractor';
import * as Constants from '../config/constants';
import { Tokens } from '../config/tokensConfig';
import { logger } from '../log/Logger';

const config = Config.getConfig();
let scanner: ErgoNodeScanner;

const scanningJob = async (interval: number, scanner: GeneralScanner<any>) => {
  try {
    await scanner.update();
  } catch (e) {
    logger.warn(`Scanning Job failed for ${scanner.name()}, ${e.message}`);
  }
  setTimeout(() => scanningJob(interval, scanner), interval * 1000);
};

export const scannerInit = () => {
  const ergoScannerConfig = {
    nodeUrl: config.nodeUrl,
    timeout: config.nodeTimeout,
    initialHeight: config.ergoInitialHeight,
    dataSource: dataSource,
  };
  scanner = new ErgoNodeScanner(ergoScannerConfig);
  scanningJob(config.ergoInterval, scanner).then(() => null);
  if (config.networkWatcher == Constants.ERGO_WATCHER) {
    const observationExtractor = new ErgoObservationExtractor(
      dataSource,
      Tokens,
      rosenConfig.lockAddress
    );
    scanner.registerExtractor(observationExtractor);
  } else if (config.networkWatcher == Constants.CARDANO_WATCHER) {
    const cardanoConfig = CardanoConfig.getConfig();
    if (cardanoConfig.ogmios) {
      const cardanoScanner = new CardanoOgmiosScanner({
        nodeIp: cardanoConfig.ogmios.ip,
        nodePort: cardanoConfig.ogmios.port,
        dataSource: dataSource,
        initialHash: cardanoConfig.ogmios.initialHash,
        initialSlot: cardanoConfig.ogmios.initialSlot,
      });
      const observationExtractor = new CardanoOgmiosObservationExtractor(
        dataSource,
        Tokens,
        rosenConfig.lockAddress
      );
      cardanoScanner.registerExtractor(observationExtractor);
      cardanoScanner.start().then(() => null);
    } else if (cardanoConfig.koios) {
      console.log(cardanoConfig.koios);
      const cardanoScanner = new CardanoKoiosScanner({
        dataSource: dataSource,
        koiosUrl: cardanoConfig.koios?.url,
        timeout: cardanoConfig.koios.timeout,
        initialHeight: cardanoConfig.koios.initialHeight,
      });
      scanningJob(cardanoConfig.koios.interval, cardanoScanner).then(
        () => null
      );
      const observationExtractor = new CardanoKoiosObservationExtractor(
        dataSource,
        Tokens,
        rosenConfig.lockAddress
      );
      cardanoScanner.registerExtractor(observationExtractor);
    }
  } else {
    throw new Error(
      `The observing network [${config.networkWatcher}] is not supported`
    );
  }
  const commitmentExtractor = new CommitmentExtractor(
    Constants.COMMITMENT_EXTRACTOR_NAME,
    [rosenConfig.commitmentAddress],
    rosenConfig.RWTId,
    dataSource
  );
  const permitExtractor = new PermitExtractor(
    Constants.PERMIT_EXTRACTOR_NAME,
    dataSource,
    rosenConfig.watcherPermitAddress,
    rosenConfig.RWTId,
    config.explorerUrl
  );
  const eventTriggerExtractor = new EventTriggerExtractor(
    Constants.TRIGGER_EXTRACTOR_NAME,
    dataSource,
    rosenConfig.eventTriggerAddress,
    rosenConfig.RWTId
  );
  const plainExtractor = new ErgoUTXOExtractor(
    dataSource,
    Constants.ADDRESS_EXTRACTOR_NAME,
    config.networkPrefix,
    config.explorerUrl,
    config.address
  );
  scanner.registerExtractor(commitmentExtractor);
  scanner.registerExtractor(permitExtractor);
  scanner.registerExtractor(eventTriggerExtractor);
  scanner.registerExtractor(plainExtractor);

  // TODO: Add commitment cleanup job
};
