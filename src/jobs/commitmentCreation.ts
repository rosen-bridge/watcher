import {
  ErgoNodeScannerHealthCheck,
  HealthStatusLevel,
} from '@rosen-bridge/health-check';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { dataSource } from '../../config/dataSource';
import { getConfig } from '../config/config';
import { Boxes } from '../ergo/boxes';
import { CommitmentCreation } from '../transactions/commitmentCreation';
import { scanner } from '../utils/scanner';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { redeemJob } from './commitmentRedeem';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

let commitmentCreatorObj: CommitmentCreation;
let redeemExecuted = false;
let ergoScannerSyncCheck: ErgoNodeScannerHealthCheck;

const creationJob = async () => {
  try {
    await ergoScannerSyncCheck.update();
    const status = await ergoScannerSyncCheck.getHealthStatus();
    if (status === HealthStatusLevel.HEALTHY) {
      await commitmentCreatorObj.job();
      if (!redeemExecuted) {
        redeemExecuted = true;
        redeemJob();
      }
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
  ergoScannerSyncCheck = new ErgoNodeScannerHealthCheck(
    dataSource,
    scanner.ergoScanner.name(),
    getConfig().healthCheck.ergoScannerWarnDiff,
    getConfig().healthCheck.ergoScannerCriticalDiff,
    getConfig().general.nodeUrl
  );
  creationJob();
};
