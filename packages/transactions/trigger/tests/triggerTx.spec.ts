import { beforeEach, describe, expect, it } from 'vitest';
import { TriggerTx } from '../lib';
import {
  changeAddress,
  observationEntity1,
  triggerTxParams,
} from './triggerTxTestData';

describe('TriggerTx', () => {
  beforeEach(() => {
    TriggerTx['_instance'] = undefined;
  });

  describe('getInstance', () => {
    /**
     * @target should throw exception when TriggerTx._instance is not yet
     * initialized
     * @dependencies
     * @scenario
     * - call getInstance without calling init
     * - check getInstance to throw an exception
     * @expected
     * - getInstance should throw an exception
     */
    it(`should throw exception when TriggerTx._instance is not yet initialized`, async () => {
      expect(() => TriggerTx.getInstance()).toThrowError();
    });
  });

  describe('newBuilder', () => {
    /**
     * @target should create a new instance of TriggerTxBuilder using set
     * properties and passed arguments
     * @dependencies
     * @scenario
     * - call getInstance after calling init
     * - call newBuilder on returned TriggerTx instance to get a new instance of
     *   TriggerTxBuilder
     * - check returned TriggerTxBuilder instance to have correct properties set
     * @expected
     * - returned TriggerTxBuilder should have correct properties set
     */
    it(`should create a new instance of TriggerTxBuilder using set properties
    and passed arguments`, async () => {
      TriggerTx.init(
        triggerTxParams.triggerAddress,
        triggerTxParams.commitmentAddress,
        triggerTxParams.permitAddress,
        changeAddress,
        triggerTxParams.rwt,
        triggerTxParams.txFee,
        triggerTxParams.rwtRepo
      );

      const triggerTxBuilder =
        TriggerTx.getInstance().newBuilder(observationEntity1);

      expect(triggerTxBuilder['triggerAddress']).toEqual(
        triggerTxParams.triggerAddress
      );
      expect(triggerTxBuilder['commitmentAddress']).toEqual(
        triggerTxParams.commitmentAddress
      );
      expect(triggerTxBuilder['permitAddress']).toEqual(
        triggerTxParams.permitAddress
      );
      expect(triggerTxBuilder['changeAddress']).toEqual(changeAddress);
      expect(triggerTxBuilder['permitScriptHash']).toEqual(
        triggerTxParams.permitScriptHash
      );
      expect(triggerTxBuilder['rwt']).toEqual(triggerTxParams.rwt);
      expect(triggerTxBuilder['txFee']).toEqual(triggerTxParams.txFee);
      expect(triggerTxBuilder['rwtRepo']).toEqual(triggerTxParams.rwtRepo);
      expect(triggerTxBuilder['observation']).toEqual(observationEntity1);
    });
  });
});
