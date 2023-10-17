import { describe, expect, it, beforeEach } from 'vitest';
import { CommitmentTx, CommitmentTxBuilder } from '../lib';
import {
  commitmentTxParams,
  observationEntity1,
  samplePermitBoxes,
  widBox,
} from './commitmentTxTestData';
import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';
import JsonBigInt from '@rosen-bridge/json-bigint';

describe('CommitmentTx', () => {
  beforeEach(() => {
    CommitmentTx['_instance'] = undefined;
  });

  describe('getInstance', () => {
    /**
     * @target should throw exception when CommitmentTx._instance is not yet
     * initialized
     * @dependencies
     * - None
     * @scenario
     * - call CommitmentTx.getInstance without calling CommitmentTx.init
     * - check CommitmentTx.getInstance to throw an exception
     * @expected
     * - CommitmentTx.getInstance should throw an exception
     */
    it(`should throw exception when CommitmentTx._instance is not yet
    initialized`, async () => {
      expect(() => CommitmentTx.getInstance()).toThrowError();
    });
  });

  describe('newBuilder', () => {
    /**
     * @target should throw exception when CommitmentTx._instance is not yet
     * initialized
     * @dependencies
     * - None
     * @scenario
     * - call CommitmentTx.getInstance without calling CommitmentTx.init
     * - check CommitmentTx.getInstance to throw an exception
     * @expected
     * - CommitmentTx.getInstance should throw an exception
     */
    it(`should throw exception when CommitmentTx._instance is not yet
    initialized`, async () => {
      CommitmentTx.init(
        commitmentTxParams.permitAddress,
        commitmentTxParams.permitBoxValue,
        commitmentTxParams.commitmentAddress,
        commitmentTxParams.commitmentBoxValue,
        commitmentTxParams.rwt,
        commitmentTxParams.txFee,
        commitmentTxParams.rwtRepo
      );

      const commitmentTxBuilder =
        CommitmentTx.getInstance().newBuilder(observationEntity1);

      expect(commitmentTxBuilder['permitAddress']).toEqual(
        commitmentTxParams.permitAddress
      );
      expect(commitmentTxBuilder['permitBoxValue']).toEqual(
        commitmentTxParams.permitBoxValue
      );
      expect(commitmentTxBuilder['permitScriptHash']).toEqual(
        commitmentTxParams.permitScriptHash
      );
      expect(commitmentTxBuilder['commitmentAddress']).toEqual(
        commitmentTxParams.commitmentAddress
      );
      expect(commitmentTxBuilder['commitmentBoxValue']).toEqual(
        commitmentTxParams.commitmentBoxValue
      );
      expect(commitmentTxBuilder['rwt']).toEqual(commitmentTxParams.rwt);
      expect(commitmentTxBuilder['txFee']).toEqual(commitmentTxParams.txFee);
      expect(commitmentTxBuilder['rwtRepo']).toEqual(
        commitmentTxParams.rwtRepo
      );
      expect(commitmentTxBuilder['observation']).toEqual(observationEntity1);
    });
  });
});

