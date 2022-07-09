import { Scanner } from "./bridge/scanner/scanner";
import config from "config";
import { ErgoConfig } from "./config/config";
import { bridgeDatabase, ergoNetworkApi, watcherTransaction } from "./index";

const ergoConfig = ErgoConfig.getConfig();
let scanner: Scanner;

const scanningJob = () => {
    scanner.update().then(() => setTimeout(scanningJob, ergoConfig.bridgeScanInterval * 1000))
}
const removeOldCommitmentsJob = () => {
    scanner.removeOldCommitments().then(() => setTimeout(removeOldCommitmentsJob, ergoConfig.bridgeScanInterval * 1000))
}

export const bridgeScanner = () => {
    scanner = new Scanner(bridgeDatabase, ergoNetworkApi, config, watcherTransaction);
    scanningJob()
    removeOldCommitmentsJob()
}
