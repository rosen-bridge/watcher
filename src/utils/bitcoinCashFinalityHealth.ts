import {
  AbstractHealthCheckParam,
  HealthStatusLevel,
} from '@rosen-bridge/health-check';
import type { BitcoinCashFinalityCode } from '@rosen-bridge/bitcoin-cash-scanner/dist/network/bitcoinCashFinalityError.js';

export type FinalityEndpointState =
  | BitcoinCashFinalityCode
  | 'eligible'
  | 'rpc-failure';
type FinalityCheck = {
  block?: string;
  height?: number;
  state:
    | 'checking'
    | 'checked'
    | 'invalid-observation'
    | 'invalid-configuration'
    | 'stale-evidence';
  source?: FinalityEndpointState;
  witness?: FinalityEndpointState;
};

/** Diagnostics for the latest attempted event; never grants signing eligibility. */
export class BitcoinCashFinalityHealth extends AbstractHealthCheckParam {
  private generation = 0;
  private check: FinalityCheck | undefined;
  private checkedAt: Date | undefined;

  /** Returns the stable existing-health-API parameter key. */
  getId = () => 'bitcoin-cash-finality';
  /** Labels the result as one event attempt rather than the entire queue. */
  getTitle = () => 'BCH finality: latest event check';
  /** Explains diagnostic scope and the distinction between waits and faults. */
  getDescription = () =>
    'Latest event attempt on source and witness. This is not a queue-wide status or reusable authorization. Waiting for finalization is routine; RPC, branch and parked-fork failures require investigation.';
  /** Health polling does not obtain or renew finality evidence. */
  updateStatus = () => undefined;

  /**
   * Starts a diagnostic snapshot; newer attempts own it even while in flight.
   * @param block - Validated persisted event hash, if available
   * @param height - Validated persisted event height, if available
   * @returns Generation used to discard older concurrent completions
   */
  begin = (block?: string, height?: number): number => {
    this.check = { state: 'checking', block, height };
    this.checkedAt = new Date();
    return ++this.generation;
  };

  /**
   * Records an outcome unless a newer attempt has already started.
   * @param generation - Attempt identity returned by begin
   * @param result - Sanitized categorical outcome, without raw RPC errors
   */
  finish = (
    generation: number,
    result: Omit<FinalityCheck, 'block' | 'height'>
  ): void => {
    if (generation !== this.generation) return;
    this.check = { ...this.check, ...result };
    this.checkedAt = new Date();
  };

  /** Reports faults separately from an idle process or ordinary finalization wait. */
  getHealthStatus = (): HealthStatusLevel => {
    if (!this.check) return HealthStatusLevel.HEALTHY;
    if (this.check.state !== 'checked') return HealthStatusLevel.UNSTABLE;
    return [this.check.source, this.check.witness].every(
      (state) => state === 'eligible' || state === 'waiting-finalization'
    )
      ? HealthStatusLevel.HEALTHY
      : HealthStatusLevel.UNSTABLE;
  };

  /** Exposes the event, evidence timestamp and endpoint reasons as bounded JSON. */
  getDetails = (): string =>
    JSON.stringify({
      scope: 'latest-event-attempt',
      checkedAt: this.checkedAt?.toISOString(),
      ...(this.check ?? { state: 'no-event-checked' }),
    });
}

export const bitcoinCashFinalityHealth = new BitcoinCashFinalityHealth();
