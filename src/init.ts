import express, { Router } from 'express';
import addressRouter from './api/address';
import permitRouter from './api/permit';
import generalRouter from './api/general';
import { Transaction } from './api/Transaction';
import { Boxes } from './ergo/boxes';
import { WatcherDataBase } from './database/models/watcherModel';
import { dataSource } from '../config/dataSource';
import { scannerInit } from './jobs/initScanner';
import { creation } from './jobs/commitmentCreation';
import { reveal } from './jobs/commitmentReveal';
import { transactionQueueJob } from './jobs/transactionQueue';
import { delay } from './utils/utils';
import { TransactionUtils, WatcherUtils } from './utils/watcherUtils';
import Statistics from './statistics/statistics';
import { statisticsRouter } from './statistics/apis';
import { loggerFactory } from './log/Logger';
import { getConfig } from './config/config';
import { redeem } from './jobs/commitmentRedeem';
import { tokenNameJob } from './jobs/tokenName';

const logger = loggerFactory(import.meta.url);

let boxesObject: Boxes;
let watcherDatabase: WatcherDataBase;
let watcherUtils: WatcherUtils;

/**
 * initiating watcher
 */
const init = async () => {
  const generateTransactionObject = async () => {
    logger.debug('Initializing data sources and APIs...');
    await dataSource.initialize();
    logger.debug('Data sources had been initialized.');
    await dataSource.runMigrations();
    logger.debug('Migrations done successfully.');
    watcherDatabase = new WatcherDataBase(dataSource);
    boxesObject = new Boxes(watcherDatabase);
    await Transaction.setup(
      getConfig().general.address,
      getConfig().general.secretKey,
      boxesObject
    );
    Transaction.getInstance();
    logger.debug('APIs initialized successfully.');
  };

  const initExpress = () => {
    const app = express();
    app.use(express.json());

    const router = Router();
    router.use('/address', addressRouter);
    router.use('/permit', permitRouter);
    router.use('/statistics', statisticsRouter);
    router.use('/info', generalRouter);

    app.use(router);
    const port = getConfig().general.apiPort;

    app.listen(port, () => logger.info(`App listening on port ${port}`));
  };

  generateTransactionObject()
    .then(async () => {
      logger.debug('Initializing routes...');
      initExpress();
      watcherDatabase = new WatcherDataBase(dataSource);
      logger.debug('Initializing scanners and extractors...');
      scannerInit();

      await delay(10000);
      watcherUtils = new WatcherUtils(
        watcherDatabase,
        getConfig().general.observationConfirmation,
        getConfig().general.observationValidThreshold
      );
      const txUtils = new TransactionUtils(watcherDatabase);
      logger.debug('Initializing statistic object...');
      Statistics.setup(watcherDatabase, Transaction.watcherWID);
      Statistics.getInstance();

      logger.debug('Initializing job threads...');
      // Running transaction checking thread
      transactionQueueJob(watcherDatabase, watcherUtils);
      // Running commitment creation thread
      creation(watcherUtils, txUtils, boxesObject);
      // Running commitment redeem thread
      redeem(watcherUtils, txUtils, boxesObject);
      // Running trigger event creation thread
      reveal(watcherUtils, txUtils, boxesObject);
      // Running token name thread
      tokenNameJob([]);

      logger.debug('Service initialization finished successfully.');
    })
    .catch((e) => {
      logger.error(
        `An error occurred while initializing datasource: ${e.message} - ${e.stack}`
      );
    });
};

const initWatcherDB = (db: WatcherDataBase) => {
  watcherDatabase = db;
};

export default init;

export { watcherDatabase, initWatcherDB };
