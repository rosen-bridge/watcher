import {
  ErgoNodeScanner,
  CardanoKoiosScanner,
  CardanoOgmiosScanner,
} from '@rosen-bridge/scanner';
import {
  ErgoObservationExtractor,
  CardanoKoiosObservationExtractor,
  CardanoOgmiosObservationExtractor,
} from '@rosen-bridge/observation-extractor';

import { getConfig } from '../config/config';
import { dataSource } from '../../config/dataSource';
import { logger } from '../log/Logger';
import * as Constants from '../config/constants';

let observationScannerName: string;
const allConfig = getConfig();
const config = allConfig.general;
const tokens = allConfig.token;
const rosenConfig = allConfig.rosen;

const createErgoScanner = () => {
  const ergoScannerConfig = {
    nodeUrl: config.nodeUrl,
    timeout: config.nodeTimeout * 1000,
    initialHeight: config.ergoInitialHeight,
    dataSource: dataSource,
  };
  const ergoScanner = new ErgoNodeScanner(ergoScannerConfig, logger);
  if (config.networkWatcher == Constants.ERGO_WATCHER) {
    observationScannerName = ergoScanner.name();
    const observationExtractor = new ErgoObservationExtractor(
      dataSource,
      tokens,
      rosenConfig.lockAddress,
      logger
    );
    ergoScanner.registerExtractor(observationExtractor);
  }
  return ergoScanner;
};

const createOgmiosCardanoScanner = (): CardanoOgmiosScanner => {
  const cardanoConfig = allConfig.cardano;
  const cardanoScanner = new CardanoOgmiosScanner({
    nodeIp: cardanoConfig.ogmios!.ip,
    nodePort: cardanoConfig.ogmios!.port,
    dataSource: dataSource,
    initialHash: cardanoConfig.ogmios!.initialHash,
    initialSlot: cardanoConfig.ogmios!.initialSlot,
  });
  const observationExtractor = new CardanoOgmiosObservationExtractor(
    dataSource,
    tokens,
    rosenConfig.lockAddress,
    logger
  );
  cardanoScanner.registerExtractor(observationExtractor);
  observationScannerName = cardanoScanner.name();
  return cardanoScanner;
};

const createKoiosCardanoScanner = (): CardanoKoiosScanner => {
  const cardanoConfig = allConfig.cardano;
  const cardanoScanner = new CardanoKoiosScanner({
    dataSource: dataSource,
    koiosUrl: cardanoConfig.koios!.url,
    timeout: cardanoConfig.koios!.timeout,
    initialHeight: cardanoConfig.koios!.initialHeight,
  });
  const observationExtractor = new CardanoKoiosObservationExtractor(
    dataSource,
    tokens,
    rosenConfig.lockAddress,
    logger
  );
  cardanoScanner.registerExtractor(observationExtractor);
  observationScannerName = cardanoScanner.name();
  return cardanoScanner;
};

export {
  createErgoScanner,
  createOgmiosCardanoScanner,
  createKoiosCardanoScanner,
  observationScannerName,
};
