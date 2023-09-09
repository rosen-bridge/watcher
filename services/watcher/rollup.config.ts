import { RollupOptions } from 'rollup';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import virtual from '@rollup/plugin-virtual';
import nodeWasm from '@rosen-bridge/rollup-plugin-node-wasm';
import nativePlugin from 'rollup-plugin-natives';
import externals from 'rollup-plugin-node-externals';

const config: RollupOptions = {
  input: './src/index.ts',
  output: [
    {
      file: './out/index.cjs',
      format: 'cjs',
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
    typescript({ sourceMap: true, exclude: [/await-semaphore/] }),
    /**
     * This plugin is needed because the `sqlite3` package includes node native
     * addons
     */
    nativePlugin({
      copyTo: './out/libs',
      destDir: './libs',
    }),
    commonjs(),
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
  ],
};

export default config;
