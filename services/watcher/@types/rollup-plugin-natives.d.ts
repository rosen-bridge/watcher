/**
 * TODO:
 * This file is needed only because the types package for this module
 * doesn't exist at the time of this commit. When the types package is
 * published, it's safe to remove this file in favor of the types package.
 *
 * GitHub PR requesting for the addition of types package:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/pull/65557
 *
 * GitLab issue:
 * https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/96
 */
declare module 'rollup-plugin-natives' {
  import { Plugin } from 'rollup';

  interface RollupPluginNativesOptions {
    copyTo?: string;
    destDir?: string;
    dlopen?: boolean;
    map?: (modulePath: string) => string | { name: string; copyTo: string };
    targetEsm?: boolean;
    sourcemap?: boolean;
  }

  declare function nativePlugin(options: RollupPluginNativesOptions): Plugin;

  export = nativePlugin;
}
