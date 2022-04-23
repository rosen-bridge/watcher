import { Block } from "../objects/interfaces";

export abstract class NetworkAbstract<TxT, TxMetaDataT> {
    abstract getBlockAtHeight(height: number): Promise<Block>;

    abstract getBlock(offset: number, limit: number): Promise<Array<Block>>;

    abstract getBlockTxs(blockHash: string): Promise<string[]>;

    abstract getTxUtxos(txHashes: Array<string>): Promise<TxT[]>;

    abstract getTxMetaData(txHashes: Array<string>): Promise<TxMetaDataT[]>;
}
