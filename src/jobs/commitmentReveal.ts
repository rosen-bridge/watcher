import { HealthStatusLevel } from '@rosen-bridge/health-check';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from '../config/config';
import { Boxes } from '../ergo/boxes';
import { CommitmentReveal } from '../transactions/commitmentReveal';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { HealthCheckSingleton } from '../utils/healthCheck';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

let commitmentRevealingObj: CommitmentReveal;

const revealJob = async () => {
  try {
    const scannerSyncStatus =
      await HealthCheckSingleton.getInstance().getErgoScannerSyncHealth();
    if (scannerSyncStatus === HealthStatusLevel.HEALTHY) {
      await commitmentRevealingObj.job();
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
