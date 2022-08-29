import { Transaction } from "../../../src/api/Transaction";
import { hexStrToUint8Array } from "../../../src/utils/utils";
import { expect } from "chai";
import { initMockedAxios } from "../objects/axios";
import { Boxes } from "../../../src/ergo/boxes";
import * as wasm from "ergo-lib-wasm-nodejs";
import { boxesSample } from "../dataset/BoxesSample";

import chai from "chai";
import spies from "chai-spies";
import { Buffer } from "buffer";
import { WatcherDataBase } from "../../../src/database/models/watcherModel";
import { mockedResponseBody } from "../objects/mockedResponseBody";
import { loadDataBase } from "../../database/watcherDatabase";

chai.use(spies);


export const userAddress = "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT";
export const RWTRepoAddress = "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7";

export const tokens = [
    "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
    "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
    "34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2",
    "2c966d5840c8725aff53414b3e60f494d4f1b79e642c9ef806e6536ec32f77f9",
];
export const rosenConfig = {
    RSN: "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
    minBoxValue: "1100000",
    fee: "1100000",
    guardNFT: "a6ac381e6fa99929fd1477b3ba9499790a775e91d4c14c5aa86e9a118dfac853",
    cleanupNFT: "ac0c16cee8caefd0814c5568a9d50bea51fec88e8abbd3ac8347b94d054a1b65",
    cleanupConfirm: 0,
    watcherPermitAddress: "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B",
    RWTRepoAddress: "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7",
    fraudAddress: "LFz5FPkW7nPVq2NA5Ycb8gu5kAnbT4HuaiK2XJtJi1hZCL4ZtPaXqJZkhonpoVLW34mTrqwMCeW96tt7nyK5XTu6QmUAD9T22mLYa6opX3WdM1wpJC5ofhDUym8N4AB2Y7FnJ9ku512wGU8GJZ5xVgMQ3G5oHJJTQ1uBd72RphnWbfHUVjF49h2jgz4H9gBZQ8wFwZizTFjVh3CnMs76HP9mnnN4ngysoGzEZJqd2BREmGxPdPvBw",
    eventTriggerAddress: "LkY4RECaMvZiFwMrxpzB4uTr1ZqrKGFkZ5mUnoMPw7LEB5crVok7VueBVTS2NCMt5TYSaHRDiHnTezgGQvKcBMJUawkQEpGZWp87nLHHbaG3VaxxeQK94fxAj2zSzSU2svzA6DPrKR7JL4LZPLaW98cWBwk1YWQTqjWebTgvPkMvqYKsGgjn8Zk6uxEiXvRLzfDvGutVAmNRzcXwU9NjdBKSJrfpWFoFLMDY3chG2gcCSYiYjnqYW1sQNEcnDPJscNbcoFYEonUojtZ6m1zjwvWHXcH5UpKk9SEmxemgi7x1ezKnYJupbHsaiGEJEhtcAUWmMCSJH5iRQZQbKAud5qYDM7VX3MAqaAv9wB6uRaGKuoKShyzP",
    commitmentAddress: "EurZwDoNU1Y6ZDtRgb2ufgAGAnJ4oNyiFvr7VyoJeKW9r1W7NbbitXDiqMNzAh8vQRATLiFRXra42mHBogMxySorHXF4hwKcPNasRPBfwcEMbRMTp8Xo1gur26V561z8wit9BE8nvRztDstzKdMkXLwjh1GGpXuFHV8GKo5Sz4d2Rb4W7QiqbFbFdRVe3TRqmv7yy2VvF9kWhRr5xTLkmxAUpEmYQwVVLmdU52XyahV7Hnw15DY3faHne4SkYtMMKSH5rvtXFUNf7UDeU8U2mjmt8oZYpprCi2ZouQNcLrDXT9i6hJ3jcmwhMfF1whQjZRNooFvcM59bmnvG3U1dJupdVpjTqXwwmGT9BkJFnX2eWjmNQ2EEfpSyUPMf5mpXBp8484u7ibjfobHpe3Jw9bHGe5nqtuLdEVKt7pe5pp5Lpv8Lqw1h8kopx9kHGKfZrVoQCsJRjHGpGZEnFgqtk4p58mLvn1y86HQwfkMBcfeRiy1qimmwbaTrn4tHbz1WJ481z8H8VxSTrrsWSpDZf4CJaRzh6mmqMTw2SxgN3vsxxAyb21yVazMryAtPAr12hjBAVf2MTuZ8QTQp68VHHZg7ePXaitbS6qkV16T9cTbkYyCWqahQbq7LLp3xMQXywZa9XpnRvFEboLtQJjNBvLtTT1UV4N2Hqw3h8qHq1DFqd4dzkj9ycaazTMiDe67mq5avy3zmgjzXUZdTxPKHkxWJCSccwnp7d2wJU3gCfF7k3Z81ui6XBMh6pzgND2U2rGzpF3aUE5LftZMhkQ5d5dg7JHnBQ62jLj2UF",
    lockAddress: "9iLfrEVYMEXeqt9tTJn2X4Mmp2QfaQuCeBwgdxpmNoZvaErgj2o",
    RWTId: "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267"
}
export const secret1 = wasm.SecretKey.dlog_from_bytes(Buffer.from("7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2", "hex"))
const secret2 = wasm.SecretKey.dlog_from_bytes(Buffer.from("3edc2de69487617255c53bb1baccc9c73bd6ebe67fe702644ff6d92f2362e03e", "hex"))
const secret3 = wasm.SecretKey.dlog_from_bytes(Buffer.from("1111111111111111111111111111111111111111111111111111111111111111", "hex"))

