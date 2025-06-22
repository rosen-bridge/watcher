import { HealthStatusLevel } from '@rosen-bridge/health-check';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { getConfig } from '../config/config';
import { Boxes } from '../ergo/boxes';
import { CommitmentReveal } from '../transactions/commitmentReveal';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { HealthCheckSingleton } from '../utils/healthCheck';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

let commitmentRevealingObj: CommitmentReveal;

const revealJob = async () => {
  try {
    const scannerSyncStatus =
      await HealthCheckSingleton.getInstance().getErgoScannerSyncHealth();
    if (scannerSyncStatus !== HealthStatusLevel.BROKEN) {
      await commitmentRevealingObj.job();
    } else {
      logger.info(
        'Scanner is not synced with network, skipping trigger creation job'
      );
    }
  } catch (e) {
    logger.warn(`Reveal Job failed with error: ${e.message} - ${e.stack}`);
  }
  setTimeout(revealJob, getConfig().general.commitmentRevealInterval * 1000);
};

export const reveal = (
  watcherUtils: WatcherUtils,
  txUtils: TransactionUtils,
  boxes: Boxes
) => {
  commitmentRevealingObj = new CommitmentReveal(watcherUtils, txUtils, boxes);
  revealJob();
};
