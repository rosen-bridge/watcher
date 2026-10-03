---
'@rosen-bridge/watcher': patch
---

Check BCH observations against finalized active ancestry on the scanner RPC and a separately configured witness before commitment or trigger signing and before queue broadcast. Hold work on unavailable evidence, relevant parked forks, or inconsistent block identity.

Expose separate source and witness outcomes through the finality health parameter. Distinguish routine finalization waits from RPC failure, branch disagreement, parked forks and invalid evidence; keep routine waits at debug log level without weakening the gate.
