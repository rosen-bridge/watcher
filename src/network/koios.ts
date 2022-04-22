import axios from "axios";
import config from 'config';
import { Block, Tx, TxMetaData, Utxo } from "../objects/apiModelsCardano";
import { NetworkTemplate } from "../template-classes/network-template";

const URL: string | undefined = config.get?.('node.URL');
export const koios = axios.create({
    baseURL: URL,
    timeout: 8000,
    headers: {"Content-Type": "application/json"}
});

export class KoiosNetwork extends NetworkTemplate {
    getBlockAtHeight = (height: number): Promise<Block> => {
        return koios.get<Array<Block>>(
            '/blocks',
            {params: {block_height: `eq.${height}`, select: 'hash,block_height'}}
        ).then(
            res => res.data[0]
        )
    }

    getBlock = (offset: number = 0, limit: number = 1): Promise<Array<Block>> => {
        return koios.get<Array<Block>>(
            '/blocks',
            {params: {offset: offset, limit: limit, select: 'hash,block_height'}}
        ).then(
            res => res.data
        )
    }

    getBlockTxs = (blockHash: string): Promise<string[]> => {
        return koios.get<Array<{ tx_hash: string }>>(
            '/block_txs',
            {params: {_block_hash: blockHash}}
        ).then(res => {
            return res.data.map((item: { tx_hash: string }) => {
                return item.tx_hash
            })
        })
    }

    getTxUtxos = (txHashes: Array<string>): Promise<Array<Tx>> => {
        return koios.post<Array<{ outputs: Array<Utxo> }>>(
            '/tx_utxos', {"_tx_hashes": txHashes}
        ).then(res => {
            return res.data.map((tx: { outputs: Array<Utxo> }) => {
                return {
                    utxos: tx.outputs
                }
            });
        });
    }

    getTxMetaData = (txHashes: Array<string>): Promise<Array<TxMetaData>> => {
        return koios.post<Array<TxMetaData>>("/tx_metadata", {"_tx_hashes": txHashes}).then(
            res => res.data
        )
    }
}

