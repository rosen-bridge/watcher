/**
 * This file has two purposes:
 *
 * 1. Fixing `rollup` and `getrandom` crate (which is used inside
 * `ergo-lib-wasm-nodejs`) incompatibility by shimming the crypto global
 * variable. `getrandom` expects a global `crypto` variable in node
 * environments, but when the project is bundled, no such global variable is
 * present.
 * 2. Importing `sqlite3` package so it gets included in the bundle
 */

import { webcrypto } from 'node:crypto';
import 'sqlite3';

(globalThis as any).crypto = webcrypto;
