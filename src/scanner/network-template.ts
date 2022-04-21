import { Block, Tx, TxMetaData } from "../objects/apiModelsCardano";

export abstract class NetworkTemplate {
    abstract getBlockAtHeight(height: number): Promise<Block>;

    abstract getBlock(offset: number, limit: number): Promise<Array<Block>>;

    abstract getBlockTxs(blockHash: string): Promise<string[]>;

    abstract getTxUtxos(txHashes: Array<string>): Promise<Tx[]>;

    abstract getTxMetaData(txHashes: Array<string>): Promise<TxMetaData[]>;
}
