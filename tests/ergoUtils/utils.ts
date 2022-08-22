import { Observation } from "../../src/utils/interfaces";
import { ErgoUtils, extractBoxes } from "../../src/ergo/utils";
import { uint8ArrayToHex } from "../../src/utils/utils";
import { Config } from "../../src/config/config";
import { rosenConfig } from "../../src/config/rosenConfig";
import { boxCreationError } from "../../src/utils/errors";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";
import { Address } from "ergo-lib-wasm-nodejs";
import { initMockedAxios } from "../ergo/objects/axios";
import { loadBridgeDataBase } from "../database/bridgeDatabase";
import { Boxes } from "../../src/ergo/boxes";

import * as wasm from "ergo-lib-wasm-nodejs";
import { expect } from "chai";
import chai from "chai";
import spies from "chai-spies";

import boxesJson from "./dataset/boxes.json" assert { type: "json" }

const ergoConfig = Config.getConfig();
initMockedAxios()
chai.use(spies);

const observation: Observation = {
    fromChain: "ADA",
    toChain: "ERG",
    fromAddress: "9i1Jy713XfahaB8oFFm2T9kpM7mzT1F4dMvMZKo7rJPB3U4vNVq",
    toAddress: "9hPZKvu48kKkPAwrhDukwVxmNrTAa1vXdSsbDijXVsEEYaUt3x5",
    amount: "100000",
    bridgeFee: "2520",
    networkFee: "10000000",
    sourceChainTokenId: "a5d0d1dd7c9faad78a662b065bf053d7e9b454af446fbd50c3bb2e3ba566e164",
    targetChainTokenId: "1db2acc8c356680e21d4d06ce345b83bdf61a89e6b0475768557e06aeb24709f",
    sourceTxId: "cb459f7f8189d3524e6b7361b55baa40c34a71ec5ac506628736096c7aa66f1a",
    sourceBlockId: "7e3b6c9cf8146cf49c0b255d9a8fbeeeb76bea64345f74edc25f8dfee0473968",
    requestId: "reqId1",
}
const WID = "245341e0dda895feca93adbd2db9e643a74c50a1b3702db4c2535f23f1c72e6e"
const tokenId = "0088eb2b6745ad637112b50a4c5e389881f910ebcf802b183d6633083c2b04fc"
const userAddress = "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT";
const userSecret = wasm.SecretKey.dlog_from_bytes(Buffer.from("7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2", "hex"))
import repoObj from "./dataset/repoBox.json" assert { type: "json" }

const repoBox = JSON.stringify(repoObj)

