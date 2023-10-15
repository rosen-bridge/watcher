import { describe, expect, it, beforeEach } from 'vitest';
import { CommitmentTx } from '../lib';
import { commitmentTxParams, observationEntity1 } from './commitmentTx.mock';

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
     * @target should create a new instance of CommitmentTxBuilder with the set
     * properties and passed arguments
     * @dependencies
     * - None
     * @scenario
     * - call CommitmentTx.getInstance after calling CommitmentTx.init
     * - call CommitmentTx.newBuilder on returned CommitmentTx instance to get a
     * new instance of CommitmentTxBuilder
     * - check returned CommitmentTxBuilder instance to have correct properties
     * set
     * @expected
     * - returned CommitmentTxBuilder should have correct properties set
     */
    it(`should create a new instance of CommitmentTxBuilder with the set
    properties and passed arguments`, async () => {
      CommitmentTx.init(
        commitmentTxParams.permitAddress,
        commitmentTxParams.commitmentAddress,
        commitmentTxParams.rwt,
        commitmentTxParams.txFee,
        commitmentTxParams.rwtRepo
      );

      const commitmentTxBuilder =
        CommitmentTx.getInstance().newBuilder(observationEntity1);

      expect(commitmentTxBuilder['permitAddress']).toEqual(
        commitmentTxParams.permitAddress
      );
      expect(commitmentTxBuilder['permitScriptHash']).toEqual(
        commitmentTxParams.permitScriptHash
      );
      expect(commitmentTxBuilder['commitmentAddress']).toEqual(
        commitmentTxParams.commitmentAddress
      );
      expect(commitmentTxBuilder['rwt']).toEqual(commitmentTxParams.rwt);
      expect(commitmentTxBuilder['txFee']).toEqual(commitmentTxParams.txFee);
      expect(commitmentTxBuilder['rwtRepo']).toEqual(
        commitmentTxParams.rwtRepo
      );
      expect(commitmentTxBuilder['observation']).toEqual(observationEntity1);
      expect(commitmentTxBuilder['eventId']).toEqual(
        observationEntity1.requestId
      );
    });
  });
});
