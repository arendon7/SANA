# Graphify — v0.22 alpha3 Exception Resolution Workspace

`ControlTowerException (deterministic)`
→ `ExceptionResolutionCase (review projection)`
→ `Owner + RootCause + Evidence + Timeline`
→ `Human command`
→ `Local review state (alpha3)`

AI branch:

`Canonical/normalized evidence`
→ `Copilot explanation`
→ `DRAFT_SUGGESTION / ADVISORY_ONLY`
→ **never** `ACKNOWLEDGE | ASSIGN | RESOLVE | SUPPRESS | REOPEN`

Resolution gate:

`HUMAN actor + OWNER + ROOT_CAUSE + EVIDENCE >= 1 + RESOLUTION_NOTE`
→ `RESOLVED_LOCAL_REVIEW`

Critical guard:

`severity=CRITICAL` → `SUPPRESS forbidden`

Trust boundary:

`DEMO_RECONSTRUCTED · localOnly=true · canonicalMutated=false · D10=PENDING`
