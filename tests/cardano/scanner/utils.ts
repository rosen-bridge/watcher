import { expect } from "chai";
import { CardanoUtils } from "../../../src/cardano/scanner/utils";
import { KoiosNetwork } from "../../../src/cardano/network/koios";
import tokens from '../../../src/config/tokens.mock.json' assert { type: "json" };
import sampleTokens from './tokensSample.json' assert { type: "json" };

describe("Cardano Scanner Utils test", () => {
    const sampleObservation = {
        fromChain: 'Cardano',
        toChain: 'ERGO',
        bridgeFee: '10000',
        networkFee: '10000',
        amount: '10',
        sourceChainTokenId: 'asset111111111111111111111111111111111111111',
        targetChainTokenId: 'cardanoTokenId',
        sourceTxId: 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa',
        sourceBlockId: '93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3',
        requestId: 'ef39120020ff2cfd9e69a4d32349463170ac76baf5002914e9989478c9456798',
        toAddress: 'ergoAddress',
        fromAddress: 'addr_test1vzg07d2qp3xje0w77f982zkhqey50gjxrsdqh89yx8r7nasu97hr0',
    };
    describe("isRosenData", () => {
        it("should be Rosen Data", () => {
            const cardanoUtils = new CardanoUtils(tokens);
            const validData = {
                "to": "ERGO",
                "bridgeFee": "10000",
                "networkFee": "100",
                "toAddress": "ergoAddress",
                "targetChainTokenId": "cardanoTokenId",
            };
            expect(cardanoUtils.isRosenData(validData)).to.be.true;
        });
        it("should not be Rosen Data", () => {
            const cardanoUtils = new CardanoUtils(tokens);
            const invalidData = {
                "to": "ERGO",
                "bridgeFee": "10000",
                "networkFee": "100",
            };
            expect(cardanoUtils.isRosenData(invalidData)).to.be.false;
        });
    });
    describe("isRosenMetaData", () => {
        it("should be RosenMetaData", () => {
            const cardanoUtils = new CardanoUtils(tokens);
            const validMetaData = {
                0: {}
            }
            expect(cardanoUtils.isRosenMetaData(validMetaData)).to.be.true;
        });
        it("should not be RosenMetaData", () => {
            const cardanoUtils = new CardanoUtils(tokens);
            const validMetaData = {
                1: {}
            }
            expect(cardanoUtils.isRosenMetaData(validMetaData)).to.be.false;
        });
    });
    describe("checkTx", () => {
        it("should be observation", async () => {
            const cardanoUtils = new CardanoUtils(tokens);
            const koiosNetwork = new KoiosNetwork();
            const observation = await cardanoUtils.checkTx(
                "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"
                , "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ["addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re"]
                , koiosNetwork
            );
            expect(observation).to.be.eql(sampleObservation);
        });
        it("should be undefined", async () => {
            const cardanoUtils = new CardanoUtils(tokens);
            const koiosNetwork = new KoiosNetwork();
            const observation = await cardanoUtils.checkTx(
                "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2"
                , "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ["addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re"]
                , koiosNetwork
            );
            expect(observation).to.be.undefined;
        });
        it("in case of tokens not exist in the bridge", async () => {
            const cardanoUtils = new CardanoUtils(sampleTokens);
            const koiosNetwork = new KoiosNetwork();
            const observation = await cardanoUtils.checkTx(
                "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"
                , "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ["addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re"]
                , koiosNetwork
            );
            expect(observation).to.be.undefined;
        });
    });
    describe("observationAtHeight", () => {
        const cardanoUtils = new CardanoUtils(tokens);
        const koiosNetwork = new KoiosNetwork();
        it("first index should be undefined and second be observation", async () => {
            const observations = await cardanoUtils.observationsAtHeight(
                "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , koiosNetwork
            );
            expect(observations.length).to.be.equal(1);
            expect(observations[0]).to.be.eql(sampleObservation);
        });
    })
});
