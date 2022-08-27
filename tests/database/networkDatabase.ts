import { DataSource, Repository } from "typeorm";
import { NetworkDataBase } from "../../src/database/models/networkModel";
import { describe } from "mocha";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";
import { TxType } from "../../src/database/entities/TxEntity";

import chai, { expect } from "chai";
import { cardanoBlockEntity, ergoBlockEntity, observationEntity1, observationEntity2 } from "./mockedData";
import { ObservationStatusEntity, TxStatus } from "../../src/database/entities/ObservationStatusEntity";
import { BlockEntity } from "@rosen-bridge/scanner";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";

const observation2Status = {observation: observationEntity2, status: TxStatus.NOT_COMMITTED};
let blockRepo: Repository<BlockEntity>
let observationRepo: Repository<ObservationEntity>
let observationStatusRepo: Repository<ObservationStatusEntity>

export const loadNetworkDataBase = async (name: string): Promise<NetworkDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: [
            'src/database/entities/*.ts',
            'node_modules/@rosen-bridge/scanner/dist/entities/*.js',
            'node_modules/@rosen-bridge/watcher-data-extractor/dist/entities/*.js',
            'node_modules/@rosen-bridge/observation-extractor/dist/entities/*.js',
            'node_modules/@rosen-bridge/address-extractor/dist/entities/*.js'
        ],
        migrations: ['src/database/migrations/watcher/*.ts'],
        synchronize: false,
        logging: false,
    });
    await ormConfig.initialize();
    await ormConfig.runMigrations();
    blockRepo = ormConfig.getRepository(BlockEntity)
    observationRepo = ormConfig.getRepository(ObservationEntity)
    observationStatusRepo = ormConfig.getRepository(ObservationStatusEntity)
    return new NetworkDataBase(ormConfig);
}

describe("NetworkModel tests", () => {
    let DB: NetworkDataBase
    before("inserting into database", async () => {
        DB = await loadNetworkDataBase("networkDataBase");
        await blockRepo.save([ergoBlockEntity, cardanoBlockEntity])
        await observationRepo.save([observationEntity2])
        await observationStatusRepo.save([{observation: observationEntity2, status: TxStatus.NOT_COMMITTED}]);
    })

    describe("getLastBlockHeight", () => {
        /**
         * Target: testing getLastBlockHeight
         * Expected Output:
         *    The function should return the ergo chain last block height
         */
        it("Should return the last block height on ergo", async () => {
            const res = await DB.getLastBlockHeight("Ergo");
            expect(res).to.eql(ergoBlockEntity.height)
        })

        /**
         * Target: testing getLastBlockHeight
         * Expected Output:
         *    The function should return the cardano chain last block height
         */
        it("Should return the last block height on cardano", async () => {
            const res = await DB.getLastBlockHeight("Cardano");
            expect(res).to.eql(cardanoBlockEntity.height)
        })

        /**
         * Target: testing getLastBlockHeight
         * Expected Output:
         *    The function should throw an error since the config is not correct
         */
        it("Should throw an error since network name is wrong", async () => {
            await expect(DB.getLastBlockHeight("WrongNet")).to.rejectedWith(Error)
        })

        /**
         * Target: testing getLastBlockHeight
         * Expected Output:
         *    The function should throw an error since the database has a problem
         */
        it("Should throw error since no block is saved on ergo", async () => {
            await blockRepo.clear()
            await expect(DB.getLastBlockHeight("Ergo")).to.rejectedWith(Error)
        })
    })

    describe("setStatusForObservations", () => {

        /**
         * Target: testing setStatusForObservations
         * Expected Output:
         *    The function should return one observation
         */
        it("should return one observation", async () => {
            const res = await DB.getStatusForObservations(observationEntity2);
            expect(res).not.to.be.null;
            if (res !== null) {
                expect(res.status).to.be.eql(observation2Status.status);
            }
        })

        /**
         * Target: testing setStatusForObservations
         * Expected Output:
         *    The function should return zero observation
         */
        it("should return zero observation", async () => {
            const res = await DB.getStatusForObservations(observationEntity1);
            expect(res).to.be.null;
        })
    })


    describe("setStatusForObservations", () => {

        /**
         * Target: testing setStatusForObservations
         * Expected Output:
         *    The function should return status for observation that exist
         */
        it("should return status for observation that exist", async () => {
            const res = await DB.setStatusForObservations(observationEntity2);
            expect(res.status).to.be.eql(1);
        })

        /**
         * Target: testing setStatusForObservations
         * Expected Output:
         *    The function should set status for observation that is not exist
         */
        it("should set status for observation that is not exist", async () => {
            await observationRepo.insert([observationEntity1])
            const res = await DB.setStatusForObservations(observationEntity1);
            expect(res.status).to.be.eql(1);
        })
    })

    /**
     * Target: testing submitTx
     * Expected Output:
     *    The function should store two transactions in the database
     */
    describe("submitTx", () => {
        it("should save two new transaction without any errors", async () => {
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
            const data = await DB.getAllTxs()
            expect(data).to.have.length(2)
        })
        it("should remove a tx", async () => {
            const txs = await DB.getAllTxs()
            const data = await DB.removeTx(txs[0])
            expect(data.deleted).to.true
        })
        it("should return one available tx", async () => {
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
            const obs = await DB.getConfirmedObservations(0, 100);
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
            const obs = await DB.getConfirmedObservations(0, 100);
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
            const obs = await DB.getConfirmedObservations(0, 100);
            const res = await DB.updateObservationTxStatus(obs[0], TxStatus.REVEALED)
            expect(res.status).to.eql(TxStatus.REVEALED)
        });
    })
})
