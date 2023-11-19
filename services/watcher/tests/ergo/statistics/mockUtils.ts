import {
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
} from '@rosen-bridge/watcher-data-extractor';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { boxesSample } from '../dataset/BoxesSample';
import { mockedResponseBody } from '../objects/mockedResponseBody';

const permitAddress =
  'EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtDzAbnu9QfknzmtfnLYHdxPPg7Qtjy7jK5yUpPQ2M4Ps3h5kH57xWDJxcKviEMY11rQnxATjTKTQgGtfzsAPpqsUyT2ZpVYsFzUGJ4nSj4WaDZSU1Hovv6dPkSTArLQSjp38wE72ae6hbNJwXGkqgfBtdVXcZVtnqevw9xUNcE6i942CQ9hVMfbdRobnsaLgsDLQomsh8jLMXqkMde5qH2vGBUqnLKgjxCZaa7vStpPXT5EuzLn9napGwUcbJjgRk69FsRSfCrcydZbYxw4Gnh6ZB9at2USpwL1HdVkHVh8M6Kbw6ppRfeG4JeFsUw33H4sSRk6UPqfuFcRUf7Cec2vmPezXTPT7CXQqEeCjxmWXqfyEQUfnCwpiH5fQ9A8CQ3jTyFhxBTpoGDdtiVCmhqhKxjh9M7gcjpr1dUjGMCWxjir94ejfq24XQrSscrZuUT5NVHTWAkzQ';
export const RWTId =
  '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267';
/**
 * Generating sample Permit Box for the statistics test
 *  with ergo wasm we can't generate box directly, so we should generate a transaction and sign it
 *  then use the output box as a sample box
 * @param permitBoxValue
 * @param tokensList list of tokenIds that we want to be in the permit box
 * @param WID permit box WID
 */
const permitBoxGenerator = (
  permitBoxValue: string,
  tokensList: Array<string>,
  WID: string
) => {
  const sk = wasm.SecretKey.random_dlog();
  const permitAddressContract = wasm.Contract.pay_to_address(
    wasm.Address.from_base58(permitAddress)
  );
  const address = wasm.Contract.pay_to_address(sk.get_address());
  const outBoxValue = wasm.BoxValue.from_i64(wasm.I64.from_str(permitBoxValue));
  const outBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
    outBoxValue,
    permitAddressContract,
    0
  );

  outBoxBuilder.add_token(
    wasm.TokenId.from_str(RWTId),
    wasm.TokenAmount.from_i64(wasm.I64.from_str('10'))
  );

  tokensList.forEach((token) => {
    outBoxBuilder.add_token(
      wasm.TokenId.from_str(token),
      wasm.TokenAmount.from_i64(wasm.I64.from_str('10'))
    );
  });

  outBoxBuilder.set_register_value(
    4,
    wasm.Constant.from_coll_coll_byte([new Uint8Array(Buffer.from(WID, 'hex'))])
  );

  const outBox = outBoxBuilder.build();
  const tokens = new wasm.Tokens();
  tokens.add(
    new wasm.Token(
      wasm.TokenId.from_str(RWTId),
      wasm.TokenAmount.from_i64(wasm.I64.from_str('10'))
    )
  );
  tokensList.forEach((token) => {
    tokens.add(
      new wasm.Token(
        wasm.TokenId.from_str(token),
        wasm.TokenAmount.from_i64(wasm.I64.from_str('10'))
      )
    );
  });

  const inputBox = new wasm.ErgoBox(
    wasm.BoxValue.from_i64(wasm.I64.from_str('1100000000')),
    0,
    address,
    wasm.TxId.zero(),
    0,
    tokens
  );
  const unspentBoxes = new wasm.ErgoBoxes(inputBox);
  const txOutputs = new wasm.ErgoBoxCandidates(outBox);
  const fee = wasm.TxBuilder.SUGGESTED_TX_FEE();
  const boxSelector = new wasm.SimpleBoxSelector();
  const targetBalance = wasm.BoxValue.from_i64(
    outBoxValue.as_i64().checked_add(fee.as_i64())
  );
  const boxSelection = boxSelector.select(unspentBoxes, targetBalance, tokens);
  const tx = wasm.TxBuilder.new(
    boxSelection,
    txOutputs,
    0,
    fee,
    sk.get_address()
  ).build();
  const blockHeaders = wasm.BlockHeaders.from_json(
    mockedResponseBody.last10BlockHeaders
  );
  const preHeader = wasm.PreHeader.from_block_header(blockHeaders.get(0));
  const ctx = new wasm.ErgoStateContext(preHeader, blockHeaders);
  const sks = new wasm.SecretKeys();
  sks.add(sk);
  const wallet = wasm.Wallet.from_secrets(sks);
  const signedTx = wallet.sign_transaction(
    ctx,
    tx,
    unspentBoxes,
    wasm.ErgoBoxes.from_boxes_json([])
  );
  return Buffer.from(
    signedTx.outputs().get(0).sigma_serialize_bytes()
  ).toString('base64');
};

