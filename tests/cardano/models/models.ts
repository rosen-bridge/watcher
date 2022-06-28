import { DataSource } from "typeorm";
import { expect } from "chai";
import { entities } from "../../../src/entities";
import { migrations } from "../../../src/migrations";
import { NetworkDataBase } from "../../../src/models/networkModel";
import { Observation } from "../../../src/objects/interfaces";
import { firstCommitment } from "../../commitment/models/commitmentModel";

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
    fromAddress: "ErgoAddress",
    toAddress: "cardanoAddress",
    amount: "1000000000",
    bridgeFee: "1000000",
    networkFee: "1000000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId1",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId1",
}];

export const secondObservations: Array<Observation> = [{
    fromChain: "erg",
    toChain: "cardano",
    fromAddress: "ergoAddress",
    toAddress: "cardanoAddress",
    amount: "1100000000",
    bridgeFee: "1000000",
    networkFee: "1000000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId2",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId2",
}];


describe("Database functions",  () => {
    describe("saveBlock", () => {
        it("should return true", async () => {
            const DB = await loadDataBase("dataBase");
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

    describe("getConfirmedObservations", () => {
        it("returns 1 row", async () => {
            const DB = await loadDataBase("dataBase");
            const res = await DB.getConfirmedObservations(0);
            expect(res).to.have.length(1)
        });
    });

    describe("saveCommitment", () => {
        it("should save the commitment and update the observation", async () => {
            const DB = await loadDataBase("dataBase");
            const observation = (await DB.getConfirmedObservations(0))[0]
            const res = await DB.updateObservation("txId", observation)
            expect(res.commitmentBoxId).to.eql("txId")
            const observation2 = (await DB.getConfirmedObservations(0))[0]
            expect(observation2.commitmentBoxId).to.not.null
        });
    });

    describe("getLastSavedBlock", () => {
        it("should return last saved block", async () => {
            const DB = await loadDataBase("dataBase");

            const lastBlock = await DB.getLastSavedBlock();
            expect(lastBlock).to.eql({
                "hash": "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce",
                "block_height": 3433334
            });
        });
    });

    describe("getBlockAtHeight", () => {
        it("should return block Hash", async () => {
            const DB = await loadDataBase("dataBase");
            const blockHash = await DB.getBlockAtHeight(3433333);
            expect(blockHash?.hash).to.be.equal("26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6");
        });
        it("should return block undefined", async () => {
            const DB = await loadDataBase("dataBase");
            const blockHash = await DB.getBlockAtHeight(3433222);
            expect(blockHash).to.be.undefined;
        });
    });

    describe("changeLastValidBlock", () => {
        it("should affect 1 row", async () => {
            const DB = await loadDataBase("dataBase");
            const res = await DB.removeForkedBlocks(3433333);
            expect(res.affected).to.be.equal(2);
        });
    });

});
