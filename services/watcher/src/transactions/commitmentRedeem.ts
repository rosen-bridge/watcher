import * as wasm from 'ergo-lib-wasm-nodejs';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils, decodeSerializedBox } from '../ergo/utils';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { Transaction } from '../api/Transaction';
import { hexStrToUint8Array } from '../utils/utils';
import { TxType } from '../database/entities/txEntity';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';
import { DetachWID } from './detachWID';
import { boxHaveAsset } from '../ergo/utils';

const logger = loggerFactory(import.meta.url);

export class CommitmentRedeem {
  watcherUtils: WatcherUtils;
  txUtils: TransactionUtils;
  boxes: Boxes;
  redeemConfirmation: number;

  constructor(
    watcherUtils: WatcherUtils,
    txUtils: TransactionUtils,
    boxes: Boxes,
    redeemConfirmation: number
  ) {
    this.watcherUtils = watcherUtils;
    this.txUtils = txUtils;
    this.boxes = boxes;
    this.redeemConfirmation = redeemConfirmation;
  }

  /**
   * creates the commitment redeem transaction and submits to the transactionQueue
   * and returns new WID box to chain redeem transactions
   * @param WID
   * @param observation
   * @param WIDBox
   * @param commitmentBox
   * @param feeBoxes
   * @param requiredValue
   * @returns new wid box
   */
  redeemCommitmentTx = async (
    WID: string,
    WIDBox: wasm.ErgoBox,
    commitmentBox: wasm.ErgoBox,
    feeBoxes: Array<wasm.ErgoBox>,
    requiredValue: bigint
  ): Promise<wasm.ErgoBox> => {
    const allInputs = [WIDBox, commitmentBox, ...feeBoxes];
    const height = await ErgoNetwork.getMaxHeight(allInputs);
    const RWTCount = BigInt(
      commitmentBox.tokens().get(0).amount().as_i64().to_str()
    );
    const outPermit = this.boxes.createPermit(
      height,
      RWTCount,
      hexStrToUint8Array(WID)
    );
    const inputBoxes = new wasm.ErgoBoxes(commitmentBox);
    inputBoxes.add(WIDBox);
    feeBoxes.forEach((box) => inputBoxes.add(box));
    const candidates = [outPermit];
    const allowedTokens = [this.boxes.RWTTokenId, wasm.TokenId.from_str(WID)];
    const extraTokens = ErgoUtils.getExtraTokenCount(inputBoxes, allowedTokens);
    try {
      if (extraTokens > 0) {
        const totalValue = ErgoUtils.getBoxValuesSum([WIDBox, ...feeBoxes]);
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
      for (let i = 0; i < signed.outputs().len(); i++) {
        const box = signed.outputs().get(i);
        if (box.tokens().len() > 0 && boxHaveAsset(box, WID)) {
          await this.txUtils.submitTransaction(signed, TxType.REDEEM);
          logger.info(
            `Redeem tx [${signed.id().to_str()}] submitted to the queue`
          );
          return box;
        }
      }
      throw Error(`Impossible case: No WID box found in output`);
    } catch (e) {
      if (e instanceof ChangeBoxCreationError) {
        throw Error(
          "Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets."
        );
      }
      if (e instanceof NotEnoughFund) {
        // TODO: Send notification (https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/33)
        throw Error(
          'Transaction build failed due to ERG insufficiency in the watcher.'
        );
      }
      throw e;
    }
  };

  /**
   * Extracts timeout commitments (commitments with confirmation higher than redeem confirmation)
   * and creates the redeem transaction for invalid ones
   */
  job = async () => {
    if (!Transaction.watcherWID) {
      logger.warn('Watcher WID is not set. Cannot run commitment redeem job.');
      return;
    }
    const commitments = await this.watcherUtils.allTimeoutCommitments(
      this.redeemConfirmation
    );
    const WID = Transaction.watcherWID;
    logger.info(`Starting commitment redeem job`);
    let WIDBox = await this.boxes.getWIDBox(WID);
    for (const commitment of commitments) {
      const isCommitmentValid = await this.watcherUtils.isCommitmentValid(
        commitment
      );
      if (isCommitmentValid) {
        logger.debug(
          `Skipping commitment [${commitment.id}] redeem: The commitment is timed out but its still valid`
        );
        continue;
      }
      try {
        if (WIDBox.tokens().get(0).id().to_str() != WID) {
          logger.info(
            'WID Token is not the first token in WID Box, trying to detach WID token.'
          );
          DetachWID.detachWIDtx(this.txUtils, this.boxes, WID, WIDBox);
          WIDBox = await this.boxes.getWIDBox(WID);
        }
        logger.info(`Using WID Box [${WIDBox.box_id().to_str()}]`);
        const requiredValue =
          BigInt(getConfig().general.fee) +
          BigInt(getConfig().general.minBoxValue) * 2n;
        const feeBoxes: wasm.ErgoBox[] = [];
        if (BigInt(WIDBox.value().as_i64().to_str()) < requiredValue) {
          feeBoxes.push(
            ...(await this.boxes.getUserPaymentBox(requiredValue, [
              WIDBox.box_id().to_str(),
            ]))
          );
        }
        WIDBox = await this.redeemCommitmentTx(
          WID,
          WIDBox,
          decodeSerializedBox(commitment.boxSerialized),
          feeBoxes,
          requiredValue
        );
      } catch (e) {
        logger.warn(
          `Skipping the commitment [${commitment.id}] redeem due to occurred error: ${e.message} - ${e.stack}`
        );
      }
    }
    logger.info(`Commitment redeem job is done`, {
      count: commitments.length,
    });
  };
}
