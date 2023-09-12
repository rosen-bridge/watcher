import * as wasm from 'ergo-lib-wasm-nodejs';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils } from '../ergo/utils';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { TxType } from '../database/entities/txEntity';
import { TransactionUtils } from '../utils/watcherUtils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';

const logger = loggerFactory(import.meta.url);

class DetachWID {
  /**
   * creates a detach WID transaction and submits to the transactionQueue
   * @param WID
   * @param observation
   * @param eventDigest
   * @param permits
   * @param WIDBox
   * @param feeBoxes
   * @param requiredValue
   */

  static detachWIDtx = async (
    txUtils: TransactionUtils,
    boxes: Boxes,
    WID: string,
    WIDBox: wasm.ErgoBox
  ) => {
    const height = await ErgoNetwork.getHeight();
    const inputBoxes = new wasm.ErgoBoxes(WIDBox);
    const candidates = [];
    try {
      const fee = BigInt(getConfig().general.fee);
      const minBoxValue = BigInt(getConfig().general.minBoxValue);
      if (WIDBox.value().as_i64().as_num() < fee + minBoxValue) {
        const feeBoxes = await boxes.getUserPaymentBox(fee + minBoxValue, [
          WIDBox.box_id().to_str(),
        ]);
        feeBoxes.forEach((box) => inputBoxes.add(box));
      }
      const outWIDBox = boxes.createWIDBox(height, WID, fee.toString());
      candidates.push(outWIDBox);
      const signed = await ErgoUtils.createAndSignTx(
        getConfig().general.secretKey,
        inputBoxes,
        candidates,
        height
      );
      await txUtils.submitTransaction(signed, TxType.DETACH);
      logger.info(
        `WID detach tx [${signed.id().to_str()}] submitted to the queue`
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
        `Skipping the wid detach transaction due to occurred error: ${e.message}`
      );
      logger.warn(`${e.stack}`);
    }
  };
}

export { DetachWID };