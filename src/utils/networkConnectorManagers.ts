import {
  NetworkConnectorManager,
  FailoverStrategy,
  RoundRobinStrategy,
} from '@rosen-bridge/abstract-scanner';
import {
  ErgoNodeNetwork,
  ErgoExplorerNetwork,
} from '@rosen-bridge/ergo-scanner';
import {
  DogeRpcTransaction,
  BitcoinRpcTransaction,
  BitcoinRpcNetwork,
  DogeRpcNetwork,
  EsploraNetwork,
  BitcoinEsploraTransaction,
} from '@rosen-bridge/bitcoin-scanner';
import { FiroRpcNetwork, FiroRpcTransaction } from '@rosen-bridge/firo-scanner';
import {
  KoiosNetwork,
  BlockFrostNetwork,
  KoiosTransaction,
  BlockFrostTransaction,
} from '@rosen-bridge/cardano-scanner';
import { EvmRpcNetwork } from '@rosen-bridge/evm-scanner';
import { getConfig } from '../config/config';
import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { Transaction } from '@rosen-bridge/scanner-interfaces';
import { TransactionResponse } from 'ethers';

const config = getConfig();
const logger = DefaultLogger.getInstance().child(import.meta.url);

// Create separate loggers for each manager
const ergoNodeLogger = logger.child('ergoNodeConnector');
const ergoExplorerLogger = logger.child('ergoExplorerConnector');
const bitcoinLogger = logger.child('bitcoinConnector');
const dogeLogger = logger.child('dogeConnector');
const cardanoKoiosLogger = logger.child('cardanoKoiosConnector');
const cardanoBlockfrostLogger = logger.child('cardanoBlockfrostConnector');
const evmLogger = logger.child('evmConnector');
const firoLogger = logger.child('firoConnector');

/**
 * Creates and configures a NetworkConnectorManager instance for Ergo node
 */
export const createErgoNodeNetworkConnectorManager =
  (): NetworkConnectorManager<Transaction> => {
    const networkConnectorManager = new NetworkConnectorManager<Transaction>(
      new FailoverStrategy(),
      ergoNodeLogger
    );
    networkConnectorManager.addConnector(
      new ErgoNodeNetwork(config.general.nodeUrl)
    );
    return networkConnectorManager;
  };

/**
 * Creates and configures a NetworkConnectorManager instance for Ergo explorer
 */
export const createErgoExplorerNetworkConnectorManager =
  (): NetworkConnectorManager<Transaction> => {
    const networkConnectorManager = new NetworkConnectorManager<Transaction>(
      new FailoverStrategy(),
      ergoExplorerLogger
    );
    networkConnectorManager.addConnector(
      new ErgoExplorerNetwork(config.general.explorerUrl)
    );
    return networkConnectorManager;
  };

/**
 * Creates and configures a NetworkConnectorManager instance for Bitcoin scanner
 */
