# CAPITAL_READINESS INT1.6 — Persistence, RLS & Integrity Proposal

Status: `DESIGN_REVIEW_REQUIRED`  
Issue: `#38`  
Base runtime: `feature/control-v022-alpha8`  
Base SHA: `645c0a1749fc541d920265adcc990b251b3c05c7`  
Document class: `TECHNICAL_DESIGN_CANON_CANDIDATE`  
Migration authority: **NONE**  
Canonical Domain Event authority: **NONE**

---

## 0. Executive decision

CAPITAL_READINESS now has enough deterministic runtime semantics to design persistence, but not enough evidence to justify writing tables before the persistence contract itself is reviewed.

The proposed persistence architecture is therefore:

```text
CANONICAL AGROWAY / INVEST TRUTH
        │
        ├─ InvestmentProject
        ├─ budget
        ├─ investment risks
        ├─ evidence links
        └─ productive identities by reference
        │
        ▼
CAPITAL_READINESS CANON
        │
        ├─ immutable intake identity/version
        ├─ append-only intake transitions
        ├─ immutable final readiness assessment
        ├─ immutable G1–G9 assessment rows
        ├─ immutable gap definitions
        └─ append-only gap transitions
        │
        ▼
REBUILDABLE / PORTABLE PROJECTIONS
        │
        ├─ EvidenceManifest
        ├─ ProductiveRiskProfile
        ├─ CapitalReadinessPackage
        ├─ ControlTowerException
        └─ CAPITAL_READINESS_CONTROL_READ_ONLY
```

The core persistence decision is:

> **Persist business decisions and their auditable lifecycle; keep analytical/presentation outputs rebuildable unless an external publication later requires an immutable artifact receipt.**

This proposal deliberately rejects a mutable “current readiness row” as the primary truth. Readiness is versioned and reviewable; history must survive later remediation and reassessment.

### Proposed first migration scope

Six additive tables inside the existing `agroway_invest` bounded context:

1. `capital_pilot_intake`
2. `capital_pilot_intake_transition`
3. `readiness_assessment`
4. `readiness_gate_assessment`
5. `readiness_gap`
6. `readiness_gap_transition`

No new schema. No new workspace. No financial ledger. No wallet. No payment object.

### Explicitly not persisted in the first migration

- full `EvidenceManifest` JSON;
- full `ProductiveRiskProfile` JSON;
- full `CapitalReadinessPackage` JSON;
- Control Tower readiness exceptions as readiness truth;
- read-only CONTROL model;
- investor balances;
- KYC documents/raw KYC payloads;
- payment credentials;
- bank data beyond separately approved minimum references;
- financial-partner internal state;
- AI prompts/responses as readiness authority.

---

# 1. Existing database substrate audited

The current Invest substrate is established by `0018_invest_control_tower.sql` and hardened by `0022_domain_integrity_hardening.sql`.

## 1.1 Existing `agroway_invest.project`

Current project truth already includes:

```text
project_id
 tenant_id
 code
 name
 state
 eligibility
 producer_id
 farm_id
 plot_ids
 crop_cycle_ids
 currency
 required_minor
 committed_minor
 deployed_minor
 recovered_minor
 approved_budget_version
 created_at
 updated_at
```

The table is explicitly documented as an **investment twin referencing canonical AGROWAY identities, not an agronomic master**.

INT1.6 preserves that boundary.

## 1.2 Existing capital integrity

Current database design already expresses:

- `committed_minor <= required_minor`;
- `deployed_minor <= committed_minor`;
- positive commitment/deployment/recovery records;
- one approved budget per project;
- tenant/project/currency relationship hardening;
- deployment → commitment same project;
- approved budget binding;
- RLS on Invest tables.

Capital Readiness must attach to this project identity, never recreate capital truth.

## 1.3 Existing RLS pattern

Current tenant policy pattern is effectively:

```sql
tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
```

with matching `WITH CHECK`.

Properties:

- unset/empty tenant setting evaluates fail-closed;
- malformed non-empty UUID causes an error rather than broad access;
- same policy shape is already familiar across the runtime.

Important caveat:

> `ENABLE ROW LEVEL SECURITY` does not, by itself, protect against table-owner bypass.

The readiness migration should therefore use both:

1. a non-owner application runtime role; and
2. `FORCE ROW LEVEL SECURITY` on the new readiness tables.

This proposal does **not** silently retrofit FORCE RLS onto all historical tables. That deserves its own compatibility/security review.

## 1.4 Composite parent identity prerequisite

Readiness tables do not carry project currency, so the clean FK is:

```text
(tenant_id, project_id)
```

The current project table has a global `project_id` PK and a `(tenant_id, project_id, currency)` uniqueness anchor.

Before readiness child FKs are created, the implementation migration should add or verify:

```sql
UNIQUE (tenant_id, project_id)
```

on `agroway_invest.project`.

This looks redundant relative to global `project_id`, but it is intentionally required so a child row cannot claim tenant A while referencing a project owned by tenant B.

The implementation must also verify in a real PostgreSQL runtime—not structural lint alone—that all existing composite budget FKs have valid referenced uniqueness. If `(tenant_id, project_id, version)` on `budget_version` is not already backed by an eligible unique key, the migration must add it before any new assessment → approved-budget composite FK.

---

# 2. Persistence classification matrix

