import { ErgoNetworkApi } from "../../src/bridge/network/networkApi";
import { ErgoUtils } from "../../src/ergoScanner/utils";
import { expect } from "chai";

import chai from "chai";
import spies from "chai-spies";
import sinon from "sinon"
import { rosenConfig } from "../../src/config/rosenConfig";
chai.use(spies)

import permitObj from "./dataset/permitBox.json" assert {type: "json"}

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

describe("Ergo Scanner Utils", () => {

    describe("observationsAtHeight", () => {
        const networkApi = new ErgoNetworkApi()
        chai.spy.on(networkApi, "getBlockTxs", () => ["1", "2"])
        const checkTx = sinon.stub(ErgoUtils, 'checkTx')
        checkTx.onCall(0).resolves(undefined)
        checkTx.onCall(1).resolves(undefined)
        checkTx.onCall(2).resolves(undefined)
        checkTx.onCall(3).resolves(sampleObservation)
        it("should return nothing", async () => {
            const data = await ErgoUtils.observationsAtHeight("hash", networkApi)
            expect(data).to.have.length(0)
        })
        it("should return two observations", async () => {
            const data = await ErgoUtils.observationsAtHeight("hash", networkApi)
            expect(data).to.have.length(1)
        })
    })

    describe("checkTx", () => {
        it("should return an observation", async () => {
            const data = await ErgoUtils.checkTx("hash", tx, rosenConfig.lockAddress)
            console.log(data)
        })
    })
})