const firstPermit = new PermitEntity();
firstPermit.WID = 'WIDStatistics';
firstPermit.block = 'blockHash';
firstPermit.height = 100;
firstPermit.extractor = 'extractor';
firstPermit.boxId = 'boxIDStatistics2';
firstPermit.boxSerialized = Buffer.from(
  wasm.ErgoBox.from_json(boxesSample.fifthPermitBox).sigma_serialize_bytes()
).toString('base64');
firstPermit.spendBlock = 'blockHash2';
firstPermit.spendHeight = 110;
firstPermit.txId = 'txId';

const secondPermit = new PermitEntity();
secondPermit.WID = 'WIDStatistics';
secondPermit.block = 'blockHash2';
secondPermit.height = 101;
secondPermit.extractor = 'extractor';
secondPermit.boxId = 'boxIDStatistics1';
secondPermit.boxSerialized = permitBoxGenerator(
  '100000000',
  ['0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95'],
  'WIDStatistics'
);
secondPermit.spendBlock = 'blockHash1';
secondPermit.spendHeight = 111;
secondPermit.txId = 'txId2';

const firstStatisticCommitment = new CommitmentEntity();
firstStatisticCommitment.commitment = 'commitment';
firstStatisticCommitment.boxId = 'boxIdStatistics1';
firstStatisticCommitment.WID = 'WIDStatistics';
firstStatisticCommitment.eventId = 'eventId1';
firstStatisticCommitment.block = 'block';
firstStatisticCommitment.extractor = 'extractor';
firstStatisticCommitment.height = 1005;
firstStatisticCommitment.boxSerialized = '222';
firstStatisticCommitment.txId = 'txId';

const secondStatisticCommitment = {
  ...firstStatisticCommitment,
  boxId: 'boxIdStatistics2',
  eventId: 'eventId2',
};
const thirdStatisticCommitment = {
  ...firstStatisticCommitment,
  boxId: 'boxIdStatistics3',
  eventId: 'eventId3',
};

const firstStatisticsEventTrigger = new EventTriggerEntity();
firstStatisticsEventTrigger.sourceTxId = 'txIdStar';
firstStatisticsEventTrigger.block = 'blockID';
firstStatisticsEventTrigger.height = 100;
firstStatisticsEventTrigger.extractor = 'extractor';
firstStatisticsEventTrigger.boxId = 'boxIdStatistics';
firstStatisticsEventTrigger.boxSerialized = 'box';
firstStatisticsEventTrigger.amount = '100';
firstStatisticsEventTrigger.networkFee = '1000';
firstStatisticsEventTrigger.bridgeFee = '200';
firstStatisticsEventTrigger.fromAddress = 'fromAddress';
firstStatisticsEventTrigger.toAddress = 'toAddress';
firstStatisticsEventTrigger.fromChain = 'fromChainStar';
firstStatisticsEventTrigger.toChain = 'toChainStar';
firstStatisticsEventTrigger.sourceChainTokenId = 'tokenIdStar';
firstStatisticsEventTrigger.targetChainTokenId = 'targetTokenId';
firstStatisticsEventTrigger.WIDs = '1,WIDStatistics,3';
firstStatisticsEventTrigger.sourceBlockId = 'block';
firstStatisticsEventTrigger.sourceChainHeight = 123456;
firstStatisticsEventTrigger.eventId =
  'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b';
firstStatisticsEventTrigger.txId = 'createTxId';
firstStatisticsEventTrigger.spendTxId = 'txId';

const secondStatisticsEventTrigger = {
  ...firstStatisticsEventTrigger,
  boxId: 'boxIdStatistics2',
};
const thirdStatisticsEventTrigger = {
  ...firstStatisticsEventTrigger,
  boxId: 'boxIdStatistics3',
};

const spentEventTrigger = {
  ...firstStatisticsEventTrigger,
  boxId: 'boxIdStatistics4',
  spendBlock: 'blockHash',
  spendHeight: 110,
};