| Object | Classification | First migration | Reason |
|---|---|---:|---|
| `InvestmentProject` | `REUSE_CANONICAL` | existing | Productive-capital anchor |
| `CapitalPilotIntake` identity/version/source | `PERSIST_CANONICAL` | yes | Business intake fact |
| Intake state changes | `PERSIST_APPEND_ONLY_TRANSITIONS` | yes | Auditable lifecycle |
| Final `ReadinessAssessment` | `PERSIST_CANONICAL_IMMUTABLE` | yes | Human business decision |
| G1–G9 final rows | `PERSIST_CANONICAL_IMMUTABLE` | yes | Decision basis |
| `ReadinessGap` definition | `PERSIST_CANONICAL_IMMUTABLE` | yes | Material blocker/condition fact |
| Gap state changes | `PERSIST_APPEND_ONLY_TRANSITIONS` | yes | Preserve remediation history |
| `EvidenceManifest` full object | `REBUILDABLE_PROJECTION` | no | Derived from evidence/policy |
| manifest digest/as-of | `PERSIST_PROOF` | yes, on assessment | Bind exact review context |
| `ProductiveRiskProfile` full object | `REBUILDABLE_PROJECTION` | no | Derived explanatory vector |
| risk-profile digest | `PERSIST_PROOF` | yes, on assessment | Bind exact review context |
| source-risk digest | `PERSIST_PROOF_CANDIDATE` | recommended | Detect mutable risk-source drift |
| `CapitalReadinessPackage` | `REBUILDABLE_PROJECTION` | no | Portable projection |
| package publication receipt | `DEFER` | no | Add only when externally published |
| `ControlTowerException` | `REUSE_PROJECTION` | existing | Existing Control primitive |
| CONTROL read-only model | `REBUILDABLE_PROJECTION` | no | UI/model layer |
| Financial partner/KYC/instrument IDs | `EXTERNAL_REF` | defer | Partner authority |
| investor balance | `DO_NOT_STORE` | no | Would imply financial ledger/custody |
| wallet/custody/payment credentials | `DO_NOT_STORE` | no | Out of SANA readiness authority |
| raw provider payloads/secrets | `DO_NOT_STORE` | no | Trust/security boundary |
| AI final decision | `DO_NOT_STORE_AS_AUTHORITY` | no | Human decision required |

---

# 3. Why append-only transitions instead of mutable state history

The TypeScript contracts expose current state, but persistence does not have to destroy history to materialize that state.

A mutable-only row creates several problems:

- `OPEN → RESOLVED` destroys evidence of how long a gap was open unless audit is perfect;
- `HUMAN_REVIEW → CAPITAL_READY` destroys the exact pre-decision workflow state;
- historical package reconstruction becomes ambiguous;
- stale writes can silently overwrite newer workflow state;
- waiver accountability becomes weak.

The proposal therefore separates:

```text
immutable object identity/definition
+
append-only state transitions
=
current state projection
```

This is compatible with current domain functions: adapters can fold transitions into the current `CapitalPilotIntake.state` and `ReadinessGap.state` expected by the runtime.

---

# 4. Table 1 — `capital_pilot_intake`

## 4.1 Purpose

Immutable identity/version/source metadata for a productive-capital readiness intake.

## 4.2 Proposed columns

```sql
CREATE TABLE agroway_invest.capital_pilot_intake (
  intake_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  intake_version integer NOT NULL CHECK (intake_version > 0),
  source_type text NOT NULL,
  source_ref text NOT NULL,
  originator_ref text,
  consent_set_ref text,
  data_pack_version text NOT NULL,
  supersedes_intake_id uuid,
  created_at timestamptz NOT NULL,

  UNIQUE (tenant_id, project_id, intake_version),
  UNIQUE (tenant_id, project_id, intake_id, intake_version),

  FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id),

  FOREIGN KEY (tenant_id, project_id, supersedes_intake_id)
    REFERENCES agroway_invest.capital_pilot_intake
      (tenant_id, project_id, intake_id)
);
```

The exact self-FK requires a matching unique key; implementation should create one if needed.

## 4.3 Source-type check

```text
PRODUCER_DIRECT
SANA_DIAGNOSTIC
OFFTAKER
FINANCIAL_PARTNER
COOPERATION_PROGRAM
PUBLIC_PROGRAM
INTERNAL_PIPELINE
```

## 4.4 Immutability

After insert:

- no UPDATE;
- no DELETE through runtime role;
- correction is a new intake version / superseding intake;
- source refs are never silently rewritten.

This makes intake provenance durable.

---

# 5. Table 2 — `capital_pilot_intake_transition`

## 5.1 Purpose

Append-only workflow history for intake state.

## 5.2 Proposed columns

```sql
CREATE TABLE agroway_invest.capital_pilot_intake_transition (
  transition_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  intake_id uuid NOT NULL,
  intake_version integer NOT NULL,
  sequence integer NOT NULL CHECK (sequence >= 0),
  from_state text,
  to_state text NOT NULL,
  actor_ref text NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL,

  UNIQUE (tenant_id, project_id, intake_id, sequence),

  FOREIGN KEY (tenant_id, project_id, intake_id, intake_version)
    REFERENCES agroway_invest.capital_pilot_intake
      (tenant_id, project_id, intake_id, intake_version)
);
```

## 5.3 Transition vocabulary

Current domain states:

```text
CREATED
CANONICAL_REUSE_SCAN
DATA_COMPLETION
EVIDENCE_VALIDATION
ASSESSMENT_READY
UNDER_ASSESSMENT
GAP_REMEDIATION
HUMAN_REVIEW
CAPITAL_READY
READY_WITH_CONDITIONS
NOT_READY
REASSESSMENT_REQUIRED
PAUSED
WITHDRAWN
```

## 5.4 Initial transition

Sequence `0`:

```text
from_state = NULL
to_state   = CREATED
```

## 5.5 Transition integrity

A future trigger/function should enforce the exact state machine already implemented by `transitionCapitalPilotIntake()`.

For PAUSED:

- persistence must retain the previous state in transition history;
- resume may return only to the exact prior state allowed by current domain semantics;
- `WITHDRAWN` is terminal.

## 5.6 Why state is not stored on the intake row

The current state can be derived as the latest transition by sequence. A materialized/current-state projection may be added later for performance, but it must remain rebuildable.

---

# 6. Table 3 — `readiness_assessment`

## 6.1 Purpose

Immutable final, human-reviewed readiness decision for one project version.

No “draft assessment row” is proposed in the first migration. Work-in-progress lives in the intake lifecycle and deterministic runtime until final review.

## 6.2 Proposed columns

