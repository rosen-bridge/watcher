import { Queue } from '../ergo/transaction/queue';
import { WatcherDataBase } from '../database/models/watcherModel';
import { WatcherUtils } from '../utils/watcherUtils';
import { logger } from '../log/Logger';
import { getConfig } from '../config/config';

let transactionQueue: Queue;

const transactionCheck = async () => {
  try {
    await transactionQueue.job();
  } catch (e) {
    logger.warn('Transaction Queue Job failed with error:', e.stack);
  }
  setTimeout(
    transactionCheck,
    getConfig().general.transactionCheckingInterval * 1000
  );
};

export const transactionQueueJob = (
  database: WatcherDataBase,
  dbConnection: WatcherUtils
) => {
  transactionQueue = new Queue(database, dbConnection);
  transactionCheck();
};
