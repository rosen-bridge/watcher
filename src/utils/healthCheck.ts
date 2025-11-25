import {
  ErgoExplorerAssetHealthCheckParam,
  ErgoNodeAssetHealthCheckParam,
} from '@rosen-bridge/asset-check';
import { HealthCheck, HealthStatusLevel } from '@rosen-bridge/health-check';
import {
  AbstractPermitHealthCheckParam,
  ExplorerPermitHealthCheckParam,
  NodePermitHealthCheckParam,
} from '@rosen-bridge/permit-check';
import {
  ScannerSyncHealthCheckParam,
  CardanoOgmiosScannerHealthCheck,
} from '@rosen-bridge/scanner-sync-check';
import {
  ExplorerWidHealthCheckParam,
  NodeWidHealthCheckParam,
} from '@rosen-bridge/wid-check';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { CardanoOgmiosScanner } from '@rosen-bridge/cardano-scanner';
import { DiscordNotification } from '@rosen-bridge/discord-notification';
import { LogLevelHealthCheck } from '@rosen-bridge/log-level-check';

import { Transaction } from '../api/Transaction';
import { getConfig } from '../config/config';
import {
  BINANCE_BLOCK_TIME,
  BINANCE_CHAIN_NAME,
  BITCOIN_BLOCK_TIME,
  BITCOIN_CHAIN_NAME,
  BITCOIN_RUNES_CHAIN_NAME,
  CARDANO_BLOCK_TIME,
  CARDANO_CHAIN_NAME,
  DOGE_BLOCK_TIME,
  DOGE_CHAIN_NAME,
  ERGO_BLOCK_TIME,
  ERGO_CHAIN_NAME,
  ERGO_DECIMALS,
  ERGO_NATIVE_ASSET,
  ETHEREUM_BLOCK_TIME,
  ETHEREUM_CHAIN_NAME,
  EXPLORER_TYPE,
  NODE_TYPE,
  OGMIOS_TYPE,
} from '../config/constants';
import { watcherDatabase } from '../init';
import { CreateScanner } from './scanner';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

class HealthCheckSingleton {
  private static instance: HealthCheckSingleton | undefined;
  private healthCheck: HealthCheck;
  private permitHealthCheckParam: AbstractPermitHealthCheckParam;
  private ergoScannerSyncCheckParam: ScannerSyncHealthCheckParam;

  static getInstance = () => {
    if (!HealthCheckSingleton.instance) {
      HealthCheckSingleton.instance = new HealthCheckSingleton();
    }
    return HealthCheckSingleton.instance;
  };

  private constructor() {
    let notify;
    let notificationConfig;
    if (getConfig().notification.discordWebHookUrl) {
      const discordNotification = new DiscordNotification(
        getConfig().notification.discordWebHookUrl
      );
      notify = discordNotification.notify;
      notificationConfig = {
        historyConfig: {
          cleanupThreshold: getConfig().notification.historyCleanupTimeout,
        },
        notificationCheckConfig: {
          hasBeenUnstableForAWhile: {
            windowDuration:
              getConfig().notification.hasBeenUnstableForAWhileWindowDuration,
          },
          hasBeenUnknownForAWhile: {
            windowDuration:
              getConfig().notification.hasBeenUnknownForAWhileWindowDuration,
          },
        },
      };
    }
    this.healthCheck = new HealthCheck(notify, notificationConfig);

    const warnLogCheck = new LogLevelHealthCheck(
      CallbackLoggerFactory.getInstance(),
      HealthStatusLevel.UNSTABLE,
      getConfig().healthCheck.warnLogAllowedCount,
      getConfig().healthCheck.logDuration,
      'warn'
    );
    this.healthCheck.register(warnLogCheck);

    const errorLogCheck = new LogLevelHealthCheck(
      CallbackLoggerFactory.getInstance(),
      HealthStatusLevel.UNSTABLE,
      getConfig().healthCheck.errorLogAllowedCount,
      getConfig().healthCheck.logDuration,
      'error'
    );
    this.healthCheck.register(errorLogCheck);

    if (getConfig().general.scannerType === NODE_TYPE) {
      this.registerErgoNodeHealthCheckParams();
    } else if (getConfig().general.scannerType === EXPLORER_TYPE) {
      this.registerErgoExplorerHealthCheckParams();
    }

    if (getConfig().general.networkWatcher !== ERGO_CHAIN_NAME) {
      this.registerScannerSyncHealthCheck();
    }
  }

