import { Request, Response, Router } from 'express';
import { ApiResponse, Transaction } from './Transaction';
import { body, validationResult } from 'express-validator';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const permitRouter = Router();

/**
 * Api for creating permit in exchange of RSN
 * @param count {number} the amount of RSN to change into permit
 */
permitRouter.post(
  '',
  body('count').notEmpty().withMessage('key count is required!').isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const RSNCount = req.body.count;
      const watcherTransaction = Transaction.getInstance();
      const response: ApiResponse = await watcherTransaction.getPermit(
        BigInt(RSNCount)
      );
      if (response.status === 200) {
        res.status(200).send({ txId: response.response });
      } else {
        res.status(response.status).send({ message: response.response });
      }
    } catch (e) {
      logger.warn(`An error occurred while locking RSN: ${e}`);
      res.status(500).send({ message: e.message });
    }
  }
);

/**
 * Api for returning permit and return the RSN to user
 * @param count {number} the amount of RWT (permit) to return
 */
permitRouter.post(
  '/return',
  body('count').notEmpty().withMessage('key count is required!').isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const RWTCount = req.body.count;
      const watcherTransaction = Transaction.getInstance();
      const response: ApiResponse = await watcherTransaction.returnPermit(
        BigInt(RWTCount)
      );
      if (response.status === 200) {
        res.status(200).send({ txId: response.response });
      } else {
        res.status(response.status).send({ message: response.response });
      }
    } catch (e) {
      logger.warn(`An error occurred while locking RSN: ${e}`);
      res.status(500).send({ message: e.message });
    }
  }
);

export default permitRouter;
