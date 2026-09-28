import { expect } from 'chai';
import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Snapshot = {
  readiness: string;
  saved?: number;
  blocks: Array<{ height: number; hash: string; status: string }>;
  observations: Array<{ height: number; requestId: string; block: string }>;
};
type Result = {
  checkpoint?: Snapshot;
  before: Snapshot;
  after: Snapshot;
  rolledBack?: Snapshot;
};

describe('Zcash process and file database recovery', () => {
  it('replays a brutally interrupted block without skipping or duplicating observations, then rolls back two blocks', async function () {
    this.timeout(60000);
    const database = join(
      tmpdir(),
      `zcash-scanner-recovery-${randomUUID()}.sqlite`,
    );
    const run = (mode: string) =>
      new Promise<Result>((resolve, reject) => {
        const child = fork(
          fileURLToPath(
            new URL('./fixtures/zcashScannerProcessChild.mts', import.meta.url),
          ),
          [database, mode],
          {
            execArgv: ['--import', 'tsx'],
            silent: true,
          },
        );
        let result: Result | undefined;
        let diagnostic = '';
        let killedAtCheckpoint = false;
        let failure: Error | undefined;
        const timeout = setTimeout(() => {
          failure = new Error(`Child timed out: ${mode}`);
          child.kill('SIGKILL');
        }, 15000);
        child.stderr?.on('data', (data: Buffer) => {
          diagnostic = (diagnostic + data.toString()).slice(-4096);
        });
        child.on('error', (error) => {
          failure = error;
        });
        child.on('message', (message: Result) => {
          result = message;
          if (mode === 'crash' && message.checkpoint) {
            killedAtCheckpoint = child.kill('SIGKILL');
          }
        });
        child.on('close', (code) => {
          clearTimeout(timeout);
          if (failure) reject(failure);
          else if (
            !result ||
            (mode === 'crash' ? !killedAtCheckpoint : code !== 0)
          ) {
            reject(
              new Error(`Child failed: ${mode}, exit=${code}, ${diagnostic}`),
            );
          } else resolve(result);
        });
      });
    try {
      const interrupted = (await run('crash')).checkpoint!;
      expect(interrupted.readiness).to.equal('catching-up');
      expect(interrupted.saved).to.equal(1);
      expect(interrupted.blocks.map(({ status }) => status)).to.deep.equal([
        'PROCEED',
        'PROCESSING',
      ]);
      expect(
        interrupted.observations.map(({ height }) => height),
      ).to.deep.equal([1, 2]);

      const refused = await run('fault');
      expect(refused.before.readiness).to.equal('starting');
      expect(refused.before.saved).to.equal(1);
      expect(refused.after.readiness).to.equal('halted');
      expect(refused.after.saved).to.equal(1);
      expect(refused.after.blocks.map(({ status }) => status)).to.deep.equal([
        'PROCEED',
        'PROCESSING',
      ]);
      expect(refused.after.observations).to.deep.equal(
        interrupted.observations,
      );

      const recovered = await run('recover');
      expect(recovered.before.readiness).to.equal('starting');
      expect(recovered.before.saved).to.equal(1);
      expect(recovered.after.readiness).to.equal('ready');
      expect(recovered.after.saved).to.equal(3);
      expect(recovered.after.blocks.map(({ status }) => status)).to.deep.equal([
        'PROCEED',
        'PROCEED',
        'PROCEED',
      ]);
      expect(
        recovered.after.observations.map(({ height }) => height),
      ).to.deep.equal([1, 2, 3]);
      expect(
        new Set(recovered.after.observations.map(({ requestId }) => requestId))
          .size,
      ).to.equal(3);

      const reorg = await run('reorg');
      expect(reorg.rolledBack!.readiness).to.equal('catching-up');
      expect(reorg.rolledBack!.saved).to.equal(1);
      expect(
        reorg.rolledBack!.observations.map(({ height }) => height),
      ).to.deep.equal([1]);
      expect(reorg.after.readiness).to.equal('ready');
      expect(reorg.after.observations.map(({ block }) => block)).to.deep.equal([
        'original-1',
        'replacement-2',
        'replacement-3',
      ]);
    } finally {
      for (const suffix of ['', '-journal', '-wal', '-shm'])
        await rm(database + suffix, { force: true });
    }
  });
});
