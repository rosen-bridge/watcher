import { koiosNetwork } from "../network/koios";

export interface TX {
    //TODO: should feel later with knowledge of cardano utxo
    mock: any,
}

export class Observation {
    //TODO: should feel later

}

const checkTx = (tx: TX): Observation | undefined => {
    if (Math.random() > .7) {
        return new Observation();
    } else {
        return undefined;
    }
}

const txHashToData = (txHash: string): TX => {
    //TODO: mock function to convert txhash to datatype needed (TX)
    return {mock: ""}
}

export const observationsAtHeight = async (height: number): Promise<Array<(Observation | undefined)>> => {
    const blockHash = (await koiosNetwork.getBlockAtHeight(height)).hash;
    const txs = await koiosNetwork.getBlockTxs(blockHash);
    return txs.map((txHash) => {
        return checkTx(txHashToData(txHash))
    })
}

