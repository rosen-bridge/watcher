import nock from 'nock';
import { finalityRpcResult } from '../bitcoinCashFinalityTestData';

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
