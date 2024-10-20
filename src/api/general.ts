import express, { Request, Response } from 'express';
import { getConfig } from '../config/config';
import { JsonBI } from '../ergo/network/parser';
import { ErgoUtils } from '../ergo/utils';
import { HealthCheckSingleton } from '../../src/utils/healthCheck';
import { Transaction } from './Transaction';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import packageJson from '../../package.json' assert { type: 'json' };
import { ERGO_CHAIN_NAME, ERGO_NATIVE_ASSET } from '../config/constants';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

interface GeneralInfo {
  versions: {
    app: string;
    contract: string;
    tokensMap: string;
  };
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
    const tokenMap = getConfig().token.tokenMap;
    const collateral = await Transaction.getInstance().getCollateral();
    const info: GeneralInfo = {
      versions: {
        app: packageJson.version,
        contract: getConfig().rosen.contractVersion,
        tokensMap: getConfig().token.version,
      },
      currentBalance: tokenMap.wrapAmount(
        ERGO_NATIVE_ASSET,
        (await ErgoUtils.getWatcherBalance()).nanoErgs,
        ERGO_CHAIN_NAME
      ).amount,
      network: getConfig().general.networkWatcher,
      permitsPerEvent:
        await Transaction.getInstance().getRequiredPermitsCountPerEvent(),
      permitCount: {
        active: tokenMap.wrapAmount(
          getConfig().rosen.RWTId,
          await ErgoUtils.getPermitCount(getConfig().rosen.RWTId),
          ERGO_CHAIN_NAME
        ).amount,
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
