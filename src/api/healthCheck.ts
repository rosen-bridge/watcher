import express from 'express';
import { Request, Response } from 'express';
import { stringifyQueryParam } from '../utils/utils';
import { HealthCheckSingleton } from '../utils/healthCheck';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);
const healthRouter = express.Router();

/**
 * Api for detailed health status
 */
healthRouter.get('/status', async (req: Request, res: Response) => {
  try {
    res.status(200).json(await HealthCheckSingleton.getInstance().getStatus());
  } catch (e) {
    logger.warn(`An error occurred while checking health status: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

/**
 * Api for checking each health parameter status
 */
healthRouter.get(
  '/parameter/:paramName',
  async (req: Request, res: Response) => {
    try {
      res
        .status(200)
        .json(
          await HealthCheckSingleton.getInstance().getParamStatus(
            req.params.paramName
          )
        );
    } catch (e) {
      logger.warn(
        `An error occurred while checking parameter [${req.query}] health status: ${e}`
      );
      res.status(500).send({ message: e.message });
    }
  }
);

/**
 * Api for updating each parameter health status
 */
healthRouter.put(
  '/parameter/:paramName',
  async (req: Request, res: Response) => {
    try {
      const healthCheck = HealthCheckSingleton.getInstance();
      await healthCheck.updateParam(stringifyQueryParam(req.params.paramName));
      res
        .status(200)
        .json(
          await healthCheck.getParamStatus(
            stringifyQueryParam(req.params.paramName)
          )
        );
    } catch (e) {
      logger.warn(
        `An error occurred while updating parameter [${req.query}] health status: ${e}`
      );
      res.status(500).send({ message: e.message });
    }
  }
);

export { healthRouter };
