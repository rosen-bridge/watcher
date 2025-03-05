import { CommitmentRedeem } from '../transactions/commitmentRedeem';
import { Boxes } from '../ergo/boxes';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { getConfig } from '../config/config';
import { HealthCheckSingleton } from '../utils/healthCheck';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { HealthStatusLevel } from '@rosen-bridge/health-check';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

let commitmentRedeemObj: CommitmentRedeem;

const redeemJob = async () => {
  try {
    const scannerSyncStatus =
      await HealthCheckSingleton.getInstance().getErgoScannerSyncHealth();
    if (scannerSyncStatus !== HealthStatusLevel.BROKEN) {
      await commitmentRedeemObj.job();
    } else {
      logger.info(
        'Scanner is not synced with network, skipping commitment redeem job'
      );
    }
  } catch (e) {
    logger.warn(`Redeem Job failed with error: ${e.message} - ${e.stack}`);
  }
  setTimeout(redeemJob, getConfig().general.commitmentRedeemInterval * 1000);
};

export const redeem = (
  watcherUtils: WatcherUtils,
  txUtils: TransactionUtils,
  boxes: Boxes
) => {
  commitmentRedeemObj = new CommitmentRedeem(
    watcherUtils,
    txUtils,
    boxes,
    getConfig().general.commitmentTimeoutConfirmation
  );
};

export { redeemJob };
