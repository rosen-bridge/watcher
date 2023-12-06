import { Queue } from '../ergo/transaction/queue';
import { WatcherDataBase } from '../database/models/watcherModel';
import { WatcherUtils } from '../utils/watcherUtils';
import { getConfig } from '../config/config';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

let transactionQueue: Queue;

const transactionCheck = async () => {
  try {
    await transactionQueue.job();
  } catch (e) {
    logger.warn(
      `Transaction Queue Job failed with error: ${e.message} - ${e.stack}`
    );
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
