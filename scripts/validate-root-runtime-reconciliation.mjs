import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cfg=JSON.parse(fs.readFileSync('config/product/control-alpha22-root-runtime-reconciliation.json','utf8'));
const acceptance=JSON.parse(fs.readFileSync('config/product/control-operational-acceptance.json','utf8'));
let passed=0;const check=(name,value)=>{if(!value){console.error(`FAIL ${name}`);process.exitCode=1}else{passed++;console.log(`PASS ${name}`)}};
const expected={
  'validate:local-dev-backend':'scripts/validate-local-dev-backend.mjs',
  'test:local-dev-backend-http':'scripts/local-dev-backend-http-runtime.mjs',
  'qa:local-dev-backend-browser':'scripts/local-dev-backend-browser-qa.py',
  'release:readiness':'scripts/release-readiness.mjs'
};
for(const [name,target] of Object.entries(expected)){check(`script:${name}:declared`,typeof pkg.scripts?.[name]==='string');check(`script:${name}:target-exists`,fs.existsSync(target));check(`script:${name}:target-bound`,pkg.scripts[name].includes(target))}
check('config:version',cfg.version==='0.22.0-alpha22');check('config:capability',cfg.capability==='ROOT_RUNTIME_RELEASE_SCRIPT_RECONCILIATION');check('config:four-scripts',cfg.reconciledScripts.length===4);check('config:root-lock-unchanged',cfg.scope.canonicalRootLockChanged===false&&cfg.scope.workspacesAdded===0&&cfg.scope.externalNpmDependencyAdded===false);check('config:local-loopback',cfg.localDevBackendTruth.bindAddress==='127.0.0.1'&&cfg.localDevBackendTruth.trust==='LOCAL_DEV_BACKEND_NOT_PRODUCTION');check('config:release-fail-closed',cfg.releaseReadinessTruth.productionStateWhileBlockersExist==='BLOCKED_PRODUCTION_READINESS'&&cfg.releaseReadinessTruth.productionReadinessExitCodeWhileBlocked===2);check('truth:not-production-ready',acceptance.productionReady===false&&acceptance.d10==='PENDING');check('truth:not-executed',acceptance.authority.executionState==='NOT_EXECUTED'&&acceptance.authority.canonicalMutated===false&&acceptance.authority.productionExecutionAvailable===false);check('truth:exact-four-blockers',acceptance.productionBlockers.length===4&&cfg.productionTruthUnchanged.blockers.every(x=>acceptance.productionBlockers.includes(x)));
const local=fs.readFileSync('scripts/validate-local-dev-backend.mjs','utf8');const release=fs.readFileSync('scripts/release-readiness.mjs','utf8');const browser=fs.readFileSync('scripts/local-dev-backend-browser-qa.py','utf8');
check('local:server-contract',local.includes('apps/field-web/server.mjs')&&local.includes('LOCAL_DEV_BACKEND_NOT_PRODUCTION'));check('release:no-production-invention',release.includes('BLOCKED_PRODUCTION_READINESS')&&release.includes('process.exit(2)'));check('browser:loopback',browser.includes('127.0.0.1')&&browser.includes('LOCAL_DEV_BACKEND_NOT_PRODUCTION'));check('browser:responsive',browser.includes('desktop')&&browser.includes('mobile')&&browser.includes('no-overflow'));
if(process.exitCode)process.exit(1);console.log(`PASS_ROOT_RUNTIME_RECONCILIATION ${passed}/${passed}`);
