import { CardanoOgmiosScanner, GeneralScanner } from '@rosen-bridge/scanner';
import * as Constants from '../config/constants';
import { getConfig } from '../config/config';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { EvmRpcScanner } from '@rosen-bridge/evm-rpc-scanner';
import { CreateScanner } from '../utils/scanner';

const allConfig = getConfig();
const {
  general: config,
  cardano: cardanoConfig,
  bitcoin: bitcoinConfig,
  ethereum: ethereumConfig,
  binance: binanceConfig,
} = allConfig;

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

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
  const scanner = CreateScanner.getInstance();
  scanningJob(config.ergoInterval, scanner.getErgoScanner()).then(() => null);
  switch (config.networkWatcher) {
    case Constants.CARDANO_CHAIN_NAME:
      if (cardanoConfig.ogmios) {
        (scanner.getObservationScanner() as CardanoOgmiosScanner)
          .start()
          .catch((e) => {
            logger.error(`Ogmios connection failed with error: ${e}`);
          });
        break;
      }
      scanningJob(
        cardanoConfig.koios
          ? cardanoConfig.koios.interval
          : cardanoConfig.blockfrost!.interval,
        scanner.getObservationScanner() as GeneralScanner<unknown>
      ).then(() => null);
      break;
    case Constants.BITCOIN_CHAIN_NAME:
      scanningJob(
        bitcoinConfig.rpc
          ? bitcoinConfig.rpc.interval
          : bitcoinConfig.esplora!.interval,
        scanner.getObservationScanner() as GeneralScanner<unknown>
      ).then(() => null);
      break;
    case Constants.ETHEREUM_CHAIN_NAME:
      scanningJob(
        ethereumConfig.rpc!.interval,
        scanner.getObservationScanner() as EvmRpcScanner
      ).then(() => null);
      break;
    case Constants.BINANCE_CHAIN_NAME:
      scanningJob(
        binanceConfig.rpc!.interval,
        scanner.getObservationScanner() as EvmRpcScanner
      ).then(() => null);
      break;
    case Constants.ERGO_CHAIN_NAME:
      break;
    default:
      throw new Error(
        `The observing network [${config.networkWatcher}] is not supported`
      );
  }

  // TODO: Add commitment cleanup job
  // https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/39
};