describe("Testing ergoUtils", () => {
    describe("commitmentFromObservation", () => {
        it("should return the correct commitment", () => {
            const res = ErgoUtils.commitmentFromObservation(observation, WID)
            expect(uint8ArrayToHex(res)).to.eql("1e00562af2a1c57b7b4495286f7122c12c78fb3665381fd240e60d9ad45a53bb")
        })
    })

    describe("createChangeBox", () => {
        const boxes = wasm.ErgoBoxes.from_boxes_json(boxesJson)
        const totalValue = extractBoxes(boxes).map(box => box.value().as_i64().as_num()).reduce((a, b) => a + b, 0)
        const secret = ergoConfig.secretKey
        const txFee = parseInt(rosenConfig.fee)
        const contract = wasm.Contract.pay_to_address(secret.get_address())

        it("should not return change box all assets are spent", () => {
            const builder = new wasm.ErgoBoxCandidateBuilder(
                wasm.BoxValue.from_i64(wasm.I64.from_str(totalValue.toString())),
                contract,
                10
            )
            builder.add_token(wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str("100")))
            const res = ErgoUtils.createChangeBox(boxes, [builder.build()], 10, secret)
            expect(res).to.null
        })
        it("should return error because tokens are burning", () => {
            const outputs = [new wasm.ErgoBoxCandidateBuilder(
                wasm.BoxValue.from_i64(wasm.I64.from_str(totalValue.toString())),
                contract,
                10
            ).build()]
            expect(function () {
                ErgoUtils.createChangeBox(boxes, outputs, 10, secret)
            }).to.throw(boxCreationError)
        })
        it("should return error because output tokens are more", () => {
            const builder = new wasm.ErgoBoxCandidateBuilder(
                wasm.BoxValue.from_i64(wasm.I64.from_str(txFee.toString())),
                wasm.Contract.pay_to_address(secret.get_address()),
                10
            )
            builder.add_token(wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str("101")))
            expect(function () {
                ErgoUtils.createChangeBox(boxes, [builder.build()], 10, secret)
            }).to.throw(boxCreationError)
        })
        it("should return change box with all tokens", () => {
            const res = ErgoUtils.createChangeBox(boxes, [], 10, secret)
            expect(res).to.not.null
            expect(res?.value().as_i64().as_num()).to.eql(totalValue - txFee)
            expect(res?.tokens().get(0).amount().as_i64().as_num()).to.eql(100)
        })
        it("should return change box with some token", () => {
            const builder = new wasm.ErgoBoxCandidateBuilder(
                wasm.BoxValue.from_i64(wasm.I64.from_str(txFee.toString())),
                wasm.Contract.pay_to_address(secret.get_address()),
                10
            )
            builder.add_token(wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str("10")))
            const res = ErgoUtils.createChangeBox(boxes, [builder.build()], 10, secret)
            expect(res).to.not.null
            expect(res?.value().as_i64().as_num()).to.eql(totalValue - 2 * txFee)
            expect(res?.tokens().get(0).amount().as_i64().as_num()).to.eql(90)
        })
    })

    describe("buildTxAndSign", () => {
        /**
         * an arbitrary transaction should be signed without error
         */
        it("should sign an arbitrary transaction", async () => {
            initMockedAxios(0);
            const outValue = BigInt(rosenConfig.minBoxValue) + BigInt(rosenConfig.fee);
            const add = Address.from_base58(userAddress)
            const transactionInput = await ErgoNetwork.getErgBox(
                add,
                outValue,
            );
            const inputBoxes = new wasm.ErgoBoxes(transactionInput[0]);
            if (transactionInput.length > 1) {
                for (let i = 0; i < transactionInput.length; i++) {
                    inputBoxes.add(transactionInput[1]);
                }
            }

            const height = await ErgoNetwork.getHeight();

            const outBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
                wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.minBoxValue.toString())),
                wasm.Contract.pay_to_address(add),
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
                wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.fee.toString())),
                add,
                wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.minBoxValue.toString())),
            );

            const tx_data_inputs = wasm.ErgoBoxes.from_boxes_json([]);
            const signedTx = await ErgoUtils.buildTxAndSign(builder, userSecret, inputBoxes, tx_data_inputs);
            expect(signedTx.id().to_str()).not.to.be.null;
        });
    });

    describe("contractHash", () => {
        it("tests the contract hash creation", () => {
            const fraudAddress = "LFz5FPkW7nPVq2NA5YcZAdSTVwt2BDL1ixGkVvoU7mNY3B8PoX6ix4YiqUe9WMRPQNdPZD7BJESqWiXwvjHh2Fik3XxFz6JYJLCS5WKrgzzZeXDctKRHYydwLbxpqXjqQda7s7M6FzuZ4uCdKudW19Ku8caVcZY6kQfqb8PUiRMpRQPuqfYtcr9S2feShR3BicKV9m2upFVmjd7bzsV6sXZXdaSAuCYCCoNbSoasJ9Xxtg1NVE94d";
            const data = ErgoUtils.contractHash(wasm.Contract.pay_to_address(wasm.Address.from_base58(fraudAddress)))
            expect(data.toString("base64")).to.eql("ZKVYGZQSUzUZtgTQ6rtiZDba9hT6mOuvpBHNXw7Z7ZY=")
        })
    })

    describe("requiredCommitmentCount", () => {
        it("should return formula number as the required commitment count", async () => {
            // max commitments: 100
            // formula: 51% * 7
            const DB = await loadBridgeDataBase("commitments");
            const boxes = new Boxes(rosenConfig, DB)
            chai.spy.on(boxes, "getRepoBox", () => wasm.ErgoBox.from_json(repoBox))
            const data = await ErgoUtils.requiredCommitmentCount(boxes)
            expect(data).to.eql(BigInt(4))
        })
    })
})
