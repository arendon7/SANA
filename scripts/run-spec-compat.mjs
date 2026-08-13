#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const local=new Map();const failures=[];let checks=0;
const check=(ok,message)=>{checks++;if(!ok)failures.push(message);};
for(const workspace of pkg.workspaces||[]){const manifestPath=path.join(workspace,'package.json');check(fs.existsSync(manifestPath),`missing manifest ${manifestPath}`);if(!fs.existsSync(manifestPath))continue;const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));check(typeof manifest.name==='string',`workspace name missing ${workspace}`);if(manifest.name)local.set(manifest.name,{workspace,version:manifest.version,manifest});}
check(local.size===(pkg.workspaces||[]).length,`workspace-name uniqueness ${local.size}/${(pkg.workspaces||[]).length}`);
for(const {workspace,manifest} of local.values())for(const field of ['dependencies','devDependencies','peerDependencies','optionalDependencies'])for(const [name,range] of Object.entries(manifest[field]||{}))if(name.startsWith('@agroway/')){const target=local.get(name);check(Boolean(target),`${workspace}:${field}:${name} missing local target`);if(target)check(range===target.version,`${workspace}:${field}:${name} must pin exact ${target.version}, found ${range}`);}
for(const workspace of pkg.workspaces||[]){const indexCandidates=[path.join(workspace,'src/index.ts'),path.join(workspace,'src/index.tsx'),path.join(workspace,'index.ts'),path.join(workspace,'index.tsx')];check(indexCandidates.some(fs.existsSync),`${workspace} missing TypeScript index boundary`);}
if(failures.length){console.error(JSON.stringify({status:'FAIL_SPEC_COMPAT',checks,failures},null,2));process.exit(1);}console.log(JSON.stringify({status:'PASS_SPEC_COMPAT',checks,workspaces:local.size,exactLocalDependencyPolicy:true},null,2));
