# AGROWAY FIELD — Inventory Consumption + Application v0.21.0-alpha4

The fourth FIELD vertical connects agricultural execution to Supply without pretending that an offline device owns canonical inventory.

Information hierarchy:

`known canonical stock -> local projected stock -> lot/batch -> quantity -> task/plan/operator/evidence -> guardrail -> pending Supply ledger`.

## Safety boundary

- Device never mutates canonical Supply inventory offline.
- Local application cannot reduce projected availability below zero.
- Product/unit is inherited from the selected inventory lot; unit mixing is rejected.
- Consumption cannot be orphaned from task/evidence.
- Local outbox envelope is not a canonical Domain Event or confirmed reservation.

## Functional slice

Inventory lot/batch visibility; canonical-known/local-consumed/projected balance; minimum exception; application quantity; task+plan+operator+evidence linkage; evidence SHA; projected-balance guardrail; local pending Supply ledger; field history projection.
