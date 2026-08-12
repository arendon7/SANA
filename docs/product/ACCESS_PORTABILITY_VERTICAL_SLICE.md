# AGROWAY FIELD — Access, Entitlements & Portability v0.21.0-alpha9

The ninth FIELD vertical closes three historical product obligations that were still only implicit: tenant-scoped invited users, subscription entitlements and user-owned data portability.

Flow:

`active membership -> role ceiling -> explicit permission grant -> plan/add-on entitlement -> allowed operation -> local/full data export boundary`.

## Authorization

Effective authorization is fail-closed. A permission is usable only when the membership is active, belongs to the tenant, the role ceiling permits it and it is explicitly granted. An invitation cannot grant permissions outside the invited role ceiling.

## Entitlements

Permissions and commercial entitlements are independent. A user may have UI/domain permission while the subscription still denies the capability. Plans are `CAMPO`, `PRO`, `NETWORK`, `ENTERPRISE`; add-ons are `PASSPORT`, `SENSORS`, `SANA_INTELLIGENCE`, `SANA_IMPACT`.

## Portability

Two export boundaries are explicit:

- `LOCAL_FIELD_DATA`: generates JSON/CSV from device-local FIELD state, hashes the payload with SHA-256 and creates a local download intent.
- `FULL_TENANT_DATA`: creates only a tenant-bound `REQUESTED` envelope. It cannot become `READY` until a backend produces an object reference, completion timestamp and SHA-256 digest.

## Trust

Prepared invitations and full-tenant export requests remain local until a real backend accepts them. The interface never claims an invitation was sent, a full export is complete, or server synchronization occurred. D10 Human Product Approval remains pending.
