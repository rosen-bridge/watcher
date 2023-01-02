import { CommitmentCreation } from '../transactions/commitmentCreation';
import { Boxes } from '../ergo/boxes';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { logger } from '../log/Logger';
import { getConfig } from '../config/config';

let commitmentCreatorObj: CommitmentCreation;

const creationJob = async () => {
  try {
    await commitmentCreatorObj.job();
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
