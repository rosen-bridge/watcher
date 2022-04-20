import { Block, Tx, TxMetaData } from "../objects/apiModelsCardano";

export abstract class NetworkAbstract {
    abstract getBlockAtHeight(height: number): Promise<Block>;

    abstract getBlock(offset: number = 0, limit: number = 1): Promise<Array<Block>>;

    abstract getBlockTxs(blockHash: string): Promise<string[]>;

    abstract getTxUtxos(txHashes: Array<string>): Promise<Tx[]>;

    abstract getTxMetaData(txHashes: Array<string>): Promise<TxMetaData[]>;
}
