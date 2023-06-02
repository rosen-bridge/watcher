import express from 'express';
import { loggerFactory } from '../log/Logger';
import { watcherDatabase } from '../init';
import { DEFAULT_API_LIMIT, MAX_API_LIMIT } from '../config/constants';

const logger = loggerFactory(import.meta.url);
const eventsRouter = express.Router();

const stringifyQueryParam = (param: any) => {
  if (param === undefined) return '';
  return String(param);
};

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
    res.status(200).send(result);
  } catch (e) {
    logger.warn(`An error occurred while fetching events: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default eventsRouter;
