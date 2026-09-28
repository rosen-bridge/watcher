# Transparent Zcash watcher: operator requirements

This candidate connects transparent Zcash observations to the existing Rosen
watcher. Local integration results do not qualify a Mainnet deployment or a
future network upgrade. The [coordinating review](https://github.com/rosen-bridge/guard-service/pull/22)
owns the cross-repository release order and remaining qualification work.

## Configuration and release boundary

An active Zcash watcher must explicitly select its network, expected genesis,
owned loopback HTTP RPC endpoint, initial processed height, native inspector and
SHA-256, and branch schedule. `zcash.branches` contains increasing
`{height, branchId}` entries starting at height zero; branch IDs are eight
lowercase hexadecimal digits without `0x`. Use the exact selected network's
history from its reviewed node implementation. A syntactically valid schedule
does not establish agreement with that network. There is no generated,
release-qualified Mainnet/Testnet branch profile in this candidate.

The initial height is the last processed block: scanning begins with the next
block. Select a start covering the relevant deposits and retain enough history
for recovery. Do not use a higher initial height to make an extraction error
disappear.

The shared token map can contain Zcash for watchers observing another chain.
Those watchers need its destination-address codec, not a Zcash scanner or RPC
configuration. With an empty `zcash.network`, codec-only users derive Mainnet
or Testnet from `ergo.network`. An explicit `zcash.network` remains available for deployments
whose Zcash address network differs from their Ergo network.

The Node 22 runtime, npm 11.6.2 engine requirement, packaging replacement, Rollup
option, SQLite import patch and observation dependency pin affect the shared watcher application. Existing
clean-install/build evidence is not a regression campaign for every supported
chain. Maintainers must settle whether these belong in a separate runtime PR or
the watcher-service-2 integration, then qualify existing-chain startup, scanning,
commitment/reveal/redeem and packaging on the accepted graph before rollout.
Producer releases and refreshed consumer locks remain necessary for an ordinary
registry installation.

## Scanner status and recovery

Commitments and reveals require complete extraction through the scanner's
observed tip. Catch-up is expected after startup or a backlog; it is different
from an extraction failure. A moving tip can delay reporting even while blocks
are being processed. Monitor scanned and target heights as well as the reason
reporting is gated.

The `zcash-scanner-readiness` parameter is available through `/health/status`
and `/health/parameter/zcash-scanner-readiness`. It distinguishes `starting`,
`catching-up`, `ready` and `halted`; the first two are unstable, a halt is broken,
and ready is healthy. The underlying cause is retained in the halt detail and
forwarded to the configured watcher logger, with RPC credentials/URLs redacted.

The scanner/extractor libraries can log an error and return normally. Therefore
a subsequent resolved `update()` cannot clear a prior failure safely. This
candidate deliberately latches the reporting halt for the process lifetime;
operators must retain and investigate the first cause. It does not automatically
discard the error after a successful network request.

On a halt, preserve logs and a consistent database backup, identify the last
fully extracted canonical block and the cause, then reconcile affected
observations, commitments and triggers with the guards. Correct the dependency,
configuration or data problem and arrange a controlled rescan from a verified
checkpoint. Restart clears process-local state, so restart alone is **not** a
recovery procedure or proof that a skipped transaction was recovered. An
operator-approved repair/rescan tool and persisted incident acknowledgement are
not supplied by this PR. Do not delete the database or edit commitment status
to bypass the gate.

## Node and native inspector

Require an operator-controlled Zebra endpoint bound to loopback. The connector
requires a matching genesis and supports bounded request timeouts; do not expose
its RPC listener publicly. The deployment baseline must exclude Zebra 6.4.0 and
6.4.1: the [6.4.2 release](https://github.com/ZcashFoundation/zebra/releases/tag/v6.4.2)
fixes a remotely triggerable malformed-v6 crash, as detailed in
[GHSA-h5rr-8pqv-grp9](https://github.com/ZcashFoundation/zebra/security/advisories/GHSA-h5rr-8pqv-grp9).
Use 6.4.2 or a later reviewed patched release, and qualify its exact RPC and
network-upgrade behavior. This version floor is not evidence that this watcher
was tested against every later release.

The inspector is a separately built offline executable from
[`utils/native/zcash-inspector` at ea19c4f](https://github.com/rosen-bridge/utils/tree/ea19c4f38ebb7e32ad1f8a86ea1d3e3d071528ae/native/zcash-inspector).
Build using its committed Cargo lockfile and documented commands, record the
toolchain/target and binary hash, and configure that hash on the watcher. The
source pin and SHA-256 identify the selected binary; they are not a claim of
independent bit-for-bit build reproducibility. An npm install alone does not
supply a qualified inspector executable.

Provision the node database, watcher database, logs and recovery backups
separately. This candidate supplies no measured Mainnet disk/RAM minimum or
catch-up throughput envelope. Before deployment, measure full-history storage,
peak memory, initial-sync/catch-up time, event-loop delay and disk headroom with
the selected Zebra, inspector and host. Keep these as release acceptance results,
not guessed hardware guarantees.

The current extractor hashes and invokes the native executable synchronously
for each transaction. This is a known catch-up/event-loop cost. Skipping based
only on RPC `vout` would change the existing validation boundary: raw transaction
bytes and native decoding own output selection, and RPC `vout` is not bound to
those bytes. A missing/malformed RPC projection must not silently hide a valid
deposit. A bounded asynchronous inspector/batch design needs its own integrity,
fault and load tests; it is not implemented by this operator correction.

## NU7 preparation

As checked on 28 September 2026, [ZIP 259](https://zips.z.cash/zip-0259) and
[ZIP 218](https://zips.z.cash/zip-0218) are drafts. ZIP 259 specifies branch
`77190ad9`, disallows v4 and retains v5/v6; Testnet and Mainnet activation heights
are still unassigned. ZIP 218 proposes 25-second target spacing. No relative
calendar estimate is an activation rule.

The inspector already has v4/v5/v6 parsing branches, but the pinned
`zcash_protocol 0.10.5` does not recognize `77190ad9`. Its
[branch mapping](https://github.com/zcash/librustzcash/blob/97aefdc39a037da9c4f19a0e8a450d2c7932f53e/components/zcash_protocol/src/consensus.rs#L745)
contains only an optional unstable placeholder for NU7. The current inspector
therefore does not support the proposed NU7 branch. Published native tests
include v4 contextual parsing and noncanonical rejection as well as v5 fixtures;
they do not include a v6 or NU7 activation fixture. Before accepting NU7
operation, the release must close all of these:

1. Pin final network activation heights and consensus rules, update the reviewed
   branch schedule and native dependencies, and exercise height `H-1`, `H` and
   `H+1`. Include historical v4 acceptance, post-activation v4 rejection and
   v5/v6 branch-match and mismatch vectors through the installed scanner.
2. Re-evaluate scan interval, tip gating, lag alerts, confirmation policy and
   catch-up load. The current 75-second scan interval spans about three target
   blocks under a 25-second schedule. Do not mechanically divide confirmations
   by three or infer equal rollback risk from elapsed time alone.
3. Revalidate pending outbound work across the activation. v5/v6 signatures
   commit to the branch ID: a pre-upgrade signed transaction must not be
   relabelled or blindly submitted after the change. Reconcile chain/mempool and
   prior attempts, invalidate obsolete work, then reconstruct, reauthorize and
   sign under the new branch while preserving duplicate-payment controls.
4. Exercise rollback across the activation and a deeper reorg with already
   created commitments/triggers. Demonstrate both operator visibility and guard
   refusal of invalidated evidence before claiming recovery qualification.

Until these gates close, operators must coordinate a stop before activation,
including pending withdrawals and participant availability. This PR contains no
automatic calendar-based NU7 pause or post-NU7 readiness guarantee. Merely adding
the draft branch ID to YAML is insufficient.

## Observation identifiers and remaining operator review

For a Zcash observation, `fromAddress` is `box:<txid>.<index>`, an output-origin
descriptor, not a sender wallet address. The observation API preserves that
field. Clients should label it as an output reference and link the transaction
and output index, without generating a sender-address explorer link.
The watcher UI and third-party monitors need a rendered check for this field;
the API's string representation alone does not qualify those consumers.

High-value next reviews are controlled scanner failure/recovery with a retained
database, native-inspector throughput under backlog, existing-chain runtime
regressions, activation-boundary pending transactions, and the operator views
for output descriptors and degraded states.
