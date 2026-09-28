import { expect } from 'chai';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { HealthStatusLevel } from '@rosen-bridge/health-check';
import {
  getZcashReadiness,
  guardZcashUpdate,
  ZcashScannerLogger,
  ZcashReadinessHealthCheck,
} from '../../src/utils/zcashReadiness';

describe('Zcash scanner failure diagnostics', () => {
  it('retains the first cause for operator recovery', () => {
    const logger = new ZcashScannerLogger(new DummyLogger());
    logger.error('inspector branch mismatch');
    expect(() => logger.assertNoErrors()).to.throw('inspector branch mismatch');
  });

  it('shares the first failure across child loggers and forwards safe diagnostics', () => {
    const sink: AbstractLogger = new DummyLogger();
    const messages: string[] = [];
    sink.error = (message: string) => {
      messages.push(message);
      return undefined;
    };
    sink.child = () => sink;
    const logger = new ZcashScannerLogger(sink, ['secret-value']);
    logger
      .child('extractor')
      .error('inspector failed secret-value https://user:pass@localhost/a');
    logger.error('later error');
    expect(logger.getCause()).to.equal(
      'inspector failed [redacted] [RPC URL redacted]'
    );
    expect(messages).to.have.length(2);
    expect(messages.join(' ')).not.to.include('secret-value');
    expect(messages.join(' ')).not.to.include('user:pass');
  });

  it('separates normal catch-up from a fault and becomes ready at the persisted tip', async () => {
    const logger = new ZcashScannerLogger(new DummyLogger());
    let height = 8;
    const scanner = {
      getBlockChainLastHeight: () => 10,
      action: { getLastSavedBlock: async () => ({ height }) },
    };
    const health = new ZcashReadinessHealthCheck(() =>
      getZcashReadiness(scanner, logger)
    );
    await health.updateStatus();
    expect(health.getHealthStatus()).to.equal(HealthStatusLevel.UNSTABLE);
    expect(health.getDetails()).to.include('catching-up');
    height = 10;
    await health.updateStatus();
    expect(health.getHealthStatus()).to.equal(HealthStatusLevel.HEALTHY);
    height = 11;
    await health.updateStatus();
    expect(health.getHealthStatus()).to.equal(HealthStatusLevel.UNSTABLE);
    expect(health.getDetails()).to.include('saved=11, tip=10');
    logger.error('extraction incomplete');
    await health.updateStatus();
    expect(health.getHealthStatus()).to.equal(HealthStatusLevel.BROKEN);
    expect(health.getDetails()).to.include('extraction incomplete');
    await health.updateStatus();
    expect(health.getHealthStatus()).to.equal(HealthStatusLevel.BROKEN);
  });

  it('cannot become ready after an error during its database read', async () => {
    const logger = new ZcashScannerLogger(new DummyLogger());
    const scanner = {
      getBlockChainLastHeight: () => 10,
      action: {
        getLastSavedBlock: async () => {
          logger.error('concurrent extraction failure');
          return { height: 10 };
        },
      },
    };
    expect((await getZcashReadiness(scanner, logger)).state).to.equal('halted');
  });

  it('reports starting without a sampled tip and latches database failures', async () => {
    const logger = new ZcashScannerLogger(new DummyLogger());
    expect((await getZcashReadiness(undefined, logger)).state).to.equal(
      'starting'
    );
    const scanner = {
      getBlockChainLastHeight: () => undefined,
      action: {
        getLastSavedBlock: async () => {
          throw new Error('database unavailable');
        },
      },
    };
    expect((await getZcashReadiness(scanner, logger)).cause).to.include(
      'database unavailable'
    );
    expect(logger.hasErrors()).to.equal(true);
  });

  it('blocks while an update fetches the tip or rolls back, even when saved equals the old tip', async () => {
    const logger = new ZcashScannerLogger(new DummyLogger());
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const scanner = {
      getBlockChainLastHeight: () => 10,
      action: { getLastSavedBlock: async () => ({ height: 10 }) },
    };
    const update = guardZcashUpdate(logger, () => wait)();
    expect((await getZcashReadiness(scanner, logger)).state).to.equal(
      'catching-up'
    );
    release();
    await update;
    expect((await getZcashReadiness(scanner, logger)).state).to.equal('ready');
  });

  it('reads the current tip after its awaited database read', async () => {
    const logger = new ZcashScannerLogger(new DummyLogger());
    let tip = 10;
    const scanner = {
      getBlockChainLastHeight: () => tip,
      action: {
        getLastSavedBlock: async () => {
          tip = 11;
          return { height: 10 };
        },
      },
    };
    expect((await getZcashReadiness(scanner, logger)).state).to.equal(
      'catching-up'
    );
  });

  it('rejects a stale database read across a complete same-height update', async () => {
    const logger = new ZcashScannerLogger(new DummyLogger());
    const scanner = {
      getBlockChainLastHeight: () => 10,
      action: {
        getLastSavedBlock: async () => {
          await guardZcashUpdate(logger, async () => undefined)();
          return { height: 10 };
        },
      },
    };
    expect((await getZcashReadiness(scanner, logger)).state).to.equal(
      'catching-up'
    );
  });
});
