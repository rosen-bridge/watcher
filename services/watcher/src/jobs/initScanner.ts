import {
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
  GeneralScanner,
} from '@rosen-bridge/scanner';

import * as Constants from '../config/constants';
import { getConfig } from '../config/config';
import { scanner } from '../utils/scanner';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const scanningJob = async (interval: number, scanner: GeneralScanner<any>) => {
  try {
    await scanner.update();
  } catch (e) {
    logger.warn(
      `Scanning Job failed for ${scanner.name()}, ${e.message}, ${e.stack}`
    );
  }
  setTimeout(() => scanningJob(interval, scanner), interval * 1000);
};

export const scannerInit = () => {
  const allConfig = getConfig();
  const config = allConfig.general;
  const cardanoConfig = allConfig.cardano;
  scanningJob(config.ergoInterval, scanner.ergoScanner).then(() => null);
  if (config.networkWatcher === Constants.CARDANO_CHAIN_NAME) {
    if (cardanoConfig.ogmios)
      (scanner.observationScanner as CardanoOgmiosScanner).start();
    else if (cardanoConfig.koios) {
      scanningJob(
        cardanoConfig.koios.interval,
        scanner.observationScanner as CardanoKoiosScanner
      ).then(() => null);
    } else {
      throw new Error(
        `The observing network [${config.networkWatcher}] is not supported`
      );
    }
  }

  // TODO: Add commitment cleanup job
  // https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/39
};
