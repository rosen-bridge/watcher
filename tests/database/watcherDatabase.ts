import { expect } from 'chai';
import { describe } from 'mocha';
import { DataSource, Repository, MigrationInterface } from 'typeorm';
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
  CollateralEntity,
  migrations as watcherDataExtractorMigrations,
} from '@rosen-bridge/watcher-data-extractor';

import {
  ObservationStatusEntity,
  TxStatus,
} from '../../src/database/entities/observationStatusEntity';
import { TxEntity, TxType } from '../../src/database/entities/txEntity';

import migrations from '../../src/database/migrations';

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
  revenue1,
  revenue2,
  revenue3,
  revenue4,
  spentCommitmentEntity,
  spentCommitmentEntityOfWID,
  spentPermitEntity,
  spentPlainBox,
  tokenRecord,
  validRSNTokenRecord,
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
import { createMemoryDatabase } from '../resources/inMemoryDb';
import { TokenEntity } from '../../src/database/entities/tokenEntity';
import { RevenueView } from '../../src/database/entities/revenueView';
import { RevenueEntity } from '../../src/database/entities/revenueEntity';
import { RevenueChartDataView } from '../../src/database/entities/revenueChartDataView';


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
  revenueRepo: Repository<RevenueEntity>;
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
    RevenueView,
    RevenueEntity,
    RevenueChartDataView,
    CollateralEntity,
  ];
  const ormConfig = new DataSource({
    type: 'sqlite',
    database: ':memory:',
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
  const revenueRepo = ormConfig.getRepository(RevenueEntity);
  if (clean) {
    for (const entity of entities.reverse()) {
      if (entity === RevenueView || entity === RevenueChartDataView) continue;
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
    revenueRepo: revenueRepo,
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
  pushExtraObservation = false,
  pushRevenues = true
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
  await ORM.tokenRepo.save(validRSNTokenRecord);
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
      validRSNTokenRecord,
    ]);

  if (pushRevenues)
    await ORM.revenueRepo.save([revenue1, revenue2, revenue3, revenue4]);
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
      const res = await DB.getLastBlockHeight(Constants.ERGO_CHAIN_NAME);
      expect(res).to.eql(ergoBlockEntity.height);
    });

    /**
     * Target: testing getLastBlockHeight
     * Expected Output:
     *    The function should return the cardano chain last block height
     */
    it('Should return the last block height on cardano', async () => {
      const res = await DB.getLastBlockHeight(Constants.CARDANO_CHAIN_NAME);
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
      const res = await DB.checkNewObservation(observationEntity2, undefined);
      expect(res.status).to.be.eql(TxStatus.NOT_COMMITTED);
    });

    /**
     * Target: testing setStatusForObservations
     * Expected Output:
     *    The function should set status for observation that is not exist
     */
    it('should set status for observation that is not exist', async () => {
      await observationRepo.insert([observationEntity1]);
      const res = await DB.checkNewObservation(observationEntity1, undefined);
      expect(res.status).to.be.eql(TxStatus.NOT_COMMITTED);
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
      firstStatisticCommitment;
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
      expect(data!.deleted).to.true;
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

  describe('commitmentsByEventId', () => {
    /**
     * Target: testing commitmentsByEventId
     * Expected Output:
     *    The function should return one unspent commitment with the event id
     */
    it('should return one unspent commitment with specified event id', async () => {
      const data = await DB.commitmentsByEventId('eventId');
      expect(data).to.have.length(1);
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

  describe('commitmentsBySpendTxId', () => {
    /**
     * Target: testing commitmentsBySpendTxId
     * Expected Output:
     *    The function should return one commitment
     */
    it('should return one commitment', async () => {
      await commitmentRepo.insert(spentCommitmentEntityOfWID);
      const data = await DB.commitmentsBySpendTxId('spendTx');
      expect(data).to.have.length(1);
      await commitmentRepo.delete({
        eventId: spentCommitmentEntityOfWID.eventId,
      });
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

  describe('eventTriggerByEventId', () => {
    /**
     * Target: testing eventTriggerByEventId
     * Expected Output:
     *    The function should return one unspent trigger box
     */
    it('should find one unspent event trigger box', async () => {
      const data = await DB.eventTriggerByEventId(eventTriggerEntity.eventId);
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
      tokenRecord2.tokenId = 'tokenId22';
      tokenRecord2.tokenName = 'tokenName2';
      tokenRecord2.decimals = 0;

      // insert the tokenRecord
      await DB.insertTokenEntity(
        tokenRecord2.tokenId,
        tokenRecord2.tokenName,
        tokenRecord2.decimals
      );

      // run getTokenEntity with new tokenRecord id
      const data = await DB.getTokenEntity([tokenRecord2.tokenId]);

      // check the result
      expect(data).to.have.length(1);
      expect(data[0]).to.eql(tokenRecord2);
    });
  });

  describe('getUnspentBoxesByBoxIds', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM, true);
      DB = ORM.DB;
      blockRepo = ORM.blockRepo;
      observationRepo = ORM.observationRepo;
      observationStatusRepo = ORM.observationStatusRepo;
      commitmentRepo = ORM.commitmentRepo;
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
     * @target WatcherDataBase.getUnspentBoxesByBoxIds should return unspent boxes excluding boxIds
     * @dependencies
     * @scenario
     * - run the function with boxId excluding
     * - check the result
     * @expected
     * - should return one unspent box excluding the specified boxId
     * - data[0] should be equal to the addressValidBox
     */
    it('should return unspent boxes excluding boxIds', async () => {
      // run the function with boxId excluding
      const result = await DB.getUnspentBoxesByBoxIds(['boxId'], true);
      // check the result
      expect(result).to.have.length(1);
      expect(result[0]).to.eql(addressValidBox);
      expect(result[0].boxId).to.not.eql('boxId');
    });
  });

  describe('getActivePermitTransactions', () => {
    let memoryDb: DataSource;
    let watcherDb: WatcherDataBase;

    before(async () => {
      memoryDb = await createMemoryDatabase();
      watcherDb = new WatcherDataBase(memoryDb);
    });
    /**
     * @target WatcherDataBase.getActivePermitTransactions should get txs
     * which their 'deleted' field is false
     * @dependencies
     * @scenario
     * - insert two permit txs (one active, one deleted)
     * - run the function
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to the permitEntity
     */
    it(`should get txs which their 'deleted' field is false`, async () => {
      // insert two permit txs (one active, one deleted)
      await watcherDb.submitTx('mockedTx1', 'mockedTxId1', TxType.PERMIT, 100);
      const mockedTx1 = (await watcherDb.getActivePermitTransactions())[0];
      await watcherDb.removeTx(mockedTx1);
      await watcherDb.submitTx('mockedTx2', 'mockedTxId2', TxType.PERMIT, 100);

      // run the function
      const data = await watcherDb.getActivePermitTransactions();

      // check the result
      expect(data).to.have.length(1);
      expect(data[0].txId).to.eql('mockedTxId2');
    });
  });
});
