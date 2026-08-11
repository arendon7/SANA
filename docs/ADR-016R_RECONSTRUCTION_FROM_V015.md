# ADR-016R — Reconstruction of v0.16 over the real v0.15 base

## Status

**RECONSTRUCTED.** This ADR does not claim that an original v0.16 ZIP existed.

The last real release is `AGROWAY_REPO_BOOTSTRAP_v0.15.0-rc1.zip`, SHA-256:

`323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`

The v0.16 design work was completed conceptually/statically, but the downloadable ZIP was never actually generated. v0.16R restores that missing layer explicitly.

## Reconstructed delta

- Domain Events: **133 → 145 (+12)**.
- Permissions: **+2**: `knowledge:manage`, `copilot:use`.
- Workspaces: **+3**:
  - `services/knowledge-registry`
  - `services/ai-gateway`
  - `services/agronomy-copilot`

## Preserved decisions

- Knowledge priority: `CANONICAL > TECHNICAL > EXPERIMENTAL > HISTORICAL`.
- Retrieval V1: PostgreSQL full-text; embeddings optional.
- Copilot context: Diagnosis / Plan / Monitoring / Catalog + governed knowledge.
- AI Gateway routes only an allowed provider/model policy.
- Provider storage disabled (`store:false` semantic policy).
- Responses API / Structured Outputs remain optional adapter capabilities.
- Every proposal remains `DRAFT_SUGGESTION` and `requiresHumanApproval=true`.
- AI cannot approve or bypass deterministic Agronomy, Catalog, Supply or safety rules.

## Compatibility

v0.17+ consumes normalized canonical facts only. Raw weather/IoT/satellite provider payloads never enter Knowledge Registry or Copilot.

The official chain is now:

`v0.15 REAL → v0.16R RECONSTRUCTED → v0.17 → v0.18 → v0.19 → v0.20 → v0.20.1 → v0.20.2-rc2`.
