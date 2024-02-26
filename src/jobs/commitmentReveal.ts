import {
  ErgoNodeScannerHealthCheck,
  HealthStatusLevel,
} from '@rosen-bridge/health-check';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { dataSource } from '../../config/dataSource';
import { getConfig } from '../config/config';
import { Boxes } from '../ergo/boxes';
import { CommitmentReveal } from '../transactions/commitmentReveal';
import { scanner } from '../utils/scanner';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

let commitmentRevealingObj: CommitmentReveal;
let ergoScannerSyncCheck: ErgoNodeScannerHealthCheck;

const revealJob = async () => {
  try {
    await ergoScannerSyncCheck.update();
    const status = await ergoScannerSyncCheck.getHealthStatus();
    if (status === HealthStatusLevel.HEALTHY) {
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
  ergoScannerSyncCheck = new ErgoNodeScannerHealthCheck(
    dataSource,
    scanner.ergoScanner.name(),
    getConfig().healthCheck.ergoScannerWarnDiff,
    getConfig().healthCheck.ergoScannerCriticalDiff,
    getConfig().general.nodeUrl
  );
  revealJob();
};
