import { DataSource } from "typeorm";
import { NetworkDataBase } from "../../src/database/models/networkModel";
import { describe } from "mocha";
import { ErgoNetwork } from "../../src/ergo/network/ergoNetwork";
import { TxType } from "../../src/database/entities/TxEntity";

import chai, { expect } from "chai";
import { observationEntity1, observationEntity2 } from "./mockedData";
import { TxStatus } from "../../src/database/entities/ObservationStatusEntity";

const observation2Status = {observation: observationEntity2, status: TxStatus.NOT_COMMITTED};

export const loadNetworkDataBase = async (name: string): Promise<NetworkDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: [
            'src/database/entities/*.ts',
            'node_modules/@rosen-bridge/scanner/dist/entities/*.js',
            'node_modules/@rosen-bridge/watcher-data-extractor/dist/entities/*.js',
            'node_modules/@rosen-bridge/observation-extractor/entities/*.js',
            'node_modules/@rosen-bridge/address-extractor/dist/entities/*.js'
        ],
        migrations: ['src/database/migrations/watcher/*.ts'],
        synchronize: false,
        logging: false,
    });
    await ormConfig.initialize();
    await ormConfig.runMigrations();
    return new NetworkDataBase(ormConfig);
}

describe("NetworkModel tests", () => {
    before("inserting into database", async () => {
        const DB = await loadNetworkDataBase("dataBase");
        await DB.getObservationRepository().save([observationEntity2])
        await DB.getObservationStatusEntity().save([{observation: observationEntity2, status: TxStatus.NOT_COMMITTED}]);
    })

    describe("setStatusForObservations", () => {

        /**
         * Target: testing setStatusForObservations
         * Expected Output:
         *    The function should return one observation
         */
        it("should return one observation", async () => {
            const DB = await loadNetworkDataBase("dataBase");
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
            const DB = await loadNetworkDataBase("dataBase");
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
            const DB = await loadNetworkDataBase("dataBase");
            const res = await DB.setStatusForObservations(observationEntity2);
            expect(res.status).to.be.eql(1);
        })

        /**
         * Target: testing setStatusForObservations
         * Expected Output:
         *    The function should set status for observation that is not exist
         */
        it("should set status for observation that is not exist", async () => {
            const DB = await loadNetworkDataBase("dataBase-setStatusForObservation");
            await DB.getObservationRepository().insert([observationEntity1])
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
            const DB = await loadNetworkDataBase("dataBase");
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
            const DB = await loadNetworkDataBase("dataBase");
            const data = await DB.getAllTxs()
            expect(data).to.have.length(2)
        })
        it("should remove a tx", async () => {
            const DB = await loadNetworkDataBase("dataBase");
            const txs = await DB.getAllTxs()
            const data = await DB.removeTx(txs[0])
            expect(data.deleted).to.true
        })
        it("should return one available tx", async () => {
            const DB = await loadNetworkDataBase("dataBase");
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
            const DB = await loadNetworkDataBase("dataBase");
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
            const DB = await loadNetworkDataBase("dataBase");
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
            const DB = await loadNetworkDataBase("dataBase");
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
            const DB = await loadNetworkDataBase("dataBase");
            const obs = await DB.getConfirmedObservations(0, 100);
            const res = await DB.updateObservationTxStatus(obs[0], TxStatus.REVEALED)
            expect(res.status).to.eql(TxStatus.REVEALED)
        });
    })
})
