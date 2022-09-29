import { loadDataBase } from "../database/watcherDatabase";
import { TxStatus } from "../../src/database/entities/observationStatusEntity";
import {
    commitmentEntity,
    eventTriggerEntity,
    observationEntity1,
    observationStatusCommitted,
    observationStatusNotCommitted,
    observationStatusRevealed,
    observationStatusTimedOut,
    redeemedCommitment,
    unspentCommitment,
    unspentCommitment2
} from "../database/mockedData";
import { Boxes } from "../../src/ergo/boxes";
import {  secret1, userAddress } from "../ergo/transactions/permit";
import { Transaction } from "../../src/api/Transaction";
import { JsonBI } from "../../src/ergo/network/parser";
import txObj from "../ergo/transactions/dataset/commitmentTx.json" assert { type: "json" };
import { WatcherDataBase } from "../../src/database/models/watcherModel";
import { TxType } from "../../src/database/entities/txEntity";

import * as wasm from "ergo-lib-wasm-nodejs";
import chai, { expect } from "chai";
import spies from "chai-spies";
import { NoObservationStatus } from "../../src/errors/errors";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";
import { TransactionUtils, WatcherUtils } from "../../src/utils/watcherUtils";
import { rosenConfig } from "../../src/config/rosenConfig";

chai.use(spies)

const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj))

