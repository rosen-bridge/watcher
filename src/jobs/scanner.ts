import { GeneralScanner } from '@rosen-bridge/scanner';
import {
  CommitmentExtractor,
  PermitExtractor,
  EventTriggerExtractor,
} from '@rosen-bridge/watcher-data-extractor';
import { ErgoUTXOExtractor } from '@rosen-bridge/address-extractor';

import * as Constants from '../config/constants';
import { logger } from '../log/Logger';
import { getConfig } from '../config/config';
import {
  createErgoScanner,
  createKoiosCardanoScanner,
  createOgmiosCardanoScanner,
} from '../utils/createScanner';
import { dataSource } from '../../config/dataSource';

const scanningJob = async (interval: number, scanner: GeneralScanner<any>) => {
  try {
    await scanner.update();
  } catch (e) {
    logger.warn(`Scanning Job failed for ${scanner.name()}, ${e.message}`);
  }
  setTimeout(() => scanningJob(interval, scanner), interval * 1000);
};

export const scannerInit = async () => {
  const scanner = createErgoScanner();
  const allConfig = getConfig();
  const config = allConfig.general;
  const rosenConfig = allConfig.rosen;
  scanningJob(config.ergoInterval, scanner).then(() => null);
  if (config.networkWatcher == Constants.CARDANO_WATCHER) {
    const cardanoConfig = allConfig.cardano;
    if (cardanoConfig.ogmios) {
      const cardanoScanner = createOgmiosCardanoScanner();
      await cardanoScanner.start();
    } else if (cardanoConfig.koios) {
      const cardanoScanner = createKoiosCardanoScanner();
      scanningJob(cardanoConfig.koios.interval, cardanoScanner).then(
        () => null
      );
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
  scanner.registerExtractor(commitmentExtractor);
  scanner.registerExtractor(permitExtractor);
  scanner.registerExtractor(eventTriggerExtractor);
  scanner.registerExtractor(plainExtractor);

  // TODO: Add commitment cleanup job
};
