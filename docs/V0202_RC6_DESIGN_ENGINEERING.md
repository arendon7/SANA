# AGROWAY v0.20.2-rc6 — Design Engineering System

## Goal

Make product design, interaction quality, accessibility, visual QA and frontend performance part of the governed AGROWAY development lifecycle rather than post-build polish.

## Operating model

Binario IA App Factory v4 provides the lifecycle shell:

`Discovery → Architecture → UX → Design System → Content/Assets → Mock Data → Build → QA → Product Approved → Engineering/Delivery → Production Approved`

`Product Approved` and `Production Approved` are deliberately different gates.

## Specialist layers

### SANA / AGROWAY brand canon — visual authority

Known identity vocabulary includes SANA Forest, Earth, Ivory, Growth and Signal; Sofia Pro primary direction; Merriweather secondary direction; agricultural line iconography; and the atmosphere/plant/management/soil/water/biology/data layered graphic system.

Exact color values and font binaries are not inferred when unavailable.

### Taste — direction

Used during D2 to establish intentional visual language, information density and multiple genuinely different design directions before convergence.

Pinned upstream: `Leonxlnx/taste-skill@e988add20dab0fa97d7a76781c48961c8184288e`.

### Emil Kowalski Skills — interaction craft

Used for motion, interaction states, animation review, prototyping and component/library selection. Motion must communicate hierarchy/state and honor `prefers-reduced-motion`.

Pinned upstream: `emilkowalski/skills@78761e1b57f97dce65b983d640c70a68f39e8163`.

### Impeccable — critique and hardening

Used after first build to detect visual/UX anti-patterns, accessibility defects and weak polish. It is an auditor, not brand authority.

Pinned upstream: `pbakaus/impeccable@ae388ac58fb33aade50fc47e2be07c3192dcaabd`.

### Vercel Agent Skills — frontend engineering

Used for React/Expo performance, composition and interface-guideline checks.

Pinned upstream: `vercel-labs/agent-skills@7c180d9044c9ae2b442b567aad4e42a28dd5ed62`.

### Figma — evidence surface

Figma is connected as an optional Product Lab evidence/handoff surface. Designs/components/variables can support review and Code Connect, but Figma cannot override repository domain contracts, design tokens, provenance or human approval.

### Browser QA

When a runnable browser UI exists, D7 adds Playwright at desktop/mobile viewports, axe-core, Lighthouse CI, Web Vitals, console-error rejection and horizontal-overflow checks.

## Design gates

- D0_TRUTH — product/domain/brand truth locked
- D1_ARCHITECTURE — IA, flows and states
- D2_DIRECTION — at least two directions for major surfaces
- D3_SYSTEM — tokens/components/states
- D4_BUILD — implementation
- D5_MOTION — interaction and reduced-motion review
- D6_AUDIT — Taste/Emil/Impeccable/Vercel specialist audits
- D7_VISUAL_QA — desktop/mobile/accessibility/performance
- D8_PRODUCT_APPROVED — human product decision
- D9_DELIVERY — version snapshot/CI/handoff
- D10_PRODUCTION_APPROVED — runtime + human production authority

## Non-negotiables

- No skill may mutate domain truth or security rules.
- Brand canon outranks generic visual taste.
- No invented brand hex values or font binaries.
- No automatic merge, deploy, rollback or production approval.
- Known-good versions remain recoverable.
- Agent evidence is advisory.
- Major UI changes require before/after evidence.
- Product Approved does not imply Production Approved.

## rc6 validation

- Design governance gate: PASS
- Design preflight: PASS
- TypeScript strict: PASS
- 23/23 current specs: `NODE_TEST_VITEST_COMPAT_PASS`
- PostgreSQL structural lint: 28 migrations / 102 checks PASS
- private CI: `PASS_WITH_PENDING`
- release readiness: `READY_FOR_PRODUCT_DEVELOPMENT_WITH_RUNTIME_PENDING`

Physical cloning of pinned upstream skills is currently `PENDING_NETWORK` because the execution environment cannot resolve github.com. Their exact upstream commits were independently verified and are locked in `config/design/skills.lock.json`; no floating refs are accepted.
