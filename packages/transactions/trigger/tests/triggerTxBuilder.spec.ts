import JsonBigInt from '@rosen-bridge/json-bigint';
import * as ergoLib from 'ergo-lib-wasm-nodejs';
import { beforeEach, describe, expect, it } from 'vitest';
import { TriggerTxBuilder } from '../lib';
import { sampleCommitmentBoxes } from './triggerTxBuilderTestData';
import {
  changeAddress,
  observationEntity1,
  sampleRwtRepoboxInfo,
  triggerTxParams,
} from './triggerTxTestData';
import { hexToUint8Array, uint8ArrayToHex } from '../lib/utils';

describe('TriggerTxBuilder', () => {
  let triggerTxBuilder: TriggerTxBuilder;

  beforeEach(() => {
    triggerTxBuilder = new TriggerTxBuilder(
      triggerTxParams.triggerAddress,
      triggerTxParams.commitmentAddress,
      triggerTxParams.permitAddress,
      changeAddress,
      triggerTxParams.rwt,
      triggerTxParams.txFee,
      triggerTxParams.rwtRepo,
      observationEntity1
    );
  });

  describe('setCreationHeight', () => {
    /**
     * @target should set creation height for the current instance
     * @dependencies
     * @scenario
     * - call setCreationHeight
     * - check TriggerTxBuilder to have the right height set
     * @expected
     * - TriggerTxBuilder should have the right height set
     */
    it(`should set creation height for the current instance`, async () => {
      const newHeight = 5555;
      triggerTxBuilder.setCreationHeight(newHeight);
      expect(triggerTxBuilder['creationHeight']).toEqual(newHeight);
    });
  });

  describe('setBoxIterator', () => {
    /**
     * @target should set boxIterator for the current instance
     * @dependencies
     * @scenario
     * - call setBoxIterator
     * - check TriggerTxBuilder to have the right boxIterator value set
     * @expected
     * - TriggerTxBuilder should have the right boxIterator value set
     */
    it(`should set boxIterator for the current instance`, async () => {
      const boxIterator = {
        next: (): IteratorResult<ergoLib.ErgoBox, undefined> => {
          return {
            value: ergoLib.ErgoBox.from_json(
              JsonBigInt.stringify(sampleRwtRepoboxInfo)
            ),
            done: false,
          };
        },
      };

      triggerTxBuilder.setBoxIterator(boxIterator);

      expect(triggerTxBuilder['boxIterator']).toBe(boxIterator);
    });
  });

  describe('addCommitment', () => {
    /**
     * @target should only contain the passed commitment after calling it for
     * the first time
     * @dependencies
     * @scenario
     * - call addCommitment
     * - check TriggerTxBuilder.commitments to contain only the passed
     *   commitment
     * @expected
     * - TriggerTxBuilder.commitments should contain only the passed commitment
     */
    it(`should only contain the passed commitment after calling it for the first
    time`, async () => {
      const commitment = ergoLib.ErgoBox.from_json(
        JsonBigInt.stringify(sampleCommitmentBoxes[0])
      );
      triggerTxBuilder.addCommitment(commitment);

      expect(
        triggerTxBuilder['commitments']
          .map((box) => box.box_id().to_str())
          .sort()
      ).toEqual([commitment.box_id().to_str()]);
    });

    /**
     * @target should contain both the passed commitment and already existing
     * commitments when called more than once
     * @dependencies
     * @scenario
     * - call addCommitment more than once
     * - check TriggerTxBuilder.commitments to contain all the commitments
     * @expected
     * - TriggerTxBuilder.commitments should contain all the commitments
     */
    it(`should contain both the passed commitment and already existing
    commitments when called more than once`, async () => {
      const commitments = sampleCommitmentBoxes
        .slice(0, 3)
        .map((boxInfo) =>
          ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxInfo))
        );

      commitments.forEach((commitment) =>
        triggerTxBuilder.addCommitment(commitment)
      );

      expect(
        triggerTxBuilder['commitments']
          .map((box) => box.box_id().to_str())
          .sort()
      ).toEqual(commitments.map((box) => box.box_id().to_str()).sort());
    });
  });

  describe('createTriggerBox', () => {
    /**
     * @target should create a trigger box from instance's properties
     * @dependencies
     * @scenario
     * - setup triggerTxBuilder instance
     * - call createTriggerBox
     * - check returned box to have the right properties set
     * @expected
     * - returned box should have the right properties set
     */
    it(`should create a trigger box from instance's properties`, async () => {
      const height = 100;
      triggerTxBuilder.setCreationHeight(height);

      const commitments = sampleCommitmentBoxes
        .slice(0, 3)
        .map((boxInfo) =>
          ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxInfo))
        );
      commitments.forEach((commitment) =>
        triggerTxBuilder.addCommitment(commitment)
      );

      const rsnValue =
        BigInt(triggerTxBuilder['wids'].length) *
        triggerTxBuilder['rwtRepo'].getCommitmentRwtCount();
      const value = 10_000_000_000n;
      const triggerBox = triggerTxBuilder['createTriggerBox'](rsnValue, value);

      expect(triggerBox.value().as_i64().to_str()).toEqual(value.toString());

      expect(
        ergoLib.Address.recreate_from_ergo_tree(
          triggerBox.ergo_tree()
        ).to_base58(ergoLib.NetworkPrefix.Mainnet)
      ).toEqual(triggerTxBuilder['triggerAddress']);

      expect(triggerBox.creation_height()).toEqual(height);

      expect(triggerBox.tokens().get(0).id().to_str()).toEqual(
        triggerTxBuilder['rwt']
      );
      expect(triggerBox.tokens().get(0).amount().as_i64().to_str()).toEqual(
        rsnValue.toString()
      );

      expect(triggerBox.register_value(4)?.to_coll_coll_byte()).toEqual(
        triggerTxBuilder['wids'].map((wid) => hexToUint8Array(wid))
      );

      expect(triggerBox.register_value(5)!.to_coll_coll_byte()).toEqual(
        triggerTxBuilder['eventData'].map((data) => new Uint8Array(data))
      );

      expect(
        uint8ArrayToHex(triggerBox.register_value(6)!.to_byte_array())
      ).toEqual(triggerTxBuilder['permitScriptHash']);
    });
  });
});