```sql
CREATE TABLE agroway_invest.readiness_assessment (
  assessment_id text PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),

  intake_id uuid NOT NULL,
  intake_version integer NOT NULL CHECK (intake_version > 0),

  policy_version text NOT NULL,
  methodology_version text NOT NULL,
  project_snapshot_ref text NOT NULL,
  approved_budget_version integer,

  evidence_manifest_digest_sha256 char(64) NOT NULL,
  risk_profile_digest_sha256 char(64) NOT NULL,
  source_risk_digest_sha256 char(64),
  evidence_coverage_bps integer NOT NULL CHECK (evidence_coverage_bps BETWEEN 0 AND 10000),

  decision text NOT NULL,
  deterministic_maximum_decision text NOT NULL,
  rationale text NOT NULL,
  reviewer_ref text NOT NULL,
  reviewed_at timestamptz NOT NULL,
  digest_sha256 char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, project_id, version),
  UNIQUE (tenant_id, project_id, assessment_id, version),
  UNIQUE (tenant_id, project_id, digest_sha256),

  FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id),

  FOREIGN KEY (tenant_id, project_id, intake_id, intake_version)
    REFERENCES agroway_invest.capital_pilot_intake
      (tenant_id, project_id, intake_id, intake_version)
);
```

If `approved_budget_version` is not null, implementation should bind it with a composite FK to the same tenant/project budget version after referenced uniqueness is verified.

## 6.3 Digest checks

All stored SHA-256 fields:

```sql
CHECK (btrim(field) ~ '^[a-f0-9]{64}$')
```

## 6.4 Decision vocabulary

```text
NOT_CAPITAL_READY
CAPITAL_READY_WITH_CONDITIONS
CAPITAL_READY
REASSESSMENT_REQUIRED
```

`deterministic_maximum_decision` excludes `REASSESSMENT_REQUIRED` and uses:

```text
NOT_CAPITAL_READY
CAPITAL_READY_WITH_CONDITIONS
CAPITAL_READY
```

## 6.5 Human review requirements

At insert:

- `reviewer_ref` nonblank;
- `rationale` nonblank;
- `reviewed_at` valid;
- intake current lifecycle must have reached `HUMAN_REVIEW` according to canonical transition history;
- `reviewed_at` cannot precede manifest/risk snapshot as-of values if those are available to the persistence command;
- no AI actor may be accepted as the final reviewer by application authorization policy.

The database can guarantee nonblank/timestamps. Human-vs-AI identity authorization belongs to identity/permission policy, not a fragile text-prefix check.

## 6.6 Assessment version continuity

Recommended deferred constraint trigger:

```text
version = 1
OR
version - 1 exists for same tenant/project
```

This prevents:

- v1 → v4 jumps;
- stale out-of-order history;
- silent replacement of older decisions.

Concurrency strategy is discussed later.

## 6.7 Immutability

Final assessment rows are append-only.

No runtime UPDATE or DELETE.

A changed project/evidence/policy/risk context creates a **new assessment version**.

---

# 7. Table 4 — `readiness_gate_assessment`

## 7.1 Purpose

Immutable final G1–G9 basis of one readiness assessment.

## 7.2 Proposed columns

```sql
CREATE TABLE agroway_invest.readiness_gate_assessment (
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL,
  assessment_version integer NOT NULL,
  gate_id text NOT NULL,
  result text NOT NULL,
  rationale text NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  confidence_bps integer NOT NULL CHECK (confidence_bps BETWEEN 0 AND 10000),
  assessed_at timestamptz NOT NULL,
  assessed_by text NOT NULL,
  method_version text NOT NULL,

  PRIMARY KEY (tenant_id, project_id, assessment_id, gate_id),
  UNIQUE (tenant_id, project_id, assessment_id, assessment_version, gate_id),

  FOREIGN KEY (tenant_id, project_id, assessment_id, assessment_version)
    REFERENCES agroway_invest.readiness_assessment
      (tenant_id, project_id, assessment_id, version)
    DEFERRABLE INITIALLY DEFERRED
);
```

## 7.3 Gate vocabulary

Exactly:

```text
G1_ACTOR
G2_ASSET
G3_AGRONOMY
G4_BUDGET
G5_MARKET
G6_RISK
G7_TRACEABILITY
G8_IMPACT
G9_FINANCIAL_STRUCTURE
```

## 7.4 Result vocabulary

```text
PASS
PASS_WITH_CONDITIONS
INCOMPLETE
BLOCKED
NOT_APPLICABLE
```

## 7.5 Exactly nine gates

A final assessment must have exactly one row for every G1–G9.

A normal CHECK constraint cannot count child rows, so use a **DEFERRABLE CONSTRAINT TRIGGER** evaluated at transaction commit.

The trigger verifies:

- count = 9;
- set equals canonical G1–G9 exactly;
- no missing/unknown gate;
- gate method version equals assessment methodology version.

## 7.6 Immutability

No runtime UPDATE or DELETE.

New evidence/policy/risk leads to a new assessment version, not edited gate history.

---

# 8. Table 5 — `readiness_gap`

## 8.1 Purpose

Immutable definition of a blocker or condition identified by one assessment.

State is intentionally moved to the transition table.

## 8.2 Proposed columns

```sql
CREATE TABLE agroway_invest.readiness_gap (
  gap_id text PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL,
  assessment_version integer NOT NULL,
  gate_id text NOT NULL,
  code text NOT NULL,
  severity text NOT NULL,
  blocking boolean NOT NULL,
  description text NOT NULL,
  source_ref text NOT NULL,
  owner_ref text,
  due_at timestamptz,
  required_evidence_roles text[] NOT NULL DEFAULT '{}',
  opened_at timestamptz NOT NULL,

  UNIQUE (tenant_id, project_id, assessment_id, gate_id, code),
  UNIQUE (tenant_id, project_id, assessment_id, assessment_version, gap_id),

  FOREIGN KEY (tenant_id, project_id, assessment_id, assessment_version, gate_id)
    REFERENCES agroway_invest.readiness_gate_assessment
      (tenant_id, project_id, assessment_id, assessment_version, gate_id)
    DEFERRABLE INITIALLY DEFERRED
);
```

## 8.3 Severity vocabulary

```text
INFO
WARNING
CRITICAL
```

Do not hard-code `blocking => CRITICAL` at the database layer yet. Current Control projection intentionally maps blocking readiness to CRITICAL Control exceptions, but preserving gap severity flexibility avoids locking UI/projection semantics into canonical storage.

