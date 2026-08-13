import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const required=[
  'packages/invest-control-contracts/src/readiness.ts',
  'services/investment-portfolio/src/readiness.ts',
  'services/investment-portfolio/src/readiness-persistence.ts',
  'services/investment-portfolio/src/readiness-authority.ts',
  'services/investment-portfolio/src/readiness-remediation.ts',
  'services/identity-access/src/capital-readiness-access.ts',
  'services/identity-access/src/postgres-membership.ts',
  'services/identity-access/src/capital-readiness-request-context.ts',
  'apps/control-web/public/capital-readiness.html',
  'apps/control-web/public/capital-readiness.js',
  'apps/control-web/public/capital-readiness.css',
  'apps/control-web/public/capital-remediation.css',
  'infra/postgres/migrations/0027_identity_membership_permissions.sql',
  'infra/postgres/migrations/0028_capital_readiness_persistence.sql',
  'infra/postgres/migrations/0028a_capital_readiness_transition_locking.sql',
  'infra/postgres/migrations/0028b_capital_readiness_tenant_trigger_guard.sql',
];
for(const path of required)if(!exists(path))throw new Error(`UX2B0_REQUIRED_FILE_MISSING:${path}`);
for(const forbidden of ['infra/postgres/migrations/0025_capital_readiness_persistence.sql','infra/postgres/migrations/0025a_capital_readiness_transition_locking.sql','infra/postgres/migrations/0025b_capital_readiness_tenant_trigger_guard.sql'])if(exists(forbidden))throw new Error(`UX2B0_MIGRATION_COLLISION:${forbidden}`);
const server=read('apps/control-web/server.mjs');
for(const route of ["'/control/capital'","'/control/capital/projects/hass-san-miguel'","'/control/capital/projects/hass-san-miguel/tasks'"])if(!server.includes(route))throw new Error(`UX2B0_ROUTE_REQUIRED:${route}`);
for(const token of ['CAPITAL_READINESS_BROWSER_MUTATION_NOT_ENABLED','productionDatabaseConfigured:false','canonicalMutated:false','financingApproval:false'])if(!server.includes(token))throw new Error(`UX2B0_SERVER_BOUNDARY_REQUIRED:${token}`);
const html=read('apps/control-web/public/capital-readiness.html');
const js=read('apps/control-web/public/capital-readiness.js');
for(const token of ['FIXTURE_SYNTHETIC','CAPITAL_READY ≠ financiación aprobada','Completemos tu proyecto','ReadinessGap'])if(!html.includes(token)&&!js.includes(token))throw new Error(`UX2B0_UI_TRUTH_REQUIRED:${token}`);
for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest/,/localStorage\s*\./,/sessionStorage\s*\./])if(pattern.test(html)||pattern.test(js))throw new Error(`UX2B0_BROWSER_MUTATION_FORBIDDEN:${pattern}`);
const access=read('services/identity-access/src/capital-readiness-access.ts');
for(const token of ["READ:'invest:read'","FINALIZE:'invest:readiness:finalize'","INVESTOR:Object.freeze([CAPITAL_READINESS_PERMISSIONS.READ])","defaultPermissionGrant:false","createMembershipPermissionAuthorizer"])if(!access.includes(token))throw new Error(`UX2B0_ACCESS_CONTRACT_REQUIRED:${token}`);
const membership=read('services/identity-access/src/postgres-membership.ts');
for(const token of ['granted_permissions AS "grantedPermissions"','MEMBERSHIP_NOT_FOUND','MEMBERSHIP_ROLE_UNKNOWN','identity:tenant-context'])if(!membership.includes(token))throw new Error(`UX2B0_MEMBERSHIP_LOADER_REQUIRED:${token}`);
const request=read('services/identity-access/src/capital-readiness-request-context.ts');
for(const token of ['VERIFIED_PRODUCTION_SESSION_PLUS_DURABLE_MEMBERSHIP','CAPITAL_REQUEST_AAL2_MFA_REQUIRED','callerSuppliedActorId:false','browserMutationEnabled:false'])if(!request.includes(token))throw new Error(`UX2B0_REQUEST_CONTEXT_REQUIRED:${token}`);
const identityMigration=read('infra/postgres/migrations/0027_identity_membership_permissions.sql');
if(!identityMigration.includes("DEFAULT ARRAY[]::text[]")||!identityMigration.includes('Existing memberships receive NO implicit Capital Readiness authority'))throw new Error('UX2B0_EXPLICIT_GRANT_MIGRATION_REQUIRED');
const investIndex=read('services/investment-portfolio/src/index.ts');
for(const exportName of ['postgres-control-write-adapter','postgres-production-wiring','postgres-js-pool-factory','readiness-authority','readiness-remediation'])if(!investIndex.includes(exportName))throw new Error(`UX2B0_ALPHA15_OR_CAPITAL_EXPORT_MISSING:${exportName}`);
const identityPackage=JSON.parse(read('services/identity-access/package.json'));
if(identityPackage.exports?.['./capital-readiness']!=='./src/capital-readiness-entry.ts')throw new Error('UX2B0_IDENTITY_SUBPATH_EXPORT_REQUIRED');
console.log('PASS_CAPITAL_READINESS_UX2B0_STATIC_INTEGRATION');