  private observingNetworkLastBlock = (scanner: string) => {
    return () => watcherDatabase.getLastBlockInfo(scanner);
  };

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

    const scanner = CreateScanner.getInstance();
    this.ergoScannerSyncCheckParam = new ScannerSyncHealthCheckParam(
      ERGO_CHAIN_NAME,
      this.observingNetworkLastBlock(scanner.getErgoScanner().name()),
      getConfig().healthCheck.scannerWarnDiff,
      getConfig().healthCheck.scannerCriticalDiff,
      ERGO_BLOCK_TIME
    );
    this.healthCheck.register(this.ergoScannerSyncCheckParam);
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

    const scanner = CreateScanner.getInstance();
    this.ergoScannerSyncCheckParam = new ScannerSyncHealthCheckParam(
      ERGO_CHAIN_NAME,
      this.observingNetworkLastBlock(scanner.getErgoScanner().name()),
      getConfig().healthCheck.scannerWarnDiff,
      getConfig().healthCheck.scannerCriticalDiff,
      ERGO_BLOCK_TIME,
      getConfig().general.ergoInterval
    );
    this.healthCheck.register(this.ergoScannerSyncCheckParam);
  };

  /**
   * Registers scanner sync health check if the network is not ergo
   * Note: Cardano-ogmios has the only different health parameter
   */
  registerScannerSyncHealthCheck = () => {
    const scanner = CreateScanner.getInstance();
    let scannerSyncCheck:
      | ScannerSyncHealthCheckParam
      | CardanoOgmiosScannerHealthCheck;
    if (
      getConfig().general.networkWatcher === CARDANO_CHAIN_NAME &&
      getConfig().cardano.type === OGMIOS_TYPE
    ) {
      scannerSyncCheck = new CardanoOgmiosScannerHealthCheck(
        this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
        (
          scanner.getObservationScanner() as CardanoOgmiosScanner
        ).getConnectionStatus,
        getConfig().healthCheck.scannerWarnDiff,
        getConfig().healthCheck.scannerCriticalDiff,
        // TODO: Fix configuration: local/health-check/-/issues/29
        getConfig().cardano.ogmios!.connectionRetrialInterval * 15
      );
    } else {
      let chainName: string;
      let chainBlockTime: number;
      let updateInterval: number;
      switch (getConfig().general.networkWatcher) {
        case CARDANO_CHAIN_NAME:
          chainName = CARDANO_CHAIN_NAME;
          chainBlockTime = CARDANO_BLOCK_TIME;
          updateInterval = getConfig().cardano.koios!.interval;
          break;
        case BITCOIN_CHAIN_NAME:
          chainName = BITCOIN_CHAIN_NAME;
          chainBlockTime = BITCOIN_BLOCK_TIME;
          updateInterval = getConfig().bitcoin.interval;
          break;
        case BITCOIN_RUNES_CHAIN_NAME:
          chainName = BITCOIN_RUNES_CHAIN_NAME;
          chainBlockTime = BITCOIN_BLOCK_TIME;
          updateInterval = getConfig().bitcoin.interval;
          break;
        case DOGE_CHAIN_NAME:
          chainName = DOGE_CHAIN_NAME;
          chainBlockTime = DOGE_BLOCK_TIME;
          updateInterval = getConfig().doge.interval;
          break;
        case ETHEREUM_CHAIN_NAME:
          chainName = ETHEREUM_CHAIN_NAME;
          chainBlockTime = ETHEREUM_BLOCK_TIME;
          updateInterval = getConfig().ethereum.interval;
          break;
        case BINANCE_CHAIN_NAME:
          chainName = BINANCE_CHAIN_NAME;
          chainBlockTime = BINANCE_BLOCK_TIME;
          updateInterval = getConfig().binance.interval;
          break;
      }

      scannerSyncCheck = new ScannerSyncHealthCheckParam(
        chainName!,
        this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
        getConfig().healthCheck.scannerWarnDiff,
        getConfig().healthCheck.scannerCriticalDiff,
        chainBlockTime!
      );
    }
    this.healthCheck.register(scannerSyncCheck);
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
    await this.healthCheck.getOverallHealthStatus();

  /**
   * Returns all trial errors
   * @returns
   */
  getTrialErrors = async () => await this.healthCheck.getTrialErrors();

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
    this.healthCheck.getHealthStatusWithParamId(paramName);

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
