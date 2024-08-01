import { getConfig } from '../config/config';
import { Boxes } from '../../src/ergo/boxes';
import { HealthCheckSingleton } from '../../src/utils/healthCheck';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { ERGO_CHAIN_NAME } from '../config/constants';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

/**
 * updates the permit thresholds based on needed Rwts for each commitment
 * @param boxes
 */
const updatePermitCheckThreshold = async (boxes: Boxes) => {
  const repoBox = await boxes.getRepoConfigBox();
  const R4 = repoBox.register_value(4);
  if (!R4) {
    logger.warn(
      'incorrect repo config box format, repo config R4 register is undefined.'
    );
    return;
  }
  const tokenMap = getConfig().token.tokenMap;
  const commitmentRwt = tokenMap.unwrapAmount(
    getConfig().rosen.RWTId,
    BigInt(R4.to_i64_str_array()[0]),
    ERGO_CHAIN_NAME
  ).amount;
  if (
    HealthCheckSingleton.getInstance().checkIfPermitCheckExists(commitmentRwt)
  ) {
    HealthCheckSingleton.getInstance().updatePermitHealthCheck(commitmentRwt);
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
