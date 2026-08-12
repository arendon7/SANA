#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dir=path.resolve('config/design/screens');
const failures=[];
const checks=[];
function check(ok,name,detail=''){
  if(ok)checks.push(name);else failures.push({name,detail});
}
check(fs.existsSync(dir),'screens-directory-present',dir);
const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort():[];
check(files.length>0,'screen-contracts-present',String(files.length));
const ids=new Set();
for(const file of files){
  const full=path.join(dir,file);let doc;
  try{doc=JSON.parse(fs.readFileSync(full,'utf8'));check(true,`${file}:valid-json`);}catch(error){check(false,`${file}:valid-json`,error.message);continue;}
  check(doc&&typeof doc==='object'&&!Array.isArray(doc),`${file}:object`);
  check(typeof doc.id==='string'&&doc.id.trim().length>0,`${file}:id`);
  if(typeof doc.id==='string'){
    check(!ids.has(doc.id),`${file}:unique-id`,doc.id);ids.add(doc.id);
  }
  check(typeof doc.status==='string'&&doc.status.trim().length>0,`${file}:status`);
  if('version' in doc)check(typeof doc.version==='string'&&doc.version.trim().length>0,`${file}:version`);
  if('designDirection' in doc)check(typeof doc.designDirection==='string'&&doc.designDirection.trim().length>0,`${file}:design-direction`);
  if('requiredViewports' in doc){
    check(Array.isArray(doc.requiredViewports)&&doc.requiredViewports.length>0,`${file}:required-viewports`);
    if(Array.isArray(doc.requiredViewports))for(const viewport of doc.requiredViewports)check(/^\d{2,5}x\d{2,5}$/.test(String(viewport)),`${file}:viewport:${viewport}`);
  }
  if('invariants' in doc)check(Array.isArray(doc.invariants)&&doc.invariants.every(x=>typeof x==='string'&&x.trim()),`${file}:invariants`);
  if('humanProductApproval' in doc)check(['PENDING','PASS','APPROVED','NOT_REQUIRED'].includes(doc.humanProductApproval),`${file}:human-product-approval`,String(doc.humanProductApproval));
  const status=String(doc.status||'');
  if(/PRODUCT_APPROVED/.test(status)&&'humanProductApproval' in doc)check(['PASS','APPROVED'].includes(doc.humanProductApproval),`${file}:approved-status-requires-human-pass`,String(doc.humanProductApproval));
  if(String(doc.trust||'').includes('NOT_PRODUCTION'))check(!/PRODUCTION_READY|PRODUCTION_APPROVED/.test(status),`${file}:non-production-trust-no-production-claim`,status);
}
if(failures.length){
  for(const failure of failures)console.error(`FAIL ${failure.name}${failure.detail?` :: ${failure.detail}`:''}`);
  console.error(`FAIL_DESIGN_GOVERNANCE ${checks.length}/${checks.length+failures.length}`);
  process.exit(1);
}
console.log(JSON.stringify({status:'PASS',screenContracts:files.length,checks:checks.length,authority:'HUMAN_PRODUCT_APPROVAL_PRESERVED',networkUsed:false},null,2));
console.log(`PASS_DESIGN_GOVERNANCE ${checks.length}/${checks.length}`);
