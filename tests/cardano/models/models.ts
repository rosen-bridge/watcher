import { DataSource } from "typeorm";
import { networkEntities } from "../../../src/entities";
import { NetworkDataBase } from "../../../src/models/networkModel";
import { Observation } from "../../../src/objects/interfaces";
import { TxType } from "../../../src/entities/watcher/network/TransactionEntity";
import { TxStatus } from "../../../src/entities/watcher/network/ObservationEntity";
import { ErgoNetwork } from "../../../src/ergo/network/ergoNetwork";

import chai, { expect } from "chai";
import spies from "chai-spies";
chai.use(spies)

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
    /**
     * Target: testing saveBlock
     * Expected Output:
     *    The function should save two blocks along their related observations
     */
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

    /**
     * Target: testing getConfirmedObservations
     * Expected Output:
     *    The function should return all confirmed observations
     */
    describe("getConfirmedObservations", () => {
        it("returns 1 confirmed observation", async () => {
            const DB = await loadDataBase("dataBase");
            const res = await DB.getConfirmedObservations(0);
            expect(res).to.have.length(1)
        });
    });

    /**
     * Target: testing submitTx
     * Expected Output:
     *    The function should store two transactions in the database
     */
    describe("submitTx", () => {
        it("should save two new transaction without any errors", async () => {
            const DB = await loadDataBase("dataBase");
            chai.spy.on(ErgoNetwork, "getHeight", () => 100)
            await DB.submitTx("txSerialized", "reqId1", "txId", TxType.COMMITMENT)
            await DB.submitTx("txSerialized2", "reqId1", "txId2", TxType.TRIGGER)
            chai.spy.restore(ErgoNetwork)
        })
    })

    /**
     * Target: testing getAllTxs & removeTx
     * Expected Output:
     *    The test should return two stored transactions then remove one and return one remaining transaction
     */
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

    /**
     * Target: testing updateTxTime
     * Expected Output:
     *    The function should set the update height
     */
    describe("updateTxTime", () => {
        it("should update the tx time", async () => {
            const DB = await loadDataBase("dataBase");
            const txs = await DB.getAllTxs()
            const data = await DB.setTxUpdateHeight(txs[0], 150)
            expect(data.updateBlock).to.eql(150)
        })
    })

    /**
     * Target: testing upgradeObservationTxStatus
     * Expected Output:
     *    The function should upgrade the tx status to the commitment_sent status
     */
    describe("upgradeObservationTxStatus", () => {
        it("should upgrade the observation txStatus", async () => {
            const DB = await loadDataBase("dataBase");
            const obs = await DB.getConfirmedObservations(0);
            const res = await DB.upgradeObservationTxStatus(obs[0])
            expect(res.status).to.eql(TxStatus.COMMITMENT_SENT)
        });
    })

    /**
     * Target: testing downgradeObservationTxStatus
     * Expected Output:
     *    The function should downgrade the tx status to the not_committed status
     */
    describe("downgradeObservationTxStatus", () => {
        it("should upgrade the observation txStatus", async () => {
            const DB = await loadDataBase("dataBase");
            const obs = await DB.getConfirmedObservations(0);
            const res = await DB.downgradeObservationTxStatus(obs[0])
            expect(res.status).to.eql(TxStatus.NOT_COMMITTED)
        });
    })

    /**
     * Target: testing updateObservationTxStatus
     * Expected Output:
     *    The function should update the tx status to the revealed status
     */
    describe("updateObservationTxStatus", () => {
        it("should update the observation txStatus to revealed", async () => {
            const DB = await loadDataBase("dataBase");
            const obs = await DB.getConfirmedObservations(0);
            const res = await DB.updateObservationTxStatus(obs[0], TxStatus.REVEALED)
            expect(res.status).to.eql(TxStatus.REVEALED)
        });
    })

    /**
     * Target: testing getLastSavedBlock
     * Expected Output:
     *    The function should return the last saved block
     */
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

    /**
     * Target: testing getBlockAtHeight
     * Expected Output:
     *    The function should return the block hash at the specified height
     */
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

    /**
     * Target: testing changeLastValidBlock
     * Expected Output:
     *    The function should change the last valid block and remove 2 forked blocks
     */
    describe("changeLastValidBlock", () => {
        it("should affect remove 2 rows due to a fork event", async () => {
            const DB = await loadDataBase("dataBase");
            const res = await DB.removeForkedBlocks(3433333);
            expect(res.affected).to.be.equal(2);
        });
    });

});
