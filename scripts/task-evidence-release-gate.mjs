import {spawnSync} from 'node:child_process';
const run=(cmd,args)=>spawnSync(cmd,args,{stdio:'inherit'}).status===0;
const staticPass=run(process.execPath,['scripts/validate-task-evidence.mjs']);
if(!staticPass){console.log('BLOCKED:TASK_EVIDENCE_STATIC');process.exit(1);}
const spec=JSON.parse((await import('node:fs')).readFileSync('config/design/screens/task-evidence-capture.json','utf8'));
if(!String(spec.gates.D9_qa).startsWith('PASS_')){console.log('BLOCKED:D9_BROWSER_QA_PENDING');process.exit(2);}
if(spec.gates.D10_humanProductApproval!=='PASS'){console.log('READY_FOR_PRODUCT_APPROVAL');process.exit(0);}
console.log('PRODUCT_APPROVED');
