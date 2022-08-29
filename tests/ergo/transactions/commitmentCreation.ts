import { Boxes } from "../../../src/ergo/boxes";
import { Transaction } from "../../../src/api/Transaction";
import { rosenConfig, secret1 } from "./permit";
import { CommitmentCreation } from "../../../src/transactions/commitmentCreation";
import { JsonBI } from "../../../src/ergo/network/parser";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { ErgoUtils } from "../../../src/ergo/utils";
import { ErgoNetwork } from "../../../src/ergo/network/ergoNetwork";
import { WatcherUtils, hexStrToUint8Array, TransactionUtils } from "../../../src/utils/utils";
import { TxType } from "../../../src/database/entities/txEntity";
import { WatcherDataBase } from "../../../src/database/models/watcherModel";
import { loadDataBase } from "../../database/watcherDatabase";

import * as wasm from "ergo-lib-wasm-nodejs";
import { expect } from "chai";
import chai from "chai";
import spies from "chai-spies";
import sinon from "sinon"
import permitObj from "./dataset/permitBox.json" assert { type: "json" }
import WIDObj from "./dataset/WIDBox.json" assert { type: "json" }
import WIDObj2 from "./dataset/WIDBox2.json" assert { type: "json" }
import plainObj from "./dataset/plainBox.json" assert { type: "json" }
import txObj from "./dataset/commitmentTx.json" assert { type: "json" }


chai.use(spies)

const permits = [wasm.ErgoBox.from_json(JsonBI.stringify(permitObj))]
const WIDBox = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj))
const WIDBox2 = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj2))
const plainBox = [wasm.ErgoBox.from_json(JsonBI.stringify(plainObj))]
const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj))

const userAddress = "9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9"
const userSecret = wasm.SecretKey.dlog_from_bytes(Buffer.from("1111111111111111111111111111111111111111111111111111111111111111", "hex"))
const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"

export const observation: ObservationEntity = new ObservationEntity()
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
    let watcherDb: WatcherDataBase, txUtils: TransactionUtils, boxes: Boxes, transaction: Transaction, watcherUtils: WatcherUtils
    let cc: CommitmentCreation
    before(async () => {
        watcherDb = await loadDataBase("commitmentCreation");
        boxes = new Boxes(rosenConfig, watcherDb)
        transaction = new Transaction(rosenConfig, userAddress, secret1, boxes);
        watcherUtils = new WatcherUtils(watcherDb, transaction, 0, 100)
        txUtils = new TransactionUtils(watcherDb)
        cc = new CommitmentCreation(watcherUtils, txUtils, boxes, transaction)
    })
    afterEach(() => {
        chai.spy.restore(watcherUtils)
    })

    /**
     * Target: testing createCommitmentTx
     * Dependencies:
     *    databaseConnection
     *    Boxes
     *    Transaction
     * Expected Output:
     *    The function should construct a valid commitment creation tx
     *    It should also sign and send it successfully
     */
    describe("createCommitmentTx", () => {
        it("Should create, sign and send a commitment transaction", async () => {
            chai.spy.on(watcherUtils, "submitTransaction", () => null)
            chai.spy.on(boxes, "createCommitment")
            chai.spy.on(boxes, "createPermit")
            sinon.stub(ErgoNetwork, "getHeight").resolves(111)
            sinon.stub(ErgoUtils, "createAndSignTx").resolves(signedTx)
            await cc.createCommitmentTx(WID, observation, commitment, permits, WIDBox, [])
            expect(boxes.createPermit).to.have.called.with(111, BigInt(97), hexStrToUint8Array(WID))
            expect(boxes.createCommitment).to.have.called.once
            expect(txUtils.submitTransaction).to.have.been.called.with(signedTx, observation, TxType.COMMITMENT)
            sinon.restore()
        })
    })

    /**
     * Target: testing job
     * Dependencies:
     *    databaseConnection
     *    Boxes
     *    Transaction
     * Expected Output:
     *    The function should collect all ready observations to create the commitment transaction
     *    If the box values is not enough should use an excess fee box covering the tx fee
     */
    describe("job", () => {
        it("Should collect ready observations and create commitments", async () => {
            chai.spy.on(watcherUtils, "allReadyObservations", () => [observation])
            chai.spy.on(watcherUtils, "updateObservation", () => {
                return
            })
            chai.spy.on(boxes, "getPermits", () => permits)
            chai.spy.on(boxes, "getWIDBox", () => WIDBox)
            chai.spy.on(boxes, "getUserPaymentBox")
            sinon.stub(transaction, 'watcherWID').value(WID)
            chai.spy.on(cc, "createCommitmentTx", () => {
                return {txId: "txId", commitmentBoxId: "boxId"}
            })
            await cc.job()
            // Total value is enough should not call paymentBox
            expect(boxes.getUserPaymentBox).to.not.have.called()
            expect(cc.createCommitmentTx).to.have.called.with(WID, observation, commitment, permits, WIDBox, [])
        })

        it("Should collect ready observations and create commitment with excess fee box", async () => {
            chai.spy.on(watcherUtils, "allReadyObservations", () => [observation])
            chai.spy.on(watcherUtils, "updateObservation", () => {
                return
            })
            chai.spy.on(boxes, "getPermits", () => permits)
            chai.spy.on(boxes, "getWIDBox", () => WIDBox2)
            chai.spy.on(boxes, "getUserPaymentBox", () => plainBox)
            sinon.stub(transaction, 'watcherWID').value(WID)
            chai.spy.on(cc, "createCommitmentTx", () => {
                return {txId: "txId", commitmentBoxId: "boxId"}
            })
            await cc.job()
            // Total value is not enough for the transaction
            expect(boxes.getUserPaymentBox).to.have.called.once
            expect(cc.createCommitmentTx).to.have.called.with(WID, observation, commitment, permits, WIDBox2, plainBox)
        })
    })
})
