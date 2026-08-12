#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { materializeCanonicalFieldPublic } from '../apps/field-web/public-bundle.mjs';

const feature=process.argv[process.argv.indexOf('--feature')+1]||'';
const specs={
  'field-home':{capability:'FIELD_HOME',model:'home-model.ts',config:null},
  'cycle-workspace':{capability:'CROP_CYCLE_WORKSPACE',model:'crop-cycle-model.ts',config:'crop-cycle-workspace.json'},
  'task-evidence':{capability:'TASK_EVIDENCE_CAPTURE',model:'task-evidence-model.ts',config:'task-evidence-capture.json'},
  'inventory-application':{capability:'INVENTORY_APPLICATION_WORKFLOW',model:'inventory-application-model.ts',config:'inventory-application.json'},
  'monitoring-incident':{capability:'MONITORING_INCIDENT_RESOLUTION',model:'monitoring-incident-model.ts',config:'monitoring-incident.json'},
  'passport-assembly':{capability:'TRACEABILITY_PASSPORT_ASSEMBLY',model:'passport-assembly-model.ts',config:'passport-assembly.json'},
  'harvest-sale-settlement':{capability:'HARVEST_SALE_SETTLEMENT_WORKSPACE',model:'harvest-sale-settlement-model.ts',config:'harvest-sale-settlement.json'},
  'offline-sync-review':{capability:'OFFLINE_SYNC_CONFLICT_REVIEW',model:'offline-sync-review-model.ts',config:'offline-sync-review.json'}
};
const spec=specs[feature];if(!spec){console.error(`UNKNOWN_FIELD_FEATURE:${feature}`);process.exit(2);}
let passed=0;const failures=[];const check=(name,value,detail='')=>{if(value){passed++;console.log(`PASS ${name}`);}else{failures.push({name,detail});console.error(`FAIL ${name}${detail?` :: ${detail}`:''}`);}};
const materialized=await materializeCanonicalFieldPublic();
check('public:canonical-materialized',materialized.archiveSha256==='1ea29026ccf160dfebc15b24f6f27408a8bff459be4c422e0791775520dcf00b'&&materialized.fileCount===5);
const assets=['index.html','app.js','styles.css','manifest.webmanifest','service-worker.js'];
for(const name of assets){const p=path.join('apps/field-web/public',name);check(`public:${name}`,fs.existsSync(p)&&fs.statSync(p).size>0);}
const jsCheck=spawnSync(process.execPath,['--check','apps/field-web/public/app.js'],{stdio:'pipe',encoding:'utf8'});check('public:app-js-syntax',jsCheck.status===0,jsCheck.stderr);
const index=fs.readFileSync('apps/field-web/src/index.ts','utf8');const modelPath=path.join('apps/field-web/src',spec.model);
check('feature:capability-exported',index.includes(`'${spec.capability}'`),spec.capability);check('feature:model-exported',index.includes(`./${spec.model.replace(/\.ts$/,'.js')}`),spec.model);check('feature:model-present',fs.existsSync(modelPath)&&fs.statSync(modelPath).size>0,modelPath);
if(spec.config){const configPath=path.join('config/design/screens',spec.config);check('design:contract-present',fs.existsSync(configPath),configPath);if(fs.existsSync(configPath)){const doc=JSON.parse(fs.readFileSync(configPath,'utf8'));check('design:id',typeof doc.id==='string'&&doc.id.length>0);check('design:status',typeof doc.status==='string'&&doc.status.length>0);if(doc.requiredViewports)check('design:viewports',Array.isArray(doc.requiredViewports)&&doc.requiredViewports.length>0);if(doc.gates?.D10_humanProductApproval)check('design:d10-valid',['PENDING','PASS'].includes(doc.gates.D10_humanProductApproval));if(doc.humanProductApproval)check('design:human-approval-valid',['PENDING','PASS','APPROVED','NOT_REQUIRED'].includes(doc.humanProductApproval));}}
check('trust:not-production',materialized.productionEquivalent===false&&materialized.trust==='LOCAL_DEV_BACKEND_NOT_PRODUCTION');
if(failures.length){console.error(JSON.stringify({status:'FAIL',feature,passed,failures},null,2));process.exit(1);}console.log(JSON.stringify({status:'PASS',feature,capability:spec.capability,checks:passed,publicBundleSha256:materialized.archiveSha256,trust:materialized.trust},null,2));
