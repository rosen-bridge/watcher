import express from 'express';
import { watcherDatabase } from '../init';
import { DEFAULT_API_LIMIT, MAX_API_LIMIT } from '../config/constants';
import { stringifyQueryParam } from '../utils/utils';
import { ErgoUtils } from '../ergo/utils';
import { JsonBI } from '../ergo/network/parser';
import { TxStatus } from '../database/entities/observationStatusEntity';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);
const observationRouter = express.Router();

/**
 * Api for fetching observations
 */
observationRouter.get('/', async (req, res) => {
  try {
    const {
      fromAddress,
      toAddress,
      minHeight,
      maxHeight,
      sourceTokenId,
      sourceTxId,
      sorting,
      offset,
      limit,
    } = req.query;

    const offsetString = stringifyQueryParam(offset);
    const limitString = stringifyQueryParam(limit);

    const result = await watcherDatabase.getObservationWithFilters(
      stringifyQueryParam(fromAddress),
      stringifyQueryParam(toAddress),
      Number(minHeight),
      Number(maxHeight),
      stringifyQueryParam(sourceTokenId),
      stringifyQueryParam(sourceTxId),
      stringifyQueryParam(sorting),
      offsetString === '' ? 0 : Number(offsetString),
      limitString === ''
        ? DEFAULT_API_LIMIT
        : Math.min(Number(limitString), MAX_API_LIMIT)
    );
    const statusMap = new Map<number, string>();
    (
      await watcherDatabase.getObservationsStatus(
        result.items.map((item) => item.id)
      )
    ).forEach((item) => statusMap.set(item.observation.id, item.status));
    result.items = result.items.map((item) => {
      return {
        ...item,
        status: statusMap.get(item.id) || TxStatus.NOT_COMMITTED,
      };
    });
    res.set('Content-Type', 'application/json');
    res
      .status(200)
      .send(JsonBI.stringify(ErgoUtils.fillTokenDetailsInEvents(result)));
  } catch (e) {
    logger.warn(`An error occurred while fetching observations: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default observationRouter;
