import axios from "axios";
import config from "config";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Info, RSNBox } from "../../objects/ergo";

const EXPLORER_URL: string | undefined = config.get?.('ergo.explorer');
const NODE_URL: string | undefined = config.get?.('ergo.node');

// const RSN: string | undefined = config.get?.('ergo.RSN');
// const RSN = "25bcbb2381e2569221737f12e06215c59cef8bb1403225084aaf6cf61f500bff";
export const RSN = "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516";
const watcherAddress = "9fEsTTtn2i4sHLmYMJqTLMPvrEQjMgWJxoupr1v2b6nT98Eyvgb";
// const RepoNFT = "3688bf4dbfa9e77606446ca0189546621097cee6979e2befc8ef56825ba82580";
export const RepoNFT = "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48";

const explorerApi = axios.create({
    baseURL: EXPLORER_URL,
    timeout: 8000,
});

const nodeClient = axios.create({
    baseURL: NODE_URL,
    timeout: 8000,
    headers: {"Content-Type": "application/json"}
});

export class ErgoNetwork {

    pay2ScriptAddress = (script: string): Promise<string> => {
        return nodeClient.post("/script/p2sAddress", {source: script}).then(
            res => res.data.address
        )
    }

    getHeight = async (): Promise<number> => {
        return nodeClient.get<Info>("/info").then((res) => res.data.fullHeight);
    }

    getBoxesForAddress = async (tree: string, offset = 0, limit = 100) => {
        return explorerApi.get(`/api/v1/boxes/unspent/byErgoTree/${tree}?offset=${offset}&limit=${limit}`).then(res => res.data);
    }

    getBoxesByAddress = (address: string) => {
        return explorerApi.get(`/api/v1/boxes/unspent/byAddress/${address}`).then(res => res.data)
    }

    getLastBlockHeader = () => {
        return nodeClient.get("/blocks/lastHeaders/10").then(
            res => res.data
        )
    }

    sendTx = (tx: any) => {
        return nodeClient.post("/transactions", JSON.parse(tx)).then(response => ({"txId": response.data as string})).catch(exp => {
            console.log(exp.response.data)
        });
    };


    getErgoStateContext = async (): Promise<ergoLib.ErgoStateContext> => {
        const blockHeaderJson = await this.getLastBlockHeader();
        const blockHeaders = ergoLib.BlockHeaders.from_json(blockHeaderJson);
        const preHeader = ergoLib.PreHeader.from_block_header(blockHeaders.get(0));
        return new ergoLib.ErgoStateContext(preHeader, blockHeaders);
    }

    getCoveringErgAndTokenForAddress = async (
        tree: string,
        amount: number,
        covering: { [id: string]: number } = {},
        filter: (box: any) => boolean = () => true
    ): Promise<{ covered: boolean, boxes: Array<ergoLib.ErgoBox> }> => {
        let res = []
        const boxesItems = await this.getBoxesForAddress(tree, 0, 1)
        const total = boxesItems.total;
        let offset = 0;
        const remaining = () => {
            const tokenRemain = Object.entries(covering).map(([key, amount]) => Math.max(amount, 0)).reduce((a, b) => a + b, 0);
            return tokenRemain + Math.max(amount, 0) > 0;
        }
        while (offset < total && remaining()) {
            const boxes = await this.getBoxesForAddress(tree, offset, 10)
            for (let box of boxes.items) {
                if (filter(box)) {
                    res.push(box);
                    amount -= box.value;
                    box.assets.map((asset: any) => {
                        if (covering.hasOwnProperty(asset.tokenId)) {
                            covering[asset.tokenId] -= asset.amount;
                        }
                    })
                    if (!remaining()) break
                }
            }
            offset += 10;
        }
        return {boxes: res.map(box => ergoLib.ErgoBox.from_json(JSON.stringify(box))), covered: !remaining()}

    }

    //TODO: the functions should become one
    getRSNBoxes = async (): Promise<RSNBox> => {
        const watcherAddress = ergoLib.Address.from_mainnet_str("9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT");

        const box = await this.getCoveringErgAndTokenForAddress(
            watcherAddress.to_ergo_tree().to_base16_bytes(),
            0,
            {[RSN]: 1},
            box => {
                if (!box.hasOwnProperty('assets')) {
                    return false
                }
                let found = false
                box.assets.forEach((item: { tokenId: string }) => {
                    if (item.tokenId === RSN) found = true
                });
                return found
            }
        )
        if (!box.covered) {
            throw Error("rsn box not found")
        }
        return new RSNBox(JSON.parse(box.boxes[0].to_json()))
    }

    getRepoBox = async () => {
        const bankAddress = ergoLib.Address.from_mainnet_str(
            "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7"
            // "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
        );

        const box = await this.getCoveringErgAndTokenForAddress(
            bankAddress.to_ergo_tree().to_base16_bytes(),
            0,
            {[RepoNFT]: 1},
            box => {
                if (!box.hasOwnProperty('assets')) {
                    return false
                }
                let found = false
                box.assets.forEach((item: { tokenId: string }) => {
                    if (item.tokenId === RepoNFT) found = true
                });
                return found
            }
        )
        if (!box.covered) {
            throw Error("repo box not found")
        }
        return new RSNBox(JSON.parse(box.boxes[0].to_json()))
    }


}