import { loadNetworkDataBase } from "../database/networkDatabase";
import { loadBridgeDataBase } from "../database/bridgeDatabase";
import { DatabaseConnection } from "../../src/database/databaseConnection";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";
import { ObservationEntity, TxStatus } from "@rosen-bridge/observation-extractor";
import { CommitmentEntity, EventTriggerEntity } from "@rosen-bridge/watcher-data-extractor";

import chai, { expect } from "chai";
import spies from "chai-spies";
import sinon from "sinon";
chai.use(spies)

const firstObservation: ObservationEntity = new ObservationEntity()
firstObservation.height = 11
firstObservation.status = TxStatus.NOT_COMMITTED
const secondObservation: ObservationEntity = new ObservationEntity()
secondObservation.height = 11
secondObservation.status = TxStatus.COMMITTED

const unspentCommitment = new CommitmentEntity()
const unspentCommitment2 = new CommitmentEntity()
const redeemedCommitment = new CommitmentEntity()
redeemedCommitment.spendBlockHash = "hash"
const mergedCommitment = new CommitmentEntity()
mergedCommitment.spendBlockHash = "hash"

const eventTrigger = new EventTriggerEntity()
eventTrigger.id = 1
eventTrigger.height = 111

describe("Testing the DatabaseConnection", () => {
    describe("allReadyObservations", () => {
        it("should return an observation", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            sinon.stub(ErgoNetwork, "getHeight").resolves(15)
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            chai.spy.on(dbConnection, "isMergeHappened", () => false)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(1)
            sinon.restore()
        })
        it("should return two observations", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            sinon.stub(ErgoNetwork, "getHeight").resolves(15)
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation, secondObservation])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            chai.spy.on(dbConnection, "isMergeHappened", () => true)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(0)
            sinon.restore()
        })
        it("should return no observations", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            chai.spy.on(networkDb, "updateObservationTxStatus", () => undefined)
            sinon.stub(ErgoNetwork, "getHeight").resolves(215)
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(0)
            expect(networkDb.updateObservationTxStatus).to.have.been.called.with(firstObservation, TxStatus.TIMED_OUT)
            sinon.restore()
        })
    })

    describe("allReadyCommitmentSets", () => {
        it("should not return commitment set", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(0)
        })
        it("should return one commitment set with two unspent commitments", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [secondObservation])
            chai.spy.on(bridgeDb, "commitmentsByEventId", () => [unspentCommitment, unspentCommitment2, redeemedCommitment])
            chai.spy.on(bridgeDb, "eventTriggerBySourceTxId", () => null)
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(1)
            expect(data[0].commitments).to.have.length(2)
        })
        it("should not return any commitment set because one of them is merged", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [secondObservation])
            chai.spy.on(bridgeDb, "commitmentsByEventId", () => [unspentCommitment, mergedCommitment, redeemedCommitment])
            chai.spy.on(bridgeDb, "eventTriggerBySourceTxId", () => eventTrigger)
            chai.spy.on(networkDb, "updateObservationTxStatus", () => undefined)
            chai.spy.on(ErgoNetwork, "getHeight", () => 5000)
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(networkDb.updateObservationTxStatus).to.have.been.called.with(secondObservation, TxStatus.REVEALED)
            expect(data).to.have.length(0)
            chai.spy.restore(ErgoNetwork)
        })
    })
})
