import { loadBridgeDataBase } from "../models/bridgeModel";
import { Boxes } from "../../../src/ergo/boxes";
import { rosenConfig } from "../../ergo/transactions/permit";
import { Transaction } from "../../../src/api/Transaction";

import * as wasm from "ergo-lib-wasm-nodejs";
import chai, { expect } from "chai";
import spies from "chai-spies";
import sinon from "sinon"
import { Scanner } from "../../../src/bridge/scanner/scanner";
import { ErgoNetworkApi } from "../../../src/bridge/network/networkApi";
import { CommitmentUtils } from "../../../src/bridge/scanner/utils";
import { NotEnoughFund } from "../../../src/errors/errors";
import { ErgoConfig } from "../../../src/config/config";
chai.use(spies)


const userAddress = "9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9"
const userSecret = wasm.SecretKey.dlog_from_bytes(Buffer.from("1111111111111111111111111111111111111111111111111111111111111111", "hex"))
const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"

describe("Bridge Scanner Tests", () => {

    /**
     * Target: testing getBlockInformation
     * Dependencies:
     *    bridgeDataBase
     *    Transaction
     *    ErgoNetworkApi
     * Expected Output:
     *    The function should extract all block information
     */
    describe("getBlockInformation", () => {
        it("should return block Information", async () => {
            const bridgeDb = await loadBridgeDataBase("commitments")
            const boxes = new Boxes(rosenConfig, bridgeDb)
            const tx = new Transaction(rosenConfig, userAddress, userSecret, boxes)
            sinon.stub(tx, "watcherWID").value(WID)
            const network = new ErgoNetworkApi()
            chai.spy.on(network, "getBlockTxs", () => [])
            const scanner = new Scanner(bridgeDb, network,tx)
            chai.spy.on(CommitmentUtils, "extractCommitments", () => [{"commitmentBoxId": "boxId1"}])
            chai.spy.on(CommitmentUtils, "extractSpecialBoxes", () => [{"boxId": "boxId2"}])
            chai.spy.on(CommitmentUtils, "updatedCommitments", () => "updatedCommitments")
            chai.spy.on(CommitmentUtils, "spentSpecialBoxes", () => "spentSpecialBoxes")
            const data = await scanner.getBlockInformation({block_height: 100, hash: "blockHash"})
            expect(data).to.eql(
                {
                    newCommitments: [ { commitmentBoxId: 'boxId1' } ],
                    updatedCommitments: 'updatedCommitments',
                    newBoxes: [ { boxId: 'boxId2' } ],
                    spentBoxes: 'spentSpecialBoxes'
                }
            )
            chai.spy.restore(CommitmentUtils)
        })

        it("Should return error because WID is not set", async () => {
            const bridgeDb = await loadBridgeDataBase("commitments")
            const boxes = new Boxes(rosenConfig, bridgeDb)
            const tx = new Transaction(rosenConfig, userAddress, userSecret, boxes)
            const network = new ErgoNetworkApi()
            const scanner = new Scanner(bridgeDb, network,tx)
            await expect(scanner.getBlockInformation({block_height: 100, hash: "blockHash"})).to.rejectedWith(Error)
        })
    })

    /**
     * Target: testing removeOldCommitments
     * Dependencies:
     *    bridgeDataBase
     *    Transaction
     *    ErgoNetworkApi
     * Expected Output:
     *    The function should remove old commitments
     */
    describe("removeOldCommitments", () => {
        it("should remove old spent commitments", async () => {
            const bridgeDb = await loadBridgeDataBase("commitments")
            chai.spy.on(bridgeDb, "getOldSpentCommitments", () => [{"commitmentBoxId": "boxId1"}])
            chai.spy.on(bridgeDb, "deleteCommitments", () => null)
            const boxes = new Boxes(rosenConfig, bridgeDb)
            const tx = new Transaction(rosenConfig, userAddress, userSecret, boxes)
            const network = new ErgoNetworkApi()
            chai.spy.on(network, "getCurrentHeight", () => 100)
            const scanner = new Scanner(bridgeDb, network,tx)
            await scanner.removeOldCommitments()
            expect(bridgeDb.deleteCommitments).to.have.been.called.with(["boxId1"])
        })
    })
})

