import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const cfgPath='config/product/control-review-bundle.json';
const cfg=JSON.parse(await fsp.readFile(cfgPath,'utf8'));
const out=path.join(root,'dist','control-review-bundle');
await fsp.rm(out,{recursive:true,force:true});
await fsp.mkdir(out,{recursive:true});

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const entries=[];
async function copy(src,dst){
  const from=path.join(root,src),to=path.join(out,dst);
  if(!fs.existsSync(from))throw new Error(`BUNDLE_SOURCE_MISSING:${src}`);
  const body=await fsp.readFile(from);await fsp.mkdir(path.dirname(to),{recursive:true});await fsp.writeFile(to,body);
  entries.push({path:dst,source:src,bytes:body.length,sha256:sha(body)});
}

for(const src of cfg.runtimeFiles){
  const dst=src==='apps/control-web/server.mjs'?'server.mjs':src.replace('apps/control-web/public/','public/');
  await copy(src,dst);
}
for(const src of cfg.contractFiles){
  const dst=src.startsWith('apps/control-web/src/')?src.replace('apps/control-web/src/','contracts/'):
    src.startsWith('config/design/screens/')?src.replace('config/design/screens/','design/'):
    src;
  await copy(src,dst);
}
await copy(cfgPath,'config/control-review-bundle.json');

entries.sort((a,b)=>a.path.localeCompare(b.path));
const aggregateMaterial=entries.map(e=>`${e.path}\0${e.sha256}\0${e.bytes}`).join('\n');
const aggregateSha256=sha(Buffer.from(aggregateMaterial));
const manifest={schemaVersion:1,product:cfg.product,version:cfg.version,artifact:cfg.artifact,trust:cfg.trust,d10:cfg.d10,entryRoute:cfg.entryRoute,routes:cfg.routes,authority:cfg.authority,domainDelta:cfg.domainDelta,generatedFrom:'GIT_WORKTREE',deterministic:true,aggregateSha256,fileCount:entries.length,files:entries};
await fsp.writeFile(path.join(out,'REVIEW_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
const pgTruth=cfg.authority.productionPoolDriverMaterialized===true
  ? 'The production PostgreSQL configuration contract and pinned Postgres.js driver bridge are reviewable source. The driver is not connected to a real production database here; no real secrets are bundled, production connectivity is uncertified, and the review server never invokes a canonical write.'
  : cfg.authority.productionDatabaseConfigurationContractImplemented===true
    ? 'Production PostgreSQL configuration/wiring is implemented as external-secret-only and TLS-verified source. No real production secrets are included, connectivity is not certified here, and the review server never invokes a canonical write.'
    : 'The server-side PostgreSQL transaction adapter is reviewable source, but no production database configuration or credentials are present; the review server never invokes a canonical write.';
await fsp.writeFile(path.join(out,'README.md'),`# GREENATICS CONTROL ${cfg.version} — Review Bundle\n\nTrust: **${cfg.trust}**  \nD10 Human Product Approval: **${cfg.d10}**  \nExecution state: **${cfg.authority.executionState}**\n\nRun:\n\n\`\`\`bash\nPORT=4273 node server.mjs\n\`\`\`\n\nOpen: http://127.0.0.1:4273${cfg.entryRoute}\n\n${pgTruth}\n\nAggregate SHA-256: \`${aggregateSha256}\`\n`);
console.log(`PASS_CONTROL_REVIEW_BUNDLE files=${entries.length} aggregateSha256=${aggregateSha256}`);
