import { expect } from 'chai';
import { describe } from 'mocha';
import { DataSource, Repository } from 'typeorm';
import * as wasm from 'ergo-lib-wasm-nodejs';

import {
  BoxEntity,
  migrations as addressExtractorMigrations,
} from '@rosen-bridge/address-extractor';
import {
  migrations as observationMigrations,
  ObservationEntity,
} from '@rosen-bridge/observation-extractor';
import {
  BlockEntity,
  migrations as scannerMigrations,
} from '@rosen-bridge/scanner';
import {
  CommitmentEntity,
  EventTriggerEntity,
  migrations as watcherDataExtractorMigrations,
  PermitEntity,
} from '@rosen-bridge/watcher-data-extractor';

import {
  ObservationStatusEntity,
  TxStatus,
} from '../../src/database/entities/observationStatusEntity';
import { TxEntity, TxType } from '../../src/database/entities/txEntity';

import migrations from '../../src/database/migrations/watcher';

import { WatcherDataBase } from '../../src/database/models/watcherModel';

import {
  cardanoBlockEntity,
  commitmentEntity,
  commitmentTxJson,
  ergoBlockEntity,
  eventTriggerEntity,
  newEventTriggerEntity,
  observationEntity1,
  observationEntity2,
  permitBox,
  permitEntity,
  plainBox,
  spentCommitmentEntity,
  spentPermitEntity,
  spentPlainBox,
} from './mockedData';

import * as Constants from '../../src/config/constants';

import {
  firstPermit,
  firstStatisticCommitment,
  firstStatisticsEventTrigger,
  secondPermit,
  secondStatisticCommitment,
  secondStatisticsEventTrigger,
  thirdStatisticCommitment,
  thirdStatisticsEventTrigger,
} from '../ergo/statistics/mockUtils';

import txObj from '../ergo/dataset/tx.json' assert { type: 'json' };

const observation2Status = {
  observation: observationEntity2,
  status: TxStatus.NOT_COMMITTED,
};
let blockRepo: Repository<BlockEntity>;
let observationRepo: Repository<ObservationEntity>;

export type ORMType = {
  DB: WatcherDataBase;
  blockRepo: Repository<BlockEntity>;
  observationRepo: Repository<ObservationEntity>;
  observationStatusRepo: Repository<ObservationStatusEntity>;
  commitmentRepo: Repository<CommitmentEntity>;
  permitRepo: Repository<PermitEntity>;
  boxRepo: Repository<BoxEntity>;
  eventTriggerRepo: Repository<EventTriggerEntity>;
  transactionRepo: Repository<TxEntity>;
};

/**
 * Initiate and migrate databases for test environment
 * @param name
 */
export const loadDataBase = async (name: string): Promise<ORMType> => {
  const ormConfig = new DataSource({
    type: 'sqlite',
    database: `./sqlite/watcher-test-${name}.sqlite`,
    entities: [
      BlockEntity,
      BoxEntity,
      CommitmentEntity,
      EventTriggerEntity,
      ObservationEntity,
      ObservationStatusEntity,
      PermitEntity,
      TxEntity,
    ],
    migrations: [
      ...addressExtractorMigrations.sqlite,
      ...observationMigrations.sqlite,
      ...scannerMigrations.sqlite,
      ...watcherDataExtractorMigrations.sqlite,
      ...migrations,
    ],
    synchronize: false,
    logging: false,
  });

  await ormConfig.initialize();
  await ormConfig.runMigrations();
  const blockRepo = ormConfig.getRepository(BlockEntity);
  const observationRepo = ormConfig.getRepository(ObservationEntity);
  const observationStatusRepo = ormConfig.getRepository(
    ObservationStatusEntity
  );
  const commitmentRepo = ormConfig.getRepository(CommitmentEntity);
  const permitRepo = ormConfig.getRepository(PermitEntity);
  const boxRepo = ormConfig.getRepository(BoxEntity);
  const eventTriggerRepo = ormConfig.getRepository(EventTriggerEntity);
  const transactionRepo = ormConfig.getRepository(TxEntity);

  return {
    DB: new WatcherDataBase(ormConfig),
    blockRepo: blockRepo,
    observationRepo: observationRepo,
    observationStatusRepo: observationStatusRepo,
    commitmentRepo: commitmentRepo,
    permitRepo: permitRepo,
    boxRepo: boxRepo,
    eventTriggerRepo: eventTriggerRepo,
    transactionRepo: transactionRepo,
  };
};

