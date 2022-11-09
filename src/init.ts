import express, { Router } from 'express';
import addressRouter from './api/showAddress';
import permitRouter from './api/permit';
import { Transaction } from './api/Transaction';
import { Config } from './config/config';
import { rosenConfig } from './config/rosenConfig';
import { Boxes } from './ergo/boxes';
import { WatcherDataBase } from './database/models/watcherModel';
import { dataSource } from '../config/dataSource';
import { scannerInit } from './jobs/scanner';
import { creation } from './jobs/commitmentCreation';
import { reveal } from './jobs/commitmetnReveal';
import { transactionQueueJob } from './jobs/transactionQueue';
import { delay } from './utils/utils';
import { TransactionUtils, WatcherUtils } from './utils/watcherUtils';
import Statistics from './statistics/statistics';
import { statisticsRouter } from './statistics/apis';
import { logger } from './log/Logger';

const config = Config.getConfig();

let watcherTransaction: Transaction;
let watcherStatistics: Statistics;
let boxesObject: Boxes;
let watcherDatabase: WatcherDataBase;
let watcherUtils: WatcherUtils;

/**
 * initiating watcher
 */
const init = async () => {
  const generateTransactionObject = async (): Promise<Transaction> => {
    await dataSource.initialize();
    await dataSource.runMigrations();
    watcherDatabase = new WatcherDataBase(dataSource);
    boxesObject = new Boxes(rosenConfig, watcherDatabase);
    await Transaction.setup(
      rosenConfig,
      config.address,
      config.secretKey,
      boxesObject
    );
    return Transaction.getInstance();
  };

  const initExpress = () => {
    const app = express();
    app.use(express.json());

    const router = Router();
    router.use('/address', addressRouter);
    router.use('/permit', permitRouter);
    router.use('/statistics', statisticsRouter);

    app.use(router);
    const port = process.env.PORT || 3000;

    app.listen(port, () => logger.info(`App listening on port ${port}`));
  };

  generateTransactionObject()
    .then(async (res) => {
      watcherTransaction = res;
      initExpress();
      // Initializing database
      watcherDatabase = new WatcherDataBase(dataSource);
      // Running network scanner thread
      scannerInit();

      await delay(10000);
      watcherUtils = new WatcherUtils(
        watcherDatabase,
        watcherTransaction,
        config.observationConfirmation,
        config.observationValidThreshold
      );
      const txUtils = new TransactionUtils(watcherDatabase);
      // Initiating watcher Transaction API
      Statistics.setup(watcherDatabase, Transaction.watcherWID);
      watcherStatistics = Statistics.getInstance();
      // Running transaction checking thread
      transactionQueueJob(watcherDatabase, watcherUtils);
      // Running commitment creation thread
      creation(watcherUtils, txUtils, boxesObject, watcherTransaction);
      // Running trigger event creation thread
      reveal(watcherUtils, txUtils, boxesObject);
    })
    .catch((e) => {
      logger.error(`An error occurred while initializing datasource: ${e}`);
    });
};

export { watcherTransaction, watcherStatistics, init };
