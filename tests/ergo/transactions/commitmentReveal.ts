import { Boxes } from "../../../src/ergo/boxes";
import { DatabaseConnection } from "../../../src/database/databaseConnection";
import { loadNetworkDataBase } from "../../database/networkDatabase";
import { loadBridgeDataBase } from "../../database/bridgeDatabase";
import { JsonBI } from "../../../src/ergo/network/parser";
import { ErgoUtils } from "../../../src/ergo/utils";
import { ErgoNetwork } from "../../../src/ergo/network/ergoNetwork";
import { CommitmentReveal } from "../../../src/transactions/commitmentReveal";
import { Buffer } from "buffer";
import { CommitmentSet } from "../../../src/utils/interfaces";
import { observation } from "./commitmentCreation";
import { TxType } from "../../../src/database/entities/watcher/TxEntity";
import { rosenConfig } from "./permit";

import * as wasm from "ergo-lib-wasm-nodejs";
import { expect } from "chai";
import chai from "chai";
import spies from "chai-spies";
import sinon from "sinon"

chai.use(spies)

import commitmentObj from "./dataset/commitmentBox.json" assert { type: "json" }
import WIDObj from "./dataset/WIDBox.json" assert { type: "json" }
import plainObj from "./dataset/plainBox.json" assert { type: "json" }
import txObj from "./dataset/commitmentTx.json" assert { type: "json" }
import { firstCommitment, thirdCommitment } from "../../database/mockedData";

const commitments = [wasm.ErgoBox.from_json(JsonBI.stringify(commitmentObj))]
const WIDBox = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj))
const plainBox = [wasm.ErgoBox.from_json(JsonBI.stringify(plainObj))]
const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj))

const WIDs = [Buffer.from(firstCommitment.WID, "hex"), Buffer.from(thirdCommitment.WID, "hex")]

describe("Commitment reveal transaction tests", () => {

    /**
     * Target: testing triggerEventCreationTx
     * Dependencies:
     *    databaseConnection
     *    Boxes
     * Expected Output:
     *    The function should construct a valid trigger event creation tx
     *    It should also sign and send it successfully
     */
    describe("triggerEventCreationTx", () => {
        it("Should create, sign and send a trigger event transaction", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            chai.spy.on(dbConnection, "submitTransaction", () => null)
            const boxes = new Boxes(rosenConfig, bridgeDb)
            chai.spy.on(boxes, "createTriggerEvent")
            chai.spy.on(boxes, "getRepoBox", () => WIDBox)
            const cr = new CommitmentReveal(dbConnection, boxes)
            sinon.stub(ErgoNetwork, "getHeight").resolves(111)
            sinon.stub(ErgoUtils, "createAndSignTx").resolves(signedTx)
            await cr.triggerEventCreationTx(commitments, observation, WIDs, plainBox)
            expect(boxes.createTriggerEvent).to.have.called.with(BigInt("1100000"), 111, WIDs, observation)
            expect(dbConnection.submitTransaction).to.have.been.called.with(signedTx, observation, TxType.TRIGGER)
            sinon.restore()
        })
    })

    /**
     * Target: testing triggerEventCreationTx
     * Dependencies:
     *    databaseConnection
     *    Boxes
     * Expected Output:
     *    The function should check validness of commitments and return all valid commitments
     */
    describe("commitmentCheck", () => {
        it("Should return empty array cause input is invalid", async () => {
            sinon.stub(ErgoUtils, "commitmentFromObservation").returns(Buffer.from(thirdCommitment.commitment))
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const boxes = new Boxes(rosenConfig, bridgeDb)
            const cr = new CommitmentReveal(dbConnection, boxes)
            const data = cr.commitmentCheck([firstCommitment], observation)
            expect(data).to.have.length(0)
            sinon.restore()
        })
        it("Should return one valid commitment", async () => {
            sinon.stub(ErgoUtils, "commitmentFromObservation").returns(Buffer.from(firstCommitment.commitment, "hex"))
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const boxes = new Boxes(rosenConfig, bridgeDb)
            const cr = new CommitmentReveal(dbConnection, boxes)
            const data = cr.commitmentCheck([firstCommitment], observation)
            expect(data).to.have.length(1)
            expect(data[0]).to.eq(firstCommitment)
            sinon.restore()
        })
    })

    /**
     * Target: testing triggerEventCreationTx
     * Dependencies:
     *    databaseConnection
     *    Boxes
     * Expected Output:
     *    The function should collect all ready commitment sets and check the commitment validation
     *    In case of enough valid commitments it should create the transaction
     */
    describe("job", () => {
        it("Should collect ready commitments and reveals the commitment by creating trigger event", async () => {
            const networkDb = await loadNetworkDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new DatabaseConnection(networkDb, bridgeDb, 0, 100)
            const commitmentSet: CommitmentSet = {
                commitments: [firstCommitment, thirdCommitment],
                observation: observation
            }
            chai.spy.on(dbConnection, "allReadyCommitmentSets", () => [commitmentSet])
            const boxes = new Boxes(rosenConfig, bridgeDb)
            chai.spy.on(boxes, "getUserPaymentBox", () => plainBox)
            sinon.stub(ErgoNetwork, "boxById").resolves(WIDBox)
            sinon.stub(ErgoUtils, "requiredCommitmentCount").resolves(BigInt(2))
            const cr = new CommitmentReveal(dbConnection, boxes)
            chai.spy.on(cr, "triggerEventCreationTx", () => "txId")
            chai.spy.on(cr, "commitmentCheck", () => [firstCommitment, thirdCommitment])
            await cr.job()
            expect(boxes.getUserPaymentBox).to.have.called.once
            expect(cr.triggerEventCreationTx).to.have.called.with([WIDBox, WIDBox], observation, WIDs, plainBox)
            expect(cr.commitmentCheck).to.have.been.called.with([firstCommitment, thirdCommitment], observation)
            sinon.restore()
        })
    })
})