## 8.4 Timing

Recommended checks:

- `due_at IS NULL OR due_at >= opened_at`;
- nonblank `code`, `description`, `source_ref`.

## 8.5 Immutability

Gap identity/meaning is immutable.

Remediation changes state through `readiness_gap_transition`.

---

# 9. Table 6 — `readiness_gap_transition`

## 9.1 Purpose

Append-only lifecycle of a readiness gap.

## 9.2 Proposed columns

```sql
CREATE TABLE agroway_invest.readiness_gap_transition (
  transition_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL,
  assessment_version integer NOT NULL,
  gap_id text NOT NULL,
  sequence integer NOT NULL CHECK (sequence >= 0),
  from_state text,
  to_state text NOT NULL,
  actor_ref text NOT NULL,
  resolution_evidence_refs text[] NOT NULL DEFAULT '{}',
  note text,
  occurred_at timestamptz NOT NULL,

  UNIQUE (tenant_id, project_id, gap_id, sequence),

  FOREIGN KEY (tenant_id, project_id, assessment_id, assessment_version, gap_id)
    REFERENCES agroway_invest.readiness_gap
      (tenant_id, project_id, assessment_id, assessment_version, gap_id)
);
```

## 9.3 State vocabulary

```text
OPEN
IN_REMEDIATION
EVIDENCE_SUBMITTED
RESOLVED
WAIVED
SUPERSEDED
```

Initial sequence `0`:

```text
NULL → OPEN
```

## 9.4 Proposed transition policy

Candidate v1:

```text
OPEN → IN_REMEDIATION | EVIDENCE_SUBMITTED | RESOLVED | WAIVED | SUPERSEDED
IN_REMEDIATION → EVIDENCE_SUBMITTED | RESOLVED | WAIVED | SUPERSEDED
EVIDENCE_SUBMITTED → IN_REMEDIATION | RESOLVED | WAIVED | SUPERSEDED
RESOLVED → terminal
WAIVED → terminal
SUPERSEDED → terminal
```

Before implementation, this policy must be reconciled with the command semantics that will be authorized for INT1.7.

## 9.5 WAIVED guard

`WAIVED` must require:

- explicit human actor;
- nonblank note/rationale;
- any required evidence/authority reference specified by policy;
- audit event/transition preserved.

AI cannot waive a blocking gap.

## 9.6 Resolution chronology

Every transition must have:

```text
occurred_at >= previous transition occurred_at
```

and sequence must be contiguous.

---

# 10. Derived current-state views

Instead of duplicating mutable state on canonical rows, create ordinary SQL views or projector queries later:

```text
capital_pilot_intake_current_state
readiness_gap_current_state
```

Conceptually:

```sql
SELECT DISTINCT ON (tenant_id, project_id, intake_id)
  ...
FROM transitions
ORDER BY tenant_id, project_id, intake_id, sequence DESC;
```

These are rebuildable views.

Do not create materialized views until profiling shows a need.

---

# 11. Final-decision integrity at commit

Database integrity should prevent obvious contradictions without reimplementing the entire versioned readiness policy in SQL.

A deferred assessment integrity trigger should inspect child gate/gap rows before commit.

## 11.1 `CAPITAL_READY`

Require:

- exactly nine gates;
- no gate result `BLOCKED` or `INCOMPLETE`;
- no gate result `PASS_WITH_CONDITIONS`;
- zero gap definitions for the assessment;
- deterministic maximum = `CAPITAL_READY`.

## 11.2 `CAPITAL_READY_WITH_CONDITIONS`

Require:

- deterministic maximum = `CAPITAL_READY_WITH_CONDITIONS`;
- zero blocking gap definitions;
- at least one nonblocking condition gap;
- at least one gate `PASS_WITH_CONDITIONS`.

## 11.3 `NOT_CAPITAL_READY`

May be recorded even when deterministic maximum is more permissive, because a human reviewer is allowed to be conservative.

Database must never allow the reverse: a final decision more permissive than the deterministic maximum.

## 11.4 `REASSESSMENT_REQUIRED`

May be recorded from any deterministic maximum.

It means the current evidence/context should be reassessed. It does **not** mean default, financing rejection, or loss.

---

# 12. Deterministic maximum decision constraint

The current pure rule allows these combinations:

| deterministic maximum | allowed final human decision |
|---|---|
| `NOT_CAPITAL_READY` | `NOT_CAPITAL_READY`, `REASSESSMENT_REQUIRED` |
| `CAPITAL_READY_WITH_CONDITIONS` | `NOT_CAPITAL_READY`, `CAPITAL_READY_WITH_CONDITIONS`, `REASSESSMENT_REQUIRED` |
| `CAPITAL_READY` | `NOT_CAPITAL_READY`, `CAPITAL_READY`, `REASSESSMENT_REQUIRED` |

Notably, current domain semantics do **not** allow inventing “with conditions” when deterministic evaluation has no condition.

A database CHECK can encode this matrix directly.

---

# 13. Gate ↔ gap integrity

Use deferred checks rather than persisting redundant arrays of blocking/condition gap IDs.

For each gate:

### `PASS`

- zero gap definitions for the gate.

### `PASS_WITH_CONDITIONS`

- at least one nonblocking gap;
- zero blocking gaps.

### `BLOCKED`

- at least one blocking gap.

### `NOT_APPLICABLE`

- zero gaps;
- `evidence_refs` should be empty under current pure-rule behavior.

### `INCOMPLETE`

May have a nonblocking evidence-completion gap or other incomplete condition depending on policy. Do not over-constrain this state at DB level beyond “must not contradict an explicit blocking gap without being BLOCKED”.

This preserves policy flexibility while blocking forged obviously inconsistent rows.

---

# 14. Evidence persistence decision

## 14.1 Do not duplicate the full manifest in relational tables yet

`EvidenceManifest` is deterministic and can contain accepted/rejected evidence across multiple canonical systems. Persisting every field immediately would create a second evidence registry.

First migration persists:

- `evidence_manifest_digest_sha256`;
- final gate `evidence_refs`;
- evidence coverage;
- policy/methodology version;
- project snapshot ref.

