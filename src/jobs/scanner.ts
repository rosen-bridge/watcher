import { CardanoConfig } from '../config/config';
import { ErgoScanner, CardanoKoiosScanner } from '@rosen-bridge/scanner';
import { Config } from '../config/config';
import { dataSource } from '../../config/dataSource';
import {
  ErgoObservationExtractor,
  CardanoObservationExtractor,
} from '@rosen-bridge/observation-extractor';
import {
  CommitmentExtractor,
  PermitExtractor,
  EventTriggerExtractor,
} from '@rosen-bridge/watcher-data-extractor';
import { rosenConfig } from '../config/rosenConfig';
import { ErgoUTXOExtractor } from '@rosen-bridge/address-extractor';
import { Constants } from '../config/constants';
import { Tokens } from '../config/tokensConfig';

const config = Config.getConfig();
let scanner: ErgoScanner;
let cardanoScanner: CardanoKoiosScanner;

const ergoScanningJob = () => {
  scanner
    .update()
    .then(() => setTimeout(ergoScanningJob, config.bridgeScanInterval * 1000));
};

const cardanoScanningJob = (interval: number) => {
  cardanoScanner
    .update()
    .then(() =>
      setTimeout(() => cardanoScanningJob(interval), interval * 1000)
    );
};

export const scannerInit = () => {
  const ergoScannerConfig = {
    nodeUrl: config.nodeUrl,
    timeout: config.nodeTimeout,
    initialHeight: config.ergoInitialHeight,
    dataSource: dataSource,
  };
  scanner = new ErgoScanner(ergoScannerConfig);
  ergoScanningJob();
  if (config.networkWatcher == Constants.ergoNode) {
    const observationExtractor = new ErgoObservationExtractor(
      dataSource,
      Tokens,
      rosenConfig.lockAddress
    );
    scanner.registerExtractor(observationExtractor);
  } else if (config.networkWatcher == Constants.cardanoKoios) {
    const cardanoConfig = CardanoConfig.getConfig();
    const cardanoScannerConfig = {
      koiosUrl: cardanoConfig.koiosURL,
      timeout: cardanoConfig.timeout,
      initialHeight: cardanoConfig.initialHeight,
      dataSource: dataSource,
    };
    cardanoScanner = new CardanoKoiosScanner(cardanoScannerConfig);
    cardanoScanningJob(cardanoConfig.interval);
    const observationExtractor = new CardanoObservationExtractor(
      dataSource,
      Tokens,
      rosenConfig.lockAddress
    );
    cardanoScanner.registerExtractor(observationExtractor);
  } else {
    throw new Error(
      `The observing network [${config.networkWatcher}] is not supported`
    );
  }
  const commitmentExtractor = new CommitmentExtractor(
    Constants.commitmentExtractorName,
    [rosenConfig.commitmentAddress],
    rosenConfig.RWTId,
    dataSource
  );
  const permitExtractor = new PermitExtractor(
    Constants.permitExtractorName,
    dataSource,
    rosenConfig.watcherPermitAddress,
    rosenConfig.RWTId
  );
  const eventTriggerExtractor = new EventTriggerExtractor(
    Constants.triggerExtractorName,
    dataSource,
    rosenConfig.eventTriggerAddress,
    rosenConfig.RWTId
  );
  const plainExtractor = new ErgoUTXOExtractor(
    dataSource,
    Constants.addressExtractorName,
    config.networkType,
    config.address
  );
  scanner.registerExtractor(commitmentExtractor);
  scanner.registerExtractor(permitExtractor);
  scanner.registerExtractor(eventTriggerExtractor);
  scanner.registerExtractor(plainExtractor);

  // TODO: Add commitment cleanup job
};
