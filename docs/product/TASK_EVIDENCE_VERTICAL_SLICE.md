# AGROWAY FIELD — Task Execution + Evidence v0.21.0-alpha3

## Product intent

The third FIELD vertical turns a scheduled task into an evidence-bearing execution flow rather than a generic completion checkbox.

Information hierarchy:

`task/context -> measured result -> photo -> observation -> local package/trust -> prior evidence`.

## Storage boundary

- Photo/file bytes are stored in IndexedDB when the browser origin permits it.
- The local outbox never carries the blob.
- The outbox carries task/plot/cycle/plan linkage, measurement metadata, evidence ID and SHA-256.
- Opaque-origin browser QA may use `MEMORY_FALLBACK_QA_ONLY`; that fallback is a harness accommodation, not the production storage design.
- `LOCAL_TASK_EVIDENCE_CAPTURED` is a local outbox envelope, **not a claimed canonical Domain Event**.

## Functional slice

- open execution directly from the work-of-today list;
- exact task, farm, plot, cycle and plan-action context;
- task-specific measurement + unit;
- mobile camera/file capture (`accept=image/*`, `capture=environment`);
- local preview;
- SHA-256 digest for selected evidence;
- IndexedDB blob persistence boundary;
- local evidence metadata ledger;
- offline outbox envelope without blob bytes;
- local task completion + event-time trace entry;
- shared Home/Crop Cycle history update.

## Trust boundary

Capturing evidence does not change deterministic agronomy rules, certify a Traceability Passport, approve a pilot, or allow the Copilot to execute anything.
