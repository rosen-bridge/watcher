import { Boxes } from "../../src/ergo/boxes";
import { expect } from "chai";
import * as wasm from "ergo-lib-wasm-nodejs";
import { loadBridgeDataBase } from "../database/bridgeDatabase";
import { ErgoUtils } from "../../src/ergo/utils";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";
import { NotEnoughFund } from "../../src/utils/errors";
import { hexStrToUint8Array } from "../../src/utils/utils";
import { rosenConfig, tokens } from "../ergo/transactions/permit";
import { initMockedAxios } from "../ergo/objects/axios";
import { boxesSample } from "../ergo/dataset/BoxesSample";
import { JsonBI } from "../../src/ergo/network/parser";
import { PermitEntity } from "@rosen-bridge/watcher-data-extractor";
import { BoxEntity } from "@rosen-bridge/address-extractor";
import { Buffer } from "buffer";
import { Observation } from "../../src/utils/interfaces";

import chai from "chai";
import spies from "chai-spies";
import sinon, { resetBehavior } from "sinon"
import chaiPromise from "chai-as-promised"

import permitObj from "./dataset/permitBox.json" assert { type: "json" }
import WIDObj from "./dataset/WIDBox.json" assert { type: "json" }
import plainObj from "./dataset/plainBox.json" assert { type: "json" }
import { firstCommitment } from "../database/mockedData";

const permitJson = JsonBI.stringify(permitObj)
const WIDJson = JsonBI.stringify(WIDObj)
const plainJson = JsonBI.stringify(plainObj)

chai.use(spies);
chai.use(chaiPromise)
initMockedAxios();

const permitBox: PermitEntity = new PermitEntity()
permitBox.boxSerialized = Buffer.from(wasm.ErgoBox.from_json(permitJson).sigma_serialize_bytes()).toString("base64")
permitBox.boxId = "6ba81a7de39dce3303d100516bf80228e8c03464c130d5b0f8ff6f78f66bcbc8"

const WIDBox: BoxEntity = new BoxEntity()
WIDBox.serialized = Buffer.from(wasm.ErgoBox.from_json(WIDJson).sigma_serialize_bytes()).toString("base64")
WIDBox.boxId = "2e24776266d16afbf23e7c96ba9c2ffb9bce25ea75d3ed9f2a9a3b2c84bf1655"

const plainBox: BoxEntity = new BoxEntity()
plainBox.serialized = Buffer.from(wasm.ErgoBox.from_json(plainJson).sigma_serialize_bytes()).toString("base64")
plainBox.boxId = "57dc591ecba4c90f9116740bf49ffea2c7b73625f259e60ec0c23add86b14f47"

const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"
const permit = "EE7687i4URb4YuSGSQXPCb6iAFxAd5s8H1DLbUFQnSrJ8rED2KXdq8kUPQZ3pcPVFD97wQ32PATufWyvyhvit6sokNfLUNqp8wirq6L4H1WQSxYyL6gX7TeLTF2fRwqCvFDkcN6Z5StykpvKT4GrC9wa8DAu8nFre6VAnxMzE5DG3AVxir1pEWEKoLohsRCmKXGJu9jw58R1tE6Ff1LqqiaXbaAgkiyma9PA2Ktv41W6GutPKCmqSE6QzheE2i5c9uuUDRw3fr1kWefphpZVSmuCqNjuVU9fV73dtZE7jhHoXgTFRtHmGJS27DrHL9VvLyo7AP6bSgr4mAoYdF8UPTmcu4fFsMGFFJahLXm7V1qeqtsBXXEvRqQYEaSbMNRVmSZAe6jPhLVyqTBF9rLbYTCCjQXA6u7fu7JHn9xULHxsEjYdRuciVnnsk7RT5dDMM7YCC2yxnE7X8mZMekwceG3dj2triNPo7N6NbxNVSyw1jxaHJGHEza5PgUcieMqMvZyixuiu6PqA55GRCoCRek2pBcATifcyB2FJqtj"

