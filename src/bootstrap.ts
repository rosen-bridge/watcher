import '@rosen-bridge/extended-typeorm/bootstrap';
import WinstonLogger from '@rosen-bridge/winston-logger';
import CallbackLogger from '@rosen-bridge/callback-logger';
import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { RateLimitedAxiosConfig } from '@rosen-clients/rate-limited-axios';

import { getConfig } from './config/config';
import packageJson from '../package.json' assert { type: 'json' };

DefaultLogger.init(
  new CallbackLogger(WinstonLogger.createLogger(getConfig().logger.transports))
);
const logger = DefaultLogger.getInstance().child(import.meta.url);

logger.info(`Watcher version: ${packageJson.version}`);
logger.info(`Watcher contract version: ${getConfig().rosen.contractVersion}`);

RateLimitedAxiosConfig.setLogger(logger);
