import { CommitmentCreation } from '../transactions/commitmentCreation';
import { Boxes } from '../ergo/boxes';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { getConfig } from '../config/config';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { redeemJob } from './commitmentRedeem';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

let commitmentCreatorObj: CommitmentCreation;
let redeemExecuted = false;

const creationJob = async () => {
  try {
    await commitmentCreatorObj.job();
    if (!redeemExecuted) {
      redeemExecuted = true;
      redeemJob();
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
