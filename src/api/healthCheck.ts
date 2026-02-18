import express, { Request, Response } from 'express';
import { stringifyQueryParam } from '../utils/utils';
import { HealthCheckSingleton } from '../utils/healthCheck';
import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { HttpStatus } from '../constants';
import { sendApiError } from '../errors/apiErrors/utils';

const logger = DefaultLogger.getInstance().child(import.meta.url);
const healthRouter = express.Router();

/**
 * Api for detailed health status
 */
healthRouter.get('/status', async (req: Request, res: Response) => {
  try {
    res
      .status(HttpStatus.OK)
      .json(await HealthCheckSingleton.getInstance().getStatus());
  } catch (e) {
    logger.warn(`An error occurred while checking health status: ${e}`);
    sendApiError(res, e);
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
        .status(HttpStatus.OK)
        .json(
          await HealthCheckSingleton.getInstance().getParamStatus(
            req.params.paramName
          )
        );
    } catch (e) {
      logger.warn(
        `An error occurred while checking parameter [${req.query}] health status: ${e}`
      );
      sendApiError(res, e);
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
        .status(HttpStatus.OK)
        .json(
          await healthCheck.getParamStatus(
            stringifyQueryParam(req.params.paramName)
          )
        );
    } catch (e) {
      logger.warn(
        `An error occurred while updating parameter [${req.query}] health status: ${e}`
      );
      sendApiError(res, e);
    }
  }
);

export { healthRouter };
