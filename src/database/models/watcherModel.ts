import { BoxEntity } from '@rosen-bridge/address-extractor';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { BlockEntity } from '@rosen-bridge/scanner';
import { PROCEED } from '@rosen-bridge/scanner';
import {
  CollateralEntity,
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
} from '@rosen-bridge/watcher-data-extractor';
import * as wasm from 'ergo-lib-wasm-nodejs';
import {
  And,
  DataSource,
  In,
  IsNull,
  LessThan,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import {
  DOING_STATUS,
  DONE_STATUS,
  ERGO_CHAIN_NAME,
} from '../../config/constants';
import { PagedItemData } from '../../types/items';
import { EventStatus } from '../../utils/interfaces';
import { base64ToArrayBuffer } from '../../utils/utils';
import {
  ObservationStatusEntity,
  SortedTxStatus,
  TxStatus,
} from '../entities/observationStatusEntity';
import { RevenueChartDataView } from '../entities/revenueChartDataView';
import { RevenueEntity } from '../entities/revenueEntity';
import { RevenueView } from '../entities/revenueView';
import { TokenEntity } from '../entities/tokenEntity';
import { TxEntity, TxType } from '../entities/txEntity';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from '../../config/config';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

class WatcherDataBase {
  private readonly dataSource: DataSource;
  private readonly blockRepository: Repository<BlockEntity>;
  private readonly observationRepository: Repository<ObservationEntity>;
  private readonly txRepository: Repository<TxEntity>;
  private readonly observationStatusRepository: Repository<ObservationStatusEntity>;
  private readonly commitmentRepository: Repository<CommitmentEntity>;
  private readonly permitRepository: Repository<PermitEntity>;
  private readonly boxRepository: Repository<BoxEntity>;
  private readonly eventTriggerRepository: Repository<EventTriggerEntity>;
  private readonly tokenRepository: Repository<TokenEntity>;
  private readonly revenueView: Repository<RevenueView>;
  private readonly revenueRepository: Repository<RevenueEntity>;
  private readonly revenueChartView: Repository<RevenueChartDataView>;
  private readonly collateralRepository: Repository<CollateralEntity>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.blockRepository = dataSource.getRepository(BlockEntity);
    this.observationRepository = dataSource.getRepository(ObservationEntity);
    this.txRepository = dataSource.getRepository(TxEntity);
    this.observationStatusRepository = dataSource.getRepository(
      ObservationStatusEntity
    );
    this.commitmentRepository = dataSource.getRepository(CommitmentEntity);
    this.permitRepository = dataSource.getRepository(PermitEntity);
    this.boxRepository = dataSource.getRepository(BoxEntity);
    this.eventTriggerRepository = dataSource.getRepository(EventTriggerEntity);
    this.tokenRepository = dataSource.getRepository(TokenEntity);
    this.revenueView = dataSource.getRepository(RevenueView);
    this.revenueRepository = dataSource.getRepository(RevenueEntity);
    this.revenueChartView = dataSource.getRepository(RevenueChartDataView);
    this.collateralRepository = dataSource.getRepository(CollateralEntity);
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
   * @param maxConfirmation
   * @param onlyNotCommitted
   */
  getConfirmedObservations = async (
    confirmation: number,
    height: number,
    maxConfirmation?: number,
    onlyNotCommitted = false
  ) => {
    const maxHeight = height - confirmation;
    const minHeight = height - (maxConfirmation ? maxConfirmation : height);
    const observations = await this.observationRepository.find({
      where: {
        height: And(LessThan(maxHeight), MoreThan(minHeight)),
      },
      order: {
        height: 'ASC',
        requestId: 'ASC',
      },
    });
    if (onlyNotCommitted) {
      const invalidIds: Set<number> = new Set();
      (
        await this.observationStatusRepository.find({
          where: {
            observation: {
              id: In(observations.map((item) => item.id)),
            },
          },
          relations: ['observation'],
        })
      ).forEach((item) => {
        if (item.status !== TxStatus.NOT_COMMITTED)
          invalidIds.add(item.observation.id);
      });
      return observations.filter((item) => !invalidIds.has(item.id));
    }
    return observations;
  };

  /**
   * Returns all observations with filters, with respect to offset and limit
   * @param fromAddress
   * @param toAddress
   * @param minHeight
   * @param maxHeight
   * @param sourceTokenId
   * @param sourceTxId
   * @param sorting
   * @param offset
   * @param limit
   */
  getObservationWithFilters = async (
    fromAddress = '',
    toAddress = '',
    minHeight: number | undefined = undefined,
    maxHeight: number | undefined = undefined,
    sourceTokenId = '',
    sourceTxId = '',
    sorting = '',
    offset = 0,
    limit = 20
  ): Promise<PagedItemData<ObservationEntity>> => {
    let qb = this.observationRepository.createQueryBuilder('ob').select('*');
    if (sourceTxId !== '') {
      qb = qb.andWhere('ob.sourceTxId = :sourceTxId', { sourceTxId });
    } else {
      if (fromAddress !== '') {
        qb = qb.andWhere('ob.fromAddress = :fromAddress', { fromAddress });
      }
      if (toAddress !== '') {
        qb = qb.andWhere('ob.toAddress = :toAddress', { toAddress });
      }
      if (minHeight) {
        qb = qb.andWhere('ob.height >= :minHeight', { minHeight });
      }
      if (maxHeight) {
        qb = qb.andWhere('ob.height <= :maxHeight', { maxHeight });
      }
      if (sourceTokenId !== '') {
        qb = qb.andWhere('ob.sourceChainTokenId = :sourceTokenId', {
          sourceTokenId,
        });
      }
      if (sorting !== '' && sorting.toLowerCase() === 'asc') {
        qb = qb.orderBy('ob.id', 'ASC');
      } else {
        qb = qb.orderBy('ob.id', 'DESC');
      }
    }
    const total = await qb.getCount();
    const items = await qb.offset(offset).limit(limit).execute();
    return { items, total };
  };

  /**
   *
   * @param observationIds get status of a list of observations
   */
  getObservationsStatus = (
    observationIds: Array<number>
  ): Promise<Array<ObservationStatusEntity>> => {
    return this.observationStatusRepository.find({
      where: {
        observation: In(observationIds),
      },
      relations: ['observation'],
    });
  };

  /**
   * setting NOT_COMMITTED status for new observations that doesn't have status and return last status
   * @param observation
   */
  checkNewObservation = async (
    observation: ObservationEntity,
    wid: string | undefined
  ): Promise<ObservationStatusEntity> => {
    const observationStatus = await this.getStatusForObservations(observation);
    if (!observationStatus) {
      if (
        wid &&
        (await this.commitmentRepository.findOne({
          where: {
            WID: wid,
            eventId: observation.requestId,
            spendBlock: IsNull(),
          },
        }))
      ) {
        // found an unspent commitment by watcher wid for this observation
        // insert observation as COMMITTED
        logger.debug(
          `found an unspent commitment by watcher wid for observation [${observation.requestId}], updating status to COMMITTED`
        );
        await this.observationStatusRepository.insert({
          observation: observation,
          status: TxStatus.COMMITTED,
        });
      } else {
        // there is no wid or no commitment is found for this observation
        // insert observation is NOT_COMMITTED
        logger.debug(
          `there is no wid or no commitment is found for observation [${observation.requestId}], updating status to NOT_COMMITTED`
        );
        await this.observationStatusRepository.insert({
          observation: observation,
          status: TxStatus.NOT_COMMITTED,
        });
      }
      const insertedStatus = await this.getStatusForObservations(observation);
      if (insertedStatus === null) {
        throw new Error(
          `observation status with requestId [${observation.requestId}] doesn't inserted in the dataBase`
        );
      } else {
        return insertedStatus;
      }
    } else {
      return observationStatus;
    }
  };

  /**
   * updating observation status to not committed for specified events
   * @param eventIds
   */
  updateObservationStatusForEventIds = async (eventIds: Array<string>) => {
    logger.debug(
      `Updating observation status for ${eventIds} to not committed`
    );
    const observationIds = (
      await this.observationRepository.find({
        where: {
          requestId: In(eventIds),
        },
      })
    ).map((item) => item.id);
    await this.observationStatusRepository.update(
      {
        observation: {
          id: In(observationIds),
        },
      },
      { status: TxStatus.NOT_COMMITTED }
    );
  };

  /**
   * Checking that if observation has status in observationStatus table or not
   * @param observation
   */
  getStatusForObservations = async (
    observation: ObservationEntity
  ): Promise<ObservationStatusEntity | null> => {
    const status = await this.observationStatusRepository.findOne({
      where: {
        observation: observation,
      },
    });
    logger.debug(
      `Observation [${observation.requestId}] status is ${status?.status}`
    );
    return status;
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
          `observation with requestId [${observation.requestId}] has no status`
        );
    }
    const time = Math.floor(new Date().getTime() / 1000);
    return await this.txRepository.insert({
      txId: txId,
      txSerialized: tx,
      creationTime: time,
      updateBlock: height,
      observation: observation,
      type: txType,
      deleted: false,
      isValid: true,
    });
  };

  /**
   * Returns all stored transactions with no deleted flag
   */
  getAllTxs = async () => {
    return await this.txRepository.find({
      relations: {
        observation: true,
      },
      where: {
        deleted: false,
      },
    });
  };

  /**
   * Returns all stored transactions with no deleted flag and valid flag
   */
  getValidTxs = async () => {
    return await this.txRepository.find({
      relations: {
        observation: true,
      },
      where: {
        deleted: false,
        isValid: true,
      },
    });
  };

  /**
   * Set status for a transaction
   * @param tx set tx status
   * @param isValid
   */
  setTxValidStatus = async (tx: TxEntity, isValid: boolean) => {
    logger.debug(`Updating validity status of tx [${tx.id}] to ${isValid}`);
    return this.txRepository.update(
      {
        id: tx.id,
      },
      { isValid }
    );
  };

  /**
   * Removes one specified transaction (Just toggles the removed flag)
   * @param tx
   */
  removeTx = async (tx: TxEntity) => {
    logger.debug(`Add removed flag to tx [${tx.id}]`);
    await this.txRepository.update(
      {
        id: tx.id,
      },
      { deleted: true }
    );
    return this.txRepository.findOneBy({ id: tx.id });
  };

  /**
   * Updates the tx checking time
   * @param tx
   * @param height
   */
  setTxUpdateHeight = async (tx: TxEntity, height: number) => {
    logger.debug(`Updating tx [${tx.id}] update height to ${height}`);
    tx.updateBlock = height;
    return this.txRepository.save(tx);
  };

  /**
   * Upgrades the observation TxStatus, it means it had progressed creating transactions
   * @param observation
   */
  upgradeObservationTxStatus = async (observation: ObservationEntity) => {
    const observationStatus = await this.getStatusForObservations(observation);
    if (observationStatus === null)
      throw new Error(
        `observation with requestId [${observation.requestId}] has no status`
      );
    if (
      ![TxStatus.TIMED_OUT, TxStatus.REVEALED].includes(
        observationStatus.status
      )
    ) {
      const newStatus =
        SortedTxStatus[
          SortedTxStatus.findIndex(
            (status) => status == observationStatus.status
          ) + 1
        ];
      logger.debug(
        `upgrading observation [${observation.requestId}] status to ${newStatus}`
      );
      await this.observationStatusRepository.update(
        { id: observationStatus.id },
        { status: newStatus }
      );
    }
    const updatedStatus = await this.getStatusForObservations(observation);
    if (updatedStatus === null) {
      throw new Error(
        `observation status with requestId [${observation.requestId}] isn't inserted in the dataBase`
      );
    } else {
      return updatedStatus;
    }
  };

  /**
   * Downgrades the observation TxStatus, it means it had problems creating or sending transactions
   * @param observation
   */
  downgradeObservationTxStatus = async (observation: ObservationEntity) => {
    const observationStatus = await this.getStatusForObservations(observation);
    if (observationStatus === null)
      throw new Error(
        `observation with requestId [${observation.requestId}] has no status`
      );
    if (
      ![TxStatus.TIMED_OUT, TxStatus.REVEALED].includes(
        observationStatus.status
      )
    ) {
      const newStatus =
        SortedTxStatus[
          SortedTxStatus.findIndex(
            (status) => status == observationStatus.status
          ) - 1
        ];
      logger.debug(
        `downgrading observation [${observation.requestId}] status to ${newStatus}`
      );
      await this.observationStatusRepository.update(
        { id: observationStatus.id },
        { status: newStatus }
      );
    }
    const updatedStatus = await this.getStatusForObservations(observation);
    if (updatedStatus === null) {
      throw new Error(
        `observation status with requestId [${observation.requestId}] doesn't inserted in the dataBase`
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
        `observation with requestId [${observation.requestId}] has no status`
      );
    logger.debug(
      `updating observation [${observation.requestId}] status to ${status}`
    );
    await this.observationStatusRepository.update(
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
        `observation status with requestId [${observation.requestId}] isn't inserted in the dataBase`
      );
    } else {
      return updatedStatus;
    }
  };

  /**
   * find commitments by their box ids
   * @param ids
   */
  findCommitmentsById = async (
    ids: Array<string>
  ): Promise<Array<CommitmentEntity>> => {
    const commitments = await this.commitmentRepository.find({
      where: {
        boxId: In(ids),
      },
    });
    logger.debug(
      `Found commitments with boxIds ${commitments.map(
        (commitment) => commitment.boxId
      )}`
    );
    return commitments;
  };

  /**
   * Returns all commitments related to a specific event
   * @param eventId
   */
  commitmentsByEventId = async (
    eventId: string
  ): Promise<Array<CommitmentEntity>> => {
    const commitments = await this.commitmentRepository.find({
      where: {
        eventId: eventId,
        spendHeight: IsNull(),
      },
    });
    logger.debug(
      `Found commitments with boxIds ${commitments.map(
        (commitment) => commitment.boxId
      )} for event ${eventId}`
    );
    return commitments;
  };

  /**
   * Returns all commitments related with a specific spendTxId
   * @param txId
   */
  commitmentsBySpendTxId = async (
    txId: string
  ): Promise<Array<CommitmentEntity>> => {
    const commitments = await this.commitmentRepository.find({
      where: {
        spendTxId: txId,
      },
    });
    logger.debug(
      `Found commitments with boxIds ${commitments.map(
        (commitment) => commitment.boxId
      )} spent in transaction ${txId}`
    );
    return commitments;
  };

  /**
   * Returns last commitment with specific wid
   * @param wid
   */
  lastCommitmentByWID = async (
    wid: string
  ): Promise<CommitmentEntity | null> => {
    const instance = await this.commitmentRepository
      .createQueryBuilder('co')
      .select()
      .innerJoin('observation_entity', 'ob', 'ob."requestId" = co."eventId"')
      .where('co."WID"= :wid', { wid })
      .andWhere('co."spendHeight" IS NULL')
      .orderBy('ob.height', 'DESC')
      .addOrderBy('ob.requestId', 'DESC')
      .getOne();
    if (instance) {
      return await this.commitmentRepository.findOne({
        where: {
          id: instance?.id,
        },
      });
    }
    return null;
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
    const commitments = await this.commitmentRepository.find({
      where: {
        WID: wid,
        height: LessThan(maxHeight),
        spendHeight: IsNull(),
      },
    });
    logger.debug(
      `Found commitments with boxIds ${commitments.map(
        (commitment) => commitment.boxId
      )} with wid ${wid} and below the height ${maxHeight}`
    );
    return commitments;
  };

  /**
   * Returns all unspent permit boxes
   * @param wid
   */
  getUnspentPermitBoxes = async (wid: string): Promise<Array<PermitEntity>> => {
    const permits = await this.permitRepository.findBy({
      WID: wid,
      spendBlock: IsNull(),
    });
    logger.debug(
      `Found ${permits.length} unspent permit boxes with boxId ${permits.map(
        (permit) => permit.boxId
      )}`
    );
    return permits;
  };

  /**
   * Returns all unspent plain boxes
   */
  getUnspentAddressBoxes = async (): Promise<Array<BoxEntity>> => {
    const boxes = await this.boxRepository.findBy({
      spendBlock: IsNull(),
    });
    logger.debug(
      `Found ${boxes.length} unspent boxes with boxId ${boxes.map(
        (box) => box.boxId
      )}`
    );
    return boxes;
  };

  /**
   * Returns all unspent plain boxes of a specific address
   * @param address to fetch unspent boxes
   */
  getUnspentBoxesByAddress = async (
    address: string
  ): Promise<Array<BoxEntity>> => {
    const boxes = await this.boxRepository.findBy({
      spendBlock: IsNull(),
      address: address,
    });
    logger.debug(
      `Found ${boxes.length} unspent boxes with boxId ${boxes.map(
        (box) => box.boxId
      )}`
    );
    return boxes;
  };

  /**
   * Returns an eventTriggerEntity with the specified sourceTxId
   * @param sourceTxId
   */
  eventTriggerBySourceTxId = async (
    sourceTxId: string
  ): Promise<EventTriggerEntity | null> => {
    const trigger = await this.eventTriggerRepository.findOne({
      where: {
        sourceTxId: sourceTxId,
      },
    });
    logger.debug(
      `Found trigger with boxId [${trigger?.boxId}] for observation of transaction [${sourceTxId}]`
    );
    return trigger;
  };

  /**
   * Returns an eventTriggerEntity with the specified eventId
   * @param eventId
   */
  eventTriggerByEventId = async (
    eventId: string
  ): Promise<EventTriggerEntity | null> => {
    const trigger = await this.eventTriggerRepository.findOne({
      where: {
        eventId: eventId,
      },
    });
    logger.debug(
      `Found trigger with boxId [${trigger?.boxId}] for event [${eventId}]`
    );
    return trigger;
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
    const txs: Array<TxEntity> = await this.getValidTxs();
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
   * Stores the name and decimals of a token by its id
   * stores the significant decimals if exists in the tokenMap
   * @param tokenId
   * @param tokenName
   * @param decimals
   */
  insertTokenEntity = async (
    tokenId: string,
    tokenName: string,
    decimals: number
  ) => {
    const tokenMap = getConfig().token.tokenMap;
    const significantDecimal = tokenMap.getSignificantDecimals(tokenId);
    await this.tokenRepository.save({
      tokenId,
      tokenName,
      decimals: significantDecimal != undefined ? significantDecimal : decimals,
    });
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
    const boxes = await this.boxRepository.findBy({
      spendBlock: IsNull(),
      boxId: exclude ? Not(In(boxIds)) : In(boxIds),
    });
    logger.debug(
      `Found ${boxes.length} unspent boxes with boxId ${boxes.map(
        (box) => box.boxId
      )} with exclusion list ${boxIds}`
    );
    return boxes;
  };

  /**
   * returns active transaction with 'permit' type
   */
  getActivePermitTransactions = async (): Promise<Array<TxEntity>> => {
    const txs = await this.txRepository.find({
      where: {
        type: TxType.PERMIT,
        deleted: false,
      },
    });
    logger.debug(
      `Found ${txs.length} active permit transaction with txId ${txs.map(
        (tx) => tx.txId
      )}`
    );
    return txs;
  };

  /**
   * returns active transaction with specified types
   */
  getActiveTransactionsByType = async (
    types: Array<TxType>
  ): Promise<Array<TxEntity>> => {
    const txs = await this.txRepository.find({
      where: {
        type: In(types),
        deleted: false,
      },
    });
    logger.debug(
      `Found ${
        txs.length
      } active transactions by types ${types} with txId ${txs.map(
        (tx) => tx.txId
      )}`
    );
    return txs;
  };

  /**
   * Returns all event triggers matching the filters, with respect to offset and limit
   * @param fromAddress
   * @param toAddress
   * @param sourceTokenId
   * @param sourceTxId
   * @param eventStatus
   * @param sorting
   * @param offset
   * @param limit
   */
  getEventsWithFilters = async (
    fromAddress = '',
    toAddress = '',
    sourceTokenId = '',
    sourceTxId = '',
    eventStatus = '',
    sorting = '',
    offset = 0,
    limit = 20
  ): Promise<PagedItemData<EventTriggerEntity>> => {
    let qb = this.eventTriggerRepository.createQueryBuilder('ev').select('*');

    if (fromAddress !== '') {
      qb = qb.andWhere('ev.fromAddress = :fromAddress', { fromAddress });
    }
    if (toAddress !== '') {
      qb = qb.andWhere('ev.toAddress = :toAddress', { toAddress });
    }
    if (sourceTokenId !== '') {
      qb = qb.andWhere('ev.sourceChainTokenId = :sourceTokenId', {
        sourceTokenId,
      });
    }
    if (sourceTxId !== '') {
      qb = qb.andWhere('ev.sourceTxId = :sourceTxId', { sourceTxId });
    }
    if (eventStatus !== '') {
      const eventStatusLower = eventStatus.toLowerCase();
      qb = qb.andWhere(
        eventStatusLower === 'done'
          ? 'ev.SpendBlock IS NOT NULL'
          : eventStatusLower === 'doing'
          ? 'ev.SpendBlock IS NULL'
          : ''
      );
    }
    if (sorting !== '' && sorting.toLowerCase() === 'asc') {
      qb = qb.orderBy('ev.id', 'ASC');
    } else {
      qb = qb.orderBy('ev.id', 'DESC');
    }
    const total = await qb.getCount();
    const items = await qb.offset(offset).limit(limit).execute();
    return { items, total };
  };

  /**
   * Returns event status of a batch of eventIds
   * @param ids
   */
  getEventsStatus = async (ids: number[]): Promise<Array<EventStatus>> => {
    const events = await this.eventTriggerRepository.find({
      where: {
        id: In(ids),
      },
      select: {
        id: true,
        spendBlock: true,
      },
    });
    return events.map(
      (event: { id: number; spendBlock?: string | null | undefined }) => ({
        id: event.id,
        status: event.spendBlock ? DONE_STATUS : DOING_STATUS,
      })
    );
  };

  /**
   * Returns all revenue with respect to the filters, offset,s and limit
   * @param fromChain
   * @param toChain
   * @param tokenId
   * @param sourceTxId
   * @param heightMin
   * @param heightMax
   * @param fromBlockTime
   * @param toBlockTime
   * @param sorting
   * @param offset
   * @param limit
   */
  getRevenuesWithFilters = async (
    wid: string,
    fromChain = '',
    toChain = '',
    sourceTxId = '',
    heightMin: number | undefined = undefined,
    heightMax: number | undefined = undefined,
    fromBlockTime: number | undefined = undefined,
    toBlockTime: number | undefined = undefined,
    sorting = '',
    offset = 0,
    limit = 20
  ): Promise<PagedItemData<RevenueView>> => {
    let qb = this.revenueView
      .createQueryBuilder('rv')
      .select('*')
      .distinct()
      .where('rv.wid = :wid', { wid });

    if (fromChain !== '') {
      qb = qb.andWhere('rv.fromChain = :fromChain', { fromChain });
    }
    if (toChain !== '') {
      qb = qb.andWhere('rv.toChain = :toChain', { toChain });
    }
    if (sourceTxId !== '') {
      qb = qb.andWhere('rv.lockTxId = :sourceTxId', { sourceTxId });
    }
    if (heightMin) {
      qb = qb.andWhere('rv.height >= :heightMin', { heightMin });
    }
    if (heightMax) {
      qb = qb.andWhere('rv.height <= :heightMax', { heightMax });
    }
    if (fromBlockTime) {
      qb = qb.andWhere('rv.timestamp >= :fromBlockTime', { fromBlockTime });
    }
    if (toBlockTime) {
      qb = qb.andWhere('rv.timestamp <= :toBlockTime', { toBlockTime });
    }
    if (sorting !== '' && sorting.toLowerCase() === 'asc') {
      qb = qb.orderBy('rv.id', 'ASC');
    } else {
      qb = qb.orderBy('rv.id', 'DESC');
    }
    const total = await qb.getCount();
    const items = await qb.offset(offset).limit(limit).execute();
    return { items, total };
  };

  /**
   * get list of all revenue tokens for selected list of permits
   * @param permitIds
   */
  getRevenueTokens = async (
    permitIds: Array<number>
  ): Promise<Array<RevenueEntity>> => {
    return this.revenueRepository.find({
      where: {
        permit: In(permitIds),
      },
      relations: ['permit'],
    });
  };
  /**
   * Returns chart data with the period of a week
   * @param offset
   * @param limit
   */
  getWeeklyRevenueChartData = async (
    wid: string,
    offset: number,
    limit: number
  ) => {
    return this.revenueChartView
      .createQueryBuilder('rcv')
      .select('"tokenId"')
      .addSelect('timestamp/604800 as week_number')
      .addSelect('sum(amount) as revenue')
      .where('wid = :wid', { wid })
      .groupBy('"tokenId"')
      .addGroupBy('week_number')
      .orderBy('week_number', 'DESC')
      .offset(offset)
      .limit(limit)
      .execute();
  };

  /**
   * Returns chart data with the period of month or year
   * @param period
   * @param offset
   * @param limit
   */
  getRevenueChartData = async (
    wid: string,
    period: string,
    offset: number,
    limit: number
  ) => {
    let qb = this.revenueChartView
      .createQueryBuilder('rcv')
      .select('"tokenId"')
      .addSelect('year')
      .addSelect('sum(amount) as revenue')
      .where('wid = :wid', { wid })
      .groupBy('"tokenId"')
      .addGroupBy('year')
      .orderBy('year', 'DESC');
    if (period === 'month') {
      qb = qb
        .addSelect('month')
        .addGroupBy('month')
        .addOrderBy('month', 'DESC');
    }
    return qb.offset(offset).limit(limit).execute();
  };

  /**
   * Returns unsaved permit ids
   */
  getUnsavedRevenueIds = async (): Promise<Array<number>> => {
    const unsavedPermits = await this.permitRepository
      .createQueryBuilder('pe')
      .select('pe.id', 'id')
      .leftJoin('revenue_entity', 're', 'pe.id = re."permitId"')
      .where('re.id IS NULL')
      .orderBy('pe.id', 'ASC')
      .getRawMany();

    const unsavedPermitIds = unsavedPermits.map(
      (permit: { id: number }) => permit.id
    );
    return unsavedPermitIds;
  };

  /**
   * Returns all permits up to a specific id
   * @param ids
   */
  getPermitsById = async (ids: number[]): Promise<PermitEntity[]> => {
    return this.permitRepository.find({
      where: {
        id: In(ids),
      },
      order: {
        id: 'ASC',
      },
    });
  };

  /**
   * Stores the info of permit in chart entity
   * stores token's wrapped amount
   * @param tokenId
   * @param amount
   * @param permit
   */
  storeRevenue = async (
    tokenId: string,
    amount: string,
    permit: PermitEntity
  ) => {
    const tokenMap = getConfig().token.tokenMap;
    await this.revenueRepository.save({
      tokenId,
      amount: tokenMap
        .wrapAmount(tokenId, BigInt(amount), ERGO_CHAIN_NAME)
        .amount.toString(),
      permit,
    });
  };

  /**
   * Return unspent collateral box for wid
   * @param wid
   */
  getCollateralByWid = async (wid: string): Promise<CollateralEntity> => {
    const collateral = await this.collateralRepository.findOne({
      where: { spendBlock: IsNull(), wid: wid },
    });
    if (collateral) {
      logger.debug(
        `Found collateral box for wid [${wid}] with boxId [${collateral.boxId}]`
      );
      return collateral;
    }
    throw new Error(`Could not find a collateral with wid [${wid}]`);
  };

  /**
   * Return all WIDs in valid unspent collaterals
   */
  getAllWids = async (): Promise<string[]> => {
    const collaterals = await this.collateralRepository.find({
      where: { spendBlock: IsNull() },
    });
    return collaterals.map((collateral) => collateral.wid);
  };
}

export { WatcherDataBase };
