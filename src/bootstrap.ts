import 'reflect-metadata';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import axios from '@rosen-bridge/rate-limited-axios';

import { getConfig } from './config/config';
import packageJson from '../package.json' assert { type: 'json' };
import { DOGE_CHAIN_NAME } from './config/constants';

CallbackLoggerFactory.init(new WinstonLogger(getConfig().logger.transports));
const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

logger.info(`Watcher version: ${packageJson.version}`);
logger.info(`Watcher contract version: ${getConfig().rosen.contractVersion}`);

let limitRules: { pattern: string; rateLimit: number }[] = [];
if (getConfig().general.networkWatcher === DOGE_CHAIN_NAME && getConfig().doge.rpc.length > 0) {
limitRules = getConfig().doge.rpc.map((rpcConfig) => {
  return {
    pattern: `^${rpcConfig.url}$`,
    rateLimit: 3,
  };
});
}

axios.initConfigs(
  {
    apiLimitRateRangeAsSeconds: 1,
    apiLimitRules: limitRules,
  },
  logger
);
