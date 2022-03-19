import koiosNetwork from "../network/koios";
import {observationsAtHeight} from "./utils";
import {saveObservation} from "./models";


const getLastSavedBlock = (): Promise<number> => {
    //TODO: this is mocked
    return koiosNetwork.getBlock(5).then((res) => {
        return res[0].block_height
    });
}

const scanner = async () => {
    let lastSavedBlock = await getLastSavedBlock();

    const lastBlock = await koiosNetwork.getBlock(0).then((res) => {
        return res[0].block_height
    });
    for (let height = lastSavedBlock + 1; height <= lastBlock; height++) {
        const observations = (await observationsAtHeight(height)).filter((observation) => {
            return observation !== undefined
        });
        if (saveObservation(observations)) {
            lastSavedBlock = height;
            console.log("saved block", height)
        } else {
            break;
        }
    }
}
export const main = () => {
    setInterval(scanner, 20 * 1000);

}


