import {
  CardanoKoiosScannerHealthCheck,
  CardanoOgmiosScannerHealthCheck,
  ErgoExplorerAssetHealthCheckParam,
  ErgoExplorerScannerHealthCheck,
  ErgoNodeAssetHealthCheckParam,
  ErgoNodeScannerHealthCheck,
  ErgoNodeSyncHealthCheckParam,
  ExplorerPermitHealthCheckParam,
  ExplorerWidHealthCheckParam,
  HealthCheck,
  HealthStatusLevel,
  LogLevelHealthCheck,
  NodePermitHealthCheckParam,
  NodeWidHealthCheckParam,
} from '@rosen-bridge/health-check';
import { getConfig } from '../config/config';
import { dataSource } from '../../config/dataSource';
import {
  CARDANO_WATCHER,
  OGMIOS_TYPE,
  KOIOS_TYPE,
  NODE_TYPE,
  EXPLORER_TYPE,
  ERGO_NATIVE_ASSET,
} from '../config/constants';
import { loggerFactory } from '../log/Logger';
import { scanner } from './scanner';
import { AbstractPermitHealthCheckParam } from '@rosen-bridge/health-check/dist/lib/params/permitHealthCheck/AbstractPermitHealthCheck';
import { Transaction } from '../../src/api/Transaction';

const logger = loggerFactory(import.meta.url);
let healthCheck: HealthCheck | undefined;
let permitHealthCheckParam: AbstractPermitHealthCheckParam | undefined;

const getHealthCheck = (): HealthCheck => {
  if (healthCheck === undefined) {
    healthCheck = new HealthCheck();

    const errorLogHealthCheck = new LogLevelHealthCheck(
      logger,
      HealthStatusLevel.UNSTABLE,
      getConfig().healthCheck.errorLogAllowedCount,
      getConfig().healthCheck.errorLogDuration,
      'error'
    );
    healthCheck.register(errorLogHealthCheck);

    if (getConfig().general.scannerType === NODE_TYPE) {
      const widHealthCheck = new NodeWidHealthCheckParam(
        getConfig().rosen.RWTRepoAddress,
        getConfig().rosen.RepoNFT,
        getConfig().general.address,
        getConfig().general.nodeUrl
      );
      healthCheck.register(widHealthCheck);

      const assetHealthCheck = new ErgoNodeAssetHealthCheckParam(
        ERGO_NATIVE_ASSET,
        ERGO_NATIVE_ASSET,
        getConfig().general.address,
        getConfig().healthCheck.ergWarnThreshold,
        getConfig().healthCheck.ergCriticalThreshold,
        getConfig().general.nodeUrl
      );
      healthCheck.register(assetHealthCheck);

      const ergoScannerSyncCheck = new ErgoNodeScannerHealthCheck(
        dataSource,
        scanner.ergoScanner.name(),
        getConfig().healthCheck.ergoScannerWarnDiff,
        getConfig().healthCheck.ergoScannerCriticalDiff,
        getConfig().general.nodeUrl
      );
      healthCheck.register(ergoScannerSyncCheck);

      const ergoNodeSyncCheck = new ErgoNodeSyncHealthCheckParam(
        getConfig().healthCheck.ergoNodeMaxHeightDiff,
        getConfig().healthCheck.ergoNodeMaxBlockTime,
        getConfig().healthCheck.ergoNodeMinPeerCount,
        getConfig().healthCheck.ergoNodeMaxPeerHeightDifference,
        getConfig().general.nodeUrl
      );
      healthCheck.register(ergoNodeSyncCheck);

      if (Transaction.watcherWID) {
        permitHealthCheckParam = new NodePermitHealthCheckParam(
          getConfig().rosen.RWTId,
          getConfig().rosen.watcherPermitAddress,
          Transaction.watcherWID,
          BigInt(
            getConfig().healthCheck.permitWarnCommitmentCount *
              getConfig().healthCheck.permitDefaultCommitmentRWT
          ),
          BigInt(
            getConfig().healthCheck.permitCriticalCommitmentCount *
              getConfig().healthCheck.permitDefaultCommitmentRWT
          ),
          getConfig().general.nodeUrl
        );
        healthCheck.register(permitHealthCheckParam);
      } else {
        logger.warn(
          'Watcher wid is not set, skipping permit health check parameter registration.'
        );
      }
    } else if (getConfig().general.scannerType === EXPLORER_TYPE) {
      const widHealthCheck = new ExplorerWidHealthCheckParam(
        getConfig().rosen.RWTRepoAddress,
        getConfig().rosen.RepoNFT,
        getConfig().general.address,
        getConfig().general.explorerUrl
      );
      healthCheck.register(widHealthCheck);

      const assetHealthCheck = new ErgoExplorerAssetHealthCheckParam(
        ERGO_NATIVE_ASSET,
        ERGO_NATIVE_ASSET,
        getConfig().general.address,
        getConfig().healthCheck.ergWarnThreshold,
        getConfig().healthCheck.ergCriticalThreshold,
        getConfig().general.explorerUrl
      );
      healthCheck.register(assetHealthCheck);

      const ergoScannerSyncCheck = new ErgoExplorerScannerHealthCheck(
        dataSource,
        scanner.ergoScanner.name(),
        getConfig().healthCheck.ergoScannerWarnDiff,
        getConfig().healthCheck.ergoScannerCriticalDiff,
        getConfig().general.explorerUrl
      );
      healthCheck.register(ergoScannerSyncCheck);

      if (Transaction.watcherWID) {
        permitHealthCheckParam = new ExplorerPermitHealthCheckParam(
          getConfig().rosen.RWTId,
          getConfig().rosen.watcherPermitAddress,
          Transaction.watcherWID,
          BigInt(
            getConfig().healthCheck.permitWarnCommitmentCount *
              getConfig().healthCheck.permitDefaultCommitmentRWT
          ),
          BigInt(
            getConfig().healthCheck.permitCriticalCommitmentCount *
              getConfig().healthCheck.permitDefaultCommitmentRWT
          ),
          getConfig().general.explorerUrl
        );
        healthCheck.register(permitHealthCheckParam);
      } else {
        logger.warn(
          'Watcher wid is not set, skipping permit health check parameter registration.'
        );
      }
    }

    if (getConfig().general.networkWatcher === CARDANO_WATCHER) {
      let cardanoScannerSyncCheck;
      if (getConfig().cardano.type === OGMIOS_TYPE) {
        cardanoScannerSyncCheck = new CardanoOgmiosScannerHealthCheck(
          dataSource,
          scanner.observationScanner.name(),
          getConfig().healthCheck.cardanoScannerWarnDiff,
          getConfig().healthCheck.cardanoScannerCriticalDiff,
          getConfig().cardano.ogmios!.ip,
          getConfig().cardano.ogmios!.port
        );
      } else if (getConfig().cardano.type === KOIOS_TYPE) {
        cardanoScannerSyncCheck = new CardanoKoiosScannerHealthCheck(
          dataSource,
          scanner.observationScanner.name(),
          getConfig().healthCheck.cardanoScannerWarnDiff,
          getConfig().healthCheck.cardanoScannerCriticalDiff,
          getConfig().cardano.koios!.url
        );
      }
      if (cardanoScannerSyncCheck)
        healthCheck.register(cardanoScannerSyncCheck);
    }
  }
  return healthCheck;
};

const getPermitHealthCheckParam = async () => {
  if (healthCheck) return permitHealthCheckParam;
  else {
    await getHealthCheck();
    return permitHealthCheckParam;
  }
};

export { getHealthCheck, getPermitHealthCheckParam };
