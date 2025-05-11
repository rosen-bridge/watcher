import { NetworkConnectorManager, FailoverStrategy, RoundRobinStrategy } from '@rosen-bridge/scanner';
import { ErgoNodeNetwork, ErgoExplorerNetwork } from '@rosen-bridge/scanner';
import { DogeRpcTransaction, BitcoinRpcTransaction, BitcoinRpcNetwork, DogeRpcNetwork } from '@rosen-bridge/bitcoin-rpc-scanner';
import { KoiosNetwork, BlockFrostNetwork, KoiosTransaction, BlockFrostTransaction } from '@rosen-bridge/scanner';
import { EvmRpcNetwork } from '@rosen-bridge/evm-rpc-scanner';
import { getConfig } from '../config/config';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { Transaction } from '@rosen-bridge/scanner-interfaces';
import { EsploraNetwork, BitcoinEsploraTransaction } from '@rosen-bridge/bitcoin-esplora-scanner';
import { TransactionResponse } from 'ethers';

const config = getConfig();

// Create separate loggers for each manager
const ergoNodeLogger = CallbackLoggerFactory.getInstance().getLogger('ergo-node-connector');
const ergoExplorerLogger = CallbackLoggerFactory.getInstance().getLogger('ergo-explorer-connector');
const bitcoinLogger = CallbackLoggerFactory.getInstance().getLogger('bitcoin-connector');
const dogeLogger = CallbackLoggerFactory.getInstance().getLogger('doge-connector');
const cardanoKoiosLogger = CallbackLoggerFactory.getInstance().getLogger('cardano-koios-connector');
const cardanoBlockfrostLogger = CallbackLoggerFactory.getInstance().getLogger('cardano-blockfrost-connector');
const evmLogger = CallbackLoggerFactory.getInstance().getLogger('evm-connector');

/**
 * Creates and configures a NetworkConnectorManager instance for Ergo node
 */
export const createErgoNodeNetworkConnectorManager = (): NetworkConnectorManager<Transaction> => {
  const networkConnectorManager = new NetworkConnectorManager<Transaction>(new FailoverStrategy(), ergoNodeLogger);
  networkConnectorManager.addConnector(new ErgoNodeNetwork(config.general.nodeUrl));
  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Ergo explorer
 */
export const createErgoExplorerNetworkConnectorManager = (): NetworkConnectorManager<Transaction> => {
  const networkConnectorManager = new NetworkConnectorManager<Transaction>(new FailoverStrategy(), ergoExplorerLogger);
  networkConnectorManager.addConnector(new ErgoExplorerNetwork(config.general.explorerUrl));
  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Bitcoin scanner
 */
export const createBitcoinRpcNetworkConnectorManager = () => {
  const networkConnectorManager = new NetworkConnectorManager<BitcoinRpcTransaction>(new FailoverStrategy(), bitcoinLogger);

  if (config.bitcoin.rpc) {
    networkConnectorManager.addConnector(new BitcoinRpcNetwork(
      config.bitcoin.rpc.url,
      config.bitcoin.rpc.timeout * 1000,
      (config.bitcoin.rpc.username && config.bitcoin.rpc.password) ? {
        username: config.bitcoin.rpc.username,
        password: config.bitcoin.rpc.password
      } : undefined
    ));
  } else {
    throw new Error('Rpc configuration must be provided for Bitcoin Rpc network');
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Doge Esplora scanner
 */
export const createDogeEsploraNetworkConnectorManager = () => {
  const networkConnectorManager = new NetworkConnectorManager<BitcoinEsploraTransaction>(new RoundRobinStrategy(), dogeLogger);

  if (config.doge.esplora) {
    config.doge.esplora.forEach(esploraConfig => {
      networkConnectorManager.addConnector(new EsploraNetwork(
        esploraConfig.url,
        esploraConfig.timeout * 1000
      ));
    });
  } else {
    throw new Error('Esplora configuration must be provided for Doge Esplora network');
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Bitcoin Esplora scanner
 */
export const createBitcoinEsploraNetworkConnectorManager = () => {
  const networkConnectorManager = new NetworkConnectorManager<BitcoinEsploraTransaction>(new FailoverStrategy(), bitcoinLogger);

  if (config.bitcoin.esplora) {
    networkConnectorManager.addConnector(new EsploraNetwork(
      config.bitcoin.esplora.url,
      config.bitcoin.esplora.timeout * 1000
    ));
  } else {
    throw new Error(`Esplora configuration must be provided for bitcoin Esplora network`);
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Doge RPC scanner
 */
export const createDogeRpcNetworkConnectorManager = () => {
  const networkConnectorManager = new NetworkConnectorManager<DogeRpcTransaction>(new RoundRobinStrategy(), dogeLogger);

  if (config.doge.rpc) {
    config.doge.rpc.forEach(rpcConfig => {
      networkConnectorManager.addConnector(new DogeRpcNetwork(
        rpcConfig.url,
        rpcConfig.timeout * 1000,
        (rpcConfig.username && rpcConfig.password) ? {
          username: rpcConfig.username,
          password: rpcConfig.password
        } : undefined
      ));
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
  const networkConnectorManager = new NetworkConnectorManager<KoiosTransaction>(new FailoverStrategy(), cardanoKoiosLogger);

  if (config.cardano.koios) {
    if (!config.cardano.koios.url) {
      throw new Error('Koios URL must be provided');
    }
    networkConnectorManager.addConnector(new KoiosNetwork(
      config.cardano.koios.url,
      config.cardano.koios.timeout * 1000,
      config.cardano.koios.authToken
    ));
  } else {
    throw new Error('Koios configuration must be provided for Cardano Koios network');
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for Cardano Blockfrost network
 */
export const createCardanoBlockfrostNetworkConnectorManager = () => {
  const networkConnectorManager = new NetworkConnectorManager<BlockFrostTransaction>(new FailoverStrategy(), cardanoBlockfrostLogger);

  if (config.cardano.blockfrost) {
    if (!config.cardano.blockfrost.projectId) {
      throw new Error('Blockfrost project ID must be provided');
    }
    networkConnectorManager.addConnector(new BlockFrostNetwork(
      config.cardano.blockfrost.projectId
    ));
  } else {
    throw new Error('Blockfrost configuration must be provided for Cardano Blockfrost network');
  }

  return networkConnectorManager;
};

/**
 * Creates and configures a NetworkConnectorManager instance for EVM-based scanners (Ethereum/Binance)
 */
export const createEvmNetworkConnectorManager = (chainName: string) => {
  const networkConnectorManager = new NetworkConnectorManager<TransactionResponse>(new FailoverStrategy(), evmLogger);

  if (chainName === 'ethereum' && config.ethereum.rpc) {
    networkConnectorManager.addConnector(new EvmRpcNetwork(
        config.ethereum.rpc.url,
        config.ethereum.rpc.timeout * 1000,
        config.ethereum.rpc.authToken || undefined
    ));
  } else if (chainName === 'binance' && config.binance.rpc) {
    networkConnectorManager.addConnector(new EvmRpcNetwork(
      config.binance.rpc.url,
      config.binance.rpc.timeout * 1000,
      config.binance.rpc.authToken || undefined
    ));
  } else {
    throw new Error(`No RPC configuration found for ${chainName}`);
  }

  return networkConnectorManager;
};
