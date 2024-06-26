import {
  ErgoExplorerAssetHealthCheckParam,
  ErgoNodeAssetHealthCheckParam,
} from '@rosen-bridge/asset-check';
import { HealthCheck, HealthStatusLevel } from '@rosen-bridge/health-check';
import { LogLevelHealthCheck } from '@rosen-bridge/log-level-check';
import { ErgoNodeSyncHealthCheckParam } from '@rosen-bridge/node-sync-check';
import {
  AbstractPermitHealthCheckParam,
  ExplorerPermitHealthCheckParam,
  NodePermitHealthCheckParam,
} from '@rosen-bridge/permit-check';
import {
  AbstractScannerSyncHealthCheckParam,
  CardanoKoiosScannerHealthCheck,
  CardanoOgmiosScannerHealthCheck,
  ErgoExplorerScannerHealthCheck,
  ErgoNodeScannerHealthCheck,
  BitcoinEsploraScannerHealthCheck,
  BitcoinRPCScannerHealthCheck,
} from '@rosen-bridge/scanner-sync-check';
import {
  ExplorerWidHealthCheckParam,
  NodeWidHealthCheckParam,
} from '@rosen-bridge/wid-check';

import WinstonLogger from '@rosen-bridge/winston-logger';

import { dataSource } from '../../config/dataSource';
import { Transaction } from '../../src/api/Transaction';
import { getConfig } from '../config/config';
import {
  BITCOIN_CHAIN_NAME,
  CARDANO_CHAIN_NAME,
  ERGO_DECIMALS,
  ERGO_NATIVE_ASSET,
  ESPLORA_TYPE,
  EXPLORER_TYPE,
  KOIOS_TYPE,
  NODE_TYPE,
  OGMIOS_TYPE,
  RPC_TYPE,
} from '../config/constants';
import { scanner } from './scanner';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

