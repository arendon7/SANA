# AGROWAY v0.20.2-rc2 — Rebase runbook from v0.15

## Required artifacts

### Real base

`AGROWAY_REPO_BOOTSTRAP_v0.15.0-rc1.zip`

SHA-256:

`323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`

### Cumulative patch

`AGROWAY_v0.20.2-rc2_REBASED_FROM_V015.zip`

SHA-256:

`0e39e545a27a7595d4cdbbdee46720a3c28129b039a77e37c8eeaf1527ad564f`

## Materialization

```bash
python3 scripts/materialize-v0202-rc2.py \
  AGROWAY_REPO_BOOTSTRAP_v0.15.0-rc1.zip \
  AGROWAY_v0.20.2-rc2_REBASED_FROM_V015.zip
```

The materializer verifies both SHA-256 values before extraction. The cumulative patch reconstructs v0.16R first and then overlays v0.17–v0.20.2.

Expected output:

`out-v0202-rc2/AGROWAY_REPO_BOOTSTRAP_v0.20.2-rc2.zip`

## Integration gates

After materialization:

```bash
npm ci
npm run guardrail:v016r
npm run validate:v016r
node scripts/run-private-ci-v0202.mjs --runtime --build
```

Database migrations execute in order:

`0016_knowledge_ai_copilot_reconstructed.sql` → `0017` → `0018` → `0019` → `0020` → `0021` → `0022`.

## Acceptance boundary

A technically green build is necessary but not sufficient. The historical AGROWAY acceptance matrix must still preserve offline/deferred sync, operators, lot/task execution, irrigation/nutrition/pest workflows, inventories, RBAC/guest users, data portability, IoT/trazability and commercialization flows where they belong in the product.

Real-pilot `CERTIFIED` status still requires real evidence and a named human signer over the exact deterministic decision digest.
