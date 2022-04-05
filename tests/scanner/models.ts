import DataBase from "../../src/scanner/models";
import { DataSource } from "typeorm";
import { ObservationEntity } from "../../src/entities/ObservationEntity";
import { BlockEntity } from "../../src/entities/BlockEntity";
import { CommitmentEntity } from "../../src/entities/CommitmentEntity";
import { Observation } from "../../src/scanner/utils";
import { expect } from "chai";

describe("Database functions", async () => {
    const WatcherDataSource = new DataSource({
        type: "sqlite",
        database: "./sqlite/watcher-test.sqlite",
        entities: [ObservationEntity, BlockEntity, CommitmentEntity],
        synchronize: true,
        logging: false,
    });
    const DB = new DataBase(WatcherDataSource);
    await DB.init();

    const firstObservations: Array<Observation | undefined> = [{
        fromChain: "erg",
        toChain: "cardano",
        toAddress: "cardanoAddress",
        amount: "1000000000",
        fee: "1000000",
        sourceChainTokenId: "ergoTokenId",
        targetChainTokenId: "cardanoTokenId",
        sourceTxId: "ergoTxId",
        sourceBlockId: "ergoBlockId",
        requestId: "reqId",
    }, undefined];
    const secondObservations: Array<Observation | undefined> = [{
        fromChain: "erg",
        toChain: "cardano",
        toAddress: "cardanoAddress",
        amount: "1100000000",
        fee: "1100000",
        sourceChainTokenId: "ergoTokenId",
        targetChainTokenId: "cardanoTokenId",
        sourceTxId: "ergoTxId",
        sourceBlockId: "ergoBlockId",
        requestId: "reqId",
    }, undefined, undefined];

    describe("saveBlock", () => {
        it("should return true", async () => {
            let res = await DB.saveBlock(3433333, "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6", firstObservations);
            expect(res).to.be.true;
            res = await DB.saveBlock(3433334, "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce", secondObservations);
            expect(res).to.be.true;
        });
    });

    describe("getLastSavedBlock", () => {
        it("should return last saved block", async () => {
            const lastBlock = await DB.getLastSavedBlock();
            expect(lastBlock).to.eql({
                "hash": "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce",
                "block_height": 3433334
            });
        });
    });

    describe("getBlockAtHeight", () => {
        it("should return block Hash", async () => {
            const blockHash = await DB.getBlockAtHeight(3433333);
            expect(blockHash?.hash).to.be.equal("26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6");
        });
        it("should return block undefined", async () => {
            const blockHash = await DB.getBlockAtHeight(3433222);
            expect(blockHash).to.be.undefined;
        });
    });

    describe("changeLastValidBlock", () => {
        it("should affect 1 row", async () => {
            const res = await DB.changeLastValidBlock(3433333);
            expect(res.affected).to.be.equal(2);
        });
    });

});
