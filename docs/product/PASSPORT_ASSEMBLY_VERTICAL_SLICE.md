# AGROWAY FIELD — Traceability Passport Assembly v0.21.0-alpha6

## Product intent

Turn the evidence already produced by FIELD into a deterministic completeness/eligibility workspace without allowing the field UI, offline device or AI to issue a certificate.

Information hierarchy:

`cycle identity -> required evidence chain -> canonical/local/missing status -> assembly digest -> gaps -> human certification boundary`.

## Required sections

1. Identity + crop cycle.
2. Agronomic plan.
3. Field execution evidence.
4. Input/application trace.
5. Monitoring/decision trace.
6. Harvest/output lot.

Each section is exactly one of `COMPLETE_CANONICAL`, `LOCAL_PENDING`, or `MISSING`.

## Deterministic preview states

- `MISSING_EVIDENCE`: one or more required sections are absent.
- `ASSEMBLY_READY`: all required evidence exists, but at least one section is still local/pending canonical acceptance.
- `ELIGIBLE_FOR_HUMAN_CERTIFICATION`: all required sections are accepted canonical snapshots.

`CERTIFIED` is intentionally not a state produced by this UI.

## Digest boundary

The screen computes a SHA-256 assembly digest over normalized evidence references when WebCrypto is available. This digest is only a preview integrity aid and is explicitly **not** the server-side certification decision digest. Real certification requires production evidence, a server-side deterministic eligibility decision, its exact digest and a named human signer.

## Trust boundary

- no raw provider payloads;
- no AI signing;
- no offline canonicalization;
- no certificate issuance;
- tenant/farm/plot/crop-cycle context is fixed in the assembly payload;
- local outbox evidence remains labeled local until canonical acceptance.
