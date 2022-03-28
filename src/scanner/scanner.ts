import koiosNetwork from "../network/koios";
import { observationsAtHeight } from "./utils";
import { changeLastValidBlock, getBlockAtHeight, getLastSavedBlock, saveObservation } from "./models";


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
export const main = () => {
    setInterval(scanner, 2 * 1000);
}
