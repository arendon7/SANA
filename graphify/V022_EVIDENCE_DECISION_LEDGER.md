# Graphify — v0.22 alpha4 Evidence & Decision Ledger

`Canonical source / normalized fact / control projection`
→ `EvidenceItem`
→ `provenanceRef + sourceDigestSha256 + freshness`
→ `Human review state`
→ `DecisionLedgerEntry`
→ `previousDigestSha256 → entryDigestSha256`

AI branch:

`Existing non-rejected EvidenceItem[]`
→ `Copilot synthesis`
→ `DRAFT_SUGGESTION / ADVISORY_ONLY`

Forbidden:

`AI → create/fabricate evidence`
`AI → cite missing evidence`
`AI → cite rejected evidence`
`AI → append human decision ledger entry`

Human review fail-closed:

- `UNKNOWN freshness` → cannot `ACCEPT_FOR_REVIEW`
- `canonical accepted=false` → cannot `ACCEPT_FOR_REVIEW`
- empty human note → no ledger entry
- unknown evidence ref → no ledger entry
- broken previous digest → no ledger append

Trust boundary:

`DEMO_RECONSTRUCTED · HUMAN_ONLY ledger · localOnly=true · canonicalMutated=false · D10=PENDING`
