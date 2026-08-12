# AGROWAY FIELD v0.21.0-alpha10 — Local Development Backend

`LOCAL_DEV_BACKEND_NOT_PRODUCTION` moves invitation, export and sync/ACK flows beyond browser-local simulation without claiming production equivalence.

Runtime routes: `GET /api/dev/status`, `POST /api/dev/invitations`, `POST /api/dev/exports`, `GET /api/dev/exports/:id/download`, `POST /api/dev/sync/envelopes`.

Server invariants: tenant/actor checks, server-side role ceiling and seat validation, invitation `NOT_SENT_DEV`, full-export READY only after bytes + SHA-256, event-time preserved, server-generated received-time, restart-stable idempotency, conflict receipts without ACK, and outbox removal only after accepted ACK.

Migration `0024_sync_ingress_ack.sql` adds production-shaped `agroway_sync.ingress_envelope` and `agroway_sync.ack` with tenant/idempotency uniqueness, dual time, SHA-256 constraints, ACK→ingress FK, FORCE RLS and PUBLIC revocation.

Chromium localhost navigation is blocked by administrator policy in this environment. HTTP contracts are executed against the real Node server with Node `fetch`; UI handling is independently exercised in Chromium at the fetch boundary. Native browser-to-localhost transport is not claimed as PASS.

D10 Human Product Approval remains **PENDING**.
