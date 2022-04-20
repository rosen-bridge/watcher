import { Block } from "../objects/apiModels";

abstract class NetworkAbstract {
    abstract async getBlockAtHeight(height: number): Promise<Block>;

    abstract async getBlock(offset: number = 0, limit: number = 1): Promise<Array<Block>>;

    abstract async getBlockTxs(blockHash: string): Promise<string[]>;

}