The existing evidence sources remain canonical elsewhere.

## 14.2 Known limitation

A digest proves identity of a historical manifest if the artifact is available, but a digest alone does not reproduce an artifact whose upstream source later changes or disappears.

Therefore, **before external Capital Readiness packages are distributed**, add an explicit immutable artifact/publication mechanism rather than pretending database digests alone are archival storage.

Candidate later object:

```text
ReadinessArtifactReceipt
├── tenant/project/assessment
├── kind = EVIDENCE_MANIFEST | RISK_PROFILE | CAPITAL_READINESS_PACKAGE
├── artifactRef
├── digestSha256
├── createdAt
└── publishedToRef? / audience?  (only after privacy review)
```

This is `DEFER`, not part of the first migration.

---

# 15. ProductiveRiskProfile persistence decision

Do not persist a second mutable risk ledger.

Canonical risks remain `agroway_invest.risk`.

Final assessment persists:

- `risk_profile_digest_sha256`;
- recommended `source_risk_digest_sha256`.

This allows the system to detect whether the underlying source-risk set has changed since review.

The full nine-dimensional profile remains a rebuildable projection until external publication requires an immutable artifact receipt.

---

# 16. CapitalReadinessPackage persistence decision

Do **not** store the package as canonical business truth in the first migration.

It remains a deterministic, versioned projection over:

```text
assessment
+ gates
+ gaps/current-as-of lifecycle
+ evidence-manifest proof
+ risk-profile proof
+ project snapshot
+ limitations/provenance
```

When a package is sent externally, a later publication receipt can bind the exact artifact digest and version.

This avoids a dangerous pattern where a rendered package JSON becomes a second business database.

---

# 17. RLS table-by-table design

Every new table contains `tenant_id` and receives:

```sql
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
ALTER TABLE ... FORCE ROW LEVEL SECURITY;
```

Tenant policy:

```sql
USING (
  tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
)
WITH CHECK (
  tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
)
```

Apply to:

- `capital_pilot_intake`
- `capital_pilot_intake_transition`
- `readiness_assessment`
- `readiness_gate_assessment`
- `readiness_gap`
- `readiness_gap_transition`

## 17.1 Runtime role rule

The production application role must not own these tables.

Migration/owner role and application role must be distinct.

## 17.2 RLS is not authorization

RLS answers:

> “Can this tenant touch this tenant's row?”

It does not answer:

> “Is this actor a permitted human readiness reviewer?”

Actor permissions remain in identity/access/application authorization.

Database constraints still enforce invariant safety even if application authorization is buggy.

---

# 18. SQL privilege policy

Recommended first-migration privileges for runtime role:

## Immutable canonical tables

`capital_pilot_intake`

- SELECT
- INSERT
- no UPDATE
- no DELETE

`readiness_assessment`

- SELECT
- INSERT
- no UPDATE
- no DELETE

`readiness_gate_assessment`

- SELECT
- INSERT
- no UPDATE
- no DELETE

`readiness_gap`

- SELECT
- INSERT
- no UPDATE
- no DELETE

## Transition tables

`capital_pilot_intake_transition`

- SELECT
- INSERT
- no UPDATE
- no DELETE

`readiness_gap_transition`

- SELECT
- INSERT
- no UPDATE
- no DELETE

Corrections happen through new canonical versions or new transitions.

This is stronger than relying on application convention.

---

# 19. Trigger/function strategy

Do not rely on dozens of opaque triggers for domain logic. Use triggers only for invariants that must survive direct writes.

Recommended database functions/triggers:

1. `assert_readiness_assessment_complete()` — deferred
   - exactly G1–G9
   - final decision/gap consistency
   - gate/gap consistency

2. `assert_intake_transition_chain()` — before insert
   - contiguous sequence
   - from_state equals previous to_state
   - legal state transition
   - time monotonic
   - WITHDRAWN terminal

3. `assert_gap_transition_chain()` — before insert
   - contiguous sequence
   - legal transition
   - time monotonic
   - terminal state enforcement
   - WAIVED actor/note requirements

4. `assert_readiness_assessment_version_chain()` — before/deferred insert
   - v1 or previous version exists
   - no gaps in version chain

Triggers must be small, deterministic, schema-qualified, tested adversarially, and documented.

Do not use SECURITY DEFINER unless absolutely required. If used, lock `search_path` explicitly and review privilege escalation.

---

# 20. Concurrency model

## 20.1 Assessment versions

Do not silently compute `MAX(version)+1` outside a transaction and assume uniqueness.

Recommended adapter flow:

```text
BEGIN
  read latest project assessment version
  choose next version
  insert final assessment + gates + gaps atomically
COMMIT
```

The unique key `(tenant_id, project_id, version)` is the final authority.

If two writers race:

- one succeeds;
- the other gets unique violation;
- adapter maps this to `READINESS_VERSION_CONFLICT`;
- caller reloads and deliberately reassesses/retries.

No `ON CONFLICT DO UPDATE` for final assessments.

## 20.2 Intake versions

Same pattern using:

```text
UNIQUE (tenant_id, project_id, intake_version)
```

No upsert-overwrite.

## 20.3 Gate rows

Primary/unique gate key makes duplicate gate insert fail immediately.

## 20.4 Transition sequence

Unique `(tenant, object, sequence)` plus trigger chain prevents two simultaneous transitions from both becoming “next”.

One writer wins; loser reloads current state.

---

# 21. Delete and retention policy

Readiness records influence financing-readiness evidence and must not disappear through ordinary runtime actions.

Recommended policy:

- no hard delete by application role;
- withdrawal/supersession is a business state, not deletion;
- legal/privacy deletion requirements are handled by a separately authorized retention workflow, not ad hoc SQL;
- references to producer stories/photos remain separate from minimum readiness evidence and consent scopes;
- no public story/photo consent is inferred from financing/readiness participation.

Before production, define statutory/contractual retention periods with Colombian legal/privacy counsel and financial partners as applicable.

This document does not invent a retention duration.

---

# 22. Adversarial PostgreSQL test matrix

The migration implementation must include real PostgreSQL tests, not only SQL-string lint.

