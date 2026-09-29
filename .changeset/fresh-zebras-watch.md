---
'@rosen-bridge/watcher': minor
---

Add transparent Zcash watcher support.

Keep existing-chain startup compatible with shared Zcash token entries, expose scanner catch-up and retained halt causes, and prevent failed extraction from advancing the reporting gate. Preserve the existing commitment/redeem job order and document operator recovery and upgrade requirements.

Keep observation extraction on the scanner v2-compatible interface, resolve the pinned SQLite driver's explicit ESM subpaths, and preserve Node global references when building the executable.
