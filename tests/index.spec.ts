import { describe, expect, it } from 'vitest';
import { execFile, ExecFileException } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../', import.meta.url));

describe('index', () => {
  /**
   * @target index - initializes logging before importing source entry
   * consumers
   * @dependencies Actual source entry, declared tsx loader and public
   * synthetic test configuration
   * @scenario Start one fresh child in test mode with loopback-only configured
   * providers
   * @expected Exit successfully after logger bootstrap without invoking
   * application init
   */
  it('initializes logging before importing source entry consumers', async () => {
    /** Public synthetic configuration keeps all providers on loopback. */
    const fixtureConfig = {
      network: 'ergo',
      ergo: {
        mnemonic: [...Array(11).fill('abandon'), 'about'].join(' '),
        secret: '',
        node: { url: 'http://127.0.0.1:1' },
        explorer: { url: 'http://127.0.0.1:1' },
      },
      path: {
        addresses: resolve(directory, 'tests/config/contracts.test.json'),
        tokens: resolve(directory, 'tests/config/tokens.test.json'),
      },
      database: { type: 'sqlite', path: ':memory:' },
      logs: [],
      blockCleanup: {
        isActiveForErgoChain: false,
        isActiveForNonErgoChains: false,
      },
    };
    const child = await new Promise<{
      error: ExecFileException | null;
      stdout: string;
      stderr: string;
    }>((done) =>
      execFile(
        process.execPath,
        ['--import', 'tsx', resolve(directory, 'src/index.ts')],
        {
          cwd: directory,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            NODE_CONFIG_ENV: 'test',
            NODE_CONFIG_DIR: resolve(directory, 'config'),
            NODE_CONFIG_PARSER: '',
            NODE_APP_INSTANCE: '',
            NODE_OPTIONS: '',
            NODE_BACKEND: 'js',
            NODE_CONFIG: JSON.stringify(fixtureConfig),
          },
          encoding: 'utf8',
          // The actual entry imports the full watcher graph on a cold loader.
          timeout: 30000,
          maxBuffer: 4 * 1024 * 1024,
        },
        (error, stdout, stderr) => done({ error, stdout, stderr })
      )
    );
    const log = (child.stdout ?? '') + (child.stderr ?? '');
    expect(child.error, log).toEqual(null);
    expect(log).not.toMatch(
      /DefaultLogger\.init|Failed to initialize|Unhandled Rejection/
    );
  }, 45000);
});
