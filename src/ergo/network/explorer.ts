import axios from "axios";
import config from "config";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { RSNBox } from "../../objects/ergo";

const EXPLORER_URL: string | undefined = config.get?.('ergo.explorer');
// const RSN: string | undefined = config.get?.('ergo.RSN');
const RSN = "0088eb2b6745ad637112b50a4c5e389881f910ebcf802b183d6633083c2b04fc";
const explorerApi = axios.create({
    baseURL: EXPLORER_URL,
    timeout: 8000,
});


export class Explorer {
    getBoxesForAddress = async (tree: string, offset = 0, limit = 100) => {
        return explorerApi.get(`/api/v1/boxes/unspent/byErgoTree/${tree}?offset=${offset}&limit=${limit}`).then(res => res.data);
    }

    getBoxesByAddress = (address: string) => {
        return explorerApi.get(`/api/v1/boxes/unspent/byAddress/${address}`).then(res => res.data)
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

    getRSNBoxes = async (setIndex: number): Promise<RSNBox> => {
        const watcherAddress = ergoLib.Address.from_mainnet_str("9erMHuJYNKQkZCaDs9REhpNaWbhMPbdVmqgM4s7M2GjtQ56j2xG");

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

    
}