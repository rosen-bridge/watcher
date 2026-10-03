import config from 'config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BITCOIN_CASH_RPC_LIMITS,
  BITCOIN_CASH_RPC_HARD_LIMITS,
} from '@rosen-bridge/bitcoin-cash-scanner';

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
              finalityRpc: {
                url: bitcoinCashDefaults['bitcoinCash.finalityRpc.url'],
                timeout: bitcoinCashDefaults['bitcoinCash.finalityRpc.timeout'],
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
          'BITCOIN_CASH_FINALITY_RPC_USERNAME',
          'BITCOIN_CASH_FINALITY_RPC_PASSWORD',
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

      /**
       * @target BitcoinCashConfig.constructor - resolves witness credentials
       * @dependencies Real node-config loader and production Docker environment mapping
       * @scenario Set both, one or neither of the dedicated witness credential fields
       * @expected Preserve a complete pair, reject an incomplete pair and never borrow scanner credentials
       */
      it.each(['both', 'username', 'password', 'neither'] as const)(
        'resolves %s witness credentials through the environment mapping',
        (mode) => {
          const credentials = JSON.parse(
            readFileSync(
              new URL('./bitcoinCashCredentials.example', import.meta.url),
              'utf8'
            )
          ) as Record<string, string>;
          if (mode !== 'both' && mode !== 'username')
            delete credentials.BITCOIN_CASH_FINALITY_RPC_USERNAME;
          if (mode !== 'both' && mode !== 'password')
            delete credentials.BITCOIN_CASH_FINALITY_RPC_PASSWORD;
          const readers = resolveEnvironment(credentials);
          const get = vi.spyOn(config, 'get').mockImplementation(readers.get);
          const has = vi.spyOn(config, 'has').mockImplementation(readers.has);
          try {
            if (mode === 'username' || mode === 'password') {
              expect(
                () => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)
              ).toThrow('paired');
            } else {
              expect(
                new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME).finalityRpc
              ).toMatchObject({
                username: mode === 'both' ? 'example-witness-user' : undefined,
                password:
                  mode === 'both' ? 'example-witness-password' : undefined,
              });
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
            url: new URL(bitcoinCashDefaults['bitcoinCash.rpc.url'] as string)
              .href,
            timeout: 10,
            expectedChain: chain,
            limits: BITCOIN_CASH_RPC_LIMITS,
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
       * @target BitcoinCashConfig.constructor - resolves a bounded operator budget
       * @dependencies Real scanner policy and isolated configuration readers
       * @scenario Override one resource while leaving every other field valid
       * @expected Preserve the selected override and all other scanner defaults
       */
      it.each(Object.keys(BITCOIN_CASH_RPC_LIMITS))(
        'passes a bounded %s override to the scanner configuration',
        (resource) => {
          const key = resource as keyof typeof BITCOIN_CASH_RPC_LIMITS;
          values['bitcoinCash.rpc.limits'] = {
            [key]: BITCOIN_CASH_RPC_HARD_LIMITS[key],
          };
          expect(
            new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME).rpc?.limits
          ).toEqual({
            ...BITCOIN_CASH_RPC_LIMITS,
            [key]: BITCOIN_CASH_RPC_HARD_LIMITS[key],
          });
        }
      );

      /**
       * @target BitcoinCashConfig.constructor - rejects an invalid budget object
       * @dependencies Real scanner policy and isolated configuration readers
       * @scenario Supply one malformed, unknown or out-of-range budget override
       * @expected Reject configuration before a scanner can be constructed
       */
      it.each([
        null,
        [],
        '10000',
        { unknown: 1 },
        { blockTransactions: 0 },
        { blockTransactions: 1.5 },
        { responseBytes: 256000001 },
        { transactionIO: '10000' },
      ])('rejects invalid scanner resource budgets %j', (limits) => {
        values['bitcoinCash.rpc.limits'] = limits;
        expect(() => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)).toThrow();
      });

      /**
       * @target BitcoinCashConfig.constructor - enforces transport before startup
       * @dependencies Real scanner endpoint policy and configuration-reader spies
       * @scenario Select a valid HTTPS or canonical literal loopback HTTP endpoint
       * @expected Retain the normalized endpoint for the connector
       */
      it.each([
        'https://bchn.example/rpc',
        'http://127.1.2.3:18443',
        'http://[::1]:18443',
      ])('accepts the protected endpoint %s', (url) => {
        values['bitcoinCash.rpc.url'] = url;
        expect(new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME).rpc?.url).toEqual(
          new URL(url).href
        );
      });

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
