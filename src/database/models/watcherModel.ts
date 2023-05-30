import {
  DataSource,
  In,
  IsNull,
  LessThan,
  Like,
  Not,
  Repository,
} from 'typeorm';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { TxEntity, TxType } from '../entities/txEntity';
import {
  ObservationStatusEntity,
  TxStatus,
} from '../entities/observationStatusEntity';
import { BlockEntity } from '@rosen-bridge/scanner';
import { PROCEED } from '@rosen-bridge/scanner/dist/entities/blockEntity';
import {
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
} from '@rosen-bridge/watcher-data-extractor';
import { BoxEntity } from '@rosen-bridge/address-extractor';
import { base64ToArrayBuffer } from '../../utils/utils';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { TokenEntity } from '../entities/tokenEntity';

class WatcherDataBase {
  private readonly blockRepository: Repository<BlockEntity>;
  private readonly observationRepository: Repository<ObservationEntity>;
  private readonly txRepository: Repository<TxEntity>;
  private readonly observationStatusEntity: Repository<ObservationStatusEntity>;
  private readonly commitmentRepository: Repository<CommitmentEntity>;
  private readonly permitRepository: Repository<PermitEntity>;
  private readonly boxRepository: Repository<BoxEntity>;
  private readonly eventTriggerRepository: Repository<EventTriggerEntity>;
  private readonly tokenRepository: Repository<TokenEntity>;

  constructor(dataSource: DataSource) {
    this.blockRepository = dataSource.getRepository(BlockEntity);
    this.observationRepository = dataSource.getRepository(ObservationEntity);
    this.txRepository = dataSource.getRepository(TxEntity);
    this.observationStatusEntity = dataSource.getRepository(
      ObservationStatusEntity
    );
    this.commitmentRepository = dataSource.getRepository(CommitmentEntity);
    this.permitRepository = dataSource.getRepository(PermitEntity);
    this.boxRepository = dataSource.getRepository(BoxEntity);
    this.eventTriggerRepository = dataSource.getRepository(EventTriggerEntity);
    this.tokenRepository = dataSource.getRepository(TokenEntity);
  }

  /**
   * returns the last saved block height based on the observing network
   * @param scanner: considering scanned blocks by this scanner
   */
  getLastBlockHeight = async (scanner: string): Promise<number> => {
    const lastBlock = await this.blockRepository.find({
      where: { status: PROCEED, scanner: scanner },
      order: { height: 'DESC' },
      take: 1,
    });
    if (lastBlock.length !== 0) {
      return lastBlock[0].height;
    }
    throw new Error('No block found or error in database connection');
  };

  /**
   * returns confirmed observation after required confirmation
   * ignores observations which have created commitments
   * @param confirmation
   * @param height
   */
  getConfirmedObservations = async (confirmation: number, height: number) => {
    const maxHeight = height - confirmation;
    return await this.observationRepository
      .createQueryBuilder('observation_entity')
      .where('observation_entity.height < :maxHeight', { maxHeight })
      .getMany();
  };

  /**
   * setting NOT_COMMITTED status for new observations that doesn't have status and return last status
   * @param observation
   */
  checkNewObservation = async (
    observation: ObservationEntity
  ): Promise<ObservationStatusEntity> => {
    const observationStatus = await this.getStatusForObservations(observation);
    if (!observationStatus) {
      await this.observationStatusEntity.insert({
        observation: observation,
        status: TxStatus.NOT_COMMITTED,
      });
      const insertedStatus = await this.getStatusForObservations(observation);
      if (insertedStatus === null) {
        throw new Error(
          `observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`
        );
      } else {
        return insertedStatus;
      }
    } else {
      return observationStatus;
    }
  };

  /**
   * Checking that if observation has status in observationStatus table or not
   * @param observation
   */
  getStatusForObservations = async (
    observation: ObservationEntity
  ): Promise<ObservationStatusEntity | null> => {
    return await this.observationStatusEntity.findOne({
      where: {
        observation: observation,
      },
    });
  };

  /**
   * gets observations by status
   * @param observation
   */
  getObservationsByStatus = async (
    status: TxStatus
  ): Promise<ObservationStatusEntity[]> => {
    return await this.observationStatusEntity.find({
      relations: ['observation'],
      where: {
        status: status,
      },
    });
  };

