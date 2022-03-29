import MockAdapter from 'axios-mock-adapter';
import { expect } from "chai";
import axios from "axios";
import { koios, koiosNetwork } from "../../src/network/koios";

export const mockedAxios = new MockAdapter(koios);
mockedAxios.onGet(
    '/blocks',
    {params: {block_height: `eq.1000`, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "fecb570ec0fa6201860796d8b1b0e9acb4650a1f72d26da749e2dd075461914f",
        "block_height": 1000
    }
]);

mockedAxios.onGet(
    '/blocks',
    {params: {offset: 0, limit: 1, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
        "block_height": 3433333
    }
]);

mockedAxios.onGet(
    '/blocks',
    {params: {offset: 5, limit: 3, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "e1699582bd2e3426839e10f7f5066bafc6e3847fd4511a2013ba3b4e13514267",
        "block_height": 3433332
    },
    {
        "hash": "397e969e0525d82dc46a33e31634187dae94b12a6cc4b534e4e52f6d313aef22",
        "block_height": 3433331
    },
    {
        "hash": "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce",
        "block_height": 3433330
    }
]);
mockedAxios.onGet(
    '/block_txs',
    {params: {_block_hash: "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6"}}
).reply(200, [
    {
        "tx_hash": "18c74381954f093a3ca919df4380c9d9111396b9ad95bf4f16a94355d52cabc0"
    },
    {
        "tx_hash": "6c8368f62a91e6687dc677feb27f7724fcb398509ecd2bdde1866ed49353918d"
    },
    {
        "tx_hash": "b194ce1c11399822eb7f3288a67fbb0e295b7954f170ecacfc779a886dd11179"
    },
    {
        "tx_hash": "0ea5fb179e359bfb5de00831eb58fa830d8d6eede0b0c9eaa09286439616a340"
    },
    {
        "tx_hash": "ccb85a5f2f10bd1468e0cd9679a6bea360962747e2b60b73fa43abe98b09d15c"
    },
    {
        "tx_hash": "03cf541bfe93ede8489e0a3f1f1f94e34a4116399f8bd03619efca192961e47a"
    },
    {
        "tx_hash": "1a0d06c44fa9bb4fce5900e2d31031f9db38da29f4acc9d525c30dae67ea6609"
    },
    {
        "tx_hash": "b092027357f70831dd34dd34cea54146c11e844dc194b4c2ea841bce7cd19816"
    }
]);

describe("Koios Apis", () => {
    describe("getBlockAtHeight", () => {


        it("Should return a json with hash and block_height field", async () => {
            const data = await koiosNetwork.getBlockAtHeight(1000);
            expect(data.hash).to.equal("fecb570ec0fa6201860796d8b1b0e9acb4650a1f72d26da749e2dd075461914f");
            expect(data.block_height).to.equal(1000);
        });
    });
    describe("getBlock", () => {


        it("get the last block offset=0 and limit=1", async () => {
            const data = await koiosNetwork.getBlock(0, 1);
            expect(data[0].hash).to.equal("26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6");
            expect(data[0].block_height).to.equal(3433333);
        });

        it("get the last 3 blocks with offset of 5", async () => {
            const data = await koiosNetwork.getBlock(5, 3);
            expect(data[0].block_height).to.equal(3433332);
            expect(data[0].hash).to.equal("e1699582bd2e3426839e10f7f5066bafc6e3847fd4511a2013ba3b4e13514267");
            expect(data[1].block_height).to.equal(3433331);
            expect(data[1].hash).to.equal("397e969e0525d82dc46a33e31634187dae94b12a6cc4b534e4e52f6d313aef22");
            expect(data[2].block_height).to.equal(3433330);
            expect(data[2].hash).to.equal("19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce");
        });
    });

    describe("getBlockTxs", () => {
        it("get the block transactions with block hash", async () => {
            const data = await koiosNetwork.getBlockTxs(
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6"
            );
            expect(data.length).to.equal(3);
            expect(data).to.include.members([
                "18c74381954f093a3ca919df4380c9d9111396b9ad95bf4f16a94355d52cabc0",
                "6c8368f62a91e6687dc677feb27f7724fcb398509ecd2bdde1866ed49353918d",
                "b194ce1c11399822eb7f3288a67fbb0e295b7954f170ecacfc779a886dd11179"
            ])
        });
    });
});
