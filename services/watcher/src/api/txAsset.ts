import express from 'express';

import { loggerFactory } from '../log/Logger';
import { JsonBI } from '../ergo/network/parser';
import { Transaction } from './Transaction';
import { TokenInfo } from '../ergo/interfaces';
import {
  ERGO_DECIMALS,
  ERGO_NATIVE_ASSET,
  ERGO_NATIVE_ASSET_NAME,
} from '../config/constants';
import { getConfig } from '../config/config';
import { ErgoUtils } from '../ergo/utils';
import { stringifyQueryParam } from '../utils/utils';

const logger = loggerFactory(import.meta.url);
const txAssetRouter = express.Router();

/**
 * Api for fetching lock tx assets
 */
txAssetRouter.get('/lock', async (req, res) => {
  try {
    const { rsnCount } = req.query;
    const rsnCountBigInt = BigInt(stringifyQueryParam(rsnCount));
    const spendingAssets: Array<TokenInfo> = [];
    const receivingAssets: Array<TokenInfo> = [];
    const collateral = await Transaction.getInstance().getCollateral();
    // Add spending ERG
    spendingAssets.push({
      amount:
        BigInt(getConfig().general.fee) +
        (Transaction.watcherWID ? 0n : BigInt(collateral.erg)),
      tokenId: ERGO_NATIVE_ASSET,
      decimals: ERGO_DECIMALS,
      name: ERGO_NATIVE_ASSET_NAME,
      isNative: true,
    });
    // Add spending Tokens
    const spendingTokens = await ErgoUtils.fillTokensDetails([
      {
        tokenId: getConfig().rosen.RSN,
        amount:
          rsnCountBigInt +
          (Transaction.watcherWID ? 0n : BigInt(collateral.rsn)),
      },
    ]);
    spendingTokens.forEach((token) => spendingAssets.push(token));
    // Add receiving Tokens
    const receivingTokens = await ErgoUtils.fillTokensDetails([
      {
        tokenId: getConfig().rosen.RWTId,
        amount: rsnCountBigInt,
      },
    ]);
    receivingTokens.forEach((token) => receivingAssets.push(token));

    res
      .status(200)
      .contentType('application/json')
      .send(
        JsonBI.stringify({
          spendingAssets: spendingAssets,
          receivingAssets: receivingAssets,
        })
      );
  } catch (e) {
    logger.warn(`An error occurred while fetching revenues: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

/**
 * Api for fetching unlock tx assets
 */
txAssetRouter.get('/unlock', async (req, res) => {
  try {
    if (!Transaction.watcherWID) throw Error("You don't have wid yet.");
    const { rsnCount } = req.query;
    const rsnCountBigInt = BigInt(stringifyQueryParam(rsnCount));
    const spendingAssets: Array<TokenInfo> = [];
    const receivingAssets: Array<TokenInfo> = [];
    // Add spending ERG
    spendingAssets.push({
      amount: BigInt(getConfig().general.fee),
      tokenId: ERGO_NATIVE_ASSET,
      decimals: ERGO_DECIMALS,
      name: ERGO_NATIVE_ASSET_NAME,
      isNative: true,
    });
    // Add spending Tokens
    const spendingTokens = await ErgoUtils.fillTokensDetails([
      {
        tokenId: getConfig().rosen.RWTId,
        amount: rsnCountBigInt,
      },
    ]);
    spendingTokens.forEach((token) => spendingAssets.push(token));

    // Add receiving ERG
    const isFullReturn =
      rsnCountBigInt == (await Transaction.getInstance().getTotalPermit());
    const collateral = await Transaction.getInstance().getWidCollateral(
      Transaction.watcherWID
    );
    if (isFullReturn)
      receivingAssets.push({
        amount: collateral.erg,
        tokenId: ERGO_NATIVE_ASSET,
        decimals: ERGO_DECIMALS,
        name: ERGO_NATIVE_ASSET_NAME,
        isNative: true,
      });
    // Add receiving Tokens
    const receivingTokens = await ErgoUtils.fillTokensDetails([
      {
        tokenId: getConfig().rosen.RSN,
        amount: rsnCountBigInt + (isFullReturn ? BigInt(collateral.rsn) : 0n),
      },
    ]);
    receivingTokens.forEach((token) => receivingAssets.push(token));

    res
      .status(200)
      .contentType('application/json')
      .send(
        JsonBI.stringify({
          spendingAssets: spendingAssets,
          receivingAssets: receivingAssets,
        })
      );
  } catch (e) {
    logger.warn(`An error occurred while fetching revenues: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default txAssetRouter;
