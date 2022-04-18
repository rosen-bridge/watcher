import axios from "axios";
import config from 'config';
import { Block, Tx, TxMetaData, Utxo } from "../objects/apiModels";

const URL: string | undefined = config.get?.('node.URL');
export const koios = axios.create({
    baseURL: URL,
    timeout: 8000,
    headers: {"Content-Type": "application/json"}
});

export class KoiosNetwork {
    static getBlockAtHeight = (height: number): Promise<Block> => {
        return koios.get(
            '/blocks',
            {params: {block_height: `eq.${height}`, select: 'hash,block_height'}}
        ).then(
            res => res.data[0]
        )
    }

    static getBlock = (offset: number = 0, limit: number = 1): Promise<Block[]> => {
        return koios.get(
            '/blocks',
            {params: {offset: offset, limit: limit, select: 'hash,block_height'}}
        ).then(
            res => res.data
        )
    }

    static getBlockTxs = (blockHash: string): Promise<string[]> => {
        return koios.get(
            '/block_txs',
            {params: {_block_hash: blockHash}}
        ).then(res => {
            return res.data.map((item: { tx_hash: string }) => {
                return item.tx_hash
            })
        })
    }

    static getTxUtxos = (txHashes: Array<string>): Promise<Tx[]> => {
        return koios.post(
            '/tx_utxos', {"_tx_hashes": txHashes}
        ).then(res => {
            return res.data.map((tx: { outputs: Array<Utxo> }) => {
                return {
                    utxos: tx.outputs
                }
            });
        });
    }

    static getTxMetaData = (txHashes: Array<string>): Promise<TxMetaData[]> => {
        return koios.post("/tx_metadata", {"_tx_hashes": txHashes}).then(
            res => res.data
        )
    }
}

