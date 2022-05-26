import { expect } from "chai";
import { CardanoUtils } from "../../../src/cardano/scanner/utils";
import { KoiosNetwork } from "../../../src/cardano/network/koios";

describe("Cardano Scanner Utils test", () => {
    const sampleObservation = {
        fromChain: 'CARDANO',
        toChain: 'ERGO',
        fee: '10000',
        amount: '10',
        sourceChainTokenId: 'asset12y0ewmxggeglymjpmp9mjf5qzh4kgwj9chtkpv',
        targetChainTokenId: 'cardanoTokenId',
        sourceTxId: 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa',
        sourceBlockId: '93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3',
        requestId: 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa',
        toAddress: 'ergoAddress',
        fromAddress: 'cardanoAddress',
    };
    describe("isRosenData", () => {
        it("should be Rosen Data", () => {
            const validData = {
                "to": "ERGO",
                "fee": "10000",
                "from": "CARDANO",
                "toAddress": "ergoAddress",
                "fromAddress": "cardanoAddress",
                "targetChainTokenId": "cardanoTokenId",
            };
            expect(CardanoUtils.isRosenData(validData)).to.be.true;
        });
        it("should not be Rosen Data", () => {
            const invalidData = {
                "to": "ERGO",
                "fee": "10000",
                "from": "CARDANO",
            };
            expect(CardanoUtils.isRosenData(invalidData)).to.be.false;
        });
    });
    describe("isRosenMetaData", () => {
        it("should be RosenMetaData", () => {
            const validMetaData = {
                0: {}
            }
            expect(CardanoUtils.isRosenMetaData(validMetaData)).to.be.true;
        });
        it("should not be RosenMetaData", () => {
            const validMetaData = {
                1: {}
            }
            expect(CardanoUtils.isRosenMetaData(validMetaData)).to.be.false;
        });
    });
    describe("checkTx", () => {
        it("should be observation", async () => {
            const koiosNetwork = new KoiosNetwork();
            const observation = await CardanoUtils.checkTx(
                "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"
                , "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ["addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re"]
                , koiosNetwork
            );
            console.log(observation)
            expect(observation).to.be.eql(sampleObservation);
        });
        it("should be undefined", async () => {
            const koiosNetwork = new KoiosNetwork();
            const observation = await CardanoUtils.checkTx(
                "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2"
                , "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ["addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re"]
                , koiosNetwork
            );
            expect(observation).to.be.undefined;
        });
    });
    describe("observationAtHeight", () => {
        const koiosNetwork = new KoiosNetwork();
        it("first index should be undefined and second be observation", async () => {
            const observations = await CardanoUtils.observationsAtHeight(
                "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , koiosNetwork
            );
            expect(observations.length).to.be.equal(1);
            expect(observations[0]).to.be.eql(sampleObservation);
        });
    })
});
