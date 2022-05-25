import axios from "axios";
import config from "config";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Info } from "../../objects/ergo";
import { Address, ErgoBox } from "ergo-lib-wasm-nodejs";
import { ergoTreeToBase58Address } from "../../api/ergoUtils";
import ErgoTx from "./types";

const EXPLORER_URL: string | undefined = config.get?.('ergo.explorer');
const NODE_URL: string | undefined = config.get?.('ergo.node');

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

    getBoxWithToken = async (address: Address, tokenId: string): Promise<JSON> => {
        const box = await this.getCoveringErgAndTokenForAddress(
            address.to_ergo_tree().to_base16_bytes(),
            0,
            {[tokenId]: 1},
            box => {
                if (!box.hasOwnProperty('assets')) {
                    return false
                }
                let found = false
                box.assets.forEach((item: { tokenId: string }) => {
                    if (item.tokenId === tokenId) found = true
                });
                return found
            }
        )
        if (!box.covered) {
            throw Error("box with Token:" + tokenId + " not found")
        }
        return JSON.parse(box.boxes[0].to_json());
    }

    getErgBox = async (address: Address, amount: number, filter: (box: any) => boolean = () => true): Promise<Array<ErgoBox>> => {
        const box = await this.getCoveringErgAndTokenForAddress(
            address.to_ergo_tree().to_base16_bytes(),
            amount,
            {},
            filter,
        )
        if (!box.covered) {
            throw Error("erg box not found")
        }
        return box.boxes;
    }

    trackMemPool = async (box: ergoLib.ErgoBox): Promise<ergoLib.ErgoBox> => {
        const address: string = ergoTreeToBase58Address(box.ergo_tree())
        let memPoolBoxesMap = new Map<string, ergoLib.ErgoBox>();
        (await this.getMemPoolTxForAddress(address).then(res => {
            return res.items
        })).forEach((tx: ErgoTx) => {
            for (let inBox of tx.inputs) {
                if (inBox.address === address) {
                    for (let outBox of tx.outputs) {
                        if (outBox.address === address) {
                            memPoolBoxesMap.set(inBox.boxId, ergoLib.ErgoBox.from_json(JSON.stringify(outBox)))
                            break
                        }
                    }
                    break
                }
            }
        })
        let lastBox: ergoLib.ErgoBox = box
        while (memPoolBoxesMap.has(lastBox.box_id().to_str())) lastBox = memPoolBoxesMap.get(lastBox.box_id().to_str())!
        return lastBox
    }

    getMemPoolTxForAddress = async (address: string) => {
        return await explorerApi.get<{ items: Array<ErgoTx>, total: number }>(`/api/v1/mempool/transactions/byAddress/${address}`).then(res => res.data)
    }


}