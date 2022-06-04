import * as wasm from "ergo-lib-wasm-nodejs";

export default {
    node: {
        URL: "https://testnet.koios.rest/api/v0",
    },
    scanner: {
        interval: 10,
        initialBlockHeight: 3471392,
    },
    ergo: {
        explorerUrl: "https://api.ergoplatform.com/",
        nodeUrl: "http://10.10.9.3:9064",
        networkType: wasm.NetworkPrefix.Mainnet,
        sendTxTimeout: 10000,
        txFee: 1000000,
        minBoxVal: 1000000,
        address: "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
        secret: "b3a6478ffd4a75a79463507552aeb052faf456e862a48f776ca21167cc1db3a8",
        WID: "906d389a39c914a393cb06c0ab7557d04b58f7e9e73284aac520d08e7dd46a82"
    },
    commitmentScanner: {
        interval: 10,
        initialBlockHeight: 208640,
        heightLimit: 100,
        cleanupConfirmation: 0,
    },
};

export const tokens ={
    RWT: "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
    RepoNFT: "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48",
    GuardNFT: "a6ac381e6fa99929fd1477b3ba9499790a775e91d4c14c5aa86e9a118dfac853",
    CleanupNFT: "ac0c16cee8caefd0814c5568a9d50bea51fec88e8abbd3ac8347b94d054a1b65"
}
