# GREENATICS CONTROL v0.22.0-alpha4 — Evidence & Decision Ledger

Status: **CI GATED / D10 PENDING**  
Trust: **DEMO_RECONSTRUCTED**  
D10 Human Product Approval: **PENDING**

## Product intent

Expose evidence used by Control Tower/Copilot with provenance, SHA-256 source digest, freshness, canonical acceptance and human review state. Human review decisions are appended to a local SHA-256 chained ledger.

## Evidence guardrails

- every reviewable record requires `provenanceRef` and a 64-hex SHA-256 source digest;
- `UNKNOWN` freshness cannot be accepted for review;
- canonically rejected evidence cannot be accepted for review;
- AI citations must resolve to existing evidence and cannot cite review-rejected evidence;
- AI remains `DRAFT_SUGGESTION` / `ADVISORY_ONLY`.

## Decision ledger guardrails

- ledger actor is always HUMAN;
- human note is mandatory;
- referenced evidence must exist;
- every entry requires a 64-hex SHA-256 digest;
- `previousDigestSha256` must equal the prior entry digest;
- first entry has a null genesis predecessor;
- alpha4 review state remains `localOnly=true` / `canonicalMutated=false`.

## Product continuity

`/control/exceptions` from alpha3 remains available. Alpha4 adds `/control/evidence`; it does not replace exception resolution.

## Domain delta

- canonical Domain Events: **+0**
- workspaces: **+0**
- certification authority: unchanged

## CI scope

`.github/workflows/agroway-v022-control-alpha4.yml` runs pinned TypeScript, alpha3 authority regression, alpha4 static guardrails, and Playwright 1.57.0 Chromium against the real Node HTTP server. The browser QA validates evidence inventory, rejected/unknown fail-closed states, a HUMAN ledger entry, SHA-256 genesis/chain behavior, local trust boundary, Service Worker, responsive behavior and the alpha3 exception route.

The separate FIELD base root-lock/direct-monorepo persistence debt is not converted into an alpha4 PASS claim.
