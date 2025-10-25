import 'reflect-metadata';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { RateLimitedAxiosConfig } from '@rosen-clients/rate-limited-axios';

import { getConfig } from './config/config';
import packageJson from '../package.json' assert { type: 'json' };

CallbackLoggerFactory.init(new WinstonLogger(getConfig().logger.transports));
const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

logger.info(`Watcher version: ${packageJson.version}`);
logger.info(`Watcher contract version: ${getConfig().rosen.contractVersion}`);

RateLimitedAxiosConfig.setLogger(logger);
