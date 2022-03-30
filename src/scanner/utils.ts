import { KoiosNetwork } from "../network/koios";

export interface TX {
    //TODO: should feel later with knowledge of cardano utxo
    mock: any,
}

export class Observation {
    //TODO: should feel later

}

export class CardanoUtils {
    static checkTx = (tx: TX): Observation | undefined => {
        if (Math.random() > .7) {
            return new Observation();
        } else {
            return undefined;
        }
    }

    static txHashToData = (txHash: string): TX => {
        //TODO: mock function to convert txhash to datatype needed (TX)
        return {mock: ""}
    }

    // static observationsAtHeight = async (height: number): Promise<Array<(Observation | undefined)>> => {
    //     const blockHash = (await KoiosNetwork.getBlockAtHeight(height)).hash;
    //     const txs = await KoiosNetwork.getBlockTxs(blockHash);
    //     return txs.map((txHash) => {
    //         return this.checkTx(this.txHashToData(txHash))
    //     })
    // }

    static observationsAtHeight = async (blockHash: string): Promise<Array<(Observation | undefined)>> => {
        const txs = await KoiosNetwork.getBlockTxs(blockHash);
        return txs.map((txHash) => {
            return this.checkTx(this.txHashToData(txHash))
        })
    }
}

