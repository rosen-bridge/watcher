import 'reflect-metadata';
import './api/axiosLimiter';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from './config/config';
import packageJson from '../package.json' assert { type: 'json' };
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';

CallbackLoggerFactory.init(new WinstonLogger(getConfig().logger.transports));
const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

logger.info(`Watcher version: ${packageJson.version}`);
logger.info(`Watcher contract version: ${getConfig().rosen.contractVersion}`);
