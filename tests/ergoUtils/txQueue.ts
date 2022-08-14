import { loadDataBase } from "../cardano/models/models";
import { loadBridgeDataBase } from "../bridge/models/bridgeModel";
import { DatabaseConnection } from "../../src/database/databaseConnection";
import { TransactionQueue } from "../../src/ergo/transactionQueue";
import { TxEntity, TxType } from "../../src/database/entities/watcher/TransactionEntity";
import { ObservationEntity } from "../../src/database/entities/watcher/network/ObservationEntity";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";


import { Buffer } from "buffer";
import * as wasm from "ergo-lib-wasm-nodejs";
import chai, { expect } from "chai";
import spies from "chai-spies";
chai.use(spies)

import txObj from "../ergo/dataset/tx.json" assert { type: "json" }
const tx = wasm.Transaction.from_json(JSON.stringify(txObj))

const height = 1000
export const observation: ObservationEntity = new ObservationEntity()
observation.requestId = "requestId"
const txEntity = new TxEntity()
txEntity.observation = observation
txEntity.txId = "txId"
txEntity.txSerialized = Buffer.from(tx.sigma_serialize_bytes()).toString("base64")
txEntity.updateBlock = height - 1

describe("Transaction queue tests", () => {


    /**
     * Target: testing TransactionQueue job
     * Dependencies:
     *    networkDatabase
     *    DatabaseConnection
     *    ErgoNetwork
     */
    describe("TransactionQueue job", () => {
        /**
         * Expected Output:
         *    The function should resend the ready commitment transaction
         *    Because its unavailable, but still valid
         */
        it("should resend the commitment transaction", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.COMMITMENT
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "setTxUpdateHeight", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => -1)
            chai.spy.on(ErgoNetwork, "getHeight", () => height)
            chai.spy.on(ErgoNetwork, "sendTx")
            chai.spy.on(ErgoNetwork, "checkTxInputs", () => true)
            chai.spy.on(dbConnection, "isObservationValid", () => true)
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.been.called.with(tx.to_json())
            expect(networkDb.setTxUpdateHeight).have.been.called.once
            chai.spy.restore(ErgoNetwork)
        })

        /**
         * Expected Output:
         *    The function should resend the ready trigger transaction
         *    Because its unavailable, but still valid
         */
        it("should resend the trigger transaction", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.TRIGGER
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "setTxUpdateHeight", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => -1)
            chai.spy.on(ErgoNetwork, "getHeight", () => height)
            chai.spy.on(ErgoNetwork, "sendTx")
            chai.spy.on(ErgoNetwork, "checkTxInputs", () => true)
            chai.spy.on(dbConnection, "isMergeHappened", () => false)
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.been.called.with(tx.to_json())
            expect(networkDb.setTxUpdateHeight).have.been.called.once
            chai.spy.restore(ErgoNetwork)
        })

        /**
         * Expected Output:
         *    The function should wait for transaction removing
         *    Because the observation is not still valid, but it may have change in a small period
         */
        it("should just wait for commitment transaction status", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.COMMITMENT
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "setTxUpdateHeight", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => -1)
            chai.spy.on(ErgoNetwork, "getHeight", () => height)
            chai.spy.on(ErgoNetwork, "sendTx")
            chai.spy.on(dbConnection, "isObservationValid", () => false)
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.not.been.called
            expect(networkDb.setTxUpdateHeight).have.not.been.called
            chai.spy.restore(ErgoNetwork)
        })

        /**
         * Expected Output:
         *    The function should wait for transaction removing
         *    Because the commitment has already merged, but it may have forked in a small period
         */
        it("should just wait for trigger transaction status", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.TRIGGER
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "setTxUpdateHeight", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => -1)
            chai.spy.on(ErgoNetwork, "getHeight", () => height)
            chai.spy.on(ErgoNetwork, "sendTx")
            chai.spy.on(dbConnection, "isMergeHappened", () => true)
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.not.been.called
            expect(networkDb.setTxUpdateHeight).have.not.been.called
            chai.spy.restore(ErgoNetwork)
        })

        /**
         * Expected Output:
         *    The function should wait for transaction removing
         *    Because the transaction inputs are spent, but it may have change in a small period
         */
        it("should just wait for trigger transaction status because its inputs are spent", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.TRIGGER
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "setTxUpdateHeight", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => -1)
            chai.spy.on(ErgoNetwork, "getHeight", () => height)
            chai.spy.on(ErgoNetwork, "sendTx")
            chai.spy.on(ErgoNetwork, "checkTxInputs", () => false)
            chai.spy.on(dbConnection, "isMergeHappened", () => false)
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.not.been.called
            expect(networkDb.setTxUpdateHeight).have.not.been.called
            chai.spy.restore(ErgoNetwork)
        })

        /**
         * Expected Output:
         *    The function should update the transaction updateTime and wait for its status
         *    Because the transaction is in mempool or is not confirmed enough
         */
        it("should update the updateTime and wait more for tx status", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.COMMITMENT
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "setTxUpdateHeight", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => 0)
            chai.spy.on(ErgoNetwork, "getHeight", () => height)
            chai.spy.on(ErgoNetwork, "sendTx")
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.not.been.called
            expect(networkDb.setTxUpdateHeight).have.been.called.once
            chai.spy.restore(ErgoNetwork)
        })

        /**
         * Expected Output:
         *    The function should wait for transaction removing
         *    Because the observation is not still valid, but it may have change in a small period
         */
        it("should remove the tx from database because it get enough confirmation", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.COMMITMENT
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "setTxUpdateHeight", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => 200)
            chai.spy.on(ErgoNetwork, "getHeight", () => height)
            chai.spy.on(ErgoNetwork, "sendTx")
            chai.spy.on(networkDb, "upgradeObservationTxStatus", () => undefined)
            chai.spy.on(networkDb, "removeTx", () => undefined)
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.not.been.called
            expect(networkDb.upgradeObservationTxStatus).have.been.called.with(observation)
            expect(networkDb.removeTx).have.been.called.with(txEntity)
            chai.spy.restore(ErgoNetwork)
        })

        /**
         * Expected Output:
         *    The function should remove the transaction
         *    Because the transaction inputs are spent, and the status is stabilized
         */
        it("should remove the commitment transaction because its inputs are spent and it has passed the timeout", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const txQueue = new TransactionQueue(networkDb, dbConnection)
            txEntity.type = TxType.COMMITMENT
            chai.spy.on(networkDb, "getAllTxs", () => [txEntity])
            chai.spy.on(networkDb, "downgradeObservationTxStatus", () => undefined)
            chai.spy.on(networkDb, "removeTx", () => undefined)
            chai.spy.on(ErgoNetwork, "getConfNum", () => -1)
            chai.spy.on(ErgoNetwork, "getHeight", () => height + 1000)
            chai.spy.on(ErgoNetwork, "sendTx")
            chai.spy.on(ErgoNetwork, "checkTxInputs", () => false)
            chai.spy.on(dbConnection, "isObservationValid", () => true)
            await txQueue.job()
            expect(ErgoNetwork.sendTx).have.not.been.called
            expect(networkDb.downgradeObservationTxStatus).have.been.called.with(observation)
            expect(networkDb.removeTx).have.been.called.with(txEntity)
            chai.spy.restore(ErgoNetwork)
        })
    })
})

