import { AbstractNetworkConnector } from "../network/abstract-network-connector";
import { AbstractDataBase } from "../models/abstractModel";
import { Block } from "../objects/interfaces";

export abstract class AbstractScanner<TxT, TxMetaDataT, BlockT, DataT> {
    abstract _dataBase: AbstractDataBase<BlockT, DataT>;
    abstract _networkAccess: AbstractNetworkConnector<TxT, TxMetaDataT>;
    abstract _INITIAL_HEIGHT: number;

    /**
     * function that checks if fork is happen in the blockchain or not
     * @return Promise<Boolean>
     */
    isForkHappen = async (): Promise<Boolean> => {
        const lastSavedBlock = await this._dataBase.getLastSavedBlock();
        if (lastSavedBlock !== undefined) {
            const lastSavedBlockFromNetwork = await this._networkAccess.getBlockAtHeight(lastSavedBlock.block_height);
            return lastSavedBlockFromNetwork.hash !== lastSavedBlock.hash;
        } else {
            return false;
        }
    }

    abstract getBlockInformation(block: Block): Promise<Array<DataT | undefined>>;

    /**
     * worker function that runs for syncing the database with the Cardano blockchain and checks if we have any fork
     * scenario in the blockchain and invalidate the database till the database synced again.
     */
    update = async () => {
        const lastSavedBlock = (await this._dataBase.getLastSavedBlock());
        if (!await this.isForkHappen()) {
            const lastBlockHeight = await this._networkAccess.getBlock(0, 1).then(res => {
                return res[0].block_height
            });
            let height = null;
            if (lastSavedBlock !== undefined) {
                height = lastSavedBlock.block_height + 1;
            } else {
                if (this._INITIAL_HEIGHT > lastBlockHeight) {
                    console.log("scanner initial height is more than current block height!");
                    return;
                }
                height = this._INITIAL_HEIGHT;
            }
            for (height; height <= lastBlockHeight; height++) {
                const block = await this._networkAccess.getBlockAtHeight(height);
                const observations = await this.getBlockInformation(block);
                if (!await this.isForkHappen()) {
                    if (!await this._dataBase.saveBlock(block.block_height, block.hash, observations)) {
                        break;
                    }
                } else {
                    break;
                }
            }
        } else {
            let forkPointer = lastSavedBlock!;
            let blockFromNetwork = await this._networkAccess.getBlockAtHeight(forkPointer.block_height);
            while (blockFromNetwork.hash !== forkPointer.hash) {
                const block = await this._dataBase.getBlockAtHeight(forkPointer.block_height - 1);
                if (block === undefined) {
                    break;
                } else {
                    forkPointer = block;
                }
                blockFromNetwork = await this._networkAccess.getBlockAtHeight(blockFromNetwork.block_height - 1);
            }
            await this._dataBase.changeLastValidBlock(forkPointer.block_height);
        }
    }

}
