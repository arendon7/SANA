import fs from 'node:fs';
const files=[
  'services/pilot-certifier/src/control-production-readiness.ts',
  'services/pilot-certifier/src/index.ts',
  'scripts/control-production-readiness-runtime.mjs',
  'config/product/control-alpha18-production-readiness.json'
];
let passed=0;const check=(name,value)=>{if(!value){console.error(`FAIL ${name}`);process.exitCode=1}else{passed++;console.log(`PASS ${name}`)}};
for(const file of files)check(`file:${file}`,fs.existsSync(file));
const source=fs.readFileSync(files[0],'utf8');
const index=fs.readFileSync(files[1],'utf8');
const cfg=JSON.parse(fs.readFileSync(files[3],'utf8'));
for(const token of [
  'AGROWAY_CONTROL_PRODUCTION_READINESS_V1','AGROWAY_CONTROL_D10_PRODUCT_APPROVAL_V1','Promise.allSettled',
  'JWKS_CONNECTED_READ_ONLY_PROBE','CONNECTED_READ_ONLY_PROBE','EXTERNAL_ACK_PROVIDER_METADATA_CONNECTED_READ_ONLY_PROBE',
  'D10_HUMAN_ACTOR_REQUIRED','D10_RELEASE_CANDIDATE_BINDING_MISMATCH','D10_APPROVAL_DIGEST_MISMATCH',
  'READY_FOR_D10_HUMAN_REVIEW','READY_FOR_EXPLICIT_ACTIVATION_REVIEW','BLOCKED_PRODUCTION_PREREQUISITES','BLOCKED_INVALID_D10_EVIDENCE',
  'productionExecutionEnabled:false','canonicalWritePermitted:false','browserActivationAllowed:false','realProductionTokenVerified:false','realExternalAckObserved:false','canonicalMutated:false'
])check(`source:${token}`,source.includes(token));
check('source:no-write-uow',!source.includes('createCanonicalUnitOfWorkAfterConnectivityCertification'));
check('source:no-ack-transport',!source.includes('.createTransport('));
check('source:no-session-verification',!source.includes('.verifySession('));
check('source:no-browser',!source.includes('window.')&&!source.includes('document.'));
check('index:exported',index.includes("export * from './control-production-readiness.js';"));
check('config:version',cfg.version==='0.22.0-alpha18');
check('config:capability',cfg.capability==='PRODUCTION_READINESS_ORCHESTRATOR');
check('config:server-side',cfg.orchestrationBoundary.serverSideOnly===true&&cfg.orchestrationBoundary.browserInvocationAllowed===false);
check('config:no-write-port',cfg.orchestrationBoundary.writePortsAvailableToOrchestrator===false&&cfg.orchestrationBoundary.transportCreationAvailableToOrchestrator===false&&cfg.orchestrationBoundary.productionSessionCreationAvailableToOrchestrator===false);
check('config:four-prerequisites',cfg.prerequisites.length===4);
check('config:d10-human-only',cfg.d10Evidence.actorTypeRequired==='HUMAN'&&cfg.d10Evidence.aiApprovalForbidden===true);
check('config:digest-binding',cfg.d10Evidence.exactGitHeadShaBinding===true&&cfg.d10Evidence.exactReviewBundleSha256Binding===true&&cfg.d10Evidence.canonicalApprovalDigestSha256Required===true);
check('config:no-auto-activation',cfg.activationBoundary.automaticActivationForbidden===true&&cfg.activationBoundary.explicitActivationImplementationPresent===false);
check('config:not-production-execution',cfg.activationBoundary.productionExecutionEnabledByOrchestrator===false&&cfg.authority.productionExecutionAvailable===false);
check('config:authority',cfg.authority.approval==='HUMAN_ONLY'&&cfg.authority.ai==='ADVISORY_ONLY'&&cfg.authority.executionState==='NOT_EXECUTED'&&cfg.authority.canonicalMutated===false);
check('config:lock-unchanged',cfg.reproducibility.canonicalRootLockChanged===false&&cfg.reproducibility.canonicalWorkspaceCount===41&&cfg.reproducibility.workspacesAdded===0&&cfg.reproducibility.externalNpmDependencyAdded===false);
if(process.exitCode)process.exit(1);console.log(`PASS_CONTROL_PRODUCTION_READINESS_STATIC ${passed}/${passed}`);
