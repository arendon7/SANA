#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=process.cwd();
const out=path.join(root,'dist/control-initial-rc1');
const files=[
  'config/product/control-initial-rc1.json',
  'config/product/control-operational-acceptance.json',
  'config/product/control-alpha22-root-runtime-reconciliation.json',
  'config/product/control-alpha21-production-host.json',
  'config/product/control-alpha20-production-bootstrap.json',
  'config/product/control-alpha19-production-activation.json',
  'config/product/control-alpha18-production-readiness.json',
  'config/product/control-alpha17-external-ack-production-wiring.json',
  'config/product/control-alpha16-oidc-production-wiring.json',
  'config/product/control-alpha14-postgres-js-driver.json',
  'config/product/control-alpha13-postgres-production-wiring.json',
  'scripts/release-readiness.mjs',
  'scripts/control-production-host.mjs',
  'scripts/build-control-production-host.mjs'
];
const blockers=[
  'PRODUCTION_IDENTITY_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'PRODUCTION_POSTGRES_REAL_SECRET_BINDING_AND_CONNECTIVITY_PENDING',
  'EXTERNAL_ACK_PROVIDER_REAL_BINDING_AND_CONNECTIVITY_PENDING',
  'D10_HUMAN_PRODUCT_APPROVAL_PENDING'
];
const sha256=buffer=>createHash('sha256').update(buffer).digest('hex');
const write=(relative,content)=>{const dest=path.join(out,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);};

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const relative of files){
  const src=path.join(root,relative);
  if(!fs.existsSync(src))throw new Error(`INITIAL_RC_SOURCE_MISSING:${relative}`);
  write(relative,fs.readFileSync(src));
}
const releaseState={
  release:'0.22.0-initial-rc1',
  state:'INITIAL_PHASE_REVIEW_CANDIDATE',
  reviewReady:true,
  productionReady:false,
  d10:'PENDING',
  productionExecutionAvailable:false,
  executionState:'NOT_EXECUTED',
  canonicalMutated:false,
  productionBlockers:blockers
};
write('RELEASE_STATE.json',JSON.stringify(releaseState,null,2)+'\n');
const nextActions=`# GREENATICS CONTROL — Initial RC1\n\nThis package is review-ready, not production-ready.\n\n## What is complete\n\nThe reviewed CONTROL architecture, canonical write boundary, PostgreSQL transaction/driver layer, OIDC/JWKS wiring, External ACK wiring, readiness/activation gates, bootstrap, deployment-host boundary, FIELD local runtime and offline reproducibility are materialized and internally certified.\n\n## What remains\n\n1. Bind the real production IdP configuration and certify JWKS connectivity.\n2. Bind real PostgreSQL host/user/password/CA externally and certify read-only connectivity.\n3. Bind the real External ACK provider metadata/endpoint/key set and certify read-only connectivity.\n4. Obtain D10 human product approval bound to the final release candidate.\n\n## Operator sequence\n\n- Build the reviewed production host: \`node scripts/build-control-production-host.mjs\`.\n- With production environment values supplied outside the repository, run the host \`check-config\` command.\n- Run \`preflight\`; it may issue binding evidence only after the three read-only probes pass.\n- Run \`npm run release:readiness:production\`; it must remain blocked until all blockers are cleared and D10 is APPROVED.\n\nNo file in this RC contains production credentials, D10 approval, or an activation lease.\n`;
write('NEXT_ACTIONS.md',nextActions);

const inventory=[];
function walk(dir,relative=''){
  for(const name of fs.readdirSync(dir).sort()){
    const full=path.join(dir,name);const rel=path.posix.join(relative,name);const stat=fs.statSync(full);
    if(stat.isDirectory())walk(full,rel);else if(rel!=='MANIFEST.json'){
      const bytes=fs.readFileSync(full);inventory.push({path:rel,size:bytes.length,sha256:sha256(bytes)});
    }
  }
}
walk(out);
const manifest={format:'AGROWAY_CONTROL_INITIAL_RC_V1',release:'0.22.0-initial-rc1',deterministic:true,networkRequired:false,containsProductionSecrets:false,files:inventory};
write('MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',release:manifest.release,output:path.relative(root,out),files:inventory.length,manifestSha256:sha256(fs.readFileSync(path.join(out,'MANIFEST.json'))),productionReady:false,blockers:blockers.length},null,2));
