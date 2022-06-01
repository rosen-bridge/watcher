import axios from "axios";
import * as wasm from "ergo-lib-wasm-nodejs";
import { Info } from "../../objects/ergo";
import { Address, ErgoBox } from "ergo-lib-wasm-nodejs";
import { ergoTreeToBase58Address } from "../../api/ergoUtils";
import { AddressBoxes, ErgoTx } from "./types";
import { JsonBI } from "../../network/parser";


const EXPLORER_URL: string | undefined = config.get?.('ergo.explorerUrl');
const NODE_URL: string | undefined = config.get?.('ergo.nodeUrl');

export const explorerApi = axios.create({
    baseURL: EXPLORER_URL,
    timeout: 8000,
});

export const nodeClient = axios.create({
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

    getBoxesForAddress = async (tree: string, offset = 0, limit = 100): Promise<AddressBoxes> => {
        return explorerApi.get<AddressBoxes>(
            `/api/v1/boxes/unspent/byErgoTree/${tree}`,
            {params: {offset: offset, limit: limit}, transformResponse: data => JsonBI.parse(data)}
        ).then(
            res => res.data
        );
    }

    getBoxesByAddress = (address: string): Promise<Array<string>> => {
        console.log(address)
        return explorerApi.get<AddressBoxes>(
            `/api/v1/boxes/unspent/byAddress/${address}`,
            {transformResponse: data => JsonBI.parse(data)}
        ).then((res) => {
                let boxes: Array<string> = [];
                if (res.data.total > 0) {
                    res.data.items.forEach(box => {
                        boxes.push(JsonBI.stringify(box))
                    })
                }
                return boxes;
            }
        );
    }

    getLastBlockHeader = () => {
        return nodeClient.get(
            "/blocks/lastHeaders/10",
        ).then(
            res => res.data
        )
    }

    sendTx = (tx: string) => {
        return nodeClient.post("/transactions", tx).then(response => ({"txId": response.data as string})).catch(exp => {
            console.log(exp.response.data)
        });
    };

    getErgoStateContext = async (): Promise<wasm.ErgoStateContext> => {
        const blockHeaderJson = await this.getLastBlockHeader();
        const blockHeaders = wasm.BlockHeaders.from_json(blockHeaderJson);
        const preHeader = wasm.PreHeader.from_block_header(blockHeaders.get(0));
        return new wasm.ErgoStateContext(preHeader, blockHeaders);
    }

    getCoveringErgAndTokenForAddress = async (
        tree: string,
        amount: bigint,
        covering: { [id: string]: bigint } = {},
        filter: (box: any) => boolean = () => true
    ): Promise<{ covered: boolean, boxes: Array<wasm.ErgoBox> }> => {
        let res = []
        const boxesItems = await this.getBoxesForAddress(tree, 0, 1)
        const total = boxesItems.total;
        let offset = 0;
        const bigIntMax = (a: bigint, b: bigint) => a > b ? a : b;
        const remaining = () => {
            const tokenRemain = Object.entries(covering)
                .map(([, amount]) => bigIntMax(amount, 0n)).reduce(
                    (a, b) => a + b,
                    0n
                );
            return tokenRemain + bigIntMax(amount, 0n) > 0;
        }
        while (offset < total && remaining()) {
            const boxes = await this.getBoxesForAddress(tree, offset, 10)
            for (let box of boxes.items) {
                if (filter(box)) {
                    res.push(box);
                    amount -= box.value;
                    if (box.assets) {
                        box.assets.map((asset: any) => {
                            if (covering.hasOwnProperty(asset.tokenId)) {
                                covering[asset.tokenId] -= asset.amount;
                            }
                        })
                    }
                    if (!remaining()) break
                }
            }
            offset += 10;
        }
        return {
            boxes: res.map(box => wasm.ErgoBox.from_json(JsonBI.stringify(box).toString())),
            covered: !remaining()
        }

    }

    getBoxWithToken = async (address: Address, tokenId: string): Promise<JSON> => {
        const box = await this.getCoveringErgAndTokenForAddress(
            address.to_ergo_tree().to_base16_bytes(),
            0n,
            {[tokenId]: 1n},
            box => {
                if (!box.assets) {
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
        return JsonBI.parse(box.boxes[0].to_json());
    }

    getErgBox = async (address: Address, amount: bigint, filter: (box: any) => boolean = () => true): Promise<Array<ErgoBox>> => {
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

    trackMemPool = async (box: wasm.ErgoBox): Promise<wasm.ErgoBox> => {
        const address: string = ergoTreeToBase58Address(box.ergo_tree())
        let memPoolBoxesMap = new Map<string, wasm.ErgoBox>();
        const transactions = await this.getMemPoolTxForAddress(address).then(
            res => {
                return res.items
            }
        );
        if (transactions !== undefined) {
            transactions.forEach((tx: ErgoTx) => {
                for (let inBox of tx.inputs) {
                    if (inBox.address === address) {
                        for (let outBox of tx.outputs) {
                            if (outBox.address === address) {
                                memPoolBoxesMap.set(inBox.boxId, wasm.ErgoBox.from_json(JsonBI.stringify(outBox)))
                                break
                            }
                        }
                        break
                    }
                }
            })
        }
        let lastBox: wasm.ErgoBox = box
        while (memPoolBoxesMap.has(lastBox.box_id().to_str())) lastBox = memPoolBoxesMap.get(lastBox.box_id().to_str())!
        return lastBox
    }

    getMemPoolTxForAddress = async (address: string) => {
        return await explorerApi.get<{ items: Array<ErgoTx> | undefined, total: number }>(
            `/api/v1/mempool/transactions/byAddress/${address}`
        ).then(res => res.data)
    }

}
