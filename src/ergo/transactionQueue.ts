import { TxEntity, TxType } from "../entities/watcher/network/TransactionEntity";
import { ErgoNetwork } from "./network/ergoNetwork";
import { NetworkDataBase } from "../models/networkModel";
import { DatabaseConnection } from "./databaseConnection";
import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoConfig } from "../config/config";
import { base64ToArrayBuffer } from "../utils/utils";

const ergoConfig = ErgoConfig.getConfig();

export class TransactionQueue {
    database: NetworkDataBase
    databaseConnection: DatabaseConnection

    constructor(db: NetworkDataBase, dbConnection: DatabaseConnection) {
        this.database = db
        this.databaseConnection = dbConnection
    }

    /**
     * Fetches all active transactions from the database and updates their status
     * If the transaction doesn't exist in the network resends the transaction
     */
    job = async () => {
        const txs: Array<TxEntity> = await this.database.getAllTxs()
        const currentHeight = await ErgoNetwork.getHeight()
        for(const tx of txs) {
            try {
                const txStatus = await ErgoNetwork.getConfNum(tx.txId)
                if (txStatus === -1) {
                    const signedTx = wasm.Transaction.sigma_parse_bytes(base64ToArrayBuffer(tx.txSerialized))
                    if(
                        // commitment validation
                        (tx.type == TxType.COMMITMENT &&
                            !(await this.databaseConnection.isObservationValid(tx.observation))) ||
                        // trigger validation
                        (tx.type == TxType.TRIGGER &&
                            (await this.databaseConnection.isMergeHappened(tx.observation))) ||
                        // transaction input validation
                        !(await ErgoNetwork.checkTxInputs(signedTx.inputs()))
                    ){
                        if(currentHeight - tx.updateBlock > ergoConfig.transactionRemovingTimeout) {
                            await this.database.downgradeObservationTxStatus(tx.observation)
                            await this.database.removeTx(tx)
                        }
                        continue
                    }
                    // resend the tx
                    await ErgoNetwork.sendTx(signedTx.to_json())
                    await this.database.setTxUpdateHeight(tx, currentHeight)
                } else if (txStatus > ergoConfig.transactionConfirmation) {
                    await this.database.upgradeObservationTxStatus(tx.observation)
                    await this.database.removeTx(tx)
                } else {
                    await this.database.setTxUpdateHeight(tx, currentHeight)
                }
            } catch (e) {
                console.log(e)
                console.log("Skipping transaction checking with txId:", tx.txId)
            }
        }
    }
}

