# AGROWAY v0.20.2 — Domain Integrity Hardening

This release adds **0 Domain Events** and **0 workspaces**. It hardens invariants before the first real v0.17+ materialization and certified pilot.

## Closed defects

- Investment commands are bound to the exact tenant/project scope.
- Deployments can use only commitments from the same tenant and the same project.
- Project/commitment/deployment/recovery/budget currencies are relationally bound.
- Approved budget version must exist for the exact project.
- Portfolio money aggregation rejects JS safe-integer overflow.
- Pilot policy cannot be weakened at runtime and must contain the canonical 12 stages exactly once.
- `INFO`, duplicate, future, stale, invalid-time and cross-scope evidence cannot satisfy certification.
- Empty/invalid/non-contiguous replay cannot pass.
- Certificates bind only an `ELIGIBLE_FOR_CERTIFICATION` decision with exact tenant/pilot/policy/digest and one active certificate per pilot.
- COMPLETE/PARTIAL Copilot responses must bind an existing deterministic evidence context hash.
- External canonical IDs use SHA-256-derived 128-bit identifiers instead of 32-bit FNV.
- Raw ingestion has an explicit terminal `markProcessed`; zero-sample payloads are quarantined.
- Quality/freshness clocks and remote-sensing geometry/cloud cover are validated.
- Runtime-imported workspaces declare package `exports`.

## Materialization

Use `scripts/materialize-v0202.py <exact-v016.zip> <exact-v0202-patch.zip>`; both artifacts are checked by SHA before extraction.

## Compatibility note

The external canonical-ID algorithm changes before the first real v0.17+ materialization. If an independent environment already persisted v0.17-v0.20.1 external IDs, reconcile those records before adoption.

Technical PASS does not certify a real agricultural pilot.