  /**
   * Stores a transaction in tx queue, the queue will process the transaction automatically afterward
   * @param tx
   * @param requestId
   * @param txId
   * @param txType
   * @param height
   */
  submitTx = async (
    tx: string,
    txId: string,
    txType: TxType,
    height: number,
    requestId?: string
  ) => {
    let observation: ObservationEntity | undefined | null = undefined;
    if (requestId) {
      observation = await this.observationRepository.findOne({
        where: { requestId: requestId },
      });
      if (!observation)
        throw new Error('Observation with this request id is not found');
      const observationStatus = await this.getStatusForObservations(
        observation
      );
      if (observationStatus === null)
        throw new Error(
          `observation with requestId ${observation.requestId} has no status`
        );
    }
    const time = new Date().getTime();
    return await this.txRepository.insert({
      txId: txId,
      txSerialized: tx,
      creationTime: time,
      updateBlock: height,
      observation: observation,
      type: txType,
      deleted: false,
    });
  };

  /**
   * Returns all stored transactions with no deleted flag
   */
  getAllTxs = async () => {
    return await this.txRepository
      .createQueryBuilder('tx_entity')
      .leftJoinAndSelect('tx_entity.observation', 'observation_entity')
      .where('tx_entity.deleted = false')
      .getMany();
  };

  /**
   * Removes one specified transaction (Just toggles the removed flag)
   * @param tx
   */
  removeTx = async (tx: TxEntity) => {
    tx.deleted = true;
    return this.txRepository.save(tx);
  };

  /**
   * Updates the tx checking time
   * @param tx
   * @param height
   */
  setTxUpdateHeight = async (tx: TxEntity, height: number) => {
    tx.updateBlock = height;
    return this.txRepository.save(tx);
  };

  /**
   * Upgrades the observation TxStatus, it means it had progressed creating transactions
   * @param observation
   * @param isRedeemSent true if this upgrade is due to sending commitment redeem transaction
   */
  upgradeObservationTxStatus = async (
    observation: ObservationEntity,
    isRedeemSent = false
  ) => {
    const observationStatus = await this.getStatusForObservations(observation);
    if (observationStatus === null)
      throw new Error(
        `observation with requestId ${observation.requestId} has no status`
      );
    if (!isRedeemSent)
      await this.observationStatusEntity.update(
        {
          id: observationStatus.id,
          status: Not(In([TxStatus.TIMED_OUT, TxStatus.REVEALED])),
        },
        {
          status: observationStatus.status + 1,
        }
      );
    else
      await this.observationStatusEntity.update(
        {
          id: observationStatus.id,
          status: TxStatus.COMMITTED,
        },
        {
          status: TxStatus.REDEEM_SENT,
        }
      );
    const updatedStatus = await this.getStatusForObservations(observation);
    if (updatedStatus === null) {
      throw new Error(
        `observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`
      );
    } else {
      return updatedStatus;
    }
  };

  /**
   * Downgrades the observation TxStatus, it means it had problems creating or sending transactions
   * @param observation
   * @param isRedeemSent true if this downgrade is about a commitment redeem transaction
   */
  downgradeObservationTxStatus = async (
    observation: ObservationEntity,
    isRedeemSent = false
  ) => {
    const observationStatus = await this.getStatusForObservations(observation);
    if (observationStatus === null)
      throw new Error(
        `observation with requestId ${observation.requestId} has no status`
      );
    if (!isRedeemSent)
      await this.observationStatusEntity.update(
        {
          id: observationStatus.id,
          status: Not(In([TxStatus.TIMED_OUT, TxStatus.REVEALED])),
        },
        {
          status: observationStatus.status - 1,
        }
      );
    else
      await this.observationStatusEntity.update(
        {
          id: observationStatus.id,
          status: TxStatus.REDEEM_SENT,
        },
        {
          status: TxStatus.COMMITTED,
        }
      );
    const updatedStatus = await this.getStatusForObservations(observation);
    if (updatedStatus === null) {
      throw new Error(
        `observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`
      );
    } else {
      return updatedStatus;
    }
  };

