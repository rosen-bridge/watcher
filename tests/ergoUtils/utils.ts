import { Observation } from "../../src/objects/interfaces";
import { commitmentFromObservation } from "../../src/ergoUtils/ergoUtils";
import { expect } from "chai";
import { toHexString } from "../../src/utils/utils";

const observation: Observation = {
    fromChain: "ADA",
    toChain: "ERG",
    fromAddress: "9i1Jy713XfahaB8oFFm2T9kpM7mzT1F4dMvMZKo7rJPB3U4vNVq",
    toAddress: "9hPZKvu48kKkPAwrhDukwVxmNrTAa1vXdSsbDijXVsEEYaUt3x5",
    amount: "100000",
    fee: "2520",
    sourceChainTokenId: "a5d0d1dd7c9faad78a662b065bf053d7e9b454af446fbd50c3bb2e3ba566e164",
    targetChainTokenId: "1db2acc8c356680e21d4d06ce345b83bdf61a89e6b0475768557e06aeb24709f",
    sourceTxId: "cb459f7f8189d3524e6b7361b55baa40c34a71ec5ac506628736096c7aa66f1a",
    sourceBlockId: "7e3b6c9cf8146cf49c0b255d9a8fbeeeb76bea64345f74edc25f8dfee0473968",
    requestId: "reqId1",
}
const WID = "245341e0dda895feca93adbd2db9e643a74c50a1b3702db4c2535f23f1c72e6e"

describe("commitmentFromObservation", () => {
    it("should return the correct commitment", () => {
        const res = commitmentFromObservation(observation, WID)
        expect(toHexString(res)).to.eql("e53f94b874427ddc736f0fd2e71bb0c7bff4dc18e8a07a1d9b2f84960ca97ccf")
    })
})