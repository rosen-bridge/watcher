import { CardanoConfig } from "../config/config";
import { ErgoScanner, CardanoKoiosScanner } from "@rosen-bridge/scanner";
import { Config } from "../config/config";
import { dataSource } from "../../config/dataSource";
import { ErgoObservationExtractor, CardanoObservationExtractor } from "@rosen-bridge/observation-extractor";
import tokens from '../config/tokens.test.json' assert { type: "json" };
import { CommitmentExtractor, PermitExtractor, EventTriggerExtractor } from "@rosen-bridge/watcher-data-extractor";
import { rosenConfig } from "../config/rosenConfig";
import { ErgoUTXOExtractor } from "@rosen-bridge/address-extractor";

const ergoConfig = Config.getConfig()
let scanner: ErgoScanner;
let cardanoScanner: CardanoKoiosScanner;

const ergoScanningJob = () => {
    scanner.update().then(() => setTimeout(ergoScanningJob, ergoConfig.bridgeScanInterval * 1000))
}

const cardanoScanningJob = (interval: number) => {
    scanner.update().then(() => setTimeout(() => cardanoScanningJob(interval), interval * 1000))
}

export const scannerInit = (WID?: string) => {
    const ergoScannerConfig = {
        nodeUrl: ergoConfig.nodeUrl,
        timeout: ergoConfig.nodeTimeout,
        initialHeight: 	253477,
        dataSource: dataSource,
    }
    scanner = new ErgoScanner(ergoScannerConfig);
    ergoScanningJob()
    if (ergoConfig.networkWatcher == "Ergo") {
        const observationExtractor = new ErgoObservationExtractor(dataSource, tokens)
        scanner.registerExtractor(observationExtractor)
    } else if (ergoConfig.networkWatcher == "Cardano") {
        console.log("***********************CARDANO************************")
        const cardanoConfig = CardanoConfig.getConfig()
        const cardanoScannerConfig = {
            koiosUrl: cardanoConfig.koiosURL,
            timeout: cardanoConfig.timeout,
            initialHeight: cardanoConfig.initialHeight,
            dataSource: dataSource,
        }
        cardanoScanner = new CardanoKoiosScanner(cardanoScannerConfig)
        cardanoScanningJob(cardanoConfig.interval)
        const observationExtractor = new CardanoObservationExtractor(dataSource, tokens)
        cardanoScanner.registerExtractor(observationExtractor)
    }
    const commitmentExtractor = new CommitmentExtractor("watcher-commitment", [rosenConfig.commitmentAddress], ergoConfig.RWTId, dataSource)
    const permitExtractor = new PermitExtractor("watcher-permit", dataSource, rosenConfig.watcherPermitAddress, ergoConfig.RWTId)
    const eventTriggerExtractor = new EventTriggerExtractor("watcher-trigger", dataSource, rosenConfig.eventTriggerAddress, ergoConfig.RWTId)
    // const plainExtractor = new ErgoUTXOExtractor(dataSource, ergoConfig.plainExtractorName, ergoConfig.networkType, ergoConfig.address)
    scanner.registerExtractor(commitmentExtractor)
    scanner.registerExtractor(permitExtractor)
    scanner.registerExtractor(eventTriggerExtractor)
    // scanner.registerExtractor(plainExtractor)
    if(WID) addWidExtractor(WID)

    // TODO: Add commitment cleanup job
}

export const addWidExtractor = (WID: string) => {
    const widExtractor = new ErgoUTXOExtractor(dataSource, ergoConfig.widExtractorName, ergoConfig.networkType, ergoConfig.address, [WID])
    scanner.registerExtractor(widExtractor)
}
