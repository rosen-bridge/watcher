import JsonBigInt from '@rosen-bridge/json-bigint';
import * as ergoLib from 'ergo-lib-wasm-nodejs';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPermitBuilder } from '../lib';
import * as testData from './getPermitBuilderTestData';
import { getPermitTxBuilderParams } from './getPermitBuilderTestData';

describe('GetPermitBuilder', () => {
  let getPermitTxBuilder: GetPermitBuilder;

  beforeEach(() => {
    getPermitTxBuilder = new GetPermitBuilder(
      getPermitTxBuilderParams.permitAddress,
      getPermitTxBuilderParams.collateralAddress,
      getPermitTxBuilderParams.changeAddress,
      getPermitTxBuilderParams.rsn,
      getPermitTxBuilderParams.rwt,
      getPermitTxBuilderParams.txFee,
      getPermitTxBuilderParams.rwtRepo
    );
  });

  describe('setWid', () => {
    /**
     * @target setWid should set wid for the current instance
     * @dependencies
     * @scenario
     * - call setWid
     * - check GetPermitBuilder to have the right wid set
     * @expected
     * - GetPermitBuilder should have the right wid set
     */
    it(`should set wid for the current instance`, async () => {
      getPermitTxBuilder.setWid(testData.wid);
      expect(getPermitTxBuilder['wid']).toEqual(testData.wid);
    });
  });

  describe('setBoxIterator', () => {
    /**
     * @target setBoxIterator should set boxIterator for the current instance
     * @dependencies
     * @scenario
     * - call setBoxIterator
     * - check GetPermitBuilder to have the right boxIterator set
     * @expected
     * - GetPermitBuilder should have the right boxIterator set
     */
    it(`should set boxIterator for the current instance`, async () => {
      const boxIterator = {
        next: (): IteratorResult<ergoLib.ErgoBox, undefined> => {
          return {
            value: ergoLib.ErgoBox.from_json(
              JsonBigInt.stringify(testData.sampleRwtRepoboxInfo)
            ),
            done: false,
          };
        },
      };

      getPermitTxBuilder.setBoxIterator(boxIterator);

      expect(getPermitTxBuilder['boxIterator']).toBe(boxIterator);
    });
  });

  describe('setCreationHeight', () => {
    /**
     * @target setCreationHeight should set creation height for the current
     * instance
     * @dependencies
     * @scenario
     * - call setCreationHeight
     * - check GetPermitBuilder to have the right creation height set
     * @expected
     * - GetPermitBuilder should have the right creation height set
     */
    it(`should set creation height for the current instance`, async () => {
      const height = 5555;
      getPermitTxBuilder.setCreationHeight(height);
      expect(getPermitTxBuilder['height']).toEqual(height);
    });
  });

  describe('setWidBox', () => {
    /**
     * @target setWidBox should throw exception when wid is not set
     * @dependencies
     * @scenario
     * - call setWidBox
     * - check GetPermitBuilder to throw exception
     * @expected
     * - GetPermitBuilder should throw exception
     */
    it(`should throw exception when wid is not set`, async () => {
      const widBox = ergoLib.ErgoBox.from_json(
        JsonBigInt.stringify(testData.widBox)
      );
      expect(() => getPermitTxBuilder.setWidBox(widBox)).toThrow(
        'wid must best on the instance before calling setWidBox'
      );
    });

    /**
     * @target setWidBox should throw exception when wid is not the first token
     * of widBox
     * @dependencies
     * @scenario
     * - call setWidBox
     * - check GetPermitBuilder to throw exception
     * @expected
     * - GetPermitBuilder should throw exception
     */
    it(`should throw exception when wid is not the first token of widBox`, async () => {
      const widBox = ergoLib.ErgoBox.from_json(
        JsonBigInt.stringify(testData.widBox)
      );
      const wid = 'abcd';
      getPermitTxBuilder.setWid(wid);
      expect(() => getPermitTxBuilder.setWidBox(widBox)).toThrow(
        `the first token of widBox should have id=${wid}`
      );
    });

    /**
     * @target setWidBox should set widBox when widBox matches the instance's
     * wid
     * @dependencies
     * @scenario
     * - call setWidBox
     * - check GetPermitBuilder to have the correct widBox set
     * @expected
     * - GetPermitBuilder should have the correct widBox set
     */
    it(`should set widBox when widBox matches the instance's wid`, async () => {
      const widBox = ergoLib.ErgoBox.from_json(
        JsonBigInt.stringify(testData.widBox)
      );
      getPermitTxBuilder.setWid(testData.wid);
      getPermitTxBuilder.setWidBox(widBox);
      expect(getPermitTxBuilder['widBox'].box_id().to_str()).toEqual(
        widBox.box_id().to_str()
      );
    });
  });

  describe('setRWTCount', () => {
    /**
     * @target setRWTCount should set rwtCount for the current instance
     * @dependencies
     * @scenario
     * - call setRWTCount
     * - check GetPermitBuilder to have the right rwtCount set
     * @expected
     * - GetPermitBuilder should have the right rwtCount set
     */
    it(`setRWTCount should set rwtCount for the current instance`, async () => {
      const rwtCount = 7n;
      getPermitTxBuilder.setRWTCount(rwtCount);
      expect(getPermitTxBuilder['rwtCount']).toEqual(rwtCount);
    });
  });
});
