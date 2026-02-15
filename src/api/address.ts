import express, { Request, Response } from 'express';
import { getConfig } from '../config/config';
import { validationResult } from 'express-validator';
import { generateSK } from '../utils/utils';
import { ErgoUtils } from '../ergo/utils';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { ERGO_CHAIN_NAME, ERGO_NATIVE_ASSET } from '../config/constants';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { TokensConfig } from '../config/tokensConfig';
import { validateAddress } from '@rosen-bridge/address-codec';
import { ApiError, ApiValidationError } from '../errors/apiErrors';
import { HttpStatus } from '../constants';
import { sendApiError } from 'src/errors/apiErrors/utils';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

const addressRouter = express.Router();

/**
 * Api for generating secret key
 */
addressRouter.get('/generate', async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiValidationError(errors);
    }
    res
      .status(HttpStatus.OK)
      .json(generateSK(getConfig().general.networkPrefix));
  } catch (e) {
    logger.warn(`An error occurred while generating secret key: ${e}`);
    sendApiError(res, e);
  }
});

/**
 * Api for fetching assets
 */
addressRouter.get('/assets', async (req: Request, res: Response) => {
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      throw new ApiValidationError(errors);
    }
    const balance = await ErgoUtils.getWatcherBalance();
    let tokens = balance.tokens;
    if (!tokens.some((item) => item.tokenId === getConfig().rosen.RSN)) {
      tokens.push({ amount: 0n, tokenId: getConfig().rosen.RSN });
    }
    if (!tokens.some((item) => item.tokenId === getConfig().rosen.eRSN)) {
      tokens.push({ amount: 0n, tokenId: getConfig().rosen.eRSN });
    }
    tokens = await ErgoUtils.fillTokensDetails(tokens);
    tokens.push({
      amount: balance.nanoErgs,
      tokenId: ERGO_NATIVE_ASSET,
      name: ERGO_NATIVE_ASSET,
      isNativeToken: true,
    });
    const tokenMap = TokensConfig.getInstance().getTokenMap();
    tokens = tokens.map((token) => {
      const wrappedToken = tokenMap.wrapAmount(
        token.tokenId,
        token.amount,
        ERGO_CHAIN_NAME
      );
      const significantDecimal = tokenMap.getSignificantDecimals(token.tokenId);
      return {
        ...token,
        amount: wrappedToken.amount,
        decimals:
          significantDecimal != undefined ? significantDecimal : token.decimals,
      };
    });
    const { tokenId, tokenName, sortByAmount } = req.query;
    if (tokenId) {
      tokens = tokens.filter((token) => token.tokenId === (tokenId as string));
    } else if (tokenName) {
      tokens = tokens.filter((token) =>
        token.name?.toLowerCase()?.includes((tokenName as string).toLowerCase())
      );
    }
    if (sortByAmount) {
      tokens = tokens.sort((a, b) =>
        Number(
          (sortByAmount.toString().toLowerCase() === 'desc' ? -1n : 1n) *
            (a.amount - b.amount)
        )
      );
    } else {
      // erg size it shorter than all token ids (64 character).
      // so sorting according to size then tokenId.
      tokens = tokens.sort((a, b) =>
        a.tokenId.length == b.tokenId.length
          ? a.tokenId.localeCompare(b.tokenId)
          : a.tokenId.length - b.tokenId.length
      );
    }
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const total = tokens.length;
    tokens = tokens.slice(offset, offset + limit);

    res
      .status(HttpStatus.OK)
      .send(JsonBigInt.stringify({ items: tokens, total }));
  } catch (e) {
    logger.warn(`An error occurred while fetching assets: ${e}`);
    sendApiError(res, e);
  }
});

/**
 * Api for validating Ergo addresses
 */
addressRouter.get('/validate/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    if (!address) {
      throw new ApiError('Address is required', HttpStatus.BAD_REQUEST);
    }

    validateAddress(ERGO_CHAIN_NAME, address);
    res.status(HttpStatus.OK).json({ valid: true });
  } catch (e) {
    logger.warn(`An error occurred while validating address: ${e}`);
    sendApiError(res, e);
  }
});

export default addressRouter;
