import express, { Router } from 'express';
import addressRouter from './api/address';
import permitRouter from './api/permit';
import observationRouter from './api/observation';
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
import { getConfig } from './config/config';
import { redeem } from './jobs/commitmentRedeem';
import { tokenNameJob } from './jobs/tokenName';
import eventsRouter from './api/events';
import withdrawRouter from './api/withdraw';
import revenueRouter from './api/revenue';
import { revenueJob } from './jobs/revenue';
import { healthCheckJob } from './jobs/healthCheck';
import { healthRouter } from './api/healthCheck';
import cors from 'cors';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

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
      boxesObject,
      watcherDatabase
    );
    Transaction.getInstance();
    logger.debug('APIs initialized successfully.');
  };

  const initExpress = () => {
    const app = express();
    app.use(express.json());
    const allowedOrigins = getConfig().general.apiAllowedOrigins;
    app.use(
      cors({
        origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      })
    );

    const router = Router();
    router.use('/address', addressRouter);
    router.use('/permit', permitRouter);
    router.use('/observation', observationRouter);
    router.use('/info', generalRouter);
    router.use('/events', eventsRouter);
    router.use('/withdraw', withdrawRouter);
    router.use('/revenue', revenueRouter);
    router.use('/health', healthRouter);

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
      await Transaction.setup(
        getConfig().general.address,
        getConfig().general.secretKey,
        boxesObject,
        watcherDatabase
      );
      Transaction.getInstance();

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
      // Running revenue thread
      revenueJob();
      // Starting HealthCheck jobs
      healthCheckJob(boxesObject);

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
