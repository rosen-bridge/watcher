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
        secret: "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2",
        WID: "f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e7"
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
