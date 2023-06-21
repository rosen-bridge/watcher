import { loggerFactory } from '../log/Logger';
import express, { Request, Response } from 'express';
import { getConfig } from '../config/config';
import { JsonBI } from '../ergo/network/parser';
import { ErgoUtils } from '../ergo/utils';
import { getHealthCheck } from '../utils/healthCheck';

const logger = loggerFactory(import.meta.url);

interface GeneralInfo {
  currentBalance: bigint;
  network: string;
  permitCount: bigint;
  health: string;
  address: string;
}

const generalRouter = express.Router();

/**
 * Api for fetching general info of the watcher
 */
generalRouter.get('/', async (req: Request, res: Response) => {
  try {
    const info: GeneralInfo = {
      currentBalance: (await ErgoUtils.getWatcherBalance()).nanoErgs,
      network: getConfig().general.networkWatcher,
      permitCount: await ErgoUtils.getPermitCount(getConfig().rosen.RWTId),
      health: (await getHealthCheck().getOverallHealthStatus()).status,
      address: getConfig().general.address,
    };
    res.set('Content-Type', 'application/json');
    res.status(200).send(JsonBI.stringify(info));
  } catch (e) {
    logger.warn(`An error occurred while fetching general info: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default generalRouter;
