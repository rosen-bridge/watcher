import { ErgoNetworkApi } from "../../src/bridge/network/networkApi";
import { ErgoUtils } from "../../src/ergoScanner/utils";
import { NodeTransaction } from "../../src/bridge/network/ergoApiModels";
import { Observation } from "../../src/objects/interfaces";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";

import * as wasm from "ergo-lib-wasm-nodejs";
import { expect } from "chai";
import chai from "chai";
import spies from "chai-spies";
import sinon from "sinon"
chai.use(spies)

import tx from "./dataset/tx.json" assert {type: "json"}
import observationTx from "./dataset/observationTx.json" assert {type: "json"}
import box from "./dataset/box.json" assert {type: "json"}

const sampleObservation: Observation = {
    fromChain: 'CARDANO',
    toChain: 'ERGO',
    networkFee: '10000',
    bridgeFee: '10000',
    amount: '10',
    sourceChainTokenId: 'asset12y0ewmxggeglymjpmp9mjf5qzh4kgwj9chtkpv',
    targetChainTokenId: 'cardanoTokenId',
    sourceTxId: 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa',
    sourceBlockId: '93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3',
    requestId: 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa',
    toAddress: 'ergoAddress',
    fromAddress: 'cardanoAddress',
};
const lockAddress = "2CBjjwbY9Rokj7Ue9qT2pbMR2WhLDmdcL2V9pRgCEEMks9QRXiQ7K73wNANLAczY1XLimkNBu6Nt3hW1zACrk4zQxu"

describe("Ergo Scanner Utils", () => {

    describe("observationsAtHeight", () => {
        const networkApi = new ErgoNetworkApi()
        chai.spy.on(networkApi, "getBlockTxs", () => ["1", "2"])
        it("should return nothing", async () => {
            const checkTx = sinon.stub(ErgoUtils, 'checkTx')
            checkTx.onCall(0).resolves(undefined)
            checkTx.onCall(1).resolves(undefined)
            const data = await ErgoUtils.observationsAtHeight("hash", networkApi)
            expect(data).to.have.length(0)
            sinon.restore()
        })
        it("should return two observations", async () => {
            const checkTx = sinon.stub(ErgoUtils, 'checkTx')
            checkTx.onCall(0).resolves(undefined)
            checkTx.onCall(1).resolves(sampleObservation)
            const data = await ErgoUtils.observationsAtHeight("hash", networkApi)
            expect(data).to.have.length(1)
            sinon.restore()
        })
    })

    describe("checkTx", () => {
        it("should return undefined", async () => {
            const data = await ErgoUtils.checkTx("hash", <NodeTransaction><unknown>tx, lockAddress)
            expect(data).to.be.undefined
        })
        it("should return an observation from the transaction data", async () => {
            chai.spy.on(ErgoNetwork, "boxById", () => wasm.ErgoBox.from_json(JSON.stringify(box)))
            const data = await ErgoUtils.checkTx("hash", <NodeTransaction><unknown>observationTx, lockAddress)
            expect(data).to.not.be.undefined
            expect(data?.amount).to.eql("4")
            expect(data?.sourceChainTokenId).to.eql("4444444444444444444444444444444444444444444444444444444444444444")
            expect(data?.fromAddress).to.eql("2ciPouLcYzCvFkdcwR3RXGfcYdb11j5iYyaDmgiQtYbtxBRz1CaT1R8Rd5138vZ2yJXUC4TghjXccvX")
            expect(data?.toChain).to.eql("Cardano")
            expect(data?.toAddress).to.eql("9f5veZdZq1C15GCqm6uej3kpRPh3Eq1Mtk1TqWjQx3CzMEZHXNz")
            expect(data?.networkFee).to.eql("100000")
            expect(data?.bridgeFee).to.eql("2520")
        })
    })
})