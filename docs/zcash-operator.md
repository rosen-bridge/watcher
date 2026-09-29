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

The operator follow-up on 29 September favors shipping the shared runtime
separately and qualifying existing chains first. The proposed split is:

| Shared runtime contribution                                                                                                                        | Zcash contribution after that baseline                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Node/npm versions in `.nvmrc`, Dockerfile and package engines; `pkg` replacement; exact AOE 1.0.10 pin for scanner-v2 compatibility.               | Zcash codec, scanner, extractor and required Rosen-extractor dependency additions.                         |
| Rollup `ignoreGlobal`, extended-typeorm SQLite import patch, shared CI/release installation and packaging fixes, and a runtime-specific changeset. | Chain configuration, registration, readiness, commitment/reveal gates, recovery tests and Zcash changeset. |
| A coherent runtime-only lockfile using accepted published dependencies.                                                                            | A second lock refresh after the Zcash producers are published.                                             |

The current PR's committed lockfile still reflects the old manifest; it does not
make the proposed extraction reproducible with `npm ci`. The earlier
[#12 discussion](https://github.com/rosen-bridge/watcher/pull/12#issuecomment-5022983382)
prioritized gradual dependency migration and watcher-service-2. That PR was closed
temporarily, not accepted as this runtime baseline. Maintainers still choose a
separate v1 runtime contribution or the Service 2 route before branch extraction.

For a v1 split, first build a clean runtime-only graph and execute an existing
chain's synthetic path through scanning, persisted observation, commitment,
reveal and permit return, followed by restart without duplicates. Then cover
startup/scanning for every supported chain family, including Firo ElectrumX,
database migration/recovery, and actual startup of each distributed bundle,
container and packaged executable. Existing Zcash fixtures and successful
bundling alone do not close that runtime release gate. No separate runtime
release or existing-chain qualification campaign is claimed by this proposal.

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

The recovery regression now kills a real child process after an observation is
committed while its block remains `PROCESSING`, then opens the same SQLite file
in fresh processes. A persistent fault keeps the cursor closed; corrected replay
recovers without duplicate observations, and a two-block rollback removes the
old observations before processing replacements. This exercises local process
and database recovery, not reconciliation of live downstream liabilities.

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
[`utils/native/zcash-inspector` in the companion update](https://github.com/rosen-bridge/utils/pull/8).
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

The companion utils/scanner update performs native inspection asynchronously in
batches of at most 32 transactions and 2,000,000 decoded bytes. Each batch checks
the executable hash and uses bounded input, output and execution time. Every
transaction in the block is inspected before observation storage starts; a late
refusal cannot persist an earlier partial batch. Rollback invalidates pending
validation, drains an already-started write, removes orphaned observations and
prevents interrupted work from reporting success to the scanner.

A Windows release-binary sample over the same 128 serialized fixture transactions
took 3.29 seconds with individual synchronous calls and 105 ms with batches, with
identical results. A 5 ms timer made no progress during the synchronous sample;
it progressed during the batch sample with a measured maximum lag of 14 ms.
This measures local process overhead, not sustained Mainnet catch-up capacity.
Skipping based
only on RPC `vout` would change the existing validation boundary: raw transaction
bytes and native decoding own output selection, and RPC `vout` is not bound to
those bytes. A missing/malformed RPC projection must not silently hide a valid
deposit. Qualify the batch-capable executable and matching consumer versions
together; an older inspector must fail closed rather than silently downgrade.

## NU7 preparation

As checked on 28 September 2026, [ZIP 259](https://zips.z.cash/zip-0259) and
[ZIP 218](https://zips.z.cash/zip-0218) are drafts. ZIP 259 specifies branch
`77190ad9`, disallows v4 and retains v5/v6; Testnet and Mainnet activation heights
are still unassigned. ZIP 218 proposes 25-second target spacing. No relative
calendar estimate is an activation rule.

The companion native update pins
[librustzcash `5345dbe`](https://github.com/zcash/librustzcash/tree/5345dbe0cd6c7f2057e631a34a74dffa84ff1d48),
including `zcash_protocol 0.10.6`, which recognizes `77190ad9`. Inspector tests
accept upstream v5/v6 NU7 vectors, reject v4 in that branch and reject retired
placeholder IDs. The transparent payment primitive constructs v5 NU7 payments
and verifies an externally produced signature through actual CHECKSIG; an old
branch signature is rejected. Its payment profile still refuses v6, and the
Orchard profile remains restricted to NU6.2 and Revision-0 addresses.

These tests establish parser and signature behavior, not network activation or
node admission. The reviewed Zebra source still uses a provisional NU7 ID; no
NU7 node roundtrip is qualified. Before accepting NU7 operation, close all of these:

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
   sign under the new branch while preserving duplicate-payment controls. The
   guard now rechecks live context after asynchronous authorization and before
   transport. Historical confirmed transactions remain observable after the
   upgrade; branch change alone does not release their reservations.
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
The companion [UI update](https://github.com/rosen-bridge/ui/pull/31) renders it as
an input reference in shared details and watcher desktop/mobile rows, without an
address link. The wire field remains unchanged. Third-party monitors still need
their own consumer check.

Remaining release reviews cover sustained backlog and resource sizing,
existing-chain runtime regression on the maintainer-selected graph, actual
activation-node admission, downstream liability reconciliation after deep
reorganizations, and deployment/operator recovery qualification.
