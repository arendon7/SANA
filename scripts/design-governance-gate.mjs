#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dir=path.resolve('config/design/screens');
const failures=[];const checks=[];
function check(ok,name,detail=''){if(ok)checks.push(name);else failures.push({name,detail});}
check(fs.existsSync(dir),'screens-directory-present',dir);
const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort():[];
check(files.length>0,'screen-contracts-present',String(files.length));
const identities=new Set();
const approvalStates=new Set(['PENDING','PASS','APPROVED','NOT_REQUIRED']);
for(const file of files){
  const full=path.join(dir,file);let doc;
  try{doc=JSON.parse(fs.readFileSync(full,'utf8'));check(true,`${file}:valid-json`);}catch(error){check(false,`${file}:valid-json`,error.message);continue;}
  check(doc&&typeof doc==='object'&&!Array.isArray(doc),`${file}:object`);
  const identity=typeof doc.id==='string'&&doc.id.trim()?doc.id.trim():typeof doc.screen==='string'&&doc.screen.trim()?doc.screen.trim():'';
  check(Boolean(identity),`${file}:screen-identity`);
  if(identity){check(!identities.has(identity),`${file}:unique-screen-identity`,identity);identities.add(identity);}
  if('version' in doc)check(typeof doc.version==='string'&&doc.version.trim().length>0,`${file}:version`);
  if('status' in doc)check(typeof doc.status==='string'&&doc.status.trim().length>0,`${file}:status`);
  const direction=doc.designDirection??doc.direction;
  if(direction!==undefined)check(typeof direction==='string'&&direction.trim().length>0,`${file}:design-direction`);
  if('requiredViewports' in doc){check(Array.isArray(doc.requiredViewports)&&doc.requiredViewports.length>0,`${file}:required-viewports`);if(Array.isArray(doc.requiredViewports))for(const viewport of doc.requiredViewports)check(/^\d{2,5}x\d{2,5}$/.test(String(viewport)),`${file}:viewport:${viewport}`);}
  if('invariants' in doc)check(Array.isArray(doc.invariants)&&doc.invariants.every(x=>typeof x==='string'&&x.trim()),`${file}:invariants`);
  const d10=doc.humanProductApproval??doc.gates?.D10_humanProductApproval??doc.d10;
  if(d10!==undefined)check(approvalStates.has(String(d10)),`${file}:human-product-approval`,String(d10));
  const status=String(doc.status||'');
  if(/PRODUCT_APPROVED/.test(status)&&d10!==undefined)check(['PASS','APPROVED'].includes(String(d10)),`${file}:approved-status-requires-human-pass`,String(d10));
  const trustText=typeof doc.trust==='string'?doc.trust:JSON.stringify(doc.trust||{});
  if(/NOT_PRODUCTION|DEMO_RECONSTRUCTED/.test(trustText))check(doc.productionReady!==true&&doc.productionExecutionAvailable!==true,`${file}:non-production-trust-no-production-claim`);
  const events=doc.canonicalDomainEventsAdded??doc.domainDelta?.canonicalDomainEventsAdded;
  const workspaces=doc.workspacesAdded??doc.domainDelta?.workspacesAdded;
  if(events!==undefined)check(Number.isInteger(events)&&events>=0,`${file}:canonical-domain-event-delta`);
  if(workspaces!==undefined)check(Number.isInteger(workspaces)&&workspaces>=0,`${file}:workspace-delta`);
  check(Boolean(doc.status||d10!==undefined||doc.gates||doc.productionExecutionAvailable!==undefined||doc.browserCanInvokeAdapter!==undefined),`${file}:review-or-authority-state-present`);
}
if(failures.length){for(const failure of failures)console.error(`FAIL ${failure.name}${failure.detail?` :: ${failure.detail}`:''}`);console.error(`FAIL_DESIGN_GOVERNANCE ${checks.length}/${checks.length+failures.length}`);process.exit(1);}
console.log(JSON.stringify({status:'PASS',screenContracts:files.length,checks:checks.length,schemasAccepted:['ID_BASED','SCREEN_BASED'],authority:'HUMAN_PRODUCT_APPROVAL_PRESERVED',networkUsed:false},null,2));console.log(`PASS_DESIGN_GOVERNANCE ${checks.length}/${checks.length}`);