describe("Testing the WatcherUtils & TransactionUtils", () => {
    let dataBase: WatcherDataBase, boxes: Boxes, transaction: Transaction, watcherUtils: WatcherUtils, txUtils: TransactionUtils
    beforeEach(async () => {
        dataBase = await loadDataBase("network-watcherUtils", true);
        boxes = new Boxes(rosenConfig, dataBase)
        transaction = new Transaction(rosenConfig, userAddress, secret1, boxes);
        watcherUtils = new WatcherUtils(dataBase, transaction, 0, 100)
        txUtils = new TransactionUtils(dataBase)
    })

    describe("allReadyObservations", () => {
        /**
         * Target: testing allReadyObservations
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate output
         * Expected Output:
         *    The function should return all ready observations for commitment creation
         *    It should return one observation since
         *      - it has enough confirmation
         *      - it is still valid. didn't pass the threshold
         *      - the status is NOT-COMMITTED
         *      - trigger is not created yet
         *      - watcher didn't create commitment for this observation
         */
        it("should return an observation", async () => {
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            chai.spy.on(watcherUtils, "isMergeHappened", () => false)
            const data = await watcherUtils.allReadyObservations()
            expect(data).to.have.length(1)
        })

        /**
         * Target: testing allReadyObservations
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate output
         * Expected Output:
         *    The function should return all ready observations for commitment creation
         *    It should return nothing since the stored observation trigger had been created
         */
        it("should return zero observations", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            chai.spy.on(watcherUtils, "isMergeHappened", () => true)
            const data = await watcherUtils.allReadyObservations()
            expect(data).to.have.length(0)
        })

        /**
         * Target: testing allReadyObservations
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate output
         * Expected Output:
         *    The function should return all ready observations for commitment creation
         *    It should return nothing since the stored observation had passed the valid threshold
         */
        it("should return no observations", async () => {
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "updateObservationTxStatus", () => undefined)
            chai.spy.on(dataBase, "getLastBlockHeight", () => 215)
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            const data = await watcherUtils.allReadyObservations()
            expect(data).to.have.length(0)
            expect(dataBase.updateObservationTxStatus).to.have.been.called.with(observationEntity1, TxStatus.TIMED_OUT)
        })
    })

    describe("allReadyCommitmentSets", () => {
        /**
         * Target: testing allReadyCommitmentSets
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate output
         * Expected Output:
         *    The function should return all ready commitments along with the related observation for trigger creation
         *    It should return one commitment set with two commitments, since:
         *      - observation status is COMMITTED
         *      - commitments are unspent (One is redeemed not merged)
         */
        it("should return one commitment set with two unspent commitments", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusCommitted)
            chai.spy.on(dataBase, "commitmentsByEventId", () => [unspentCommitment, unspentCommitment2, redeemedCommitment])
            chai.spy.on(dataBase, "eventTriggerBySourceTxId", () => null)
            const data = await watcherUtils.allReadyCommitmentSets()
            expect(data).to.have.length(1)
            expect(data[0].commitments).to.have.length(2)
        })

        /**
         * Target: testing allReadyCommitmentSets
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate output
         * Expected Output:
         *    The function should return all ready commitments along with the related observation for trigger creation
         *    It should return nothing since the observation has no status or database had a problem
         */
        it("should not return commitment set, status not set", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            const data = await watcherUtils.allReadyCommitmentSets()
            expect(data).to.have.length(0)
        })

        /**
         * Target: testing allReadyCommitmentSets
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate output
         * Expected Output:
         *    The function should return all ready commitments along with the related observation for trigger creation
         *    It should return nothing since the observation status is NOT-COMMITTED
         */
        it("should not return commitment set, status is not-committed", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            const data = await watcherUtils.allReadyCommitmentSets()
            expect(data).to.have.length(0)
        })

        /**
         * Target: testing allReadyCommitmentSets
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate output
         * Expected Output:
         *    The function should return all ready commitments along with the related observation for trigger creation
         *    It should return nothing since one of the commitments is merged to create the trigger
         */
        it("should not return any commitment set, one of them is merged", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusCommitted)
            chai.spy.on(dataBase, "commitmentsByEventId", () => [unspentCommitment, redeemedCommitment])
            chai.spy.on(dataBase, "eventTriggerBySourceTxId", () => eventTriggerEntity)
            chai.spy.on(dataBase, "updateObservationTxStatus", () => undefined)
            const data = await watcherUtils.allReadyCommitmentSets()
            expect(dataBase.updateObservationTxStatus).to.have.been.called.with(observationEntity1, TxStatus.REVEALED)
            expect(data).to.have.length(0)
        })
    })

    describe("isObservationValid", () => {
        /**
         * Target: testing isObservationValid
         * Dependencies:
         *    watcherDatabase
         * Expected Output:
         *    The function should return false since the observation passed the valid threshold
         */
        it("should return false since the status is timeout", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusTimedOut)
            const data = await watcherUtils.isObservationValid(observationEntity1)
            expect(data).to.be.false
        })

        /**
         * Target: testing isObservationValid
         * Dependencies:
         *    watcherDatabase
         * Expected Output:
         *    The function should return false since this watcher have created this commitment beforehand
         */
        it("should return false since this watcher have created this commitment beforehand", async () => {
            commitmentEntity.WID = transaction.watcherWID? transaction.watcherWID: ""
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "commitmentsByEventId", () => [commitmentEntity])
            const data = await watcherUtils.isObservationValid(observationEntity1)
            expect(data).to.be.false
        })

        /**
         * Target: testing isObservationValid
         * Dependencies:
         *    watcherDatabase
         * Expected Output:
         *    The function should throw error since the status have not been set correctly in the database
         */
        it("should return error due to status problem", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => null)
            await expect(watcherUtils.isObservationValid(observationEntity1)).to.rejectedWith(NoObservationStatus)
        })
    })

    describe("isMergedHappened", () => {
        /**
         * Target: testing isMergedHappened
         * Dependencies:
         *    watcherDatabase
         * Expected Output:
         *   The function should throw error since the status have not been set correctly in the database
         */
        it("should return error due to status problem", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => null)
            await expect(watcherUtils.isMergeHappened(observationEntity1)).to.rejectedWith(NoObservationStatus)
        })

        /**
         * Target: testing isMergedHappened
         * Dependencies:
         *    watcherDatabase
         * Expected Output:
         *   The function should return false since the trigger have been created lately
         */
        it("should return false since the status is revealed", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusRevealed)
            const data = await watcherUtils.isMergeHappened(observationEntity1)
            expect(data).to.be.true
        })
    })

    describe("submitTransaction", () => {
        /**
         * Target: testing submitTransaction
         * Dependencies:
         *    watcherDatabase
         * Test Procedure:
         *    1- Mocking environment
         *    2- calling function
         *    3- validate used functions with inputs
         * Expected Output:
         *    The function should submit a transaction and update its status
         */
        it("should submit a transaction and upgrade its status", async () => {
            chai.spy.on(ErgoNetwork, "getHeight", () => 100)
            chai.spy.on(dataBase, "upgradeObservationTxStatus", () => undefined)
            chai.spy.on(dataBase, "submitTx", () => undefined)
            await txUtils.submitTransaction(signedTx, observationEntity1, TxType.COMMITMENT)
            expect(dataBase.submitTx).to.have.been.called.with(
                Buffer.from(signedTx.sigma_serialize_bytes()).toString("base64"),
                observationEntity1.requestId,
                signedTx.id().to_str(),
                TxType.COMMITMENT)
            expect(dataBase.upgradeObservationTxStatus).to.have.been.called.with(observationEntity1)
            expect(ErgoNetwork.getHeight).to.have.been.called.once
            chai.spy.restore(ErgoNetwork)
        })
    })
})
