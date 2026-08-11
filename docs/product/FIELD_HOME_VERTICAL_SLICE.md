# AGROWAY FIELD — Home vertical slice v0.21.0-alpha1

## Product intent

The first materialized product surface is the field operator's home. It is deliberately not a generic KPI dashboard. Its information hierarchy follows field work:

`context → exceptions → today's execution → crop condition → supply/AI → traceability`.

## Design engineering application

- **Taste:** variance 4, density 6; selected `context-and-action-workbench` after rejecting card-grid and timeline-only directions.
- **Emil:** motion only for feedback/spatial state; short ease-out transitions; reduced-motion support; no decorative continuous animation.
- **Impeccable:** avoids nested card stacks, gradients, rounded icon tiles and low-contrast gray-on-color patterns.
- **Vercel/Web guidelines:** semantic landmarks, skip link, focus-visible, native dialog, labelled controls, touch targets and responsive mobile nav.
- **Binario IA App Factory:** screen spec is evidence for D0–D10; human Product Approval remains pending.

## Functional slice

Implemented without external runtime dependencies:

- desktop and mobile navigation shell;
- farm / plot / crop-cycle context;
- deterministic attention rail;
- today's task execution;
- local task completion state;
- local activity capture;
- explicit local queue for unsynchronized changes;
- service-worker app-shell cache;
- lot pulse with source/freshness/provenance cues;
- low inventory exception;
- Copilot draft with evidence disclosure and human-approval boundary;
- recent traceability feed.

## Trust boundary

This preview uses demonstrative reconstructed data. It does not claim live backend synchronization, real sensor ingestion, real agronomic certification, production-approved brand hex values or AI execution authority.

## Browser QA

- 1440×900: PASS.
- 390×844: PASS.
- 17/17 interaction/layout checks PASS.
- no horizontal overflow.
- no browser console errors.
- mobile primary capture target: 48×48.
- task mutation, local queue, activity capture and Copilot evidence flow: PASS.

The environment blocks browser navigation to localhost/file URLs by administrator policy, so QA uses a real Chromium executable in `PLAYWRIGHT_INLINE_RENDER`. Service-worker runtime remains pending a navigable browser environment; the service-worker shell contract passes static validation.

## Approval state

D0–D9: PASS.

D10 Human Product Approval: **PENDING**.
