const events = [
  {
    id: 5,
    eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
    txId: 'createTxId',
    extractor: 'extractor',
    boxId: 'boxIdStatistics3',
    boxSerialized: 'box',
    block: 'blockID',
    height: 100,
    fromChain: 'ergo',
    toChain: 'toChainStar',
    fromAddress: 'fromAddress',
    toAddress: 'toAddress',
    amount: '100',
    bridgeFee: '200',
    networkFee: '1000',
    sourceChainTokenId: 'tokenIdStar',
    sourceChainHeight: 123456,
    targetChainTokenId: 'targetTokenId',
    sourceTxId: 'txIdStar',
    sourceBlockId: 'block',
    WIDs: '1,WIDStatistics,3',
    spendBlock: null,
    spendHeight: null,
    spendTxId: 'txId',
    lockToken: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 12',
      tokenId: 'tokenIdStar',
    },
    result: null,
    paymentTxId: null,
  },
  {
    id: 4,
    eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
    txId: 'createTxId',
    extractor: 'extractor',
    boxId: 'boxIdStatistics2',
    boxSerialized: 'box',
    block: 'blockID',
    height: 100,
    fromChain: 'ergo',
    toChain: 'toChainStar',
    fromAddress: 'fromAddress',
    toAddress: 'toAddress',
    amount: '100',
    bridgeFee: '200',
    networkFee: '1000',
    sourceChainTokenId: 'tokenIdStar',
    sourceChainHeight: 123456,
    targetChainTokenId: 'targetTokenId',
    sourceTxId: 'txIdStar',
    sourceBlockId: 'block',
    WIDs: '1,WIDStatistics,3',
    spendBlock: null,
    spendHeight: null,
    spendTxId: 'txId',
    lockToken: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 12',
      tokenId: 'tokenIdStar',
    },
    result: null,
    paymentTxId: null,
  },
  {
    id: 3,
    eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
    txId: 'createTxId',
    extractor: 'extractor',
    boxId: 'boxIdStatistics',
    boxSerialized: 'box',
    block: 'blockID',
    height: 100,
    fromChain: 'ergo',
    toChain: 'toChainStar',
    fromAddress: 'fromAddress',
    toAddress: 'toAddress',
    amount: '100',
    bridgeFee: '200',
    networkFee: '1000',
    sourceChainTokenId: 'tokenIdStar',
    sourceChainHeight: 123456,
    targetChainTokenId: 'targetTokenId',
    sourceTxId: 'txIdStar',
    sourceBlockId: 'block',
    WIDs: '1,WIDStatistics,3',
    spendBlock: null,
    spendHeight: null,
    spendTxId: 'txId',
    lockToken: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 12',
      tokenId: 'tokenIdStar',
    },
    result: null,
    paymentTxId: null,
  },
  {
    id: 2,
    eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
    txId: 'createTxId2',
    extractor: 'extractor',
    boxId: 'boxId2',
    boxSerialized: 'box2',
    block: 'blockID2',
    height: 100,
    fromChain: 'ergo',
    toChain: 'toChain',
    fromAddress: 'fromAddress',
    toAddress: 'toAddressStar',
    amount: '100',
    bridgeFee: '200',
    networkFee: '1000',
    sourceChainTokenId: 'tokenId',
    sourceChainHeight: 123457,
    targetChainTokenId: 'targetTokenId',
    sourceTxId: 'txId2',
    sourceBlockId: 'block',
    WIDs: '1,2,3',
    spendBlock: null,
    spendHeight: null,
    spendTxId: 'txId2',
    lockToken: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 10',
      tokenId: 'tokenId',
    },
    result: null,
    paymentTxId: null,
  },
  {
    id: 1,
    eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
    txId: 'txId',
    extractor: 'extractor',
    boxId: 'boxId',
    boxSerialized: 'box',
    block: 'blockID',
    height: 100,
    fromChain: 'ergo',
    toChain: 'toChain',
    fromAddress: 'fromAddressStar',
    toAddress: 'toAddress',
    amount: '100',
    bridgeFee: '200',
    networkFee: '1000',
    sourceChainTokenId: 'tokenId2',
    sourceChainHeight: 123456,
    targetChainTokenId: 'targetTokenId',
    sourceTxId: 'txId',
    sourceBlockId: 'block',
    WIDs: '1,2,3',
    spendBlock: null,
    spendHeight: null,
    spendTxId: null,
    lockToken: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 11',
      tokenId: 'tokenId2',
    },
    result: null,
    paymentTxId: null,
  },
];

const observations = [
  {
    id: 1,
    fromChain: 'ergo',
    toChain: 'cardano',
    fromAddress: 'fromAddress',
    toAddress: 'addr1',
    height: 1,
    amount: '10',
    networkFee: '1000',
    bridgeFee: '100',
    sourceChainTokenId: 'tokenId',
    targetChainTokenId: 'targetToken',
    sourceTxId: 'txId',
    sourceBlockId: 'block',
    requestId: 'reqId1',
    block: 'hash',
    extractor: 'observation-extractor',
    status: 'not_committed',
    lockToken: {
      tokenId: 'tokenId',
      name: 'test token 10',
      decimals: 6,
      isNativeToken: false,
    },
  },
  {
    id: 2,
    fromChain: 'ergo',
    toChain: 'cardano',
    fromAddress: 'fromAddress4',
    toAddress: 'addr4',
    height: 10,
    amount: '5',
    networkFee: '1000',
    bridgeFee: '100',
    sourceChainTokenId: 'tokenId2',
    targetChainTokenId: 'targetToken',
    sourceTxId: 'txId4',
    sourceBlockId: 'block',
    requestId: 'reqId4',
    block: 'hash',
    extractor: 'observation-extractor',
    status: 'not_committed',
    lockToken: {
      tokenId: 'tokenId2',
      name: 'test token 11',
      decimals: 6,
      isNativeToken: false,
    },
  },
];

export { events, observations };
