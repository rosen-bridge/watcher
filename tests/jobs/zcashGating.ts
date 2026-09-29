import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { HealthStatusLevel } from '@rosen-bridge/health-check';
import { ZcashScannerNotReady } from '../../src/utils/zcashReadiness';

/** Execute the real job module with controlled scheduling and transaction jobs. */
const runJob = async (
  job: 'commitmentCreation' | 'commitmentReveal',
  network: string,
  state: 'ready' | 'starting' | 'catching-up' | 'halted',
  jobFails = false
) => {
  const calls: string[] = [];
  const messages: string[] = [];
  const logger = {
    info: (message: string) => messages.push(`info:${message}`),
    warn: (message: string) => messages.push(`warn:${message}`),
  };
  const transaction = class {
    job = async () => {
      calls.push('transaction');
      if (jobFails) throw new Error('transaction failed');
    };
  };
  const modules: Record<string, unknown> = {
    '@rosen-bridge/health-check': { HealthStatusLevel },
    '@rosen-bridge/abstract-logger': {
      DefaultLogger: { getInstance: () => ({ child: () => logger }) },
    },
    '../config/config': {
      getConfig: () => ({
        general: {
          networkWatcher: network,
          commitmentCreationInterval: 1,
          commitmentRevealInterval: 1,
        },
      }),
    },
    '../config/constants': { ZCASH_CHAIN_NAME: 'zcash' },
    '../transactions/commitmentCreation': { CommitmentCreation: transaction },
    '../transactions/commitmentReveal': { CommitmentReveal: transaction },
    '../utils/healthCheck': {
      HealthCheckSingleton: {
        getInstance: () => ({
          getErgoScannerSyncHealth: () => HealthStatusLevel.HEALTHY,
        }),
      },
    },
    '../utils/scanner': {
      CreateScanner: {
        getInstance: () => ({
          assertZcashScannerHealthy: async () => {
            calls.push('gate');
            if (state !== 'ready')
              throw new ZcashScannerNotReady({
                state,
                cause: state === 'halted' ? 'extraction failed' : undefined,
              });
          },
        }),
      },
    },
    '../utils/zcashReadiness': { ZcashScannerNotReady },
    './commitmentRedeem': { redeemJob: () => calls.push('redeem') },
  };
  const source = readFileSync(
    new URL(`../../src/jobs/${job}.ts`, import.meta.url),
    'utf8'
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exported: Record<string, (...args: unknown[]) => unknown> = {};
  // import.meta supplies only the logging label; CommonJS unit execution needs a literal.
  new Function(
    'require',
    'exports',
    'setTimeout',
    compiled.replaceAll('import.meta.url', "'job-unit-test'")
  )(
    (name: string) => {
      if (!(name in modules))
        throw new Error(`Uncontrolled dependency: ${name}`);
      return modules[name];
    },
    exported,
    () => calls.push('scheduled')
  );
  exported[job === 'commitmentCreation' ? 'creation' : 'reveal']({}, {}, {});
  await new Promise<void>((resolve) => setImmediate(resolve));
  return { calls, messages };
};

describe('Zcash scheduled commitment gates', () => {
  for (const job of ['commitmentCreation', 'commitmentReveal'] as const) {
    for (const state of ['starting', 'catching-up', 'halted'] as const) {
      it(`${job} skips transactions while ${state} and preserves scheduling`, async () => {
        const { calls, messages } = await runJob(job, 'zcash', state);
        expect(calls).to.deep.equal(['gate', 'scheduled']);
        expect(messages[0]).to.match(state === 'halted' ? /^warn:/ : /^info:/);
        expect(messages[0]).to.include(state);
      });
    }
    it(`${job} executes after the Zcash gate opens`, async () => {
      const { calls } = await runJob(job, 'zcash', 'ready');
      expect(calls).to.deep.equal(
        job === 'commitmentCreation'
          ? ['gate', 'transaction', 'redeem', 'scheduled']
          : ['gate', 'transaction', 'scheduled']
      );
    });
  }
  it('preserves commitment-before-redeem ordering for other chains', async () => {
    expect(
      (await runJob('commitmentCreation', 'ergo', 'halted')).calls
    ).to.deep.equal(['transaction', 'redeem', 'scheduled']);
    expect(
      (await runJob('commitmentCreation', 'ergo', 'halted', true)).calls
    ).to.deep.equal(['transaction', 'scheduled']);
  });
});
