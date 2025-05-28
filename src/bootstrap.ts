import 'reflect-metadata';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from './config/config';
import packageJson from '../package.json' assert { type: 'json' };
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import axios from '@rosen-bridge/rate-limited-axios';

CallbackLoggerFactory.init(new WinstonLogger(getConfig().logger.transports));
const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

logger.info(`Watcher version: ${packageJson.version}`);
logger.info(`Watcher contract version: ${getConfig().rosen.contractVersion}`);

axios.initConfigs(
  {
    apiLimitRateRangeAsSeconds: 10,
    apiLimitRules: [
      // { pattern: '.*/info', rateLimit: 1 },
    ],
  },
  logger
);
