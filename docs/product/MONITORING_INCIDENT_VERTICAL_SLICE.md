# AGROWAY FIELD — Monitoring Incident + Deterministic Resolution v0.21.0-alpha5

Information hierarchy:

`canonical state -> normalized fact -> event-time/received-time/freshness -> deterministic rule -> human contrast -> constrained local decision -> pending server confirmation`.

## Authority boundary

- Raw provider payload remains outside the UI/Copilot boundary.
- Deterministic agronomy decides whether the condition is still out of range.
- Copilot can explain only.
- A low contrast measurement cannot propose closure.
- An in-range contrast may propose local closure, but canonical state remains OPEN until server synchronization.
- Local decision envelope is not a canonical Domain Event.
