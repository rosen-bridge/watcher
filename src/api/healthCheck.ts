import express from 'express';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { loggerFactory } from '../log/Logger';
import { healthCheck } from '../../src/utils/healthCheck';

const logger = loggerFactory(import.meta.url);
const healthRouter = express.Router();

/**
 * Api for detailed health status
 */
healthRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.status(200).json(await healthCheck.getHealthStatus());
  } catch (e) {
    logger.warn(`An error occurred while checking health status: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export { healthRouter };
