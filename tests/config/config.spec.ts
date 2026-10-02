import config from 'config';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BitcoinCashConfig } from '../../src/config/config';
import { BITCOIN_CASH_CHAIN_NAME } from '../../src/config/constants';
import {
  bitcoinCashDefaults,
  invalidBitcoinCashValues,
  malformedBitcoinCashCredentials,
} from './bitcoinCashTestData';
import { mockBitcoinCashConfig } from './mocked/config.mock';

describe('BitcoinCashConfig', () => {
  describe('constructor', () => {
    describe('RPC environment mapping', () => {
      /**
       * Resolve the production environment map using isolated synthetic inputs.
       * @param credentials - Only the BCH credential variables for this case
       * @returns Real node-config readers bound to the resolved snapshot
       */
      const resolveEnvironment = (credentials: Record<string, string>) => {
        const environment = {
          NODE_CONFIG_DIR: fileURLToPath(
            new URL('../../docker', import.meta.url)
          ),
          NODE_CONFIG_ENV: 'default',
          NODE_CONFIG: JSON.stringify({
            bitcoinCash: {
              type: bitcoinCashDefaults['bitcoinCash.type'],
              initial: {
                height: bitcoinCashDefaults['bitcoinCash.initial.height'],
              },
              interval: bitcoinCashDefaults['bitcoinCash.interval'],
              rpc: {
                url: bitcoinCashDefaults['bitcoinCash.rpc.url'],
                timeout: bitcoinCashDefaults['bitcoinCash.rpc.timeout'],
                expectedChain:
                  bitcoinCashDefaults['bitcoinCash.rpc.expectedChain'],
              },
            },
          }),
          BITCOIN_RPC_USERNAME: 'synthetic-other-chain-user',
          BITCOIN_RPC_PASSWORD: 'test',
          ...credentials,
        };
        const keys = [
          ...Object.keys(environment),
          'BITCOIN_CASH_RPC_USERNAME',
          'BITCOIN_CASH_RPC_PASSWORD',
        ];
        const previous = new Map(keys.map((key) => [key, process.env[key]]));
        try {
          for (const key of keys) delete process.env[key];
          Object.assign(process.env, environment);
          const loaded = config.util.loadFileConfigs();
          return {
            get: config.get.bind(loaded),
            has: config.has.bind(loaded),
          };
        } finally {
          for (const [key, value] of previous)
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
      };

      /**
       * @target BitcoinCashConfig.constructor - resolves %s credentials through
       * the production custom environment mapping
       * @dependencies Real node-config loader/get/has and docker mapping;
       * isolated synthetic environment and owned configuration-reader spies
       * @scenario Supply the selected credential pair state, resolve the
       * mapping, restore process environment, then construct BCH configuration
       * @expected Preserve the complete BCH pair, reject either unpaired value,
       * and leave absent BCH credentials independent of Bitcoin credentials
       */
      it.each(['both', 'username', 'password', 'neither'] as const)(
        'resolves %s credentials through the production custom environment mapping',
        (mode) => {
          const credentials: Record<string, string> = {};
          if (mode === 'both' || mode === 'username')
            credentials.BITCOIN_CASH_RPC_USERNAME = 'synthetic-bch-user';
          if (mode === 'both' || mode === 'password')
            credentials.BITCOIN_CASH_RPC_PASSWORD = 'synthetic-bch-password';
          const readers = resolveEnvironment(credentials);
          const get = vi.spyOn(config, 'get').mockImplementation(readers.get);
          const has = vi.spyOn(config, 'has').mockImplementation(readers.has);
          try {
            if (mode === 'username' || mode === 'password') {
              expect(
                () => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)
              ).toThrow('paired');
            } else {
              const result = new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME);
              expect(result.rpc?.username).toEqual(
                mode === 'both' ? 'synthetic-bch-user' : undefined
              );
              expect(result.rpc?.password).toEqual(
                mode === 'both' ? 'synthetic-bch-password' : undefined
              );
            }
          } finally {
            has.mockRestore();
            get.mockRestore();
          }
        }
      );
    });
    describe('synthetic operator fields', () => {
      let values: Record<string, unknown>;
      let restore: () => void;

      beforeEach(() => {
        values = { ...bitcoinCashDefaults };
        restore = mockBitcoinCashConfig(() => values);
      });
      afterEach(() => restore());

      /**
       * @target BitcoinCashConfig.constructor - keeps other watcher networks
       * independent of BCH configuration
       * @dependencies Owned configuration-reader spies with no BCH fields
       * @scenario Construct the Bitcoin watcher configuration
       * @expected Leave the optional BCH RPC configuration undefined
       */
      it('keeps other watcher networks independent of BCH configuration', () => {
        values = {};
        expect(new BitcoinCashConfig('bitcoin').rpc).toEqual(undefined);
      });

      /**
       * @target BitcoinCashConfig.constructor - passes explicit %s chain policy
       * and last scanned height
       * @dependencies Valid BCH fixture and owned configuration-reader spies
       * @scenario Set one accepted chain policy and construct BCH configuration
       * @expected Preserve policy, RPC settings, initial height and interval
       */
      it.each(['main', 'test', 'regtest'])(
        'passes explicit %s chain policy and last scanned height',
        (chain) => {
          values['bitcoinCash.rpc.expectedChain'] = chain;
          const result = new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME);
          expect(result.rpc).toEqual({
            url: bitcoinCashDefaults['bitcoinCash.rpc.url'],
            timeout: 10,
            expectedChain: chain,
            username: undefined,
            password: undefined,
          });
          expect(result.initialHeight).toEqual(-1);
          expect(result.interval).toEqual(180);
        }
      );

      /**
       * @target BitcoinCashConfig.constructor - rejects isolated invalid %s
       * @dependencies Valid BCH fixture and one invalid field value
       * @scenario Replace only the selected field, then construct configuration
       * @expected Reject the single-field fault
       */
      it.each(invalidBitcoinCashValues)(
        'rejects isolated invalid %s',
        (key, value) => {
          values[key] = value;
          expect(
            () => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)
          ).toThrow();
        }
      );

      /**
       * @target BitcoinCashConfig.constructor - requires %s when BCH is selected
       * @dependencies Valid BCH fixture and owned configuration-reader spies
       * @scenario Remove only one mandatory field before constructing BCH config
       * @expected Reject the missing field
       */
      it.each(Object.keys(bitcoinCashDefaults))(
        'requires %s when BCH is selected',
        (key) => {
          delete values[key];
          expect(
            () => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)
          ).toThrow();
        }
      );

      /**
       * @target BitcoinCashConfig.constructor - preserves paired basic credentials
       * @dependencies Synthetic paired credentials and configuration-reader spies
       * @scenario Supply both credential fields and construct BCH configuration
       * @expected Preserve both explicit credential values
       */
      it('preserves paired basic credentials', () => {
        values['bitcoinCash.rpc.username'] = 'operator';
        values['bitcoinCash.rpc.password'] = 'rpc-password';
        expect(
          new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME).rpc
        ).toMatchObject({
          username: 'operator',
          password: 'rpc-password',
        });
      });

      /**
       * @target BitcoinCashConfig.constructor - rejects malformed paired %s
       * @dependencies Otherwise valid paired credentials and one invalid value
       * @scenario Corrupt only the selected credential before construction
       * @expected Reject empty, overlong and non-string credential values
       */
      it.each(malformedBitcoinCashCredentials)(
        'rejects malformed paired %s',
        (key, value) => {
          values['bitcoinCash.rpc.username'] = 'operator';
          values['bitcoinCash.rpc.password'] = 'password';
          values[key] = value;
          expect(
            () => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)
          ).toThrow();
        }
      );
    });
  });
});
