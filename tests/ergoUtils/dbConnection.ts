import { loadDataBase } from "../cardano/models/models";
import { loadBridgeDataBase } from "../bridge/models/bridgeModel";
import { DatabaseConnection } from "../../src/ergo/databaseConnection";
import { ObservationEntity } from "../../src/entities/watcher/network/ObservationEntity";
import { ObservedCommitmentEntity, SpendReason } from "../../src/entities/watcher/bridge/ObservedCommitmentEntity";
import { BridgeBlockEntity } from "../../src/entities/watcher/bridge/BridgeBlockEntity";

import { expect } from "chai";
import chai from "chai";
import spies from "chai-spies";
chai.use(spies)

const block = new BridgeBlockEntity()

const firstObservation: ObservationEntity = new ObservationEntity()
firstObservation.commitmentBoxId = "boxId";
const secondObservation: ObservationEntity = new ObservationEntity()

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
            chai.spy.on(networkDb, "getConfirmedObservations", () => [secondObservation])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(1)
        })
        it("should return no observations", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            chai.spy.on(bridgeDb, "findCommitmentsById", () => [unspentCommitment])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(0)
        })
        it("should return two observations", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation, secondObservation])
            chai.spy.on(bridgeDb, "findCommitmentsById", () => [])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0)
            const data = await dbConnection.allReadyObservations()
            expect(data).to.have.length(2)
        })
    })

    describe("allReadyCommitmentSets", () => {
        it("should not return commitment set", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [secondObservation])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(0)
        })
        it("should return one commitment set with two unspent commitments", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            chai.spy.on(bridgeDb, "findCommitmentsById", () => [unspentCommitment])
            chai.spy.on(bridgeDb, "commitmentsByEventId", () => [unspentCommitment, unspentCommitment2, redeemedCommitment])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(1)
            expect(data[0].commitments).to.have.length(2)
        })
        it("should not return any commitment set because one of them is merged", async () => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            chai.spy.on(networkDb, "getConfirmedObservations", () => [firstObservation])
            chai.spy.on(bridgeDb, "findCommitmentsById", () => [unspentCommitment])
            chai.spy.on(bridgeDb, "commitmentsByEventId", () => [unspentCommitment, mergedCommitment, redeemedCommitment])
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0)
            const data = await dbConnection.allReadyCommitmentSets()
            expect(data).to.have.length(0)
        })
    })
})
