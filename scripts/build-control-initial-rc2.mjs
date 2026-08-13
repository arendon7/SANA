#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=process.cwd();
const out=path.join(root,'dist/control-initial-rc2');
const files=[
  'package.json',
  'config/product/control-initial-rc2.json',
  'config/product/control-production-commissioning.env.template',
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
  'docs/control/production-commissioning.md',
  'services/pilot-certifier/src/control-production-readiness.ts',
  'scripts/release-readiness.mjs',
  'scripts/control-production-host.mjs',
  'scripts/build-control-production-host.mjs',
  'scripts/control-production-commissioning.mjs',
  'scripts/control-production-commissioning-runtime.mjs',
  'scripts/validate-control-production-commissioning.mjs',
  'scripts/control-production-readiness-runtime.mjs',
  'scripts/validate-control-production-readiness.mjs'
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
  if(!fs.existsSync(src))throw new Error(`INITIAL_RC2_SOURCE_MISSING:${relative}`);
  write(relative,fs.readFileSync(src));
}
const releaseState={
  release:'0.22.0-initial-rc2',
  state:'INITIAL_PHASE_COMMISSIONING_CANDIDATE',
  reviewReady:true,
  commissioningReady:true,
  productionReady:false,
  d10:'PENDING',
  productionExecutionAvailable:false,
  executionState:'NOT_EXECUTED',
  canonicalMutated:false,
  activationLeaseIssued:false,
  productionBlockers:blockers
};
write('RELEASE_STATE.json',JSON.stringify(releaseState,null,2)+'\n');
const nextActions=`# GREENATICS CONTROL — Initial RC2 commissioning candidate\n\nThis package is review-ready and commissioning-ready, not production-ready.\n\n## What RC2 adds over RC1\n\n- the release-candidate gate accepts the explicit \`0.22.0-initial-rcN\` channel while retaining strict SHA bindings;\n- a fail-closed server-side commissioning CLI exposes only \`describe\`, \`check-config\`, \`preflight\` and \`capture-evidence\`;\n- the commissioning evidence file is written only after IdP, PostgreSQL and External ACK read-only probes all pass and D10 remains pending;\n- a complete external-only environment template and commissioning runbook are included.\n\n## Real-environment sequence\n\n1. Take the exact RC2 Git head SHA and certified RC2 artifact SHA-256 from the successful exact-head CI run.\n2. Supply real configuration through the deployment environment / secret manager; never commit populated values.\n3. Build the reviewed production host from the same exact source head.\n4. Run \`npm run control:commissioning:check-config\` — this performs no network probes.\n5. Run \`npm run control:commissioning:preflight\` — only the three reviewed read-only connectivity probes execute.\n6. If the state is \`READY_FOR_D10_HUMAN_REVIEW\`, run \`npm run control:commissioning:capture-evidence\`.\n7. Perform the separate HUMAN_ONLY D10 product decision bound to that exact candidate.\n8. Production activation remains a separate, already-reviewed separation-of-duties ceremony.\n\nThe repository and RC2 artifact contain no production password, bearer token, private key, D10 approval or activation lease.\n`;
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
const manifest={
  format:'AGROWAY_CONTROL_INITIAL_RC_V2',release:'0.22.0-initial-rc2',deterministic:true,networkRequiredToBuild:false,commissioningNetworkRequiredForRealPreflight:true,
  containsProductionSecrets:false,containsD10Approval:false,containsActivationLease:false,commissioningReady:true,productionReady:false,files:inventory
};
write('MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',release:manifest.release,output:path.relative(root,out),files:inventory.length,manifestSha256:sha256(fs.readFileSync(path.join(out,'MANIFEST.json'))),commissioningReady:true,productionReady:false,blockers:blockers.length},null,2));
