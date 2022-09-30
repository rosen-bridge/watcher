import { Commitment, Observation } from '../utils/interfaces';
import { ErgoUtils } from '../ergo/utils';
import { Boxes } from '../ergo/boxes';
import { Buffer } from 'buffer';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { boxCreationError, NotEnoughFund } from '../errors/errors';
import { Config } from '../config/config';
import { TxType } from '../database/entities/txEntity';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';

const config = Config.getConfig();
const txFee = BigInt(config.fee);

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
   * @param observation
   * @param WIDs
   * @param feeBoxes
   */
  triggerEventCreationTx = async (
    commitmentBoxes: Array<wasm.ErgoBox>,
    observation: ObservationEntity,
    WIDs: Array<Uint8Array>,
    feeBoxes: Array<wasm.ErgoBox>
  ) => {
    const height = await ErgoNetwork.getHeight();
    const boxValues = commitmentBoxes
      .map((box) => BigInt(box.value().as_i64().to_str()))
      .reduce((a, b) => a + b, BigInt(0));
    const triggerEvent = await this.boxes.createTriggerEvent(
      BigInt(boxValues),
      height,
      WIDs,
      observation
    );
    const inputBoxes = new wasm.ErgoBoxes(commitmentBoxes[0]);
    commitmentBoxes
      .slice(1, commitmentBoxes.length)
      .forEach((box) => inputBoxes.add(box));
    feeBoxes.forEach((box) => inputBoxes.add(box));
    const repoBox = await this.boxes.getRepoBox();
    try {
      const signed = await ErgoUtils.createAndSignTx(
        config.secretKey,
        inputBoxes,
        [triggerEvent],
        height,
        new wasm.ErgoBoxes(repoBox)
      );
      await this.txUtils.submitTransaction(signed, observation, TxType.TRIGGER);
      console.log('Trigger event created with tx id:', signed.id().to_str());
    } catch (e) {
      if (e instanceof boxCreationError) {
        console.log(
          "Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets."
        );
      } else console.log(e);
      console.log('Skipping the event trigger creation.');
    }
  };

  /**
   * Returns the valid bridge with the observation
   * It reproduces the bridge with their WID and check to match the saved commitment
   * @param commitments
   * @param observation
   */
  commitmentCheck = (
    commitments: Array<Commitment>,
    observation: Observation
  ): Array<Commitment> => {
    return commitments.filter((commitment) => {
      return (
        Buffer.from(
          ErgoUtils.commitmentFromObservation(observation, commitment.WID)
        ).toString('hex') === commitment.commitment
      );
    });
  };

  /**
   * Gets the created bridge and check if required number of bridge created in the network
   * If the number of valid bridge are more than the required bridge it generates the trigger event
   */
  job = async () => {
    const commitmentSets = await this.watcherUtils.allReadyCommitmentSets();
    console.log(
      'Starting trigger event creation with',
      commitmentSets.length,
      'number of commitment sets'
    );
    for (const commitmentSet of commitmentSets) {
      try {
        const validCommitments = this.commitmentCheck(
          commitmentSet.commitments,
          commitmentSet.observation
        );
        const requiredCommitments = await ErgoUtils.requiredCommitmentCount(
          await this.boxes.getRepoBox()
        );
        console.log(
          'required number of commitments is',
          requiredCommitments,
          'available valild commitments is:',
          validCommitments.length
        );
        if (BigInt(validCommitments.length) >= requiredCommitments) {
          const commitmentBoxes = validCommitments.map(async (commitment) => {
            return await ErgoNetwork.boxById(commitment.boxId);
          });
          await Promise.all(commitmentBoxes).then(async (cBoxes) => {
            const WIDs: Array<Uint8Array> = validCommitments.map(
              (commitment) => {
                return Buffer.from(commitment.WID, 'hex');
              }
            );
            await this.triggerEventCreationTx(
              cBoxes,
              commitmentSet.observation,
              WIDs,
              await this.boxes.getUserPaymentBox(txFee)
            );
          });
        }
      } catch (e) {
        if (!(e instanceof NotEnoughFund)) console.log(e);
        console.log('Skipping the event trigger creation');
      }
    }
  };
}
