import { loggerFactory } from '../log/Logger';
import express from 'express';
import { watcherDatabase } from '../init';
import { stringifyQueryParam } from '../utils/utils';
import { DEFAULT_API_LIMIT, MAX_API_LIMIT } from '../config/constants';
import { ErgoUtils } from '../ergo/utils';
import { JsonBI } from '../ergo/network/parser';

const logger = loggerFactory(import.meta.url);
const revenueRouter = express.Router();

/**
 * Api for fetching revenues
 */
revenueRouter.get('/', async (req, res) => {
  try {
    const {
      fromChain,
      toChain,
      tokenId,
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

    const queryResult = await watcherDatabase.getRevenuesWithFilters(
      stringifyQueryParam(fromChain),
      stringifyQueryParam(toChain),
      stringifyQueryParam(tokenId),
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
    const result = await ErgoUtils.extractRevenueFromView(queryResult);
    res.set('Content-Type', 'application/json');
    res.status(200).send(JsonBI.stringify(result));
  } catch (e) {
    logger.warn(`An error occurred while fetching revenues: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

revenueRouter.get('/chart', async (req, res) => {
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
    if (periodString === 'week') {
      queryResult = await watcherDatabase.getWeeklyRevenueChartData(
        finalOffset,
        finalLimit
      );
    } else if (periodString === 'month' || periodString === 'year') {
      queryResult = await watcherDatabase.getRevenueChartData(
        periodString,
        finalOffset,
        finalLimit
      );
    } else {
      throw new Error('Invalid period');
    }
    const result = ErgoUtils.transformChartData(queryResult);
    res.set('Content-Type', 'application/json');
    res.status(200).send(result);
  } catch (e) {
    logger.warn(`An error occurred while fetching revenues chart data: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default revenueRouter;
