import { Request, Response, Router } from 'express';
import { ApiResponse, Transaction } from './Transaction';
import { body, validationResult } from 'express-validator';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { authenticateKey } from './authentication';
import { getConfig } from '../config/config';
import { ERGO_CHAIN_NAME } from '../config/constants';
import { TokensConfig } from '../config/tokensConfig';
import { ApiError, ApiValidationError } from '../errors/apiErrors';
import { HttpStatus } from '../constants';
import { sendApiError } from 'src/errors/apiErrors/utils';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

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
        throw new ApiValidationError(errors);
      }
      const tokenMap = TokensConfig.getInstance().getTokenMap();
      const RSNCount = tokenMap.unwrapAmount(
        getConfig().rosen.RSN,
        BigInt(req.body.count),
        ERGO_CHAIN_NAME
      ).amount;
      const watcherTransaction = Transaction.getInstance();
      const response: ApiResponse = await watcherTransaction.getPermit(
        RSNCount
      );
      if (response.status === HttpStatus.OK) {
        res.status(HttpStatus.OK).send({ txId: response.response });
      } else {
        res.status(response.status).send({ message: response.response });
      }
    } catch (e) {
      if (!(e instanceof ApiError)) {
        logger.warn(`An error occurred while locking RSN: ${e}`);
        sendApiError(res, e);
      }
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
        throw new ApiValidationError(errors);
      }
      const tokenMap = TokensConfig.getInstance().getTokenMap();
      const RWTCount = tokenMap.unwrapAmount(
        getConfig().rosen.RWTId,
        BigInt(req.body.count),
        ERGO_CHAIN_NAME
      ).amount;
      const watcherTransaction = Transaction.getInstance();
      const response: ApiResponse = await watcherTransaction.returnPermit(
        RWTCount
      );
      if (response.status === HttpStatus.OK) {
        res.status(HttpStatus.OK).send({ txId: response.response });
      } else {
        res.status(response.status).send({ message: response.response });
      }
    } catch (e) {
      if (!(e instanceof ApiError)) {
        logger.warn(`An error occurred while returning permits: ${e}`);
        sendApiError(res, e);
      }
    }
  }
);

export default permitRouter;
