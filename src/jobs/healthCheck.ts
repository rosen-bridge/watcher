import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';
import { Boxes } from '../../src/ergo/boxes';
import { HealthCheckObject } from '../../src/utils/healthCheck';

const logger = loggerFactory(import.meta.url);

/**
 * updates the health check parameters iteratively
 * @param healthCheck
 */
const healthCheckUpdateJob = async () => {
  try {
    await HealthCheckObject.getInstance().updateParams();
  } catch (e) {
    logger.warn(
      `Health check update job failed for , ${e.message}, ${e.stack}`
    );
  }
  setTimeout(
    () => healthCheckUpdateJob(),
    getConfig().healthCheck.updateInterval * 1000
  );
};

/**
 * updates the permit thresholds based on needed Rwts for each commitment
 * @param boxes
 */
const permitCheckThresholdUpdate = async (boxes: Boxes) => {
  if (HealthCheckObject.getInstance().existsPermitHealthCheck()) {
    const repoBox = await boxes.getRepoBox();
    const R6 = repoBox.register_value(6);
    if (!R6) {
      logger.warn('incorrect repo box format, repo R6 register is undefined.');
      return;
    }
    const commitmentRwt = R6.to_i64_str_array()[0];
    HealthCheckObject.getInstance().updatePermitHealthCheck(
      BigInt(getConfig().healthCheck.permitWarnCommitmentCount * commitmentRwt),
      BigInt(
        getConfig().healthCheck.permitCriticalCommitmentCount * commitmentRwt
      )
    );
  }
};

/**
 * updates permit health check parameters iteratively
 * @param boxes
 */
const permitCheckThresholdUpdateJob = async (boxes: Boxes) => {
  try {
    await permitCheckThresholdUpdate(boxes);
  } catch (e) {
    logger.warn(
      `Permit health check update threshold job failed with error: ${e.message}, ${e.stack}`
    );
  }
  setTimeout(
    () => permitCheckThresholdUpdateJob(boxes),
    getConfig().healthCheck.updateInterval * 1000
  );
};

const healthCheckStart = (boxes: Boxes) => {
  healthCheckUpdateJob();
  permitCheckThresholdUpdateJob(boxes);
};

export { healthCheckStart };
