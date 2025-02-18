# @rosen-bridge/watcher

## 4.1.1

### Patch Changes

- Patch @rosen-bridge/rosen-extractor to improve EVM extractor speed

## 4.1.0

### Minor Changes

- Integrate binance

### Patch Changes

- Add environment variables for bitcoin rpc connection
- Use @rosen-bridge/extended-typeorm to prevent db transaction conflicts
- Fix commitment redeem job bug
- Fix required commitment count to match with the smart contract computations

## 4.0.3

### Patch Changes

- Patch JS floating error in BitcoinRpcRosenExtractor

## 4.0.2

### Patch Changes

- Fix redeem job to redeem the invalid commitment after the reward transaction

## 4.0.1

### Patch Changes

- Add eRSN token info to assets and revenue apis
- Update logger structure

## 4.0.0

### Major Changes

- Support contract and tokensMap version and update info controller for version configs
- Update watcher regarding to decimal drop refactor

### Minor Changes

- Add warn level to logger health parameter and tune the thresholds
- Add ethereum health check parameters
- Integrate Ethereum network

### Patch Changes

- Update scanner packages
- Always check ergo node sync status as a health parameter
- Log current watcher version
- Update significant decimal for tokens that are already stored in db
- Fix watcher network switch in scanner init

## 3.2.2

### Patch Changes

- Fix ogmios parallel connections issue
- Fix issue in health check health history cleanup threshold value

## 3.2.1

### Patch Changes

- Fix ergo scanner sync health check height query

## 3.2.0

### Minor Changes

- Add notification and its configurations to health check
- Update Node version to 18
- Update health check APIs regarding to latest changes
- Add eRSN support and periodic reward collection
- Update APIs with respect to eRSN addition

### Patch Changes

- Fix warn log in reward collection when there is no eRSN tokens available
- Stabilize ogmios connection by adding connection close handler
- Update ogmios client and schema

## 3.1.1

### Patch Changes

- Fix initialization spend info
- Updated dependencies:
  - @rosen-bridge/scanner
  - @rosen-bridge/address-extractor
  - @rosen-bridge/bitcoin-esplora-scanner
  - @rosen-bridge/bitcoin-rpc-scanner
  - @rosen-bridge/bitcoin-observation-extractor
  - @rosen-bridge/watcher-data-extractor

## 3.1.0

### Minor Changes

- Add authentication for bitcoin rpc
- Add random id to bitcoin rpc requests

### Patch Changes

- Update koios default url to v1
- Add fee constraints at observation validation
- Use authentication for bitcoin rpc health-check
- Updated dependencies:
  - @rosen-bridge/scanner
  - @rosen-bridge/address-extractor
  - @rosen-bridge/bitcoin-esplora-scanner
  - @rosen-bridge/bitcoin-rpc-scanner
  - @rosen-bridge/bitcoin-observation-extractor
  - @rosen-bridge/watcher-data-extractor

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
