import express, { Request, Response } from 'express';
import { getConfig } from '../config/config';
import { JsonBI } from '../ergo/network/parser';
import { ErgoUtils } from '../ergo/utils';
import { HealthCheckSingleton } from '../../src/utils/healthCheck';
import { Transaction } from './Transaction';
import WinstonLogger from '@rosen-bridge/winston-logger';
import packageJson from '../../package.json' assert { type: 'json' };

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

interface GeneralInfo {
  version: string;
  currentBalance: bigint;
  network: string;
  permitsPerEvent: bigint;
  permitCount: {
    active: bigint;
    total: bigint;
  };
  health: {
    status: string;
    trialErrors: string[];
  };
  address: string;
  rsnTokenId: string;
  eRsnTokenId: string;
  collateral: {
    erg: bigint;
    rsn: bigint;
  };
}

const generalRouter = express.Router();

/**
 * Api for fetching general info of the watcher
 */
generalRouter.get('/', async (req: Request, res: Response) => {
  try {
    const collateral = await Transaction.getInstance().getCollateral();
    const info: GeneralInfo = {
      version: packageJson.version,
      currentBalance: (await ErgoUtils.getWatcherBalance()).nanoErgs,
      network: getConfig().general.networkWatcher,
      permitsPerEvent:
        await Transaction.getInstance().getRequiredPermitsCountPerEvent(),
      permitCount: {
        active: await ErgoUtils.getPermitCount(getConfig().rosen.RWTId),
        total: await Transaction.getInstance().getTotalPermit(),
      },
      health: {
        status: await HealthCheckSingleton.getInstance().getOverallStatus(),
        trialErrors: await HealthCheckSingleton.getInstance().getTrialErrors(),
      },
      address: getConfig().general.address,
      rsnTokenId: getConfig().rosen.RSN,
      eRsnTokenId: getConfig().rosen.eRSN,
      collateral: {
        erg: collateral.erg,
        rsn: collateral.rsn,
      },
    };
    res.set('Content-Type', 'application/json');
    res.status(200).send(JsonBI.stringify(info));
  } catch (e) {
    logger.warn(`An error occurred while fetching general info: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default generalRouter;
