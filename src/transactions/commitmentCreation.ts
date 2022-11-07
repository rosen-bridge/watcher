import * as wasm from 'ergo-lib-wasm-nodejs';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils } from '../ergo/utils';
import { rosenConfig } from '../config/rosenConfig';
import { Config } from '../config/config';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { boxCreationError, NotEnoughFund, NoWID } from '../errors/errors';
import { Transaction } from '../api/Transaction';
import { hexStrToUint8Array } from '../utils/utils';
import { TxType } from '../database/entities/txEntity';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { logger } from '../log/Logger';

const config = Config.getConfig();

export class CommitmentCreation {
  watcherUtils: WatcherUtils;
  txUtils: TransactionUtils;
  boxes: Boxes;
  widApi: Transaction;

  constructor(
    watcherUtils: WatcherUtils,
    txUtils: TransactionUtils,
    boxes: Boxes,
    api: Transaction
  ) {
    this.watcherUtils = watcherUtils;
    this.txUtils = txUtils;
    this.boxes = boxes;
    this.widApi = api;
  }

  /**
   * creates the commitment transaction and submits to the transactionQueue
   * @param WID
   * @param observation
   * @param eventDigest
   * @param permits
   * @param WIDBox
   * @param feeBoxes
   */
  createCommitmentTx = async (
    WID: string,
    observation: ObservationEntity,
    eventDigest: Uint8Array,
    permits: Array<wasm.ErgoBox>,
    WIDBox: wasm.ErgoBox,
    feeBoxes: Array<wasm.ErgoBox>
  ) => {
    const height = await ErgoNetwork.getHeight();
    const permitHash = ErgoUtils.contractHash(
      wasm.Contract.pay_to_address(
        wasm.Address.from_base58(rosenConfig.watcherPermitAddress)
      )
    );
    const outCommitment = this.boxes.createCommitment(
      height,
      WID,
      observation.requestId,
      eventDigest,
      permitHash
    );
    const RWTCount: bigint = permits
      .map((permit) =>
        BigInt(permit.tokens().get(0).amount().as_i64().to_str())
      )
      .reduce((a, b) => a + b, BigInt(0));
    if (RWTCount <= 1) {
      // TODO: Fix this problem
      logger.warn('Not enough RWT tokens to create a new commitment');
      return {};
    }
    const outPermit = this.boxes.createPermit(
      height,
      RWTCount - BigInt(1),
      hexStrToUint8Array(WID)
    );
    const inputBoxes = new wasm.ErgoBoxes(permits[0]);
    inputBoxes.add(WIDBox);
    permits.slice(1).forEach((permit) => inputBoxes.add(permit));
    feeBoxes.forEach((box) => inputBoxes.add(box));
    try {
      const signed = await ErgoUtils.createAndSignTx(
        config.secretKey,
        inputBoxes,
        [outPermit, outCommitment],
        height
      );
      await this.txUtils.submitTransaction(
        signed,
        observation,
        TxType.COMMITMENT
      );
      logger.info(
        `Commitment tx [${signed.id().to_str()}] submitted to the queue`
      );
    } catch (e) {
      if (e instanceof boxCreationError) {
        logger.warn(
          "Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets."
        );
      }
      logger.warn(
        `Skipping the commitment creation due to occurred error: ${e}`
      );
    }
  };

  /**
   * Extracts the confirmed observations and creates the commitment transaction
   * Finally saves the created commitment in the database
   */
  job = async () => {
    const observations = await this.watcherUtils.allReadyObservations();
    if (!Transaction.watcherWID) {
      logger.warn(
        'Watcher WID is not set. Cannot run commitment creation job.'
      );
      return;
    }
    const WID = Transaction.watcherWID;
    logger.info(`Starting commitment creation job`);
    for (const observation of observations) {
      try {
        const commitment = ErgoUtils.commitmentFromObservation(
          observation,
          WID
        );
        const permits = await this.boxes.getPermits(WID);
        const WIDBox = await this.boxes.getWIDBox(WID);
        const totalValue: bigint =
          permits
            .map((permit) => BigInt(permit.value().as_i64().to_str()))
            .reduce((a, b) => a + b, BigInt(0)) +
          BigInt(WIDBox.value().as_i64().to_str());
        logger.info(`Using WID Box [${WIDBox.box_id().to_str()}]`);
        const requiredValue =
          BigInt(config.fee) + BigInt(config.minBoxValue) * BigInt(3);
        let feeBoxes: Array<wasm.ErgoBox> = [];
        if (totalValue < requiredValue) {
          logger.info(
            `Require more Erg. Total: [${totalValue}], Required: [${requiredValue}]`
          );
          feeBoxes = await this.boxes.getUserPaymentBox(
            requiredValue - totalValue
          );
        }
        await this.createCommitmentTx(
          WID,
          observation,
          commitment,
          permits,
          WIDBox,
          feeBoxes
        );
      } catch (e) {
        logger.warn(
          `Skipping the commitment creation due to occurred error: ${e}`
        );
      }
    }
    logger.info(`Commitment creation job is done`, {
      count: observations.length,
    });
  };
}
