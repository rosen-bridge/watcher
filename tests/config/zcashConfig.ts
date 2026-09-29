import { expect } from 'chai';
import config from 'config';
import sinon from 'sinon';
import { ZcashConfig } from '../../src/config/config';

describe('Zcash configuration parser', () => {
  let values: Record<string, unknown>;
  beforeEach(() => {
    values = {
      'zcash.initial.height': 0,
      'zcash.interval': 75,
      'zcash.network': 'regtest',
      'zcash.expectedGenesisHash': '01'.repeat(32),
      'zcash.rpc.url': 'http://127.0.0.1:18232',
      'zcash.rpc.timeoutMs': 10000,
      'zcash.inspector.executablePath': '/test/inspector',
      'zcash.inspector.expectedSha256': '02'.repeat(32),
      'zcash.branches': [
        { height: 0, branchId: 'c2d6d0b4' },
        { height: 10, branchId: 'c8e71055' },
      ],
    };
    sinon.stub(config, 'has').callsFake((key: string) => key in values);
    sinon.stub(config, 'get').callsFake((key: string) => values[key] as never);
  });
  afterEach(() => sinon.restore());

  it('does not require any Zcash RPC or inspector configuration for another watcher', () => {
    values = {};
    expect(() => new ZcashConfig('ergo')).not.to.throw();
  });

  it('selects the branch at the exact activation boundary', () => {
    const parsed = new ZcashConfig('zcash');
    expect(parsed.branchIdAtHeight(9)).to.equal('c2d6d0b4');
    expect(parsed.branchIdAtHeight(10)).to.equal('c8e71055');
    expect(() => parsed.branchIdAtHeight(-1)).to.throw(
      'Invalid Zcash block height'
    );
  });

  for (const [field, invalid] of [
    ['zcash.network', ''],
    ['zcash.network', 'unknown'],
    ['zcash.initial.height', -1],
    ['zcash.interval', 0],
    ['zcash.rpc.timeoutMs', 0],
    ['zcash.expectedGenesisHash', 'bad'],
    ['zcash.inspector.expectedSha256', 'bad'],
    ['zcash.branches', []],
    ['zcash.branches', [{ height: 1, branchId: 'c2d6d0b4' }]],
    ['zcash.branches', [{ height: 0, branchId: 'bad' }]],
    [
      'zcash.branches',
      [
        { height: 0, branchId: 'c2d6d0b4' },
        { height: 0, branchId: 'c8e71055' },
      ],
    ],
  ] as Array<[string, unknown]>) {
    it(`rejects invalid ${field}: ${JSON.stringify(invalid)}`, () => {
      values[field] = invalid;
      expect(() => new ZcashConfig('zcash')).to.throw(field);
    });
  }

  it('rejects incomplete RPC authentication', () => {
    values['zcash.rpc.username'] = 'test-user';
    expect(() => new ZcashConfig('zcash')).to.throw('zcash.rpc.auth');
  });
});
