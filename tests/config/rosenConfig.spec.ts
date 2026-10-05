import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { decodeAddress } from '@rosen-bridge/address-codec';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RosenConfig } from '../../src/config/rosenConfig';
import { BITCOIN_CASH_CHAIN_NAME } from '../../src/config/constants';
import {
  bitcoinCashNativeScripts,
  invalidBitcoinCashLocks,
} from './bitcoinCashTestData';

/** Upstream synthetic contracts provide unchanged non-BCH fields for the join. */
const fixture = JSON.parse(
  fs.readFileSync(new URL('./contracts.test.json', import.meta.url), 'utf8')
);

describe('RosenConfig', () => {
  describe('constructor', () => {
    let filename: string;
    beforeEach(() => {
      filename = path.join(
        os.tmpdir(),
        `watcher-bch-contracts-${randomUUID()}.json`
      );
    });
    afterEach(() => {
      if (fs.existsSync(filename)) fs.unlinkSync(filename);
    });

    /**
     * Write only the selected BCH treasury input with upstream fixture fields.
     * @param lock - Treasury input for the current scenario
     */
    const writeContracts = (lock: unknown) => {
      fs.writeFileSync(
        filename,
        JSON.stringify({
          ...fixture,
          [BITCOIN_CASH_CHAIN_NAME]: {
            ...fixture.ergo,
            addresses: { ...fixture.ergo.addresses, lock },
          },
        })
      );
    };

    /**
     * @target RosenConfig.constructor - accepts canonical native script %s
     * @dependencies Real CashAddr codec and upstream contract fixture
     * @scenario Decode one ordinary locking script and load its contract entry
     * @expected Preserve the lock address and upstream synthetic RWT identity
     */
    it.each(bitcoinCashNativeScripts)(
      'accepts canonical native script %s',
      (script) => {
        const lock = decodeAddress(BITCOIN_CASH_CHAIN_NAME, script);
        writeContracts(lock);
        const result = new RosenConfig(BITCOIN_CASH_CHAIN_NAME, filename);
        expect(result.lockAddress).toEqual(lock);
        expect(result.RWTId).toEqual(fixture.ergo.tokens.RWTId);
      }
    );

    /**
     * @target RosenConfig.constructor - requires an operator-provided BCH
     * network contract entry
     * @dependencies Upstream fixture with no BCH entry
     * @scenario Load that fixture while selecting BCH
     * @expected Reject with the missing network-entry error
     */
    it('requires an operator-provided BCH network contract entry', () => {
      fs.writeFileSync(filename, JSON.stringify(fixture));
      expect(() => new RosenConfig(BITCOIN_CASH_CHAIN_NAME, filename)).toThrow(
        "Network 'bitcoin-cash' not found"
      );
    });

    /**
     * @target RosenConfig.constructor - rejects noncanonical operator lock %s
     * @dependencies One isolated invalid lock and otherwise valid contracts
     * @scenario Replace only the lock input before loading BCH configuration
     * @expected Reject noncanonical, token-aware, foreign and malformed inputs
     */
    it.each(invalidBitcoinCashLocks)(
      'rejects noncanonical operator lock %s',
      (lock) => {
        writeContracts(lock);
        expect(
          () => new RosenConfig(BITCOIN_CASH_CHAIN_NAME, filename)
        ).toThrow();
      }
    );
  });
});
