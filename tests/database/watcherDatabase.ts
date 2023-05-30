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
  PermitEntity,
  migrations as watcherDataExtractorMigrations,
} from '@rosen-bridge/watcher-data-extractor';

import {
  ObservationStatusEntity,
  TxStatus,
} from '../../src/database/entities/observationStatusEntity';
import { TxEntity, TxType } from '../../src/database/entities/txEntity';

import migrations from '../../src/database/migrations/watcher';

import { WatcherDataBase } from '../../src/database/models/watcherModel';

import {
  addressValidBox,
  cardanoBlockEntity,
  commitmentEntity,
  commitmentTxJson,
  ergoBlockEntity,
  eventTriggerEntity,
  newEventTriggerEntity,
  observationEntity1,
  observationEntity2,
  observationEntity3,
  observationEntity4,
  permitBox,
  permitEntity,
  plainBox,
  spentCommitmentEntity,
  spentCommitmentEntityOfWID,
  spentPermitEntity,
  spentPlainBox,
  tokenRecord,
  validToken1Record,
  validToken2Record,
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
import { TokenEntity } from '../../src/database/entities/tokenEntity';

const observation2Status = {
  observation: observationEntity2,
  status: TxStatus.NOT_COMMITTED,
};
let blockRepo: Repository<BlockEntity>;
let observationRepo: Repository<ObservationEntity>;
let observationStatusRepo: Repository<ObservationStatusEntity>;
let commitmentRepo: Repository<CommitmentEntity>;

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
  tokenRepo: Repository<TokenEntity>;
};

/**
 * Initiate and migrate databases for test environment
 * @param clean: clean database after connecting
 */
