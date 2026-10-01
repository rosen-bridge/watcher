import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import commonjs from '@rollup/plugin-commonjs';
import { OutputChunk, Plugin, rollup } from 'rollup';

import config, {
  createOrderedEntryImports,
  wrapNativeRequire,
} from '../../rollup.config';

const require = createRequire(import.meta.url);
const directory = fileURLToPath(new URL('../../', import.meta.url));
const bootstrap = (config.plugins as Plugin[]).find(
  (plugin) => plugin.name === 'async-commonjs-bootstrap'
);
if (!bootstrap) throw Error('Missing async bootstrap plugin');
const plugin = bootstrap;

const fixture = async (
  name: string,
  source: string,
  expectedFailure = false
) => {
  const id = `virtual:${name}`;
  const bundle = await rollup({
    input: id,
    external: ['node:assert/strict'],
    plugins: [
      {
        name: 'fixture',
        resolveId: (value) => (value === id ? id : null),
        load: (value) => (value === id ? source : null),
      },
      plugin,
    ],
  });
  try {
    const { output } = await bundle.generate({
      format: 'es',
      inlineDynamicImports: true,
      sourcemap: true,
      file: `${name}.cjs`,
    });
    assert.equal(output.filter((item) => item.type === 'chunk').length, 1);
    const chunk = output.find((item) => item.type === 'chunk') as OutputChunk;
    assert.ok(chunk.map);
    assert.ok(chunk.map.sources.some((source) => source.endsWith(id)));
    let error: Error | undefined;
    let message: unknown;
    const process = { exitCode: undefined as number | undefined };
    await vm.runInNewContext(
      chunk.code,
      {
        require,
        exports: {},
        module: { exports: {} },
        __filename: `${directory}${name}.cjs`,
        __dirname: directory,
        console: {
          log: (value: unknown) => (message = value),
          error: (_prefix: string, value: Error) => (error = value),
        },
        process,
        WebAssembly: Reflect.get(globalThis, 'WebAssembly'),
        Uint8Array,
        ArrayBuffer,
        TextEncoder,
        TextDecoder,
      },
      { filename: `${name}.cjs` }
    );
    if (expectedFailure) {
      assert.equal(error?.message, 'fixture failure');
      assert.equal(process.exitCode, 1);
      const lines = chunk.code.split('\n');
      const index = lines.findIndex((line) => line.includes('fixture failure'));
      const position = originalPositionFor(new TraceMap(chunk.map.toString()), {
        line: index + 1,
        column: lines[index].indexOf('throw'),
      });
      assert.equal(position.line, 3);
      assert.ok(position.source?.endsWith(id));
    } else {
      assert.equal(error, undefined);
      assert.equal(process.exitCode, undefined);
      assert.equal(message, 'PASS');
    }
  } finally {
    await bundle.close();
  }
};

