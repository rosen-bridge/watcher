import express, { Request, Response } from 'express';
import { getConfig } from '../config/config';
import { validationResult, check } from 'express-validator';
import { generateSK } from '../utils/utils';
import { loggerFactory } from '../log/Logger';
import { watcherDatabase } from '../init';
import { ErgoUtils } from '../ergo/utils';
import { JsonBI } from '../ergo/network/parser';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';

const logger = loggerFactory(import.meta.url);

const addressRouter = express.Router();

/**
 * Api for generating secret key
 */
addressRouter.get('/generate', async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.status(200).json(generateSK(getConfig().general.networkPrefix));
  } catch (e) {
    logger.warn(`An error occurred while generating secret key: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

/**
 * Api for fetching assets
 */
addressRouter.post(
  '/assets',
  [
    check('tokenId').optional().isString(),
    check('tokenName').optional().isString(),
    check('sortByAmount').optional().isBoolean(),
    check('limit').optional().isNumeric(),
    check('skip').optional().isNumeric(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let tokens = (await ErgoUtils.getWatcherBalance()).tokens;
      const { tokenId, tokenName, sortByAmount, limit, skip } = req.body;
      if (tokenId) {
        tokens = tokens.filter((token) => token.tokenId === tokenId);
      }
      if (tokenName) {
        tokens = tokens.filter((token) => token.name?.includes(tokenName));
      }
      if (sortByAmount === true) {
        tokens = tokens.sort((a, b) => {
          if (a.amount < b.amount) {
            return 1;
          }
          if (a.amount > b.amount) {
            return -1;
          }
          return 0;
        });
      } else {
        tokens = tokens.sort((a, b) => a.tokenId.localeCompare(b.tokenId));
      }
      if (skip) {
        tokens = tokens.slice(skip);
      }
      if (limit) {
        tokens = tokens.slice(0, limit);
      }
      tokens = await ErgoUtils.placeTokenNames(tokens);
      res.status(200).send(JsonBI.stringify(tokens));
    } catch (e) {
      logger.warn(`An error occurred while fetching assets: ${e}`);
      res.status(500).send({ message: e.message });
    }
  }
);

export default addressRouter;
