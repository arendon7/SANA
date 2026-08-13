#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const scripts=pkg.scripts||{};
const direct=[];
const missing=[];

function normalizeTarget(raw){
  return raw.replace(/^['"]|['"]$/g,'').trim();
}

for(const [name,command] of Object.entries(scripts)){
  const segments=String(command).split(/\s*(?:&&|;)\s*/);
  for(const segment of segments){
    const match=segment.match(/(?:^|\s)(node|python(?:3)?)(?:\s+[^\s]+)*?\s+((?:scripts|apps|services|packages)\/[A-Za-z0-9._/@-]+\.(?:mjs|cjs|js|py|ts|tsx))(?:\s|$)/);
    if(!match)continue;
    const target=normalizeTarget(match[2]);
    const exists=fs.existsSync(path.resolve(target));
    direct.push({npmScript:name,runtime:match[1],target,exists});
    if(!exists)missing.push({npmScript:name,target});
  }
}

const unique=new Map();
for(const item of direct)unique.set(`${item.npmScript}:${item.target}`,item);
const result=[...unique.values()].sort((a,b)=>a.npmScript.localeCompare(b.npmScript)||a.target.localeCompare(b.target));
for(const item of result)console.log(`${item.exists?'PASS':'FAIL'} ${item.npmScript} -> ${item.target}`);
if(missing.length){
  console.error(JSON.stringify({status:'FAIL_ROOT_SCRIPT_TARGETS',missing},null,2));
  process.exit(1);
}
console.log(`PASS_ROOT_SCRIPT_TARGETS ${result.length}/${result.length}`);
