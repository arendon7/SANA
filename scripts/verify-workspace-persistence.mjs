import fs from 'node:fs';
import path from 'node:path';

const VERSION='0.21.0-alpha10';
const EXPECTED_WORKSPACES=41;
const repaired=new Map([
  ['services/identity-access','RECONSTRUCTED_FROM_LOCK_AND_EXISTING_SOURCE'],
  ['services/investment-portfolio','RECONSTRUCTED_FROM_LOCK_CONTRACTS_MIGRATIONS_AND_PRODUCT_SURFACES'],
  ['services/control-tower-projector','RECONSTRUCTED_FROM_LOCK_CONTRACTS_MIGRATIONS_AND_PRODUCT_SURFACES'],
  ['services/knowledge-evidence-resolver','RECONSTRUCTED_FROM_LOCK_CONTRACTS_MIGRATIONS_AND_PRODUCT_SURFACES'],
  ['services/control-tower-copilot','RECONSTRUCTED_FROM_LOCK_CONTRACTS_MIGRATIONS_AND_PRODUCT_SURFACES'],
  ['services/pilot-certifier','RECONSTRUCTED_FROM_LOCK_CONTRACTS_MIGRATIONS_AND_PRODUCT_SURFACES'],
  ['services/pilot-replay-auditor','RECONSTRUCTED_FROM_LOCK_CONTRACTS_MIGRATIONS_AND_PRODUCT_SURFACES'],
]);

function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function stableObject(value){return Object.fromEntries(Object.entries(value??{}).sort(([a],[b])=>a.localeCompare(b)));}
function fail(code,detail=''){throw new Error(detail?`${code}:${detail}`:code);}

const root=readJson('package.json');
const lock=readJson('package-lock.json');
const workspaces=root.workspaces;
if(!Array.isArray(workspaces)) fail('ROOT_WORKSPACES_MISSING');
if(workspaces.length!==EXPECTED_WORKSPACES) fail('WORKSPACE_COUNT_MISMATCH',`${workspaces.length}`);
if(new Set(workspaces).size!==EXPECTED_WORKSPACES) fail('DUPLICATE_WORKSPACE_PATH');
const lockedRoot=lock.packages?.['']?.workspaces;
if(JSON.stringify(lockedRoot)!==JSON.stringify(workspaces)) fail('ROOT_LOCK_WORKSPACE_LIST_MISMATCH');

const names=new Set();
const nameToWorkspace=new Map();
for(const ws of workspaces){
  const pkgPath=path.join(ws,'package.json');
  const indexPath=path.join(ws,'src','index.ts');
  if(!fs.existsSync(pkgPath)) fail('MISSING_WORKSPACE_PACKAGE',ws);
  if(!fs.existsSync(indexPath)) fail('MISSING_WORKSPACE_INDEX',ws);
  const pkg=readJson(pkgPath);
  if(pkg.version!==VERSION) fail('WORKSPACE_VERSION_MISMATCH',`${ws}:${pkg.version}`);
  if(typeof pkg.name!=='string'||!pkg.name.startsWith('@agroway/')) fail('INVALID_WORKSPACE_NAME',ws);
  if(names.has(pkg.name)) fail('DUPLICATE_WORKSPACE_NAME',pkg.name);
  names.add(pkg.name); nameToWorkspace.set(pkg.name,ws);

  const lockEntry=lock.packages?.[ws];
  if(!lockEntry) fail('WORKSPACE_LOCK_ENTRY_MISSING',ws);
  if(lockEntry.name!==pkg.name||lockEntry.version!==pkg.version) fail('WORKSPACE_LOCK_IDENTITY_MISMATCH',ws);
  if(JSON.stringify(stableObject(lockEntry.dependencies))!==JSON.stringify(stableObject(pkg.dependencies))) fail('WORKSPACE_LOCK_DEPENDENCY_MISMATCH',ws);
}
if(names.size!==EXPECTED_WORKSPACES) fail('WORKSPACE_NAME_COUNT_MISMATCH',`${names.size}`);

for(const ws of workspaces){
  const pkg=readJson(path.join(ws,'package.json'));
  for(const dependency of Object.keys(pkg.dependencies??{})){
    if(!dependency.startsWith('@agroway/')) continue;
    const target=nameToWorkspace.get(dependency);
    if(!target) fail('INTERNAL_DEPENDENCY_WORKSPACE_MISSING',`${ws}:${dependency}`);
    const link=lock.packages?.[`node_modules/${dependency}`];
    if(!link?.link||link.resolved!==target) fail('INTERNAL_DEPENDENCY_LOCK_LINK_MISMATCH',`${ws}:${dependency}`);
  }
}

for(const [ws,classification] of repaired){
  if(!workspaces.includes(ws)) fail('REPAIRED_WORKSPACE_NOT_DECLARED',ws);
  const source=fs.readFileSync(path.join(ws,'src','index.ts'),'utf8');
  if(Buffer.byteLength(source,'utf8')<512) fail('RECONSTRUCTED_SOURCE_TOO_SMALL',ws);
  if(/\b(?:TODO|PLACEHOLDER|NOT_IMPLEMENTED)\b/i.test(source)) fail('PLACEHOLDER_MARKER_FORBIDDEN',ws);
  console.log(`PASS_RECONSTRUCTED_WORKSPACE ${ws} ${classification}`);
}

console.log(`PASS_DIRECT_WORKSPACE_INVENTORY_${EXPECTED_WORKSPACES}`);
console.log(`PASS_WORKSPACE_LOCK_PARITY_${EXPECTED_WORKSPACES}`);
console.log(`PASS_ISSUE_24_RECONSTRUCTION_${repaired.size}`);
