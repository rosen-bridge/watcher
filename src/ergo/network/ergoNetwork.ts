import axios from "axios";
import config from "config";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Info, RSNBox } from "../../objects/ergo";

const EXPLORER_URL: string | undefined = config.get?.('ergo.explorer');
const NODE_URL: string | undefined = config.get?.('ergo.node');

// const RSN: string | undefined = config.get?.('ergo.RSN');
// const RSN = "25bcbb2381e2569221737f12e06215c59cef8bb1403225084aaf6cf61f500bff";
const RSN = "34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2";
const watcherAddress = "9fEsTTtn2i4sHLmYMJqTLMPvrEQjMgWJxoupr1v2b6nT98Eyvgb";
// const RepoNFT = "3688bf4dbfa9e77606446ca0189546621097cee6979e2befc8ef56825ba82580";
const RepoNFT = "2d94a61d4981814007949bb580711c4b514670401748286d1084f45bae256c20";

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
            "CXdxdZCKtYkZHe7HaxYxg1HdEmYeyjhsqt6U8ugdxLVL73ewXDedVsYf3y5H2bs29UipTqn3axowxSC7j8tGESuA2H7W9CeJdjthJzHvpBbd7D8dUgShJXuG14S3Y36dih3jaq5t3fr762Xg4eHe89AWrbofVz3if21pBrtrpxB8Zyc1VT3HpMrspQTENm122wnCDpj3jSE64uc3TYi1HoKzpNTHcH1RKqsYamjkgVjEFjuHyMFk9Rr2FwyauTwpwie9HDkih3Gr1AzqWm9C9iWe49roLc1Ckbb5EV3FDSPegkHpW28TuzJxZ7U5ZQUC8FUS5VTguYXB7iC68zzEnNzaJHYYq2uxmkd6UY2z4bLawg5we4KuJATN4Qtzvh527wZSNKCdPWNn5qk1DRUXjFwmrXXeVJzVcNTvFCjN1Lx4mwUdAfQxcXQp8jv9etsQMhnhgZiDNLv4jWC7r9WXEGpRF3hLbwQ2BFMcFxBQZXmMF7aRb2QzgJbHz5rchD93inwAPR6L2vLBvfzr3EGEw5AqppJPdJ1Cbu4ah1CpjshF3wKfkqJqt8oyZDtg3UDRX7T2jq2JrRhjj99dtoCGptH6o69UpLM24qsLCQQEU31G7HNhGLeSKC1TS8sHL9xLm6okAZYFPY2rTzvTpsucxBryHmShs1JnNC2iEKmcLjuo89KZr9rKoQEtf5xNDke6Qcba79E7BFXyNEzkNgpyo8JxivPHqRT1XthqV9PPmg8m7usEGWkyJSvZ66V1v6waYVxSwLAFVow6vSp44RhxZ356kBCYpDnojhvuqwnnWRnRHjiRdzh8ARiY96t5VjSpqRTJscMdd2UfNVjA8HciCWUgvHauwbcUMv2x5ZdmzVANSzT77tWjHbvX6mb7Sy5gurDdiatEwPytu3KHbYoxnaeWZvzsCG6kSvb6ss1jg9eSV3AnWDdH8myGoMjMEo"
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