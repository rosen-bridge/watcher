import { describe, expect, it } from 'vitest';
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
} from '../rollup.config';

const require = createRequire(import.meta.url);
const directory = fileURLToPath(new URL('../', import.meta.url));
const bootstrap = (config.plugins as Plugin[]).find(
  (plugin) => plugin.name === 'async-commonjs-bootstrap'
);
if (!bootstrap) throw Error('Missing async bootstrap plugin');
const plugin = bootstrap;
import {
  asyncBootstrapFixture as fixture,
  expectPresent,
  resolveEsmModule,
} from './rollupTestUtils';

describe('createOrderedEntryImports', () => {
  describe('transform', () => {
    /**
     * @target transform - orders delayed bootstrap before model evaluation in
     * the compiled real entry
     * @dependencies Actual TypeScript entry, virtual delayed bootstrap/model and
     * VM process fixture
     * @scenario Generate both unadapted and ordered outputs, then evaluate each
     * once
     * @expected Reject unadapted ordering and initialize bootstrap before model
     * with ordered imports
     */
    it('orders delayed bootstrap before model evaluation in the compiled real entry', async function () {
      const entry = resolve(directory, 'src/index.ts');
      const typescript = (config.plugins as Plugin[]).find(
        (candidate) => candidate.name === 'typescript'
      );
      expect(typescript).toBeTruthy();
      for (const adapted of [false, true]) {
        const bundle = await rollup({
          input: entry,
          plugins: [
            {
              name: 'entry-dependency-fixture',
              /** Resolve only the virtual fixture inputs for this scenario. */
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
              /** Return the selected virtual source for this fixture module. */
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
            /** Ignore test-only process-hook registration in the isolated VM. */
            on: () => undefined,
          };
          const context = vm.createContext({
            events,
            setTimeout,
            process,
            exports: {},
            module: { exports: {} },
            console: {
              /** Capture fixture output for the outer assertions. */
              log: () => undefined,
              /** Capture fixture failure for the outer assertions. */
              error: (_prefix: string, value: Error) => (error = value),
            },
          });
          await vm.runInContext(chunk.code, context);
          if (!adapted) {
            expect(error?.message ?? '').toMatch(
              /default.*undefined|undefined.*default/
            );
            expect(process.exitCode).toEqual(1);
            expect(events).toEqual([]);
            continue;
          }
          expect(error).toEqual(undefined);
          expect(process.exitCode).toEqual(undefined);
          expect(events).toEqual(['bootstrap', 'model']);
          expect(context.businessInit).toEqual(undefined);
          expectPresent(chunk.map);
          const sourceIndex = chunk.map.sources.findIndex(
            (source) => resolve(dirname(file), source) === entry
          );
          expect(sourceIndex).not.toEqual(-1);
          expect(
            existsSync(resolve(dirname(file), chunk.map.sources[sourceIndex]))
          ).toBeTruthy();
          const original = readFileSync(entry, 'utf8');
          expect(chunk.map.sourcesContent[sourceIndex]).toEqual(original);
          const lines = chunk.code.split('\n');
          const line = lines.findIndex((value) =>
            value.includes('process.on(')
          );
          const position = originalPositionFor(
            new TraceMap(chunk.map.toString()),
            { line: line + 1, column: lines[line].indexOf('process.on') }
          );
          expect(position.line).toEqual(
            original
              .split('\n')
              .findIndex((value) => value.includes('process.on(')) + 1
          );
          expectPresent(position.source);
          expect(resolve(dirname(file), position.source)).toEqual(entry);
        } finally {
          await bundle.close();
        }
      }
    });

    /**
     * @target transform - rejects unknown entry imports and public exports
     * before adapting them
     * @dependencies Virtual entry source and Rollup with only the ordered-entry
     * adapter
     * @scenario Fault one import or export shape per isolated source
     * @expected Reject each unsupported shape before adapting output
     */
    it('rejects unknown entry imports and public exports before adapting them', async () => {
      const header =
        "await import('./bootstrap');\nconst { default: init } = await import('./init');\n";
      for (const source of [
        header.replace('./bootstrap', './other'),
        header + "await import('./extra');",
        header + 'export const exposed = 1;',
      ]) {
        await expect(
          rollup({
            input: 'virtual:entry-guard',
            plugins: [
              {
                name: 'entry-guard-fixture',
                /** Resolve only the virtual fixture inputs for this scenario. */
                resolveId: (id) => id,
                /** Return the selected virtual source for this fixture module. */
                load: () => source,
              },
              createOrderedEntryImports('virtual:entry-guard'),
            ],
          })
        ).rejects.toThrow(/Ordered entry imports require/);
      }
    });
  });
});
describe('rollup.config', () => {
  describe('async-commonjs-bootstrap.renderChunk', () => {
    /**
     * @target async-commonjs-bootstrap.renderChunk - accepts the actual linked
     * TypeORM dynamic loader source
     * @dependencies Real linked TypeORM loader and declared runtime Rollup
     * plugins
     * @scenario Generate one output chunk using the actual dynamic-loader source
     * @expected Accept the linked loader without generating extra chunks
     */
    it('accepts the actual linked TypeORM dynamic loader source', async function () {
      const orm = resolveEsmModule('@rosen-bridge/extended-typeorm');
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
            /** Resolve only the virtual fixture inputs for this scenario. */
            resolveId: (id) => (id === entry ? id : null),
            /** Return the selected virtual source for this fixture module. */
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
        expect(output.filter((item) => item.type === 'chunk').length).toEqual(
          1
        );
      } finally {
        await bundle.close();
      }
    });

    /**
     * @target async-commonjs-bootstrap.renderChunk - retains static requires and
     * awaits initialization
     * @dependencies Virtual source with static Node assert and an awaited value
     * @scenario Generate and evaluate the asynchronous CommonJS wrapper
     * @expected Preserve the static require and awaited result
     */
    it('retains static requires and awaits initialization', async () => {
      await fixture(
        'static-require',
        "import assert from 'node:assert/strict';\nconst value = await Promise.resolve(42);\nassert.equal(value, 42); console.log('PASS');"
      );
    });

    /**
     * @target async-commonjs-bootstrap.renderChunk - reports async failure with
     * its original source position
     * @dependencies Virtual source throwing after an awaited value and TraceMap
     * @scenario Generate and evaluate the failing wrapper, then inspect its
     * source position
     * @expected Record the failure, nonzero exit flag and exact original line
     */
    it('reports async failure with its original source position', async () => {
      await fixture(
        'mapped-failure',
        "const value = await Promise.resolve(42);\nif (value !== 42) throw new Error('unexpected');\nthrow new Error('fixture failure');",
        true
      );
    });

    /**
     * @target async-commonjs-bootstrap.renderChunk - initializes the actual
     * deposit extractor crypto dependency
     * @dependencies Actual extractor libauth dependency and a public empty
     * SHA256 vector
     * @scenario Generate and evaluate the asynchronous crypto dependency join
     * @expected Initialize the actual dependency and preserve the expected
     * digest
     */
    it('initializes the actual deposit extractor crypto dependency', async function () {
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
      /**
       * @target async-commonjs-bootstrap.renderChunk - rejects incompatible
       * output: ${name}
       * @dependencies One incompatible public export or multi-chunk output option
       * @scenario Generate each unsupported output with the actual wrapper plugin
       * @expected Reject incompatible output before evaluating it
       */
      it(`rejects incompatible output: ${name}`, async () => {
        const bundle = await rollup({
          input: 'virtual:guard',
          plugins: [
            {
              name: 'fixture',
              /** Resolve only the virtual fixture inputs for this scenario. */
              resolveId: (id) => (id === 'virtual:guard' ? id : null),
              /** Return the selected virtual source for this fixture module. */
              load: (id) => (id === 'virtual:guard' ? source : null),
            },
            plugin,
          ],
        });
        try {
          await expect(
            bundle.generate({ format: 'es', inlineDynamicImports })
          ).rejects.toThrow(/requires one entry without exports/);
        } finally {
          await bundle.close();
        }
      });
    }
  });

  describe('commonjs.dynamicRequireTargets', () => {
    /**
     * @target commonjs.dynamicRequireTargets - loads the real YAML defaults
     * through the bundled node-config parser
     * @dependencies Real node-config/YAML sources and isolated VM
     * filesystem/environment
     * @scenario Compare generated parser behavior with and without the
     * configured dynamic target
     * @expected Require the parser target and preserve actual YAML defaults
     */
    it('loads the real YAML defaults through the bundled node-config parser', async function () {
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
              /** Resolve only the virtual fixture inputs for this scenario. */
              resolveId: (id) => (id === entry ? id : null),
              /** Return the selected virtual source for this fixture module. */
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
            /** Provide the require fixture behavior without external services. */
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
              /** Provide the cwd fixture behavior without external services. */
              cwd: () => directory,
              argv: [],
              nextTick: process.nextTick,
            },
            console: {
              /** Capture fixture failure for the outer assertions. */
              error: (...values: unknown[]) => messages.push(values.join(' ')),
              /** Provide the warn fixture behavior without external services. */
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
          expect(externalParsers).toEqual([]);
          if (!withParser) {
            expect(loaded.has('ergo.network')).toEqual(false);
            expect(
              messages.some((message) =>
                message.includes('No YAML parser loaded')
              )
            ).toBeTruthy();
            continue;
          }
          expect(
            messages.every(
              (message) => !message.includes('No YAML parser loaded')
            )
          ).toBeTruthy();
          const defaults = loaded.util
            .getConfigSources()
            .find((source) => resolve(source.name) === defaultPath);
          expectPresent(
            defaults,
            'Real default.yaml must be loaded as a config source'
          );
          expect(defaults.original).toEqual(defaultSource);
          expect(JSON.parse(JSON.stringify(defaults.parsed))).toEqual(
            JSON.parse(JSON.stringify(defaultObject))
          );
          expect(loaded.get('ergo.network')).toEqual('Mainnet');
          expect(loaded.get('ergo.fee')).toEqual('2000000');
          expect(loaded.get('bitcoinCash.initial.height')).toEqual(-1);
          expect(loaded.get('observation.storeRawData')).toEqual(true);
        } finally {
          await bundle.close();
        }
      }
    });
  });

  describe('projectNatives.resolveId/load/transform', () => {
    /**
     * @target projectNatives.resolveId/load/transform - loads real platform
     * addons lazily and retains SQLite native queries
     * @dependencies Real platform addons, Rollup plugins and isolated in-memory
     * SQLite
     * @scenario Generate output and evaluate native addon branches under fixture
     * platform hooks
     * @expected Load the selected addon lazily and retain the SQLite read-only
     * query result
     */
    it('loads real platform addons lazily and retains SQLite native queries', async function () {
      const runtimePlugins = (config.plugins as Plugin[]).filter((candidate) =>
        [
          'json',
          'rollup-plugin-natives',
          'commonjs',
          'node-externals',
          'node-resolve',
        ].includes(candidate.name)
      );
      expect(
        runtimePlugins.some(
          (candidate) => candidate.name === 'rollup-plugin-natives'
        )
      ).toBeTruthy();
      expect(
        runtimePlugins.some((candidate) => candidate.name === 'commonjs')
      ).toBeTruthy();
      const entry = 'virtual:lazy-native-platform';
      const orm = resolveEsmModule('@rosen-bridge/extended-typeorm');
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
            /** Resolve only the virtual fixture inputs for this scenario. */
            resolveId: (id) => (id === entry ? id : null),
            /** Return the selected virtual source for this fixture module. */
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
        const chunk = output.find(
          (item) => item.type === 'chunk'
        ) as OutputChunk;
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
            /** Provide the require fixture behavior without external services. */
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
              /** Capture fixture failure for the outer assertions. */
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
            expect(error?.message ?? '').toMatch(
              /Unsupported OS: unsupported-fixture/
            );
            expect(fakeProcess.exitCode).toEqual(1);
            expect(nativeRequires).toEqual([]);
            continue;
          }
          expect(error).toEqual(undefined);
          expect(fakeProcess.exitCode).toEqual(undefined);
          expect(
            nativeRequires.some((id) =>
              id.includes(`snappy.${process.platform}-${process.arch}`)
            )
          ).toBeTruthy();
          expect(
            nativeRequires.some((id) => id.includes('node_sqlite3.node'))
          ).toBeTruthy();
          expect(
            nativeRequires.every((id) => !id.includes('android'))
          ).toBeTruthy();
          const modules = Reflect.get(context, 'nativeModules') as {
            snappy: {
              compressSync: (value: Buffer) => Buffer;
              uncompressSync: (value: Buffer) => Buffer;
            };
            sqlite3: typeof import('sqlite3');
          };
          const data = Buffer.from('real native platform roundtrip');
          expect(
            modules.snappy.uncompressSync(modules.snappy.compressSync(data))
          ).toEqual(data);
          const db = new modules.sqlite3.Database(':memory:');
          try {
            const row = await new Promise<{
              value: number;
            }>((resolve, reject) => {
              db.get<{
                value: number;
              }>('SELECT 42 AS value', (error, row) =>
                error ? reject(error) : resolve(row)
              );
            });
            expect(row).toEqual({ value: 42 });
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
  });

  describe('projectTypescript.load', () => {
    /**
     * @target projectTypescript.load - binds actual TypeScript maps to existing
     * source files and exact content
     * @dependencies Real TypeScript constants as input, Rollup source maps and
     * TraceMap
     * @scenario Generate the chunk then resolve its source path, content and
     * original position
     * @expected Bind the map to the exact existing TypeScript input
     */
    it('binds actual TypeScript maps to existing source files and exact content', async function () {
      const sourcePath = resolve(directory, 'src/config/constants.ts');
      const source = readFileSync(sourcePath, 'utf8');
      const outputPath = resolve(directory, 'out/source-map-fixture.cjs');
      const typescript = (config.plugins as Plugin[]).find(
        (candidate) => candidate.name === 'typescript'
      );
      expect(typescript).toBeTruthy();
      const entry = 'virtual:real-typescript-map';
      const bundle = await rollup({
        input: entry,
        plugins: [
          {
            name: 'fixture',
            /** Resolve only the virtual fixture inputs for this scenario. */
            resolveId: (id) => (id === entry ? id : null),
            /** Return the selected virtual source for this fixture module. */
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
        const chunk = output.find(
          (item) => item.type === 'chunk'
        ) as OutputChunk;
        expectPresent(chunk.map);
        const index = chunk.map.sources.findIndex(
          (path) => resolve(dirname(outputPath), path) === sourcePath
        );
        expect(
          index >= 0,
          'Map source must resolve to the actual TS input'
        ).toBeTruthy();
        expect(
          existsSync(resolve(dirname(outputPath), chunk.map.sources[index]))
        ).toBeTruthy();
        expect(chunk.map.sourcesContent[index]).toEqual(source);
        const lines = chunk.code.split('\n');
        const emittedLine = lines.findIndex((line) =>
          line.includes("'bitcoin-cash'")
        );
        expect(emittedLine >= 0).toBeTruthy();
        const position = originalPositionFor(
          new TraceMap(chunk.map.toString()),
          {
            line: emittedLine + 1,
            column: lines[emittedLine].indexOf('BITCOIN_CASH_CHAIN_NAME'),
          }
        );
        expectPresent(position.source);
        expect(resolve(dirname(outputPath), position.source)).toEqual(
          sourcePath
        );
        expect(position.line).toEqual(
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
  });

  describe('async-commonjs-bootstrap.resolveImportMeta', () => {
    /**
     * @target async-commonjs-bootstrap.resolveImportMeta - preserves the
     * CommonJS module URL
     * @dependencies Virtual source that checks its CommonJS module URL
     * @scenario Generate and evaluate the wrapper with a synthetic CommonJS
     * filename
     * @expected Preserve the URL of the generated module
     */
    it('preserves the CommonJS module URL', async () => {
      await fixture(
        'module-url',
        "await Promise.resolve();\nif (!import.meta.url.endsWith('/module-url.cjs')) throw new Error('wrong module URL');\nconsole.log('PASS');"
      );
    });
  });
});

describe('wrapNativeRequire', () => {
  /**
   * @target wrapNativeRequire - rejects extra expressions in generated native
   * require wrappers
   * @dependencies Two isolated malformed generated native wrappers
   * @scenario Append an extra require argument or trailing expression
   * @expected Reject both wrappers rather than evaluating extra expressions
   */
  it('rejects extra expressions in generated native require wrappers', () => {
    expect(() =>
      wrapNativeRequire(
        'export default require("./libs/snappy.fixture.node", sideEffect());'
      )
    ).toThrow(/single generated require wrapper/);
    expect(() =>
      wrapNativeRequire(
        'export default require("./libs/snappy.fixture.node"); sideEffect();'
      )
    ).toThrow(/single generated require wrapper/);
  });
});
