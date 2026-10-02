import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import { OutputChunk, Plugin, rollup } from 'rollup';
import { expect } from 'vitest';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import config from '../rollup.config';

const require = createRequire(import.meta.url);
const directory = fileURLToPath(new URL('../', import.meta.url));
const bootstrap = (config.plugins as Plugin[]).find(
  (plugin) => plugin.name === 'async-commonjs-bootstrap'
);
if (!bootstrap) throw Error('Missing async bootstrap plugin');
const plugin = bootstrap;

/**
 * Generate and evaluate one isolated async CommonJS fixture using the real plugin.
 * @param name - Virtual module name used by the source-map assertions
 * @param source - Synthetic module source for this scenario
 * @param expectedFailure - Whether the wrapper should report a fixture failure
 */
export const asyncBootstrapFixture = async (
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
        /** Resolve only the virtual fixture inputs for this scenario. */
        resolveId: (value) => (value === id ? id : null),
        /** Return the selected virtual source for this fixture module. */
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
    expect(output.filter((item) => item.type === 'chunk').length).toEqual(1);
    const chunk = output.find((item) => item.type === 'chunk') as OutputChunk;
    expectPresent(chunk.map);
    expect(
      chunk.map.sources.some((source) => source.endsWith(id))
    ).toBeTruthy();
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
          /** Capture fixture output for the outer assertions. */
          log: (value: unknown) => (message = value),
          /** Capture fixture failure for the outer assertions. */
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
      expect(error?.message).toEqual('fixture failure');
      expect(process.exitCode).toEqual(1);
      const lines = chunk.code.split('\n');
      const index = lines.findIndex((line) => line.includes('fixture failure'));
      const position = originalPositionFor(new TraceMap(chunk.map.toString()), {
        line: index + 1,
        column: lines[index].indexOf('throw'),
      });
      expect(position.line).toEqual(3);
      expect(position.source?.endsWith(id)).toBeTruthy();
    } else {
      expect(error).toEqual(undefined);
      expect(process.exitCode).toEqual(undefined);
      expect(message).toEqual('PASS');
    }
  } finally {
    await bundle.close();
  }
};

/** Assert a required fixture value while retaining TypeScript narrowing.
 * @param value - Value that the scenario requires to exist
 * @param message - Optional failure context
 */
export const expectPresent: <T>(
  value: T,
  message?: string
) => asserts value is NonNullable<T> = (value, message) => {
  expect(value, message).toBeTruthy();
};
/** Resolve a dependency using a fresh native ESM resolver.
 * @param specifier - Published dependency name resolved from this project
 * @returns Absolute path selected by the package import condition
 */
export const resolveEsmModule = (specifier: string): string => {
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      'process.stdout.write(import.meta.resolve(process.argv[1]))',
      specifier,
    ],
    { cwd: directory, encoding: 'utf8', timeout: 10000, maxBuffer: 65536 }
  );
  expect(child.error, child.stderr).toEqual(undefined);
  expect(child.status, child.stderr).toEqual(0);
  return fileURLToPath(child.stdout);
};
