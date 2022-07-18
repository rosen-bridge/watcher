import { loadDataBase } from "../cardano/models/models";
import { loadBridgeDataBase } from "../bridge/models/bridgeModel";
import { databaseConnection } from "../../src/ergo/databaseConnection";
import { ObservationEntity, TxStatus } from "../../src/entities/watcher/network/ObservationEntity";
import { ObservedCommitmentEntity, SpendReason } from "../../src/entities/watcher/bridge/ObservedCommitmentEntity";
import { BridgeBlockEntity } from "../../src/entities/watcher/bridge/BridgeBlockEntity";
import { BlockEntity } from "../../src/entities/watcher/network/BlockEntity";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";

import chai, { expect } from "chai";
import spies from "chai-spies";
import sinon from "sinon";
chai.use(spies)

const block = new BridgeBlockEntity()
block.height = 111

const blockEntity : BlockEntity = new BlockEntity()
blockEntity.height = 11
const firstObservation: ObservationEntity = new ObservationEntity()
firstObservation.block = blockEntity
firstObservation.status = TxStatus.NOT_COMMITTED
const secondObservation: ObservationEntity = new ObservationEntity()
secondObservation.block = blockEntity
secondObservation.status = TxStatus.COMMITTED

const unspentCommitment = new ObservedCommitmentEntity()
const unspentCommitment2 = new ObservedCommitmentEntity()
const redeemedCommitment = new ObservedCommitmentEntity()
redeemedCommitment.spendReason = SpendReason.REDEEM
redeemedCommitment.spendBlock = block
const mergedCommitment = new ObservedCommitmentEntity()
mergedCommitment.spendReason = SpendReason.MERGE
mergedCommitment.spendBlock = block


describe("Testing the databaseConnection", () => {
    describe("allReadyObservations", () => {
        it("should return an observation", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            sinon.stub(ErgoNetwork, "getHeight").resolves(15)
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0, 100)
            chai.spy.on(dbConnection, "isMergeHappened", () => false)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(1)
            sinon.restore()
        })
        it("should return two observations", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            sinon.stub(ErgoNetwork, "getHeight").resolves(15)
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation, secondObservation])
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0, 100)
            chai.spy.on(dbConnection, "isMergeHappened", () => true)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(0)
            sinon.restore()
        })
        it("should return no observations", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            chai.spy.on(networkDb, "updateObservationTxStatus", () => undefined)
            sinon.stub(ErgoNetwork, "getHeight").resolves(215)
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(0)
            expect(networkDb.updateObservationTxStatus).to.have.been.called.with(firstObservation, TxStatus.TIMED_OUT)
            sinon.restore()
        })
    })

    describe("allReadyCommitmentSets", () => {
        it("should not return commitment set", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(0)
        })
        it("should return one commitment set with two unspent commitments", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [secondObservation])
            chai.spy.on(bridgeDb, "commitmentsByEventId", () => [unspentCommitment, unspentCommitment2, redeemedCommitment])
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(1)
            expect(data[0].commitments).to.have.length(2)
        })
        it("should not return any commitment set because one of them is merged", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [secondObservation])
            chai.spy.on(bridgeDb, "findCommitmentsById", () => [unspentCommitment])
            chai.spy.on(bridgeDb, "commitmentsByEventId", () => [unspentCommitment, mergedCommitment, redeemedCommitment])
            chai.spy.on(networkDb, "updateObservationTxStatus", () => undefined)
            chai.spy.on(ErgoNetwork, "getHeight", () => 5000)
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0, 100)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(networkDb.updateObservationTxStatus).to.have.been.called.with(secondObservation, TxStatus.REVEALED)
            expect(data).to.have.length(0)
        })
    })
})
