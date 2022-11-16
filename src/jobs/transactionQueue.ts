import { Config } from '../config/config';
import { Queue } from '../ergo/transaction/queue';
import { WatcherDataBase } from '../database/models/watcherModel';
import { WatcherUtils } from '../utils/watcherUtils';

const config = Config.getConfig();
let transactionQueue: Queue;

const transactionCheck = () => {
  transactionQueue
    .job()
    .then(() =>
      setTimeout(transactionCheck, config.transactionCheckingInterval * 1000)
    );
};

export const transactionQueueJob = (
  database: WatcherDataBase,
  dbConnection: WatcherUtils
) => {
  transactionQueue = new Queue(database, dbConnection);
  transactionCheck();
};
