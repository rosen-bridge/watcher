import * as wasm from 'ergo-lib-wasm-nodejs';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils } from '../ergo/utils';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { TxType } from '../database/entities/txEntity';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { getConfig } from '../config/config';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

class RewardCollection {
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
   * creates a rsn exchange transaction and submits to the transactionQueue
   */
  rewardCollectionTx = async (
    eRsnBoxes: wasm.ErgoBox[],
    eRsnCount: bigint,
    eRsnTokenId: string,
    emissionBox: wasm.ErgoBox,
    feeBoxes: Array<wasm.ErgoBox>
  ) => {
    const height = await ErgoNetwork.getHeight();
    const inputBoxes = new wasm.ErgoBoxes(emissionBox);
    eRsnBoxes.forEach((box) => inputBoxes.add(box));
    feeBoxes.forEach((box) => inputBoxes.add(box));
    const candidates = [];
    try {
      const emissionOut = this.boxes.createEmissionBox(
        BigInt(emissionBox.value().as_i64().to_str()),
        height,
        BigInt(emissionBox.tokens().get(1).amount().as_i64().to_str()) -
          eRsnCount,
        BigInt(emissionBox.tokens().get(2).amount().as_i64().to_str()) +
          eRsnCount,
        eRsnTokenId
      );
      candidates.push(emissionOut);
      const rewardBox = this.boxes.createCustomBox(
        wasm.Contract.pay_to_address(
          wasm.Address.from_base58(getConfig().general.rewardCollectionAddress)
        ),
        {
          nanoErgs: BigInt(getConfig().general.minBoxValue),
          tokens: [{ tokenId: getConfig().rosen.RSN, amount: eRsnCount }],
        },
        height
      );
      candidates.push(rewardBox);
      const signed = await ErgoUtils.createAndSignTx(
        getConfig().general.secretKey,
        inputBoxes,
        candidates,
        height
      );
      await this.txUtils.submitTransaction(signed, TxType.REWARD);
      logger.info(
        `Reward collection tx [${signed.id().to_str()}] submitted to the queue`
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
        `Skipping the wid reward collection transaction due to occurred error: ${e.message}`
      );
      logger.warn(`${e.stack}`);
    }
  };

  /**
   * find all eRsn boxes then change and send to reward address
   */
  job = async () => {
    logger.info('Starting reward collection job');
    try {
      const activeTx =
        await this.watcherUtils.dataBase.getActiveTransactionsByType([
          TxType.REWARD,
        ]);
      if (activeTx.length > 0) {
        logger.info(
          'Aborting reward collection, has unconfirmed reward collection transactions'
        );
        return;
      }
      const emissionBox = await this.boxes.getEmissionBox();
      logger.debug(
        `Found emission box with boxId [${emissionBox.box_id().to_str()}]`
      );
      const eRsnTokenId = emissionBox.tokens().get(2).id().to_str();
      logger.debug(`eRsn token id is :[${eRsnTokenId}]`);
      const eRsnBoxes = await this.boxes.getERsnBoxes(eRsnTokenId);
      const eRsnCount = ErgoUtils.getBoxAssetsSum(eRsnBoxes).filter(
        (token) => token.tokenId == eRsnTokenId
      )[0].amount;
      if (eRsnCount < getConfig().general.rewardCollectionThreshold) {
        logger.debug(
          `Not enough eRsn found to collect and change rewards, only found ${eRsnCount}`
        );
        return;
      }
      logger.info(
        `Found ${eRsnCount} eRsn tokens, trying to collect and change eRsn rewards`
      );
      const fee = BigInt(getConfig().general.fee);
      const minBoxValue = BigInt(getConfig().general.minBoxValue);
      let feeBoxes: Array<wasm.ErgoBox> = [];
      if (ErgoUtils.getBoxValuesSum(eRsnBoxes) < fee + 2n * minBoxValue) {
        feeBoxes = await this.boxes.getUserPaymentBox(
          fee + minBoxValue,
          eRsnBoxes.map((box) => box.box_id().to_str())
        );
      }
      this.rewardCollectionTx(
        eRsnBoxes,
        eRsnCount,
        eRsnTokenId,
        emissionBox,
        feeBoxes
      );
    } catch (e) {
      logger.warn(
        `Skipping reward collection due to occurred error: ${e.message} - ${e.stack}`
      );
    }
  };
}

export { RewardCollection };
