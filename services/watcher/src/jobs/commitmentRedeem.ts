import { CommitmentRedeem } from '../transactions/commitmentRedeem';
import { Boxes } from '../ergo/boxes';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';

const logger = loggerFactory(import.meta.url);

let commitmentRedeemObj: CommitmentRedeem;

const redeemJob = async () => {
  try {
    await commitmentRedeemObj.job();
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
  redeemJob();
};
