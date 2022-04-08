import { KoiosNetwork } from "../network/koios";
import { CardanoUtils, Observation } from "./utils";
import config from "config";
import DataBase from "./models";
import { ormconfig } from "../../config/ormconfig";
import { Block } from "../objects/apiModels";

const INTERVAL: number | undefined = config.get?.('scanner.interval');
const INITIAL_HEIGHT: number | undefined = config.get?.('scanner.initialBlockHeight');

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
        const lastSavedBlock = await this._dataBase.getLastSavedBlock();
        if (lastSavedBlock !== undefined) {
            const lastSavedBlockFromNetwork = await KoiosNetwork.getBlockAtHeight(lastSavedBlock.block_height);
            return lastSavedBlockFromNetwork.hash !== lastSavedBlock.hash;
        } else {
            return false;
        }
    }
    /**
     * getting last block and observations from the network
     * @param height
     * @return Promise<[Block, Array<Observation | undefined>]>
     */
    getBlockAndObservations = async (height: number): Promise<[Block, Array<Observation | undefined>]> => {
        const block = await KoiosNetwork.getBlockAtHeight(height);
        const observations = (await CardanoUtils.observationsAtHeight(block.hash))
            .filter((observation) => {
                return observation !== undefined
            });
        return [block, observations];
    }

    /**
     * worker function that runs for syncing the database with the Cardano blockchain and checks if we have any fork
     * scenario in the blockchain and invalidate the database till the database synced again.
     */
    update = async () => {
        const lastSavedBlock = (await this._dataBase.getLastSavedBlock());
        if (!await this.isForkHappen()) {
            const lastBlockHeight = await KoiosNetwork.getBlock(0).then(res => {
                return res[0].block_height
            });
            let height = null;
            if (lastSavedBlock !== undefined) {
                height = lastSavedBlock.block_height + 1;
            } else {
                if (typeof INITIAL_HEIGHT === 'number') {
                    if (INITIAL_HEIGHT > lastBlockHeight) {
                        console.log("scanner initial height is more than current block height!");
                        return;
                    }
                    height = INITIAL_HEIGHT;
                } else {
                    console.log("scanner initial height doesn't set in the config!");
                    return;
                }
            }
            for (height; height <= lastBlockHeight; height++) {
                const [block, observations] = await this.getBlockAndObservations(height);
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
            let blockFromNetwork = await KoiosNetwork.getBlockAtHeight(forkPointer.block_height);
            while (blockFromNetwork.hash !== forkPointer.hash) {
                const block = await this._dataBase.getBlockAtHeight(forkPointer.block_height - 1);
                if (block === undefined) {
                    break;
                } else {
                    forkPointer = block;
                }
                blockFromNetwork = await KoiosNetwork.getBlockAtHeight(blockFromNetwork.block_height - 1);
            }
            await this._dataBase.changeLastValidBlock(forkPointer.block_height);
        }
    }
}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const main = async () => {
    const DB = await DataBase.init(ormconfig);
    const scanner = new Scanner(DB);
    if (typeof INTERVAL === 'number') {
        setInterval(scanner.update, INTERVAL * 1000);
    } else {
        console.log("scanner interval doesn't set in the config");
    }

}
