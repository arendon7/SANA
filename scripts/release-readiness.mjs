import fs from 'node:fs';
const production=process.argv.includes('--production');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const acceptance=JSON.parse(fs.readFileSync('config/product/control-operational-acceptance.json','utf8'));
const requiredTargets={
  'validate:local-dev-backend':'scripts/validate-local-dev-backend.mjs',
  'test:local-dev-backend-http':'scripts/local-dev-backend-http-runtime.mjs',
  'qa:local-dev-backend-browser':'scripts/local-dev-backend-browser-qa.py',
  'release:readiness':'scripts/release-readiness.mjs'
};
const checks=[];const check=(name,value)=>{checks.push({name,pass:!!value});if(!value)console.error(`FAIL ${name}`)};
for(const [script,target] of Object.entries(requiredTargets)){check(`script:${script}:declared`,typeof pkg.scripts?.[script]==='string');check(`script:${script}:target`,fs.existsSync(target))}
check('control:review-status',acceptance.overallStatus==='REVIEW_READY_WITH_EXPLICIT_GAPS');check('control:no-production-pass',!acceptance.capabilities.some(x=>x.status==='PRODUCTION_PASS'));check('control:human-only',acceptance.authority.approval==='HUMAN_ONLY');check('control:ai-advisory',acceptance.authority.ai==='ADVISORY_ONLY');check('control:not-executed',acceptance.authority.executionState==='NOT_EXECUTED'&&acceptance.authority.canonicalMutated===false);
const failed=checks.filter(x=>!x.pass);
if(failed.length){console.error(JSON.stringify({state:'REPOSITORY_RELEASE_READINESS_FAILED',failed:failed.map(x=>x.name)},null,2));process.exit(1)}
if(production){const blockers=acceptance.productionBlockers||[];const ready=acceptance.productionReady===true&&acceptance.d10==='APPROVED'&&blockers.length===0;if(!ready){console.error(JSON.stringify({state:'BLOCKED_PRODUCTION_READINESS',productionReady:false,d10:acceptance.d10,blockers},null,2));process.exit(2)}console.log('PASS_PRODUCTION_RELEASE_READINESS');process.exit(0)}
console.log(JSON.stringify({state:'REVIEW_RELEASE_READY',reviewReady:true,productionReady:acceptance.productionReady,d10:acceptance.d10,productionBlockers:acceptance.productionBlockers,checks:checks.length},null,2));
