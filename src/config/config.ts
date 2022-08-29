import config from "config";
import * as wasm from "ergo-lib-wasm-nodejs";
import { SecretError } from "../errors/errors";
import { uint8ArrayToHex } from "../utils/utils";

const NETWORK_TYPE: string | undefined = config.get?.('ergo.networkType');
const SECRET_KEY: string | undefined = config.get?.('ergo.watcherSecretKey');
const URL: string | undefined = config.get?.('cardano.node.URL');
const INTERVAL: number | undefined = config.get?.('cardano.interval');
const CARDANO_INITIAL_HEIGHT: number | undefined = config.get?.('cardano.initialBlockHeight');
const BRIDGE_SCAN_INTERVAL: number | undefined = config.get?.('bridgeScanner.interval');
const ERGO_INITIAL_HEIGHT: number | undefined = config.get?.('ergo.scanner.initialBlockHeight');
const COMMITMENT_HEIGHT_LIMIT: number | undefined = config.get?.('bridgeScanner.heightLimit');
const CLEANUP_CONFIRMATION: number | undefined = config.get?.('bridgeScanner.cleanupConfirmation');
const EXPLORER_URL: string | undefined = config.get?.('ergo.explorerUrl');
const NODE_URL: string | undefined = config.get?.('ergo.nodeUrl');
const RWT_ID: string | undefined = config.get?.('ergo.RWTId');
const REPO_NFT: string | undefined = config.get?.('ergo.repoNFT');
const CARDANO_TIMEOUT: number | undefined = config.get?.('cardano.timeout');
const ERGO_EXPLORER_TIMEOUT: number | undefined = config.get?.('ergo.explorerTimeout');
const ERGO_NODE_TIMEOUT: number | undefined = config.get?.('ergo.nodeTimeout');
const NETWORK_WATCHER: string | undefined = config.get?.('network');
const COMMITMENT_CREATION_INTERVAL: number | undefined = config.get?.('ergo.commitmentCreationInterval')
const COMMITMENT_REVEAL_INTERVAL: number | undefined = config.get?.('ergo.commitmentRevealInterval')
const TRANSACTION_CHECK_INTERVAL: number | undefined = config.get?.('ergo.transactions.interval')
const TRANSACTION_REMOVING_TIMEOUT: number | undefined = config.get?.('ergo.transactions.timeout');
const TRANSACTION_CONFIRMATION: number | undefined = config.get?.('ergo.transactions.confirmation');
const OBSERVATION_CONFIRMATION: number | undefined = config.get?.('observation.confirmation');
const OBSERVATION_VALID_THRESH: number | undefined = config.get?.('observation.validThreshold');

const supportedNetworks: Array<string> = ['ergo-node', 'cardano-koios']

class Config {
    private static instance: Config;
    networkType: wasm.NetworkPrefix;
    secretKey: wasm.SecretKey;
    address: string;
    explorerUrl: string;
    nodeUrl: string;
    nodeTimeout: number;
    explorerTimeout: number;
    RWTId: string;
    RepoNFT: string;
    bridgeScanInterval: number;
    ergoInitialHeight: number
    cleanupConfirmation: number;
    networkWatcher: string;
    commitmentCreationInterval: number;
    commitmentRevealInterval: number;
    transactionRemovingTimeout: number;
    transactionConfirmation: number;
    transactionCheckingInterval: number;
    observationConfirmation: number;
    observationValidThreshold: number;

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
                "We generated a secret key for you can use this if you want:",
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
        if (BRIDGE_SCAN_INTERVAL === undefined) {
            throw new Error("Commitment scanner interval doesn't set correctly");
        }
        if (ERGO_INITIAL_HEIGHT === undefined) {
            throw new Error("Ergo scanner initial height doesn't set correctly");
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
        if (!NETWORK_WATCHER || !supportedNetworks.includes(NETWORK_WATCHER)) {
            throw new Error("Watching Bridge is not set correctly");
        }
        if (!COMMITMENT_CREATION_INTERVAL) {
            throw new Error("Commitment creation job interval is not set");
        }
        if (!COMMITMENT_REVEAL_INTERVAL) {
            throw new Error("Commitment reveal job interval is not set");
        }
        if (!TRANSACTION_CHECK_INTERVAL) {
            throw new Error("Transaction checking job interval is not set");
        }
        if (!TRANSACTION_CONFIRMATION) {
            throw new Error("Ergo transaction confirmation doesn't set correctly");
        }
        if (!TRANSACTION_REMOVING_TIMEOUT) {
            throw new Error("Ergo transaction timeout doesn't set correctly");
        }
        if (!OBSERVATION_CONFIRMATION) {
            throw new Error("Watcher observation confirmation doesn't set correctly");
        }
        if (!OBSERVATION_VALID_THRESH) {
            throw new Error("Watcher observation valid thresh doesn't set correctly");
        }

        const secretKey = wasm.SecretKey.dlog_from_bytes(Buffer.from(SECRET_KEY, "hex"))
        const watcherAddress: string = secretKey.get_address().to_base58(networkType)


        this.networkType = networkType;
        this.secretKey = secretKey;
        this.address = watcherAddress;
        this.explorerUrl = EXPLORER_URL;
        this.nodeUrl = NODE_URL;
        this.explorerTimeout = ERGO_EXPLORER_TIMEOUT;
        this.nodeTimeout = ERGO_NODE_TIMEOUT;
        this.RWTId = RWT_ID;
        this.RepoNFT = REPO_NFT;
        this.bridgeScanInterval = BRIDGE_SCAN_INTERVAL;
        this.cleanupConfirmation = CLEANUP_CONFIRMATION;
        this.networkWatcher = NETWORK_WATCHER
        this.commitmentCreationInterval = COMMITMENT_CREATION_INTERVAL
        this.commitmentRevealInterval = COMMITMENT_REVEAL_INTERVAL
        this.transactionCheckingInterval = TRANSACTION_CHECK_INTERVAL
        this.transactionConfirmation = TRANSACTION_CONFIRMATION;
        this.transactionRemovingTimeout = TRANSACTION_REMOVING_TIMEOUT;
        this.observationConfirmation = OBSERVATION_CONFIRMATION
        this.observationValidThreshold = OBSERVATION_VALID_THRESH
        this.ergoInitialHeight = ERGO_INITIAL_HEIGHT
    }

    static getConfig() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
}

class CardanoConfig {
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
        if (CARDANO_INITIAL_HEIGHT === undefined) {
            throw new Error("Cardano Scanner initial height is not set in the config file");
        }
        if (CARDANO_TIMEOUT === undefined) {
            throw new Error("Cardano network timeout doesn't set correctly");
        }

        this.koiosURL = URL;
        this.interval = INTERVAL;
        this.timeout = CARDANO_TIMEOUT;
        this.initialHeight = CARDANO_INITIAL_HEIGHT;
    }

    static getConfig() {
        if (!CardanoConfig.instance) {
            CardanoConfig.instance = new CardanoConfig();
        }
        return CardanoConfig.instance;
    }
}

const Constants = {
    ergoNode : 'ergo-node',
    cardanoKoios : 'cardano-koios',
    addressExtractorName : "watcher-address-extractor",
    permitExtractorName : "watcher-permit-extractor",
    commitmentExtractorName : "watcher-commitment-extractor",
    triggerExtractorName : "watcher-trigger-extractor"
}

export { Config, CardanoConfig, Constants}
