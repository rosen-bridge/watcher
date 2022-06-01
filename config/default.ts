export default {
    node: {
        URL: "https://testnet.koios.rest/api/v0",
    },
    scanner: {
        interval: 10,
        initialBlockHeight: 3471392,
    },
    ergo: {
        explorerUrl: "http://10.10.9.3:7000",
        nodeUrl: "http://10.10.9.3:9064",
        networkType: "Mainnet",
        watcherSecretKey: "a498c0ee3ba21ee27ade45bb500686c313460b32267dda605253d815579605ea",
    },
    commitmentScanner: {
        interval: 10,
        initialBlockHeight: 208640,
        heightLimit: 100,
        cleanupConfirmation: 10,
    },
};

export const tokens = {
    RWT: "469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db",
    RepoNFT: "2222222222222222222222222222222222222222222222222222222222222222",
    GuardNFT: "3333333333333333333333333333333333333333333333333333333333333333",
    CleanupNFT: "4444444444444444444444444444444444444444444444444444444444444444"
}
