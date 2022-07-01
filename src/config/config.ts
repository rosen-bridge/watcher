import config from "config";
import * as wasm from "ergo-lib-wasm-nodejs";
import { SecretError } from "../errors/errors";
import { uint8ArrayToHex } from "../utils/utils";
import { ErgoStateContext } from "ergo-lib-wasm-nodejs";

const NETWORK_TYPE: string | undefined = config.get?.('ergo.networkType');
const SECRET_KEY: string | undefined = config.get?.('ergo.watcherSecretKey');
const URL: string | undefined = config.get?.('cardano.node.URL');
const INTERVAL: number | undefined = config.get?.('cardano.interval');
const INITIAL_HEIGHT: number | undefined = config.get?.('cardano.initialBlockHeight');
const COMMITMENT_INTERVAL: number | undefined = config.get?.('commitmentScanner.interval');
const COMMITMENT_INITIAL_HEIGHT: number | undefined = config.get?.('commitmentScanner.initialBlockHeight');
const COMMITMENT_HEIGHT_LIMIT: number | undefined = config.get?.('commitmentScanner.heightLimit');
const CLEANUP_CONFIRMATION: number | undefined = config.get?.('commitmentScanner.cleanupConfirmation');
const EXPLORER_URL: string | undefined = config.get?.('ergo.explorerUrl');
const NODE_URL: string | undefined = config.get?.('ergo.nodeUrl');
const RWT_ID: string | undefined = config.get?.('ergo.RWTId');
const REPO_NFT: string | undefined = config.get?.('ergo.repoNFT');
const CARDANO_TIMEOUT: number | undefined = config.get?.('cardano.timeout');
const ERGO_EXPLORER_TIMEOUT: number | undefined = config.get?.('ergo.explorerTimeout');
const ERGO_NODE_TIMEOUT: number | undefined = config.get?.('ergo.nodeTimeout');
const ERGO_SCANNER_INTERVAL: number | undefined = config.get?.('ergo.scanner.interval');
const ERGO_SCANNER_INITIAL_HEIGHT: number | undefined = config.get?.('ergo.scanner.initialBlockHeight');

export class ErgoConfig{
    private static instance: ErgoConfig;
    networkType: wasm.NetworkPrefix;
    secretKey: string;
    explorerUrl: string;
    nodeUrl: string;
    nodeTimeout: number;
    explorerTimeout: number;
    RWTId: string;
    RepoNFT: string;
    commitmentInterval: number;
    commitmentInitialHeight: number;
    commitmentHeightLimit: number;
    cleanupConfirmation: number;

    private constructor() {
        let networkType: wasm.NetworkPrefix = wasm.NetworkPrefix.Testnet;
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

        if (SECRET_KEY === undefined || SECRET_KEY === "") {
            console.log(
                "we generate a secret key for you can use this if you want:",
                uint8ArrayToHex(
                    wasm.SecretKey.random_dlog().to_bytes()
                )
            );
            throw new SecretError("Secret key doesn't set in config file");
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
        if (COMMITMENT_INTERVAL === undefined) {
            throw new Error("Commitment scanner interval doesn't set correctly");
        }
        if (COMMITMENT_INITIAL_HEIGHT === undefined) {
            throw new Error("Commitment scanner initial height doesn't set correctly");
        }
        if (COMMITMENT_HEIGHT_LIMIT === undefined) {
            throw new Error("Commitment scanner height limit doesn't set correctly");
        }
        if (CLEANUP_CONFIRMATION === undefined) {
            throw new Error("Clean up doesn't set correctly");
        }
        if (ERGO_EXPLORER_TIMEOUT === undefined) {
            throw new Error("Ergo explorer timeout doesn't set correctly");
        }
        if (ERGO_NODE_TIMEOUT === undefined) {
            throw new Error("Ergo node timeout doesn't set correctly");
        }

        this.networkType = networkType;
        this.secretKey = SECRET_KEY;
        this.explorerUrl = EXPLORER_URL;
        this.nodeUrl = NODE_URL;
        this.explorerTimeout = ERGO_EXPLORER_TIMEOUT;
        this.nodeTimeout = ERGO_NODE_TIMEOUT;
        this.RWTId = RWT_ID;
        this.RepoNFT = REPO_NFT;
        this.commitmentInterval = COMMITMENT_INTERVAL;
        this.commitmentInitialHeight = COMMITMENT_INITIAL_HEIGHT;
        this.commitmentHeightLimit = COMMITMENT_HEIGHT_LIMIT;
        this.cleanupConfirmation = CLEANUP_CONFIRMATION;
    }

    static getConfig() {
        if (!ErgoConfig.instance) {
            ErgoConfig.instance = new ErgoConfig();
        }
        return ErgoConfig.instance;
    }
}

export class CardanoConfig{
    private static instance: CardanoConfig;
    koiosURL: string;
    interval: number;
    timeout: number;
    initialHeight: number;

    private constructor() {

        if (URL === undefined) {
            throw new Error("koios URL is not set config file");
        }
        if (INTERVAL === undefined) {
            throw new Error("Cardano Scanner interval is not set in the config file");
        }
        if (INITIAL_HEIGHT === undefined) {
            throw new Error("Cardano Scanner initial height is not set in the config file");
        }
        if (CARDANO_TIMEOUT === undefined) {
            throw new Error("Cardano network timeout doesn't set correctly");
        }

        this.koiosURL = URL;
        this.interval = INTERVAL;
        this.timeout = CARDANO_TIMEOUT;
        this.initialHeight = INITIAL_HEIGHT;

    }

    static getConfig() {
        if (!CardanoConfig.instance) {
            CardanoConfig.instance = new CardanoConfig();
        }
        return CardanoConfig.instance;
    }
}

export class ErgoScannerConfig{
    private static instance: ErgoScannerConfig;
    interval: number;
    initialHeight: number;

    private constructor() {
        if (ERGO_SCANNER_INTERVAL === undefined) {
            throw new Error("Ergo Scanner interval is not set in the config file");
        }
        if (ERGO_SCANNER_INITIAL_HEIGHT === undefined) {
            throw new Error("Ergo Scanner initial height is not set in the config file");
        }

        this.interval = ERGO_SCANNER_INTERVAL;
        this.initialHeight = ERGO_SCANNER_INITIAL_HEIGHT;
    }

    static getConfig() {
        if (!ErgoScannerConfig.instance) {
            ErgoScannerConfig.instance = new ErgoScannerConfig();
        }
        return ErgoScannerConfig.instance;
    }
}
