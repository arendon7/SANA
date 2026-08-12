import {readFile,stat} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const files=['apps/control-web/src/evidence-decision-ledger-model.ts','apps/control-web/public/evidence.html','apps/control-web/public/evidence.js','apps/control-web/public/evidence.css','apps/control-web/public/service-worker.js','apps/control-web/server.mjs','config/design/screens/evidence-decision-ledger.json'];
let checks=0;const pass=(name,ok)=>{checks++;if(!ok)throw new Error(`FAIL:${name}`);console.log(`PASS ${name}`)};
for(const f of files){await stat(new URL(f,root));pass(`file:${f}`,true)}
const model=await readFile(new URL('apps/control-web/src/evidence-decision-ledger-model.ts',root),'utf8');
const app=await readFile(new URL('apps/control-web/public/evidence.js',root),'utf8');
const server=await readFile(new URL('apps/control-web/server.mjs',root),'utf8');
const sw=await readFile(new URL('apps/control-web/public/service-worker.js',root),'utf8');
const cfg=JSON.parse(await readFile(new URL('config/design/screens/evidence-decision-ledger.json',root),'utf8'));
for(const token of ['EVIDENCE_PROVENANCE_REQUIRED','EVIDENCE_SOURCE_DIGEST_REQUIRED','HUMAN_ACTOR_REQUIRED','HUMAN_NOTE_REQUIRED','AI_CITATION_EVIDENCE_NOT_FOUND','AI_CITATION_REJECTED_EVIDENCE_FORBIDDEN','UNKNOWN_FRESHNESS_CANNOT_BE_ACCEPTED','REJECTED_CANONICAL_EVIDENCE_CANNOT_BE_ACCEPTED_FOR_REVIEW','LEDGER_HASH_CHAIN_MISMATCH','canonicalMutated:false','localOnly:true'])pass(`model:${token}`,model.includes(token));
for(const token of ['SHA-256','DRAFT_SUGGESTION','ADVISORY_ONLY','HUMAN_NOTE_REQUIRED','UNKNOWN_FRESHNESS_CANNOT_BE_ACCEPTED','REJECTED_CANONICAL_EVIDENCE_CANNOT_BE_ACCEPTED_FOR_REVIEW','canonicalMutated=false','localOnly=true'])pass(`ui:${token}`,app.includes(token)||await readFile(new URL('apps/control-web/public/evidence.html',root),'utf8').then(x=>x.includes(token)));
pass('server:evidence-route',server.includes("'/control/evidence'"));pass('server:exceptions-regression-route',server.includes("'/control/exceptions'"));pass('sw:evidence-cached',sw.includes("'/control/evidence'"));pass('sw:exceptions-cached',sw.includes("'/control/exceptions'"));
pass('config:screen',cfg.screenId==='CONTROL_EVIDENCE_DECISION_LEDGER');pass('config:route',cfg.route==='/control/evidence');pass('config:d10',cfg.d10HumanProductApproval==='PENDING');pass('config:event-delta',cfg.domainEventDelta===0);pass('config:workspace-delta',cfg.workspaceDelta===0);pass('config:guardrails',Array.isArray(cfg.guardrails)&&cfg.guardrails.length>=9);
console.log(`PASS_CONTROL_EVIDENCE_LEDGER_STATIC ${checks}/${checks}`);
