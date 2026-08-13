# GREENATICS CONTROL — Production commissioning

Release candidate: `0.22.0-initial-rc2`

This runbook is for real-environment commissioning only. It does not approve D10, issue an activation lease, perform a canonical write, send an External ACK request, or create a production session.

## Preconditions

1. Use the exact RC2 head SHA and certified RC2 artifact SHA-256 from the successful exact-head CI run.
2. Build the reviewed production host from the same source head.
3. Supply production values through the deployment environment or secret manager. Never populate or commit `config/product/control-production-commissioning.env.template`.
4. Confirm `npm run release:readiness` reports review readiness and `npm run release:readiness:production` remains blocked before real bindings and D10 exist.

## Commissioning commands

### 1. Inspect the contract

```bash
npm run control:commissioning:describe
```

This prints required/conditional/optional environment keys and secret classification. It never prints environment values.

### 2. Validate production configuration without network probes

```bash
npm run control:commissioning:check-config
```

This delegates to the fixed reviewed production host `check-config` command. It validates the OIDC, PostgreSQL and External ACK configuration contracts without running provider connectivity probes.

### 3. Execute read-only provider preflights

```bash
npm run control:commissioning:preflight
```

The host performs only the reviewed read-only probes:

- OIDC/JWKS HTTPS GET and key-set validation;
- PostgreSQL TLS connection plus `current_database()` / application-name identity query;
- External ACK provider metadata HTTPS GET and protocol/key-set validation.

A successful result may reach `READY_FOR_D10_HUMAN_REVIEW`. Production execution remains disabled.

### 4. Capture redacted preflight evidence

```bash
npm run control:commissioning:capture-evidence
```

Evidence is written only when all three provider checks are `PASS`, D10 is still `PENDING`, binding evidence was issued by the reviewed bootstrap and the state is exactly `READY_FOR_D10_HUMAN_REVIEW`.

The fixed output is:

```text
dist/control-commissioning-evidence/PREFLIGHT_EVIDENCE.json
```

The evidence file contains candidate identifiers, check states and digests only. It does not contain environment values, database passwords, bearer credentials, private keys or D10 approval.

## D10 boundary

The commissioning runner has no D10 approval command and accepts no D10 approval payload. D10 remains a separate human product decision bound to the exact release candidate. Only after valid D10 evidence and the already-reviewed separation-of-duties activation ceremony may the activation gate be considered.

## Fail-closed behavior

Any missing/invalid environment value, candidate drift, host output mismatch or provider preflight failure returns a blocked state. `capture-evidence` does not write a D10-ready evidence file from a partial or failed preflight.

`productionReady=false` and `productionExecutionAvailable=false` remain the repository truth until the real bindings, D10 and explicit activation requirements are satisfied.
