import { boxes } from "../../src/ergoUtils/boxes";
import { expect } from "chai";
import * as wasm from "ergo-lib-wasm-nodejs";
import { firstCommitment } from "../commitment/models/commitmentModel";
import { contractHash } from "../../src/ergoUtils/ergoUtils";

const chai = require("chai")
const spies = require("chai-spies")
chai.use(spies);

const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"
const tokenId = "469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db"
const permit = "EE7687i4URb4YuSGSQXPCb6iAFxAd5s8H1DLbUFQnSrJ8rED2KXdq8kUPQZ3pcPVFD97wQ32PATufWyvyhvit6sokNfLUNqp8wirq6L4H1WQSxYyL6gX7TeLTF2fRwqCvFDkcN6Z5StykpvKT4GrC9wa8DAu8nFre6VAnxMzE5DG3AVxir1pEWEKoLohsRCmKXGJu9jw58R1tE6Ff1LqqiaXbaAgkiyma9PA2Ktv41W6GutPKCmqSE6QzheE2i5c9uuUDRw3fr1kWefphpZVSmuCqNjuVU9fV73dtZE7jhHoXgTFRtHmGJS27DrHL9VvLyo7AP6bSgr4mAoYdF8UPTmcu4fFsMGFFJahLXm7V1qeqtsBXXEvRqQYEaSbMNRVmSZAe6jPhLVyqTBF9rLbYTCCjQXA6u7fu7JHn9xULHxsEjYdRuciVnnsk7RT5dDMM7YCC2yxnE7X8mZMekwceG3dj2triNPo7N6NbxNVSyw1jxaHJGHEza5PgUcieMqMvZyixuiu6PqA55GRCoCRek2pBcATifcyB2FJqtj"

describe("Testing Box Creation", () => {
    const value = BigInt(10000000)
    describe("createPermit", () => {
        it("tests the permit box creation", () => {
            const data = boxes.createPermit(value, 10, BigInt(9), WID)
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
            const data = boxes.createCommitment(value, 10, WID, firstCommitment.eventId, Buffer.from(firstCommitment.commitment, 'hex'), permitHash)
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(1)
        })
    })

    describe("createPayment", () => {
        it("tests the payment creation", () => {
            const token = new wasm.Token(wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str("5")))
            const data = boxes.createPayment(value, 10, [token])
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(5)
            expect(data.tokens().get(0).id().to_str()).to.eq(tokenId)
        })
    })
})
