import {ErgoNetworkApi} from "../../../src/commitments/network/networkApi";
import {CommitmentUtils} from "../../../src/commitments/scanner/utils";
import {expect} from "chai";

const ergoNetwork = new ErgoNetworkApi();

describe("Commitment Scanner Utils test", () => {
    describe("checkTx", () => {
        it("should be observation", async () => {
            const observation = await CommitmentUtils.checkTx(
                "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"
                , "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ["addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re"]
                , ergoNetwork
            );
            expect(observation).to.be.eql(sampleObservation);
        });
        it("should be undefined", async () => {
            const observation = await CommitmentUtils.checkTx(
                "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2"
                , "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ["addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re"]
                , ergoNetwork
            );
            expect(observation).to.be.undefined;
        });
    });
    describe("observationAtHeight", () => {
        it("first index should be undefined and second be observation", async () => {
            const observations = await CommitmentUtils.observationsAtHeight(
                "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , ergoNetwork
            );
            expect(observations.length).to.be.equal(2);
            expect(observations[0]).to.be.undefined;
            expect(observations[1]).to.be.eql(sampleObservation);
        });
    })
})