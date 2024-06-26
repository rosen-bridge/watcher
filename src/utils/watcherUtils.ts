import { Buffer } from 'buffer';
import * as wasm from 'ergo-lib-wasm-nodejs';

import { ObservationEntity } from '@rosen-bridge/observation-extractor';

import { uniqBy, countBy, reduce } from 'lodash-es';

import { WatcherDataBase } from '../database/models/watcherModel';
import { TxType } from '../database/entities/txEntity';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { NoObservationStatus } from '../errors/errors';
import { TxStatus } from '../database/entities/observationStatusEntity';
import { CommitmentSet } from './interfaces';
import { Transaction } from '../api/Transaction';
import { getConfig } from '../config/config';
import { scanner } from './scanner';
import { CommitmentEntity } from '@rosen-bridge/watcher-data-extractor';
import MinimumFeeHandler from './MinimumFeeHandler';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

class WatcherUtils {
  dataBase: WatcherDataBase;
  observationConfirmation: number;
  observationValidThreshold: number;

  constructor(
    db: WatcherDataBase,
    confirmation: number,
    validThreshold: number
  ) {
    this.dataBase = db;
    this.observationConfirmation = confirmation;
    this.observationValidThreshold = validThreshold;
  }

  /**
   * Checks if the observation is valid for commitment creation
   * @param observation
   */
  isObservationValid = async (
    observation: ObservationEntity
  ): Promise<boolean> => {
    const observationStatus = await this.dataBase.getStatusForObservations(
      observation
    );
    if (observationStatus === null)
      throw new NoObservationStatus(
        `observation with requestId ${observation.requestId} has no status`
      );
    // Check observation time out
    if (observationStatus.status == TxStatus.TIMED_OUT) return false;
    const currentHeight = await this.dataBase.getLastBlockHeight(
      scanner.observationScanner.name()
    );
    if (currentHeight - observation.height > this.observationValidThreshold) {
      await this.dataBase.updateObservationTxStatus(
        observation,
        TxStatus.TIMED_OUT
      );
      return false;
    }
    // check observation trigger created
    if (await this.isMergeHappened(observation)) return false;
    // validate observation amount
    if (!(await this.hasValidAmount(observation))) return false;
    // check this watcher have created the commitment lately
    const relatedCommitments = await this.dataBase.commitmentsByEventId(
      observation.requestId
    );
    return (
      relatedCommitments.filter(
        (commitment) => commitment.WID === Transaction.watcherWID
      ).length <= 0
    );
  };

  /**
   * returns false if the observation amount be less than (bridgeFee + networkFee)
   * or amount is less than specified fees
   * @param observation
   */
  hasValidAmount = async (observation: ObservationEntity): Promise<boolean> => {
    const feeConfig =
      MinimumFeeHandler.getInstance().getEventFeeConfig(observation);
    const bridgeFeePercent = BigInt(observation.amount) * feeConfig.feeRatio / feeConfig.feeRatioDivisor;
    const bridgeFee = bridgeFeePercent > feeConfig.bridgeFee ? bridgeFeePercent : feeConfig.bridgeFee
    return (
      BigInt(observation.amount) >=
        BigInt(bridgeFee) + BigInt(feeConfig.networkFee) &&
      BigInt(observation.amount) >=
        BigInt(observation.bridgeFee) + BigInt(observation.networkFee)
    );
  };

  /**
   * returns true if the event trigger for the event have been created
   * @param observation
   */
  isMergeHappened = async (
    observation: ObservationEntity
  ): Promise<boolean> => {
    let observationStatus = await this.dataBase.getStatusForObservations(
      observation
    );
    if (observationStatus === null)
      observationStatus = await this.dataBase.checkNewObservation(
        observation,
        Transaction.watcherWID
      );
    if (observationStatus === null) {
      throw new NoObservationStatus(
        `observation with requestId ${observation.requestId} has no status`
      );
    }
    if (observationStatus.status == TxStatus.REVEALED) return true;
    const eventTrigger = await this.dataBase.eventTriggerBySourceTxId(
      observation.sourceTxId
    );
    if (eventTrigger) {
      const height = await ErgoNetwork.getHeight();
      if (
        height - eventTrigger.height >
        getConfig().general.transactionConfirmation
      )
        await this.dataBase.updateObservationTxStatus(
          observation,
          TxStatus.REVEALED
        );
      return true;
    }
    return false;
  };

