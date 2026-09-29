import { HealthStatusLevel } from '@rosen-bridge/health-check';
import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { getConfig } from '../config/config';
import * as Constants from '../config/constants';
import { Boxes } from '../ergo/boxes';
import { CommitmentReveal } from '../transactions/commitmentReveal';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { HealthCheckSingleton } from '../utils/healthCheck';
import { CreateScanner } from '../utils/scanner';
import { ZcashScannerNotReady } from '../utils/zcashReadiness';

const logger = DefaultLogger.getInstance().child(import.meta.url);

let commitmentRevealingObj: CommitmentReveal;

const revealJob = async () => {
  try {
    const scannerSyncStatus =
      await HealthCheckSingleton.getInstance().getErgoScannerSyncHealth();
    if (scannerSyncStatus !== HealthStatusLevel.BROKEN) {
      if (getConfig().general.networkWatcher === Constants.ZCASH_CHAIN_NAME) {
        await CreateScanner.getInstance().assertZcashScannerHealthy();
      }
      await commitmentRevealingObj.job();
    } else {
      logger.info(
        'Scanner is not synced with network, skipping trigger creation job'
      );
    }
  } catch (e) {
    if (e instanceof ZcashScannerNotReady && e.readiness.state !== 'halted') {
      logger.info(`Skipping commitment reveal: ${e.message}`);
    } else {
      logger.warn(`Reveal Job failed with error: ${e.message} - ${e.stack}`);
    }
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