  /**
   * Update the observation TxStatus to the specified new status
   * @param observation
   * @param status
   */
  updateObservationTxStatus = async (
    observation: ObservationEntity,
    status: TxStatus
  ) => {
    const observationStatus = await this.getStatusForObservations(observation);
    if (observationStatus === null)
      throw new Error(
        `observation with requestId ${observation.requestId} has no status`
      );
    await this.observationStatusEntity.update(
      {
        id: observationStatus.id,
      },
      {
        status: status,
      }
    );
    const updatedStatus = await this.getStatusForObservations(observation);
    if (updatedStatus === null) {
      throw new Error(
        `observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`
      );
    } else {
      return updatedStatus;
    }
  };

  /**
   * returns spent commitments before the specified height
   * @param height
   */
  getOldSpentCommitments = async (height: number) => {
    return await this.commitmentRepository
      .createQueryBuilder('commitment_entity')
      .where('commitment_entity.spendHeight < :height', { height })
      .getMany();
  };

  /**
   * delete commitments by their box ids
   * @param ids
   */
  deleteCommitments = async (ids: Array<string>) => {
    await this.commitmentRepository.delete({ boxId: In(ids) });
  };

  /**
   * find commitments by their box ids
   * @param ids
   */
  findCommitmentsById = async (
    ids: Array<string>
  ): Promise<Array<CommitmentEntity>> => {
    return await this.commitmentRepository.find({
      where: {
        boxId: In(ids),
      },
    });
  };

  /**
   * Returns all commitments related to a specific event
   * @param eventId
   */
  commitmentsByEventId = async (
    eventId: string
  ): Promise<Array<CommitmentEntity>> => {
    return await this.commitmentRepository.find({
      where: {
        eventId: eventId,
      },
    });
  };

  /**
   * Returns all commitments with specific wid
   * @param wid
   * @param offset
   * @param limit
   */
  commitmentByWID = async (
    wid: string,
    offset: number,
    limit: number
  ): Promise<Array<CommitmentEntity>> => {
    return await this.commitmentRepository.find({
      where: {
        WID: wid,
      },
      take: limit,
      skip: offset,
    });
  };

  /**
   * returns commitments before a certain height with specific wid
   * @param wid
   * @param maxHeight
   */
  commitmentsByWIDAndMaxHeight = async (
    wid: string,
    maxHeight: number
  ): Promise<Array<CommitmentEntity>> => {
    return await this.commitmentRepository.find({
      where: {
        WID: wid,
        height: LessThan(maxHeight),
        spendHeight: IsNull(),
      },
    });
  };

  /**
   * Returns Count of all commitments with specific wid
   * @param wid
   */
  commitmentsByWIDCount = async (wid: string): Promise<number> => {
    return await this.commitmentRepository.count({
      where: {
        WID: wid,
      },
    });
  };

  /**
   * Returns all event triggers that have wid in wids field
   * @param wid
   */
  eventTriggersByWIDCount = async (wid: string): Promise<number> => {
    return await this.eventTriggerRepository.count({
      where: {
        WIDs: Like(`%${wid}%`),
      },
    });
  };

  /**
   * Returns event triggers count that have wid in wids field
   * @param wid
   * @param offset
   * @param limit
   */
  eventTriggersByWID = async (
    wid: string,
    offset: number,
    limit: number
  ): Promise<Array<EventTriggerEntity>> => {
    return await this.eventTriggerRepository.find({
      where: {
        WIDs: Like(`%${wid}%`),
      },
      take: limit,
      skip: offset,
    });
  };

  /**
   * Returns all Permits by WID
   * @param wid
   */
  getPermitBoxesByWID = async (wid: string) => {
    return await this.permitRepository.find({
      where: {
        WID: wid,
      },
    });
  };

  /**
   * Returns all unspent permit boxes
   * @param wid
   */
  getUnspentPermitBoxes = async (wid: string): Promise<Array<PermitEntity>> => {
    return this.permitRepository
      .createQueryBuilder('permit_entity')
      .where('permit_entity.WID = :wid', { wid })
      .andWhere('permit_entity.spendBlock is null')
      .getMany();
  };

  /**
   * Returns all unspent plain boxes
   */
  getUnspentAddressBoxes = async (): Promise<Array<BoxEntity>> => {
    return this.boxRepository
      .createQueryBuilder('box_entity')
      .where('box_entity.spendBlock is null')
      .getMany();
  };

