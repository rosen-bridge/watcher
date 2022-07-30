import { CardanoConfig } from "./config/config";
import { Scanner } from "./cardano/scanner/scanner";
import { networkDatabase } from "./index";
import { KoiosNetwork } from "./cardano/network/koios";
import config from "config";
import tokens from './config/tokens.json' assert { type: "json" };

export const cardanoConfig = CardanoConfig.getConfig();
let scanner: Scanner;

const scanningJob = () => {
    scanner.update().then(() => setTimeout(scanningJob, cardanoConfig.interval * 1000))
}

export const cardanoScanner = () => {
    const koiosNetwork = new KoiosNetwork();
    scanner = new Scanner(networkDatabase, koiosNetwork, config, tokens);
    scanningJob()
}
