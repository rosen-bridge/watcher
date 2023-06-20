import {
  CardanoKoiosScannerHealthCheck,
  CardanoOgmiosScannerHealthCheck,
  ErgoNodeAssetHealthCheckParam,
  ErgoNodeScannerHealthCheck,
  ErgoNodeSyncHealthCheckParam,
  HealthCheck,
  NodeWidHealthCheckParam,
} from '@rosen-bridge/health-check';
import { getConfig } from '../config/config';
import { dataSource } from '../../config/dataSource';
import { CARDANO_WATCHER, OGMIOS_TYPE, KOIOS_TYPE } from '../config/constants';

let healthCheck: HealthCheck;

const healthCheckInit = () => {
  healthCheck = new HealthCheck();

  const widHealthCheck = new NodeWidHealthCheckParam(
    getConfig().rosen.RWTRepoAddress,
    getConfig().rosen.RepoNFT,
    getConfig().general.address,
    getConfig().general.nodeUrl
  );
  healthCheck.register(widHealthCheck);

  const assetHealthCheck = new ErgoNodeAssetHealthCheckParam(
    'erg',
    'erg',
    getConfig().general.address,
    getConfig().healthCheck.ergWarnThreshold,
    getConfig().healthCheck.ergCriticalThreshold,
    getConfig().general.nodeUrl
  );
  healthCheck.register(assetHealthCheck);

  const ergoScannerSyncCheck = new ErgoNodeScannerHealthCheck(
    dataSource,
    'ergo-node',
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

  if (getConfig().general.networkWatcher === CARDANO_WATCHER) {
    let cardanoScannerSyncCheck;
    if (getConfig().cardano.type === OGMIOS_TYPE) {
      cardanoScannerSyncCheck = new CardanoOgmiosScannerHealthCheck(
        dataSource,
        'cardano-ogmios',
        getConfig().healthCheck.cardanoScannerWarnDiff,
        getConfig().healthCheck.cardanoScannerCriticalDiff,
        getConfig().cardano.ogmios!.ip,
        getConfig().cardano.ogmios!.port
      );
    } else if (getConfig().cardano.type === KOIOS_TYPE) {
      cardanoScannerSyncCheck = new CardanoKoiosScannerHealthCheck(
        dataSource,
        'cardano-koios',
        getConfig().healthCheck.cardanoScannerWarnDiff,
        getConfig().healthCheck.cardanoScannerCriticalDiff,
        getConfig().cardano.koios!.url
      );
    }
    if (cardanoScannerSyncCheck) healthCheck.register(cardanoScannerSyncCheck);
  }
};

export { healthCheck, healthCheckInit };
