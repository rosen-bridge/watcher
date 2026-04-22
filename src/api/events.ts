import express, { Request, Response } from 'express';
import { watcherDatabase } from '../init';
import { DEFAULT_API_LIMIT, MAX_API_LIMIT } from '../config/constants';
import { stringifyQueryParam } from '../utils/utils';
import { ErgoUtils } from '../ergo/utils';
import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { HttpStatus } from '../constants';
import { sendApiError } from '../errors/apiErrors/utils';

const logger = DefaultLogger.getInstance().child(import.meta.url);
const eventsRouter = express.Router();

/**
 * Api for fetching events
 */
eventsRouter.get('/', async (req: Request, res: Response) => {
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
      .status(HttpStatus.OK)
      .send(JsonBigInt.stringify(ErgoUtils.fillTokenDetailsInEvents(result)));
  } catch (e) {
    logger.warn(`An error occurred while fetching events: ${e}`);
    sendApiError(res, e);
  }
});

/**
 * Api for fetching events status
 */
eventsRouter.post('/status', async (req: Request, res: Response) => {
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

    res.status(HttpStatus.OK).send(response);
  } catch (e) {
    logger.warn(`An error occurred while fetching events status: ${e}`);
    sendApiError(res, e);
  }
});

export default eventsRouter;
