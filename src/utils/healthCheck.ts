import {
  ErgoExplorerAssetHealthCheckParam,
  ErgoNodeAssetHealthCheckParam,
} from '@rosen-bridge/asset-check';
import { HealthCheck } from '@rosen-bridge/health-check';
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
  EvmRPCScannerHealthCheck,
} from '@rosen-bridge/scanner-sync-check';
import {
  ExplorerWidHealthCheckParam,
  NodeWidHealthCheckParam,
} from '@rosen-bridge/wid-check';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { CardanoOgmiosScanner } from '@rosen-bridge/scanner';
import { DiscordNotification } from '@rosen-bridge/discord-notification';

import { Transaction } from '../api/Transaction';
import { getConfig } from '../config/config';
import {
  BINANCE_CHAIN_NAME,
  BITCOIN_CHAIN_NAME,
  CARDANO_CHAIN_NAME,
  ERGO_DECIMALS,
  ERGO_NATIVE_ASSET,
  ESPLORA_TYPE,
  ETHEREUM_CHAIN_NAME,
  EXPLORER_TYPE,
  KOIOS_TYPE,
  NODE_TYPE,
  OGMIOS_TYPE,
  RPC_TYPE,
} from '../config/constants';
import { watcherDatabase } from '../init';
import { CreateScanner } from './scanner';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

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
    const ergoNodeSyncCheck = new ErgoNodeSyncHealthCheckParam(
      getConfig().healthCheck.ergoNodeMaxHeightDiff,
      getConfig().healthCheck.ergoNodeMaxBlockTime,
      getConfig().healthCheck.ergoNodeMinPeerCount,
      getConfig().healthCheck.ergoNodeMaxPeerHeightDifference,
      getConfig().general.nodeUrl
    );
    this.healthCheck.register(ergoNodeSyncCheck);

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
    if (getConfig().general.networkWatcher === ETHEREUM_CHAIN_NAME) {
      this.registerEthereumHealthCheckParams();
    }
    if (getConfig().general.networkWatcher === BINANCE_CHAIN_NAME) {
      this.registerBinanceHealthCheckParams();
    }
  }

  private observingNetworkLastBlock = (scanner: string) => {
    return () => watcherDatabase.getLastBlockHeight(scanner);
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
    this.ergoScannerSyncCheckParam = new ErgoNodeScannerHealthCheck(
      this.observingNetworkLastBlock(scanner.getErgoScanner().name()),
      scanner.getErgoScanner().name(),
      getConfig().healthCheck.ergoScannerWarnDiff,
      getConfig().healthCheck.ergoScannerCriticalDiff,
      getConfig().general.nodeUrl
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
    this.ergoScannerSyncCheckParam = new ErgoExplorerScannerHealthCheck(
      this.observingNetworkLastBlock(scanner.getErgoScanner().name()),
      scanner.getErgoScanner().name(),
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
    const scanner = CreateScanner.getInstance();
    if (getConfig().cardano.type === OGMIOS_TYPE) {
      cardanoScannerSyncCheck = new CardanoOgmiosScannerHealthCheck(
        this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
        (
          scanner.getObservationScanner() as CardanoOgmiosScanner
        ).getConnectionStatus,
        getConfig().healthCheck.cardanoScannerWarnDiff,
        getConfig().healthCheck.cardanoScannerCriticalDiff,
        getConfig().cardano.ogmios!.host,
        getConfig().cardano.ogmios!.port,
        // TODO: Fix configuration: local/health-check/-/issues/29
        getConfig().cardano.ogmios!.connectionRetrialInterval * 15,
        getConfig().cardano.ogmios!.useTls
      );
    } else if (getConfig().cardano.type === KOIOS_TYPE) {
      cardanoScannerSyncCheck = new CardanoKoiosScannerHealthCheck(
        this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
        scanner.getObservationScanner().name(),
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
    const scanner = CreateScanner.getInstance();
    if (getConfig().bitcoin.type === RPC_TYPE) {
      bitcoinScannerSyncCheck = new BitcoinRPCScannerHealthCheck(
        this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
        scanner.getObservationScanner().name(),
        getConfig().healthCheck.bitcoinScannerWarnDiff,
        getConfig().healthCheck.bitcoinScannerCriticalDiff,
        getConfig().bitcoin.rpc!.url,
        getConfig().bitcoin.rpc!.username,
        getConfig().bitcoin.rpc!.password
      );
    } else if (getConfig().bitcoin.type === ESPLORA_TYPE) {
      bitcoinScannerSyncCheck = new BitcoinEsploraScannerHealthCheck(
        this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
        scanner.getObservationScanner().name(),
        getConfig().healthCheck.bitcoinScannerWarnDiff,
        getConfig().healthCheck.bitcoinScannerCriticalDiff,
        getConfig().bitcoin.esplora!.url
      );
    }
    if (bitcoinScannerSyncCheck)
      this.healthCheck.register(bitcoinScannerSyncCheck);
  };

  /**
   * Registers all ethereum check params
   */
  registerEthereumHealthCheckParams = () => {
    const scanner = CreateScanner.getInstance();
    const ethereumRpcScannerSyncCheck = new EvmRPCScannerHealthCheck(
      ETHEREUM_CHAIN_NAME,
      this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
      scanner.getObservationScanner().name(),
      getConfig().healthCheck.ethereumScannerWarnDiff,
      getConfig().healthCheck.ethereumScannerCriticalDiff,
      getConfig().ethereum.rpc!.url,
      getConfig().ethereum.rpc!.authToken,
      getConfig().ethereum.rpc!.timeout
    );
    this.healthCheck.register(ethereumRpcScannerSyncCheck);
  };

  /**
   * Registers all binance check params
   */
  registerBinanceHealthCheckParams = () => {
    const scanner = CreateScanner.getInstance();
    const binanceRpcScannerSyncCheck = new EvmRPCScannerHealthCheck(
      BINANCE_CHAIN_NAME,
      this.observingNetworkLastBlock(scanner.getObservationScanner().name()),
      scanner.getObservationScanner().name(),
      getConfig().healthCheck.binanceScannerWarnDiff,
      getConfig().healthCheck.binanceScannerCriticalDiff,
      getConfig().binance.rpc!.url,
      getConfig().binance.rpc!.authToken,
      getConfig().binance.rpc!.timeout
    );
    this.healthCheck.register(binanceRpcScannerSyncCheck);
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
