import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import {
  AbstractHealthCheckParam,
  HealthStatusLevel,
} from '@rosen-bridge/health-check';

/** A logged extraction error can be swallowed upstream; never reset on update. */
export class ZcashScannerLogger extends AbstractLogger {
  constructor(
    private readonly sink: AbstractLogger,
    private readonly secrets: string[] = [],
    private readonly state: {
      cause?: string;
      updating?: boolean;
      revision?: number;
    } = {}
  ) {
    super();
  }

  private sanitize = (message: string) => {
    let safe = message.replace(/https?:\/\/[^\s]+/gi, '[RPC URL redacted]');
    for (const secret of this.secrets.filter(Boolean)) {
      safe = safe.split(secret).join('[redacted]');
    }
    return safe.slice(0, 2048);
  };

  // Context may contain raw RPC requests and credentials; forward messages only.
  trace = (message: string) => this.sink.trace(this.sanitize(message));
  debug = (message: string) => this.sink.debug(this.sanitize(message));
  info = (message: string) => this.sink.info(this.sanitize(message));
  warn = (message: string) => this.sink.warn(this.sanitize(message));
  error = (message: string) => {
    const safe = this.sanitize(message);
    this.state.cause ??= safe;
    return this.sink.error(safe);
  };
  critical = (message: string) => {
    const safe = this.sanitize(message);
    this.state.cause ??= safe;
    return this.sink.critical(safe);
  };
  child = (path: string) =>
    new ZcashScannerLogger(this.sink.child(path), this.secrets, this.state);
  hasErrors = () => this.state.cause !== undefined;
  getCause = () => this.state.cause;
  isUpdating = () => this.state.updating === true;
  getRevision = () => this.state.revision ?? 0;
  setUpdating = (updating: boolean) => {
    this.state.updating = updating;
    this.state.revision = this.getRevision() + 1;
  };
  assertNoErrors = () => {
    if (this.hasErrors()) {
      throw new Error(`Zcash scanner halted: ${this.state.cause}`);
    }
  };
}

export type ZcashReadiness = {
  state: 'starting' | 'catching-up' | 'ready' | 'halted';
  tip?: number;
  savedHeight?: number;
  cause?: string;
};

/** Prevent a swallowed extraction error from advancing the durable cursor. */
export const guardZcashExtraction =
  <Args extends unknown[], Result>(
    logger: ZcashScannerLogger,
    process: (...args: Args) => Promise<Result>
  ) =>
  async (...args: Args): Promise<Result> => {
    logger.assertNoErrors();
    const result = await process(...args);
    logger.assertNoErrors();
    return result;
  };

/** Close the gate during tip fetches and rollback as well as forward scanning. */
export const guardZcashUpdate =
  (logger: ZcashScannerLogger, update: () => Promise<void>) => async () => {
    logger.assertNoErrors();
    if (logger.isUpdating())
      throw new Error('Zcash update already in progress');
    logger.setUpdating(true);
    try {
      await update();
    } catch (error) {
      logger.error(`Zcash scanner update failed: ${error}`);
      throw error;
    } finally {
      logger.setUpdating(false);
    }
  };

export type ZcashProgress = {
  getBlockChainLastHeight: () => number | undefined;
  action: { getLastSavedBlock: () => Promise<{ height: number } | undefined> };
};

export const getZcashReadiness = async (
  scanner: ZcashProgress | undefined,
  logger: ZcashScannerLogger | undefined
): Promise<ZcashReadiness> => {
  if (logger?.hasErrors()) {
    return { state: 'halted', cause: logger.getCause() };
  }
  if (!scanner || !logger) return { state: 'starting' };
  try {
    const revision = logger.getRevision();
    const saved = await scanner.action.getLastSavedBlock();
    // An error may arrive while the database read is in flight.
    if (logger.hasErrors())
      return { state: 'halted', cause: logger.getCause() };
    const tip = scanner.getBlockChainLastHeight();
    if (logger.isUpdating() || logger.getRevision() !== revision)
      return { state: 'catching-up', tip, savedHeight: saved?.height };
    if (tip === undefined) return { state: 'starting' };
    return {
      state: saved && saved.height === tip ? 'ready' : 'catching-up',
      tip,
      savedHeight: saved?.height,
    };
  } catch (error) {
    logger.error(`Reading Zcash scanner progress failed: ${error}`);
    return { state: 'halted', cause: logger.getCause() };
  }
};

export class ZcashScannerNotReady extends Error {
  constructor(readonly readiness: ZcashReadiness) {
    super(
      readiness.state === 'halted'
        ? `Zcash scanner halted; investigate and rescan before restarting: ${readiness.cause}`
        : `Zcash scanner ${readiness.state}; saved=${
            readiness.savedHeight ?? 'none'
          }, tip=${readiness.tip ?? 'unknown'}`
    );
  }
}

/** Uses the same gate as commitment creation/reveal, exposed by /health/status. */
export class ZcashReadinessHealthCheck extends AbstractHealthCheckParam {
  private readiness: ZcashReadiness = { state: 'starting' };
  constructor(private readonly read: () => Promise<ZcashReadiness>) {
    super();
  }
  getId = () => 'zcash-scanner-readiness';
  getTitle = () => 'Zcash scanner readiness';
  getDescription = () =>
    'Commitments and reveals require a complete source scan without a latched error.';
  updateStatus = async () => {
    this.readiness = await this.read();
  };
  getHealthStatus = () =>
    this.readiness.state === 'ready'
      ? HealthStatusLevel.HEALTHY
      : this.readiness.state === 'halted'
      ? HealthStatusLevel.BROKEN
      : HealthStatusLevel.UNSTABLE;
  getDetails = () =>
    this.readiness.state === 'ready'
      ? undefined
      : new ZcashScannerNotReady(this.readiness).message;
}