  /**
   * Returns all unspent plain boxes of a specific address
   * @param address to fetch unspent boxes
   */
  getUnspentBoxesByAddress = async (
    address: string
  ): Promise<Array<BoxEntity>> => {
    return this.boxRepository
      .createQueryBuilder('box_entity')
      .where('box_entity.spendBlock is null')
      .andWhere('box_entity.address = :address', { address })
      .getMany();
  };

  /**
   * Returns an eventTriggerEntity with the specified sourceTxId
   * @param sourceTxId
   */
  eventTriggerBySourceTxId = async (
    sourceTxId: string
  ): Promise<EventTriggerEntity | null> => {
    return await this.eventTriggerRepository.findOne({
      where: {
        sourceTxId: sourceTxId,
      },
    });
  };

  /**
   * Tracks transaction queue to find the chained unspent boxes with required information
   * @param box: starts tracking this box in the queue
   * @param tokenId: tracks boxes containing this asset
   * @returns
   */
  trackTxQueue = async (
    box: wasm.ErgoBox,
    tokenId?: string
  ): Promise<wasm.ErgoBox> => {
    const txs: Array<TxEntity> = await this.getAllTxs();
    const map = new Map<string, wasm.ErgoBox>();
    const address: string = box.ergo_tree().to_base16_bytes();
    for (const tx of txs) {
      const signedTx = wasm.Transaction.sigma_parse_bytes(
        base64ToArrayBuffer(tx.txSerialized)
      );
      const outputs = signedTx.outputs();
      for (let i = 0; i < outputs.len(); i++) {
        const output = outputs.get(i);
        const boxAddress = output.ergo_tree().to_base16_bytes();
        const assetId =
          output.tokens().len() > 0 ? output.tokens().get(0).id().to_str() : '';
        if (boxAddress === address && (!tokenId || assetId == tokenId)) {
          const inputs = signedTx.inputs();
          for (let j = 0; j < inputs.len(); j++) {
            const input = inputs.get(j);
            map.set(input.box_id().to_str(), output);
          }
          break;
        }
      }
    }
    let lastBox: wasm.ErgoBox = box;
    while (map.has(lastBox.box_id().to_str()))
      lastBox = map.get(lastBox.box_id().to_str())!;
    return lastBox;
  };

  /**
   * Returns tokenInfo of a batch of tokenIds
   * @param ids
   * @returns Array of TokenEntity
   */
  getTokenEntity = async (ids: string[]): Promise<Array<TokenEntity>> => {
    return await this.tokenRepository.find({
      where: {
        tokenId: In(ids),
      },
    });
  };

  /**
   * Stores the name of a token by its id
   * @param tokenId
   * @param tokenName
   */
  insertTokenEntity = async (tokenId: string, tokenName: string) => {
    await this.tokenRepository.insert({ tokenId, tokenName });
  };

  /**
   * Returns all unspent permit boxes
   */
  getPermitUnspentBoxes = async (): Promise<Array<PermitEntity>> => {
    return this.permitRepository
      .createQueryBuilder('permit_entity')
      .where('permit_entity.spendBlock is null')
      .getMany();
  };

  /**
   * Returns all unspent boxes considering boxIds
   * @param boxIds to include/exclude from the result
   * @param exclude if true, excludes boxIds from the result
   */
  getUnspentBoxesByBoxIds = async (
    boxIds: string[],
    exclude = false
  ): Promise<Array<BoxEntity>> => {
    let qb = this.boxRepository
      .createQueryBuilder('box_entity')
      .where('box_entity.spendBlock is null');

    if (exclude) {
      qb = qb.andWhere('box_entity.boxId not in (:...boxIds)', { boxIds });
    } else {
      qb = qb.andWhere('box_entity.boxId in (:...boxIds)', { boxIds });
    }

    return qb.getMany();
  };

  /**
   * returns active transaction with 'permit' type
   * @param wid
   * @param maxHeight
   */
  getActivePermitTransactions = async (): Promise<Array<TxEntity>> => {
    return await this.txRepository.find({
      where: {
        type: TxType.PERMIT,
        deleted: false,
      },
    });
  };
}

export { WatcherDataBase };
