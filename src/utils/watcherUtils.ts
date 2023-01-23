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
import { logger } from '../log/Logger';

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
   * returns true if the event trigger for the event have been created
   * @param observation
   */
  isMergeHappened = async (
    observation: ObservationEntity
  ): Promise<boolean> => {
    const observationStatus = await this.dataBase.getStatusForObservations(
      observation
    );
    if (observationStatus === null)
      throw new NoObservationStatus(
        `observation with requestId ${observation.requestId} has no status`
      );
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
      height
    );
    const validObservations: Array<ObservationEntity> = [];
    for (const observation of observations) {
      const observationStatus = await this.dataBase.checkNewObservation(
        observation
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
      const observationStatus = await this.dataBase.getStatusForObservations(
        observation
      );
      if (
        observationStatus !== null &&
        observationStatus.status === TxStatus.COMMITTED
      ) {
        const relatedCommitments = await this.dataBase.commitmentsByEventId(
          observation.requestId
        );
        if (!(await this.isMergeHappened(observation))) {
          const uniqueRelatedCommitments = uniqBy(relatedCommitments, 'WID');

          if (uniqueRelatedCommitments.length !== relatedCommitments.length) {
            const duplicateWIDs = reduce<ReturnType<typeof countBy>, string[]>(
              countBy(relatedCommitments, 'WID'),
              (currentDuplicateWIDs, commitmentsCount, wid) =>
                commitmentsCount > 1
                  ? [...currentDuplicateWIDs, wid]
                  : currentDuplicateWIDs,
              []
            );

            if (
              Transaction.watcherWID &&
              duplicateWIDs.includes(Transaction.watcherWID)
            ) {
              logger.warn(
                `It seems that current watcher (and probably some other watchers) created duplicate commitments. It may cause some issues.`,
                {
                  duplicateWIDs,
                  eventId: observation.requestId,
                }
              );
            } else {
              logger.info(
                `There seems to be some duplicate commitments created by other watchers. It may cause some issues.`,
                {
                  duplicateWIDs,
                  eventId: observation.requestId,
                }
              );
            }
          }

          readyCommitments.push({
            commitments: uniqueRelatedCommitments.filter(
              (commitment) => commitment.spendBlock == null
            ),
            observation: observation,
          });
        }
      }
    }
    return readyCommitments;
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
    observation: ObservationEntity,
    txType: TxType
  ) => {
    const height = await ErgoNetwork.getHeight();
    await this.dataBase.submitTx(
      Buffer.from(tx.sigma_serialize_bytes()).toString('base64'),
      observation.requestId,
      tx.id().to_str(),
      txType,
      height
    );
    await this.dataBase.upgradeObservationTxStatus(observation);
  };
}

export { TransactionUtils, WatcherUtils };
