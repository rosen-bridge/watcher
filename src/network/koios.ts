import axios from "axios";
import config from 'config';
import { Block } from "../models/apiModels";

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
        ).then(res => {
                return res.data[0]
            })
    }

    static getBlock = (offset: number = 0, limit: number = 1): Promise<Block[]> => {
        return koios.get(
            '/blocks',
            {params: {offset: offset, limit: limit, select: 'hash,block_height'}}
        ).then(res => {
                return res.data
            })
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

}