describe('Async CommonJS bootstrap', () => {
  it('orders delayed bootstrap before model evaluation in the compiled real entry', async function () {
    this.timeout(30000);
    const entry = resolve(directory, 'src/index.ts');
    const typescript = (config.plugins as Plugin[]).find(
      (candidate) => candidate.name === 'typescript'
    );
    assert.ok(typescript);
    for (const adapted of [false, true]) {
      const bundle = await rollup({
        input: entry,
        plugins: [
          {
            name: 'entry-dependency-fixture',
            resolveId(value, importer) {
              if (importer === entry && value === './bootstrap')
                return 'virtual:delayed-bootstrap';
              if (importer === entry && value === './init')
                return 'virtual:delayed-init';
              if (
                importer === 'virtual:delayed-init' &&
                value === './fixture-model'
              )
                return 'virtual:logger-model';
              return null;
            },
            load(id) {
              if (id === 'virtual:delayed-bootstrap')
                return "await new Promise(resolve => setTimeout(resolve, 20)); globalThis.ready = true; globalThis.events.push('bootstrap');";
              if (id === 'virtual:delayed-init')
                return "import './fixture-model'; export default async function init() { globalThis.businessInit = true; }";
              if (id === 'virtual:logger-model')
                return "if (!globalThis.ready) throw Error('logger unavailable'); globalThis.events.push('model');";
              return null;
            },
          },
          typescript,
          ...(adapted ? [createOrderedEntryImports(entry)] : []),
          plugin,
        ],
      });
      try {
        const file = resolve(directory, 'out/entry-order-fixture.cjs');
        const { output } = await bundle.generate({
          file,
          format: 'es',
          inlineDynamicImports: true,
          sourcemap: true,
        });
        const chunk = output.find(
          (item) => item.type === 'chunk'
        ) as OutputChunk;
        const events: string[] = [];
        let error: Error | undefined;
        const process = {
          env: { NODE_ENV: 'test' },
          exitCode: undefined as number | undefined,
          on: () => undefined,
        };
        const context = vm.createContext({
          events,
          setTimeout,
          process,
          exports: {},
          module: { exports: {} },
          console: {
            log: () => undefined,
            error: (_prefix: string, value: Error) => (error = value),
          },
        });
        await vm.runInContext(chunk.code, context);
        if (!adapted) {
          assert.match(
            error?.message ?? '',
            /default.*undefined|undefined.*default/
          );
          assert.equal(process.exitCode, 1);
          assert.deepEqual(events, []);
          continue;
        }
        assert.equal(error, undefined);
        assert.equal(process.exitCode, undefined);
        assert.deepEqual(events, ['bootstrap', 'model']);
        assert.equal(context.businessInit, undefined);
        assert.ok(chunk.map);
        const sourceIndex = chunk.map.sources.findIndex(
          (source) => resolve(dirname(file), source) === entry
        );
        assert.notEqual(sourceIndex, -1);
        assert.ok(
          existsSync(resolve(dirname(file), chunk.map.sources[sourceIndex]))
        );
        const original = readFileSync(entry, 'utf8');
        assert.equal(chunk.map.sourcesContent[sourceIndex], original);
        const lines = chunk.code.split('\n');
        const line = lines.findIndex((value) => value.includes('process.on('));
        const position = originalPositionFor(
          new TraceMap(chunk.map.toString()),
          { line: line + 1, column: lines[line].indexOf('process.on') }
        );
        assert.equal(
          position.line,
          original
            .split('\n')
            .findIndex((value) => value.includes('process.on(')) + 1
        );
        assert.ok(position.source);
        assert.equal(resolve(dirname(file), position.source), entry);
      } finally {
        await bundle.close();
      }
    }
  });

  it('rejects unknown entry imports and public exports before adapting them', async () => {
    const header =
      "await import('./bootstrap');\nconst { default: init } = await import('./init');\n";
    for (const source of [
      header.replace('./bootstrap', './other'),
      header + "await import('./extra');",
      header + 'export const exposed = 1;',
    ]) {
      await assert.rejects(
        rollup({
          input: 'virtual:entry-guard',
          plugins: [
            {
              name: 'entry-guard-fixture',
              resolveId: (id) => id,
              load: () => source,
            },
            createOrderedEntryImports('virtual:entry-guard'),
          ],
        }),
        /Ordered entry imports require/
      );
    }
  });

  it('initializes logging before importing source entry consumers', function () {
    this.timeout(30000);
    const fixtureConfig = {
      network: 'ergo',
      ergo: {
        mnemonic: [...Array(11).fill('abandon'), 'about'].join(' '),
        secret: '',
        node: { url: 'http://127.0.0.1:1' },
        explorer: { url: 'http://127.0.0.1:1' },
      },
      path: {
        addresses: resolve(directory, 'tests/config/contracts.test.json'),
        tokens: resolve(directory, 'tests/config/tokens.test.json'),
      },
      database: { type: 'sqlite', path: ':memory:' },
      logs: [],
      blockCleanup: {
        isActiveForErgoChain: false,
        isActiveForNonErgoChains: false,
      },
    };
    const child = spawnSync(
      process.execPath,
      ['--import', 'tsx', resolve(directory, 'src/index.ts')],
      {
        cwd: directory,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          NODE_CONFIG_ENV: 'test',
          NODE_CONFIG_DIR: resolve(directory, 'config'),
          NODE_CONFIG_PARSER: '',
          NODE_APP_INSTANCE: '',
          NODE_OPTIONS: '',
          NODE_BACKEND: 'js',
          NODE_CONFIG: JSON.stringify(fixtureConfig),
        },
        encoding: 'utf8',
        timeout: 20000,
        maxBuffer: 4 * 1024 * 1024,
      }
    );
    const log = (child.stdout ?? '') + (child.stderr ?? '');
    assert.equal(child.error, undefined, log);
    assert.equal(child.signal, null, log);
    assert.equal(child.status, 0, log);
    assert.doesNotMatch(
      log,
      /DefaultLogger\.init|Failed to initialize|Unhandled Rejection/
    );
  });

  it('accepts the actual linked TypeORM dynamic loader source', async function () {
    this.timeout(30000);
    const orm = fileURLToPath(
      import.meta.resolve('@rosen-bridge/extended-typeorm')
    );
    const typeorm = createRequire(orm).resolve('typeorm');
    const tools = join(dirname(typeorm), 'platform/PlatformTools.js');
    const entry = 'virtual:linked-dynamic-loader';
    const runtimePlugins = (config.plugins as Plugin[]).filter((candidate) =>
      ['json', 'commonjs', 'node-externals', 'node-resolve'].includes(
        candidate.name
      )
    );
    const bundle = await rollup({
      input: entry,
      plugins: [
        {
          name: 'fixture',
          resolveId: (id) => (id === entry ? id : null),
          load: (id) =>
            id === entry
              ? `import {PlatformTools} from ${JSON.stringify(
                  tools
                )}; console.log(PlatformTools);`
              : null,
        },
        ...runtimePlugins,
        plugin,
      ],
    });
    try {
      const { output } = await bundle.generate({
        format: 'es',
        inlineDynamicImports: true,
        sourcemap: true,
        file: resolve(directory, 'out/linked-loader-fixture.cjs'),
      });
      assert.equal(output.filter((item) => item.type === 'chunk').length, 1);
    } finally {
      await bundle.close();
    }
  });

  it('loads the real YAML defaults through the bundled node-config parser', async function () {
    this.timeout(30000);
    const defaultPath = resolve(directory, 'config/default.yaml');
    const defaultSource = readFileSync(defaultPath, 'utf8');
    const defaultObject = require('js-yaml').load(defaultSource);
    const entry = 'virtual:real-config-yaml';
    for (const withParser of [false, true]) {
      const runtimePlugins = (config.plugins as Plugin[])
        .filter((candidate) =>
          ['json', 'commonjs', 'node-externals', 'node-resolve'].includes(
            candidate.name
          )
        )
        .map((candidate) =>
          candidate.name === 'commonjs' && !withParser
            ? commonjs({ strictRequires: true })
            : candidate
        );
      const bundle = await rollup({
        input: entry,
        external: ['fs', 'path', 'util', 'os'],
        plugins: [
          {
            name: 'fixture',
            resolveId: (id) => (id === entry ? id : null),
            load: (id) =>
              id === entry
                ? `import config from ${JSON.stringify(
                    require.resolve('config')
                  )}; globalThis.loadedConfig = config;`
                : null,
          },
          ...runtimePlugins,
          plugin,
        ],
      });
      try {
        const outputPath = resolve(directory, 'out/yaml-config-fixture.cjs');
        const { output } = await bundle.generate({
          format: 'es',
          inlineDynamicImports: true,
          sourcemap: true,
          file: outputPath,
        });
        const chunk = output.find(
          (item) => item.type === 'chunk'
        ) as OutputChunk;
        const messages: string[] = [];
        const externalParsers: string[] = [];
        const context = vm.createContext({
          require: (id: string) => {
            if (id === 'js-yaml' || id === 'yaml') {
              externalParsers.push(id);
              throw Error('YAML parser must be inside the bundle');
            }
            return require(id);
          },
          exports: {},
          module: { exports: {} },
          __filename: outputPath,
          __dirname: dirname(outputPath),
          Buffer,
          process: {
            env: {
              NODE_ENV: 'yaml-parser-fixture',
              NODE_CONFIG_DIR: resolve(directory, 'config'),
            },
            cwd: () => directory,
            argv: [],
            nextTick: process.nextTick,
          },
          console: {
            error: (...values: unknown[]) => messages.push(values.join(' ')),
            warn: (...values: unknown[]) => messages.push(values.join(' ')),
          },
        });
        await vm.runInContext(chunk.code, context, { filename: outputPath });
        const loaded = Reflect.get(context, 'loadedConfig') as {
          has: (key: string) => boolean;
          get: (key: string) => unknown;
          util: {
            getConfigSources: () => {
              name: string;
              original: string;
              parsed: unknown;
            }[];
          };
        };
        assert.deepEqual(externalParsers, []);
        if (!withParser) {
          assert.equal(loaded.has('ergo.network'), false);
          assert.ok(
            messages.some((message) =>
              message.includes('No YAML parser loaded')
            )
          );
          continue;
        }
        assert.ok(
          messages.every(
            (message) => !message.includes('No YAML parser loaded')
          )
        );
        const defaults = loaded.util
          .getConfigSources()
          .find((source) => resolve(source.name) === defaultPath);
        assert.ok(
          defaults,
          'Real default.yaml must be loaded as a config source'
        );
        assert.equal(defaults.original, defaultSource);
        assert.deepEqual(
          JSON.parse(JSON.stringify(defaults.parsed)),
          JSON.parse(JSON.stringify(defaultObject))
        );
        assert.equal(loaded.get('ergo.network'), 'Mainnet');
        assert.equal(loaded.get('ergo.fee'), '2000000');
        assert.equal(loaded.get('bitcoinCash.initial.height'), -1);
        assert.equal(loaded.get('observation.storeRawData'), true);
      } finally {
        await bundle.close();
      }
    }
  });

  it('rejects extra expressions in generated native require wrappers', () => {
    assert.throws(
      () =>
        wrapNativeRequire(
          'export default require("./libs/snappy.fixture.node", sideEffect());'
        ),
      /single generated require wrapper/
    );
    assert.throws(
      () =>
        wrapNativeRequire(
          'export default require("./libs/snappy.fixture.node"); sideEffect();'
        ),
      /single generated require wrapper/
    );
  });

  it('loads real platform addons lazily and retains SQLite native queries', async function () {
    this.timeout(30000);
    const runtimePlugins = (config.plugins as Plugin[]).filter((candidate) =>
      [
        'json',
        'rollup-plugin-natives',
        'commonjs',
        'node-externals',
        'node-resolve',
      ].includes(candidate.name)
    );
    assert.ok(
      runtimePlugins.some(
        (candidate) => candidate.name === 'rollup-plugin-natives'
      )
    );
    assert.ok(
      runtimePlugins.some((candidate) => candidate.name === 'commonjs')
    );
    const entry = 'virtual:lazy-native-platform';
    const orm = fileURLToPath(
      import.meta.resolve('@rosen-bridge/extended-typeorm')
    );
    const typeorm = createRequire(orm).resolve('typeorm');
    const sqlite = createRequire(typeorm).resolve('sqlite3');
    const outputPath = resolve(directory, 'out/lazy-native-fixture.cjs');
    const outputRequire = createRequire(outputPath);
    const bundle = await rollup({
      input: entry,
      external: ['fs', 'path', 'util', 'events'],
      plugins: [
        {
          name: 'fixture',
          resolveId: (id) => (id === entry ? id : null),
          load: (id) =>
            id === entry
              ? `import snappy from ${JSON.stringify(
                  require.resolve('snappy')
                )}; import sqlite3 from ${JSON.stringify(
                  sqlite
                )}; globalThis.nativeModules = {snappy, sqlite3};`
              : null,
        },
        ...runtimePlugins,
        plugin,
      ],
    });
    try {
      const { output } = await bundle.generate({
        format: 'es',
        inlineDynamicImports: true,
        sourcemap: true,
        file: outputPath,
      });
      const chunk = output.find((item) => item.type === 'chunk') as OutputChunk;
      for (const platform of [process.platform, 'unsupported-fixture']) {
        let error: Error | undefined;
        const nativeRequires: string[] = [];
        const fakeProcess = {
          platform,
          arch: process.arch,
          report: process.report,
          versions: process.versions,
          env: {},
          nextTick: process.nextTick,
          exitCode: undefined as number | undefined,
        };
        const context = vm.createContext({
          require: (id: string) => {
            if (id.endsWith('.node')) nativeRequires.push(id);
            return outputRequire(id);
          },
          exports: {},
          module: { exports: {} },
          __filename: outputPath,
          __dirname: dirname(outputPath),
          Buffer,
          console: {
            error: (_prefix: string, value: Error) => (error = value),
          },
          process: fakeProcess,
          setTimeout,
          clearTimeout,
          setImmediate,
          clearImmediate,
        });
        await vm.runInContext(chunk.code, context, { filename: outputPath });
        if (platform === 'unsupported-fixture') {
          assert.match(
            error?.message ?? '',
            /Unsupported OS: unsupported-fixture/
          );
          assert.equal(fakeProcess.exitCode, 1);
          assert.deepEqual(nativeRequires, []);
          continue;
        }
        assert.equal(error, undefined);
        assert.equal(fakeProcess.exitCode, undefined);
        assert.ok(
          nativeRequires.some((id) =>
            id.includes(`snappy.${process.platform}-${process.arch}`)
          )
        );
        assert.ok(
          nativeRequires.some((id) => id.includes('node_sqlite3.node'))
        );
        assert.ok(nativeRequires.every((id) => !id.includes('android')));
        const modules = Reflect.get(context, 'nativeModules') as {
          snappy: {
            compressSync: (value: Buffer) => Buffer;
            uncompressSync: (value: Buffer) => Buffer;
          };
          sqlite3: typeof import('sqlite3');
        };
        const data = Buffer.from('real native platform roundtrip');
        assert.deepEqual(
          modules.snappy.uncompressSync(modules.snappy.compressSync(data)),
          data
        );
        const db = new modules.sqlite3.Database(':memory:');
        try {
          const row = await new Promise<{ value: number }>(
            (resolve, reject) => {
              db.get<{ value: number }>('SELECT 42 AS value', (error, row) =>
                error ? reject(error) : resolve(row)
              );
            }
          );
          assert.deepEqual(row, { value: 42 });
        } finally {
          await new Promise<void>((resolve, reject) =>
            db.close((error) => (error ? reject(error) : resolve()))
          );
        }
      }
    } finally {
      await bundle.close();
    }
  });

  it('binds actual TypeScript maps to existing source files and exact content', async function () {
    this.timeout(30000);
    const sourcePath = resolve(directory, 'src/config/constants.ts');
    const source = readFileSync(sourcePath, 'utf8');
    const outputPath = resolve(directory, 'out/source-map-fixture.cjs');
    const typescript = (config.plugins as Plugin[]).find(
      (candidate) => candidate.name === 'typescript'
    );
    assert.ok(typescript);
    const entry = 'virtual:real-typescript-map';
    const bundle = await rollup({
      input: entry,
      plugins: [
        {
          name: 'fixture',
          resolveId: (id) => (id === entry ? id : null),
          load: (id) =>
            id === entry
              ? `import { BITCOIN_CASH_CHAIN_NAME } from ${JSON.stringify(
                  sourcePath
                )}; console.log(BITCOIN_CASH_CHAIN_NAME);`
              : null,
        },
        typescript,
        plugin,
      ],
    });
    try {
      const { output } = await bundle.generate({
        format: 'es',
        inlineDynamicImports: true,
        sourcemap: true,
        file: outputPath,
      });
      const chunk = output.find((item) => item.type === 'chunk') as OutputChunk;
      assert.ok(chunk.map);
      const index = chunk.map.sources.findIndex(
        (path) => resolve(dirname(outputPath), path) === sourcePath
      );
      assert.ok(index >= 0, 'Map source must resolve to the actual TS input');
      assert.ok(
        existsSync(resolve(dirname(outputPath), chunk.map.sources[index]))
      );
      assert.equal(chunk.map.sourcesContent[index], source);
      const lines = chunk.code.split('\n');
      const emittedLine = lines.findIndex((line) =>
        line.includes("'bitcoin-cash'")
      );
      assert.ok(emittedLine >= 0);
      const position = originalPositionFor(new TraceMap(chunk.map.toString()), {
        line: emittedLine + 1,
        column: lines[emittedLine].indexOf('BITCOIN_CASH_CHAIN_NAME'),
      });
      assert.ok(position.source);
      assert.equal(resolve(dirname(outputPath), position.source), sourcePath);
      assert.equal(
        position.line,
        source
          .split('\n')
          .findIndex((line) =>
            line.includes('export const BITCOIN_CASH_CHAIN_NAME')
          ) + 1
      );
    } finally {
      await bundle.close();
    }
  });

  it('retains static requires and awaits initialization', async () => {
    await fixture(
      'static-require',
      "import assert from 'node:assert/strict';\nconst value = await Promise.resolve(42);\nassert.equal(value, 42); console.log('PASS');"
    );
  });

  it('reports async failure with its original source position', async () => {
    await fixture(
      'mapped-failure',
      "const value = await Promise.resolve(42);\nif (value !== 42) throw new Error('unexpected');\nthrow new Error('fixture failure');",
      true
    );
  });

  it('preserves the CommonJS module URL', async () => {
    await fixture(
      'module-url',
      "await Promise.resolve();\nif (!import.meta.url.endsWith('/module-url.cjs')) throw new Error('wrong module URL');\nconsole.log('PASS');"
    );
  });

  it('initializes the actual deposit extractor crypto dependency', async function () {
    this.timeout(10000);
    const extractor = require.resolve('@rosen-bridge/rosen-extractor');
    const libauth = createRequire(extractor).resolve('@bitauth/libauth');
    await fixture(
      'native-crypto',
      `import assert from 'node:assert/strict';\nimport {sha256, binToHex} from ${JSON.stringify(
        libauth
      )};\nassert.equal(binToHex(sha256.hash(new Uint8Array())), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'); console.log('PASS');`
    );
  });

  for (const [name, source, inlineDynamicImports] of [
    ['export-guard', 'export const value = await Promise.resolve(1);', true],
    ['chunk-guard', 'await Promise.resolve(1);', false],
  ] as const) {
    it(`rejects incompatible output: ${name}`, async () => {
      const bundle = await rollup({
        input: 'virtual:guard',
        plugins: [
          {
            name: 'fixture',
            resolveId: (id) => (id === 'virtual:guard' ? id : null),
            load: (id) => (id === 'virtual:guard' ? source : null),
          },
          plugin,
        ],
      });
      try {
        await assert.rejects(
          bundle.generate({ format: 'es', inlineDynamicImports }),
          /requires one entry without exports/
        );
      } finally {
        await bundle.close();
      }
    });
  }
});
