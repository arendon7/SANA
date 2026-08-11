## Problem

Describe the user/product/engineering problem this PR solves.

## Linked issue

Closes #

## Scope

- 

## Explicitly out of scope

- 

## Product classification

- Product tier: `CORE | PRO | NETWORK | ENTERPRISE | SANA_INTELLIGENCE | SANA_IMPACT | ADD_ON | INTERNAL`
- Timing: `NOW | NEXT | LATER`
- User role(s):
- Commercial product affected:

## Domain invariants

List the domain rules that must remain true after this change.

- [ ] Tenant boundaries remain intact.
- [ ] Historical/material events are not silently rewritten.
- [ ] Provenance is preserved where required.
- [ ] AI authority boundaries are unchanged unless explicitly reviewed.
- [ ] Historical AGROWAY acceptance requirements remain protected where applicable.

## Data / migrations

Describe schema, migration, backfill, compatibility or event-contract changes. Write `None` when not applicable.

## Security / tenancy

Describe RBAC/RLS/authorization implications. Write `None` when not applicable.

## Offline / sync

Describe offline, queue, replay and conflict implications. Write `None` when not applicable.

## Tests executed

- [ ] Unit
- [ ] Integration
- [ ] TypeScript / build
- [ ] Database / migrations
- [ ] RLS adversarial
- [ ] Offline / deferred sync
- [ ] Historical acceptance
- [ ] Mobile / Expo
- [ ] Visual / accessibility
- [ ] AI authority / citation replay

Include exact commands and results below:

```text

```

## Acceptance scenario

Describe the realistic end-to-end scenario proving this works.

## Evidence

Attach or link logs, screenshots, traces, replay output, manifests or other evidence as appropriate.

## Failure / rollback / forward-fix

Explain how the change can be disabled, reverted or forward-fixed if it fails.

## Product approval

- [ ] Product behavior matches `docs/PRODUCT_OPERATING_SYSTEM.md`.
- [ ] New UI follows the Design Engineering System when applicable.
- [ ] `Product Approved` is not being represented as `Production Approved` without runtime evidence.