initMockedAxios();

/**
 * requirements: an object of Transaction class, rosenConfig, userAddress, userSecret
 */
describe("Watcher Permit Transactions", () => {
    let DB: WatcherDataBase, boxes: Boxes
    before(async () => {
        DB = await loadDataBase("permit");
        boxes = new Boxes(rosenConfig, DB)
    })

    afterEach(() => {
        chai.spy.restore(boxes)
    })

    /**
     * getWID functions tests
     */
    describe("getWID", () => {
        /**
         * it checks that functions find the user WID correctly
         */
        it("checks is there any wid in the usersBoxes", async () => {
            const sampleWID = "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8";
            const transaction = new Transaction(
                rosenConfig,
                userAddress,
                secret1,
                boxes
            );
            const usersHex = ["414441", sampleWID];
            const users: Array<Uint8Array> = [];
            for (const user of usersHex) {
                users.push(hexStrToUint8Array(user));
            }
            const WID = await transaction.getWID(users);
            expect(WID).to.be.equal(sampleWID);
        });
    });

    /**
     * inputBoxesTokenMap function tests
     */
    describe("inputBoxesTokenMap", () => {
        /**
         * the token map of input and output should be the same
         */
        it('the token map of input and output should be the same', async () => {
            const transaction = new Transaction(
                rosenConfig,
                userAddress,
                secret1,
                boxes
            );
            const ergoBoxes = wasm.ErgoBoxes.from_boxes_json([]);
            JSON.parse(mockedResponseBody.watcherUnspentBoxes).items.forEach((box: JSON) => {
                const ergoBox = wasm.ErgoBox.from_json(JSON.stringify(box))
                ergoBoxes.add(ergoBox)
            });
            let map = transaction.inputBoxesTokenMap(ergoBoxes, 0);
            expect(map.get(tokens[0])).to.be.equal("1");
            expect(map.get(tokens[1])).to.be.equal("100");
            expect(map.get(tokens[2])).to.be.equal("100");
            expect(map.get(tokens[3])).to.be.equal("100");
            map = transaction.inputBoxesTokenMap(ergoBoxes, 1);
            expect(map.get(tokens[1])).to.be.equal("100");
            expect(map.get(tokens[2])).to.be.equal("100");
            expect(map.get(tokens[3])).to.be.equal("100");
        });
    });

    /**
     * getPermit function tests
     */
    describe("getPermit", () => {
        /**
         * checks getPermit with correct inputs and state should be signed
         */
        it("checks get permit transaction is signed", async () => {
            initMockedAxios(0);
            chai.spy.on(boxes, "getRepoBox", () => {
                return wasm.ErgoBox.from_json(boxesSample.secondRepoBox)
            })
            const secondTransaction = new Transaction(
                rosenConfig,
                "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                secret2,
                boxes
            );
            const response = await secondTransaction.getPermit(100n);
            expect(response.response).to.be.equal("a748aa172d5d8c8fc70d8c20f59f643fe7adcadc9c8d5fd64cb46a2399cf11a8");
        });

        /**
         * in the case of watcher have permit box in his/her address the getPermit should returns error
         */
        it("tests that if watcher have permit box should returns error", async () => {
            const transaction = new Transaction(
                rosenConfig,
                userAddress,
                secret1,
                boxes
            );
            const res = await transaction.getPermit(100n);
            expect(res.status).to.be.equal(500)
        });
    });

    /**
     * returnPermit function tests
     */
    describe("returnPermit", () => {
        /**
         * it checks if the state of the watcher permit and input is correct the transaction
         *  should be signed without error
         */
        it("checks transaction is signed", async () => {
            initMockedAxios(0);
            chai.spy.on(boxes, "getPermits", () => {
                return [
                    wasm.ErgoBox.from_json(boxesSample.firstWatcherPermitBox),
                ]
            })
            chai.spy.on(boxes, "getRepoBox", () => {
                return wasm.ErgoBox.from_json(boxesSample.secondRepoBox)
            })
            const transaction = new Transaction(
                rosenConfig,
                userAddress,
                secret1,
                boxes
            );
            const res = await transaction.returnPermit(1n);
            expect(res.response).to.be.equal("185ddc04cc26eab29aa6d903aaf36a6fe5e78faa58507cf618ff066d275fbfb6");
        });

        /**
         * it checks case that the return permit transaction have permit box in its output
         */
        it("it checks case that the return permit transaction have permit box in its output", async () => {
            initMockedAxios(1);
            chai.spy.on(boxes, "getPermits", () => {
                return [
                    wasm.ErgoBox.from_json(boxesSample.firstPermitBox)
                ]
            })
            chai.spy.on(boxes, "getRepoBox", () => {
                return wasm.ErgoBox.from_json(boxesSample.thirdRepoBox)
            })
            const transaction = new Transaction(
                rosenConfig,
                "9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9",
                secret3,
                boxes
            );
            const res = await transaction.returnPermit(1n);
            expect(res.response).to.be.equal("f734636700c599306c964709bb920776c5f180579046c704110fbf6cf57f40fe")
        });

        /**
         * tests that if watcher doesn't have permit box should returns error
         */
        it("tests that if watcher doesn't have permit box should returns error", async () => {
            initMockedAxios();
            chai.spy.on(boxes, "getPermits", () => {
                return [
                    wasm.ErgoBox.from_json(boxesSample.firstWatcherPermitBox),
                ]
            })
            chai.spy.on(boxes, "getRepoBox", () => {
                return wasm.ErgoBox.from_json(boxesSample.secondRepoBox)
            })
            const secondTransaction = new Transaction(
                rosenConfig,
                "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                secret2,
                boxes
            );
            const res = await secondTransaction.returnPermit(1n);
            expect(res.status).to.be.equal(500)
        });
    });

    /**
     * getWatcherState function tests
     */
    describe("getWatcherState", () => {
        /**
         * the watcher state with this mocked input should be true(have permitBox)
         */
        it("should be true", async () => {
            initMockedAxios();
            const transaction = new Transaction(
                rosenConfig,
                userAddress,
                secret1,
                boxes
            );
            await transaction.getWatcherState();
            expect(transaction.watcherPermitState).to.be.true;
        });

        /**
         * the watcher state with this mocked input should be false(no permitBox)
         */
        it("should be false", async () => {
            initMockedAxios();
            const secondTransaction = new Transaction(
                rosenConfig,
                "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                secret2,
                boxes
            );
            await secondTransaction.getWatcherState();
            expect(secondTransaction.watcherPermitState).to.be.false;
        });
    });

});
