# GREENATICS CONTROL — RC2 production commissioning operations

This document operationalizes the already-certified candidate `0.22.0-initial-rc2` without modifying or rebuilding it during commissioning.

## Immutable candidate identity

- Git head: `7f2a47a99b7df6a1682a588d714aca9a18026a95`
- Canonical review-bundle SHA-256 used by readiness/D10: `8b10c59c7a0f99b7ea81b08cd342afd2e62abca786453bccafde56e8642b9ceb`
- GitHub Actions artifact ID: `9164839137`
- Artifact name: `agroway-control-v022-initial-rc2`
- Certification workflow run: `31657254524`
- GitHub Actions ZIP transport SHA-256: `bf6ab3c667a9eb4568e61191d32410351adf9bd70ca4ab827fbd628173b4dcd3`
- Certified production-host aggregate SHA-256: `69a618ee3e44c0a55107f4703dc9a5bbd79ffa794dc6f9ea23d2895ba22a2840`
- Actions artifact expiry: `2026-08-27T01:18:17Z`

The transport digest is evidence for the uploaded ZIP only. It must not replace the canonical review-bundle digest in readiness or D10 evidence.

## Artifact acquisition rule

The live commissioning workflow downloads the **exact artifact produced by certification run `31657254524`**. It does not compile TypeScript, run `npm ci`, rebuild RC2 or silently fall back to source compilation.

After download, it verifies:

1. `dist/control-initial-rc2/MANIFEST.sha256` equals the canonical review/D10 digest above;
2. `MANIFEST.json` identifies release `0.22.0-initial-rc2`;
3. `dist/control-production-host/HOST_MANIFEST.json` identifies the same release and exact certified host aggregate SHA-256;
4. the production host passes its own `verify-layout` command.

If the certified Actions artifact expires or is unavailable, commissioning must fail closed. The remedy is a new certification or a durable copy whose provenance and digests are explicitly certified; **do not silently rebuild a replacement during commissioning**.

## GitHub Environment

Create/configure a GitHub Environment named exactly:

`control-production-commissioning`

Recommended protection:

1. Require at least one human reviewer before a deployment job can read environment secrets.
2. Do not allow self-approval where repository policy supports that restriction.
3. Keep PR review jobs at `contents: read`; the live commissioning job adds only `actions: read` to download the certified artifact.
4. Never store a D10 approval payload or activation lease in this environment.

## Environment variables

Configure these as GitHub Environment variables (`vars`):

- `AGROWAY_OIDC_ISSUER`
- `AGROWAY_OIDC_JWKS_URI`
- `AGROWAY_OIDC_AUDIENCE`
- `AGROWAY_OIDC_TENANT_CLAIM`
- `AGROWAY_OIDC_SESSION_CLAIM`
- `AGROWAY_OIDC_MFA_AMR_VALUES`
- `AGROWAY_OIDC_AAL2_ACR_VALUES` and/or `AGROWAY_OIDC_AAL3_ACR_VALUES`
- `AGROWAY_OIDC_ALLOWED_ALGORITHMS` (optional; reviewed default remains available)
- `AGROWAY_POSTGRES_HOST`
- `AGROWAY_POSTGRES_PORT` (optional)
- `AGROWAY_POSTGRES_DATABASE`
- `AGROWAY_POSTGRES_USER`
- `AGROWAY_POSTGRES_TLS_SERVERNAME` (optional when equal to host)
- `AGROWAY_EXTERNAL_ACK_PROVIDER_ID`
- `AGROWAY_EXTERNAL_ACK_ENDPOINT`
- `AGROWAY_EXTERNAL_ACK_METADATA_URI`
- `AGROWAY_EXTERNAL_ACK_AUTH_MODE`
- `AGROWAY_EXTERNAL_ACK_VERIFICATION_KEYS_JSON`

Optional bounded timeout/pool variables already supported by RC2 may also be configured as environment variables.

## Secrets

Configure only through GitHub Environment secrets or an approved external secret manager:

- `AGROWAY_POSTGRES_PASSWORD`
- `AGROWAY_POSTGRES_CA_PEM`
- `AGROWAY_EXTERNAL_ACK_BEARER_TOKEN` only when `AGROWAY_EXTERNAL_ACK_AUTH_MODE=BEARER`

The workflow never echoes these values and RC2's commissioning output is redacted by contract.

## Manual commissioning workflow

Use the workflow `GREENATICS CONTROL v0.22 RC2 production commissioning` and select one operation:

### `check-config`

Validates candidate identity and all provider configuration contracts. It performs no provider connectivity probe.

### `preflight`

Runs only the three reviewed read-only probes:

- OIDC/JWKS metadata/key-set verification;
- PostgreSQL TLS connection plus identity/read-only verification;
- External ACK provider metadata/protocol/key-set verification.

It cannot approve D10 or activate production.

### `capture-evidence`

Re-runs the reviewed preflight and writes `dist/control-commissioning-evidence/PREFLIGHT_EVIDENCE.json` only if all three external provider checks pass and the state is exactly `READY_FOR_D10_HUMAN_REVIEW` with D10 still pending. The workflow uploads only that redacted evidence file.

## Network boundary

The initial workflow uses a GitHub-hosted Ubuntu runner. Therefore the real IdP/JWKS URL, PostgreSQL endpoint and External ACK metadata endpoint must be reachable from that runner under their intended security policy.

If production PostgreSQL or another provider is private-network-only, do **not** weaken the firewall merely to satisfy commissioning. Use an approved private runner/network path and preserve the exact RC2 artifact, candidate SHA and review-bundle digest.

## D10 and activation remain separate

A successful commissioning run may remove the three real-binding/connectivity blockers from the evidence set, but it does not itself approve D10, issue an activation lease or execute a production side effect.

The required order remains:

`check-config -> preflight -> capture-evidence -> HUMAN_ONLY D10 -> separate activation ceremony`

Until those external/human steps are completed, repository truth remains `productionReady=false`, `productionExecutionAvailable=false`, `executionState=NOT_EXECUTED` and `canonicalMutated=false`.
