import type { HealthStatus } from '@rosen-bridge/health-check';

/**
 * Read the required diagnostic payload returned by the real health
 * registry.
 * @param status - Registry lookup for the BCH finality parameter
 * @returns Parsed details; absence fails the fixture instead of
 * masking it
 */
export const finalityHealthDetails = (
  status: HealthStatus | undefined
): Record<string, unknown> => {
  if (!status?.details) throw Error('Expected BCH finality health details');
  return JSON.parse(status.details);
};
