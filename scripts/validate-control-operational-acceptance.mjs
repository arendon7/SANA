import fs from 'node:fs';
const p='config/product/control-operational-acceptance.json';
const m=JSON.parse(fs.readFileSync(p,'utf8'));
const out=[];const check=(n,v)=>{out.push({name:n,pass:!!v});console.log(`${v?'PASS':'FAIL'} ${n}`)};
check('status:review-ready-with-gaps',m.overallStatus==='REVIEW_READY_WITH_EXPLICIT_GAPS');
check('status:not-production-ready',m.productionReady===false);
check('status:d10-pending',m.d10==='PENDING');
check('authority:human-only',m.authority.approval==='HUMAN_ONLY');
check('authority:ai-advisory-only',m.authority.ai==='ADVISORY_ONLY');
check('authority:not-executed',m.authority.executionState==='NOT_EXECUTED');
check('authority:no-canonical-mutation',m.authority.canonicalMutated===false);
check('delta:events-zero',m.domainDelta.canonicalDomainEventsAdded===0);
check('delta:workspaces-zero',m.domainDelta.workspacesAdded===0);
const byId=Object.fromEntries(m.capabilities.map(x=>[x.id,x]));
for(const id of ['EXCEPTION_RESOLUTION','EVIDENCE_PROVENANCE_LEDGER','HUMAN_APPROVAL_QUEUE','SUBMISSION_HANDOFF','UNIFIED_CONTROL_FLOW','AI_AUTHORITY_BOUNDARY','PWA_RESPONSIVE_REVIEW']){const c=byId[id];check(`review:${id}`,c?.status==='PASS_REVIEW');check(`review:${id}:evidence`,Array.isArray(c?.evidence)&&c.evidence.length>0)}
for(const [id,src] of [['CONTROL_TOWER_VISIBILITY','apps/control-web/src/home-model.ts'],['INVESTMENT_PROJECT_WORKSPACE','apps/control-web/src/investment-project-workspace-model.ts']]){const c=byId[id];check(`integration:${id}:pending`,c?.status==='PENDING_INTEGRATION');check(`integration:${id}:source-currently-absent`,!fs.existsSync(src));check(`integration:${id}:expected-source`,c?.expectedSource===src)}
for(const id of ['PRODUCTION_AUTHORIZATION','CANONICAL_WRITE_ADAPTER','EXTERNAL_ACK_ADAPTER'])check(`production:${id}:pending`,byId[id]?.status==='PENDING_PRODUCTION');
check('debt:direct-monorepo-separated',byId.DIRECT_MONOREPO_ROOT_LOCK?.status==='SEPARATE_DEBT');
const blockers=new Set(m.productionBlockers||[]);
for(const b of ['CONTROL_TOWER_HOME_NOT_MATERIALIZED_IN_ALPHA7_BRANCH','INVESTMENT_PROJECT_WORKSPACE_NOT_MATERIALIZED_IN_ALPHA7_BRANCH','PRODUCTION_AUTHORIZATION_NOT_ACCEPTED','CANONICAL_WRITE_ADAPTER_INTENTIONALLY_ABSENT','EXTERNAL_ACK_ADAPTER_ABSENT','DIRECT_MONOREPO_ROOT_LOCK_DEBT','D10_HUMAN_PRODUCT_APPROVAL_PENDING'])check(`blocker:${b}`,blockers.has(b));
check('truth:no-production-pass',!m.capabilities.some(x=>x.status==='PRODUCTION_PASS'));
const failed=out.filter(x=>!x.pass);console.log(`${failed.length?'FAIL':'PASS'}_CONTROL_OPERATIONAL_ACCEPTANCE ${out.length-failed.length}/${out.length}`);if(failed.length)process.exit(1);
