import express, { Request, Response } from 'express';
import { watcherDatabase } from '../init';
import { stringifyQueryParam } from '../utils/utils';
import { DEFAULT_API_LIMIT, MAX_API_LIMIT } from '../config/constants';
import { ErgoUtils } from '../ergo/utils';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { Transaction } from './Transaction';
import { HttpStatus } from '../constants';
import { sendApiError } from '../errors/apiErrors/utils';
import { DefaultLogger } from '@rosen-bridge/abstract-logger';

const logger = DefaultLogger.getInstance().child(import.meta.url);
const revenueRouter = express.Router();

/**
 * Api for fetching revenues
 */
revenueRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      fromChain,
      toChain,
      sourceTxId,
      heightMin,
      heightMax,
      fromBlockTime,
      toBlockTime,
      sorting,
      offset,
      limit,
    } = req.query;

    const offsetString = stringifyQueryParam(offset);
    const limitString = stringifyQueryParam(limit);
    const wid = Transaction.watcherWID || '';
    const revenueRows = await watcherDatabase.getRevenuesWithFilters(
      wid,
      stringifyQueryParam(fromChain),
      stringifyQueryParam(toChain),
      stringifyQueryParam(sourceTxId),
      Number(heightMin),
      Number(heightMax),
      Number(fromBlockTime),
      Number(toBlockTime),
      stringifyQueryParam(sorting),
      offsetString === '' ? 0 : Number(offsetString),
      limitString === ''
        ? DEFAULT_API_LIMIT
        : Math.min(Number(limitString), MAX_API_LIMIT)
    );
    const tokens = await watcherDatabase.getRevenueTokens(
      revenueRows.items.map((item) => item.id)
    );
    const result = await ErgoUtils.extractRevenueFromView(
      revenueRows.items,
      tokens
    );

    res
      .status(HttpStatus.OK)
      .contentType('application/json')
      .send(JsonBigInt.stringify({ items: result, total: revenueRows.total }));
  } catch (e) {
    logger.warn(`An error occurred while fetching revenues: ${e}`);
    sendApiError(res, e);
  }
});

revenueRouter.get('/chart', async (req: Request, res: Response) => {
  try {
    const { period, offset, limit } = req.query;
    const periodString = stringifyQueryParam(period);
    const offsetString = stringifyQueryParam(offset);
    const limitString = stringifyQueryParam(limit);
    const finalOffset = offsetString === '' ? 0 : Number(offsetString);
    const finalLimit =
      limitString === ''
        ? DEFAULT_API_LIMIT
        : Math.min(Number(limitString), MAX_API_LIMIT);

    let queryResult;
    const wid = Transaction.watcherWID || '';
    if (periodString === 'week') {
      queryResult = await watcherDatabase.getWeeklyRevenueChartData(
        wid,
        finalOffset,
        finalLimit
      );
    } else if (periodString === 'month' || periodString === 'year') {
      queryResult = await watcherDatabase.getRevenueChartData(
        wid,
        periodString,
        finalOffset,
        finalLimit
      );
    } else {
      throw new Error('Invalid period');
    }
    const result = await ErgoUtils.transformChartData(queryResult);
    res.set('Content-Type', 'application/json');
    res.status(HttpStatus.OK).send(result);
  } catch (e) {
    logger.warn(`An error occurred while fetching revenues chart data: ${e}`);
    sendApiError(res, e);
  }
});

export default revenueRouter;
