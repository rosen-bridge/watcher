import { DataSource } from "typeorm";
import { expect } from "chai";
import { networkEntities } from "../../../src/entities";
import { NetworkDataBase } from "../../../src/models/networkModel";
import { Observation } from "../../../src/objects/interfaces";
import { TxType } from "../../../src/entities/watcher/network/TransactionEntity";
import { TxStatus } from "../../../src/entities/watcher/network/ObservationEntity";

export const loadDataBase = async (name: string): Promise<NetworkDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: networkEntities,
        synchronize: true,
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
        it("should save information and return true", async () => {
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
        it("returns 1 confirmed observation", async () => {
            const DB = await loadDataBase("dataBase");
            const res = await DB.getConfirmedObservations(0);
            expect(res).to.have.length(1)
        });
    });

    describe("submitTx", () => {
        it("should save two new transaction without any errors", async () => {
            const DB = await loadDataBase("dataBase");
            await DB.submitTx("txSerialized", "reqId1", "txId", 100, TxType.COMMITMENT);
            await DB.submitTx("txSerialized2", "reqId1", "txId2", 120, TxType.TRIGGER);
        })
    })

    describe("getAllTxs and removeTx", () => {
        it("should return two available txs", async () => {
            const DB = await loadDataBase("dataBase");
            const data = await DB.getAllTxs()
            expect(data).to.have.length(2)
        })
        it("should remove a tx", async () => {
            const DB = await loadDataBase("dataBase");
            const txs = await DB.getAllTxs()
            const data = await DB.removeTx(txs[0])
            expect(data.deleted).to.true
        })
        it("should return one available tx", async () => {
            const DB = await loadDataBase("dataBase");
            const data = await DB.getAllTxs()
            expect(data).to.have.length(1)
        })
    })

    describe("updateTxTime", () => {
        it("should update the tx time", async () => {
            const DB = await loadDataBase("dataBase");
            const txs = await DB.getAllTxs()
            const data = await DB.updateTxTime(txs[0], 150)
            expect(data.updateBlock).to.eql(150)
        })
    })

    describe("upgradeObservationTxStatus", () => {
        it("should upgrade the observation txStatus", async () => {
            const DB = await loadDataBase("dataBase");
            const obs = await DB.getConfirmedObservations(0);
            const res = await DB.upgradeObservationTxStatus(obs[0])
            expect(res.status).to.eql(TxStatus.COMMITMENT_SENT)
        });
    })

    describe("downgradeObservationTxStatus", () => {
        it("should upgrade the observation txStatus", async () => {
            const DB = await loadDataBase("dataBase");
            const obs = await DB.getConfirmedObservations(0);
            const res = await DB.downgradeObservationTxStatus(obs[0])
            expect(res.status).to.eql(TxStatus.NOT_COMMITTED)
        });
    })

    describe("updateObservationTxStatus", () => {
        it("should update the observation txStatus to revealed", async () => {
            const DB = await loadDataBase("dataBase");
            const obs = await DB.getConfirmedObservations(0);
            const res = await DB.updateObservationTxStatus(obs[0], TxStatus.REVEALED)
            expect(res.status).to.eql(TxStatus.REVEALED)
        });
    })

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
        it("should affect remove 2 rows due to a fork event", async () => {
            const DB = await loadDataBase("dataBase");
            const res = await DB.removeForkedBlocks(3433333);
            expect(res.affected).to.be.equal(2);
        });
    });

});
