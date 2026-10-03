import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const initUrl = new URL('../../src/init.ts', import.meta.url).href;
const indexUrl = new URL('../../src/index.ts', import.meta.url).href;

// Run the actual entry and initializer in a disposable process. Only external
// ports are replaced: no database, network, secret, or service is accessed.
/** Records a startup transition and injects a failure at the selected port. */
global.startupEvent = (name) => {
  process.stdout.write(`${name}\n`);
  if (process.env.STARTUP_FAILURE === name) throw Error(`fixture ${name}`);
};
global.startupConfig = {
  general: {
    networkWatcher: process.env.STARTUP_CHAIN || 'bitcoin-cash',
    apiAllowedOrigins: ['*'],
  },
};

const modules = {
  express: `
    export const Router = () => ({ use() {} });
    const express = () => ({ use() {}, listen() { startupEvent('api'); } });
    express.json = () => {};
    export default express;`,
  cors: 'export default () => {};',
  './config/config': 'export const getConfig = () => startupConfig;',
  './config/constants':
    "export const BITCOIN_CASH_CHAIN_NAME = 'bitcoin-cash';",
  './config/tokensConfig': `export const TokensConfig = {
    async init() { startupEvent('tokens'); },
    getInstance() { return { getTokenMap() { return {}; } }; }
  };`,
  './utils/scanner': `export const CreateScanner = {
    async init() { startupEvent('scanner-construction'); }
  };`,
  '../config/dataSource': `export const dataSource = {
    async initialize() { startupEvent('database'); },
    async runMigrations() { startupEvent('migrations'); }
  };`,
  './api/Transaction': `let setups = 0; export const Transaction = {
    async setup() { startupEvent(++setups === 1 ? 'transaction' : 'statistic'); },
    getInstance() {}
  };`,
  './ergo/boxes': 'export class Boxes {}',
  './database/models/watcherModel': 'export class WatcherDataBase {}',
  './utils/watcherUtils':
    'export class WatcherUtils {} export class TransactionUtils {}',
  './utils/utils': `export const delay = async () => { startupEvent('delay'); };`,
  './utils/MinimumFeeHandler': `export default {
    async init() {
      startupEvent('fees-start');
      await new Promise(resolve => setTimeout(resolve, 10));
      startupEvent('fees-ready');
    }
  };`,
  '@rosen-bridge/abstract-logger': `const logger = {
    child() { return this; }, debug() {}, info() {},
    error() { startupEvent('logged-error'); }
  }; export const DefaultLogger = { getInstance() { return logger; } };`,
  '@rosen-bridge/address-manager': `export const AddressManager = {
    init() { startupEvent('addresses'); }
  };`,
  '@rosen-bridge/address-codec':
    'export const chainValidators = {}; export const chainDecoders = {};',
  './api/healthCheck': 'export const healthRouter = {};',
};

for (const name of [
  'address',
  'permit',
  'observation',
  'general',
  'events',
  'withdraw',
  'revenue',
])
  modules[`./api/${name}`] = 'export default {};';

for (const [file, name] of [
  ['initScanner', 'scannerInit'],
  ['commitmentCreation', 'creation'],
  ['commitmentReveal', 'reveal'],
  ['transactionQueue', 'transactionQueueJob'],
  ['commitmentRedeem', 'redeem'],
  ['tokenName', 'tokenNameJob'],
  ['revenue', 'revenueJob'],
  ['healthCheck', 'healthCheckJob'],
  ['widStatus', 'widStatusJob'],
  ['minimumFee', 'minimumFeeUpdateJob'],
  ['rewardCollection', 'rewardCollection'],
])
  modules[
    `./jobs/${file}`
  ] = `export const ${name} = () => startupEvent('${name}');`;

registerHooks({
  /** Replaces external ports while retaining the actual entry and initializer. */
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === indexUrl && specifier === './init')
      return { url: initUrl, shortCircuit: true };
    if (context.parentURL === indexUrl && specifier === './bootstrap')
      return { url: 'data:text/javascript,export {};', shortCircuit: true };
    if (context.parentURL === initUrl && specifier !== 'node:process') {
      if (!(specifier in modules)) throw Error(`Unmocked port ${specifier}`);
      return {
        url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
  /** Transpiles the current production sources without changing their behavior. */
  load(url, context, nextLoad) {
    if (url === initUrl || url === indexUrl)
      return {
        format: 'module',
        source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});

// An open handle makes log-only startup failure observable as a timeout,
// while the real entry's process.exit(1) still terminates deterministically.
if (process.env.STARTUP_HOLD === '1') setInterval(() => undefined, 1000);
await import(indexUrl);
