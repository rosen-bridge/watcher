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

class HealthCheckSingleton {
  private static instance: HealthCheckSingleton | undefined;
  private healthCheck: HealthCheck;
  private permitHealthCheckParam: AbstractPermitHealthCheckParam;

  static getInstance = () => {
    if (!HealthCheckSingleton.instance) {
      HealthCheckSingleton.instance = new HealthCheckSingleton();
    }
    return HealthCheckSingleton.instance;
  };

  private constructor() {
    this.healthCheck = new HealthCheck();
    const errorLogHealthCheck = new LogLevelHealthCheck(
      logger,
      HealthStatusLevel.UNSTABLE,
      getConfig().healthCheck.errorLogAllowedCount,
      getConfig().healthCheck.errorLogDuration,
      'error'
    );
    this.healthCheck.register(errorLogHealthCheck);

    if (getConfig().general.scannerType === NODE_TYPE) {
      this.registerErgoNodeHealthCheckParams();
    } else if (getConfig().general.scannerType === EXPLORER_TYPE) {
      this.registerErgoExplorerHealthCheckParams();
    }
    if (getConfig().general.networkWatcher === CARDANO_WATCHER) {
      this.registerCardanoHealthCheckParams();
    }
  }

  /**
   * Registers all ergo node check params
   */
  registerErgoNodeHealthCheckParams = () => {
    const widHealthCheck = new NodeWidHealthCheckParam(
      getConfig().rosen.RWTRepoAddress,
      getConfig().rosen.RepoNFT,
      getConfig().general.address,
      getConfig().general.nodeUrl
    );
    this.healthCheck.register(widHealthCheck);

    const assetHealthCheck = new ErgoNodeAssetHealthCheckParam(
      ERGO_NATIVE_ASSET,
      ERGO_NATIVE_ASSET,
      getConfig().general.address,
      getConfig().healthCheck.ergWarnThreshold,
      getConfig().healthCheck.ergCriticalThreshold,
      getConfig().general.nodeUrl
    );
    this.healthCheck.register(assetHealthCheck);

    const ergoScannerSyncCheck = new ErgoNodeScannerHealthCheck(
      dataSource,
      scanner.ergoScanner.name(),
      getConfig().healthCheck.ergoScannerWarnDiff,
      getConfig().healthCheck.ergoScannerCriticalDiff,
      getConfig().general.nodeUrl
    );
    this.healthCheck.register(ergoScannerSyncCheck);

    const ergoNodeSyncCheck = new ErgoNodeSyncHealthCheckParam(
      getConfig().healthCheck.ergoNodeMaxHeightDiff,
      getConfig().healthCheck.ergoNodeMaxBlockTime,
      getConfig().healthCheck.ergoNodeMinPeerCount,
      getConfig().healthCheck.ergoNodeMaxPeerHeightDifference,
      getConfig().general.nodeUrl
    );
    this.healthCheck.register(ergoNodeSyncCheck);
  };

  /**
   * Registers all ergo explorer check params
   */
  registerErgoExplorerHealthCheckParams = () => {
    const widHealthCheck = new ExplorerWidHealthCheckParam(
      getConfig().rosen.RWTRepoAddress,
      getConfig().rosen.RepoNFT,
      getConfig().general.address,
      getConfig().general.explorerUrl
    );
    this.healthCheck.register(widHealthCheck);

    const assetHealthCheck = new ErgoExplorerAssetHealthCheckParam(
      ERGO_NATIVE_ASSET,
      ERGO_NATIVE_ASSET,
      getConfig().general.address,
      getConfig().healthCheck.ergWarnThreshold,
      getConfig().healthCheck.ergCriticalThreshold,
      getConfig().general.explorerUrl
    );
    this.healthCheck.register(assetHealthCheck);

    const ergoScannerSyncCheck = new ErgoExplorerScannerHealthCheck(
      dataSource,
      scanner.ergoScanner.name(),
      getConfig().healthCheck.ergoScannerWarnDiff,
      getConfig().healthCheck.ergoScannerCriticalDiff,
      getConfig().general.explorerUrl
    );
    this.healthCheck.register(ergoScannerSyncCheck);
  };

  /**
   * Registers all cardano check params
   */
  registerCardanoHealthCheckParams = () => {
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
      this.healthCheck.register(cardanoScannerSyncCheck);
  };

  /**
   * Registers permit check if watcher wid exists
   */
  registerPermitHealthCheck = async (commitmentRwt: number) => {
    if (Transaction.watcherWID) {
      if (getConfig().general.scannerType === NODE_TYPE) {
        this.permitHealthCheckParam = new NodePermitHealthCheckParam(
          getConfig().rosen.RWTId,
          getConfig().rosen.watcherPermitAddress,
          Transaction.watcherWID,
          BigInt(
            getConfig().healthCheck.permitWarnCommitmentCount * commitmentRwt
          ),
          BigInt(
            getConfig().healthCheck.permitCriticalCommitmentCount *
              commitmentRwt
          ),
          getConfig().general.nodeUrl
        );
      } else if (getConfig().general.scannerType === EXPLORER_TYPE) {
        this.permitHealthCheckParam = new ExplorerPermitHealthCheckParam(
          getConfig().rosen.RWTId,
          getConfig().rosen.watcherPermitAddress,
          Transaction.watcherWID,
          BigInt(
            getConfig().healthCheck.permitWarnCommitmentCount * commitmentRwt
          ),
          BigInt(
            getConfig().healthCheck.permitCriticalCommitmentCount *
              commitmentRwt
          ),
          getConfig().general.explorerUrl
        );
      }
      if (this.permitHealthCheckParam) {
        this.healthCheck.register(this.permitHealthCheckParam);
      }
    } else {
      logger.warn(
        'Watcher wid is not set, skipping permit health check parameter registration.'
      );
    }
  };

  /**
   * Then update all existing parameters
   */
  updateParams = () => this.healthCheck.update();

  /**
   * Try to register permit check parameter
   * Then check if permit health check exists
   */
  checkIfPermitCheckExists = (commitmentRwt: number) => {
    if (!this.permitHealthCheckParam)
      this.registerPermitHealthCheck(commitmentRwt);
    return this.permitHealthCheckParam ? true : false;
  };

  /**
   * Updates permit check param with new thresholds
   * @param warnThreshold
   * @param criticalThreshold
   */
  updatePermitHealthCheck = (
    warnThreshold: bigint,
    criticalThreshold: bigint
  ) =>
    this.permitHealthCheckParam.updateThresholds(
      warnThreshold,
      criticalThreshold
    );

  /**
   * Returns overall health status
   * @returns
   */
  getOverallStatus = async () =>
    (await this.healthCheck.getOverallHealthStatus()).status;

  /**
   * Returns overall health status
   * @returns
   */
  getStatus = () => this.healthCheck.getHealthStatus();

  /**
   * Returns parameter health status
   * @param paramName
   */
  getParamStatus = (paramName: string) =>
    this.healthCheck.getHealthStatusFor(paramName);

  /**
   * Updates the parameter health status
   * @param paramName
   */
  updateParam = (paramName: string) => this.healthCheck.updateParam(paramName);
}

export { HealthCheckSingleton };