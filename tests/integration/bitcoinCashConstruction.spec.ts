import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('CreateScanner', () => {
  describe('init', () => {
    /**
     * @target CreateScanner.init - constructs the real lazy BCH scanner and awaited connector
     * @dependencies Actual BCH packages, in-memory SQLite, public contracts and loopback RPC fixture
     * @scenario Initialize the BCH branch then request height through its configured scanner manager
     * @expected Register the BCH extractor and return the fixture height through the real connector
     */
    it('constructs the real lazy BCH scanner and awaited connector', () => {
      const result = spawnSync(
        process.execPath,
        [
          '--import',
          'tsx',
          fileURLToPath(
            new URL(
              '../mocked/bitcoinCashConstruction.mock.mjs',
              import.meta.url
            )
          ),
        ],
        {
          cwd: fileURLToPath(new URL('../../', import.meta.url)),
          encoding: 'utf8',
          timeout: 30_000,
          maxBuffer: 4 * 1024 * 1024,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            NODE_CONFIG_ENV: 'test',
            NODE_CONFIG_DIR: fileURLToPath(
              new URL('../../config', import.meta.url)
            ),
            NODE_CONFIG_PARSER: '',
            NODE_APP_INSTANCE: '',
            NODE_OPTIONS: '',
            NODE_BACKEND: 'js',
          },
        }
      );
      expect(result.error, result.stderr).toBeUndefined();
      expect(result.status, result.stdout + result.stderr).toEqual(0);
      expect(result.stdout).toContain('BCH_CONSTRUCTION_PASS');
    }, 35_000);
  });
});
