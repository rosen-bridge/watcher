import { KoiosNetwork } from "../network/koios";
import { CardanoUtils } from "./utils";
import config from "config";
import DataBase from "./models";
import { WatcherDataSource } from "../../config/watcher-data-source";

const INTERVAL: number | undefined = config.get?.('scanner.interval');

export class Scanner {
    private _dataBase: DataBase;

    constructor(db: DataBase) {
        this._dataBase = db;
    }

    /**
     * function that checks if fork is happen in the blockchain or not
     * @return Promise<Boolean>
     */
    isForkHappen = async (): Promise<Boolean> => {
        const lastSavedBlock = (await this._dataBase.getLastSavedBlock())!;
        const lastSavedBlockFromNetwork = await KoiosNetwork.getBlockAtHeight(lastSavedBlock.block_height);
        return lastSavedBlockFromNetwork.hash !== lastSavedBlock.hash;
    }

    /**
     * worker function that runs for syncing the database with the Cardano blockchain and checks if we have any fork
     * scenario in the blockchain and invalidate the database till the database synced again.
     */
    update = async () => {
        const lastSavedBlock = (await this._dataBase.getLastSavedBlock());
        if (lastSavedBlock !== undefined) {
            if (!await this.isForkHappen()) {
                const lastBlockHeight = await KoiosNetwork.getBlock(0).then(res => {
                    return res[0].block_height
                });
                if ("block_height" in lastSavedBlock) {
                    for (let height = lastSavedBlock.block_height + 1; height <= lastBlockHeight; height++) {
                        const block = await KoiosNetwork.getBlockAtHeight(height);
                        const observations = (await CardanoUtils.observationsAtHeight(block.hash))
                            .filter((observation) => {
                                return observation !== undefined
                            });
                        if (!await this.isForkHappen()) {
                            if (!await this._dataBase.saveBlock(block.block_height, block.hash, observations)) {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                }
            } else {
                let forkPointer = lastSavedBlock!;
                let blockFromNetwork = await KoiosNetwork.getBlockAtHeight(forkPointer.block_height);
                while (blockFromNetwork.hash !== forkPointer.hash) {
                    forkPointer = (await this._dataBase.getBlockAtHeight(forkPointer.block_height - 1))!;
                    blockFromNetwork = await KoiosNetwork.getBlockAtHeight(blockFromNetwork.block_height - 1);
                }
                //TODO: should handle errors with respect to DataBase
                this._dataBase.changeLastValidBlock(forkPointer.block_height);
            }
        }
    }

}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const main = () => {
        const DB=new DataBase(WatcherDataSource);
        DB.init().then(()=>{
            const scanner = new Scanner(DB);
            if (typeof INTERVAL === 'number') {
                setInterval(scanner.update, INTERVAL * 1000);
            } else {
                console.log("scanner interval doesn't set in the config");
            }
        });
}