describe('CommitmentTxBuilder', () => {
  let commitmentTxBuilder: CommitmentTxBuilder;

  beforeEach(() => {
    const permitScriptHash = Buffer.from(
      blake2b(
        Buffer.from(
          ergoLib.Address.from_base58(commitmentTxParams.permitAddress)
            .to_ergo_tree()
            .to_base16_bytes(),
          'hex'
        ),
        undefined,
        32
      )
    ).toString('hex');
    commitmentTxBuilder = new CommitmentTxBuilder(
      commitmentTxParams.permitAddress,
      commitmentTxParams.permitBoxValue,
      permitScriptHash,
      commitmentTxParams.commitmentAddress,
      commitmentTxParams.commitmentBoxValue,
      commitmentTxParams.rwt,
      commitmentTxParams.txFee,
      commitmentTxParams.rwtRepo,
      observationEntity1
    );
  });

  describe('setWid', () => {
    /**
     * @target should set wid for the current instance
     * @dependencies
     * - None
     * @scenario
     * - call setWid with a value for wid
     * - check commitmentTxBuilder to have the right wid value set
     * @expected
     * - commitmentTxBuilder should have the right wid value set
     */
    it(`should set wid for the current instance`, async () => {
      const newWid =
        'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b';
      commitmentTxBuilder.setWid(newWid);
      expect(commitmentTxBuilder['wid']).toEqual(newWid);
    });
  });

  describe('setWidBox', () => {
    /**
     * @target should set widBox for the current instance
     * @dependencies
     * - None
     * @scenario
     * - call setWidBox with a value for widBox
     * - check commitmentTxBuilder to have the right widBox value set
     * @expected
     * - commitmentTxBuilder should have the right widBox value set
     */
    it(`should set widBox for the current instance`, async () => {
      commitmentTxBuilder.setWidBox(
        ergoLib.ErgoBox.from_json(JsonBigInt.stringify(widBox))
      );
      expect(commitmentTxBuilder['widBox'].box_id().to_str()).toEqual(
        widBox.boxId
      );
    });
  });

  describe('addPermits', () => {
    /**
     * @target should add passed permits to this.permits array. this.permits
     * should only contain the passed permits after calling addPermits for the
     * first time
     * @dependencies
     * - None
     * @scenario
     * - call addPermits with an array of permits
     * - check commitmentTxBuilder.permits to contain only the passed permits
     * after the call
     * @expected
     * - commitmentTxBuilder.permits should contain only the passed permits
     * after the call
     */
    it(`should add passed permits to this.permits array. this.permits should
    only contain the passed permits after calling addPermits for the first time`, async () => {
      const permitBoxes = samplePermitBoxes
        .slice(0, 5)
        .map((boxJson) =>
          ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxJson))
        );

      commitmentTxBuilder.addPermits(permitBoxes);

      expect(
        commitmentTxBuilder['permits']
          .map((box) => box.box_id().to_str())
          .sort()
      ).toEqual(permitBoxes.map((box) => box.box_id().to_str()).sort());
    });

    /**
     * @target should add passed permits to this.permits array. after calling,
     * this.permits should contain both passed permits and already existing
     * permits
     * @dependencies
     * - None
     * @scenario
     * - call addPermits with an array of permits
     * - call addPermits again with another array of permits
     * - check commitmentTxBuilder.permits to contain both set of permits
     * @expected
     * - commitmentTxBuilder.permits should contain both set of permits
     */
    it(`should add passed permits to this.permits array. after calling,
    this.permits should contain both passed permits and already existing permits`, async () => {
      const permitBoxes = samplePermitBoxes
        .slice(0, 10)
        .map((boxJson) =>
          ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxJson))
        );
      commitmentTxBuilder.addPermits(permitBoxes.slice(0, 5));
      commitmentTxBuilder.addPermits(permitBoxes.slice(5, 10));

      expect(
        commitmentTxBuilder['permits']
          .map((box) => box.box_id().to_str())
          .sort()
      ).toEqual(permitBoxes.map((box) => box.box_id().to_str()).sort());
    });

    /**
     * @target should throw exception when passed permits contain repetitive boxes
     * @dependencies
     * - None
     * @scenario
     * - call addPermits with an array of permits
     * - call addPermits again with another array that contains a repetitive
     * permit
     * - check commitmentTxBuilder.permits to throw exception
     * @expected
     * - commitmentTxBuilder.permits should throw exception
     */
    it(`should throw exception when passed permits contain repetitive boxes`, async () => {
      const permitBoxes = samplePermitBoxes
        .slice(0, 10)
        .map((boxJson) =>
          ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxJson))
        );
      commitmentTxBuilder.addPermits(permitBoxes.slice(0, 5));

      expect(() =>
        commitmentTxBuilder.addPermits(permitBoxes.slice(1, 2))
      ).toThrow();
    });
  });

  describe('setBoxIterator', () => {
    /**
     * @target should set boxIterator for the current instance
     * @dependencies
     * - None
     * @scenario
     * - call setBoxIterator with a value for boxIterator
     * - check commitmentTxBuilder to have the right boxIterator value set
     * @expected
     * - commitmentTxBuilder should have the right boxIterator value set
     */
    it(`should set boxIterator for the current instance`, async () => {
      const boxIterator = {
        next: async (): Promise<ergoLib.ErgoBox | undefined> => {
          return ergoLib.ErgoBox.from_json(JsonBigInt.stringify(widBox));
        },
      };

      commitmentTxBuilder.setBoxIterator(boxIterator);

      expect(commitmentTxBuilder['boxIterator']).toBe(boxIterator);
    });
  });

  describe('setCreationHeight', () => {
    /**
     * @target should set creation height for the current instance
     * @dependencies
     * - None
     * @scenario
     * - call setCreationHeight with a value for height
     * - check commitmentTxBuilder to have the right height set
     * @expected
     * - commitmentTxBuilder should have the right height set
     */
    it(`should set creation height for the current instance`, async () => {
      const newHeight = 171717;
      commitmentTxBuilder.setCreationHeight(newHeight);
      expect(commitmentTxBuilder['height']).toEqual(newHeight);
    });
  });
});
