#!/usr/bin/env node
import fs from 'node:fs';

const files=[
  'scripts/control-production-commissioning.mjs',
  'scripts/control-production-commissioning-runtime.mjs',
  'services/pilot-certifier/src/control-production-readiness.ts',
  'config/product/control-initial-rc2.json',
  'config/product/control-production-commissioning.env.template',
  'config/product/control-operational-acceptance.json',
  'docs/control/production-commissioning.md',
  'package.json'
];
let passed=0;const failures=[];const check=(name,value,detail='')=>{if(value){passed++;console.log(`PASS ${name}`);}else{failures.push({name,detail});console.error(`FAIL ${name}${detail?` :: ${detail}`:''}`);}};
for(const file of files)check(`file:${file}`,fs.existsSync(file));
const source=fs.readFileSync(files[0],'utf8');
const runtime=fs.readFileSync(files[1],'utf8');
const readiness=fs.readFileSync(files[2],'utf8');
const cfg=JSON.parse(fs.readFileSync(files[3],'utf8'));
const template=fs.readFileSync(files[4],'utf8');
const acceptance=JSON.parse(fs.readFileSync(files[5],'utf8'));
const docs=fs.readFileSync(files[6],'utf8');
const pkg=JSON.parse(fs.readFileSync(files[7],'utf8'));
const blockers=[
  'PRODUCTION_IDENTITY_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'PRODUCTION_POSTGRES_REAL_SECRET_BINDING_AND_CONNECTIVITY_PENDING',
  'EXTERNAL_ACK_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'D10_HUMAN_PRODUCT_APPROVAL_PENDING'
];
const requiredEnv=[
  'AGROWAY_CONTROL_RUNTIME_MODE','AGROWAY_CONTROL_BOOTSTRAP_MODE','AGROWAY_CONTROL_RELEASE_VERSION','AGROWAY_CONTROL_GIT_HEAD_SHA','AGROWAY_CONTROL_REVIEW_BUNDLE_SHA256',
  'AGROWAY_OIDC_ISSUER','AGROWAY_OIDC_JWKS_URI','AGROWAY_OIDC_AUDIENCE','AGROWAY_OIDC_TENANT_CLAIM','AGROWAY_OIDC_SESSION_CLAIM','AGROWAY_OIDC_MFA_AMR_VALUES',
  'AGROWAY_POSTGRES_HOST','AGROWAY_POSTGRES_DATABASE','AGROWAY_POSTGRES_USER','AGROWAY_POSTGRES_PASSWORD','AGROWAY_POSTGRES_CA_PEM',
  'AGROWAY_EXTERNAL_ACK_PROVIDER_ID','AGROWAY_EXTERNAL_ACK_ENDPOINT','AGROWAY_EXTERNAL_ACK_METADATA_URI','AGROWAY_EXTERNAL_ACK_AUTH_MODE','AGROWAY_EXTERNAL_ACK_VERIFICATION_KEYS_JSON'
];
for(const token of ['AGROWAY_CONTROL_COMMISSIONING_V1','0.22.0-initial-rc2','describe','check-config','preflight','capture-evidence','dist/control-production-host/run.mjs','PREFLIGHT_EVIDENCE.json','READY_FOR_D10_HUMAN_REVIEW','COMMISSIONING_HOST_CANDIDATE_MISMATCH','COMMISSIONING_EVIDENCE_PREREQUISITES_NOT_MET'])check(`source:${token}`,source.includes(token));
check('source:commands-exact',source.includes("['describe','check-config','preflight','capture-evidence']"));
check('source:no-activate-command-literal',!source.includes("'activate'"));
check('source:no-http-listener',!source.includes('createServer(')&&!source.includes('.listen('));
check('source:no-browser-runtime',!source.includes('window.')&&!source.includes('document.'));
check('source:no-d10-input',!source.includes('approvalDigestSha256')&&!source.includes('computeD10ApprovalDigest'));
check('source:no-write-adapter',!source.includes('createCanonicalUnitOfWorkAfterConnectivityCertification')&&!source.includes('applyApproved'));
check('source:no-ack-send',!source.includes('.createTransport(')&&!source.includes('sendAck'));
check('source:no-session-creation',!source.includes('.verifySession('));
check('source:fixed-host-runner',source.includes("const FIXED_HOST_RUNNER=path.resolve('dist/control-production-host/run.mjs')"));
check('source:evidence-mode-0600',source.includes('mode:0o600'));
check('source:evidence-three-pass',source.includes("map.get('IDENTITY_PROVIDER_CONNECTIVITY')==='PASS'")&&source.includes("map.get('POSTGRES_CONNECTIVITY')==='PASS'")&&source.includes("map.get('EXTERNAL_ACK_PROVIDER_CONNECTIVITY')==='PASS'")&&source.includes("map.get('D10_HUMAN_PRODUCT_APPROVAL')==='PENDING'"));
check('runtime:adversarial',runtime.includes('candidate:host-drift-blocked')&&runtime.includes('capture:partial-no-file')&&runtime.includes('command:activate-forbidden')&&runtime.includes('host:malformed-checks-blocked'));
check('readiness:initial-rc-supported',readiness.includes('initial-rc[1-9]\\d*'));
check('config:release',cfg.release==='0.22.0-initial-rc2'&&cfg.stage==='INITIAL_PHASE_COMMISSIONING_CANDIDATE');
check('config:commissioning-protocol',cfg.commissioningBoundary.protocol==='AGROWAY_CONTROL_COMMISSIONING_V1');
check('config:commands-exact',JSON.stringify(cfg.commissioningBoundary.commands)===JSON.stringify(['describe','check-config','preflight','capture-evidence']));
check('config:no-activation-or-d10-command',cfg.commissioningBoundary.activationCommandAvailable===false&&cfg.commissioningBoundary.d10ApprovalCommandAvailable===false);
check('config:no-side-effects',cfg.commissioningBoundary.productionWriteAvailable===false&&cfg.commissioningBoundary.externalAckSendAvailable===false&&cfg.commissioningBoundary.productionSessionCreationAvailable===false);
check('config:evidence-gated',cfg.commissioningBoundary.evidenceRequiresAllThreeProviderChecksPass===true&&cfg.commissioningBoundary.evidenceStateRequired==='READY_FOR_D10_HUMAN_REVIEW'&&cfg.commissioningBoundary.evidenceContainsSecrets===false);
check('config:review-bundle-digest-source',cfg.releaseCandidateBinding.reviewBundleSha256Source==='SHA256_OF_DIST_CONTROL_INITIAL_RC2_MANIFEST_JSON'&&cfg.releaseCandidateBinding.reviewBundleSha256File==='dist/control-initial-rc2/MANIFEST.sha256');
check('config:actions-digest-not-review-digest',cfg.releaseCandidateBinding.githubActionsArtifactDigestIsTransportEvidenceOnly===true&&cfg.releaseCandidateBinding.githubActionsArtifactDigestMaySubstituteReviewBundleSha256===false);
check('config:authority',cfg.authority.approval==='HUMAN_ONLY'&&cfg.authority.ai==='ADVISORY_ONLY'&&cfg.authority.productionReady===false&&cfg.authority.productionExecutionAvailable===false&&cfg.authority.executionState==='NOT_EXECUTED'&&cfg.authority.canonicalMutated===false);
check('config:blockers-exact',JSON.stringify(cfg.productionBlockers)===JSON.stringify(blockers));
check('truth:blockers-exact',JSON.stringify(acceptance.productionBlockers)===JSON.stringify(blockers));
check('truth:not-production',acceptance.productionReady===false&&acceptance.d10==='PENDING'&&acceptance.authority.productionExecutionAvailable===false&&acceptance.authority.executionState==='NOT_EXECUTED'&&acceptance.authority.canonicalMutated===false);
check('truth:41-workspaces',Array.isArray(pkg.workspaces)&&pkg.workspaces.length===41&&cfg.sourceBaseline.rootWorkspaceCount===41);
check('truth:root-lock-unchanged',cfg.sourceBaseline.canonicalRootLockChanged===false&&cfg.sourceBaseline.externalNpmDependencyAdded===false);
for(const key of requiredEnv)check(`template:${key}`,new RegExp(`^${key}=`, 'm').test(template));
check('template:release-rc2',template.includes('AGROWAY_CONTROL_RELEASE_VERSION=0.22.0-initial-rc2'));
check('template:manifest-review-digest',template.includes('dist/control-initial-rc2/MANIFEST.sha256')&&template.includes('Do NOT substitute the GitHub Actions artifact ZIP digest')&&/^AGROWAY_CONTROL_REVIEW_BUNDLE_SHA256=<EXACT_SHA256_FROM_RC2_MANIFEST_SHA256>$/m.test(template));
check('template:no-private-key',!template.includes('BEGIN PRIVATE KEY'));
check('template:no-real-password',/^AGROWAY_POSTGRES_PASSWORD=<[^>]+>$/m.test(template));
check('template:no-real-bearer',/^AGROWAY_EXTERNAL_ACK_BEARER_TOKEN=<[^>]+>$/m.test(template));
check('template:no-real-ca',/^AGROWAY_POSTGRES_CA_PEM=<[^>]+>$/m.test(template));
check('docs:commands',docs.includes('control:commissioning:describe')&&docs.includes('control:commissioning:check-config')&&docs.includes('control:commissioning:preflight')&&docs.includes('control:commissioning:capture-evidence'));
check('docs:canonical-review-digest',docs.includes('dist/control-initial-rc2/MANIFEST.sha256')&&docs.includes('Do **not** substitute the GitHub Actions artifact ZIP digest')&&docs.includes('SHA-256 of `dist/control-initial-rc2/MANIFEST.json`'));
check('docs:d10-human-boundary',docs.includes('no D10 approval command')&&docs.includes('separate human product decision'));
check('docs:not-production',docs.includes('productionReady=false')&&docs.includes('productionExecutionAvailable=false'));
const expectedScripts={
  'control:commissioning:describe':'node scripts/control-production-commissioning.mjs describe',
  'control:commissioning:check-config':'node scripts/control-production-commissioning.mjs check-config',
  'control:commissioning:preflight':'node scripts/control-production-commissioning.mjs preflight',
  'control:commissioning:capture-evidence':'node scripts/control-production-commissioning.mjs capture-evidence'
};
for(const [name,command] of Object.entries(expectedScripts))check(`package:${name}`,pkg.scripts?.[name]===command);
if(failures.length){console.error(`FAIL_CONTROL_PRODUCTION_COMMISSIONING_STATIC ${passed}/${passed+failures.length}`);process.exit(1);}
console.log(JSON.stringify({status:'PASS',release:cfg.release,checks:passed,requiredEnvironmentKeys:requiredEnv.length,commands:cfg.commissioningBoundary.commands,reviewBundleDigestSource:cfg.releaseCandidateBinding.reviewBundleSha256Source,productionReady:false},null,2));
console.log(`PASS_CONTROL_PRODUCTION_COMMISSIONING_STATIC ${passed}/${passed}`);
