# Issue #24 — alpha10 workspace persistence reconstruction

Status: `RECONSTRUCTED_CANONICAL_NOT_BYTE_IDENTICAL`  
Scope: direct reconstructed v0.21.0-alpha10 monorepo persistence gate  
Base branch: `feature/control-v022-alpha8`  
Base commit: `ddbd6d7d2408b1c98162378dd81d451d2e8c3bec`  
Base tree: `a2e4f315263f14db3abbcf179fa855d4a6114588`

## Purpose

Close the persistence contradiction tracked by Issue #24 without weakening the 41-workspace contract, inventing empty packages, or rewriting prior historical PASS claims.

The repair restores a directly persisted source graph that can be checked from the repository itself. It does **not** claim byte identity with the lost historical artifact.

## Root-cause finding

The root `package.json` and `package-lock.json` declared 41 workspaces and the field lineage already contained the direct 41-workspace CI gate. Nevertheless, the persisted Git tree was incomplete:

- `services/identity-access` retained substantive source but had no `package.json`.
- six declared advanced services had no persisted directory at all:
  - `services/investment-portfolio`
  - `services/control-tower-projector`
  - `services/knowledge-evidence-resolver`
  - `services/control-tower-copilot`
  - `services/pilot-certifier`
  - `services/pilot-replay-auditor`

The CONTROL alpha branches inherited this incomplete direct root. The defect was not introduced by the later CONTROL slices.

No exact historical Git blob for the six missing service implementations was found during repository/history search. Therefore their provenance is reconstruction, not recovery.

## Provenance classification

| Workspace | Classification | Primary reconstruction evidence |
|---|---|---|
| `services/identity-access` | `RECONSTRUCTED_FROM_LOCK_AND_EXISTING_SOURCE` | existing substantive `src/index.ts`, root workspace declaration, lock entry, root TS path |
| `services/investment-portfolio` | `RECONSTRUCTED_FROM_LOCK_CONTRACTS_MIGRATIONS_AND_PRODUCT_SURFACES` | `invest-control-contracts`, migration `0018_invest_control_tower.sql`, package-lock dependency edge, Investment Project Workspace trust boundary |
| `services/control-tower-projector` | same | control-tower contracts, migration `0018`, lock dependency edge, rebuildable projection invariant |
| `services/knowledge-evidence-resolver` | same | `copilot-knowledge-contracts`, migration `0019_copilot_knowledge.sql`, provenance/freshness rules |
| `services/control-tower-copilot` | same | copilot contracts, migration `0019`, `DRAFT_SUGGESTION` + human-approval boundary |
| `services/pilot-certifier` | same | `pilot-certification-contracts`, migration `0020_pilot_certification.sql`, human attestation invariant |
| `services/pilot-replay-auditor` | same | pilot replay contracts and migration `0020`, deterministic replay integrity requirement |

## Reconstructed behavioral boundaries

### Investment portfolio

The service records and validates domain facts only. It does not custody funds or execute payments. The implementation enforces project/tenant/currency scope, positive safe minor-unit amounts, requirement/commitment/deployment invariants, explicit project-state transitions, versioned budgets, risk state, evidence links and deterministic eligibility.

`CapitalDeployment` is an evidence-bearing domain record. It is **not** a payment rail or disbursement authority.

### Control Tower projector

The Control Tower remains a rebuildable projection, never a transactional source of truth. Capital totals are grouped by currency, basis-point ratios are deterministic, and exceptions are derived from supplied canonical snapshots/thresholds. No projector mutation can move capital or change agronomic authority.

### Knowledge evidence resolver

Evidence is tenant-scoped, provenance-bearing, digest-validated and freshness-aware. Stale, malformed, duplicate or cross-tenant evidence is rejected. A guard explicitly forbids persistence-shaped objects containing raw provider payloads, credentials, secrets or tokens.

### Control Tower Copilot

The reconstructed service has no execution port. It can answer only from accepted evidence, rejects citations to unaccepted evidence, and converts generated suggestions only to `DRAFT_SUGGESTION` with `requiresHumanApproval: true`.

The explicit authority boundary keeps financial mutation, agronomic execution, budget approval, capital deployment and certificate issuance outside AI authority.

### Pilot certification

Stage evaluation is deterministic against the canonical policy/evidence contracts. The policy must include every `REQUIRED_PILOT_STAGES` stage, tenant isolation must be evidenced, and certificate issuance requires a prior eligible deterministic decision plus explicit human attestation.

### Pilot replay audit

Replay events are checked for scope, unique IDs, contiguous sequence, digest shape, event type and timestamp validity. The resulting replay digest is supplied by an injected SHA-256 implementation and can be compared against the expected canonical digest.

## Lockfile decision

The historical root lockfile is preserved. Reconstructed `package.json` files intentionally match its existing workspace names, versions and dependency edges. The new persistence verifier checks package/lock parity for all 41 declared workspaces and validates internal workspace links in the lockfile.

This avoids silently shrinking the graph or laundering a new dependency topology as historical source.

## Verification

A repository-local verifier now checks:

1. exactly 41 declared workspaces;
2. exact root workspace list parity with the lockfile;
3. `package.json` and `src/index.ts` for every workspace;
4. `0.21.0-alpha10` on every workspace;
5. unique `@agroway/*` names;
6. package identity/dependency parity with `package-lock.json`;
7. internal lock links;
8. substantive non-placeholder source for all seven repaired workspaces.

The existing canonical workflow additionally runs:

- `npm ci --ignore-scripts --offline`
- root strict TypeScript via `npm run typecheck`

During authoring, the reconstructed TypeScript implementations were also compiled in an isolated TypeScript 5.8.3 strict harness against the current fetched contract definitions with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; that authoring result is advisory only. Pull-request CI is the canonical acceptance evidence.

## Historical claim discipline

This repair does not edit historical validation documents to pretend the missing bytes were always present. The correct statement is:

> The alpha10 contract declared a 41-workspace reconstructed runtime, but direct Git persistence was incomplete. Issue #24 reconstructs the missing persisted source from the surviving lockfile, contracts, migrations and product trust surfaces. The repaired source is canonical reconstructed source, not a byte-for-byte recovery of lost historical files.

## Exit criteria

Issue #24 may be considered technically satisfied only when the repair PR demonstrates all of the following on its exact head:

- direct inventory PASS;
- package/lock parity PASS;
- `npm ci --ignore-scripts --offline` PASS;
- root strict TypeScript PASS;
- no historical regression introduced by this repair;
- provenance remains explicitly reconstructed rather than recovered.

Merge and issue closure remain human-governed actions.
