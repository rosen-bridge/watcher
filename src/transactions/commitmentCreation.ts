import * as wasm from 'ergo-lib-wasm-nodejs';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils } from '../ergo/utils';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { Transaction } from '../api/Transaction';
import { hexStrToUint8Array } from '../utils/utils';
import { TxType } from '../database/entities/txEntity';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';

const logger = loggerFactory(import.meta.url);

export class CommitmentCreation {
  watcherUtils: WatcherUtils;
  txUtils: TransactionUtils;
  boxes: Boxes;

  constructor(
    watcherUtils: WatcherUtils,
    txUtils: TransactionUtils,
    boxes: Boxes
  ) {
    this.watcherUtils = watcherUtils;
    this.txUtils = txUtils;
    this.boxes = boxes;
  }

  /**
   * creates the commitment transaction and submits to the transactionQueue
   * @param WID
   * @param observation
   * @param eventDigest
   * @param permits
   * @param WIDBox
   * @param feeBoxes
   * @param requiredValue
   */
  createCommitmentTx = async (
    WID: string,
    observation: ObservationEntity,
    eventDigest: Uint8Array,
    permits: Array<wasm.ErgoBox>,
    WIDBox: wasm.ErgoBox,
    feeBoxes: Array<wasm.ErgoBox>,
    requiredValue: bigint
  ) => {
    const height = await ErgoNetwork.getHeight();
    const permitHash = ErgoUtils.contractHash(
      wasm.Contract.pay_to_address(
        wasm.Address.from_base58(getConfig().rosen.watcherPermitAddress)
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
    const candidates = [outPermit, outCommitment];
    const allowedTokens = [this.boxes.RWTTokenId, wasm.TokenId.from_str(WID)];
    const extraTokens = ErgoUtils.getExtraTokenCount(inputBoxes, allowedTokens);
    try {
      if (extraTokens > 0) {
        const totalValue = ErgoUtils.getBoxValuesSum([
          ...permits,
          WIDBox,
          ...feeBoxes,
        ]);
        if (
          totalValue - requiredValue <
          BigInt(getConfig().general.minBoxValue)
        )
          throw new NotEnoughFund();
        const outWIDBox = this.boxes.createWIDBox(
          height,
          WID,
          (totalValue - requiredValue).toString()
        );
        candidates.push(outWIDBox);
      }
      const signed = await ErgoUtils.createAndSignTx(
        getConfig().general.secretKey,
        inputBoxes,
        candidates,
        height
      );
      await this.txUtils.submitTransaction(
        signed,
        TxType.COMMITMENT,
        observation
      );
      logger.info(
        `Commitment tx [${signed.id().to_str()}] submitted to the queue`
      );
    } catch (e) {
      if (e instanceof ChangeBoxCreationError) {
        logger.warn(
          "Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets."
        );
      }
      if (e instanceof NotEnoughFund) {
        // TODO: Send notification (https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/33)
        logger.warn(
          'Transaction build failed due to ERG insufficiency in the watcher.'
        );
      }
      logger.warn(
        `Skipping the commitment creation due to occurred error: ${e.message} - ${e.stack}`
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
        const totalValue = ErgoUtils.getBoxValuesSum([...permits, WIDBox]);
        logger.info(`Using WID Box [${WIDBox.box_id().to_str()}]`);
        const requiredValue =
          BigInt(getConfig().general.fee) +
          BigInt(getConfig().general.minBoxValue) * BigInt(3);
        let feeBoxes: Array<wasm.ErgoBox> = [];
        if (totalValue < requiredValue) {
          logger.debug(
            `Require more than WID box Ergs. Total: [${totalValue}], Required: [${requiredValue}]`
          );
          feeBoxes = await this.boxes.getUserPaymentBox(
            requiredValue - totalValue,
            [WIDBox.box_id().to_str()]
          );
        }
        await this.createCommitmentTx(
          WID,
          observation,
          commitment,
          permits,
          WIDBox,
          feeBoxes,
          requiredValue
        );
      } catch (e) {
        logger.warn(
          `Skipping the commitment creation due to occurred error: ${e.message} - ${e.stack}`
        );
      }
    }
    logger.info(`Commitment creation job is done`, {
      count: observations.length,
    });
  };
}
