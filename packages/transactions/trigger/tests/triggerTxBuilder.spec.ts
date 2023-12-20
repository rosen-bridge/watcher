import JsonBigInt from '@rosen-bridge/json-bigint';
import * as ergoLib from 'ergo-lib-wasm-nodejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TriggerTxBuilder } from '../lib';
import { hexToUint8Array, uint8ArrayToHex } from '../lib/utils';
import { mockedErgoExplorerClientFactory } from './mocked/ergoExplorerClient.mock';
import {
  createCommitmentErgoBox,
  getPayBoxIterator,
  sampleCommitmentBoxes,
  sampleWid,
  toFakeErgoBox,
} from './triggerTxBuilderTestData';
import {
  changeAddress,
  observationEntity1,
  sampleRwtRepoboxInfo,
  triggerTxParams,
} from './triggerTxTestData';

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
      triggerTxBuilder.addCommitments([commitment]);

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
      const commitments = sampleCommitmentBoxes.map((boxInfo) =>
        ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxInfo))
      );

      triggerTxBuilder.addCommitments(commitments.slice(0, 2));
      triggerTxBuilder.addCommitments(commitments.slice(2));

      expect(
        triggerTxBuilder['commitments']
          .map((box) => box.box_id().to_str())
          .sort()
      ).toEqual(commitments.map((box) => box.box_id().to_str()).sort());
    });

    /**
     * @target should throw exception when passed commitments contain repetitive
     * boxes
     * @dependencies
     * @scenario
     * - call addCommitment
     * - call addCommitment again with repetitive boxes
     * - check TriggerTxBuilder.commitments to throw exception
     * @expected
     * - TriggerTxBuilder.commitments should throw exception
     */
    it(`should throw exception when passed commitments contain repetitive boxes`, async () => {
      const commitments = sampleCommitmentBoxes.map((boxInfo) =>
        ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxInfo))
      );

      triggerTxBuilder.addCommitments(commitments.slice(0, 5));
      expect(() =>
        triggerTxBuilder.addCommitments(commitments.slice(2, 3))
      ).toThrow('already included in commitments');
    });

    /**
     * @target should throw exception when passed commitment doesn't have the
     * right commitment address
     * @dependencies
     * @scenario
     * - call addCommitment with a commitment having the wrong commitment
     *   address
     * - check TriggerTxBuilder.commitments to throw exception
     * @expected
     * - TriggerTxBuilder.commitments should throw exception
     */
    it(`should throw exception when passed commitment doesn't have the right
    commitment address`, async () => {
      const commitment = createCommitmentErgoBox(
        'nB3L2PD3JzpCPns7SoypaDJTg4KbG6UQBPknQuM3WZ4ZhPj3TGV5R5YArit7trzUum77qJ76JLLiJfW3Au8o3AvMh1suY2rcRm1UPfroUiTZfQrNL8izs6CBJYwMLf5jDSt3YwcFEPVYG',
        triggerTxBuilder['rwt'],
        triggerTxBuilder['rwtRepo'].getCommitmentRwtCount(),
        triggerTxBuilder['permitScriptHash'],
        sampleWid,
        triggerTxBuilder['observation'].requestId,
        triggerTxBuilder['calcEventDigest'](sampleWid)
      );

      expect(() => triggerTxBuilder.addCommitments([commitment])).toThrow(
        `doesn't have the right commitment address`
      );
    });

    /**
     * @target should throw exception when passed commitment doesn't have the
     * rwt token
     * @dependencies
     * @scenario
     * - call addCommitment with a commitment not having the rwt token
     * - check TriggerTxBuilder.commitments to throw exception
     * @expected
     * - TriggerTxBuilder.commitments should throw exception
     */
    it(`should throw exception when passed commitment doesn't have the rwt token`, async () => {
      const commitment = createCommitmentErgoBox(
        triggerTxBuilder['commitmentAddress'],
        'e4dca5c7b35ead14e65699505bdd65af5c00b2249327e0ed9ba0e2b509101a82',
        triggerTxBuilder['rwtRepo'].getCommitmentRwtCount(),
        triggerTxBuilder['permitScriptHash'],
        sampleWid,
        triggerTxBuilder['observation'].requestId,
        triggerTxBuilder['calcEventDigest'](sampleWid)
      );

      expect(() => triggerTxBuilder.addCommitments([commitment])).toThrow(
        `should have rwt as the first token`
      );
    });

    /**
     * @target should throw exception when passed commitment doesn't have the
     * required amount of rwt
     * @dependencies
     * @scenario
     * - call addCommitment with a commitment not having enough rwt tokens
     * - check TriggerTxBuilder.commitments to throw exception
     * @expected
     * - TriggerTxBuilder.commitments should throw exception
     */
    it(`should throw exception when passed commitment doesn't have the required
    amount of rwt`, async () => {
      const commitment = createCommitmentErgoBox(
        triggerTxBuilder['commitmentAddress'],
        triggerTxBuilder['rwt'],
        1n,
        triggerTxBuilder['permitScriptHash'],
        sampleWid,
        triggerTxBuilder['observation'].requestId,
        triggerTxBuilder['calcEventDigest'](sampleWid)
      );

      expect(() => triggerTxBuilder.addCommitments([commitment])).toThrow(
        `should have [${triggerTxBuilder[
          'rwtRepo'
        ].getCommitmentRwtCount()}] rwt tokens buts has`
      );
    });

    /**
     * @target should throw exception when passed commitment doesn't have a wid
     * @dependencies
     * @scenario
     * - call addCommitment with a commitment that doesn't have a wid
     * - check TriggerTxBuilder.commitments to throw exception
     * @expected
     * - TriggerTxBuilder.commitments should throw exception
     */
    it(`should throw exception when passed commitment doesn't have a wid`, async () => {
      const commitment = createCommitmentErgoBox(
        triggerTxBuilder['commitmentAddress'],
        triggerTxBuilder['rwt'],
        triggerTxBuilder['rwtRepo'].getCommitmentRwtCount(),
        triggerTxBuilder['permitScriptHash'],
        undefined,
        triggerTxBuilder['observation'].requestId,
        triggerTxBuilder['calcEventDigest'](sampleWid)
      );

      expect(() => triggerTxBuilder.addCommitments([commitment])).toThrow(
        `commitment should have a wid defined in its R4 register`
      );
    });

    /**
     * @target should throw exception when passed commitment doesn't have an
     * event digest
     * @dependencies
     * @scenario
     * - call addCommitment with a commitment that doesn't have an event digest
     * - check TriggerTxBuilder.commitments to throw exception
     * @expected
     * - TriggerTxBuilder.commitments should throw exception
     */
    it(`should throw exception when passed commitment doesn't have an event
    digest`, async () => {
      const commitment = createCommitmentErgoBox(
        triggerTxBuilder['commitmentAddress'],
        triggerTxBuilder['rwt'],
        triggerTxBuilder['rwtRepo'].getCommitmentRwtCount(),
        triggerTxBuilder['permitScriptHash'],
        sampleWid,
        triggerTxBuilder['observation'].requestId,
        undefined
      );

      expect(() => triggerTxBuilder.addCommitments([commitment])).toThrow(
        `commitment should have an event digest defined in its R6 register`
      );
    });

    /**
     * @target should throw exception when passed commitment with an incorrect
     * event digest
     * @dependencies
     * @scenario
     * - call addCommitment with a commitment that has an incorrect event digest
     * - check TriggerTxBuilder.commitments to throw exception
     * @expected
     * - TriggerTxBuilder.commitments should throw exception
     */
    it(`should throw exception when passed commitment with an incorrect event
    digest`, async () => {
      const commitment = createCommitmentErgoBox(
        triggerTxBuilder['commitmentAddress'],
        triggerTxBuilder['rwt'],
        triggerTxBuilder['rwtRepo'].getCommitmentRwtCount(),
        triggerTxBuilder['permitScriptHash'],
        sampleWid,
        triggerTxBuilder['observation'].requestId,
        hexToUint8Array('abcd')
      );

      expect(() => triggerTxBuilder.addCommitments([commitment])).toThrow(
        `commitment doesn't have the correct event digest`
      );
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

      triggerTxBuilder.addCommitments(commitments);

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

  describe('build', () => {
    /**
     * @target should build an unsigned transaction to generate a trigger box
     * @dependencies
     * - ErgoExplorerClientFactory
     * @scenario
     * - mock ErgoExplorerClientFactory
     * - setup TriggerTxBuilder instance
     * - call build
     * - check expected functions to have been called
     * - check transaction output boxes
     * @expected
     * - createTriggerBox should have been called
     * - transaction output boxes should include the trigger box
     * - trigger box should have right amount of Ergs
     */
    it(`should build an unsigned transaction to generate a commitment when there
    are no residual tokens.`, async () => {
      // mock ErgoExplorerClientFactory
      const mockedExplorerClient = mockedErgoExplorerClientFactory(
        ''
      ) as unknown as ReturnType<
        typeof triggerTxBuilder['rwtRepo']['explorerClient']
      >;
      triggerTxBuilder['rwtRepo']['explorerClient'] = mockedExplorerClient;

      // setup TriggerTxBuilder instance
      const height = 100;
      triggerTxBuilder.setCreationHeight(height);

      triggerTxBuilder.setBoxIterator(getPayBoxIterator(height, changeAddress));

      const commitments = sampleCommitmentBoxes.map((boxInfo) =>
        ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxInfo))
      );
      triggerTxBuilder.addCommitments(commitments);

      const commitmentsValue = commitments
        .map((box) => BigInt(box.value().as_i64().to_str()))
        .reduce((sum, val) => sum + val, 0n);
      const rwtCount = commitments
        .map((commitment) =>
          BigInt(commitment.tokens().get(0).amount().as_i64().to_str())
        )
        .reduce((sum, val) => sum + val, 0n);

      const createTriggerBoxSpy = vi.spyOn(
        triggerTxBuilder as any,
        'createTriggerBox'
      );

      // call build
      const { unsignedTx } = await triggerTxBuilder.build();

      const triggerBox = unsignedTx.output_candidates().get(0);
      const txInputcommitments = [];
      for (let i = 0; i < commitments.length; i++) {
        txInputcommitments.push(unsignedTx.inputs().get(i));
      }

      // check expected functions to have been called
      expect(createTriggerBoxSpy).toHaveBeenCalledOnce();

      // check transaction output boxes
      expect(toFakeErgoBox(triggerBox).box_id().to_str()).toEqual(
        toFakeErgoBox(
          triggerTxBuilder['createTriggerBox'](rwtCount, commitmentsValue)
        )
          .box_id()
          .to_str()
      );

      expect(triggerBox.value().as_i64().to_str()).toEqual(
        commitmentsValue.toString()
      );

      // check transaction input boxes
      expect(
        txInputcommitments.map((box) => box.box_id().to_str()).sort()
      ).toEqual(commitments.map((box) => box.box_id().to_str()).sort());
    });
  });
});
