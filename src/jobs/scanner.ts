import { CardanoConfig} from "../config/config";
import { ErgoScanner, CardanoKoiosScanner } from "@rosen-bridge/scanner";
import { Config } from "../config/config";
import { dataSource } from "../../config/dataSource";
import { ErgoObservationExtractor, CardanoObservationExtractor } from "@rosen-bridge/observation-extractor";
import tokens from '../config/tokens.test.json' assert { type: "json" };
import { CommitmentExtractor, PermitExtractor, EventTriggerExtractor } from "@rosen-bridge/watcher-data-extractor";
import { rosenConfig } from "../config/rosenConfig";
import { ErgoUTXOExtractor } from "@rosen-bridge/address-extractor";
import { Constants } from "../config/constants";

const config = Config.getConfig()
let scanner: ErgoScanner;
let cardanoScanner: CardanoKoiosScanner;

const ergoScanningJob = () => {
    scanner.update().then(() => setTimeout(ergoScanningJob, config.bridgeScanInterval * 1000))
}

const cardanoScanningJob = (interval: number) => {
    cardanoScanner.update().then(() => setTimeout(() => cardanoScanningJob(interval), interval * 1000))
}

export const scannerInit = () => {
    const ergoScannerConfig = {
        nodeUrl: config.nodeUrl,
        timeout: config.nodeTimeout,
        initialHeight: config.ergoInitialHeight,
        dataSource: dataSource,
    }
    scanner = new ErgoScanner(ergoScannerConfig);
    ergoScanningJob()
    // TODO: fix the lock addresses
    if (config.networkWatcher == Constants.ergoNode) {
        const observationExtractor = new ErgoObservationExtractor(dataSource, tokens, "nB3L2PD3LBtiNhDYK7XhZ8nVt6uekBXN7RcPUKgdKLXFcrJiSPxmQsUKuUkTRQ1hbvDrxEQAKYurGFbaGD1RPxU7XqQimD78j23HHMQKL1boUGsnNhCxaVNAYMcFbQNo355Af8cWkhAN6")
        scanner.registerExtractor(observationExtractor)
    } else if (config.networkWatcher == Constants.cardanoKoios) {
        const cardanoConfig = CardanoConfig.getConfig()
        const cardanoScannerConfig = {
            koiosUrl: cardanoConfig.koiosURL,
            timeout: cardanoConfig.timeout,
            initialHeight: cardanoConfig.initialHeight,
            dataSource: dataSource,
        }
        cardanoScanner = new CardanoKoiosScanner(cardanoScannerConfig)
        cardanoScanningJob(cardanoConfig.interval)
        const observationExtractor = new CardanoObservationExtractor(dataSource, tokens, "addr_test1qpr7wrk7t0tgxuysdqn7gnkrghxp8fxur8sg2hs907x637qs75e4g7y6af54ew972jmen04rhapzcp65e34zd2afes8s4fvph3")
        cardanoScanner.registerExtractor(observationExtractor)
    }
    else {
        console.log("The observing network is not supported")
        throw new Error("source network not found")
    }
    const commitmentExtractor = new CommitmentExtractor(Constants.commitmentExtractorName, [rosenConfig.commitmentAddress], config.RWTId, dataSource)
    const permitExtractor = new PermitExtractor(Constants.permitExtractorName, dataSource, rosenConfig.watcherPermitAddress, config.RWTId)
    const eventTriggerExtractor = new EventTriggerExtractor(Constants.triggerExtractorName, dataSource, rosenConfig.eventTriggerAddress, config.RWTId)
    const plainExtractor = new ErgoUTXOExtractor(dataSource, Constants.addressExtractorName, config.networkType, config.address)
    scanner.registerExtractor(commitmentExtractor)
    scanner.registerExtractor(permitExtractor)
    scanner.registerExtractor(eventTriggerExtractor)
    scanner.registerExtractor(plainExtractor)

    // TODO: Add commitment cleanup job
}
