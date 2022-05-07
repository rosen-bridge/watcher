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
        nodeUrl: "",
        networkType: wasm.NetworkPrefix.Mainnet
    },
    commitmentScanner: {
        interval: 10,
        initialBlockHeight: 100,
    },
};

export const commitmentAddress = "alaki"
export const tokens ={
    RWT: "rwt",

}
