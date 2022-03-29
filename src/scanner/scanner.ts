import { koiosNetwork } from "../network/koios";
import { observationsAtHeight } from "./utils";
import { changeLastValidBlock, getBlockAtHeight, getLastSavedBlock, saveObservation } from "./models";
import config from "config";

const INTERVAL: number | undefined = config.get?.('scanner.interval');

/**
 * worker function that runs for syncing the database with the Cardano blockchain and checks if we have any fork
 * scenario in the blockchain and invalidate the database till the database synced again.
 */
const scanner = async () => {
    const lastSavedBlock = await getLastSavedBlock();
    const lastSavedBlockFromNetwork = await koiosNetwork.getBlockAtHeight(lastSavedBlock.block_height);
    if (lastSavedBlockFromNetwork.hash === lastSavedBlock.hash) {
        const lastBlockHeight = await koiosNetwork.getBlock(0).then(res => {
            return res[0].block_height
        });
        for (let height = lastSavedBlock.block_height + 1; height <= lastBlockHeight; height++) {
            const observations = (await observationsAtHeight(height)).filter((observation) => {
                return observation !== undefined
            });
            if (!saveObservation(observations)) {
                break;
            }
        }
    } else {
        let forkPointer = lastSavedBlock;
        let blockFromNetwork = lastSavedBlockFromNetwork;
        while (blockFromNetwork.hash !== forkPointer.hash) {
            forkPointer = await getBlockAtHeight(forkPointer.block_height - 1);
            blockFromNetwork = await koiosNetwork.getBlockAtHeight(lastSavedBlock.block_height - 1);
        }
        //TODO: should handle errors with respect to DataBase
        changeLastValidBlock(forkPointer.block_height);
    }
}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const main = () => {
    console.log(INTERVAL)

    setInterval(scanner, INTERVAL * 1000);
}
