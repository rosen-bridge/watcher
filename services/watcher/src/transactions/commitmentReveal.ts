import { Commitment, Observation } from '../utils/interfaces';
import { ErgoUtils } from '../ergo/utils';
import { Boxes } from '../ergo/boxes';
import { Buffer } from 'buffer';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { ChangeBoxCreationError } from '../errors/errors';
import { TxType } from '../database/entities/txEntity';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';

const logger = loggerFactory(import.meta.url);

export class CommitmentReveal {
  watcherUtils: WatcherUtils;
  txUtils: TransactionUtils;
  boxes: Boxes;

  constructor(
    watcherUtils: WatcherUtils,
    txUtils: TransactionUtils,
    boxes: Boxes
  ) {
    this.boxes = boxes;
    this.watcherUtils = watcherUtils;
    this.txUtils = txUtils;
  }
  /**
   * creates the trigger event transaction and submits to the transactionQueue
   * @param commitmentBoxes
   * @param RWTRepoBox
   * @param observation
   * @param WIDs
   * @param feeBoxes
   */
  triggerEventCreationTx = async (
    commitmentBoxes: Array<wasm.ErgoBox>,
    RWTRepoBox: wasm.ErgoBox,
    observation: ObservationEntity,
    WIDs: Array<Uint8Array>,
    feeBoxes: Array<wasm.ErgoBox>
  ) => {
    const allInputs = [...commitmentBoxes, RWTRepoBox, ...feeBoxes];
    const height = await ErgoNetwork.getMaxHeight(allInputs);
    const boxValues = commitmentBoxes
      .map((box) => BigInt(box.value().as_i64().to_str()))
      .reduce((a, b) => a + b, BigInt(0));
    const tokensCount = commitmentBoxes
      .map((item) => BigInt(item.tokens().get(0).amount().as_i64().to_str()))
      .reduce((a, b) => a + b, 0n);
    const triggerEvent = await this.boxes.createTriggerEvent(
      BigInt(boxValues),
      height,
      WIDs,
      observation,
      tokensCount
    );
    const inputBoxes = new wasm.ErgoBoxes(commitmentBoxes[0]);
    commitmentBoxes
      .slice(1, commitmentBoxes.length)
      .forEach((box) => inputBoxes.add(box));
    feeBoxes.forEach((box) => inputBoxes.add(box));
    try {
      const signed = await ErgoUtils.createAndSignTx(
        getConfig().general.secretKey,
        inputBoxes,
        [triggerEvent],
        height,
        new wasm.ErgoBoxes(RWTRepoBox)
      );
      await this.txUtils.submitTransaction(signed, TxType.TRIGGER, observation);
      logger.info(`Trigger event created with txId [${signed.id().to_str()}]`);
    } catch (e) {
      if (e instanceof ChangeBoxCreationError) {
        logger.warn(
          "Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets."
        );
      }
      logger.warn(
        `Skipping the event trigger creation due to occurred error: ${e.message} - ${e.stack}`
      );
    }
  };

  /**
   * Returns the valid bridge with the observation
   * It reproduces the bridge with their WID and check to match the saved commitment
   * @param commitments
   * @param observation
   * @param requiredRWTCount
   */
  commitmentCheck = (
    commitments: Array<Commitment>,
    observation: Observation,
    requiredRWTCount: bigint
  ): Array<Commitment> => {
    return commitments
      .filter((commitment) => {
        return (
          Buffer.from(
            ErgoUtils.commitmentFromObservation(observation, commitment.WID)
          ).toString('hex') === commitment.commitment
        );
      })
      .filter((commitment) => BigInt(commitment.rwtCount) == requiredRWTCount);
  };

  /**
   * Gets the created bridge and check if required number of bridge created in the network
   * If the number of valid bridge are more than the required bridge it generates the trigger event
   */
  job = async () => {
    const commitmentSets = await this.watcherUtils.allReadyCommitmentSets();
    logger.info(`Starting trigger event creation job`);
    for (const commitmentSet of commitmentSets) {
      try {
        const RWTRepoBox = await this.boxes.getRepoBox();
        const requiredRWTCount = BigInt(
          (RWTRepoBox.register_value(6)?.to_js() as Array<string>)[0]
        );
        const validCommitments = this.commitmentCheck(
          commitmentSet.commitments,
          commitmentSet.observation,
          requiredRWTCount
        );
        const requiredCommitments =
          ErgoUtils.requiredCommitmentCount(RWTRepoBox);
        logger.info(
          `Valid commitments: [${validCommitments.length}/${
            requiredCommitments + 1n
          }]`
        );
        if (BigInt(validCommitments.length) > requiredCommitments) {
          const commitmentBoxes = validCommitments.map(async (commitment) => {
            return await ErgoNetwork.unspentErgoBoxById(commitment.boxId);
          });
          await Promise.all(commitmentBoxes).then(async (cBoxes) => {
            const WIDs: Array<Uint8Array> = validCommitments.map(
              (commitment) => {
                return Buffer.from(commitment.WID, 'hex');
              }
            );
            await this.triggerEventCreationTx(
              cBoxes,
              RWTRepoBox,
              commitmentSet.observation,
              WIDs,
              await this.boxes.getUserPaymentBox(
                BigInt(getConfig().general.fee) * 2n
              )
            );
          });
        }
      } catch (e) {
        logger.warn(
          `Skipping the event trigger creation due to occurred error: ${e.message} - ${e.stack}`
        );
      }
    }
    logger.info(`Event trigger creation job is done`, {
      count: commitmentSets.length,
    });
  };
}
