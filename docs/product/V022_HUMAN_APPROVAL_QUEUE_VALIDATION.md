# GREENATICS CONTROL v0.22.0-alpha5 — Human Approval Queue

Status: **CI GATED / D10 PENDING**  
Trust: **DEMO_RECONSTRUCTED**  
D10 Human Product Approval: **PENDING**

## Purpose

Concentrate risk-ranked proposals that require explicit human review while preserving a strict separation between recommendation, approval and execution.

## Authority contract

- AI-origin proposals remain `DRAFT_SUGGESTION`; AI never approves.
- LOW/MEDIUM require 1 HUMAN approval.
- HIGH/CRITICAL require 2 distinct HUMAN approvers.
- HIGH/CRITICAL require deterministic precheck `PASS` and FRESH evidence already `ACCEPTED_FOR_REVIEW`.
- A HUMAN requester cannot self-approve HIGH/CRITICAL proposals.
- Duplicate human approvers are rejected.
- Approval records bind `evidenceContextHashSha256` and `proposalDigestSha256` and form a SHA-256 predecessor chain.
- `APPROVED_FOR_SUBMISSION` never executes a domain action; `executionState` remains `NOT_EXECUTED`.
- Review state remains `localOnly=true` and `canonicalMutated=false`.

## Product continuity

Alpha5 adds `/control/approvals` while preserving `/control/evidence` and `/control/exceptions`. No canonical Domain Events or workspaces are added.

## Native CI scope

`.github/workflows/agroway-v022-control-alpha5.yml` runs syntax checks, pinned TypeScript 5.8.3 strict, alpha3 authority regression, alpha4 evidence-ledger regression, alpha5 static guardrails and Playwright 1.57.0 Chromium against the real Node HTTP server.

The browser gate validates blocked proposals, separation of duties, two independent HUMAN signatures for CRITICAL risk, SHA-256 approval-chain continuity, `NOT_EXECUTED`, local trust boundary, Service Worker, responsive behavior and regression of the evidence and exception routes.

The separate FIELD base root-lock/direct-monorepo persistence debt remains outside this scoped alpha5 PASS claim.
