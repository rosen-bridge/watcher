import { resolve } from 'node:path';

// Synthetic existing-chain configuration keeps providers on loopback.
process.env.NODE_CONFIG = JSON.stringify({
  network: 'ergo',
  ergo: {
    mnemonic: [...Array(11).fill('abandon'), 'about'].join(' '),
    secret: '',
    node: { url: 'http://127.0.0.1:1' },
    explorer: { url: 'http://127.0.0.1:1' },
  },
  path: {
    addresses: resolve('tests/config/contracts.test.json'),
    tokens: resolve('tests/config/tokens.test.json'),
  },
  database: { type: 'sqlite', path: ':memory:' },
  logs: [],
  blockCleanup: {
    isActiveForErgoChain: false,
    isActiveForNonErgoChains: false,
  },
});
await import('../src/bootstrap');

export {};
