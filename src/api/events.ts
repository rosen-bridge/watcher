import express from 'express';
import { watcherDatabase } from '../init';
import { DEFAULT_API_LIMIT, MAX_API_LIMIT } from '../config/constants';
import { stringifyQueryParam } from '../utils/utils';
import { ErgoUtils } from '../ergo/utils';
import { JsonBI } from '../ergo/network/parser';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);
const eventsRouter = express.Router();

/**
 * Api for fetching events
 */
eventsRouter.get('/', async (req, res) => {
  try {
    const {
      fromAddress,
      toAddress,
      sourceTokenId,
      sourceTxId,
      eventStatus,
      sorting,
      offset,
      limit,
    } = req.query;
    const offsetString = stringifyQueryParam(offset);
    const limitString = stringifyQueryParam(limit);

    const result = await watcherDatabase.getEventsWithFilters(
      stringifyQueryParam(fromAddress),
      stringifyQueryParam(toAddress),
      stringifyQueryParam(sourceTokenId),
      stringifyQueryParam(sourceTxId),
      stringifyQueryParam(eventStatus),
      stringifyQueryParam(sorting),
      offsetString === '' ? 0 : Number(offsetString),
      limitString === ''
        ? DEFAULT_API_LIMIT
        : Math.min(Number(limitString), MAX_API_LIMIT)
    );
    res.set('Content-Type', 'application/json');
    res
      .status(200)
      .send(JsonBI.stringify(ErgoUtils.fillTokenDetailsInEvents(result)));
  } catch (e) {
    logger.warn(`An error occurred while fetching events: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

/**
 * Api for fetching events status
 */
eventsRouter.post('/status', async (req, res) => {
  try {
    const eventIds = req.body as Array<number>;
    if (eventIds.length > MAX_API_LIMIT) {
      throw new Error(
        `Number of eventIds should be less than ${MAX_API_LIMIT}`
      );
    }
    const result = await watcherDatabase.getEventsStatus(eventIds);

    // creating the response
    const response: {
      [key: number]: string;
    } = {};
    result.forEach((eventStatus) => {
      response[eventStatus.id] = eventStatus.status;
    });

    res.status(200).send(response);
  } catch (e) {
    logger.warn(`An error occurred while fetching events status: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default eventsRouter;
