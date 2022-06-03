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

        if (SECRET_KEY === undefined) {
            throw new Error("Secret key doesn't set in config file");
        }

        if (URL === undefined) {
            throw new Error("koios URL is not set config file");
        }

        if (INTERVAL === undefined) {
            throw new Error("Scanner interval is not set in the config file");
        }

        if (INITIAL_HEIGHT === undefined) {
            throw new Error("Scanner initial height is not set in the config file");
        }

        if (EXPLORER_URL === undefined) {
            throw new Error("Ergo Explorer Url is not set in the config");
        }

        if (NODE_URL === undefined) {
            throw new Error("Ergo Node Url is not set in the config");
        }

        if (RWT_ID === undefined) {
            throw new Error("RWTId doesn't set in config file");
        }

        if (REPO_NFT === undefined) {
            throw new Error("Repo NFT doesn't set in config file");
        }

        this.networkType = networkType;
        this.secretKey = SECRET_KEY;
        this.url = URL;
        this.interval = INTERVAL;
        this.initialHeight = INITIAL_HEIGHT;
        this.explorerUrl = EXPLORER_URL;
        this.nodeUrl = NODE_URL;
        this.RWTId = RWT_ID;
        this.RepoNFT = REPO_NFT;

    }

    static getConfig() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
}

