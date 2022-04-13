import { expect } from "chai";
import { CardanoUtils } from "../../src/scanner/utils";
import { anyString, spy, when } from "ts-mockito";

describe("Cardano Scanner Utils test", () => {
    describe("observationsAtHeight", () => {
        const spiedCardanoUtils = spy(CardanoUtils);
        //TODO:should completed later according to TX interface
        when(spiedCardanoUtils.txHashToData(anyString())).thenReturn({mock: "anything"});
        // it("get the last block offset=0 and limit=1", async () => {
        //     const data = await CardanoUtils.observationsAtHeight(
        //         "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6"
        //     );
        //     expect(data).to.be.instanceof(Array);
        //     expect(data.length).to.equal(8);
        // });
    });
});
