import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'out');
const graph = JSON.parse(
  readFileSync(resolve(output, 'startup-graph.json'), 'utf8')
);
assert.ok(
  Array.isArray(graph) && graph.some((chunk) => chunk.fileName === 'index.mjs')
);
const strict = process.argv.includes('--strict');
const pureCashAddrModules = new Set([
  'build/lib/format/error.js',
  'build/lib/address/bech32.js',
  'build/lib/address/cash-address.js',
]);
// Native ESM retains the format barrel's pure re-exports; Rollup removes these
// unused modules from the built startup chunk.
const pureSourceModules = new Set([
  ...pureCashAddrModules,
  ...[
    'format',
    'base-convert',
    'base64',
    'bin-string',
    'hex',
    'log',
    'number',
    'read',
    'time',
    'type-utils',
    'utf8',
  ].map((name) => `build/lib/format/${name}.js`),
]);
const libauthChunks = graph.filter((chunk) => chunk.libauthModules.length > 0);
const forbidden = libauthChunks
  .filter(
    (chunk) =>
      strict ||
      chunk.libauthModules.some((module) => !pureCashAddrModules.has(module))
  )
  .map((chunk) => {
    assert.equal(dirname(chunk.fileName), '.');
    assert.equal(basename(chunk.fileName), chunk.fileName);
    return pathToFileURL(resolve(output, chunk.fileName)).href;
  });
assert.ok(
  forbidden.length > 0,
  'Expected BCH/libauth chunks; an empty manifest cannot prove isolation'
);
const pureChunks = libauthChunks
  .filter((chunk) =>
    chunk.libauthModules.every((module) => pureCashAddrModules.has(module))
  )
  .map((chunk) => pathToFileURL(resolve(output, chunk.fileName)).href);

// Reject a forbidden chunk before evaluation, including bundled libauth whose
// original package name no longer appears in Node's runtime resolution graph.
const hook = `
const forbidden = new Set(${JSON.stringify(forbidden)});
const pure = new Set(${JSON.stringify(pureChunks)});
const allowedSource = new Set(${JSON.stringify([...pureSourceModules])});
/** Reject forbidden emitted chunks and original package modules before evaluation. */
export const load = async (url, context, nextLoad) => {
  if (forbidden.has(url)) throw Error('BCH_LIBAUTH_LOADED');
  if (pure.has(url)) process.stderr.write('BCH_PURE_CASHADDR_LOADED\\n');
  if (url.includes('/@bitauth/libauth/')) {
    const module = url.split('/@bitauth/libauth/')[1];
    if (${strict} || !allowedSource.has(module)) throw Error('BCH_LIBAUTH_LOADED: ' + module);
    process.stderr.write('BCH_PURE_CASHADDR_SOURCE:' + module + '\\n');
  }
  return nextLoad(url, context);
};
`;
const loader = `data:text/javascript;base64,${Buffer.from(hook).toString(
  'base64'
)}`;
const fixtureConfig = {
  network: 'ergo',
  ergo: {
    mnemonic: [...Array(11).fill('abandon'), 'about'].join(' '),
    secret: '',
    node: { url: 'http://127.0.0.1:1' },
    explorer: { url: 'http://127.0.0.1:1' },
  },
  path: {
    addresses: resolve(root, 'tests/config/contracts.test.json'),
    tokens: resolve(root, 'tests/config/tokens.test.json'),
  },
  database: { type: 'sqlite', path: ':memory:' },
  logs: [],
  blockCleanup: {
    isActiveForErgoChain: false,
    isActiveForNonErgoChains: false,
  },
};
const environment = {
  ...process.env,
  NODE_ENV: 'test',
  NODE_CONFIG_ENV: 'test',
  NODE_CONFIG_DIR: resolve(root, 'config'),
  NODE_CONFIG_PARSER: '',
  NODE_APP_INSTANCE: '',
  NODE_OPTIONS: '',
  NODE_BACKEND: 'js',
  NODE_CONFIG: JSON.stringify(fixtureConfig),
};
/** Execute an isolated entry with a loader that forbids the real emitted BCH chunks. */
const child = (arguments_) =>
  spawnSync(
    process.execPath,
    ['--experimental-loader', loader, ...arguments_],
    {
      cwd: root,
      env: environment,
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 4 * 1024 * 1024,
    }
  );

// Positive controls demonstrate that the loader does reject every forbidden
// chunk; a nonfunctional instrumentation hook must never produce a green test.
for (const url of forbidden) {
  const control = child([
    '--input-type=module',
    '-e',
    `await import(${JSON.stringify(url)})`,
  ]);
  assert.notEqual(control.status, 0);
  assert.match(control.stderr, /BCH_LIBAUTH_LOADED/);
}
const startup = child([resolve(output, 'index.cjs')]);
assert.equal(startup.error, undefined, String(startup.error));
assert.equal(startup.status, 0, startup.stdout + startup.stderr);
assert.doesNotMatch(
  startup.stdout + startup.stderr,
  /BCH_LIBAUTH_LOADED|Failed to initialize|Unhandled Rejection|DefaultLogger\.init/
);
const sourceStartup = child(['--import', 'tsx', resolve(root, 'src/index.ts')]);
assert.equal(sourceStartup.error, undefined, String(sourceStartup.error));
assert.equal(
  sourceStartup.status,
  0,
  sourceStartup.stdout + sourceStartup.stderr
);
assert.doesNotMatch(
  sourceStartup.stdout + sourceStartup.stderr,
  /BCH_LIBAUTH_LOADED|Failed to initialize|Unhandled Rejection|DefaultLogger\.init/
);
console.log(
  JSON.stringify({
    passed: true,
    mode: strict ? 'all-libauth' : 'crypto-and-extractor',
    forbiddenChunks: forbidden.length,
    pureCashAddrLoaded: startup.stderr.includes('BCH_PURE_CASHADDR_LOADED'),
    sourcePureCashAddrModules: [
      ...new Set(
        [
          ...sourceStartup.stderr.matchAll(
            /BCH_PURE_CASHADDR_SOURCE:([^\r\n]+)/g
          ),
        ].map((match) => match[1])
      ),
    ].sort(),
    pureCashAddrModules: [
      ...new Set(
        libauthChunks.flatMap((chunk) =>
          chunk.libauthModules.filter((module) =>
            pureCashAddrModules.has(module)
          )
        )
      ),
    ],
    literalNoLibauthCriterionMet:
      !startup.stderr.includes('BCH_PURE_CASHADDR_LOADED') &&
      !sourceStartup.stderr.includes('BCH_PURE_CASHADDR_SOURCE:'),
    scope:
      'Actual source and emitted bootstrap/init import graphs in Ergo test configuration; application jobs and API are not started',
  })
);
