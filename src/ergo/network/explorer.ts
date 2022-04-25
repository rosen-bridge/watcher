import axios from "axios";
import config from "config";

const EXPLORER_URL: string | undefined = config.get?.('ergo.explorer');

const explorerApi = axios.create({
    baseURL: EXPLORER_URL,
    timeout: 8000
});

export class Explorer {
    getBoxesForAddress = async (tree: string, offset = 0, limit = 100) => {
        return explorerApi.get(`/api/v1/boxes/unspent/byErgoTree/${tree}?offset=${offset}&limit=${limit}`).then(res => res.data);
    }
    getBoxesByAddress = (address: string) => {
        return explorerApi.get(`/api/v1/boxes/unspent/byAddress/${address}`).then(res => res.data)
    }
    getCoveringErgAndTokenForAddress = async (
        address: string,
        amount: number,
        covering: { [id: string]: number } = {},
    ) => {
        let res=[];
        const boxesItems = await this.getBoxesForAddress(address, 0, 1);
        console.log(boxesItems);

    }
    // getCoveringErgoAndTokenForAddress = async (
    //     tree: string,
    //     amount: number,
    //     covering: { [id: string]: number } = {},
    //     filter: (box: any) => boolean = () => true
    // ): Promise<{ covered: boolean, boxes: Array<wasm.ErgoBox> }> => {
    //     let res = []
    //     const boxesItems = await ApiNetwork.getBoxesForAddress(tree, 0, 1)
    //     const total = boxesItems.total;
    //     let offset = 0;
    //     const remaining = () => {
    //         const tokenRemain = Object.entries(covering).map(([key, amount]) => Math.max(amount, 0)).reduce((a, b) => a + b, 0);
    //         return tokenRemain + Math.max(amount, 0) > 0;
    //     }
    //     while (offset < total && remaining()) {
    //         const boxes = await this.getBoxesForAddress(tree, offset, 10)
    //         for (let box of boxes.items) {
    //             if (filter(box)) {
    //                 res.push(box);
    //                 amount -= box.value;
    //                 box.assets.map((asset: any) => {
    //                     if (covering.hasOwnProperty(asset.tokenId)) {
    //                         covering[asset.tokenId] -= asset.amount;
    //                     }
    //                 })
    //                 if (!remaining()) break
    //             }
    //         }
    //         offset += 10;
    //     }
    //     return {boxes: res.map(box = getCoveringErgoAndTokenForAddress = async (
    //     tree: string,
    //     amount: number,
    //     covering: { [id: string]: number } = {},
    //     filter: (box: any) => boolean = () => true
    // ): Promise<{ covered: boolean, boxes: Array<wasm.ErgoBox> }> => {
    //     let res = []
    //     const boxesItems = await ApiNetwork.getBoxesForAddress(tree, 0, 1)
    //     const total = boxesItems.total;
    //     let offset = 0;
    //     const remaining = () => {
    //         const tokenRemain = Object.entries(covering).map(([key, amount]) => Math.max(amount, 0)).reduce((a, b) => a + b, 0);
    //         return tokenRemain + Math.max(amount, 0) > 0;
    //     }
    //     while (offset < total && remaining()) {
    //         const boxes = await this.getBoxesForAddress(tree, offset, 10)
    //         for (let box of boxes.items) {
    //             if (filter(box)) {
    //                 res.push(box);
    //                 amount -= box.value;
    //                 box.assets.map((asset: any) => {
    //                     if (covering.hasOwnProperty(asset.tokenId)) {
    //                         covering[asset.tokenId] -= asset.amount;
    //                     }
    //                 })
    //                 if (!remaining()) break
    //             }
    //         }
    //         offset += 10;
    //     }
    //     return {boxes: res.map(box => wasm.ErgoBox.from_json(JSON.stringify(box))), covered: !remaining()}
    //
    // }> wasm.ErgoBox.from_json(JSON.stringify(box))), covered: !remaining()}
    //
    // }

}