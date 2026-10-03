import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const contractsPath = join(tmpdir(), `bch-construction-${randomUUID()}.json`);
const contracts = JSON.parse(
  readFileSync(resolve(root, 'tests/config/contracts.test.json'), 'utf8')
);
const calls = [];
const server = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const body = JSON.parse(Buffer.concat(chunks).toString());
  calls.push(body.method);
  const result =
    body.method === 'getblockchaininfo'
      ? { chain: 'regtest', blocks: 7, bestblockhash: '01'.repeat(32) }
      : body.method === 'getnetworkinfo'
      ? { subversion: '/Bitcoin Cash Node:29.2.0/' }
      : undefined;
  response.setHeader('Content-Type', 'application/json');
  response.end(
    JSON.stringify({
      id: body.id,
      result,
      error:
        result === undefined
          ? { code: -32601, message: 'unexpected fixture call' }
          : null,
    })
  );
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const port = server.address().port;
writeFileSync(
  contractsPath,
  JSON.stringify({
    ...contracts,
    'bitcoin-cash': {
      ...contracts.ergo,
      addresses: {
        ...contracts.ergo.addresses,
        lock: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
      },
    },
  })
);
process.env.NODE_CONFIG = JSON.stringify({
  network: 'bitcoin-cash',
  ergo: {
    mnemonic: [...Array(11).fill('abandon'), 'about'].join(' '),
    secret: '',
    node: { url: 'http://127.0.0.1:1' },
    explorer: { url: 'http://127.0.0.1:1' },
  },
  bitcoinCash: {
    type: 'rpc',
    initial: { height: -1 },
    interval: 180,
    rpc: {
      url: `http://127.0.0.1:${port}`,
      timeout: 10,
      expectedChain: 'regtest',
    },
    finalityRpc: { url: 'http://127.0.0.1:1', timeout: 10 },
  },
  path: {
    addresses: contractsPath,
    tokens: resolve(root, 'tests/config/tokens.test.json'),
  },
  database: { type: 'sqlite', path: ':memory:' },
  logs: [],
  blockCleanup: {
    isActiveForErgoChain: false,
    isActiveForNonErgoChains: false,
  },
});
let database;
try {
  await import('../../src/bootstrap.ts');
  const { TokensConfig } = await import('../../src/config/tokensConfig.ts');
  const { dataSource } = await import('../../config/dataSource.ts');
  database = dataSource;
  await TokensConfig.init(resolve(root, 'tests/config/tokens.test.json'));
  const { CreateScanner } = await import('../../src/utils/scanner.ts');
  assert.equal(database.isInitialized, false);
  await CreateScanner.init();
  assert.equal(database.isInitialized, false);
  const scanner = CreateScanner.getInstance().getObservationScanner();
  assert.equal(scanner.name(), 'bitcoin-cash');
  assert.equal(scanner.newExtractors.length, 1);
  assert.equal(scanner.newExtractors[0].getId(), 'bitcoin-cash-rpc-extractor');
  await database.initialize();
  await database.runMigrations();
  // This is the manager passed through the actual awaited scanner factory.
  assert.equal(typeof scanner.network.getCurrentHeight, 'function');
  assert.equal(await scanner.network.getCurrentHeight(), 7);
  assert.deepEqual(calls, ['getblockchaininfo', 'getnetworkinfo']);
  console.log('BCH_CONSTRUCTION_PASS');
} finally {
  if (database?.isInitialized) await database.destroy();
  await new Promise((done, reject) =>
    server.close((error) => (error ? reject(error) : done()))
  );
  unlinkSync(contractsPath);
}
