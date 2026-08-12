# GREENATICS CONTROL v0.22.0-alpha3 — Exception Resolution Workspace

Status: **LOCAL PASS / NATIVE HTTP CI GATED**  
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

- `npm ci --ignore-scripts --offline`: **PASS**, 0 vulnerabilities.
- root TypeScript strict: **PASS**.
- alpha3 static guardrail: **29/29 PASS**.
- Chromium product QA: **43/43 PASS** desktop/mobile.
- local Chromium cannot navigate localhost because this runtime returns `ERR_BLOCKED_BY_ADMINISTRATOR`; the local QA therefore uses an inline fallback only after detecting that administrator policy.
- `test:compat`: **12/12 spec files, 28 expected tests PASS**.
- PostgreSQL structural lint: **30 migrations / 124 checks PASS**.
- accumulated FIELD/Core `verify:offline`: **PASS**.

## Native HTTP CI

`.github/workflows/agroway-v022-control-alpha3.yml` installs pinned Playwright 1.57.0 and runs Chromium against the real Node HTTP server at `/control/exceptions`. This is the authority for browser→HTTP proof.

## Boundary

This review surface does not claim production authentication/authorization, canonical exception persistence, notification delivery, real agricultural certification, or byte identity with the lost historical v0.15 release.
