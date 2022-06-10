import { boxes } from "../../src/ergoUtils/boxes";
import { expect } from "chai";
import { AddressCache, contracts } from "../../src/contracts/contracts";
import * as wasm from "ergo-lib-wasm-nodejs";
import { firstCommitment } from "../commitment/models/commitmentModel";
import { contractHash } from "../../src/ergoUtils/ergoUtils";
import { Buffer } from "buffer";
import { firstObservations } from "../cardano/models/models";

const chai = require("chai")
const spies = require("chai-spies")
chai.use(spies);
const sinon = require("sinon")

const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"
const tokenId = "469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db"
const fraud = "LFz5FPkW7nPVq2NA5YcZAdSTVwt2BDL1ixGkVvoU7mNY3B8PoX6ix4YiqUe9WMRPQNdPZD7BJESqWiXwvjHh2Fik3XxFz6JYJLCS5WKrgzzZeXDctKRHYydwLbxpqXjqQda7s7M6FzuZ4uCdKudW19Ku8caVcZY6kQfqb8PUiRMpRQPuqfYtcr9S2feShR3BicKV9m2upFVmjd7bzsV6sXZXdaSAuCYCCoNbSoasJ9Xxtg1NVE94d"
const eventTrigger = "AqSsZJHMRjLRQqq7tRYgUCZXt9cucMxxCHJXKNeNjAGEp9JoZhh76PH8pPfiStAHGT4Lt8vQrXEKgoctRLfauznTU5qwPdWuqqiKmJ6jEhNTH49EQFQPMGPqQwsCoAnkZJMWhYpS9Vfo2rQbkxjjbVkEWdWo951qv6UU94qKRwDk1SUeREMYXMKNxp6N4tQ9aMWgVuEDZQ2ib4tnpVTemJFJr262Cyj9kYevSXQYBhHsqem7KCs1RbNA51Hkns27R5zDiMKdkkcFvuMyrDh1XR9HxJiJMcmcm1rtRYY1rZAbGtemHdap1ep4YhXL2bTXYKEvWz4tBBtKxUokDRB9M7UWqR2WqWuZS3BY4xX9ZwUKGTKWUVCV5bhogme"
const commitment = "EurZwDoNSoArWF8g9PowbdoP7AW76eXBSehmRkiMpkUr9qqzudgHC1EDM24okXPhccNvA956sJm5Fm6b39iaAgNBWc44gjNEEQygeamL5yyhp8PJAQHtzRwNA6t514zwvi2an8oXmMwUTTjgh7bDPm4tURiCvU5LgkgMcacgtD99W8uNQF3bSaZjrmjqDHGjNJsQVUFQb49DjqujSfNEFFjfhNWGfhdkHEHmYhppnuFdGQ5kfKps1WpcYkDcvKLXAo6dVpiGMUaqYnEGAkKCk2Px9owZPy9RH7xniZ6mZ2bW8qyYpxYRbUasWLWR7LMjBBENUAtJeoFgmTzgEA8JFvcziT3qWFyz7YFgaAf5vzdhWUg8nGtt1PeW18VEKQiagaftc8vHspocA8ZGYbqBV5Gj8P8VthNdACxgPBCvgZSxoz8kQpC29vZNVvydNZbXQ8wVhcrXbsEkWsB8jVbvbkhUcdEhEesumzFHpcQzWPZ4fKJyEGb6aUxzw1PpW3Gxk36NsZxK7ibdXeBgN1KSxFAmZD3r739Gusbh7tWjeYQ8xL3SxWaafLzCwKHc5tjGZ4cj7S1gVN9ATCoC5uq7YKqSQp9pUwJwigSbvTVoeL8hboS1CfDPuV9b1Xj4VXfjbPpB1UXuULa5Ns5KVYEf6LYHoUu1nf2YJDgZJzHUYx2ANtzH7sv9zM1RbYKXoH6yXPh37RbpoShsDkBCxkj2Esz6LNDS4EWoVny39q9r5bkDZpuRLFavt41ixpNfink5eE7EfFYLTDBDgCxpyvFyqXEnndDnnaoaLmfzq"
const permit = "EE7687i4URb4YuSGSQXPCb6iAFxAd5s8H1DLbUFQnSrJ8rED2KXdq8kUPQZ3pcPVFD97wQ32PATufWyvyhvit6sokNfLUNqp8wirq6L4H1WQSxYyL6gX7TeLTF2fRwqCvFDkcN6Z5StykpvKT4GrC9wa8DAu8nFre6VAnxMzE5DG3AVxir1pEWEKoLohsRCmKXGJu9jw58R1tE6Ff1LqqiaXbaAgkiyma9PA2Ktv41W6GutPKCmqSE6QzheE2i5c9uuUDRw3fr1kWefphpZVSmuCqNjuVU9fV73dtZE7jhHoXgTFRtHmGJS27DrHL9VvLyo7AP6bSgr4mAoYdF8UPTmcu4fFsMGFFJahLXm7V1qeqtsBXXEvRqQYEaSbMNRVmSZAe6jPhLVyqTBF9rLbYTCCjQXA6u7fu7JHn9xULHxsEjYdRuciVnnsk7RT5dDMM7YCC2yxnE7X8mZMekwceG3dj2triNPo7N6NbxNVSyw1jxaHJGHEza5PgUcieMqMvZyixuiu6PqA55GRCoCRek2pBcATifcyB2FJqtj"

export const cache: AddressCache = {
    fraud: fraud,
    eventTrigger: eventTrigger,
    eventTriggerContract: wasm.Contract.pay_to_address(wasm.Address.from_base58(eventTrigger)),
    commitment: commitment,
    commitmentContract: wasm.Contract.pay_to_address(wasm.Address.from_base58(commitment)),
    permit: permit,
    permitContract: wasm.Contract.pay_to_address(wasm.Address.from_base58(permit))
}

describe("Testing Box Creation", () => {
    const value = BigInt(10000000)
    sinon.stub(contracts, 'addressCache').value(cache)
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
            const permitHash = contractHash(cache.permitContract!)
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

    describe("createTriggerEvent", () => {
        it("tests the event trigger box creation", () => {
            const data = boxes.createTriggerEvent(value, 10, [Buffer.from(WID), Buffer.from(WID)], firstObservations[0])
            expect(BigInt(data.value().as_i64().to_str())).to.eql(value)
            expect(data.tokens().len()).to.eq(1)
            expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(2)
        })
    })
})
