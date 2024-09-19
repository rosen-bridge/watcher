import 'reflect-metadata';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from './config/config';
import packageJson from '../package.json' assert { type: 'json' };

WinstonLogger.init(getConfig().logger.transports);

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

logger.info(`Watcher Started with version ${packageJson.version}`);
