import 'reflect-metadata';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from './config/config';
import packageJson from '../package.json' assert { type: 'json' };
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

DefaultLoggerFactory.init(new WinstonLogger(getConfig().logger.transports));
const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

logger.info(`Watcher version: ${packageJson.version}`);
logger.info(`Watcher contract version: ${getConfig().rosen.contractVersion}`);
logger.info(`Watcher tokens version: ${getConfig().token.version}`);
