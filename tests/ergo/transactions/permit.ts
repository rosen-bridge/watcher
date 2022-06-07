import { Transaction } from "../../../src/api/Transaction";
import { strToUint8Array } from "../../../src/utils/utils";
import { assert, expect } from "chai";
import * as wasm from "ergo-lib-wasm-nodejs";

const RWTId = "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267";
export const userAddress = "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT";
export const RWTRepoAddress = "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7";

const tokens = [
    "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
    "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
    "34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2",
    "2c966d5840c8725aff53414b3e60f494d4f1b79e642c9ef806e6536ec32f77f9",
];
const rosenConfig = {
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
};

describe("Watcher Permit Transactions", () => {
    describe('createRepo', () => {
        it("checks repoBox tokens order and count", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const RWTCount = "100";
            const RSNCount = "1";
            const repoBox = await transaction.createRepo(
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

    describe("createPermitBox", () => {

        it("checks permit box registers and tokens", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const WID = strToUint8Array("4198da878b927fdd33e884d7ed399a3dbd22cf9d855ff5a103a50301e70d89fc");
            const RWTCount = "100";
            const permitBox = await transaction.createPermitBox(
                1,
                RWTCount,
                WID
            );

            expect(permitBox.value().as_i64().to_str()).to.be.equal(rosenConfig.minBoxValue);
            expect(permitBox.tokens().len()).to.be.equal(1);
            expect(permitBox.tokens().get(0).amount().as_i64().to_str()).to.be.equal(RWTCount);
            expect(permitBox.tokens().get(0).id().to_str()).to.be.equal(RWTId);
            expect(permitBox.register_value(4)?.to_coll_coll_byte().length).to.be.equal(1);
            expect(permitBox.register_value(4)?.to_coll_coll_byte()[0]).to.be.eql(WID);
            expect(permitBox.register_value(5)?.to_byte_array()).to.be.eql(new Uint8Array([0]));

        });
    });

    describe("createUserBoxCandidate", () => {
        it("checks userbox tokens and value", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const tokensAmount = ["100", "1", "8000", "999000"];
            const amount = "11111111111"
            const tokenId = tokens[0];
            const tokenAmount = tokensAmount[0];
            const changeTokens = new Map<string, string>();
            for (let i = 1; i < 4; i++) {
                changeTokens.set(tokens[i], tokensAmount[i]);
            }

            const userBoxCandidate = await transaction.createUserBoxCandidate(
                1,
                "",
                amount,
                wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount)),
                changeTokens,
            );

            expect(userBoxCandidate.value().as_i64().to_str()).to.be.equal(amount);
            expect(userBoxCandidate.tokens().len()).to.be.equal(4);
            let boxTokensId: Array<string> = [];
            let boxTokensAmount: Array<string> = [];
            for (let i = 0; i < 4; i++) {
                boxTokensId.push(userBoxCandidate.tokens().get(i).id().to_str());
                boxTokensAmount.push(userBoxCandidate.tokens().get(i).amount().as_i64().to_str());
            }
            expect(boxTokensId).to.be.eql(tokens);
            expect(boxTokensAmount).to.be.eql(boxTokensAmount);
        });
    });

    describe("checkWID", () => {
        it("checks is there any wid in the usersBoxes", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const usersHex = ["414441", "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8"];
            let users: Array<Uint8Array> = [];
            for (let user of usersHex) {
                users.push(strToUint8Array(user));
            }
            const checkWID = Promise.all(transaction.checkWID(users)).then(
                res => res.reduce((prev, curr) => prev || curr, false)
            );
            expect(await checkWID).to.be.true;
        });
    });

    describe("buildTxAndSign", () => {
        it("should sign the transaction", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const outValue = BigInt(transaction.minBoxValue.as_i64().checked_add(transaction.fee.as_i64()).to_str());
            const transactionInput = await transaction.ergoNetwork.getErgBox(
                transaction.userAddress,
                outValue,
            );
            const inputBoxes = new wasm.ErgoBoxes(transactionInput[0]);
            if (transactionInput.length > 1) {
                for (let i = 0; i < transactionInput.length; i++) {
                    inputBoxes.add(transactionInput[1]);
                }
            }

            const height = await transaction.ergoNetwork.getHeight();

            const outBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
                transaction.minBoxValue,
                transaction.userAddressContract,
                height
            );

            const outBox = outBoxBuilder.build();
            const txOutBox = new wasm.ErgoBoxCandidates(outBox);

            const boxSelector = new wasm.SimpleBoxSelector();
            const targetBalance = wasm.BoxValue.from_i64(wasm.I64.from_str(outValue.toString()));
            const boxSelection = boxSelector.select(inputBoxes, targetBalance, new wasm.Tokens());
            const builder = wasm.TxBuilder.new(
                boxSelection,
                txOutBox,
                height,
                transaction.fee,
                transaction.userAddress,
                transaction.minBoxValue,
            );

            const signedTx = await transaction.buildTxAndSign(builder, inputBoxes);
            expect(signedTx.id().to_str()).not.to.be.null;
        });
    });

    describe("getRepoBox", () => {
        it("should return repoBox(with tracking mempool)", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const repoBox = await transaction.getRepoBox();
            expect(repoBox.box_id().to_str()).to.be.equal("2420251b88745c325124fac2abb6f1d3c0f23db66dd5d561aae6767b41cb5350");
        });
    });

    describe("inputBoxesTokenMap", () => {
        it('', async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const ergoBoxes = await transaction.ergoNetwork.getBoxesByAddress("9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT");
            let map = transaction.inputBoxesTokenMap(ergoBoxes, 0);
            console.log(map)
            expect(map.get(tokens[0])).to.be.equal("1");
            expect(map.get(tokens[1])).to.be.equal("100");
            expect(map.get(tokens[2])).to.be.equal("100");
            expect(map.get(tokens[3])).to.be.equal("100");
            map = transaction.inputBoxesTokenMap(ergoBoxes, 1);
            console.log(map)
            expect(map.get(tokens[1])).to.be.equal("100");
            expect(map.get(tokens[2])).to.be.equal("100");
            expect(map.get(tokens[3])).to.be.equal("100");
        });
    });

    describe("getPermit", () => {
        it("checks get permit transaction is signed", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const secondTransaction = await Transaction.init(
                rosenConfig,
                "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                "3edc2de69487617255c53bb1baccc9c73bd6ebe67fe702644ff6d92f2362e03e"
            );

            const response = await secondTransaction.getPermit("100");
            if ("txId" in response)
                expect(response.txId).to.be.equal("e12a37d2a920e44c062ef278af174ea88acd93481428182618ed747217f00a12");
            else
                assert.throw(() => {
                }, Error, "Error")
        });
    });

    describe("returnPermit", () => {
        it("checks transaction is signed", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const res = await transaction.returnPermit("1");
            if ("txId" in res)
                expect(res.txId).to.be.equal("185ddc04cc26eab29aa6d903aaf36a6fe5e78faa58507cf618ff066d275fbfb6");
            else
                assert.throw(() => {
                }, Error, "Error")
        });
    });

    describe("watcherHasLocked", () => {
        it("should be true", async () => {
            const transaction = await Transaction.init(
                rosenConfig,
                userAddress,
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            expect(await transaction.watcherHasLocked()).to.be.true;
        });

        it("should be true", async () => {
            const secondTransaction = await Transaction.init(
                rosenConfig,
                "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                "3edc2de69487617255c53bb1baccc9c73bd6ebe67fe702644ff6d92f2362e03e"
            );
            expect(await secondTransaction.watcherHasLocked()).to.be.false;
        });
    });

});
