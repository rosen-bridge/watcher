import WinstonLogger from '@rosen-bridge/winston-logger';
import { Transaction } from '../api/Transaction';
import { getConfig } from '../config/config';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

/**
 * checks wid status periodically
 *
 * @return {Promise<void>}
 */
const widStatusCheck = async (): Promise<void> => {
  try {
    await Transaction.getWatcherState();
  } catch (e) {
    logger.warn(
      `widStatusCheck Job failed with error: ${e.message} - ${e.stack}`
    );
  }
  setTimeout(widStatusCheck, getConfig().general.widStatusCheckInterval * 1000);
};

/**
 * starts the wid status checking job
 *
 * @export
 */
export const widStatusJob = () => {
  widStatusCheck();
};
