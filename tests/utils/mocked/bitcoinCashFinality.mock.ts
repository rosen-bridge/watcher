import nock from 'nock';
import {
  finalityData,
  finalityRpcResult,
} from '../bitcoinCashFinalityTestData';

/** One isolated endpoint outcome, keeping all unrelated RPC fields unchanged. */
export type FinalityFault =
  | 'waiting-finalization'
  | 'invalid-evidence'
  | 'parked-fork';

/**
 * Creates a coherent lagging header or an isolated operator fault.
 * @param fault - The expected endpoint-level diagnostic
 * @returns A deterministic RPC response function with no network access
 */
export const finalityFaultResult =
  (fault: FinalityFault) =>
  (method: string, params: unknown[]): unknown => {
    if (method === 'getblockheader' && fault !== 'parked-fork')
      return {
        hash: finalityData.finalized,
        height: 99,
        confirmations: fault === 'waiting-finalization' ? 22 : 21,
      };
    if (method === 'getchaintips' && fault === 'parked-fork')
      return [
        { hash: finalityData.tip, height: 120, branchlen: 0, status: 'active' },
        {
          hash: finalityData.replacement,
          height: 110,
          branchlen: 11,
          status: 'parked',
        },
      ];
    return finalityRpcResult(method, params);
  };

/** Captures a mocked transport request through the real RPC/client pipeline. */
export interface FinalityRpcCall {
  method: string;
  params: unknown[];
}

/**
 * Installs an endpoint-local deterministic RPC peer with response-ID correlation.
 * @param url - Synthetic HTTPS origin
 * @param calls - Owned request trace
 * @param result - Optional one-field response fault
 */
export const mockFinalityRpc = (
  url: string,
  calls: FinalityRpcCall[],
  result: (method: string, params: unknown[]) => unknown = finalityRpcResult
) =>
  nock(url)
    .persist()
    .post('/')
    .reply(200, (_uri, body) => {
      const request = body as unknown as FinalityRpcCall & { id: string };
      calls.push({ method: request.method, params: request.params });
      return {
        id: request.id,
        error: null,
        result: result(request.method, request.params),
      };
    });
