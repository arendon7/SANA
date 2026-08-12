#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const lockPath=path.resolve('config/design/skills.lock.json');
const result={status:'OPTIONAL_EXTERNAL_SKILLS_NOT_LOCKED',lockPath:'config/design/skills.lock.json',locked:false,available:0,missing:0,entries:[],networkUsed:false};
if(fs.existsSync(lockPath)){
  let lock;
  try{lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));}catch(error){console.error(`FAIL_DESIGN_SKILLS_LOCK_INVALID ${error.message}`);process.exit(1);}
  const entries=Array.isArray(lock.skills)?lock.skills:[];
  result.locked=true;result.status='LOCK_PRESENT';
  for(const entry of entries){
    const localPath=typeof entry.localPath==='string'?entry.localPath:'';
    const exists=Boolean(localPath)&&fs.existsSync(path.resolve(localPath));
    result.entries.push({id:String(entry.id||''),source:String(entry.source||''),localPath,exists});
    if(exists)result.available++;else result.missing++;
  }
  if(result.missing===0&&entries.length>0)result.status='ALL_LOCKED_SKILLS_AVAILABLE';
  else if(entries.length===0)result.status='LOCK_EMPTY';
  else result.status='LOCKED_SKILLS_MISSING_LOCALLY';
}
console.log(JSON.stringify(result,null,2));
if(process.argv.includes('--require-skills')){
  if(!result.locked||result.available===0||result.missing>0){
    console.error(`BLOCKED_DESIGN_SKILLS_REQUIRED ${result.status}`);
    process.exit(2);
  }
}
console.log('PASS_DESIGN_SKILLS_STATUS');
