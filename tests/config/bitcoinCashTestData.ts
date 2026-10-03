/** Valid BCHN-only values with a public loopback URL and explicit regtest policy. */
export const bitcoinCashDefaults: Record<string, unknown> = {
  'bitcoinCash.type': 'rpc',
  'bitcoinCash.initial.height': -1,
  'bitcoinCash.interval': 180,
  'bitcoinCash.rpc.url': 'http://127.0.0.1:18443',
  'bitcoinCash.rpc.timeout': 10,
  'bitcoinCash.rpc.expectedChain': 'regtest',
  'bitcoinCash.finalityRpc.url': 'http://127.0.0.1:28443',
  'bitcoinCash.finalityRpc.timeout': 10,
};

/** Single-field faults isolate chain policy, integer bounds, URL and credential pairing. */
export const invalidBitcoinCashValues: Array<[string, unknown]> = [
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
  ['bitcoinCash.rpc.url', 'http://bchn.example/rpc'],
  ['bitcoinCash.rpc.url', 'http://localhost:18443'],
  ['bitcoinCash.rpc.url', 'http://127.1:18443'],
  ['bitcoinCash.rpc.url', 'http://2130706433:18443'],
  ['bitcoinCash.rpc.url', 'http://0x7f000001:18443'],
  ['bitcoinCash.rpc.url', 'http://[::ffff:127.0.0.1]:18443'],
  ['bitcoinCash.rpc.url', 'http://@127.0.0.1:18443'],
  ['bitcoinCash.rpc.url', 'http://127.0.0.1/' + 'a'.repeat(2048)],
  ['bitcoinCash.rpc.username', 'operator'],
  ['bitcoinCash.rpc.password', 'password'],
  ['bitcoinCash.finalityRpc.url', 'http://127.0.0.1:18443/other-path'],
  ['bitcoinCash.finalityRpc.url', 'http://witness.example'],
  ['bitcoinCash.finalityRpc.timeout', 0],
  ['bitcoinCash.finalityRpc.timeout', 301],
  ['bitcoinCash.finalityRpc.username', 'operator'],
  ['bitcoinCash.finalityRpc.password', 'password'],
];

/** Bad values are applied to one member of an otherwise paired synthetic credential fixture. */
export const malformedBitcoinCashCredentials: Array<[string, unknown]> = [
  ...['bitcoinCash.rpc.username', 'bitcoinCash.rpc.password'].flatMap((key) =>
    ['', 'a'.repeat(1025), ' leading', 'trailing ', 'line\nbreak', 12].map(
      (value): [string, unknown] => [key, value]
    )
  ),
  ['bitcoinCash.rpc.username', 'user:name'],
];

/** Canonical native locking scripts exercise both accepted treasury address kinds. */
export const bitcoinCashNativeScripts = [
  '76a914' + '11'.repeat(20) + '88ac',
  'a914' + '22'.repeat(20) + '87',
];

/** Public CashAddr vector used only to derive independent operator-input faults. */
const nativeAddress = 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a';

/** Noncanonical, token-aware, foreign, invalid-checksum and wrong-type treasury inputs. */
export const invalidBitcoinCashLocks = [
  nativeAddress.toUpperCase(),
  'bitcoincash:zqg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zy7m9s3er2',
  'bitcoincash:rqg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyf7clk6ch',
  'bitcoincash:pvg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zch7f55mh',
  nativeAddress.slice(12),
  nativeAddress.replace('bitcoincash', 'bchtest'),
  nativeAddress.slice(0, -1) + 'q',
  '',
  null,
  12,
];
