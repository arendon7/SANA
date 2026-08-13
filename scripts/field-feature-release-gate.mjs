#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const feature=process.argv[process.argv.indexOf('--feature')+1]||'';
const configByFeature={
  'field-home':null,
  'cycle-workspace':'crop-cycle-workspace.json',
  'task-evidence':'task-evidence-capture.json',
  'inventory-application':'inventory-application.json',
  'monitoring-incident':'monitoring-incident.json',
  'passport-assembly':'passport-assembly.json',
  'harvest-sale-settlement':'harvest-sale-settlement.json',
  'offline-sync-review':'offline-sync-review.json'
};
if(!(feature in configByFeature)){console.error(`UNKNOWN_FIELD_FEATURE:${feature}`);process.exit(2);}
const validation=spawnSync(process.execPath,['scripts/validate-field-feature.mjs','--feature',feature],{stdio:'inherit'});if(validation.status!==0)process.exit(validation.status??1);
const configName=configByFeature[feature];
if(!configName){console.log(JSON.stringify({status:'READY_FOR_PRODUCT_APPROVAL',feature,d10:'NO_FEATURE_SPECIFIC_D10_EVIDENCE',productionClaimed:false},null,2));process.exit(0);}
const spec=JSON.parse(fs.readFileSync(`config/design/screens/${configName}`,'utf8'));
const d9=spec.gates?.D9_qa;
if(d9!==undefined&&!String(d9).startsWith('PASS_')){console.error(`BLOCKED_D9_BROWSER_QA_PENDING:${feature}`);process.exit(2);}
const d10=spec.gates?.D10_humanProductApproval??spec.humanProductApproval??'PENDING';
if(!['PASS','APPROVED','NOT_REQUIRED'].includes(d10)){console.log(JSON.stringify({status:'READY_FOR_PRODUCT_APPROVAL',feature,d10,productionClaimed:false},null,2));process.exit(0);}
console.log(JSON.stringify({status:'PRODUCT_APPROVED',feature,d10,productionClaimed:false},null,2));
