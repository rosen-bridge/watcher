import axios from "axios";
import config from "config";
import {AbstractNetworkConnector} from "../../network/abstract-network-connector";
import {Block} from "../../objects/interfaces";
import {ExplorerBlock, ExplorerTransaction} from "./ergoApiModels";
import * as wasm from "ergo-lib-wasm-nodejs";

const URL: string | undefined = config.get?.('ergoExplorer.URL');
export const explorerApi = axios.create({
    baseURL: URL,
    timeout: 8000
})

export class ErgoNetworkApi extends AbstractNetworkConnector<wasm.ErgoBox, wasm.Transaction>{
    getBlock = (offset: number = 0, limit: number = 1): Promise<Array<Block>> => {
        return explorerApi.get<Array<ExplorerBlock>>(
            '/api/v1/blocks/byGlobalIndex/stream',
            {params: {minGix: offset, limit: limit}}
        ).then(
            res => {
                return res.data.map(b => {return {hash: b.id, block_height: b.height}})
            }
        )
    }

    getBlockAtHeight = (height: number): Promise<Block> => {
        return this.getBlock(height-1, 1).then(blocks => blocks[0])
    }

    getBlockTxs = (blockHash: string): Promise<string[]> => {
        return explorerApi.get<ExplorerBlock>(
            `api/v1/blocks/${blockHash}`
        ).then(res => {
            return res.data.blockTransactions.map(item => item.id)
        })
    }

    getTxUtxos = (txHashes: Array<string>): Promise<Array<wasm.ErgoBox>> => {
        let result: Array<wasm.ErgoBox> = []
        txHashes.forEach(txId => {
            explorerApi.get<ExplorerTransaction>(
                `api/v1/transactions/${txId}`
            ).then(res => {
                const boxes = res.data.outputs.map(bx => wasm.ErgoBox.from_json(JSON.stringify(bx)))
                result= [...result, ...boxes]
            });
        })
        return Promise.resolve(result)
    }

    getTxMetaData = (txHashes: Array<string>): Promise<Array<wasm.Transaction>> => {
        let result: Array<wasm.Transaction> = []
        txHashes.forEach(txId => {
            explorerApi.get<ExplorerTransaction>(
                `api/v1/transactions/${txId}`
            ).then(res => {
                result.push(wasm.Transaction.from_json(JSON.stringify(res.data)))
            });
        })
        return Promise.resolve(result)
    }
}

