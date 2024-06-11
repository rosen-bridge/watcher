# @rosen-bridge/watcher

## 3.0.0

### Major Changes

- Update minimum-fee to v1

### Minor Changes

- Upgrade health check package to latest
- Add bitcoin network
- Integrate rpc scanner for bitcoin network

### Patch Changes

- Update typeorm version to 0.3.20
- Update minimum-fee and health-check packages

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
