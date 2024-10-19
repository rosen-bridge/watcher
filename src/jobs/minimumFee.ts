import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import MinimumFeeHandler from '../utils/MinimumFeeHandler';
import { getConfig } from '../config/config';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

/**
 * runs MinimumFee update job
 */
export const minimumFeeUpdateJob = () => {
  MinimumFeeHandler.getInstance()
    .update()
    .then(() =>
      setTimeout(
        minimumFeeUpdateJob,
        getConfig().general.minimumFeeUpdateInterval * 1000
      )
    )
    .catch((e) => {
      logger.error(`Minimum fee update job failed with error: ${e}`);
      setTimeout(
        minimumFeeUpdateJob,
        getConfig().general.minimumFeeUpdateInterval * 1000
      );
    });
};
