import { TxEntity } from "../entities/watcher/network/TransactionEntity";
import { ErgoNetwork } from "./network/ergoNetwork";
import { NetworkDataBase } from "../models/networkModel";

export class TransactionQueue {
    _database: NetworkDataBase
    _timeout: number
    _confirmation: number

    constructor(db: NetworkDataBase, timeout: number, confirmation: number) {
        this._database = db
        this._timeout = timeout
        this._confirmation = confirmation
    }

    job = async () => {
        const txs: Array<TxEntity> = await this._database.getAllTxs()
        const currentTime = 0
        for(const tx of txs) {
            try {
                const txStatus = await ErgoNetwork.getConfNum(tx.txId)
                if (txStatus === -1) {
                    if (currentTime - tx.creationTime > this._timeout) {
                        await this._database.removeTx(tx.id)
                    }
                    // check inputs
                    // resend the tx
                } else if (txStatus > this._confirmation) {
                    // change the confirmed tx source status
                    await this._database.removeTx(tx.id)
                }
            } catch (e) {
                console.log(e)
                console.log("Skipping transaction checking with txId:", tx.txId)
            }
        }
    }
}

