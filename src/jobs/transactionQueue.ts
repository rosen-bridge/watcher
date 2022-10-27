import { Config } from '../config/config';
import { TransactionQueue } from '../ergo/transactionQueue';
import { WatcherDataBase } from '../database/models/watcherModel';
import { WatcherUtils } from '../utils/watcherUtils';
import { logger } from '../log/Logger';

const config = Config.getConfig();
let transactionQueue: TransactionQueue;

const transactionCheck = async () => {
  try {
    await transactionQueue.job();
    setTimeout(transactionCheck, config.transactionCheckingInterval * 1000);
  } catch (e) {
    logger.warn('Transaction Queue Job failed with error:');
    console.log(e.message);
    setTimeout(transactionCheck, config.transactionCheckingInterval * 1000);
  }
};

export const transactionQueueJob = (
  database: WatcherDataBase,
  dbConnection: WatcherUtils
) => {
  transactionQueue = new TransactionQueue(database, dbConnection);
  transactionCheck();
};
