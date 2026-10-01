import { expect } from 'chai';
import config from 'config';
import sinon from 'sinon';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { decodeAddress } from '@rosen-bridge/address-codec';
import { BitcoinCashConfig } from '../../src/config/config';
import { RosenConfig } from '../../src/config/rosenConfig';
import { BITCOIN_CASH_CHAIN_NAME } from '../../src/config/constants';

describe('Bitcoin Cash watcher configuration', () => {
  const defaults: Record<string, unknown> = {
    'bitcoinCash.type': 'rpc',
    'bitcoinCash.initial.height': -1,
    'bitcoinCash.interval': 180,
    'bitcoinCash.rpc.url': 'http://127.0.0.1:18443',
    'bitcoinCash.rpc.timeout': 10,
    'bitcoinCash.rpc.expectedChain': 'regtest',
  };
  let values: Record<string, unknown>;
  beforeEach(() => {
    values = { ...defaults };
    sinon
      .stub(config, 'has')
      .callsFake((key) => Object.prototype.hasOwnProperty.call(values, key));
    sinon.stub(config, 'get').callsFake(<T>(key: string): T => values[key] as T);
  });
  afterEach(() => sinon.restore());

  it('keeps other watcher networks independent of BCH configuration', () => {
    values = {};
    expect(new BitcoinCashConfig('bitcoin').rpc).to.equal(undefined);
  });
  for (const chain of ['main', 'test', 'regtest']) {
    it(`passes explicit ${chain} chain policy and last scanned height`, () => {
      values['bitcoinCash.rpc.expectedChain'] = chain;
      const result = new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME);
      expect(result.rpc).to.deep.equal({
        url: defaults['bitcoinCash.rpc.url'],
        timeout: 10,
        expectedChain: chain,
        username: undefined,
        password: undefined,
      });
      expect(result.initialHeight).to.equal(-1);
      expect(result.interval).to.equal(180);
    });
  }
  const invalid: Array<[string, unknown]> = [
    ['bitcoinCash.type', 'esplora'],
    ['bitcoinCash.rpc.expectedChain', ''],
    ['bitcoinCash.rpc.expectedChain', 'testnet'],
    ['bitcoinCash.initial.height', -2],
    ['bitcoinCash.initial.height', 0x100000000],
    ['bitcoinCash.initial.height', 1.5],
    ['bitcoinCash.interval', 0],
    ['bitcoinCash.interval', 86401],
    ['bitcoinCash.interval', '180'],
    ['bitcoinCash.rpc.timeout', 0],
    ['bitcoinCash.rpc.timeout', 301],
    ['bitcoinCash.rpc.timeout', Infinity],
    ['bitcoinCash.rpc.url', ''],
    ['bitcoinCash.rpc.url', 'file:///rpc'],
    ['bitcoinCash.rpc.url', 'http://user:pass@127.0.0.1'],
    ['bitcoinCash.rpc.url', 'http://127.0.0.1/#fragment'],
    ['bitcoinCash.rpc.url', 'http://127.0.0.1/' + 'a'.repeat(2048)],
    ['bitcoinCash.rpc.username', 'operator'],
    ['bitcoinCash.rpc.password', 'password'],
  ];
  for (const [key, value] of invalid) {
    it(`rejects isolated invalid ${key}: ${String(value).slice(0, 40)}`, () => {
      values[key] = value;
      expect(() => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)).to.throw();
    });
  }
  for (const key of Object.keys(defaults)) {
    it(`requires ${key} when BCH is selected`, () => {
      delete values[key];
      expect(() => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)).to.throw();
    });
  }
  it('preserves paired basic credentials', () => {
    values['bitcoinCash.rpc.username'] = 'operator';
    values['bitcoinCash.rpc.password'] = 'rpc-password';
    expect(new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME).rpc).to.include({
      username: 'operator',
      password: 'rpc-password',
    });
  });
  for (const key of ['bitcoinCash.rpc.username', 'bitcoinCash.rpc.password']) {
    for (const value of ['', 'a'.repeat(4097), 12]) {
      it(`rejects malformed paired ${key}: ${String(value).slice(
        0,
        20
      )}`, () => {
        values['bitcoinCash.rpc.username'] = 'operator';
        values['bitcoinCash.rpc.password'] = 'password';
        values[key] = value;
        expect(() => new BitcoinCashConfig(BITCOIN_CASH_CHAIN_NAME)).to.throw();
      });
    }
  }
});

describe('Bitcoin Cash operator contracts', () => {
  const fixture = JSON.parse(
    fs.readFileSync(new URL('./contracts.test.json', import.meta.url), 'utf8')
  );
  let filename: string;
  beforeEach(() => {
    filename = path.join(
      os.tmpdir(),
      `watcher-bch-contracts-${randomUUID()}.json`
    );
  });
  afterEach(() => {
    if (fs.existsSync(filename)) fs.unlinkSync(filename);
  });
  const write = (lock: unknown) => {
    // Reuse upstream test contract identities; these are fixture data, not deployment addresses.
    fs.writeFileSync(
      filename,
      JSON.stringify({
        ...fixture,
        [BITCOIN_CASH_CHAIN_NAME]: {
          ...fixture.ergo,
          addresses: { ...fixture.ergo.addresses, lock },
        },
      })
    );
  };
  for (const script of [
    '76a914' + '11'.repeat(20) + '88ac',
    'a914' + '22'.repeat(20) + '87',
  ]) {
    it(`accepts canonical native ${
      script.startsWith('76') ? 'P2PKH20' : 'P2SH20'
    } lock`, () => {
      const lock = decodeAddress(BITCOIN_CASH_CHAIN_NAME, script);
      write(lock);
      const result = new RosenConfig(BITCOIN_CASH_CHAIN_NAME, filename);
      expect(result.lockAddress).to.equal(lock);
      expect(result.RWTId).to.equal(fixture.ergo.tokens.RWTId);
    });
  }
  it('requires an operator-provided BCH network contract entry', () => {
    fs.writeFileSync(filename, JSON.stringify(fixture));
    expect(() => new RosenConfig(BITCOIN_CASH_CHAIN_NAME, filename)).to.throw(
      "Network 'bitcoin-cash' not found"
    );
  });
  const native = 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a';
  for (const lock of [
    native.toUpperCase(),
    'bitcoincash:zqg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zy7m9s3er2',
    'bitcoincash:rqg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyf7clk6ch',
    'bitcoincash:pvg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zch7f55mh',
    native.slice(12),
    native.replace('bitcoincash', 'bchtest'),
    native.slice(0, -1) + 'q',
    '',
    null,
    12,
  ]) {
    it(`rejects noncanonical operator lock ${String(lock).slice(
      0,
      25
    )}`, () => {
      write(lock);
      expect(
        () => new RosenConfig(BITCOIN_CASH_CHAIN_NAME, filename)
      ).to.throw();
    });
  }
});
