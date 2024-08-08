import {
  CardanoBlockFrostScanner,
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
  GeneralScanner,
} from '@rosen-bridge/scanner';
import { BitcoinEsploraScanner } from '@rosen-bridge/bitcoin-esplora-scanner';
import { BitcoinRpcScanner } from '@rosen-bridge/bitcoin-rpc-scanner';
import * as Constants from '../config/constants';
import { getConfig } from '../config/config';
import { scanner } from '../utils/scanner';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { EvmRpcScanner } from '@rosen-bridge/evm-rpc-scanner';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const scanningJob = async (interval: number, scanner: GeneralScanner<any>) => {
  try {
    await scanner.update();
  } catch (e) {
    logger.warn(
      `Scanning Job failed for ${scanner.name()}, ${e.message}, ${e.stack}`
    );
  }
  setTimeout(() => scanningJob(interval, scanner), interval * 1000);
};

export const scannerInit = () => {
  const allConfig = getConfig();
  const config = allConfig.general;
  scanningJob(config.ergoInterval, scanner.ergoScanner).then(() => null);
  if (config.networkWatcher === Constants.CARDANO_CHAIN_NAME) {
    const cardanoConfig = allConfig.cardano;
    if (cardanoConfig.ogmios)
      (scanner.observationScanner as CardanoOgmiosScanner).start();
    else if (cardanoConfig.koios) {
      scanningJob(
        cardanoConfig.koios.interval,
        scanner.observationScanner as CardanoKoiosScanner
      ).then(() => null);
    } else if (cardanoConfig.blockfrost) {
      scanningJob(
        cardanoConfig.blockfrost.interval,
        scanner.observationScanner as CardanoBlockFrostScanner
      ).then(() => null);
    } else throw new Error(`Cardano scanner is not configured properly`);
  } else if (config.networkWatcher === Constants.BITCOIN_CHAIN_NAME) {
    const bitcoinConfig = allConfig.bitcoin;
    if (bitcoinConfig.esplora) {
      scanningJob(
        bitcoinConfig.esplora.interval,
        scanner.observationScanner as BitcoinEsploraScanner
      ).then(() => null);
    } else if (bitcoinConfig.rpc) {
      scanningJob(
        bitcoinConfig.rpc.interval,
        scanner.observationScanner as BitcoinRpcScanner
      ).then(() => null);
    } else throw new Error(`Bitcoin scanner is not configured properly`);
  } else if (config.networkWatcher === Constants.ETHEREUM_CHAIN_NAME) {
    const ethereumConfig = allConfig.ethereum;
    if (ethereumConfig.rpc) {
      scanningJob(
        ethereumConfig.rpc.interval,
        scanner.observationScanner as EvmRpcScanner
      ).then(() => null);
    } else throw new Error(`Ethereum scanner is not configured properly`);
  } else {
    throw new Error(
      `The observing network [${config.networkWatcher}] is not supported`
    );
  }

  // TODO: Add commitment cleanup job
  // https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/39
};
