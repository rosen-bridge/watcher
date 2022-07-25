import { ErgoScannerConfig } from "./config/config";
import { ErgoScanner } from "./ergoScanner/scanner";
import { ergoNetworkApi, networkDatabase } from "./index";

const scannerConfig = ErgoScannerConfig.getConfig()
let scanner: ErgoScanner;

const scanningJob = () => {
    scanner.update().then(() => setTimeout(scanningJob, scannerConfig.interval * 1000))
}

export const ergoScanner = () => {
    scanner = new ErgoScanner(networkDatabase, ergoNetworkApi);
    scanningJob()
}
