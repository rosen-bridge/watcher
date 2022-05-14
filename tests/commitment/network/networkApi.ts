import { expect } from "chai";
import {ErgoNetworkApi, nodeApi} from "../../../src/commitments/network/networkApi"
import {describe} from "mocha";
import MockAdapter from "axios-mock-adapter";

const blockAtHeight = require('../dataset/blockAtHeight.json');
const blocks = require('../dataset/blocks.json');
const blockTxs = require('../dataset/blockTxs.json');
const tx1 = require('../dataset/transaction1.json');
const tx2 = require('../dataset/transaction2.json');
const networkStatus = require('../dataset/networkStatus.json');
const spentBox = require('../dataset/spentBox.json');
const unspentBox = require('../dataset/unspentBox.json');
const latestBlock = require('../dataset/latestBlock.json');
const mockedAxios = new MockAdapter(nodeApi);
const ergoNetwork = new ErgoNetworkApi();

const txId1 = "54ab224b98e3c87ecb2a1ccd9a7ff794c9cc9507be8520cb4376539ad555bd3a"
const txId2 = "5ab88cf5e39b9bdabadb2e65db8ad84b24ca1a4e7f5a5534f8f4483e65aa9ec4"
const blockHash = "b1b7249cb76560cd7ee15c8baa29b870fd23e5482ddfcedf5d02048723caa7b7"
const boxId1 = "e385fd95b5e8c8b15801879254c5a6cfd83c3ece71fe7c99f4a7ad5026f5d55c"
const boxId2 = "ce85367473e4bdb536b682f454b543bdc2725f6d6a0a5efddae16906450f2ff8"
mockedAxios.onGet("/api/v1/blocks/byGlobalIndex/stream", {params: {minGix: 744040, limit: 1}})
    .reply(200, blockAtHeight)
mockedAxios.onGet("/api/v1/blocks", {params: {offset: 0, limit: 2}})
    .reply(200, blocks)
mockedAxios.onGet(`/blocks/${blockHash}/transactions`)
    .reply(200, blockTxs)
mockedAxios.onGet(`api/v1/transactions/${txId1}`)
    .reply(200, tx1)
mockedAxios.onGet(`api/v1/transactions/${txId2}`)
    .reply(200, tx2)
mockedAxios.onGet(`/api/v1/networkState`)
    .reply(200, networkStatus)
mockedAxios.onGet(`/api/v1/boxes/${boxId1}`)
    .reply(200, unspentBox)
mockedAxios.onGet(`/blocks/lastHeaders/1`)
    .reply(200, latestBlock)

describe("Testing ergo network api", () => {
    describe("getBlockAtHeight", () => {
        it("Should return a json with hash and block_height field", async () => {
            const data = await ergoNetwork.getBlockAtHeight(744041);
            expect(data).to.haveOwnProperty("hash")
            expect(data).to.haveOwnProperty("block_height")
            expect(data.block_height).to.eql(744041);
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
            expect(data.block_height).to.eql(204105);
        });
    });

    describe("boxIsSpent", () => {
        it("check unspent box", async () => {
            const data = await ergoNetwork.boxIsSpent(boxId1);
            expect(data).to.eq(false)
        });
        it("check spent box", async () => {
            const data = await ergoNetwork.boxIsSpent(boxId2);
            expect(data).to.eq(true)
        });
    });

})
