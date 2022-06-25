import { Boxes } from "../../src/ergo/boxes";
import { expect } from "chai";
import * as wasm from "ergo-lib-wasm-nodejs";
import { firstCommitment, loadDataBase } from "../commitment/models/commitmentModel";
import { contractHash } from "../../src/ergo/utils";
import { firstObservations } from "../cardano/models/models";
import { SpecialBox } from "../../src/objects/interfaces";
import { BoxType } from "../../src/entities/watcher/commitment/BoxEntity";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";
import { NotEnoughFund } from "../../src/errors/errors";
import { JsonBI } from "../../src/network/parser";

import chai from "chai";
import spies from "chai-spies";
import sinon from "sinon"
import chaiPromise from "chai-as-promised"

import permitObj from "./dataset/permitBox.json"
import WIDObj from "./dataset/WIDBox.json"
import plainObj from "./dataset/plainBox.json"

const permitJson = JsonBI.stringify(permitObj)
const WIDJson = JsonBI.stringify(WIDObj)
const plainJson = JsonBI.stringify(plainObj)

chai.use(spies);
chai.use(chaiPromise)

const permitBox: SpecialBox = {
    boxId: "6ba81a7de39dce3303d100516bf80228e8c03464c130d5b0f8ff6f78f66bcbc8",
    type: BoxType.PERMIT,
    value: "10000000",
    boxJson: permitJson
}

const WIDBox: SpecialBox ={
    boxId: "2e24776266d16afbf23e7c96ba9c2ffb9bce25ea75d3ed9f2a9a3b2c84bf1655",
    type: BoxType.WID,
    value: "10000000",
    boxJson: WIDJson
}

const plainBox: SpecialBox ={
    boxId: "57dc591ecba4c90f9116740bf49ffea2c7b73625f259e60ec0c23add86b14f47",
    type: BoxType.PLAIN,
    value: "10000000",
    boxJson: WIDJson
}

const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"
const tokenId = "469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db"
const permit = "EE7687i4URb4YuSGSQXPCb6iAFxAd5s8H1DLbUFQnSrJ8rED2KXdq8kUPQZ3pcPVFD97wQ32PATufWyvyhvit6sokNfLUNqp8wirq6L4H1WQSxYyL6gX7TeLTF2fRwqCvFDkcN6Z5StykpvKT4GrC9wa8DAu8nFre6VAnxMzE5DG3AVxir1pEWEKoLohsRCmKXGJu9jw58R1tE6Ff1LqqiaXbaAgkiyma9PA2Ktv41W6GutPKCmqSE6QzheE2i5c9uuUDRw3fr1kWefphpZVSmuCqNjuVU9fV73dtZE7jhHoXgTFRtHmGJS27DrHL9VvLyo7AP6bSgr4mAoYdF8UPTmcu4fFsMGFFJahLXm7V1qeqtsBXXEvRqQYEaSbMNRVmSZAe6jPhLVyqTBF9rLbYTCCjQXA6u7fu7JHn9xULHxsEjYdRuciVnnsk7RT5dDMM7YCC2yxnE7X8mZMekwceG3dj2triNPo7N6NbxNVSyw1jxaHJGHEza5PgUcieMqMvZyixuiu6PqA55GRCoCRek2pBcATifcyB2FJqtj"

describe("Testing Box Creation", () => {
    const value = BigInt(10000000)

    describe("getPermits", () => {
        it("returns all permits ready to merge", async () => {
            const DB = await loadDataBase("commitments");
            chai.spy.on(DB, 'getUnspentSpecialBoxes', () => [permitBox])
            const mempoolTrack = sinon.stub(ErgoNetwork, 'trackMemPool')
            mempoolTrack.onCall(0).resolves(wasm.ErgoBox.from_json(permitJson))
            mempoolTrack.onCall(1).resolves(wasm.ErgoBox.from_json(WIDJson))
            mempoolTrack.onCall(2).resolves(wasm.ErgoBox.from_json(plainJson))
            const boxes = new Boxes(DB)
            const data = await boxes.getPermits()
            expect(data).to.have.length(1)
            expect(data[0].box_id().to_str()).to.eq(permitBox.boxId)
        })
    })

    describe("getWIDBox", () => {
        it("returns all wids ready to merge", async () => {
            const DB = await loadDataBase("commitments");
            chai.spy.on(DB, 'getUnspentSpecialBoxes', () => [WIDBox])
            const boxes = new Boxes(DB)
            const data = await boxes.getWIDBox()
            expect(data.box_id().to_str()).to.eq(WIDBox.boxId)
        })
    })

    describe("getUserPaymentBox", () => {
        it("returns a covering plain boxes", async () => {
            const DB = await loadDataBase("commitments");
            chai.spy.on(DB, 'getUnspentSpecialBoxes', () => [plainBox])
            const boxes = new Boxes(DB)
            const data = await boxes.getUserPaymentBox(value)
            expect(data).to.have.length(1)
            expect(data[0].box_id().to_str()).to.eq(plainBox.boxId)
        })
        it("throws an error not covering the required amount", async () => {
            const DB = await loadDataBase("commitments");
            chai.spy.on(DB, 'getUnspentSpecialBoxes', () => [plainBox])
            const boxes = new Boxes(DB)
            await expect(boxes.getUserPaymentBox(value*BigInt(2))).to.rejectedWith(NotEnoughFund)
        })
    })

    describe("createPermit", () => {
        it("tests the permit box creation", () => {
            const data = Boxes.createPermit(value, 10, BigInt(9), WID)
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(9)
        })
    })

    describe("createCommitment", () => {
        it("tests the commitment box creation", () => {
            const permitHash = contractHash(wasm.Contract.pay_to_address(
                wasm.Address.from_base58(
                    permit
                )
            ))
            const data = Boxes.createCommitment(value, 10, WID, firstCommitment.eventId, Buffer.from(firstCommitment.commitment, 'hex'), permitHash)
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(1)
        })
    })

    describe("createPayment", () => {
        it("tests the payment creation", () => {
            const token = new wasm.Token(wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str("5")))
            const data = Boxes.createPayment(value, 10, [token])
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(5)
            expect(data.tokens().get(0).id().to_str()).to.eq(tokenId)
        })
    })

    describe("createTriggerEvent", () => {
        it("tests the event trigger box creation", () => {
            const data = Boxes.createTriggerEvent(value, 10, [Buffer.from(WID), Buffer.from(WID)], firstObservations[0])
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(2)
        })
    })
})
