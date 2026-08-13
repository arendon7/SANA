#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

let passed=0;const failures=[];const check=(name,value,detail='')=>{if(value){passed++;console.log(`PASS ${name}`);}else{failures.push({name,detail});console.error(`FAIL ${name}${detail?` :: ${detail}`:''}`);}};
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sha256=buffer=>createHash('sha256').update(buffer).digest('hex');
const expectedBlockers=[
  'PRODUCTION_IDENTITY_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'PRODUCTION_POSTGRES_REAL_SECRET_BINDING_AND_CONNECTIVITY_PENDING',
  'EXTERNAL_ACK_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'D10_HUMAN_PRODUCT_APPROVAL_PENDING'
];
const expectedManifestPaths=[
  'package.json',
  'config/product/control-initial-rc2.json',
  'config/product/control-production-commissioning.env.template',
  'config/product/control-operational-acceptance.json',
  'config/product/control-alpha22-root-runtime-reconciliation.json',
  'config/product/control-alpha21-production-host.json',
  'config/product/control-alpha20-production-bootstrap.json',
  'config/product/control-alpha19-production-activation.json',
  'config/product/control-alpha18-production-readiness.json',
  'config/product/control-alpha17-external-ack-production-wiring.json',
  'config/product/control-alpha16-oidc-production-wiring.json',
  'config/product/control-alpha14-postgres-js-driver.json',
  'config/product/control-alpha13-postgres-production-wiring.json',
  'docs/control/production-commissioning.md',
  'services/pilot-certifier/src/control-production-readiness.ts',
  'scripts/release-readiness.mjs',
  'scripts/control-production-host.mjs',
  'scripts/build-control-production-host.mjs',
  'scripts/control-production-commissioning.mjs',
  'scripts/control-production-commissioning-runtime.mjs',
  'scripts/validate-control-production-commissioning.mjs',
  'scripts/control-production-readiness-runtime.mjs',
  'scripts/validate-control-production-readiness.mjs',
  'NEXT_ACTIONS.md','RELEASE_STATE.json'
].sort();
const cfg=readJson('config/product/control-initial-rc2.json');
const acceptance=readJson('config/product/control-operational-acceptance.json');
const readinessSource=fs.readFileSync('services/pilot-certifier/src/control-production-readiness.ts','utf8');
const pkg=readJson('package.json');
const out='dist/control-initial-rc2';
check('config:release',cfg.release==='0.22.0-initial-rc2');
check('config:stage',cfg.stage==='INITIAL_PHASE_COMMISSIONING_CANDIDATE'&&cfg.status==='REVIEW_AND_COMMISSIONING_READY_PENDING_REAL_BINDINGS');
check('config:rc1-provenance',cfg.sourceBaseline.initialRc1HeadSha==='52e75f285d0d040ba69558b96c0dacce4b89b8d1'&&cfg.sourceBaseline.initialRc1ArtifactDigest==='sha256:77c72425b391fd477647567fd1936c8ff803a313b151020f730d2e6328b40099');
check('config:41-workspaces',cfg.sourceBaseline.rootWorkspaceCount===41&&Array.isArray(pkg.workspaces)&&pkg.workspaces.length===41);
check('config:root-lock-unchanged',cfg.sourceBaseline.canonicalRootLockChanged===false&&cfg.sourceBaseline.externalNpmDependencyAdded===false);
const completed=Object.entries(cfg.initialPhaseScope).filter(([,v])=>v==='COMPLETE_FOR_REVIEW').map(([k])=>k);
check('scope:ten-code-boundaries-complete',completed.length===10,String(completed.length));
check('scope:version-gate-complete',cfg.initialPhaseScope.releaseCandidateVersionGate==='COMPLETE_FOR_REVIEW');
check('scope:commissioning-runner-complete',cfg.initialPhaseScope.productionCommissioningRunner==='COMPLETE_FOR_REVIEW');
check('scope:real-bindings-pending',cfg.initialPhaseScope.realProductionBindings==='PENDING_EXTERNAL_ENVIRONMENT');
check('scope:d10-pending',cfg.initialPhaseScope.humanProductApprovalD10==='PENDING_HUMAN');
check('version-gate:rc2-supported',readinessSource.includes('initial-rc[1-9]\\d*'));
check('authority:human-only',cfg.authority.approval==='HUMAN_ONLY'&&cfg.authority.ai==='ADVISORY_ONLY');
check('authority:not-production',cfg.authority.productionReady===false&&cfg.authority.productionExecutionAvailable===false&&cfg.authority.executionState==='NOT_EXECUTED'&&cfg.authority.canonicalMutated===false&&cfg.authority.browserWriteAllowed===false&&cfg.authority.realProductionActivationLeaseIssued===false);
check('truth:acceptance-not-production',acceptance.productionReady===false&&acceptance.d10==='PENDING'&&acceptance.authority.productionExecutionAvailable===false&&acceptance.authority.executionState==='NOT_EXECUTED'&&acceptance.authority.canonicalMutated===false);
check('truth:exact-four-blockers',JSON.stringify(cfg.productionBlockers)===JSON.stringify(expectedBlockers)&&JSON.stringify(acceptance.productionBlockers)===JSON.stringify(expectedBlockers));
check('artifact:directory',fs.existsSync(out));
check('artifact:manifest',fs.existsSync(path.join(out,'MANIFEST.json')));
check('artifact:release-state',fs.existsSync(path.join(out,'RELEASE_STATE.json')));
check('artifact:next-actions',fs.existsSync(path.join(out,'NEXT_ACTIONS.md')));
if(fs.existsSync(path.join(out,'MANIFEST.json'))){
  const manifest=readJson(path.join(out,'MANIFEST.json'));
  check('manifest:format',manifest.format==='AGROWAY_CONTROL_INITIAL_RC_V2');
  check('manifest:release',manifest.release==='0.22.0-initial-rc2');
  check('manifest:deterministic-offline-build',manifest.deterministic===true&&manifest.networkRequiredToBuild===false);
  check('manifest:commissioning-network-truth',manifest.commissioningNetworkRequiredForRealPreflight===true);
  check('manifest:no-secrets-or-approval',manifest.containsProductionSecrets===false&&manifest.containsD10Approval===false&&manifest.containsActivationLease===false);
  check('manifest:commissioning-not-production',manifest.commissioningReady===true&&manifest.productionReady===false);
  const actualPaths=Array.isArray(manifest.files)?manifest.files.map(x=>x.path):[];
  check('manifest:exact-file-count',actualPaths.length===expectedManifestPaths.length,`${actualPaths.length}/${expectedManifestPaths.length}`);
  check('manifest:exact-inventory',JSON.stringify(actualPaths)===JSON.stringify(expectedManifestPaths),JSON.stringify(actualPaths));
  check('manifest:sorted',JSON.stringify(actualPaths)===JSON.stringify([...actualPaths].sort()));
  for(const entry of manifest.files||[]){
    const full=path.join(out,entry.path);check(`manifest:file:${entry.path}`,fs.existsSync(full));
    if(fs.existsSync(full)){const bytes=fs.readFileSync(full);check(`manifest:sha256:${entry.path}`,sha256(bytes)===entry.sha256);check(`manifest:size:${entry.path}`,bytes.length===entry.size);}
  }
}
if(fs.existsSync(path.join(out,'RELEASE_STATE.json'))){
  const state=readJson(path.join(out,'RELEASE_STATE.json'));
  check('state:commissioning-candidate',state.state==='INITIAL_PHASE_COMMISSIONING_CANDIDATE'&&state.reviewReady===true&&state.commissioningReady===true);
  check('state:not-production',state.productionReady===false&&state.d10==='PENDING'&&state.productionExecutionAvailable===false&&state.executionState==='NOT_EXECUTED'&&state.canonicalMutated===false&&state.activationLeaseIssued===false);
  check('state:blockers',JSON.stringify(state.productionBlockers)===JSON.stringify(expectedBlockers));
}
const forbidden=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i,/\bBearer\s+[A-Za-z0-9._~-]{16,}/i,/client_secret\s*[=:]\s*["']?[^\s"']{8,}/i];
function walk(dir){for(const name of fs.readdirSync(dir)){const full=path.join(dir,name);const stat=fs.statSync(full);if(stat.isDirectory())walk(full);else{const rel=path.relative(out,full);check(`artifact:no-dotenv-file:${rel}`,!/(^|\/)\.env(?:\.|$)/.test(rel));const text=fs.readFileSync(full,'utf8');for(const pattern of forbidden)check(`artifact:no-secret-pattern:${rel}:${pattern.source.slice(0,24)}`,!pattern.test(text));}}}
if(fs.existsSync(out))walk(out);
const next=fs.existsSync(path.join(out,'NEXT_ACTIONS.md'))?fs.readFileSync(path.join(out,'NEXT_ACTIONS.md'),'utf8'):'';
check('next-actions:commissioning',next.includes('control:commissioning:check-config')&&next.includes('control:commissioning:preflight')&&next.includes('control:commissioning:capture-evidence'));
check('next-actions:d10-separate',next.includes('separate HUMAN_ONLY D10 product decision'));
check('next-actions:no-production-claim',next.includes('commissioning-ready, not production-ready'));
if(failures.length){console.error(`FAIL_CONTROL_INITIAL_RC2 ${passed}/${passed+failures.length}`);process.exit(1);}
console.log(JSON.stringify({status:'PASS',release:cfg.release,checks:passed,completedCodeBoundaries:completed.length,artifactFiles:expectedManifestPaths.length,productionBlockers:expectedBlockers.length,commissioningReady:true,productionReady:false},null,2));
console.log(`PASS_CONTROL_INITIAL_RC2 ${passed}/${passed}`);
