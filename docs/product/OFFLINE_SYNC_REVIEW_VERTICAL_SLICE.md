# AGROWAY FIELD — Offline Sync + Conflict Review v0.21.0-alpha8

The eighth FIELD vertical makes offline-first behavior inspectable without pretending to contact or mutate a server.

Flow:

`local outbox -> stable idempotency key -> demo canonical contrast -> deterministic classification -> local review action -> real server still pending`.

## Classification

- `READY_FOR_SERVER_SUBMISSION`: no conflict detected in the demonstrative contrast; server must still revalidate.
- `SERVER_REVALIDATION_REQUIRED`: domain state changed, such as Supply availability no longer covering the requested consumption.
- `CANONICAL_VERSION_CHANGED`: the envelope was based on an older canonical aggregate version; force overwrite is forbidden.
- `DUPLICATE_ACK_MATCH`: demo snapshot indicates the same idempotency key already has an ACK; inspect rather than resend.

## Safety

Review never removes the original envelope, never rewrites event-time, never invents received-time, never marks an item `SYNCED`, and never lets AI decide merge/conflict outcome.
