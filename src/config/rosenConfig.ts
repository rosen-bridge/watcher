import fs from "fs";
import { ErgoConfig } from "./config";

const ergoConfig = ErgoConfig.getConfig();

export type rosenConfig = {
    RSN: string;
    minBoxValue: string;
    fee: string;
    guardNFT: string;
    cleanupNFT: string;
    cleanupConfirm: number;
    watcherPermitAddress: string;
    RWTRepoAddress: string;
    fraudAddress: string;
    eventTriggerAddress: string;
    commitmentAddress: string;
    lockAddress: string;
    RepoNFT: string;
    RWTId: string;
}

class RosenConfig{
    minBoxValue = "1100000";
    fee = "1100000";
    RSN: string;
    guardNFT: string;
    cleanupNFT: string;
    cleanupConfirm: number;
    watcherPermitAddress: string;
    RWTRepoAddress: string;
    fraudAddress: string;
    eventTriggerAddress: string;
    commitmentAddress: string;
    lockAddress: string;
    RepoNFT: string;
    RWTId: string;

    constructor(network: string, networkType: string) {
        const rosenConfigPath = this.getAddress(network, networkType);
        if (!fs.existsSync(rosenConfigPath)) {
            throw new Error(`rosenConfig file with path ${rosenConfigPath} doesn't exist`);
        } else {
            const configJson: string = fs.readFileSync(rosenConfigPath, 'utf8');
            const config = JSON.parse(configJson);
            this.RSN = config.tokens.RSN;
            this.guardNFT = config.tokens.GuardNFT;
            this.cleanupNFT = config.tokens.CleanupNFT;
            this.cleanupConfirm = config.cleanupConfirm;
            this.watcherPermitAddress = config.addresses.WatcherPermit;
            this.RWTRepoAddress = config.addresses.RWTRepo;
            this.fraudAddress = config.addresses.Fraud;
            this.eventTriggerAddress = config.addresses.WatcherTriggerEvent;
            this.commitmentAddress = config.addresses.Commitment;
            this.lockAddress = config.addresses.lock;
            this.RepoNFT = config.tokens.RepoNFT;
            this.RWTId = config.tokens.RWTId;
        }
    }

    getAddress = (network: string, networkType: string) => {
        if (process.env.NODE_ENV === undefined || process.env.NODE_ENV !== "test") {
            return `src/config/${network}-${networkType}.json`;
        } else {
            return 'tests/config/ergo-testnet.json';
        }
    }

}

const network = ergoConfig.networkWatcher.split("-")[0].toLowerCase();
const networkType = ergoConfig.networkWatcherType.toLowerCase();
export const rosenConfig: rosenConfig = new RosenConfig(network, networkType);

export { RosenConfig };
