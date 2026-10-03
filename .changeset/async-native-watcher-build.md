---
'@rosen-bridge/watcher': patch
---

Build a CommonJS launcher and adjacent ESM chunks so asynchronous initialization completes in order and BCH scanner/extractor crypto loads only when selected. Keep the full output directory together when distributing the Node build.

Preserve Snappy's platform checks and optional binding fallbacks when bundling its native modules.

Wait for logger bootstrap before loading the watcher and include its YAML configuration parser in the bundle.

Add source and emitted startup checks for deferred crypto/extractor loading. Pure CashAddr modules remain shared through destination-address support; the strict no-libauth check remains an explicit unmet gate. The existing native packager does not support the required Node 22 runtime.
