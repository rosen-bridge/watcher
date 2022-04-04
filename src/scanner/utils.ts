import { KoiosNetwork } from "../network/koios";
import { Column, ManyToOne } from "typeorm";
import { BlockEntity } from "../entity/BlockEntity";

export interface TX {
    //TODO: should feel later with knowledge of cardano utxo
    mock: any,
}

export interface Observation {
    //TODO: should feel later
    fromChain:string
    toChain:string
    toAddress:string
    amount:string
    fee:string
    sourceChainTokenId:string
    targetChainTokenId: string
    sourceTxId: string
    sourceBlockId: string
    requestId: string

}

export class CardanoUtils {
    static checkTx = (tx: TX): Observation | undefined => {
        return undefined
    }

    static txHashToData = (txHash: string): TX => {
        //TODO: mock function to convert txhash to datatype needed (TX)
        return {mock: ""}
    }

    static observationsAtHeight = async (blockHash: string): Promise<Array<(Observation | undefined)>> => {
        const txs = await KoiosNetwork.getBlockTxs(blockHash);
        return txs.map((txHash) => {
            return this.checkTx(this.txHashToData(txHash))
        })
    }
}