## 22.1 Tenant isolation

| Test | Expected |
|---|---|
| tenant A SELECT tenant B intake | 0 rows |
| tenant A SELECT tenant B assessment | 0 rows |
| tenant A INSERT row with tenant B | RLS failure |
| tenant A UPDATE tenant B transition | forbidden/no privilege + RLS |
| tenant A DELETE tenant B row | forbidden/no privilege + RLS |
| unset `app.tenant_id` SELECT | 0 rows |
| unset tenant INSERT | RLS failure |
| malformed tenant UUID | fail/error, never broad access |
| table owner vs app role | test demonstrates app role cannot bypass RLS |

## 22.2 Composite-scope attacks

| Attack | Expected |
|---|---|
| tenant A row references tenant B `project_id` | composite FK failure |
| assessment references other tenant intake | FK failure |
| gate references other project assessment | FK failure |
| gap references other assessment version | FK failure |
| gap transition references wrong project/gap | FK failure |
| intake supersedes intake from other project | FK failure |

## 22.3 Versioning/concurrency

| Test | Expected |
|---|---|
| duplicate assessment v1 | unique violation |
| concurrent assessment v2 inserts | exactly one succeeds |
| insert assessment v3 without v2 | version-chain failure |
| duplicate intake version | unique violation |
| duplicate G5 row | key violation |
| transition same sequence twice | unique violation |
| transition sequence jump | chain-trigger failure |
| stale transition from_state | chain-trigger failure |

## 22.4 G1–G9 completeness

| Test | Expected |
|---|---|
| 8-gate final assessment | deferred constraint failure at commit |
| 10 rows with duplicate gate | key/constraint failure |
| unknown gate | CHECK failure |
| gate method version differs from assessment | deferred constraint failure |

## 22.5 Decision integrity

| Test | Expected |
|---|---|
| max NOT_READY + decision READY | CHECK/deferred failure |
| max CONDITIONAL + decision READY | failure |
| max READY + decision CONDITIONAL without condition | failure |
| READY with blocker | failure |
| READY with condition | failure |
| CONDITIONAL with blocker | failure |
| CONDITIONAL without condition | failure |
| REASSESSMENT_REQUIRED | allowed under any deterministic maximum |
| conservative NOT_READY despite max READY | allowed |

## 22.6 Gap integrity

| Test | Expected |
|---|---|
| PASS gate with gap | failure |
| BLOCKED gate without blocking gap | failure |
| CONDITIONAL gate without condition gap | failure |
| condition gap flagged blocking | classification failure |
| duplicate same gate/code gap | unique violation |
| due_at before opened_at | CHECK failure |
| WAIVED without human actor/note | transition failure |
| RESOLVED then reopen in same assessment | terminal-state failure under v1 policy |

If reopening is later required, use a new assessment/version or explicitly revise the lifecycle policy—do not silently weaken the trigger.

## 22.7 Digest/time integrity

| Test | Expected |
|---|---|
| malformed manifest digest | CHECK failure |
| malformed risk digest | CHECK failure |
| malformed assessment digest | CHECK failure |
| reviewed_at invalid/null | failure |
| gap transition before gap opened_at | failure |
| transition time regression | failure |
| package publication before assessment (future feature) | failure |

PostgreSQL CHECK cannot compare timestamps to wall-clock `now()` safely for all historical/import cases. “Future relative to evaluation `asOf`” remains primarily a deterministic application rule unless an explicit source-as-of timestamp is persisted and compared relationally.

---

# 23. RLS adversarial harness design

A future test script should create at least:

```text
role: migration_owner
role: agroway_app_test   (non-owner)
tenant A UUID
tenant B UUID
project A
project B
```

Then:

```sql
SET ROLE agroway_app_test;
SELECT set_config('app.tenant_id', '<tenant-a>', true);
```

Test each operation under real RLS.

Do not run RLS assertions as the table owner and mistake owner bypass for policy behavior.

Also test `FORCE ROW LEVEL SECURITY` behavior explicitly.

---

# 24. Migration implementation shape

When this design is approved, create the next available migration number at that time. Do not reserve a number now.

Suggested migration phases inside one reviewed change set:

```text
A. prerequisite unique keys on project/budget if missing
B. readiness canonical tables
C. transition tables
D. CHECK/FK/UNIQUE constraints
E. RLS + FORCE RLS
F. immutable privileges
G. small invariant trigger functions
H. comments/documentation
I. real PostgreSQL adversarial tests
```

For any constraint added to populated existing tables:

- prefer `NOT VALID` + `VALIDATE CONSTRAINT` where operationally appropriate;
- avoid long blocking table rewrites;
- verify migration against realistic PostgreSQL/PostGIS CI.

---

# 25. Index strategy

Do not create speculative indexes for every column.

Minimum useful indexes beyond uniqueness/FKs:

```sql
-- Latest assessment lookup
(tenant_id, project_id, version DESC)

-- Intake transition current-state fold
(tenant_id, project_id, intake_id, sequence DESC)

-- Gap transition current-state fold
(tenant_id, project_id, gap_id, sequence DESC)

-- Active/project readiness work
(tenant_id, project_id, assessment_version, gate_id)
```

Because assessment/gate/gap tables are expected to be relatively small per project, prove additional index needs with query plans before adding them.

---

# 26. Adapter transaction boundaries

## 26.1 Create intake

Atomic transaction:

```text
insert immutable intake
insert sequence-0 transition NULL→CREATED
```

If either fails, neither persists.

## 26.2 Transition intake

Atomic:

```text
read latest transition under tenant/project scope
validate expected current state
insert next transition
```

No update.

## 26.3 Record final assessment

Atomic transaction:

```text
validate current intake = HUMAN_REVIEW
insert readiness_assessment
insert exactly 9 gate rows
insert all gap definitions
insert sequence-0 OPEN transition for every gap
run deferred integrity checks
commit
```

No partially committed final assessment.

## 26.4 Remediate gap

Atomic:

```text
read current gap transition
validate command + actor permission + evidence
insert next gap transition
```

A later new readiness assessment decides whether remediation changes project readiness.

Gap resolution alone must not silently rewrite the previous assessment decision.