const firstRevenue = {
  id: 4,
  permitTxId: 'txId2',
  wid: 'WIDStatistics',
  eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
  lockHeight: 123457,
  fromChain: 'fromChain',
  toChain: 'toChain',
  fromAddress: 'fromAddress',
  toAddress: 'toAddressStar',
  amount: '100',
  bridgeFee: '200',
  networkFee: '1000',
  tokenId: 'tokenId',
  lockTxId: 'txId2',
  height: 2222,
  timestamp: 123456789,
  revenues: [
    {
      tokenId:
        '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267',
      amount: 10,
      decimals: 0,
      isNativeToken: false,
    },
    {
      tokenId:
        '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95',
      amount: 10,
      decimals: 0,
      isNativeToken: false,
    },
  ],
};

const lastRevenue = {
  id: 1,
  permitTxId: 'txId',
  eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
  lockHeight: 123457,
  fromChain: 'fromChainStar',
  toChain: 'toChainStar',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '100',
  bridgeFee: '200',
  networkFee: '1000',
  tokenId: 'tokenIdStar',
  lockTxId: 'txIdStar',
  height: null,
  timestamp: null,
  revenues: [
    {
      tokenId:
        '8e5b02ba729ad364867619d2a8b9ff1438190c14979a12aa0a249e996194f074',
      amount: 9999,
    },
  ],
};

const tokenId2Revenue = {
  id: 3,
  permitTxId: 'txId',
  eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
  lockHeight: 123457,
  fromChain: 'fromChain',
  toChain: 'toChain',
  fromAddress: 'fromAddressStar',
  toAddress: 'toAddress',
  amount: '100',
  bridgeFee: '200',
  networkFee: '1000',
  tokenId: 'tokenId2',
  lockTxId: 'txId',
  height: 1111,
  timestamp: 123,
  revenues: [
    {
      amount: 1,
      tokenId:
        '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267',
    },
  ],
};

const secondTokenId2Revenue = {
  id: 1,
  permitTxId: 'txId',
  eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
  lockHeight: 123457,
  fromChain: 'fromChain',
  toChain: 'toChain',
  fromAddress: 'fromAddressStar',
  toAddress: 'toAddress',
  amount: '100',
  bridgeFee: '200',
  networkFee: '1000',
  tokenId: 'tokenId2',
  lockTxId: 'txId',
  height: null,
  timestamp: null,
  revenues: [
    {
      tokenId:
        '8e5b02ba729ad364867619d2a8b9ff1438190c14979a12aa0a249e996194f074',
      amount: 9999,
    },
  ],
};

const revenueWeeklyChart = [
  {
    title: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 3',
      tokenId:
        '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95',
    },
    data: [{ label: '123379200000', amount: '10' }],
  },
  {
    title: {
      decimals: 0,
      isNativeToken: false,
      name: 'Unsupported token',
      tokenId:
        '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267',
    },
    data: [
      { label: '123379200000', amount: '10' },
      { label: '0', amount: '1' },
    ],
  },
];

const revenueMonthlyChart = [
  {
    title: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 3',
      tokenId:
        '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95',
    },
    data: [{ label: '0', amount: '10' }],
  },
  {
    title: {
      decimals: 0,
      isNativeToken: false,
      name: 'Unsupported token',
      tokenId:
        '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267',
    },
    data: [{ label: '0', amount: '11' }],
  },
];

const revenueYearlyChart = [
  {
    title: {
      decimals: 6,
      isNativeToken: false,
      name: 'test token 3',
      tokenId:
        '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95',
    },
    data: [{ label: '0', amount: '10' }],
  },
  {
    title: {
      decimals: 0,
      isNativeToken: false,
      name: 'Unsupported token',
      tokenId:
        '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267',
    },
    data: [{ label: '0', amount: '11' }],
  },
];

const testMnemonic =
  'route like two trophy tank excite cigar hockey sketch pencil curious memory tissue admit december';

const testAddress = '9h9yPqLigT84b4Uv478XP8yxMTMa7gFRa1UstKkf1HgTf761UgR';

export {
  firstPermit,
  secondPermit,
  firstStatisticCommitment,
  secondStatisticCommitment,
  thirdStatisticCommitment,
  firstStatisticsEventTrigger,
  secondStatisticsEventTrigger,
  thirdStatisticsEventTrigger,
  spentEventTrigger,
  firstRevenue,
  lastRevenue,
  tokenId2Revenue,
  secondTokenId2Revenue,
  revenueWeeklyChart,
  revenueMonthlyChart,
  revenueYearlyChart,
  testMnemonic,
  testAddress,
};
