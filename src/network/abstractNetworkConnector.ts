import { Block } from "../objects/interfaces";

export abstract class AbstractNetworkConnector {
    abstract getBlockAtHeight(height: number): Promise<Block>;

    abstract getCurrentHeight(): Promise<number>;
}
