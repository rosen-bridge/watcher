import { expect } from "chai";
import {ErgoNetworkApi, nodeApi} from "../../../src/commitments/network/networkApi"
import {describe} from "mocha";
import MockAdapter from "axios-mock-adapter";

const blockAtHeight = require('../dataset/blockAtHeight.json');
const blockTxs = require('../dataset/blockTxs.json');
const latestBlock = require('../dataset/latestBlock.json');
const mockedAxios = new MockAdapter(nodeApi);
const ergoNetwork = new ErgoNetworkApi();

const txId1 = "54ab224b98e3c87ecb2a1ccd9a7ff794c9cc9507be8520cb4376539ad555bd3a"
const blockHash = "b1b7249cb76560cd7ee15c8baa29b870fd23e5482ddfcedf5d02048723caa7b7"
const blockHeight = 204105
mockedAxios.onGet(`/blocks/at/${blockHeight}`)
    .reply(200, blockAtHeight)
mockedAxios.onGet(`/blocks/${blockHash}/transactions`)
    .reply(200, blockTxs)
mockedAxios.onGet(`/blocks/lastHeaders/1`)
    .reply(200, latestBlock)

describe("Testing ergo network api", () => {
    describe("getBlockAtHeight", () => {
        it("Should return a json with hash and block_height field", async () => {
            const data = await ergoNetwork.getBlockAtHeight(blockHeight);
            expect(data).to.haveOwnProperty("hash")
            expect(data).to.haveOwnProperty("block_height")
            expect(data.block_height).to.eql(blockHeight);
        });
    });

    describe("getBlockTxs", () => {
        it("get the block transactions with block hash", async () => {
            const data = await ergoNetwork.getBlockTxs(blockHash);
            expect(data).to.have.lengthOf(1)
            expect(data[0].id).to.eq(txId1)
        });
    });

    describe("getCurrentHeight", () => {
        it("get the latest block", async () => {
            const data = await ergoNetwork.getCurrentHeight()
            expect(data).to.haveOwnProperty("hash")
            expect(data).to.haveOwnProperty("block_height")
            expect(data.block_height).to.eql(blockHeight);
        });
    });
})
