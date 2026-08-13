// Compatibility entrypoint for the pre-alpha15 INT1.7 validator name.
//
// The original harness compiled the identity-access root in isolation. That
// assumption became invalid once CONTROL alpha15 added the verified OIDC
// adapter and its Node crypto runtime. UX2B-0 now verifies the same authority
// boundary in two explicit layers instead of weakening either implementation:
//
// 1. readiness application commands / human authority semantics;
// 2. verified-session + durable-membership + immutable authorizer semantics.
//
// Keep this filename executable so historical CI/documentation does not point
// at a stale test that fails only because the integration topology evolved.
await import('./validate-capital-readiness-authority-ux2b0.mjs');
await import('./validate-capital-readiness-ux2b0-identity.mjs');
console.log('PASS_CAPITAL_READINESS_INT17_COMPAT_ON_UX2B0_ALPHA15');