export const createBitcoinRpcNetworkConnectorManager = () => {
  const networkConnectorManager =
    new NetworkConnectorManager<BitcoinRpcTransaction>(
      new FailoverStrategy(),
      bitcoinLogger
    );

  if (config.bitcoin.rpc) {
    networkConnectorManager.addConnector(
      new BitcoinRpcNetwork(
        config.bitcoin.rpc.url,
        config.bitcoin.rpc.timeout * 1000,
        config.bitcoin.rpc.username && config.bitcoin.rpc.password
          ? {
              username: config.bitcoin.rpc.username,
              password: config.bitcoin.rpc.password,
            }
          : undefined
      )
    );
  } else {
    throw new Error(
      'Rpc configuration must be provided for Bitcoin Rpc network'
    );
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Doge Esplora scanner
 */
export const createDogeEsploraNetworkConnectorManager = () => {
  const networkConnectorManager =
    new NetworkConnectorManager<BitcoinEsploraTransaction>(
      new RoundRobinStrategy(),
      dogeLogger
    );

  if (config.doge.esplora) {
    config.doge.esplora.forEach((esploraConfig) => {
      networkConnectorManager.addConnector(
        new EsploraNetwork(esploraConfig.url, esploraConfig.timeout * 1000)
      );
    });
  } else {
    throw new Error(
      'Esplora configuration must be provided for Doge Esplora network'
    );
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Bitcoin Esplora scanner
 */
export const createBitcoinEsploraNetworkConnectorManager = () => {
  const networkConnectorManager =
    new NetworkConnectorManager<BitcoinEsploraTransaction>(
      new FailoverStrategy(),
      bitcoinLogger
    );

  if (config.bitcoin.esplora) {
    networkConnectorManager.addConnector(
      new EsploraNetwork(
        config.bitcoin.esplora.url,
        config.bitcoin.esplora.timeout * 1000
      )
    );
  } else {
    throw new Error(
      `Esplora configuration must be provided for bitcoin Esplora network`
    );
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Doge RPC scanner
 */
export const createDogeRpcNetworkConnectorManager = () => {
  const networkConnectorManager =
    new NetworkConnectorManager<DogeRpcTransaction>(
      new RoundRobinStrategy(),
      dogeLogger
    );

  if (config.doge.rpc) {
    config.doge.rpc.forEach((rpcConfig) => {
      networkConnectorManager.addConnector(
        new DogeRpcNetwork(
          rpcConfig.url,
          rpcConfig.timeout * 1000,
          rpcConfig.username && rpcConfig.password
            ? {
                username: rpcConfig.username,
                password: rpcConfig.password,
              }
            : undefined
        )
      );
    });
  } else {
    throw new Error('Rpc configuration must be provided for Doge Rpc network');
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Cardano Koios network
 */
export const createCardanoKoiosNetworkConnectorManager = () => {
  const networkConnectorManager = new NetworkConnectorManager<KoiosTransaction>(
    new FailoverStrategy(),
    cardanoKoiosLogger
  );

  if (config.cardano.koios) {
    if (!config.cardano.koios.url) {
      throw new Error('Koios URL must be provided');
    }
    networkConnectorManager.addConnector(
      new KoiosNetwork(
        config.cardano.koios.url,
        config.cardano.koios.timeout * 1000,
        config.cardano.koios.authToken
      )
    );
  } else {
    throw new Error(
      'Koios configuration must be provided for Cardano Koios network'
    );
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Cardano Blockfrost network
 */
export const createCardanoBlockfrostNetworkConnectorManager = () => {
  const networkConnectorManager =
    new NetworkConnectorManager<BlockFrostTransaction>(
      new FailoverStrategy(),
      cardanoBlockfrostLogger
    );

  if (config.cardano.blockfrost) {
    if (!config.cardano.blockfrost.projectId) {
      throw new Error('Blockfrost project ID must be provided');
    }
    networkConnectorManager.addConnector(
      new BlockFrostNetwork(config.cardano.blockfrost.projectId)
    );
  } else {
    throw new Error(
      'Blockfrost configuration must be provided for Cardano Blockfrost network'
    );
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for EVM-based scanners (Ethereum/Binance)
 * @param chainName - The name of the chain to create a connector for (base/ethereum/binance)
 */
export const createEvmNetworkConnectorManager = (chainName: string) => {
  const networkConnectorManager =
    new NetworkConnectorManager<TransactionResponse>(
      new FailoverStrategy(),
      evmLogger
    );

  if (chainName === 'base' && config.base.rpc) {
    networkConnectorManager.addConnector(
      new EvmRpcNetwork(
        config.base.rpc.url,
        config.base.rpc.timeout * 1000,
        config.base.rpc.authToken || undefined
      )
    );
  } else if (chainName === 'ethereum' && config.ethereum.rpc) {
    networkConnectorManager.addConnector(
      new EvmRpcNetwork(
        config.ethereum.rpc.url,
        config.ethereum.rpc.timeout * 1000,
        config.ethereum.rpc.authToken || undefined
      )
    );
  } else if (chainName === 'binance' && config.binance.rpc) {
    networkConnectorManager.addConnector(
      new EvmRpcNetwork(
        config.binance.rpc.url,
        config.binance.rpc.timeout * 1000,
        config.binance.rpc.authToken || undefined
      )
    );
  } else {
    throw new Error(`No RPC configuration found for ${chainName}`);
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Firo RPC scanner
 */
export const createFiroRpcNetworkConnectorManager = () => {
  const networkConnectorManager =
    new NetworkConnectorManager<FiroRpcTransaction>(
      new FailoverStrategy(),
      firoLogger
    );

  if (config.firo.rpc) {
    networkConnectorManager.addConnector(
      new FiroRpcNetwork(
        config.firo.rpc.url,
        config.firo.rpc.timeout * 1000,
        config.firo.rpc.username && config.firo.rpc.password
          ? {
              username: config.firo.rpc.username,
              password: config.firo.rpc.password,
            }
          : undefined
      )
    );
  } else {
    throw new Error('Rpc configuration must be provided for Firo Rpc network');
  }

  return networkConnectorManager;
};
