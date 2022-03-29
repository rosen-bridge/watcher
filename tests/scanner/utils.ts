import { koios, koiosNetwork } from "../../src/network/koios";
import { expect } from "chai";
import MockAdapter from "axios-mock-adapter";
import { observationsAtHeight } from "../../src/scanner/utils";
import exp from "constants";
import {mockedAxios} from "../network/koios";

describe("Scanner Utils test", () => {
    describe("observationsAtHeight", () => {
        // let mockedAxios = new MockAdapter(mockedAxios);
        // mockedAxios.onGet(
        //     '/blocks',
        //     {params: {offset: 0, limit: 1, select: 'hash,block_height'}}
        // ).reply(200, [
        //     {
        //         "hash": "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
        //         "block_height": 3433333
        //     }
        // ]);
        // mockedAxios.onGet(
        //     '/block_txs',
        //     {params: {_block_hash: "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6"}}
        // ).reply(200, [
        //     {
        //         "tx_hash": "18c74381954f093a3ca919df4380c9d9111396b9ad95bf4f16a94355d52cabc0"
        //     },
        //     {
        //         "tx_hash": "6c8368f62a91e6687dc677feb27f7724fcb398509ecd2bdde1866ed49353918d"
        //     },
        //     {
        //         "tx_hash": "b194ce1c11399822eb7f3288a67fbb0e295b7954f170ecacfc779a886dd11179"
        //     },
        //     {
        //         "tx_hash": "0ea5fb179e359bfb5de00831eb58fa830d8d6eede0b0c9eaa09286439616a340"
        //     },
        //     {
        //         "tx_hash": "ccb85a5f2f10bd1468e0cd9679a6bea360962747e2b60b73fa43abe98b09d15c"
        //     },
        //     {
        //         "tx_hash": "03cf541bfe93ede8489e0a3f1f1f94e34a4116399f8bd03619efca192961e47a"
        //     },
        //     {
        //         "tx_hash": "1a0d06c44fa9bb4fce5900e2d31031f9db38da29f4acc9d525c30dae67ea6609"
        //     },
        //     {
        //         "tx_hash": "b092027357f70831dd34dd34cea54146c11e844dc194b4c2ea841bce7cd19816"
        //     }
        // ]);
        it("", async () => {
            const data = await observationsAtHeight(3433333);
            expect(data).to.be.an.instanceof(Array);
        });
    });
});