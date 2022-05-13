import axios from "axios";
import config from "config";
import { AbstractNetworkConnector } from "../../network/abstract-network-connector";
import { Block } from "../../objects/interfaces";
import { ExplorerBlock, ExplorerBlockHeader, ExplorerTransaction } from "./ergoApiModels";
import * as wasm from "ergo-lib-wasm-nodejs";

const URL: string | undefined = config.get?.('ergo.explorerUrl');
export const explorerApi = axios.create({
    baseURL: URL,
    timeout: 8000
})

export class ErgoNetworkApi extends AbstractNetworkConnector {
    getCurrentHeight = (offset: number = 0, limit: number = 1): Promise<Block> => {
        return explorerApi.get<{ items: Array<ExplorerBlockHeader> }>(
            'api/v1/blocks',
            {params: {offset: 0, limit: 1}}
        ).then(
            res => {
                return {hash: res.data.items[0].id, block_height: res.data.items[0].height}
            }
        )
    }

    getBlockAtHeight = (height: number): Promise<Block> => {
        return explorerApi.get<ExplorerBlockHeader>(
            '/api/v1/blocks/byGlobalIndex/stream',
            {params: {minGix: height - 1, limit: 1}}
        ).then(
            res => {
                return {
                    hash: res.data.id,
                    block_height: res.data.height
                }
            }
        )
    }

    getBlockTxs = (blockHash: string): Promise<string[]> => {
        return explorerApi.get<ExplorerBlock>(
            `api/v1/blocks/${blockHash}`
        ).then(res => {
            return res.data.block.blockTransactions.map(item => item.id)
        })
    }

    getTxUtxos = async (txHashes: Array<string>): Promise<Array<wasm.ErgoBox>> => {
        let result: Array<wasm.ErgoBox> = []
        for (const txId of txHashes) {
            await explorerApi.get<ExplorerTransaction>(
                `api/v1/transactions/${txId}`
            ).then(res => {
                const boxes = res.data.outputs.map(bx => {
                    return wasm.ErgoBox.from_json(JSON.stringify(bx))
                })
                result = [...result, ...boxes]
            });
        }
        return result
    }

    getTxMetaData = async (txHashes: Array<string>): Promise<Array<ExplorerTransaction>> => {
        let result: ExplorerTransaction[] = []
        for (const txId of txHashes) {
            await explorerApi.get<ExplorerTransaction>(
                `api/v1/transactions/${txId}`
            ).then(res => {
                result.push(res.data)
            });
        }
        return result
    }

    getHeight = async (): Promise<number> => {
        return explorerApi.get<{ height: number }>('/api/v1/networkState').then(res => {
            return res.data.height
        })
    }

    boxIsSpent = async (boxId: string): Promise<Boolean> => {
        return explorerApi.get<{ spentTransactionId: number }>(`/api/v1/boxes/${boxId}`).then(res => {
            return res.data.spentTransactionId != null;
        })
    }
}

