#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

let passed=0;const failures=[];
const check=(name,value,detail='')=>{if(value){passed++;console.log(`PASS ${name}`);}else{failures.push({name,detail});console.error(`FAIL ${name}${detail?` :: ${detail}`:''}`);}};
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sha256=buffer=>createHash('sha256').update(buffer).digest('hex');
const expectedBlockers=[
  'PRODUCTION_IDENTITY_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'PRODUCTION_POSTGRES_REAL_SECRET_BINDING_AND_CONNECTIVITY_PENDING',
  'EXTERNAL_ACK_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'D10_HUMAN_PRODUCT_APPROVAL_PENDING'
];
const expectedManifestPaths=[
  'NEXT_ACTIONS.md',
  'RELEASE_STATE.json',
  'config/product/control-alpha13-postgres-production-wiring.json',
  'config/product/control-alpha14-postgres-js-driver.json',
  'config/product/control-alpha16-oidc-production-wiring.json',
  'config/product/control-alpha17-external-ack-production-wiring.json',
  'config/product/control-alpha18-production-readiness.json',
  'config/product/control-alpha19-production-activation.json',
  'config/product/control-alpha20-production-bootstrap.json',
  'config/product/control-alpha21-production-host.json',
  'config/product/control-alpha22-root-runtime-reconciliation.json',
  'config/product/control-initial-rc1.json',
  'config/product/control-operational-acceptance.json',
  'scripts/build-control-production-host.mjs',
  'scripts/control-production-host.mjs',
  'scripts/release-readiness.mjs'
];
const cfg=readJson('config/product/control-initial-rc1.json');
const acceptance=readJson('config/product/control-operational-acceptance.json');
const alpha22=readJson('config/product/control-alpha22-root-runtime-reconciliation.json');
const pkg=readJson('package.json');
const out='dist/control-initial-rc1';
check('config:release',cfg.release==='0.22.0-initial-rc1');
check('config:stage',cfg.stage==='INITIAL_PHASE_RELEASE_CANDIDATE'&&cfg.status==='REVIEW_CANDIDATE');
check('config:alpha22-baseline',cfg.sourceBaseline.controlAlpha22==='PASS_REPO_HARDENING'&&alpha22.status==='PASS_REPO_HARDENING');
check('config:41-workspaces',cfg.sourceBaseline.rootWorkspaceCount===41&&Array.isArray(pkg.workspaces)&&pkg.workspaces.length===41);
check('config:root-lock-unchanged',cfg.sourceBaseline.canonicalRootLockChanged===false&&cfg.sourceBaseline.externalNpmDependencyAdded===false);
const completed=Object.entries(cfg.initialPhaseScope).filter(([,v])=>v==='COMPLETE_FOR_REVIEW').map(([k])=>k);
check('scope:eight-code-boundaries-complete',completed.length===8,String(completed.length));
check('scope:real-bindings-pending',cfg.initialPhaseScope.realProductionBindings==='PENDING_EXTERNAL_ENVIRONMENT');
check('scope:d10-pending',cfg.initialPhaseScope.humanProductApprovalD10==='PENDING_HUMAN');
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
  check('manifest:format',manifest.format==='AGROWAY_CONTROL_INITIAL_RC_V1');
  check('manifest:release',manifest.release==='0.22.0-initial-rc1');
  check('manifest:deterministic-offline',manifest.deterministic===true&&manifest.networkRequired===false&&manifest.containsProductionSecrets===false);
  const actualPaths=Array.isArray(manifest.files)?manifest.files.map(x=>x.path):[];
  check('manifest:exact-file-count',actualPaths.length===expectedManifestPaths.length,`${actualPaths.length}/${expectedManifestPaths.length}`);
  check('manifest:exact-inventory',JSON.stringify(actualPaths)===JSON.stringify(expectedManifestPaths),JSON.stringify(actualPaths));
  const sorted=[...actualPaths].sort();check('manifest:sorted',JSON.stringify(actualPaths)===JSON.stringify(sorted));
  for(const entry of manifest.files||[]){
    const full=path.join(out,entry.path);check(`manifest:file:${entry.path}`,fs.existsSync(full));
    if(fs.existsSync(full)){const bytes=fs.readFileSync(full);check(`manifest:sha256:${entry.path}`,sha256(bytes)===entry.sha256);check(`manifest:size:${entry.path}`,bytes.length===entry.size);}
  }
}
if(fs.existsSync(path.join(out,'RELEASE_STATE.json'))){
  const state=readJson(path.join(out,'RELEASE_STATE.json'));
  check('state:review-candidate',state.state==='INITIAL_PHASE_REVIEW_CANDIDATE'&&state.reviewReady===true);
  check('state:not-production',state.productionReady===false&&state.d10==='PENDING'&&state.productionExecutionAvailable===false&&state.executionState==='NOT_EXECUTED'&&state.canonicalMutated===false);
  check('state:blockers',JSON.stringify(state.productionBlockers)===JSON.stringify(expectedBlockers));
}
const forbidden=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i,/\bBearer\s+[A-Za-z0-9._~-]{16,}/i,/client_secret\s*[=:]\s*["']?[^\s"']{8,}/i];
function walk(dir){for(const name of fs.readdirSync(dir)){const full=path.join(dir,name);const stat=fs.statSync(full);if(stat.isDirectory())walk(full);else{check(`artifact:no-env-file:${path.relative(out,full)}`,!/(^|\/)\.env(?:\.|$)/.test(path.relative(out,full)));const text=fs.readFileSync(full,'utf8');for(const pattern of forbidden)check(`artifact:no-secret-pattern:${path.relative(out,full)}:${pattern.source.slice(0,24)}`,!pattern.test(text));}}}
if(fs.existsSync(out))walk(out);
const next=fs.existsSync(path.join(out,'NEXT_ACTIONS.md'))?fs.readFileSync(path.join(out,'NEXT_ACTIONS.md'),'utf8'):'';
check('next-actions:bindings',next.includes('real production IdP')&&next.includes('PostgreSQL')&&next.includes('External ACK'));
check('next-actions:d10',next.includes('D10 human product approval'));
check('next-actions:no-production-claim',next.includes('review-ready, not production-ready'));
if(failures.length){console.error(`FAIL_CONTROL_INITIAL_RC ${passed}/${passed+failures.length}`);process.exit(1);}
console.log(JSON.stringify({status:'PASS',release:cfg.release,checks:passed,completedCodeBoundaries:completed.length,artifactFiles:expectedManifestPaths.length,productionBlockers:expectedBlockers.length,productionReady:false},null,2));
console.log(`PASS_CONTROL_INITIAL_RC ${passed}/${passed}`);