class HealthCheckSingleton {
  private static instance: HealthCheckSingleton | undefined;
  private healthCheck: HealthCheck;
  private permitHealthCheckParam: AbstractPermitHealthCheckParam;
  private ergoScannerSyncCheckParam: AbstractScannerSyncHealthCheckParam;

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
    if (getConfig().general.networkWatcher === CARDANO_CHAIN_NAME) {
      this.registerCardanoHealthCheckParams();
    }
    if (getConfig().general.networkWatcher === BITCOIN_CHAIN_NAME) {
      this.registerBitcoinHealthCheckParams();
    }
  }

  /**
   * Registers all ergo node check params
   */
  registerErgoNodeHealthCheckParams = () => {
    const widHealthCheck = new NodeWidHealthCheckParam(
      getConfig().rosen.watcherCollateralAddress,
      getConfig().rosen.AWC,
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
      getConfig().general.nodeUrl,
      ERGO_DECIMALS
    );
    this.healthCheck.register(assetHealthCheck);

    this.ergoScannerSyncCheckParam = new ErgoNodeScannerHealthCheck(
      dataSource,
      scanner.ergoScanner.name(),
      getConfig().healthCheck.ergoScannerWarnDiff,
      getConfig().healthCheck.ergoScannerCriticalDiff,
      getConfig().general.nodeUrl
    );
    this.healthCheck.register(this.ergoScannerSyncCheckParam);

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
      getConfig().rosen.watcherCollateralAddress,
      getConfig().rosen.AWC,
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
      getConfig().general.explorerUrl,
      ERGO_DECIMALS
    );
    this.healthCheck.register(assetHealthCheck);

    this.ergoScannerSyncCheckParam = new ErgoExplorerScannerHealthCheck(
      dataSource,
      scanner.ergoScanner.name(),
      getConfig().healthCheck.ergoScannerWarnDiff,
      getConfig().healthCheck.ergoScannerCriticalDiff,
      getConfig().general.explorerUrl
    );
    this.healthCheck.register(this.ergoScannerSyncCheckParam);
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
        getConfig().cardano.ogmios!.host,
        getConfig().cardano.ogmios!.port,
        getConfig().cardano.ogmios!.useTls
      );
    } else if (getConfig().cardano.type === KOIOS_TYPE) {
      cardanoScannerSyncCheck = new CardanoKoiosScannerHealthCheck(
        dataSource,
        scanner.observationScanner.name(),
        getConfig().healthCheck.cardanoScannerWarnDiff,
        getConfig().healthCheck.cardanoScannerCriticalDiff,
        getConfig().cardano.koios!.url,
        getConfig().cardano.koios!.authToken
      );
    }
    if (cardanoScannerSyncCheck)
      this.healthCheck.register(cardanoScannerSyncCheck);
  };

  /**
   * Registers all bitcoin check params
   */
  registerBitcoinHealthCheckParams = () => {
    let bitcoinScannerSyncCheck;
    if (getConfig().bitcoin.type === RPC_TYPE) {
      bitcoinScannerSyncCheck = new BitcoinRPCScannerHealthCheck(
        dataSource,
        scanner.observationScanner.name(),
        getConfig().healthCheck.bitcoinScannerWarnDiff,
        getConfig().healthCheck.bitcoinScannerCriticalDiff,
        getConfig().bitcoin.rpc!.url,
        getConfig().bitcoin.rpc!.username,
        getConfig().bitcoin.rpc!.password
      );
    } else if (getConfig().bitcoin.type === ESPLORA_TYPE) {
      bitcoinScannerSyncCheck = new BitcoinEsploraScannerHealthCheck(
        dataSource,
        scanner.observationScanner.name(),
        getConfig().healthCheck.bitcoinScannerWarnDiff,
        getConfig().healthCheck.bitcoinScannerCriticalDiff,
        getConfig().bitcoin.esplora!.url
      );
    }
    if (bitcoinScannerSyncCheck)
      this.healthCheck.register(bitcoinScannerSyncCheck);
  };

  /**
   * Registers permit check if watcher wid exists
   */
  registerPermitHealthCheck = async (commitmentRwt: bigint) => {
    if (Transaction.watcherWID) {
      if (getConfig().general.scannerType === NODE_TYPE) {
        this.permitHealthCheckParam = new NodePermitHealthCheckParam(
          getConfig().rosen.RWTId,
          getConfig().rosen.watcherPermitAddress,
          Transaction.watcherWID,
          BigInt(getConfig().healthCheck.permitWarnCommitmentCount),
          BigInt(getConfig().healthCheck.permitCriticalCommitmentCount),
          getConfig().general.nodeUrl,
          commitmentRwt
        );
      } else if (getConfig().general.scannerType === EXPLORER_TYPE) {
        this.permitHealthCheckParam = new ExplorerPermitHealthCheckParam(
          getConfig().rosen.RWTId,
          getConfig().rosen.watcherPermitAddress,
          Transaction.watcherWID,
          BigInt(getConfig().healthCheck.permitWarnCommitmentCount),
          BigInt(getConfig().healthCheck.permitCriticalCommitmentCount),
          getConfig().general.explorerUrl,
          commitmentRwt
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
  checkIfPermitCheckExists = (commitmentRwt: bigint) => {
    if (!this.permitHealthCheckParam)
      this.registerPermitHealthCheck(commitmentRwt);
    return this.permitHealthCheckParam ? true : false;
  };

  /**
   * Updates permit check param with new thresholds
   * @param warnThreshold
   * @param criticalThreshold
   */
  updatePermitHealthCheck = (rwtPerCommitment: bigint) =>
    this.permitHealthCheckParam.updateRwtPerCommitment(rwtPerCommitment);

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

  /**
   * Get ergo scanner sync health status
   */
  getErgoScannerSyncHealth = () =>
    this.ergoScannerSyncCheckParam.getHealthStatus();
}

export { HealthCheckSingleton };
