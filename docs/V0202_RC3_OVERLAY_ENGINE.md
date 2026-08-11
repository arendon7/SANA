# AGROWAY v0.20.2-rc3 — Overlay Engine Trust Boundary

This release adds no domain events or product workspaces. It hardens how the cumulative v0.16R→v0.20.2 patch is applied to the real v0.15 base.

## Production path

Required base:

`AGROWAY_REPO_BOOTSTRAP_v0.15.0-rc1.zip`

SHA-256:

`323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`

The production entry point checks this exact SHA before the shared overlay engine can run. A successful real materialization must persist `trustMode=PRODUCTION_EXACT_V015_SHA`.

## Compatibility smoke path

The rc3 patch includes a deliberately minimal fixture labeled `SYNTHETIC_COMPATIBILITY_ONLY`.

It exercises repository-root detection, payload overlay, workspace/script/TypeScript-reference preservation, deterministic output and migration delivery.

The production SHA gate rejects this synthetic fixture, and the production materialization trust validator rejects synthetic output. Therefore a synthetic PASS cannot be mistaken for a real positive integration.

## Current validation

- synthetic compatibility overlay: PASS_SYNTHETIC_ONLY
- deterministic repeated output: PASS
- production gate rejects synthetic base: PASS
- production trust validator rejects synthetic materialization: PASS
- cumulative guardrails/validators: PASS
- TypeScript strict: PASS
- real positive v0.15 overlay: PENDING_EXACT_V015_ZIP

The original v0.15 ZIP binary still must be recovered before npm-ci, full runtime, PostgreSQL/PostGIS integration, builds and real pilot certification can be declared PASS.
