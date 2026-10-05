/** Synthetic RPC identities; no real chain or operator endpoint is represented. */
export const finalityData = {
  source: 'https://source.bch.test',
  witness: 'https://witness.bch.test',
  block: '11'.repeat(32),
  finalized: '22'.repeat(32),
  tip: '33'.repeat(32),
  replacement: '44'.repeat(32),
};

/** Observation fields consumed by the finality gate. */
export const finalityObservation = {
  fromChain: 'bitcoin-cash',
  height: 100,
  block: finalityData.block,
  sourceBlockId: finalityData.block,
};

/** Stable BCHN view with finalized ancestry strictly above the observed block. */
export const finalityRpcResult = (method: string, params: unknown[]) => {
  switch (method) {
    case 'getblockchaininfo':
      return {
        chain: 'regtest',
        blocks: 120,
        headers: 120,
        initialblockdownload: false,
        bestblockhash: finalityData.tip,
      };
    case 'getnetworkinfo':
      return { subversion: '/Bitcoin Cash Node:29.2.0/' };
    case 'getfinalizedblockhash':
      return finalityData.finalized;
    case 'getblockheader':
      return { hash: finalityData.finalized, height: 110, confirmations: 11 };
    case 'getblockhash':
      if (params[0] === 110) return finalityData.finalized;
      if (params[0] === 100) return finalityData.block;
      throw Error('Unexpected synthetic block height');
    case 'getchaintips':
      return [
        { hash: finalityData.tip, height: 120, branchlen: 0, status: 'active' },
      ];
    default:
      throw Error('Unexpected synthetic RPC method');
  }
};
