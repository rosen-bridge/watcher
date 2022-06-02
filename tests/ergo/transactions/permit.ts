import { rosenConfig } from "../../../src/api/rosenConfig";
import { Transaction } from "../../../src/api/Transaction";
import { strToUint8Array } from "../../../src/utils/utils";
import { expect } from "chai";
import * as wasm from "ergo-lib-wasm-nodejs";
import { initConfig } from "../../../config/config";

const config = initConfig();

describe("Watcher Permit Transactions", async () => {
    const tokens = [
        "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
        "00ac861f0a121f86691ad3d0e928604e3dc77c1f37e71099218dcb162667911b",
        "002b4ebc5e0eb147fa95a0c10cc9e44d0e6464fd51864be5ae4f1b86174b465d",
        "00419c7bdd23e71c14f6ff1e1180a5899a7be0e13f6aa6000cb2eeb514930df7",
    ];
    const transaction = await Transaction.init(
        rosenConfig,
        "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
        "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
    );

    describe('createRepo', () => {
        it("checks repoBox tokens order and count", async () => {
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
            expect(permitBox.tokens().get(0).id().to_str()).to.be.equal(config.RWTId);
            expect(permitBox.register_value(4)?.to_coll_coll_byte().length).to.be.equal(1);
            expect(permitBox.register_value(4)?.to_coll_coll_byte()[0]).to.be.eql(WID);
            expect(permitBox.register_value(5)?.to_byte_array()).to.be.eql(new Uint8Array([0]));

        });
    });

    describe("createUserBoxCandidate", () => {
        it("checks userbox tokens and value", async () => {
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
        it("should return repoBox", async () => {
            const repoBox = await transaction.getRepoBox();
            expect(repoBox.box_id().to_str()).to.be.equal("2420251b88745c325124fac2abb6f1d3c0f23db66dd5d561aae6767b41cb5350");
        });
    });

    describe("inputBoxesTokenMap", () => {
        it('', async () => {
            const ergoBoxes = await transaction.ergoNetwork.getBoxesByAddress("9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT");
            let map = transaction.inputBoxesTokenMap(ergoBoxes, 0);
            expect(map.get(tokens[0])).to.be.equal("1");
            expect(map.get(tokens[1])).to.be.equal("100");
            expect(map.get(tokens[2])).to.be.equal("100");
            expect(map.get(tokens[3])).to.be.equal("100");
            map = transaction.inputBoxesTokenMap(ergoBoxes, 1);
            expect(map.get(tokens[0])).to.be.equal("100");
            expect(map.get(tokens[1])).to.be.equal("100");
            expect(map.get(tokens[2])).to.be.equal("100");
        });
    });

    describe("getPermit", () => {
        it("", async () => {
            const secondTransaction = await Transaction.init(
                rosenConfig,
                "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                "3edc2de69487617255c53bb1baccc9c73bd6ebe67fe702644ff6d92f2362e03e"
            );

            const txId = await secondTransaction.getPermit("100");
            expect(txId).to.be.equal("07c24d1092044f6ce60396c21ca7e43c52434153a4dfbedbfe005e8952362f34");

        });
    });

    describe("returnPermit", () => {
        it("", async () => {
            const txId = await transaction.returnPermit("100");
            expect(txId).to.be.equal("f956bd5ce3e52b37fa4a207245fc4ac790dbdf84436c3d1540c3983f01053ecb");
        });
    });

    describe("watcherHasLocked", () => {
        it("should be true", async () => {
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
