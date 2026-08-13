#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

if(!process.argv.includes('--sync')){
  console.log('DESIGN_SKILLS_SYNC_NOOP use --sync to reconcile a local approved skill bundle');
  process.exit(0);
}
const lockPath=path.resolve('config/design/skills.lock.json');
if(!fs.existsSync(lockPath)){
  console.error('BLOCKED_DESIGN_SKILLS_SYNC_LOCK_ABSENT');
  process.exit(2);
}
const sourceRoot=process.env.AGROWAY_DESIGN_SKILLS_SOURCE_DIR?path.resolve(process.env.AGROWAY_DESIGN_SKILLS_SOURCE_DIR):null;
if(!sourceRoot||!fs.existsSync(sourceRoot)){
  console.error('BLOCKED_DESIGN_SKILLS_SYNC_SOURCE_DIR_ABSENT');
  process.exit(2);
}
const lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
const skills=Array.isArray(lock.skills)?lock.skills:[];
if(!skills.length){console.error('BLOCKED_DESIGN_SKILLS_SYNC_LOCK_EMPTY');process.exit(2);}
const allowedRoot=path.resolve('.agroway/design-skills');
fs.mkdirSync(allowedRoot,{recursive:true});
const synced=[];
for(const skill of skills){
  const id=String(skill.id||'').trim();
  const sourceSubdir=String(skill.sourceSubdir||id).trim();
  const localPath=String(skill.localPath||path.join('.agroway/design-skills',id)).trim();
  if(!id)throw new Error('DESIGN_SKILL_ID_REQUIRED');
  const src=path.resolve(sourceRoot,sourceSubdir);
  const dest=path.resolve(localPath);
  if(!(src===sourceRoot||src.startsWith(sourceRoot+path.sep)))throw new Error(`DESIGN_SKILL_SOURCE_OUTSIDE_ROOT:${id}`);
  if(!(dest===allowedRoot||dest.startsWith(allowedRoot+path.sep)))throw new Error(`DESIGN_SKILL_DEST_OUTSIDE_ALLOWED_ROOT:${id}`);
  if(!fs.existsSync(src))throw new Error(`DESIGN_SKILL_SOURCE_MISSING:${id}`);
  fs.rmSync(dest,{recursive:true,force:true});
  fs.cpSync(src,dest,{recursive:true,errorOnExist:false,force:true});
  synced.push({id,localPath:path.relative(process.cwd(),dest)});
}
console.log(JSON.stringify({status:'PASS',synced,networkUsed:false,sourceKind:'LOCAL_APPROVED_BUNDLE'},null,2));
console.log(`PASS_DESIGN_SKILLS_SYNC ${synced.length}/${synced.length}`);