export const loadDataBase = async (clean = true): Promise<ORMType> => {
  const entities = [
    BlockEntity,
    BoxEntity,
    ObservationEntity,
    CommitmentEntity,
    EventTriggerEntity,
    PermitEntity,
    ObservationStatusEntity,
    TxEntity,
    TokenEntity,
  ];
  const ormConfig = new DataSource({
    type: 'sqlite',
    database: './sqlite/watcher-test.sqlite',
    entities: entities,
    migrations: [
      ...addressExtractorMigrations.sqlite,
      ...observationMigrations.sqlite,
      ...scannerMigrations.sqlite,
      ...watcherDataExtractorMigrations.sqlite,
      ...migrations.sqlite,
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
  const tokenRepo = ormConfig.getRepository(TokenEntity);
  if (clean) {
    for (const entity of entities.reverse()) {
      await ormConfig
        .getRepository(entity)
        .createQueryBuilder()
        .delete()
        .execute();
    }
  }
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
    tokenRepo: tokenRepo,
  };
};

/**
 *  Filling ORM test databases with mocked data
 * @param ORM
 */
export const fillORM = async (
  ORM: ORMType,
  pushExtraUtxo = false,
  saveTokenNames = true,
  pushExtraObservation = false
) => {
  await ORM.blockRepo.save([ergoBlockEntity, cardanoBlockEntity]);
  const observationArray = [observationEntity2];
  if (pushExtraObservation) observationArray.push(observationEntity4);
  await ORM.observationRepo.save(observationArray);
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
  const UTXOArray = [plainBox, spentPlainBox];
  if (pushExtraUtxo) UTXOArray.push(addressValidBox);
  await ORM.boxRepo.save(UTXOArray);
  await ORM.eventTriggerRepo.save([
    eventTriggerEntity,
    newEventTriggerEntity,
    firstStatisticsEventTrigger,
    secondStatisticsEventTrigger,
    thirdStatisticsEventTrigger,
  ]);
  if (saveTokenNames)
    await ORM.tokenRepo.save([
      tokenRecord,
      validToken1Record,
      validToken2Record,
    ]);
};

describe('WatcherModel tests', () => {
  let DB: WatcherDataBase;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    DB = ORM.DB;
    blockRepo = ORM.blockRepo;
    observationRepo = ORM.observationRepo;
    observationStatusRepo = ORM.observationStatusRepo;
    commitmentRepo = ORM.commitmentRepo;
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
        commitmentTx.id().to_str(),
        TxType.COMMITMENT,
        1000,
        'reqId1'
      );
      const tx = wasm.Transaction.from_json(JSON.stringify(txObj));
      await DB.submitTx(
        Buffer.from(tx.sigma_serialize_bytes()).toString('base64'),
        tx.id().to_str(),
        TxType.TRIGGER,
        1000,
        'reqId1'
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

    /**
     * Target: testing upgradeObservationTxStatus
     * Expected Output:
     *    The function should upgrade the status from COMMITED to REDEEM_SENT
     */
    it('should upgrade the observation txStatus from COMMITED to REDEEM_SENT', async () => {
      await observationRepo.insert(observationEntity3);
      await observationStatusRepo.insert({
        observation: observationEntity3,
        status: TxStatus.COMMITTED,
      });
      const res = await DB.upgradeObservationTxStatus(observationEntity3, true);
      expect(res.status).to.eql(TxStatus.REDEEM_SENT);
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

    /**
     * Target: testing downgradeObservationTxStatus
     * Expected Output:
     *    The function should downgrade the status from REDEEM_SENT to COMMITED
     */
    it('should downgrade the observation txStatus', async () => {
      const res = await DB.downgradeObservationTxStatus(
        observationEntity3,
        true
      );
      expect(res.status).to.eql(TxStatus.COMMITTED);
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

  describe('getObservationsByStatus', () => {
    /**
     * Target: testing getObservationsByStatus
     * Expected Output:
     *    The function should return one commited observation
     */
    it('should return one commited observation', async () => {
      const data = await DB.getObservationsByStatus(TxStatus.COMMITTED);
      expect(data).to.have.length(1);
      expect(data[0].observation.requestId).to.equal(
        observationEntity3.requestId
      );
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

  describe('commitmentsByWIDAndMaxHeight', () => {
    /**
     * Target: testing commitmentsByWIDAndMaxHeight
     * Expected Output:
     *    The function should return one commitment
     */
    it('should return one commitment', async () => {
      await commitmentRepo.insert(spentCommitmentEntityOfWID);
      const data = await DB.commitmentsByWIDAndMaxHeight('WID', 1000);
      expect(data).to.have.length(1);
      await commitmentRepo.delete({
        eventId: spentCommitmentEntityOfWID.eventId,
      });
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

  describe('getTokenEntity', () => {
    /**
     * @target WatcherDataBase.getTokenEntity should find
     * all token entities in ids array
     * @dependencies
     * @scenario
     * - run getTokenEntity with tokenRecord.tokenId
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to tokenRecord
     */
    it('should find all token entities in ids array', async () => {
      // run getTokenEntity with tokenRecord.tokenId
      const data = await DB.getTokenEntity([tokenRecord.tokenId]);

      // check the result
      expect(data).to.have.length(1);
      expect(data[0]).to.eql(tokenRecord);
    });
  });

  describe('insertTokenEntity', () => {
    /**
     * @target WatcherDataBase.getTokenEntity should insert
     * token record successfully
     * @dependencies
     * @scenario
     * - mock a new tokenRecord
     * - insert the tokenRecord
     * - run getTokenEntity with new tokenRecord id
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to the new tokenRecord
     */
    it('should insert token record successfully', async () => {
      // mock a new tokenRecord
      const tokenRecord2 = new TokenEntity();
      tokenRecord2.tokenId = 'tokenId2';
      tokenRecord2.tokenName = 'tokenName2';

      // insert the tokenRecord
      await DB.insertTokenEntity(tokenRecord2.tokenId, tokenRecord2.tokenName);

      // run getTokenEntity with new tokenRecord id
      const data = await DB.getTokenEntity([tokenRecord2.tokenId]);

      // check the result
      expect(data).to.have.length(1);
      expect(data[0]).to.eql(tokenRecord2);
    });
  });

  describe('getPermitUnspentBoxes', () => {
    /**
     * @target WatcherDataBase.getPermitUnspentBoxes should get all
     * unspent permit boxes
     * @dependencies
     * @scenario
     * - run the function
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to the permitEntity
     */
    it('should get all unspent permit boxes', async () => {
      // run the function
      const data = await DB.getPermitUnspentBoxes();

      // check the result
      expect(data).to.have.length(1);
      expect(data[0]).to.eql(permitEntity);
    });
  });

  describe('getUnspentBoxesByBoxIds', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM, true);
    });

    /**
     * @target WatcherDataBase.getUnspentBoxesByBoxIds should return
     * unspent boxes including boxIds
     * @dependencies
     * @scenario
     * - run the function with boxId3 including
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to the addressValidBox
     */
    it('should return unspent boxes including boxIds', async () => {
      // run the function with boxId3 including
      const result = await DB.getUnspentBoxesByBoxIds(['boxId3']);

      // check the result
      expect(result).to.have.length(1);
      expect(result[0]).to.eql(addressValidBox);
    });

    /**
     * @target WatcherDataBase.getUnspentBoxesByBoxIds should return
     * unspent boxes excluding boxIds
     * @dependencies
     * @scenario
     * - run the function with boxId excluding
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to the addressValidBox
     */
    it('should return unspent boxes excluding boxIds', async () => {
      // run the function with boxId excluding
      const result = await DB.getUnspentBoxesByBoxIds(['boxId'], true);

      // check the result
      expect(result).to.have.length(1);
      expect(result[0]).to.eql(addressValidBox);
    });
  });
});
