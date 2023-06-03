import * as wasm from 'ergo-lib-wasm-nodejs';
import { TransactionUtils } from '../utils/watcherUtils';
import { Boxes } from '../ergo/boxes';
import { AddressBalance } from '../ergo/interfaces';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { loggerFactory } from '../log/Logger';
import { ErgoUtils } from '../ergo/utils';
import { getConfig } from '../config/config';
import { TxType } from '../database/entities/txEntity';

const logger = loggerFactory(import.meta.url);

export class AdminActions {
  protected static instance: AdminActions | undefined;
  protected static isSetupCalled = false;
  static txUtils: TransactionUtils;
  static boxes: Boxes;

  /**
   * Set up the AdminActions class
   * @param txUtils
   * @param boxes
   */
  static setup = async (txUtils: TransactionUtils, boxes: Boxes) => {
    if (!AdminActions.isSetupCalled) {
      AdminActions.txUtils = txUtils;
      AdminActions.boxes = boxes;
      AdminActions.isSetupCalled = true;
    }
  };

  /**
   * Get the instance of AdminActions
   */
  static getInstance = () => {
    if (!AdminActions.instance) {
      if (AdminActions.isSetupCalled)
        AdminActions.instance = new AdminActions();
      else throw new Error("Setup doesn't called for AdminActions");
    }
    return AdminActions.instance;
  };

  /**
   * Withdraw from the wallet of the watcher
   * @param amount to withdraw
   * @param toAddress destination address
   */
  withdrawFromWallet = async (amount: AddressBalance, toAddress: string) => {
    const assetsMap = new Map<string, bigint>();
    amount.tokens.forEach((token) => {
      assetsMap.set(token.tokenId, token.amount);
    });
    const coveringBoxes = await AdminActions.boxes.getCoveringBoxes(
      amount.nanoErgs,
      assetsMap
    );
    const height = await ErgoNetwork.getHeight();
    const address = wasm.Address.from_base58(toAddress);

    // create input boxes
    const inputBoxes = new wasm.ErgoBoxes(coveringBoxes[0]);
    for (let i = 1; i < coveringBoxes.length; i++) {
      inputBoxes.add(coveringBoxes[i]);
    }

    // create output box
    const userBox = AdminActions.boxes.createCustomBox(
      wasm.Contract.pay_to_address(address),
      amount,
      height
    );
    const candidates = [userBox];

    // create transaction
    try {
      const signed = await ErgoUtils.createAndSignTx(
        getConfig().general.secretKey,
        inputBoxes,
        candidates,
        height
      );
      await AdminActions.txUtils.submitTransaction(signed, TxType.REDEEM);
      logger.info(
        `Withdraw tx [${signed.id().to_str()}] submitted to the queue`
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
}