---

# 27. Historical reconstruction semantics

Given an assessment version, the system should be able to answer:

- what final decision was recorded;
- who reviewed it and when;
- which G1–G9 results formed that decision;
- which gaps existed at review;
- how those gaps changed later;
- which evidence refs/digests were bound;
- which risk-profile digest was bound;
- which policy/methodology/project snapshot was used.

This is much stronger than a mutable `current_readiness_status` column.

---

# 28. Current-state semantics

The current project readiness is not simply “latest gap state”.

Recommended rule:

```text
latest final assessment decision
+
post-assessment material changes
→ possibly REASSESSMENT_REQUIRED
```

Do not automatically upgrade `NOT_CAPITAL_READY` to `CAPITAL_READY` just because all old gaps later become RESOLVED.

A new human-reviewed assessment version is required.

This protects the meaning of a final decision.

---

# 29. Reassessment invalidation

Material events that may require a future `RequireReadinessReassessment` command include:

- productive scope changes;
- approved budget changes;
- material new/changed risk;
- stale critical evidence;
- market/offtake change;
- partner-structure requirement change;
- impact baseline/method change;
- major project incident;
- policy/methodology version change when policy declares re-evaluation necessary.

INT1.6 does not implement the invalidation engine. It ensures the persistence model can record a later reassessment without overwriting history.

---

# 30. Financial-partner boundary in persistence

No partner table is required in the first readiness migration.

When a real partner pilot exists, prefer minimal opaque references:

```text
financial_partner_ref
kyc_status_ref
instrument_ref
commitment_ref
disbursement_ref
settlement_ref
```

Possible future storage belongs to a separately reviewed integration boundary.

Never store in readiness tables:

- investor balances;
- wallet balance;
- bank credentials;
- card data;
- raw payment instructions;
- private keys;
- partner API secrets;
- “approved investment” boolean pretending SANA owns the regulated decision.

---

# 31. Consent and privacy boundary

`consent_set_ref` is a reference, not a blanket permission.

Separate purposes must remain distinguishable:

- operational/agronomic data use;
- readiness/financing data use;
- financial-partner sharing;
- impact reporting;
- public case/story/photo use.

Public storytelling consent must never be inferred from readiness consent.

The readiness schema should store only the consent-set reference needed to prove the applicable data-use basis; consent content/version belongs in the appropriate consent/privacy system.

---

# 32. Candidate commands — classification only

No command is implemented or authorized by this document.

| Candidate | Classification | Persistence implication |
|---|---|---|
| `CreateCapitalPilotIntake` | likely canonical | intake + initial transition |
| `ChangeCapitalPilotIntakeState` | likely canonical | append intake transition |
| `StartReadinessAssessment` | defer semantic object | no draft assessment table yet |
| `RecordReadinessGateAssessment` | internal transaction step | child row of final decision transaction |
| `OpenReadinessGap` | internal/final assessment step initially | immutable gap + OPEN transition |
| `SubmitReadinessGapEvidence` | likely canonical later | gap transition/evidence refs |
| `ResolveReadinessGap` | likely canonical later | append transition |
| `WaiveReadinessGap` | canonical + elevated human authority | append transition + rationale |
| `RecordReadinessDecision` | canonical | atomic assessment/gates/gaps transaction |
| `RequireReadinessReassessment` | likely canonical | future transition/invalidation fact |

Prefer aggregate commands over externally exposing “insert gate row” primitives.

---

# 33. Candidate events — classification only

No event is published by this proposal.

| Candidate | Recommended class | Notes |
|---|---|---|
| `CapitalPilotIntakeCreated` | canonical candidate | durable business fact |
| `CapitalPilotIntakeStateChanged` | canonical candidate | lifecycle fact |
| `CapitalReadinessAssessmentStarted` | defer | no durable draft aggregate yet |
| `CapitalReadinessGateEvaluated` | internal/audit initially | avoid noisy public semantic contract |
| `CapitalReadinessGapOpened` | canonical candidate | material blocker/condition |
| `CapitalReadinessGapStateChanged` | canonical candidate | material remediation state |
| `CapitalReadinessDecisionRecorded` | canonical candidate | high-value durable fact |
| `CapitalReadinessReassessmentRequired` | canonical candidate | meaningful downstream trigger |
| `EvidenceManifestProjected` | projection/audit | not canonical business truth |
| `ProductiveRiskProfileProjected` | projection/audit | not canonical business truth |
| `CapitalReadinessPackageProjected` | projection/audit | not canonical business truth |
| `CapitalReadinessControlModelBuilt` | telemetry only | UI/read-model concern |

Event publication should occur only when a real downstream consumer and stable semantic contract justify it.

---

# 34. No automatic eligibility coupling

Persistence does not change the D0 decision:

```text
ReadinessAssessment
  ≠ InvestmentProject.eligibility
```

First migration must not create:

- trigger `CAPITAL_READY → ELIGIBLE`;
- trigger `NOT_CAPITAL_READY → INELIGIBLE`;
- project-state auto approval;
- capital deployment authorization.

If a compatibility policy is approved later, it must be explicit, versioned, independently tested and human-governed.

---

# 35. No Control→Invest mutation coupling in INT1.6

Control Tower and the read-only CONTROL model remain projections.

The database migration must not make:

```text
ControlTowerException.RESOLVED
```

a trigger for:

```text
ReadinessGap.RESOLVED
```

Future safe flow remains:

```text
human CONTROL action
→ authorized canonical command
→ readiness persistence transition
→ projector rebuild
→ Control exception naturally closes/reopens
```

That bridge is a separate INT1.7 authority design.

---

# 36. AI boundary in persistence

AI can later draft:

- evidence summary;
- missing-information suggestions;
- remediation options;
- readiness memo.

AI may not directly insert:

- final `readiness_assessment` as reviewer authority;
- gap WAIVED transition;
- financial commitment/deployment;
- project eligibility/state changes;
- partner disbursement refs pretending execution occurred.

Database rows must carry the human actor reference where human authority is required.

---

# 37. Integrity responsibilities: DB vs domain service

## Database must enforce

