import { loggerFactory } from '../log/Logger';
import { HealthCheck } from '@rosen-bridge/health-check';
import { getHealthCheck } from '../utils/healthCheck';
import { getConfig } from '../config/config';

const logger = loggerFactory(import.meta.url);

const healthCheckUpdateJob = async (healthCheck: HealthCheck) => {
  try {
    await healthCheck.update();
  } catch (e) {
    logger.warn(
      `Health check update job failed for , ${e.message}, ${e.stack}`
    );
  }
  setTimeout(
    () => healthCheckUpdateJob(healthCheck),
    getConfig().healthCheck.updateInterval * 1000
  );
};

const healthCheckStart = () => {
  healthCheckUpdateJob(getHealthCheck());
};

export { healthCheckStart };
