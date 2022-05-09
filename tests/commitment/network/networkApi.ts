import { expect } from "chai";
import {ErgoNetworkApi, explorerApi} from "../../../src/commitments/network/networkApi"
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
const mockedAxios = new MockAdapter(explorerApi);
const ergoNetwork = new ErgoNetworkApi();

const txId1 = "7aa6b32b1eb5401039340ed3cace93d004aa513f33053c0bd7162beb4695ecf6"
const txId2 = "5ab88cf5e39b9bdabadb2e65db8ad84b24ca1a4e7f5a5534f8f4483e65aa9ec4"
const blockHash = "e43c8f4b635f70a7495205e47c5fde461f065b18dc1bea0e0b57064702394618"
const boxId1 = "e385fd95b5e8c8b15801879254c5a6cfd83c3ece71fe7c99f4a7ad5026f5d55c"
const boxId2 = "ce85367473e4bdb536b682f454b543bdc2725f6d6a0a5efddae16906450f2ff8"
mockedAxios.onGet("/api/v1/blocks/byGlobalIndex/stream", {params: {minGix: 744040, limit: 1}})
    .reply(200, blockAtHeight)
mockedAxios.onGet("/api/v1/blocks", {params: {offset: 0, limit: 2}})
    .reply(200, blocks)
mockedAxios.onGet(`/api/v1/blocks/${blockHash}`)
    .reply(200, blockTxs)
mockedAxios.onGet(`api/v1/transactions/${txId1}`)
    .reply(200, tx1)
mockedAxios.onGet(`api/v1/transactions/${txId2}`)
    .reply(200, tx2)
mockedAxios.onGet(`/api/v1/networkState`)
    .reply(200, networkStatus)
mockedAxios.onGet(`/api/v1/boxes/${boxId1}`)
    .reply(200, unspentBox)
mockedAxios.onGet(`/api/v1/boxes/${boxId2}`)
    .reply(200, spentBox)

describe("Testing ergo network api", () => {
    describe("getBlockAtHeight", () => {
        it("Should return a json with hash and block_height field", async () => {
            const data = await ergoNetwork.getBlockAtHeight(744041);
            expect(data).to.haveOwnProperty("hash")
            expect(data).to.haveOwnProperty("block_height")
            expect(data.block_height).to.eql(744041);
        });
    });

    describe("getBlock", () => {
        it("get the last block offset=0 and limit=1", async () => {
            const data = await ergoNetwork.getBlock(0, 2);
            expect(data).to.have.lengthOf(2)
            expect(data[0]).to.haveOwnProperty("hash")
            expect(data[0]).to.haveOwnProperty("block_height")
            expect(data[1]).to.haveOwnProperty("hash")
            expect(data[1]).to.haveOwnProperty("block_height")
        });
    })

    describe("getBlockTxs", () => {
        it("get the block transactions with block hash", async () => {
            const data = await ergoNetwork.getBlockTxs(blockHash);
            expect(data).to.have.lengthOf(4)
        });
    });

    describe("getTxUtxos", () => {
        it("get one tx utxos", async () => {
            const data = await ergoNetwork.getTxUtxos([txId1]);
            expect(data).to.have.lengthOf(2)
        });
        it("get multiple txs utxos", async () => {
            const data = await ergoNetwork.getTxUtxos([txId1, txId2]);
            expect(data).to.have.lengthOf(6)
        });
    });

    describe("getTxMetaData", () => {
        it("get one tx data", async () => {
            const data = await ergoNetwork.getTxMetaData([txId1]);
            expect(data).to.have.lengthOf(1)
        });
        it("get multiple txs data", async () => {
            const data = await ergoNetwork.getTxMetaData([txId1, txId2]);
            expect(data).to.have.lengthOf(2)
        });
    });

    describe("getHeight", () => {
        it("get the latest block height", async () => {
            const data = await ergoNetwork.getHeight()
            expect(data).to.eq(745677)
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
