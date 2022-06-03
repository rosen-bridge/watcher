import config from "config";
import { NetworkPrefix } from "ergo-lib-wasm-nodejs";
import * as wasm from "ergo-lib-wasm-nodejs";

const NETWORK_TYPE: string | undefined = config.get?.('ergo.networkType');
const SECRET_KEY: string | undefined = config.get?.('ergo.watcherSecretKey');
const URL: string | undefined = config.get?.('node.URL');
const INTERVAL: number | undefined = config.get?.('scanner.interval');
const INITIAL_HEIGHT: number | undefined = config.get?.('scanner.initialBlockHeight');
const EXPLORER_URL: string | undefined = config.get?.('ergo.explorerUrl');
const NODE_URL: string | undefined = config.get?.('ergo.nodeUrl');
const RWT_ID: string | undefined = config.get?.('ergo.RWTId');
const REPO_NFT: string | undefined = config.get?.('ergo.repoNFT');

export const tokens = {
    RWT: "469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db",
    RepoNFT: "2222222222222222222222222222222222222222222222222222222222222222",
    GuardNFT: "3333333333333333333333333333333333333333333333333333333333333333",
    CleanupNFT: "4444444444444444444444444444444444444444444444444444444444444444"
}

export class Config{
    private static instance: Config;
    networkType: NetworkPrefix;
    secretKey: string;
    url: string;
    interval: number;
    initialHeight: number;
    explorerUrl: string;
    nodeUrl: string;
    RWTId: string;
    RepoNFT: string;

    private constructor() {
        let networkType: NetworkPrefix = wasm.NetworkPrefix.Testnet;
        switch (NETWORK_TYPE) {
            case "Mainnet": {
                networkType = wasm.NetworkPrefix.Mainnet;
                break;
            }
            case "Testnet": {
                break;
            }
            default: {
                throw new Error("Network type doesn't set correctly in config file");
            }
        }
        this.networkType = networkType;
        (
            SECRET_KEY ?
                this.secretKey = SECRET_KEY :
                throw new Error("Secret key doesn't set in config file")
        );
        (
            URL ?
                this.url = URL :
                throw new Error("koios URL is not set config file")
        );
        (
            INTERVAL ?
                this.interval = INTERVAL :
                throw new Error("Scanner interval is not set in the config file")
        );
        (
            INITIAL_HEIGHT ?
                this.initialHeight = INITIAL_HEIGHT :
                throw new Error("Scanner initial height is not set in the config file")
        );
        (
            EXPLORER_URL ?
                this.explorerUrl = EXPLORER_URL :
                throw new Error("Ergo Explorer Url is not set in the config")
        );
        (
            NODE_URL ?
                this.nodeUrl = NODE_URL :
                throw new Error("Ergo Node Url is not set in the config")
        );
        (
            RWT_ID ?
                this.RWTId = RWT_ID :
                throw new Error("RWTId doesn't set in config file")
        );
        (
            REPO_NFT ?
                this.RepoNFT = REPO_NFT :
                throw new Error("Repo NFT doesn't set in config file")
        );
    }

    static getConfig() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
}

