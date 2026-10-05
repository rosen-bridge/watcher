import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Executes the actual startup consumer with isolated synthetic ports. */
export const start = (failure = '', chain = 'bitcoin-cash', hold = false) => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL('./mocked/startupProcess.mock.mjs', import.meta.url)
      ),
    ],
    {
      encoding: 'utf8',
      timeout: 5000,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        STARTUP_FAILURE: failure,
        STARTUP_CHAIN: chain,
        STARTUP_HOLD: hold ? '1' : '0',
      },
    }
  );
  return { ...result, events: result.stdout.trim().split(/\r?\n/) };
};
