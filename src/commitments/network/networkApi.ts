import axios from "axios";
import config from "config";
import {AbstractNetworkConnector} from "../../network/abstractNetworkConnector";
import {Block} from "../../objects/interfaces";
import {NodeBlock, NodeTransaction} from "./ergoApiModels";

const URL: string | undefined = config.get?.('ergo.nodeUrl');
export const nodeApi = axios.create({
    baseURL: URL,
    timeout: 10000
})

export class ErgoNetworkApi extends AbstractNetworkConnector {
    getBlockAtHeight = (height: number): Promise<Block> => {
        return nodeApi.get<Array<{id: string}>>(
            `/blocks/chainSlice`, {params: {fromHeight: height, toHeight: height}}
        ).then(
            res => {
                return {
                    hash: res.data[0].id,
                    block_height: height
                }
            }
        )
    }

    getCurrentHeight = (): Promise<number> => {
        return nodeApi.get<{fullHeight: number}>(
            `/info`
        ).then(
            res => {
                return res.data.fullHeight
            }
        )
    }

    getBlockTxs = (blockHash: string): Promise<NodeTransaction[]> => {
        return nodeApi.get<NodeBlock>(
            `/blocks/${blockHash}/transactions`
        ).then(res => {
            return res.data.transactions
        })
    }

    pay2ScriptAddress = (script: string): Promise<string> => {
        return nodeApi.post("/script/p2sAddress", {source: script}).then(
            res => res.data.address
        )
    }
}

