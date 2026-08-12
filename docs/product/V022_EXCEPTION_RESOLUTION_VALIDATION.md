# GREENATICS CONTROL v0.22.0-alpha3 — Exception Resolution Workspace

Status: **PASS_STATIC_TYPESCRIPT_AND_NATIVE_HTTP / D10 PENDING**  
Trust: **DEMO_RECONSTRUCTED**  
D10 Human Product Approval: **PENDING**

## Product intent

Convert deterministic Control Tower exceptions into traceable resolution cases without transferring authority to AI. Each case binds severity, subject, deterministic reason, owner, SLA, root cause, evidence and timeline.

AI/Copilot output is always `DRAFT_SUGGESTION` / `ADVISORY_ONLY`.

## Human authority gate

`RESOLVE` fails closed unless there is a human actor plus:

1. named owner;
2. root cause;
3. at least one evidence reference;
4. human resolution note.

Critical exceptions cannot be suppressed in alpha3. AI cannot acknowledge, assign, add evidence, resolve, suppress or reopen.

All alpha3 review mutations remain `localOnly=true` and `canonicalMutated=false`; no production command execution is claimed.

## Local validation

- `npm ci --ignore-scripts --offline`: **PASS**, 0 vulnerabilities in the complete reconstructed alpha3 artifact.
- root TypeScript strict: **PASS**.
- alpha3 static guardrail: **29/29 PASS**.
- Chromium product QA: **43/43 PASS** desktop/mobile.
- local Chromium cannot navigate localhost because this runtime returns `ERR_BLOCKED_BY_ADMINISTRATOR`; the local product QA uses an inline fallback only after detecting that administrator policy.
- `test:compat`: **12/12 spec files, 28 expected tests PASS** in the complete reconstructed artifact.
- PostgreSQL structural lint: **30 migrations / 124 checks PASS** in the complete reconstructed artifact.
- accumulated FIELD/Core `verify:offline`: **PASS** in the complete reconstructed artifact.

## Native HTTP CI — PASS

Workflow: `AGROWAY CONTROL v0.22 alpha3`  
Run: `31554787722`  
Head: `ee182b1bdbb078ec1656a545451859f9907ed18c`

GitHub Actions validates directly persisted CONTROL source with:

- Node syntax checks: **PASS**;
- Python QA syntax: **PASS**;
- pinned TypeScript `5.8.3` strict: **PASS**;
- alpha3 static authority guardrails: **29/29 PASS**;
- pinned Playwright `1.57.0` + Chromium real HTTP QA: **29/29 PASS**;
- desktop and mobile HTTP 200 + secure context: **PASS**;
- five-case exception inventory: **PASS**;
- CRITICAL suppression disabled: **PASS**;
- resolve-without-owner fails closed: **PASS**;
- complete human resolution path: **PASS**;
- final timeline actor is HUMAN: **PASS**;
- AI never executes ACKNOWLEDGE/ASSIGN/RESOLVE/SUPPRESS/REOPEN: **PASS**;
- desktop/mobile no overflow: **PASS**;
- mobile touch target >= 44px: **PASS**;
- zero browser console/page errors: **PASS**.

Browser evidence artifact:

- name: `agroway-control-v022-alpha3-browser-evidence`
- artifact ID: `9125592091`
- size: `810320` bytes
- SHA-256: `2f32328b19f18d14c1a4187b0f68273be1a481c263ec1fdc3c0af4dc0282942a`
- retention through 2026-08-26.

## Base persistence debt — explicitly separate

The current FIELD base branch omits `scripts/run-spec-compat.mjs` and `scripts/lint-postgres-structural.mjs`, and its root lockfile is stale (`@agroway/impact-ledger` missing from the lock). Alpha3 does **not** weaken or reinterpret those missing base artifacts as PASS. Cross-repo compatibility/PostgreSQL regression claims above come from the complete reconstructed local artifact; the GitHub alpha3 workflow is scoped to directly persisted CONTROL source.

## Boundary

This review surface does not claim production authentication/authorization, canonical exception persistence, notification delivery, real agricultural certification, or byte identity with the lost historical v0.15 release. No new canonical Domain Events or workspaces are introduced by alpha3.
