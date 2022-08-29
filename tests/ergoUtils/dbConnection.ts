import { loadDataBase } from "../database/watcherDatabase";
import { DatabaseConnection } from "../../src/database/databaseConnection";
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
import { rosenConfig, secret1, userAddress } from "../ergo/transactions/permit";
import { Transaction } from "../../src/api/Transaction";
import { JsonBI } from "../../src/ergo/network/parser";
import txObj from "../ergo/transactions/dataset/commitmentTx.json" assert { type: "json" };
import { WatcherDataBase } from "../../src/database/models/watcherModel";
import { TxType } from "../../src/database/entities/txEntity";

import * as wasm from "ergo-lib-wasm-nodejs";
import chai, { expect } from "chai";
import spies from "chai-spies";
import chaiPromise from "chai-as-promised"
import { NoObservationStatus } from "../../src/utils/errors";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";

chai.use(spies)

const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj))

describe("Testing the DatabaseConnection", () => {
    let dataBase: WatcherDataBase, boxes: Boxes, transaction: Transaction, dbConnection: DatabaseConnection
    beforeEach(async () => {
        dataBase = await loadDataBase("network-dbConnection");
        boxes = new Boxes(rosenConfig, dataBase)
        transaction = new Transaction(rosenConfig, userAddress, secret1, boxes);
        dbConnection = new DatabaseConnection(dataBase, transaction, 0, 100)
    })

    describe("allReadyObservations", () => {
        it("should return an observation", async () => {
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            chai.spy.on(dbConnection, "isMergeHappened", () => false)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(1)
        })
        it("should return zero observations", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            chai.spy.on(dbConnection, "isMergeHappened", () => true)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(0)
        })
        it("should return no observations", async () => {
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "updateObservationTxStatus", () => undefined)
            chai.spy.on(dataBase, "getLastBlockHeight", () => 215)
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(0)
            expect(dataBase.updateObservationTxStatus).to.have.been.called.with(observationEntity1, TxStatus.TIMED_OUT)
        })
    })

    describe("allReadyCommitmentSets", () => {
        it("should not return commitment set", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(0)
        })
        it("should return one commitment set with two unspent commitments", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusCommitted)
            chai.spy.on(dataBase, "commitmentsByEventId", () => [unspentCommitment, unspentCommitment2, redeemedCommitment])
            chai.spy.on(dataBase, "eventTriggerBySourceTxId", () => null)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(1)
            expect(data[0].commitments).to.have.length(2)
        })
        it("should not return any commitment set because one of them is merged", async () => {
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "getConfirmedObservations", () => [observationEntity1])
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusCommitted)
            chai.spy.on(dataBase, "commitmentsByEventId", () => [unspentCommitment, redeemedCommitment])
            chai.spy.on(dataBase, "eventTriggerBySourceTxId", () => eventTriggerEntity)
            chai.spy.on(dataBase, "updateObservationTxStatus", () => undefined)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(dataBase.updateObservationTxStatus).to.have.been.called.with(observationEntity1, TxStatus.REVEALED)
            expect(data).to.have.length(0)
        })
    })

    describe("isObservationValid", () => {
        it("should return false since the status is timeout", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusTimedOut)
            const data = await dbConnection.isObservationValid(observationEntity1)
            expect(data).to.be.false
        })
        it("should return false since this watcher have created this commitment beforehand", async () => {
            commitmentEntity.WID = transaction.watcherWID? transaction.watcherWID: ""
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusNotCommitted)
            chai.spy.on(dataBase, "getLastBlockHeight", () => 15)
            chai.spy.on(dataBase, "commitmentsByEventId", () => [commitmentEntity])
            const data = await dbConnection.isObservationValid(observationEntity1)
            expect(data).to.be.false
        })
        it("should return error due to status problem", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => null)
            await expect(dbConnection.isObservationValid(observationEntity1)).to.rejectedWith(NoObservationStatus)
        })
    })

    describe("isMergedHappened", () => {
        it("should return error due to status problem", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => null)
            await expect(dbConnection.isMergeHappened(observationEntity1)).to.rejectedWith(NoObservationStatus)
        })
        it("should return false since the status is timeout", async () => {
            chai.spy.on(dataBase, "getStatusForObservations", () => observationStatusRevealed)
            const data = await dbConnection.isMergeHappened(observationEntity1)
            expect(data).to.be.true
        })
    })

    describe("submitTransaction", () => {
        it("should submit a transaction and upgrade its status", async () => {
            chai.spy.on(ErgoNetwork, "getHeight", () => 100)
            chai.spy.on(dataBase, "upgradeObservationTxStatus", () => undefined)
            chai.spy.on(dataBase, "submitTx", () => undefined)
            await dbConnection.submitTransaction(signedTx, observationEntity1, TxType.COMMITMENT)
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
