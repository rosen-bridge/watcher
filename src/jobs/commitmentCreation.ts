import { CommitmentCreation } from '../transactions/commitmentCreation';
import { Boxes } from '../ergo/boxes';
import { Transaction } from '../api/Transaction';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { logger } from '../log/Logger';
import { getConfig } from '../config/config';

let commitmentCreatorObj: CommitmentCreation;

const creationJob = async () => {
  try {
    await commitmentCreatorObj.job();
  } catch (e) {
    logger.warn('Creation Job failed with error:');
    console.log(e.message);
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