/**
 *  Filling ORM test databases with mocked data
 * @param ORM
 */
export const fillORM = async (ORM: ORMType) => {
  await ORM.blockRepo.save([ergoBlockEntity, cardanoBlockEntity]);
  await ORM.observationRepo.save([observationEntity2]);
  await ORM.observationStatusRepo.save([
    { observation: observationEntity2, status: TxStatus.NOT_COMMITTED },
  ]);
  await ORM.commitmentRepo.save([
    commitmentEntity,
    spentCommitmentEntity,
    firstStatisticCommitment,
    secondStatisticCommitment,
    thirdStatisticCommitment,
  ]);
  await ORM.permitRepo.save([
    permitEntity,
    spentPermitEntity,
    firstPermit,
    secondPermit,
  ]);
  await ORM.boxRepo.save([plainBox, spentPlainBox]);
  await ORM.eventTriggerRepo.save([
    eventTriggerEntity,
    newEventTriggerEntity,
    firstStatisticsEventTrigger,
    secondStatisticsEventTrigger,
    thirdStatisticsEventTrigger,
  ]);
};

describe('WatcherModel tests', () => {
  let DB: WatcherDataBase;
  before('inserting into database', async () => {
    const ORM = await loadDataBase('networkDataBase');
    await fillORM(ORM);
    DB = ORM.DB;
    blockRepo = ORM.blockRepo;
    observationRepo = ORM.observationRepo;
  });

  describe('getLastBlockHeight', () => {
    /**
     * Target: testing getLastBlockHeight
     * Expected Output:
     *    The function should return the ergo chain last block height
     */
    it('Should return the last block height on ergo', async () => {
      const res = await DB.getLastBlockHeight(Constants.ERGO_WATCHER);
      expect(res).to.eql(ergoBlockEntity.height);
    });

    /**
     * Target: testing getLastBlockHeight
     * Expected Output:
     *    The function should return the cardano chain last block height
     */
    it('Should return the last block height on cardano', async () => {
      const res = await DB.getLastBlockHeight(Constants.CARDANO_WATCHER);
      expect(res).to.eql(cardanoBlockEntity.height);
    });

    /**
     * Target: testing getLastBlockHeight
     * Expected Output:
     *    The function should throw an error since the config is not correct
     */
    it('Should throw an error since network name is wrong', async () => {
      await expect(DB.getLastBlockHeight('WrongNet')).to.rejectedWith(Error);
    });

    /**
     * Target: testing getLastBlockHeight
     * Expected Output:
     *    The function should throw an error since the database has a problem
     */
    it('Should throw error since no block is saved on ergo', async () => {
      await blockRepo.clear();
      await expect(DB.getLastBlockHeight('Ergo')).to.rejectedWith(Error);
    });
  });

  describe('setStatusForObservations', () => {
    /**
     * Target: testing setStatusForObservations
     * Expected Output:
     *    The function should return one observation
     */
    it('should return one observation', async () => {
      const res = await DB.getStatusForObservations(observationEntity2);
      expect(res).not.to.be.null;
      if (res !== null) {
        expect(res.status).to.be.eql(observation2Status.status);
      }
    });

    /**
     * Target: testing setStatusForObservations
     * Expected Output:
     *    The function should return zero observation
     */
    it('should return zero observation', async () => {
      const res = await DB.getStatusForObservations(observationEntity1);
      expect(res).to.be.null;
    });
  });

  describe('setStatusForObservations', () => {
    /**
     * Target: testing setStatusForObservations
     * Expected Output:
     *    The function should return status for observation that exist
     */
    it('should return status for observation that exist', async () => {
      const res = await DB.checkNewObservation(observationEntity2);
      expect(res.status).to.be.eql(1);
    });

    /**
     * Target: testing setStatusForObservations
     * Expected Output:
     *    The function should set status for observation that is not exist
     */
    it('should set status for observation that is not exist', async () => {
      await observationRepo.insert([observationEntity1]);
      const res = await DB.checkNewObservation(observationEntity1);
      expect(res.status).to.be.eql(1);
    });
  });

  describe('submitTx', () => {
    /**
     * Target: testing submitTx
     * Expected Output:
     *    The function should store two transactions in the database
     */
    it('should save two new transaction without any errors', async () => {
      const commitmentTx = wasm.Transaction.from_json(
        JSON.stringify(commitmentTxJson)
      );
      await DB.submitTx(
        Buffer.from(commitmentTx.sigma_serialize_bytes()).toString('base64'),
        'reqId1',
        commitmentTx.id().to_str(),
        TxType.COMMITMENT,
        1000
      );
      const tx = wasm.Transaction.from_json(JSON.stringify(txObj));
      await DB.submitTx(
        Buffer.from(tx.sigma_serialize_bytes()).toString('base64'),
        'reqId1',
        tx.id().to_str(),
        TxType.TRIGGER,
        1000
      );
    });
  });

  describe('trackTxQueue', () => {
    /**
     * Target: testing trackTxQueue
     * Dependencies: -
     * Test Procedure:
     *    - mock function inputs
     *    - call function
     *    - verify the output
     * Expected Output:
     *    The test should return the tracked box from database
     */
    it('should return tracked permit box in tx queue', async () => {
      const commitmentTx = wasm.Transaction.from_json(
        JSON.stringify(commitmentTxJson)
      );
      const box = wasm.ErgoBox.from_json(JSON.stringify(permitBox));
      const res = await DB.trackTxQueue(box);
      expect(res.box_id().to_str()).to.eq(
        commitmentTx.outputs().get(0).box_id().to_str()
      );
    });
  });

  describe('getAllTxs and removeTx', () => {
    /**
     * Target: testing getAllTxs
     * Expected Output:
     *    The test should return two stored transactions
     */
    it('should return two available txs', async () => {
      const data = await DB.getAllTxs();
      expect(data).to.have.length(2);
    });

    /**
     * Target: testing removeTx
     * Expected Output:
     *    The test should remove first stored transaction
     */
    it('should remove a tx', async () => {
      const txs = await DB.getAllTxs();
      const data = await DB.removeTx(txs[0]);
      expect(data.deleted).to.true;
    });

    /**
     * Target: testing getAllTxs
     * Expected Output:
     *    The test should return one remaining transaction
     */
    it('should return one available tx', async () => {
      const data = await DB.getAllTxs();
      expect(data).to.have.length(1);
    });
  });

  describe('updateTxTime', () => {
    /**
     * Target: testing updateTxTime
     * Expected Output:
     *    The function should set the update height
     */
    it('should update the tx time', async () => {
      const txs = await DB.getAllTxs();
      const data = await DB.setTxUpdateHeight(txs[0], 150);
      expect(data.updateBlock).to.eql(150);
    });
  });

  describe('upgradeObservationTxStatus', () => {
    /**
     * Target: testing upgradeObservationTxStatus
     * Expected Output:
     *    The function should upgrade the tx status to the commitment_sent status
     */
    it('should upgrade the observation txStatus', async () => {
      const obs = await DB.getConfirmedObservations(0, 100);
      const res = await DB.upgradeObservationTxStatus(obs[0]);
      expect(res.status).to.eql(TxStatus.COMMITMENT_SENT);
    });

    /**
     * Target: testing upgradeObservationTxStatus
     * Expected Output:
     *    The function should not change the observation status since it's timed out
     */
    it('should not upgrade the timed out observation txStatus', async () => {
      const obs = await DB.getConfirmedObservations(0, 100);
      await DB.updateObservationTxStatus(obs[0], TxStatus.TIMED_OUT);
      const res = await DB.upgradeObservationTxStatus(obs[0]);
      expect(res.status).to.eql(TxStatus.TIMED_OUT);
    });
  });

  describe('downgradeObservationTxStatus', () => {
    /**
     * Target: testing downgradeObservationTxStatus
     * Expected Output:
     *    The function should downgrade the tx status to the not_committed status
     */
    it('should downgrade the observation txStatus', async () => {
      const obs = await DB.getConfirmedObservations(0, 100);
      await DB.updateObservationTxStatus(obs[0], TxStatus.COMMITMENT_SENT);
      const res = await DB.downgradeObservationTxStatus(obs[0]);
      expect(res.status).to.eql(TxStatus.NOT_COMMITTED);
    });

    /**
     * Target: testing downgradeObservationTxStatus
     * Expected Output:
     *    The function should not downgrade the tx status since its already merged
     */
    it('should downgrade the observation txStatus', async () => {
      const obs = await DB.getConfirmedObservations(0, 100);
      await DB.updateObservationTxStatus(obs[0], TxStatus.REVEALED);
      const res = await DB.downgradeObservationTxStatus(obs[0]);
      expect(res.status).to.eql(TxStatus.REVEALED);
    });
  });

  describe('updateObservationTxStatus', () => {
    /**
     * Target: testing updateObservationTxStatus
     * Expected Output:
     *    The function should update the tx status to the revealed status
     */
    it('should update the observation txStatus to revealed', async () => {
      const obs = await DB.getConfirmedObservations(0, 100);
      const res = await DB.updateObservationTxStatus(obs[0], TxStatus.REVEALED);
      expect(res.status).to.eql(TxStatus.REVEALED);
    });
  });

  describe('getOldSpentCommitments', () => {
    /**
     * Target: testing getOldSpentCommitments
     * Expected Output:
     *    The function should return one old commitment
     */
    it('should return an old commitment', async () => {
      const data = await DB.getOldSpentCommitments(3433335);
      expect(data).to.have.length(1);
    });
  });

  describe('commitmentsByEventId', () => {
    /**
     * Target: testing commitmentsByEventId
     * Expected Output:
     *    The function should return two commitments with the event id
     */
    it('should return two commitments with specified event id', async () => {
      const data = await DB.commitmentsByEventId('eventId');
      expect(data).to.have.length(2);
    });
  });

  describe('findCommitmentsById', () => {
    /**
     * Target: testing findCommitmentsById
     * Expected Output:
     *    The function should return two commitments with the box ids
     */
    it('should return exactly two commitments with the specified box id', async () => {
      const data = await DB.findCommitmentsById([
        commitmentEntity.boxId,
        spentCommitmentEntity.boxId,
      ]);
      expect(data).to.have.length(2);
      expect(data[0]).to.eql(commitmentEntity);
      expect(data[1]).to.eql(spentCommitmentEntity);
    });
  });

  describe('commitmentByWID', () => {
    /**
     * Target: testing commitmentByWID
     * Expected Output:
     *    The function should return one specific commitment
     */
    it('should return first commitment with specific WID', async () => {
      const data = await DB.commitmentByWID('WIDStatistics', 0, 1);
      expect(data).to.be.eql([firstStatisticCommitment]);
    });

    /**
     * Target: testing commitmentByWID
     * Expected Output:
     *    The function should return two specific commitment
     */
    it('should return two commitment with specific WID with offset 1', async () => {
      const data = await DB.commitmentByWID('WIDStatistics', 1, 2);
      expect(data).to.be.eql([
        secondStatisticCommitment,
        thirdStatisticCommitment,
      ]);
    });
  });

  describe('commitmentsByWIDCount', () => {
    /**
     * Target: testing commitmentsByWIDCount
     * Expected Output:
     *    The function should return 3
     */
    it('should return counts of commitments with specific WID', async () => {
      const data = await DB.commitmentsByWIDCount('WIDStatistics');
      expect(data).to.be.equal(3);
    });
  });

  describe('eventTriggersByWIDCount', () => {
    /**
     * Target: testing eventTriggersByWIDCount
     * Expected Output:
     *    The function should return 3
     */
    it('should return counts of eventTriggers that have specific WID in them', async () => {
      const data = await DB.eventTriggersByWIDCount('WIDStatistics');
      expect(data).to.be.equal(3);
    });
  });

  describe('eventTriggersByWID', () => {
    /**
     * Target: testing commitmentByWID
     * Expected Output:
     *    The function should return one specific eventTrigger
     */
    it('should return first eventTrigger with specific WID', async () => {
      const data = await DB.eventTriggersByWID('WIDStatistics', 0, 1);
      expect(data).to.be.eql([firstStatisticsEventTrigger]);
    });

    /**
     * Target: testing commitmentByWID
     * Expected Output:
     *    The function should return two specific eventTriggers
     */
    it('should return two commitment with specific WID with offset 1', async () => {
      const data = await DB.eventTriggersByWID('WIDStatistics', 1, 2);
      expect(data).to.be.eql([
        secondStatisticsEventTrigger,
        thirdStatisticsEventTrigger,
      ]);
    });
  });

  describe('findCommitmentsById', () => {
    /**
     * Target: testing findCommitmentsById
     * Expected Output:
     *    The function should return two commitments with the box ids
     */
    it('should return exactly two commitments with the specified box id', async () => {
      const data = await DB.findCommitmentsById([
        commitmentEntity.boxId,
        spentCommitmentEntity.boxId,
      ]);
      expect(data).to.have.length(2);
      expect(data[0]).to.eql(commitmentEntity);
      expect(data[1]).to.eql(spentCommitmentEntity);
    });
  });

  describe('deleteCommitments', () => {
    /**
     * Target: testing getOldSpentCommitments
     * Expected Output:
     *    The function should delete two commitments with the box ids
     */
    it('should delete two commitments with specified ids', async () => {
      await DB.deleteCommitments([
        commitmentEntity.boxId,
        spentCommitmentEntity.boxId,
      ]);
      const data = await DB.getOldSpentCommitments(3433335);
      expect(data).to.have.length(0);
    });
  });

  describe('getUnspentPermitBoxes', () => {
    /**
     * Target: testing getUnspentPermitBoxes
     * Expected Output:
     *    The function should return one unspent permit box
     */
    it('should find one unspent permit box', async () => {
      const data = await DB.getUnspentPermitBoxes('WID');
      expect(data).to.have.length(1);
      expect(data[0]).to.eql(permitEntity);
    });
  });

  describe('getUnspentPlainBoxes', () => {
    /**
     * Target: testing getUnspentPlainBoxes
     * Expected Output:
     *    The function should return one unspent address box
     */
    it('should find one unspent plain box', async () => {
      const data = await DB.getUnspentAddressBoxes();
      expect(data).to.have.length(1);
      expect(data[0]).to.eql(plainBox);
    });
  });

  describe('eventTriggerBySourceTxId', () => {
    /**
     * Target: testing eventTriggerBySourceTxId
     * Expected Output:
     *    The function should return one unspent trigger box
     */
    it('should find one unspent event trigger box', async () => {
      const data = await DB.eventTriggerBySourceTxId(
        eventTriggerEntity.sourceTxId
      );
      expect(data).to.eql(eventTriggerEntity);
    });
  });
});
