import { DataSource } from "typeorm";
import { expect } from "chai";
import { entities } from "../../../src/entities";
import { migrations } from "../../../src/migrations";
import { NetworkDataBase } from "../../../src/models/networkModel";
import { Observation } from "../../../src/objects/interfaces";

export const loadDataBase = async (name: string): Promise<NetworkDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: entities,
        synchronize: false,
        migrations: migrations,
        logging: false,
    });
    return await NetworkDataBase.init(ormConfig);
}

export const firstObservations: Array<Observation> = [{
    fromChain: "erg",
    toChain: "cardano",
    toAddress: "cardanoAddress",
    amount: "1000000000",
    fee: "1000000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId1",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId1",
}];

export const secondObservations: Array<Observation> = [{
    fromChain: "erg",
    toChain: "cardano",
    toAddress: "cardanoAddress",
    amount: "1100000000",
    fee: "1100000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId2",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId2",
}];


describe("Database functions", async () => {
    const DB = await loadDataBase("dataBase");

    describe("saveBlock", () => {
        it("should return true", async () => {
            await DB.removeForkedBlocks(3433333);
            let res = await DB.saveBlock(
                3433333,
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                firstObservations
            );
            expect(res).to.be.true;
            res = await DB.saveBlock(
                3433334,
                "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce",
                secondObservations
            );
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
            const res = await DB.removeForkedBlocks(3433333);
            expect(res.affected).to.be.equal(2);
        });
    });

});
