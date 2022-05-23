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

export class CommitmentNetworkApi extends AbstractNetworkConnector {
    getCurrentHeight = (): Promise<number> => {
        return nodeApi.get<{fullHeight: number}>(`/info`).then(
            res => res.data.fullHeight
        )
    }

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

    getBlockTxs = (blockHash: string): Promise<NodeTransaction[]> => {
        return nodeApi.get<NodeBlock>(
            `/blocks/${blockHash}/transactions`
        ).then(res => {
            return res.data.transactions
        })
    }
}