- tenant/project relational scope;
- valid vocabularies;
- digest shapes;
- numeric ranges;
- uniqueness/version collisions;
- append-only identity/history;
- legal transition chains;
- exactly G1–G9 at final commit;
- obvious decision/gap contradictions;
- transition chronology;
- RLS/tenant isolation.

## Domain service must enforce

- policy-specific evidence requirements;
- evidence freshness against evaluation as-of;
- evidence quality/confidence acceptance;
- deterministic risk-profile calculation;
- deterministic maximum decision;
- human authorization through identity/access;
- agronomic meaning;
- market/impact methodology.

Do not duplicate the entire policy engine in SQL.

---

# 38. Rollback / forward-fix strategy

Once a migration reaches a shared environment:

- never rewrite the migration file;
- schema defects get a forward migration;
- canonical rows are not deleted to “rollback a decision”;
- wrong assessment is superseded by a new version / explicit correction workflow;
- feature flag/read-path can disable readiness persistence use without destroying records.

Because this schema is additive, code rollback should be able to ignore the new tables while preserving data.

---

# 39. Observability

Persistence adapter should emit operational telemetry, not business-state duplicates:

```text
readiness_intake_insert_success/failure
readiness_transition_conflict
readiness_assessment_version_conflict
readiness_assessment_commit_success/failure
readiness_rls_denied
readiness_integrity_rejected
readiness_rebuild_digest_mismatch
```

Never log:

- raw secrets;
- unnecessary personal data;
- full provider payloads;
- bank/payment credentials.

---

# 40. Migration acceptance gates

A future implementation PR must not be merged until:

## Static

- migration structural lint PASS;
- no destructive table rewrites;
- no new workspace;
- no event-semantic regression.

## Real PostgreSQL

- clean database migration PASS;
- migration on realistic prior schema PASS;
- all FKs/unique constraints created successfully;
- RLS + FORCE RLS adversarial tests PASS using non-owner app role;
- immutable privilege tests PASS;
- transition triggers PASS/fail as expected;
- deferred exactly-nine-gate integrity PASS/fail as expected;
- decision-gap matrix PASS/fail as expected;
- concurrency/version collision tests PASS;
- transaction atomicity tests PASS.

## Existing runtime regression

- 41-workspace persistence PASS;
- offline `npm ci` PASS;
- root strict TypeScript PASS;
- INT1.1 deterministic/hardening PASS;
- Control readiness projection PASS;
- read-only CONTROL readiness model PASS;
- existing CONTROL acceptance gates PASS.

---

# 41. Proposed implementation split after design approval

Do not implement everything in one oversized PR.

### INT1.6A — schema foundation

- project/budget composite-key prerequisites;
- intake + intake transitions;
- assessment + G1–G9 + gaps + gap transitions;
- vocabulary/checks/FKs;
- RLS/FORCE RLS;
- immutable grants;
- no adapter yet.

### INT1.6B — PostgreSQL adversarial harness

- role setup;
- tenant isolation;
- composite-scope attacks;
- append-only tests;
- transition chain;
- G1–G9 deferred constraints;
- decision/gap matrix;
- concurrency collisions.

Prefer this harness in the same PR as schema if review size remains manageable; otherwise stack immediately before runtime adapter.

### INT1.6C — persistence adapter

- hydrate intake current state from transitions;
- atomic final assessment persistence;
- fold gap current states;
- digest/scope checks;
- optimistic version conflict mapping.

### INT1.6D — read-path integration

- read persisted final assessment;
- rebuild current projection;
- compare expected digests;
- no mutation from CONTROL yet.

### INT1.7 — authority bridge, separately reviewed

Only after persistence is proven:

- human CONTROL action → canonical command;
- permissions;
- gap evidence submission/resolution/waiver;
- no direct local UI mutation.

---

# 42. Open questions that must be answered before migration

1. Does the real PostgreSQL runtime already have an eligible unique key for `(tenant_id, project_id, version)` on `budget_version`, as assumed by current hardening SQL?
2. What exact application database role will own/read/write readiness tables, and is it non-owner?
3. Is `source_risk_digest_sha256` promoted into the persisted assessment contract now, or stored only as adapter metadata until the TypeScript contract is extended?
4. Should initial gap lifecycle allow direct `OPEN → RESOLVED`, or require `EVIDENCE_SUBMITTED` first for some gate/policy classes?
5. Which permission authorizes `WAIVED`, and does it vary by blocking gate?
6. Which exact events deserve canonical publication in the first persistence release versus internal audit only?
7. What artifact store will eventually preserve externally published readiness manifests/packages by digest?
8. What retention/privacy rules apply to readiness evidence and external partner sharing in the first real financing pilot?

None of these questions justify weakening tenant isolation or financial-authority boundaries.

---

# 43. Approval statement candidate

If this design is accepted, the approved statement should be:

> CAPITAL_READINESS persistence will be additive inside `agroway_invest`. Canonical intake/assessment/gate/gap facts will preserve history through immutable rows and append-only transitions, with tenant/project composite FKs, forced tenant RLS, immutable runtime privileges, contiguous version/transition constraints and deferred final-assessment integrity. Evidence, risk, package and CONTROL outputs remain deterministic projections bound by digests; no readiness persistence path will create a second agricultural master, mutate project eligibility automatically, move money, custody funds, approve financing, or grant AI decision authority.

Approval authorizes **a separate migration implementation PR**, not production rollout, financial-partner integration, D10 Product Approval, or money movement.

---

# 44. Final conclusion

The persistence layer should protect the strategic asset SANA is trying to build:

```text
WHO / WHAT PROJECT
↔ PRODUCTIVE SCOPE
↔ EVIDENCE
↔ G1–G9 DECISION BASIS
↔ RISK
↔ GAPS / REMEDIATION
↔ HUMAN DECISION
↔ REASSESSMENT HISTORY
```

The database should make this history harder to falsify, overwrite or cross-contaminate between tenants.

It should **not** turn AGROWAY into a bank ledger.

The correct next step after approval is a small, additive, real-PostgreSQL-tested migration with adversarial RLS and integrity gates—not a wallet, marketplace, financial recommendation engine, or UI that implies guaranteed financing.
