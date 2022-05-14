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
        networkType: wasm.NetworkPrefix.Mainnet
    },
    commitmentScanner: {
        interval: 10,
        initialBlockHeight: 100,
        heightLimit: 100,
    },
};

export const commitmentAddress = "address"
export const tokens ={
    RWT: "4a275f6cfe862e1e6bcf0bc9ea540d66c7daf2d35eae141fd14e021d5cf20317",
}
