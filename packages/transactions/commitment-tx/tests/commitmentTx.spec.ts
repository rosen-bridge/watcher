import JsonBigInt from '@rosen-bridge/json-bigint';
import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommitmentTx, CommitmentTxBuilder } from '../lib';
import {
  changeAddress,
  commitmentTxParams,
  observationEntity1,
  samplePermitBoxes,
  widBox,
} from './commitmentTxTestData';

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
    vi.resetAllMocks();

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

  describe('createPermitBox', () => {
    /**
     * @target should create permit box from instance's properties
     * @dependencies
     * - None
     * @scenario
     * - call setWid
     * - call setCreationHeight
     * - call createPermitBox with a value for rwtCount
     * - check returned box to have the right properties set
     * @expected
     * - returned box should have the right properties set
     */
    it(`should create permit box from instance's properties`, async () => {
      const r4 = ergoLib.Constant.decode_from_base16(
        samplePermitBoxes[0].additionalRegisters.R4.serializedValue
      ).to_coll_coll_byte();
      const wid = Buffer.from(r4[0]).toString('hex');
      commitmentTxBuilder.setWid(wid);

      const height = 100;
      commitmentTxBuilder.setCreationHeight(height);

      const rwtCount = 20n;
      const permitBox = commitmentTxBuilder['createPermitBox'](rwtCount);

      expect(permitBox.value().as_i64().to_str()).toEqual(
        commitmentTxBuilder['permitBoxValue'].toString()
      );

      expect(
        ergoLib.Address.recreate_from_ergo_tree(
          permitBox.ergo_tree()
        ).to_base58(ergoLib.NetworkPrefix.Mainnet)
      ).toEqual(commitmentTxBuilder['permitAddress']);

      expect(permitBox.creation_height()).toEqual(
        commitmentTxBuilder['height']
      );

      expect(permitBox.tokens().get(0).id().to_str()).toEqual(
        commitmentTxBuilder['rwt']
      );
      expect(permitBox.tokens().get(0).amount().as_i64().to_str()).toEqual(
        rwtCount.toString()
      );

      expect(permitBox.register_value(4)?.to_coll_coll_byte()).toEqual(r4);
    });
  });

  describe('createCommitmentBox', () => {
    /**
     * @target should create a commitment box from instance's properties
     * @dependencies
     * - None
     * @scenario
     * - call setWid
     * - call setCreationHeight
     * - call createCommitmentBox
     * - check returned box to have the right properties set
     * @expected
     * - returned box should have the right properties set
     */
    it(`should create a commitment box from instance's properties`, async () => {
      const r4 = ergoLib.Constant.decode_from_base16(
        samplePermitBoxes[0].additionalRegisters.R4.serializedValue
      ).to_coll_coll_byte();
      const wid = Buffer.from(r4[0]).toString('hex');
      commitmentTxBuilder.setWid(wid);

      const height = 100;
      commitmentTxBuilder.setCreationHeight(height);

      const commitmentBox = commitmentTxBuilder['createCommitmentBox']();

      expect(commitmentBox.value().as_i64().to_str()).toEqual(
        commitmentTxBuilder['commitmentBoxValue'].toString()
      );

      expect(
        ergoLib.Address.recreate_from_ergo_tree(
          commitmentBox.ergo_tree()
        ).to_base58(ergoLib.NetworkPrefix.Mainnet)
      ).toEqual(commitmentTxBuilder['commitmentAddress']);

      expect(commitmentBox.creation_height()).toEqual(
        commitmentTxBuilder['height']
      );

      expect(commitmentBox.tokens().get(0).id().to_str()).toEqual(
        commitmentTxBuilder['rwt']
      );
      expect(commitmentBox.tokens().get(0).amount().as_i64().to_str()).toEqual(
        commitmentTxBuilder['rwtRepo'].getCommitmentRwtCount().toString()
      );

      expect(commitmentBox.register_value(4)?.to_coll_coll_byte()).toEqual(r4);
      expect(
        Buffer.from(
          commitmentBox.register_value(5)!.to_coll_coll_byte()[0]
        ).toString('hex')
      ).toEqual(commitmentTxBuilder['eventId']);
      expect(commitmentBox.register_value(6)?.to_byte_array()).toEqual(
        commitmentTxBuilder['eventDigest']
      );
      expect(
        Buffer.from(commitmentBox.register_value(7)!.to_byte_array()).toString(
          'hex'
        )
      ).toEqual(commitmentTxBuilder['permitScriptHash']);
    });
  });

  describe('build', () => {
    /**
     * @target should build an unsigned transaction which spends wid and permit
     * boxes to generate a commitment, wid and residual permit boxes. A
     * @dependencies
     * - None
     * @scenario
     * - call setWid
     * - call setWidBox
     * - call addPermits
     * - call setChangeAddress
     * - call setCreationHeight
     * - call setBoxIterator with an iterator that generates a box with an extra
     * token
     * - call build
     * - check createPermitBox to have been called
     * - check createCommitmentBox to have been called
     * - check getOutputWidBox to have been called
     * - check getExtraTokensBox to have been called
     * - check getChangeBox to have been called
     * - check transaction output boxes to include the commitment box
     * - check transaction output boxes to include the permit box with right
     * amount of rwt
     * - check transaction output boxes to include the wid box
     * - check transaction output boxes to include the extra tokens box with the
     * right token id and amount
     * @expected
     * - createPermitBox should have been called
     * - createCommitmentBox should have been called
     * - getOutputWidBox should have been called
     * - getExtraTokensBox should have been called
     * - getChangeBox should have been called
     * - transaction output boxes should include the commitment box
     * - transaction output boxes should include the permit box with right
     * amount of rwt
     * - transaction output boxes should include the wid box
     * - transaction output boxes should include the extra tokens box with the
     * right token id and amount
     */
    it(`should build an unsigned transaction which spends wid and permit boxes
    to generate a commitment, wid and residual permit boxes`, async () => {
      const wid = widBox.assets[0].tokenId;
      commitmentTxBuilder.setWid(wid);

      commitmentTxBuilder.setWidBox(
        ergoLib.ErgoBox.from_json(JsonBigInt.stringify(widBox))
      );

      const permitBoxes = samplePermitBoxes
        .slice(0, 2)
        .map((boxJson) =>
          ergoLib.ErgoBox.from_json(JsonBigInt.stringify(boxJson))
        );
      commitmentTxBuilder.addPermits(permitBoxes);

      commitmentTxBuilder.setChangeAddress(changeAddress);

      const height = 100;
      commitmentTxBuilder.setCreationHeight(height);

      const extraTokenId =
        'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';
      const extraTokenAmount = 3000n;
      const boxIterator = {
        next: async (): Promise<ergoLib.ErgoBox | undefined> => {
          const boxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            ergoLib.BoxValue.from_i64(ergoLib.I64.from_str('20000000000')),
            ergoLib.Contract.pay_to_address(
              ergoLib.Address.from_base58(changeAddress)
            ),
            height - 10
          );
          boxBuilder.add_token(
            ergoLib.TokenId.from_str(extraTokenId),
            ergoLib.TokenAmount.from_i64(
              ergoLib.I64.from_str(extraTokenAmount.toString())
            )
          );

          const fakeTxId = ergoLib.TxId.from_str(
            '8c494da0242fd04ecb4efd3d9de11813848c79b38592f29d579836dfbc459f96'
          );
          const fakeBoxIndex = 0;

          return ergoLib.ErgoBox.from_box_candidate(
            boxBuilder.build(),
            fakeTxId,
            fakeBoxIndex
          );
        },
      };
      commitmentTxBuilder.setBoxIterator(boxIterator);

      const createPermitBoxSpy = vi.spyOn(
        commitmentTxBuilder as any,
        'createPermitBox'
      );
      const createCommitmentBoxSpy = vi.spyOn(
        commitmentTxBuilder as any,
        'createCommitmentBox'
      );
      const getOutputWidBoxSpy = vi.spyOn(
        commitmentTxBuilder as any,
        'getOutputWidBox'
      );
      const getExtraTokensBoxSpy = vi.spyOn(
        commitmentTxBuilder as any,
        'getExtraTokensBox'
      );
      const getChangeBoxSpy = vi.spyOn(
        commitmentTxBuilder as any,
        'getChangeBox'
      );

      const { unsignedTx } = await commitmentTxBuilder.build(height);

      const residualRwtCount =
        permitBoxes
          .map((permit) =>
            BigInt(permit.tokens().get(0).amount().as_i64().to_str())
          )
          .reduce((sum, val) => sum + val, 0n) -
        commitmentTxBuilder['rwtRepo'].getCommitmentRwtCount();

      const fakeTxId = ergoLib.TxId.from_str(
        '8c494da0242fd04ecb4efd3d9de11813848c79b38592f29d579836dfbc459f96'
      );
      const fakeBoxIndex = 0;
      const toFakeErgoBox = (box: ergoLib.ErgoBoxCandidate) =>
        ergoLib.ErgoBox.from_box_candidate(box, fakeTxId, fakeBoxIndex);
      const outputBoxes: ergoLib.ErgoBoxCandidate[] = [];
      for (let i = 0; i < unsignedTx.output_candidates().len(); i++) {
        outputBoxes.push(unsignedTx.output_candidates().get(i));
      }
      const outputBoxIds = outputBoxes.map((box) =>
        toFakeErgoBox(box).box_id().to_str()
      );
      const widOutputBox = outputBoxes.filter(
        (box) => box.tokens().len() && box.tokens().get(0).id().to_str() === wid
      )[0];
      const extraTokenBox = outputBoxes.filter((box) => {
        for (let i = 0; i < box.tokens().len(); i++) {
          if (box.tokens().get(i).id().to_str() === extraTokenId) {
            return true;
          }
        }
        return false;
      })[0];

      expect(createPermitBoxSpy).toHaveBeenCalled();
      expect(createCommitmentBoxSpy).toHaveBeenCalled();
      expect(getOutputWidBoxSpy).toHaveBeenCalled();
      expect(getExtraTokensBoxSpy).toHaveBeenCalled();
      expect(getChangeBoxSpy).toHaveBeenCalled();

      expect(outputBoxIds).toContainEqual(
        toFakeErgoBox(commitmentTxBuilder['createCommitmentBox']())
          .box_id()
          .to_str()
      );

      expect(outputBoxIds).toContainEqual(
        toFakeErgoBox(commitmentTxBuilder['createPermitBox'](residualRwtCount))
          .box_id()
          .to_str()
      );

      expect(widOutputBox.tokens().get(0).id().to_str()).toEqual(wid);
      expect(widOutputBox.tokens().get(0).amount().as_i64().to_str()).toEqual(
        '1'
      );

      expect(extraTokenBox.tokens().len()).toEqual(1);
      expect(extraTokenBox.tokens().get(0).id().to_str()).toEqual(extraTokenId);
      expect(extraTokenBox.tokens().get(0).amount().as_i64().to_str()).toEqual(
        extraTokenAmount.toString()
      );
    });
  });
});
