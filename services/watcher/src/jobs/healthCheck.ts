import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';
import { Boxes } from '../../src/ergo/boxes';
import { HealthCheckSingleton } from '../../src/utils/healthCheck';

const logger = loggerFactory(import.meta.url);

/**
 * updates the permit thresholds based on needed Rwts for each commitment
 * @param boxes
 */
const updatePermitCheckThreshold = async (boxes: Boxes) => {
  const repoBox = await boxes.getRepoBox();
  const R6 = repoBox.register_value(6);
  if (!R6) {
    logger.warn('incorrect repo box format, repo R6 register is undefined.');
    return;
  }
  const commitmentRwt = R6.to_i64_str_array()[0];
  if (
    HealthCheckSingleton.getInstance().checkIfPermitCheckExists(commitmentRwt)
  ) {
    HealthCheckSingleton.getInstance().updatePermitHealthCheck(
      BigInt(getConfig().healthCheck.permitWarnCommitmentCount),
      BigInt(getConfig().healthCheck.permitCriticalCommitmentCount)
    );
  }
};

/**
 * updates permit health check parameters
 * Then updates all health check parameters status
 * @param boxes
 */
const healthCheckJob = async (boxes: Boxes) => {
  try {
    await updatePermitCheckThreshold(boxes);
    await HealthCheckSingleton.getInstance().updateParams();
  } catch (e) {
    logger.warn(`Health check job failed: ${e.message}`);
    logger.warn(e.stack);
  }
  setTimeout(
    () => healthCheckJob(boxes),
    getConfig().healthCheck.updateInterval * 1000
  );
};

export { healthCheckJob };
