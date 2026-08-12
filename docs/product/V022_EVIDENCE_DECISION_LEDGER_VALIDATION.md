# GREENATICS CONTROL v0.22.0-alpha4 — Evidence & Decision Ledger

Status: **PASS_STATIC_TYPESCRIPT_AND_NATIVE_HTTP / D10 PENDING**  
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

## Native HTTP CI — PASS

Workflow: `AGROWAY CONTROL v0.22 alpha4`  
Run: `31555345732`  
Head: `2c9b9512b1d32d02c193eddf6fbb14f97363072e`

Validated directly from the persisted CONTROL branch:

- Node/Python syntax: **PASS**;
- pinned TypeScript `5.8.3` strict: **PASS**;
- alpha3 Exception Resolution authority regression: **29/29 PASS**;
- alpha4 Evidence & Decision Ledger static guardrails: **36/36 PASS**;
- Playwright `1.57.0` + Chromium real HTTP QA: **47/47 PASS**;
- `/control/evidence` HTTP 200, security headers and secure context: **PASS** desktop/mobile;
- six provenance-bound evidence records render: **PASS**;
- rejected evidence cannot be accepted and receives zero AI citations: **PASS**;
- UNKNOWN freshness cannot be accepted: **PASS**;
- HUMAN review creates ledger entry: **PASS**;
- ledger actor is HUMAN: **PASS**;
- genesis `previousDigestSha256=null`: **PASS**;
- 64-hex SHA-256 ledger digest: **PASS**;
- second entry binds exactly to first entry digest: **PASS**;
- `localOnly=true` / `canonicalMutated=false`: **PASS**;
- Service Worker active with canonical `/service-worker.js`: **PASS** desktop/mobile;
- `/control/exceptions` alpha3 regression: **PASS** desktop/mobile;
- responsive/no-overflow + mobile touch target >=44px: **PASS**;
- zero console/page errors: **PASS**.

Browser evidence artifact:

- name: `agroway-control-v022-alpha4-evidence-ledger`
- artifact ID: `9125799973`
- size: `806235` bytes
- SHA-256: `a7f79dc418804705fe425c7ee9bb8a24e8cc1cb767b36bd6de3ec628b72e029f`
- retention through 2026-08-26.

## Service Worker QA correction

The first native run produced **45/47 PASS**; only the desktop/mobile Service Worker checks failed because the QA required `navigator.serviceWorker.controller` on the first navigation. That is not the correct first-load readiness condition: an installed/active worker may not yet control the initial document. The QA was corrected to require `await navigator.serviceWorker.ready`, an active worker, and the canonical `/service-worker.js` script URL. No product behavior or authority guardrail was weakened. The second native run passed **47/47**.

## Base persistence debt — explicitly separate

The FIELD base still has separate root-lock/direct-monorepo persistence debt. The old direct-monorepo workflow may remain red on CONTROL branches. Alpha4 does not reinterpret that separate debt as PASS and does not alter the 218-event domain canon.

## Boundary

This review surface does not claim production authentication/authorization, canonical evidence-review persistence, production decision-ledger persistence, notification delivery, real agricultural certification, or byte identity with the lost historical v0.15 release. Ledger authority remains HUMAN_ONLY; AI remains advisory-only.
