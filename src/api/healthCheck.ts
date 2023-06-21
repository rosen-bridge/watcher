import express from 'express';
import { Request, Response } from 'express';
import { loggerFactory } from '../log/Logger';
import { healthCheck } from '../utils/healthCheck';
import { stringifyQueryParam } from '../utils/utils';

const logger = loggerFactory(import.meta.url);
const healthRouter = express.Router();

/**
 * Api for detailed health status
 */
healthRouter.get('/status', async (req: Request, res: Response) => {
  try {
    res.status(200).json(await healthCheck.getHealthStatus());
  } catch (e) {
    logger.warn(`An error occurred while checking health status: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

/**
 * Api for checking each health parameter status
 */
healthRouter.get('/parameter/status', async (req: Request, res: Response) => {
  try {
    const { paramId } = req.query;
    res
      .status(200)
      .json(await healthCheck.getHealthStatusFor(stringifyQueryParam(paramId)));
  } catch (e) {
    logger.warn(
      `An error occurred while checking parameter [${req.query}] health status: ${e}`
    );
    res.status(500).send({ message: e.message });
  }
});

/**
 * Api for updating each parameter health status
 */
healthRouter.get('/parameter/update', async (req: Request, res: Response) => {
  try {
    const { paramId } = req.query;
    await healthCheck.updateParam(stringifyQueryParam(paramId));
    res
      .status(200)
      .json(await healthCheck.getHealthStatusFor(stringifyQueryParam(paramId)));
  } catch (e) {
    logger.warn(
      `An error occurred while updating parameter [${req.query}] health status: ${e}`
    );
    res.status(500).send({ message: e.message });
  }
});

export { healthRouter };
