import { Request, Response, Router } from 'express';
import { ApiResponse, Transaction } from './Transaction';
import { body, validationResult } from 'express-validator';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { authenticateKey } from './authentication';
import { getConfig } from '../config/config';
import { ERGO_CHAIN_NAME } from '../config/constants';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const permitRouter = Router();

/**
 * Api for creating permit in exchange of RSN
 * @param count {number} the amount of RSN to change into permit
 */
permitRouter.post(
  '',
  authenticateKey,
  body('count').notEmpty().withMessage('key count is required!').isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tokenMap = getConfig().token.tokenMap;
      const RSNCount = tokenMap.unwrapAmount(
        getConfig().rosen.RSN,
        BigInt(req.body.count),
        ERGO_CHAIN_NAME
      ).amount;
      const watcherTransaction = Transaction.getInstance();
      const response: ApiResponse = await watcherTransaction.getPermit(
        RSNCount
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
  authenticateKey,
  body('count').notEmpty().withMessage('key count is required!').isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tokenMap = getConfig().token.tokenMap;
      const RWTCount = tokenMap.unwrapAmount(
        getConfig().rosen.RWTId,
        BigInt(req.body.count),
        ERGO_CHAIN_NAME
      ).amount;
      const watcherTransaction = Transaction.getInstance();
      const response: ApiResponse = await watcherTransaction.returnPermit(
        RWTCount
      );
      if (response.status === 200) {
        res.status(200).send({ txId: response.response });
      } else {
        res.status(response.status).send({ message: response.response });
      }
    } catch (e) {
      logger.warn(`An error occurred while returning permits: ${e}`);
      res.status(500).send({ message: e.message });
    }
  }
);

export default permitRouter;