  /**
   * Returns all confirmed observations to create new commitments
   */
  allReadyObservations = async (): Promise<Array<ObservationEntity>> => {
    const height = await this.dataBase.getLastBlockHeight(
      scanner.observationScanner.name()
    );
    const observations = await this.dataBase.getConfirmedObservations(
      this.observationConfirmation,
      height,
      this.observationValidThreshold,
      true
    );
    const validObservations: Array<ObservationEntity> = [];
    for (const observation of observations) {
      const observationStatus = await this.dataBase.checkNewObservation(
        observation,
        Transaction.watcherWID
      );
      if (observationStatus.status === TxStatus.NOT_COMMITTED) {
        if (await this.isObservationValid(observation)) {
          validObservations.push(observation);
        }
      }
    }
    return validObservations;
  };

  /**
   * Checks the duplicate commitment and logs to inform watcher
   * @param observation
   * @param relatedCommitments
   */
  checkDuplicateCommitments = (
    observation: ObservationEntity,
    relatedCommitments: CommitmentEntity[]
  ) => {
    const duplicateCommitmentWithWid = reduce<
      ReturnType<typeof countBy>,
      string[]
    >(
      countBy(relatedCommitments, 'WID'),
      (currentDuplicateWIDs, commitmentsCount, wid) =>
        commitmentsCount > 1
          ? [...currentDuplicateWIDs, wid]
          : currentDuplicateWIDs,
      []
    );

    if (
      Transaction.watcherWID &&
      duplicateCommitmentWithWid.includes(Transaction.watcherWID)
    ) {
      logger.warn(
        `It seems that current watcher (and probably some other watchers) created duplicate commitments. It may cause some issues.`,
        {
          duplicateCommitmentWithWid,
          eventId: observation.requestId,
        }
      );
    } else {
      logger.info(
        `There seems to be some duplicate commitments created by other watchers. It may cause some issues.`,
        {
          duplicateCommitmentWithWid,
          eventId: observation.requestId,
        }
      );
    }
  };

  /**
   * Returns sets of commitments that are ready to be merged into event trigger
   */
  allReadyCommitmentSets = async (): Promise<Array<CommitmentSet>> => {
    const readyCommitments: Array<CommitmentSet> = [];
    const height = await this.dataBase.getLastBlockHeight(
      scanner.observationScanner.name()
    );
    const observations = await this.dataBase.getConfirmedObservations(
      this.observationConfirmation,
      height
    );
    for (const observation of observations) {
      try {
        const observationStatus = await this.dataBase.getStatusForObservations(
          observation
        );
        if (
          observationStatus !== null &&
          observationStatus.status === TxStatus.COMMITTED &&
          (await this.hasValidAmount(observation))
        ) {
          const relatedCommitments = await this.dataBase.commitmentsByEventId(
            observation.requestId
          );
          if (!(await this.isMergeHappened(observation))) {
            const uniqueRelatedCommitments = uniqBy(relatedCommitments, 'WID');
            if (uniqueRelatedCommitments.length !== relatedCommitments.length) {
              this.checkDuplicateCommitments(observation, relatedCommitments);
            }

            readyCommitments.push({
              commitments: uniqueRelatedCommitments.map((item) => ({
                ...item,
                rwtCount: item.rwtCount ?? '1',
              })),
              observation: observation,
            });
          }
        }
      } catch (e) {
        logger.error(
          `An Error occurred while processing event [${observation.requestId}] for trigger transaction: [${e}]`
        );
      }
    }
    return readyCommitments;
  };

  /**
   * returns all timeout commitments
   * @param timeoutConfirmation number of confirmation so that a commitment become timeout
   */
  allTimeoutCommitments = async (
    timeoutConfirmation: number
  ): Promise<Array<CommitmentEntity>> => {
    const height = await this.dataBase.getLastBlockHeight(
      scanner.ergoScanner.name()
    );
    return await this.dataBase.commitmentsByWIDAndMaxHeight(
      Transaction.watcherWID!,
      height - timeoutConfirmation
    );
  };

