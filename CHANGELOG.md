# @rosen-bridge/watcher

## 2.1.0

### Minor Changes

- Support Raspberry Pi from version 3 and above

## 2.0.2

### Patch Changes

- fix unlock api response schema
- add salt to the apiKey to prevent precomputed hash attacks
- solve mocha test coverage hanging problem

## 2.0.1

### Patch Changes

- Update scanner sync critical threshold and limit the watcher not to work with scanner `Broken` status.
- Fix `commitmentTimeoutConfirmation` in default config
- Use the repo box value instead of min box value in lock and unlock transactions

## 2.0.0

### Major Changes

- update watcher according to contract v3

### Patch Changes

- add version to /info api
