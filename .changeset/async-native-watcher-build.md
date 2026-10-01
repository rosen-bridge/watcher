---
'@rosen-bridge/watcher': patch
---

Build the CommonJS watcher entry with an async bootstrap so native dependencies finish their awaited initialization before the watcher starts.

Preserve Snappy's platform checks and optional binding fallbacks when bundling its native modules.

Wait for logger bootstrap before loading the watcher and include its YAML configuration parser in the bundle.
