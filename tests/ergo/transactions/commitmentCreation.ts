import { Boxes } from "../../../src/ergo/boxes";
import { Transaction } from "../../../src/api/Transaction";
import { rosenConfig } from "./permit";
import { databaseConnection } from "../../../src/ergo/databaseConnection";
import { commitmentCreation } from "../../../src/transactinos/commitmentCreation";
import { loadDataBase } from "../../cardano/models/models";
import { loadBridgeDataBase } from "../../bridge/models/bridgeModel";
import { JsonBI } from "../../../src/network/parser";

import * as wasm from "ergo-lib-wasm-nodejs";
import { expect } from "chai";
import chai from "chai";
import spies from "chai-spies";
import sinon from "sinon"
chai.use(spies)

import permitObj from "./dataset/permitBox.json" assert {type: "json"}
import WIDObj from "./dataset/WIDBox.json" assert {type: "json"}
import WIDObj2 from "./dataset/WIDBox2.json" assert {type: "json"}
import plainObj from "./dataset/plainBox.json" assert {type: "json"}
import { ObservationEntity } from "../../../src/entities/watcher/network/ObservationEntity";
import { ErgoUtils, hexStrToUint8Array } from "../../../src/ergo/utils";
import { ErgoNetwork } from "../../../src/ergo/network/ergoNetwork";

const permitJson = JsonBI.stringify(permitObj)
const WIDJson = JsonBI.stringify(WIDObj)
const WIDJson2 = JsonBI.stringify(WIDObj2)
const plainJson = JsonBI.stringify(plainObj)
const permits = [wasm.ErgoBox.from_json(permitJson)]
const WIDBox = wasm.ErgoBox.from_json(WIDJson)
const WIDBox2 = wasm.ErgoBox.from_json(WIDJson2)
const plainBox = [wasm.ErgoBox.from_json(plainJson)]

const userAddress = "9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9"
const userSecret = "1111111111111111111111111111111111111111111111111111111111111111"
const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"

const observation: ObservationEntity = new ObservationEntity()
observation.id = 33
observation.fromChain = 'CARDANO'
observation.toChain = 'ERGO'
observation.bridgeFee = '10000'
observation.networkFee = '10000'
observation.amount = '10'
observation.sourceChainTokenId = 'asset12y0ewmxggeglymjpmp9mjf5qzh4kgwj9chtkpv'
observation.targetChainTokenId = 'cardanoTokenId'
observation.sourceTxId = 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa'
observation.sourceBlockId = '93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3'
observation.requestId = 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa'
observation.toAddress = 'ergoAddress'
observation.fromAddress = 'addr_test1vzg07d2qp3xje0w77f982zkhqey50gjxrsdqh89yx8r7nasu97hr0'

const commitment = ErgoUtils.commitmentFromObservation(observation, WID)

describe("Commitment creation transaction tests", () => {

    describe("createCommitmentTx", () => {
        it("Should create, sign and send a commitment transaction", async() => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0)
            const boxes = new Boxes(bridgeDb)
            chai.spy.on(boxes, "createCommitment")
            chai.spy.on(boxes, "createPermit")
            const tx = new Transaction(rosenConfig, userAddress, userSecret, boxes)
            const cc = new commitmentCreation(dbConnection, 1, boxes, tx)
            chai.spy.on(ErgoNetwork, "getHeight", () => 111)
            chai.spy.on(ErgoNetwork, "sentTx", () => {})
            // await cc.createCommitmentTx(WID, observation.requestId, commitment, permits, WIDBox, [])
            // expect(boxes.createPermit).to.have.called.with(111, 97, hexStrToUint8Array(WID))
        })
    })

    describe("job", () => {
        it("Should collect ready observations and create commitments", async() => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0)
            chai.spy.on(dbConnection, "allReadyObservations", () => [observation])
            chai.spy.on(dbConnection, "updateObservation", () => {})
            const boxes = new Boxes(bridgeDb)
            chai.spy.on(boxes, "getPermits", () => permits)
            chai.spy.on(boxes, "getWIDBox", () => WIDBox)
            chai.spy.on(boxes, "getUserPaymentBox")
            const tx = new Transaction(rosenConfig, userAddress, userSecret, boxes)
            sinon.stub(tx, 'watcherWID').value(WID)
            const cc = new commitmentCreation(dbConnection, 1, boxes, tx)
            chai.spy.on(cc, "createCommitmentTx", () => {return {txId: "txId", commitmentBoxId: "boxId"}})
            await cc.job()
            // Total value is enough should not call paymentBox
            expect(boxes.getUserPaymentBox).to.not.have.called()
            expect(dbConnection.updateObservation).to.have.called.with("boxId", observation)
            expect(cc.createCommitmentTx).to.have.called.with(WID, observation.requestId, commitment, permits, WIDBox, [])
        })

        it("Should collect ready observations and create commitment with excess fee box", async() => {
            const networkDb = await loadDataBase("dataBase");
            const bridgeDb = await loadBridgeDataBase("commitments");
            const dbConnection = new databaseConnection(networkDb, bridgeDb, 0)
            chai.spy.on(dbConnection, "allReadyObservations", () => [observation])
            chai.spy.on(dbConnection, "updateObservation", () => {})
            const boxes = new Boxes(bridgeDb)
            chai.spy.on(boxes, "getPermits", () => permits)
            chai.spy.on(boxes, "getWIDBox", () => WIDBox2)
            chai.spy.on(boxes, "getUserPaymentBox", () => plainBox)
            const tx = new Transaction(rosenConfig, userAddress, userSecret, boxes)
            sinon.stub(tx, 'watcherWID').value(WID)
            const cc = new commitmentCreation(dbConnection, 1, boxes, tx)
            chai.spy.on(cc, "createCommitmentTx", () => {return {txId: "txId", commitmentBoxId: "boxId"}})
            await cc.job()
            // Total value is not enough for the transaction
            expect(boxes.getUserPaymentBox).to.have.called.once
            expect(dbConnection.updateObservation).to.have.called.with("boxId", observation)
            expect(cc.createCommitmentTx).to.have.called.with(WID, observation.requestId, commitment, permits, WIDBox2, plainBox)
        })
    })
})