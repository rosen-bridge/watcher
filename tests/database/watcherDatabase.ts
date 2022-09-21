import { DataSource, Repository } from 'typeorm';
import { WatcherDataBase } from '../../src/database/models/watcherModel';
import { describe } from 'mocha';
import { TxType } from '../../src/database/entities/txEntity';
import {
  cardanoBlockEntity,
  commitmentEntity,
  ergoBlockEntity,
  eventTriggerEntity,
  newEventTriggerEntity,
  observationEntity1,
  observationEntity2,
  permitEntity,
  plainBox,
  spentCommitmentEntity,
  spentPermitEntity,
  spentPlainBox,
} from './mockedData';
import {
  ObservationStatusEntity,
  TxStatus,
} from '../../src/database/entities/observationStatusEntity';
import { BlockEntity } from '@rosen-bridge/scanner';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';

import { expect } from 'chai';
import {
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
} from '@rosen-bridge/watcher-data-extractor';
import { BoxEntity } from '@rosen-bridge/address-extractor';
import { Constants } from '../../src/config/constants';

const observation2Status = {
  observation: observationEntity2,
  status: TxStatus.NOT_COMMITTED,
};
let blockRepo: Repository<BlockEntity>;
let observationRepo: Repository<ObservationEntity>;
let observationStatusRepo: Repository<ObservationStatusEntity>;
let commitmentRepo: Repository<CommitmentEntity>;
let permitRepo: Repository<PermitEntity>;
let boxRepo: Repository<BoxEntity>;
let eventTriggerRepo: Repository<EventTriggerEntity>;

export const loadDataBase = async (name: string): Promise<WatcherDataBase> => {
  const ormConfig = new DataSource({
    type: 'sqlite',
    database: `./sqlite/watcher-test-${name}.sqlite`,
    entities: [
      'src/database/entities/*.ts',
      'node_modules/@rosen-bridge/scanner/dist/entities/*.js',
      'node_modules/@rosen-bridge/watcher-data-extractor/dist/entities/*.js',
      'node_modules/@rosen-bridge/observation-extractor/dist/entities/*.js',
      'node_modules/@rosen-bridge/address-extractor/dist/entities/*.js',
    ],
    migrations: ['src/database/migrations/watcher/*.ts'],
    synchronize: false,
    logging: false,
  });

  await ormConfig.initialize();
  await ormConfig.runMigrations();
  blockRepo = ormConfig.getRepository(BlockEntity);
  observationRepo = ormConfig.getRepository(ObservationEntity);
  observationStatusRepo = ormConfig.getRepository(ObservationStatusEntity);
  commitmentRepo = ormConfig.getRepository(CommitmentEntity);
  permitRepo = ormConfig.getRepository(PermitEntity);
  boxRepo = ormConfig.getRepository(BoxEntity);
  eventTriggerRepo = ormConfig.getRepository(EventTriggerEntity);
  return new WatcherDataBase(ormConfig);
};

describe('WatcherModel tests', () => {
  let DB: WatcherDataBase;
  before('inserting into database', async () => {
    DB = await loadDataBase('networkDataBase');
    await blockRepo.save([ergoBlockEntity, cardanoBlockEntity]);
    await observationRepo.save([observationEntity2]);
    await observationStatusRepo.save([
      { observation: observationEntity2, status: TxStatus.NOT_COMMITTED },
    ]);
    await commitmentRepo.save([commitmentEntity, spentCommitmentEntity]);
    await permitRepo.save([permitEntity, spentPermitEntity]);
    await boxRepo.save([plainBox, spentPlainBox]);
    await eventTriggerRepo.save([eventTriggerEntity, newEventTriggerEntity]);
  });

  describe('getLastBlockHeight', () => {
    /**
     * Target: testing getLastBlockHeight
     * Expected Output:
     *    The function should return the ergo chain last block height
     */
    it('Should return the last block height on ergo', async () => {
      const res = await DB.getLastBlockHeight(Constants.ergoNode);
      expect(res).to.eql(ergoBlockEntity.height);
    });

    /**
     * Target: testing getLastBlockHeight
     * Expected Output:
     *    The function should return the cardano chain last block height
     */
    it('Should return the last block height on cardano', async () => {
      const res = await DB.getLastBlockHeight(Constants.cardanoKoios);
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
      await DB.submitTx(
        'txSerialized',
        'reqId1',
        'txId',
        TxType.COMMITMENT,
        1000
      );
      await DB.submitTx(
        'txSerialized2',
        'reqId1',
        'txId2',
        TxType.TRIGGER,
        1000
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
  });

  describe('downgradeObservationTxStatus', () => {
    /**
     * Target: testing downgradeObservationTxStatus
     * Expected Output:
     *    The function should downgrade the tx status to the not_committed status
     */
    it('should upgrade the observation txStatus', async () => {
      const obs = await DB.getConfirmedObservations(0, 100);
      const res = await DB.downgradeObservationTxStatus(obs[0]);
      expect(res.status).to.eql(TxStatus.NOT_COMMITTED);
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
