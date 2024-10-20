import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { getConfig } from '../config/config';
import { Boxes } from '../ergo/boxes';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { RewardCollection } from '../transactions/rewardCollection';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

let rewardCollectorObj: RewardCollection;

/**
 * Run reward collection job periodically
 */
const rewardCollectionJob = async () => {
  try {
    await rewardCollectorObj.job();
  } catch (e) {
    logger.warn(
      `Reward collection Job failed with error: ${e.message} - ${e.stack}`
    );
  }
  setTimeout(
    rewardCollectionJob,
    getConfig().general.rewardCollectionInterval * 1000
  );
};

/**
 * Create reward collection object and start the job
 * @param txUtils
 * @param boxes
 */
export const rewardCollection = (
  watcherUtils: WatcherUtils,
  txUtils: TransactionUtils,
  boxes: Boxes
) => {
  rewardCollectorObj = new RewardCollection(watcherUtils, txUtils, boxes);
  rewardCollectionJob();
};