export const firstObservation: Observation = {
    fromChain: "erg",
    toChain: "cardano",
    fromAddress: "ErgoAddress",
    toAddress: "cardanoAddress",
    amount: "1000000000",
    bridgeFee: "1000000",
    networkFee: "1000000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId1",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId1",
}

describe("Testing Box Creation", () => {
    const value = BigInt(10000000)

    describe("getPermits", () => {
        it("returns all permits ready to merge", async () => {
            const DB = await loadBridgeDataBase("commitments");
            chai.spy.on(DB, 'getUnspentPermitBoxes', () => [permitBox])
            const mempoolTrack = sinon.stub(ErgoNetwork, 'trackMemPool')
            mempoolTrack.onCall(0).resolves(wasm.ErgoBox.from_json(permitJson))
            mempoolTrack.onCall(1).resolves(wasm.ErgoBox.from_json(WIDJson))
            mempoolTrack.onCall(2).resolves(wasm.ErgoBox.from_json(plainJson))
            const boxes = new Boxes(rosenConfig, DB)
            const data = await boxes.getPermits(WID)
            expect(data).to.have.length(1)
            expect(data[0].box_id().to_str()).to.eq(permitBox.boxId)
        })
    })

    describe("getWIDBox", () => {
        it("returns all wids ready to merge", async () => {
            const DB = await loadBridgeDataBase("commitments");
            chai.spy.on(DB, 'getUnspentAddressBoxes', () => [WIDBox])
            const boxes = new Boxes(rosenConfig, DB)
            const data = await boxes.getWIDBox("f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b")
            expect(data.box_id().to_str()).to.eq(WIDBox.boxId)
        })
    })

    describe("getUserPaymentBox", () => {
        it("returns a covering plain boxesSample", async () => {
            const DB = await loadBridgeDataBase("commitments");
            chai.spy.on(DB, 'getUnspentAddressBoxes', () => [plainBox])
            const boxes = new Boxes(rosenConfig, DB)
            const data = await boxes.getUserPaymentBox(value)
            expect(data).to.have.length(1)
            expect(data[0].box_id().to_str()).to.eq(plainBox.boxId)
        })
        // TODO: after the improvement
        // it("throws an error not covering the required amount", async () => {
        //     const DB = await loadBridgeDataBase("commitments");
        //     chai.spy.on(DB, 'getUnspentPlainBoxes', () => [plainBox])
        //     const boxes = new Boxes(rosenConfig, DB)
        //     await expect(boxes.getUserPaymentBox(value * BigInt(2))).to.rejectedWith(NotEnoughFund)
        // })
    })

    describe("getRepoBox", () => {
        it("should return repoBox(with tracking mempool)", async () => {
            initMockedAxios(1)
            const DB = await loadBridgeDataBase("commitments");
            const boxes = new Boxes(rosenConfig, DB)
            chai.spy.on(boxes, "getRepoBox", () => {
                return wasm.ErgoBox.from_json(boxesSample.repoLastBox)
            })
            const repoBox = await boxes.getRepoBox();
            expect(repoBox.box_id().to_str()).to.be.equal("2420251b88745c325124fac2abb6f1d3c0f23db66dd5d561aae6767b41cb5350");
        });
    });

    describe('createRepo', () => {
        it("checks repoBox tokens order and count", async () => {
            const DB = await loadBridgeDataBase("commitments");
            const boxes = new Boxes(rosenConfig, DB)
            const RWTCount = "100";
            const RSNCount = "1";
            const repoBox = await boxes.createRepo(
                0,
                RWTCount,
                RSNCount,
                [new Uint8Array([])],
                [],
                wasm.Constant.from_i64_str_array([]),
                0
            );

            expect(repoBox.tokens().len()).to.be.equal(3);
            expect(repoBox.value().as_i64().to_str()).to.be.equal(rosenConfig.minBoxValue);
            expect(repoBox.tokens().get(1).amount().as_i64().to_str()).to.be.equal(RWTCount);
            expect(repoBox.tokens().get(2).amount().as_i64().to_str()).to.be.equal(RSNCount);
        });
    });


    describe("createPermit", () => {
        it("checks permit box registers and tokens", async () => {
            const DB = await loadBridgeDataBase("commitments");
            const boxes = new Boxes(rosenConfig, DB)
            const WID = hexStrToUint8Array("4198da878b927fdd33e884d7ed399a3dbd22cf9d855ff5a103a50301e70d89fc");
            const RWTCount = BigInt(100)
            const permitBox = await boxes.createPermit(
                1,
                RWTCount,
                WID
            );

            expect(permitBox.value().as_i64().to_str()).to.be.equal(rosenConfig.minBoxValue);
            expect(permitBox.tokens().len()).to.be.equal(1);
            expect(permitBox.tokens().get(0).amount().as_i64().to_str()).to.be.equal(RWTCount.toString());
            expect(permitBox.tokens().get(0).id().to_str()).to.be.equal(rosenConfig.RWTId);
            expect(permitBox.register_value(4)?.to_coll_coll_byte().length).to.be.equal(1);
            expect(permitBox.register_value(4)?.to_coll_coll_byte()[0]).to.be.eql(WID);
            expect(permitBox.register_value(5)?.to_byte_array()).to.be.eql(new Uint8Array([0]));

        });
    });

    /**
     * createUserBoxCandidate function tests
     */
    describe("createUserBoxCandidate", () => {
        /**
         * checks userChangeBox and erg amount is made correctly with respect to input tokens
         */
        it("checks userBox tokens and value", async () => {
            const DB = await loadBridgeDataBase("commitments");
            const boxes = new Boxes(rosenConfig, DB)
            const tokensAmount = ["100", "1", "8000", "999000"];
            const amount = "11111111111"
            const tokenId = tokens[0];
            const tokenAmount = tokensAmount[0];
            const changeTokens = new Map<string, string>();
            for (let i = 1; i < 4; i++) {
                changeTokens.set(tokens[i], tokensAmount[i]);
            }

            const userBoxCandidate = await boxes.createUserBoxCandidate(
                1,
                "",
                amount,
                wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount)),
                changeTokens,
            );

            expect(userBoxCandidate.value().as_i64().to_str()).to.be.equal(amount);
            expect(userBoxCandidate.tokens().len()).to.be.equal(4);
            const boxTokensId: Array<string> = [];
            const boxTokensAmount: Array<string> = [];
            for (let i = 0; i < 4; i++) {
                boxTokensId.push(userBoxCandidate.tokens().get(i).id().to_str());
                boxTokensAmount.push(userBoxCandidate.tokens().get(i).amount().as_i64().to_str());
            }
            expect(boxTokensId).to.be.eql(tokens);
            expect(boxTokensAmount).to.be.eql(boxTokensAmount);
        });
    });

    describe("createCommitment", () => {
        it("tests the commitment box creation", async () => {
            const DB = await loadBridgeDataBase("commitments");
            const boxes = new Boxes(rosenConfig, DB)
            const permitHash = ErgoUtils.contractHash(wasm.Contract.pay_to_address(
                wasm.Address.from_base58(permit)
            ))
            const data = boxes.createCommitment(10, WID, firstCommitment.eventId, Buffer.from(firstCommitment.commitment, 'hex'), permitHash)
            expect(BigInt(data.value().as_i64().to_str())).to.eql(BigInt(rosenConfig.minBoxValue.toString()))
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(1)
        })
    })

    describe("createTriggerEvent", () => {
        it("tests the event trigger box creation", async () => {
            const DB = await loadBridgeDataBase("commitments");
            const boxes = new Boxes(rosenConfig, DB)
            const data = boxes.createTriggerEvent(value, 10, [Buffer.from(WID), Buffer.from(WID)], firstObservation)
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(2)
        })
    })
})
