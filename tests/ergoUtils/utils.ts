import {Observation} from "../../src/objects/interfaces";
import {commitmentFromObservation} from "../../src/ergoUtils/utils";
import * as wasm from "ergo-lib-wasm-nodejs";
import {expect} from "chai";

const observation: Observation = {
    fromChain: "ADA",
    toChain: "ERG",
    fromAddress: "ErgoAddress",
    toAddress: "cardanoAddress",
    amount: "100000",
    fee: "2520",
    sourceChainTokenId: "c185f29d4fc84b70a72d1b3235dad09f7c81b029dad7c5fb58577dfa26b22d41",
    targetChainTokenId: "d4b43a3f2b43498b258cbcd17786bf504ab08279962bef3f5de672106b06716e",
    sourceTxId: "1260867c6b0010a680f7d1a6593bdf1702949257bfe19c958bc5268752187d29",
    sourceBlockId: "7d3b083ea32eb2cd1680816792dc45e34d92ccec68a79dd7c11de436c2be216e",
    requestId: "reqId1",
}
const WID = "da0f9e9d44491eafbf385a880fd7ce75f4b49c705b423e07e72e369cd18e151f"

describe("commitmentFromObservation", () => {
    it("should return the correct commitment", () => {
        const res = commitmentFromObservation(observation, WID)
        console.log(res)
        expect(wasm.Constant.from_byte_array(res).encode_to_base16()).to.eql("08a40967ea0d2712416b82c92bdcb65113c02840b4900614c9dcb7d3e1df7872")
    })
})