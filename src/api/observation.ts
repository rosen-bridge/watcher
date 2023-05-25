import express from 'express';
import { loggerFactory } from '../log/Logger';
import { watcherDatabase } from '../init';

const logger = loggerFactory(import.meta.url);
const observationRouter = express.Router();

const stringifyQueryParam = (param: any) => {
  if (param === undefined) return '';
  return String(param);
};

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
      offsetString === '' ? 0 : Number(offsetString),
      limitString === '' ? 20 : Math.min(Number(limitString), 100)
    );
    res.status(200).json(result);
  } catch (e) {
    logger.warn(`An error occurred while fetching observations: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default observationRouter;
