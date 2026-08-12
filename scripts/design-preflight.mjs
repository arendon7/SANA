#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const requireSkills=process.argv.includes('--require-skills');
const governance=spawnSync(process.execPath,['scripts/design-governance-gate.mjs'],{stdio:'inherit'});
if(governance.status!==0)process.exit(governance.status??1);
const skillArgs=['scripts/design-skills-status.mjs'];
if(requireSkills)skillArgs.push('--require-skills');
const skills=spawnSync(process.execPath,skillArgs,{stdio:'inherit'});
if(skills.status!==0)process.exit(skills.status??1);
console.log(JSON.stringify({status:'PASS',mode:requireSkills?'STRICT_EXTERNAL_SKILLS_REQUIRED':'OFFLINE_REPOSITORY_CONTRACTS',externalSkillsRequired:requireSkills,networkUsed:false},null,2));
console.log(requireSkills?'PASS_DESIGN_PREFLIGHT_STRICT':'PASS_DESIGN_PREFLIGHT');
