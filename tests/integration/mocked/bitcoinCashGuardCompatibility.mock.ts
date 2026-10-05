import nock from 'nock';
import fixture from '../testData/bitcoinCashFinality.json';

/** Requests captured from the actual scanner RPC client. */
export interface CompatibilityRpcCall {
  method: string;
  params: unknown[];
}

/**
 * Supply the same deterministic chain evidence used by Guard's SQLite scenario.
 * @param origin - Endpoint origin owned by this test
 * @param calls - Request trace for proving both endpoint views were read
 * @param branchMatches - Whether the exact source height belongs to this endpoint's branch
 */
export const mockCompatibilityEndpoint = (
  origin: string,
  calls: CompatibilityRpcCall[],
  branchMatches = true
) =>
  nock(origin)
    .persist()
    .post('/')
    .reply(200, (_uri, body) => {
      const request = body as unknown as CompatibilityRpcCall & { id: string };
      calls.push({ method: request.method, params: request.params });
      let result: unknown;
      switch (request.method) {
        case 'getnetworkinfo':
          result = { subversion: '/Bitcoin Cash Node:29.2.0/' };
          break;
        case 'getblockchaininfo':
          result = fixture.chainInfo;
          break;
        case 'getfinalizedblockhash':
          result = fixture.finalizedHash;
          break;
        case 'getblockheader':
          if (request.params[0] !== fixture.sourceBlock.hash)
            throw Error('Unexpected finalized block request');
          result = fixture.sourceBlock;
          break;
        case 'getblockhash':
          if (request.params[0] !== fixture.sourceBlock.height)
            throw Error('Unexpected source height request');
          result = branchMatches ? fixture.sourceBlock.hash : '77'.repeat(32);
          break;
        case 'getchaintips':
          result = fixture.chainTips;
          break;
        default:
          throw Error(`Unexpected finality RPC method: ${request.method}`);
      }
      return { id: request.id, error: null, result };
    });
