import { vi } from 'vitest';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { ObservationEntity } from '@rosen-bridge/abstract-observation-extractor';
import type { Boxes } from '../../src/ergo/boxes';
import type { WatcherDataBase } from '../../src/database/models/watcherModel';
import type { WatcherUtils } from '../../src/utils/watcherUtils';
import permitJson from '../ergo/transactions/dataset/permitBox.json';
import widJson from '../ergo/transactions/dataset/WIDBox.json';
import commitmentJson from '../ergo/transactions/dataset/commitmentBox.json';
import repoJson from '../ergo/transactions/dataset/repoBox1.json';
import repoConfigJson from '../ergo/transactions/dataset/repConfigBox.json';
import signedJson from '../ergo/transactions/dataset/commitmentTx.json';

/** Existing public fixture identifiers; no live keys or endpoints are used. */
export const fixtureWid =
  'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b';
const fixtureRwt =
  '469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db';
const finality = vi.fn<() => Promise<void>>();

/**
 * Construct a persisted native observation with exact source-block identity.
 * @returns Independent BCH observation for consumer identity assertions
 */
export const observationFixture = (): ObservationEntity =>
  Object.assign(new ObservationEntity(), {
    id: 33,
    fromChain: 'bitcoin-cash',
    toChain: 'ergo',
    sourceBlockId: '11'.repeat(32),
    block: '11'.repeat(32),
    height: 123,
    sourceTxId: '22'.repeat(32),
    requestId: '22'.repeat(32),
    amount: '100000',
    bridgeFee: '1000',
    networkFee: '1000',
    sourceChainTokenId: 'bch',
    targetChainTokenId: '33'.repeat(32),
    toAddress: 'fixture-recipient',
    fromAddress: 'fixture-sender',
    rawData: '{}',
  });

/**
 * Control external ports while retaining the actual producer and queue classes.
 * @returns Real WASM fixtures, actual utility classes, owned spies and teardown
 */
export const finalityConsumerFixture = async () => {
  finality.mockReset().mockResolvedValue(undefined);
  vi.doMock('../../src/utils/bitcoinCashFinality', () => ({
    assertBitcoinCashObservationFinality: finality,
  }));
  vi.doMock('../../src/init', () => ({ watcherDatabase: undefined }));
  vi.doMock('../../src/utils/scanner', () => ({}));
  vi.doMock('../../src/api/Transaction', () => ({ Transaction: class {} }));
  vi.doMock('../../src/config/config', () => ({
    /** Provide bounded local policy without loading an operator configuration. */
    getConfig: () => ({
      general: {
        networkWatcher: 'bitcoin-cash',
        fee: '1100000',
        minBoxValue: '1100000',
        secretKey: 'unused-signing-port-fixture',
        transactionConfirmation: 10,
        transactionRemovingTimeout: 100,
        nodeTimeout: 1,
        explorerTimeout: 1,
        nodeUrl: 'http://node.invalid',
        explorerUrl: 'http://explorer.invalid',
      },
      rosen: {
        RWTId: fixtureRwt,
        watcherPermitAddress:
          '9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9',
      },
    }),
  }));
  const { ErgoNetwork } = await import('../../src/ergo/network/ergoNetwork');
  const { ErgoUtils } = await import('../../src/ergo/utils');
  const { TokensConfig } = await import('../../src/config/tokensConfig');
  const { TransactionUtils } = await import('../../src/utils/watcherUtils');
  const permit = wasm.ErgoBox.from_json(JSON.stringify(permitJson));
  const wid = wasm.ErgoBox.from_json(JSON.stringify(widJson));
  const commitment = wasm.ErgoBox.from_json(JSON.stringify(commitmentJson));
  const repo = wasm.ErgoBox.from_json(JSON.stringify(repoJson));
  const repoConfig = wasm.ErgoBox.from_json(JSON.stringify(repoConfigJson));
  const signed = wasm.Transaction.from_json(JSON.stringify(signedJson));
  const order: string[] = [];
  finality.mockImplementation(async () => {
    order.push('finality');
  });
  const height = vi.spyOn(ErgoNetwork, 'getHeight').mockResolvedValue(130);
  const maxHeight = vi
    .spyOn(ErgoNetwork, 'getMaxHeight')
    .mockResolvedValue(130);
  const sign = vi
    .spyOn(ErgoUtils, 'createAndSignTx')
    .mockImplementation(async () => {
      order.push('sign');
      return signed;
    });
  const tokens = vi.spyOn(TokensConfig, 'getInstance').mockReturnValue({
    getTokenMap: () => ({
      unwrapAmount: (_token: string, amount: bigint) => ({ amount }),
    }),
  } as unknown as ReturnType<typeof TokensConfig.getInstance>);
  const upgrade = vi.fn(async () => {
    order.push('status');
  });
  const submit = vi.fn(async () => {
    order.push('queue');
  });
  const database = {
    upgradeObservationTxStatus: upgrade,
    submitTx: submit,
  } as unknown as WatcherDataBase;
  const transactionUtils = new TransactionUtils(database);
  const candidate = new wasm.ErgoBoxCandidateBuilder(
    wasm.BoxValue.from_i64(wasm.I64.from_str('1100000')),
    wasm.Contract.new(wid.ergo_tree()),
    130
  ).build();
  const boxes = {
    RWTTokenId: wasm.TokenId.from_str(fixtureRwt),
    getRepoConfigBox: vi.fn(async () => repoConfig),
    createCommitment: vi.fn(() => candidate),
    createPermit: vi.fn(() => candidate),
    createTriggerEvent: vi.fn(async () => candidate),
  } as unknown as Boxes;
  /** Restore only the fixture's own static spies. */
  const restore = () => {
    tokens.mockRestore();
    sign.mockRestore();
    maxHeight.mockRestore();
    height.mockRestore();
  };
  return {
    finality,
    sign,
    submit,
    upgrade,
    order,
    permit,
    wid,
    commitment,
    repo,
    repoConfig,
    signed,
    boxes,
    transactionUtils,
    ErgoNetwork,
    watcherUtils: {} as WatcherUtils,
    restore,
  };
};
