import { HealthStatusLevel } from '@rosen-bridge/health-check';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from '../config/config';
import { Boxes } from '../ergo/boxes';
import { CommitmentCreation } from '../transactions/commitmentCreation';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { redeemJob } from './commitmentRedeem';
import { HealthCheckSingleton } from '../utils/healthCheck';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

let commitmentCreatorObj: CommitmentCreation;
let redeemExecuted = false;

const creationJob = async () => {
  try {
    const scannerSyncStatus =
      await HealthCheckSingleton.getInstance().getErgoScannerSyncHealth();
    if (scannerSyncStatus !== HealthStatusLevel.BROKEN) {
      await commitmentCreatorObj.job();
      if (!redeemExecuted) {
        redeemExecuted = true;
        redeemJob();
      }
    } else {
      logger.info(
        'Scanner is not synced with network, skipping commitment creation job'
      );
    }
  } catch (e) {
    logger.warn(`Creation Job failed with error: ${e.message} - ${e.stack}`);
  }
  setTimeout(
    creationJob,
    getConfig().general.commitmentCreationInterval * 1000
  );
};

export const creation = (
  watcherUtils: WatcherUtils,
  txUtils: TransactionUtils,
  boxes: Boxes
) => {
  commitmentCreatorObj = new CommitmentCreation(watcherUtils, txUtils, boxes);
  creationJob();
};
