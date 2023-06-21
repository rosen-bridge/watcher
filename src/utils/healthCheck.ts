import {
  CardanoKoiosScannerHealthCheck,
  CardanoOgmiosScannerHealthCheck,
  ErgoExplorerAssetHealthCheckParam,
  ErgoExplorerScannerHealthCheck,
  ErgoNodeAssetHealthCheckParam,
  ErgoNodeScannerHealthCheck,
  ErgoNodeSyncHealthCheckParam,
  ExplorerWidHealthCheckParam,
  HealthCheck,
  HealthStatusLevel,
  LogLevelHealthCheck,
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

const logger = loggerFactory(import.meta.url);
let healthCheck: HealthCheck;

const healthCheckInit = () => {
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
    if (cardanoScannerSyncCheck) healthCheck.register(cardanoScannerSyncCheck);
  }
};

export { healthCheck, healthCheckInit };
