import { Plugin, RollupOptions } from 'rollup';
import { readFileSync } from 'node:fs';
import { basename, isAbsolute, resolve } from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import virtual from '@rollup/plugin-virtual';
import nodeWasm from '@rosen-bridge/rollup-plugin-node-wasm';
import nativePlugin from 'rollup-plugin-natives';
import externals from 'rollup-plugin-node-externals';
import ts from 'typescript';
import MagicString from 'magic-string';

export const createOrderedEntryImports = (entryId: string): Plugin => ({
  name: 'ordered-entry-imports',
  transform(code, id) {
    if (id.replace(/\\/g, '/') !== entryId.replace(/\\/g, '/')) return null;
    const header =
      /^(await import\(['"]\.\/bootstrap['"]\);)\r?\n(const \{ default: init \} = await import\(['"]\.\/init['"]\);)/.exec(
        code
      );
    const source = ts.createSourceFile(
      id,
      code,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.JS
    );
    let imports = 0;
    let unsupported = false;
    const visit = (node: ts.Node) => {
      if (node.kind === ts.SyntaxKind.ImportKeyword) imports++;
      if (
        ts.isImportDeclaration(node) ||
        ts.isExportAssignment(node) ||
        (ts.isExportDeclaration(node) &&
          (!node.exportClause ||
            !ts.isNamedExports(node.exportClause) ||
            node.exportClause.elements.length !== 0)) ||
        node.kind === ts.SyntaxKind.ExportKeyword
      )
        unsupported = true;
      ts.forEachChild(node, visit);
    };
    visit(source);
    if (
      !this.getModuleInfo(id)?.isEntry ||
      !header ||
      imports !== 2 ||
      unsupported
    ) {
      this.error(
        'Ordered entry imports require the known bootstrap/init entry without exports'
      );
    }
    // Static dependency order survives single-chunk flattening inside the async wrapper.
    const rewritten = new MagicString(code);
    rewritten.overwrite(0, header[1].length, "import './bootstrap';");
    const second = header[0].length - header[2].length;
    rewritten.overwrite(second, header[0].length, "import init from './init';");
    return {
      code: rewritten.toString(),
      map: rewritten.generateMap({
        hires: true,
        includeContent: true,
        source: id,
      }),
    };
  },
});

const projectTypescript = typescript({
  sourceMap: true,
  inlineSources: true,
  exclude: [/await-semaphore/],
});
const loadTypescript = projectTypescript.load;
if (typeof loadTypescript !== 'function') {
  throw Error('TypeScript source-map binding requires a callable load hook');
}
projectTypescript.load = async function (id) {
  const result = await loadTypescript.call(this, id);
  if (!result || typeof result === 'string' || !result.map) return result;
  const map =
    typeof result.map === 'string' ? JSON.parse(result.map) : result.map;
  if (
    !isAbsolute(id) ||
    id.includes('\0') ||
    !Array.isArray(map.sources) ||
    map.sources.length !== 1 ||
    basename(map.sources[0].replace(/\\/g, '/')) !== basename(id)
  ) {
    this.error('TypeScript source map must identify its single loaded source');
  }
  const source = readFileSync(id, 'utf8');
  if (map.sourcesContent?.[0] !== source) {
    this.error(
      'TypeScript source map must contain the exact loaded source bytes'
    );
  }
  // TypeScript paths are relative to emitted files, while Rollup loads source IDs.
  map.sourceRoot = '';
  map.sources = [id];
  map.sourcesContent = [source];
  return { ...result, map };
};

const projectNatives = nativePlugin({
  copyTo: './out/libs',
  destDir: './libs',
});
const resolveNative = projectNatives.resolveId;
const loadNative = projectNatives.load;
const transformNative = projectNatives.transform;
if (
  typeof resolveNative !== 'function' ||
  typeof loadNative !== 'function' ||
  typeof transformNative !== 'function'
) {
  throw Error('Lazy native bindings require callable native plugin hooks');
}
const nativePrefix = '\0natives:';
const isPlatformAddon = (id: string) =>
  id.startsWith(nativePrefix) && /\/snappy\.[^/]+\.node$/.test(id);
const isNativeWrapper = (id: string) =>
  id.startsWith(nativePrefix) && id.endsWith('.cjs');
export const wrapNativeRequire = (source: string): string => {
  const match = /^export default require\(("(?:[^"\\\r\n]|\\.)*")\);\s*$/.exec(
    source
  );
  if (!match) {
    throw Error(
      'Lazy native binding requires a single generated require wrapper'
    );
  }
  return `module.exports = require(${match[1]});\n`;
};
projectNatives.resolveId = async function (source, importer, options) {
  const result = await resolveNative.call(this, source, importer, options);
  return typeof result === 'string' &&
    isPlatformAddon(result) &&
    !isNativeWrapper(result)
    ? result + '.cjs'
    : result;
};
projectNatives.load = async function (id) {
  if (!isNativeWrapper(id)) return loadNative.call(this, id);
  const source = await loadNative.call(this, id.slice(0, -4));
  if (typeof source !== 'string') {
    this.error(
      'Lazy native binding requires a single generated require wrapper'
    );
  }
  // Let CommonJS preserve the original platform branch and its try/catch.
  return wrapNativeRequire(source);
};
projectNatives.transform = function (code, id) {
  return isNativeWrapper(id) ? null : transformNative.call(this, code, id);
};

const config: RollupOptions = {
  input: './src/index.ts',
  output: [
    {
      file: './out/index.cjs',
      format: 'es',
      inlineDynamicImports: true,
      sourcemap: true,
    },
  ],
  plugins: [
    /**
     * This plugin is needed to resolve wasm-pack based modules correctly.
     */
    nodeWasm(),
    json(),
    /**
     * We need to exclude `await-semaphore` because it publishes ts files. The
     * ts files causes `resolveId` of this plugin to resolve `await-semaphore`
     * imports to the ts files (instead of js ones), which is unexpected.
     */
    projectTypescript,
    createOrderedEntryImports(resolve('src/index.ts')),
    /**
     * This plugin is needed because the `sqlite3` package includes node native
     * addons
     */
    projectNatives,
    commonjs({
      strictRequires: true,
      // node-config lazy-loads this parser by package name, not by index path.
      dynamicRequireTargets: ['node_modules/js-yaml'],
      // Adjacent linked packages also contain dynamic require callers.
      dynamicRequireRoot: '..',
      // Copied addons are loaded at runtime by their lazy CommonJS wrappers.
      ignore: (id) => /^\.\/libs\/.*\.(node|dll)$/.test(id),
    }),
    /**
     * This plugin is used to externalize all node native modules
     */
    externals({
      deps: false,
      devDeps: false,
      peerDeps: false,
      optDeps: false,
    }),
    /**
     * The extra export conditions is needed so that we can resolve `typeorm`
     * correctly. The current `exports` field in `package.json` of the package
     * is not compatible with the defaults of `nodeResolve` plugin.
     */
    nodeResolve({ exportConditions: ['node'], preferBuiltins: false }),
    /**
     * Most of the following packages are optional peer dependencies which is
     * not installed by npm, but included in the bundle, which causes errors. We
     * need to virtually resolve them so the errors disappear.
     */
    virtual({
      'pg-native': '',
      nock: '',
      'mock-aws-s3': '',
      'aws-sdk': '',
    }),
    {
      name: 'async-commonjs-bootstrap',
      resolveImportMeta(property) {
        if (property === 'url') {
          return 'require("url").pathToFileURL(__filename).href';
        }
        this.error('Async CommonJS bootstrap supports only import.meta.url');
      },
      renderChunk(code, chunk, outputOptions) {
        if (
          !outputOptions.inlineDynamicImports ||
          !chunk.isEntry ||
          chunk.exports.length !== 0
        ) {
          this.error(
            'Async CommonJS bootstrap requires one entry without exports'
          );
        }

        const result = ts.transpileModule(code, {
          fileName: chunk.fileName,
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
            sourceMap: true,
            inlineSources: true,
          },
        });
        if (!result.sourceMapText) {
          this.error('Async CommonJS bootstrap requires a source map');
        }
        const map = JSON.parse(result.sourceMapText);
        // Account for the wrapper before Rollup composes the transform map.
        map.mappings = ';' + map.mappings;
        const commonjs = result.outputText.replace(
          /\/\/# sourceMappingURL=.*(?:\r?\n)?$/,
          ''
        );

        return {
          code:
            '(async () => {\n' +
            commonjs +
            '\n})().catch((error) => {\n' +
            '  console.error("Failed to initialize:", error);\n' +
            '  process.exitCode = 1;\n' +
            '});\n',
          map,
        };
      },
    },
  ],
};

export default config;