  /**
   *
   * @param wid get list of all commitments which triggered before creation or trigger is spent
   * @returns
   */
  allTriggeredInvalidCommitments = async () => {
    const height = await this.dataBase.getLastBlockHeight(
      scanner.ergoScanner.name()
    );
    const result: Array<CommitmentEntity> = [];
    const commitments = await this.dataBase.commitmentsByWIDAndMaxHeight(
      Transaction.watcherWID!,
      height
    );
    for (const commitment of commitments) {
      // TODO must improve this part without issue.
      const event = await this.dataBase.eventTriggerByEventId(
        commitment.eventId
      );
      if (
        event !== null &&
        (commitment.height >= event.height || event.spendBlock !== undefined)
      ) {
        result.push(commitment);
      }
    }
    return result;
  };

  /**
   * returns all timeout commitments
   */
  lastCommitment = async (): Promise<CommitmentEntity> => {
    const lastCommitment = await this.dataBase.lastCommitmentByWID(
      Transaction.watcherWID!
    );
    if (!lastCommitment)
      throw Error('There is no available unspent commitment');
    return lastCommitment;
  };

  /**
   * Returns all confirmed observations to create new commitments
   */
  hasMissedObservation = async (): Promise<boolean> => {
    const height = await this.dataBase.getLastBlockHeight(
      scanner.observationScanner.name()
    );
    const observations = await this.dataBase.getConfirmedObservations(
      this.observationConfirmation,
      height
    );
    let seenNotCommitted = false;
    for (const observation of observations) {
      const observationStatus = await this.dataBase.checkNewObservation(
        observation,
        Transaction.watcherWID
      );
      if (observationStatus.status === TxStatus.NOT_COMMITTED) {
        seenNotCommitted = true;
      }
      if (observationStatus.status === TxStatus.COMMITTED && seenNotCommitted)
        if (
          (
            await this.dataBase.commitmentsByEventId(observation.requestId)
          ).filter((commitment) => commitment.WID == Transaction.watcherWID)
            .length
        )
          return true;
    }
    return false;
  };

  /**
   * Check timed out commitments to be valid, a commitment is not valid if:
   *    1 - Not triggered after the specified period
   *    2 - Created after the related trigger
   *    3 - It's a duplicate commitment and a valid one merged to create the trigger (WID exists in trigger)
   * @param commitment
   * @returns true if the commitment is still valid and false otherwise
   */
  isCommitmentValid = async (
    commitment: CommitmentEntity
  ): Promise<boolean> => {
    const eventTrigger = await this.dataBase.eventTriggerByEventId(
      commitment.eventId
    );

    if (eventTrigger == null) {
      return false;
    }

    const commitmentWIDs = (
      await this.dataBase.commitmentsBySpendTxId(eventTrigger?.txId)
    ).map((comm) => comm.WID);

    return (
      commitment.height < eventTrigger.height &&
      !commitmentWIDs.includes(commitment.WID)
    );
  };
}

class TransactionUtils {
  dataBase: WatcherDataBase;

  constructor(db: WatcherDataBase) {
    this.dataBase = db;
  }

  /**
   * submits a new transaction and updates the observation tx status
   * @param tx
   * @param observation
   * @param txType
   */
  submitTransaction = async (
    tx: wasm.Transaction,
    txType: TxType,
    observation?: ObservationEntity
  ) => {
    const height = await ErgoNetwork.getHeight();
    let requestId = undefined;
    if (observation) {
      await this.dataBase.upgradeObservationTxStatus(observation);
      requestId = observation.requestId;
    }
    await this.dataBase.submitTx(
      Buffer.from(tx.sigma_serialize_bytes()).toString('base64'),
      tx.id().to_str(),
      txType,
      height,
      requestId
    );
    logger.debug(
      `tx submitted to the queue successfully: [${Buffer.from(
        tx.sigma_serialize_bytes()
      ).toString('hex')}]`
    );
  };
}

export { TransactionUtils, WatcherUtils };
