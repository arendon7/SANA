(() => {
  'use strict';

  const base=window.__SANA_CIRCULARITY_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_CIRCULARITY_LEDGER_V1')return;

  const VERSION='V154';
  const INTEGRITY='CIRCULARITY_REFERENCE ≠ CIRCULARITY_EXECUTION · SUPPORT_REFERENCE ≠ EVIDENCE_VERIFIED · EVIDENCE_REFERENCE_DECLARED ≠ EXTERNAL_EVIDENCE_VERIFIED · RECEIVER_REFERENCE_DECLARED ≠ RECEIVER_IDENTITY_VERIFIED · SOURCE_ACTIVITY_DECLARED ≠ ACTIVITY_CONTRACT_REFERENCE · DESTINATION_PLAN ≠ EXECUTION · EXECUTION ≠ RECOVERY · EXTERNAL_HANDOFF ≠ VERIFIED_DISPOSITION · REFERENCE ≠ CIRCULARITY_RATE ≠ ENVIRONMENTAL_IMPACT ≠ REGULATORY_CLASSIFICATION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';
  const TARGET_KINDS=new Set(['GENERATION','CLASSIFICATION','QUANTIFICATION','SEGREGATION','DESTINATION_PLAN','EXECUTION','OUTCOME']);

  function records(){return typeof storage!=='undefined'&&Array.isArray(storage?.records)?storage.records:[]}
  function metadata(){
    const out=new Map();
    records().filter(r=>r.type==='circularity-reference-meta'&&r.values?.sourceSchema===base.schema).forEach(r=>{
      const id=r.values?.caseId||'';
      if(id)out.set(id,{referenceVersion:r.values?.referenceVersion||'',recordId:r.id||'',createdAt:r.createdAt||'',reviewer:r.values?.reviewer||''});
    });
    return out;
  }
  function parsedTime(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:null}
  function allCases(){return base.cases()||[]}
  function findEvent(ref,all){
    for(const c of all){const event=(c.events||[]).find(e=>e.id===ref);if(event)return {case:c,event}}
    return null;
  }
  function supportRef(c,source,ref,all){
    if(!ref)return {status:'MISSING_REFERENCE',domain:'CIRCULARITY_EVENT',target:null};
    const found=findEvent(ref,all);
    if(!found)return {status:'MISSING_TARGET',domain:'CIRCULARITY_EVENT',target:null};
    if(found.case?.id!==c.id)return {status:'CROSS_CASE_REFERENCE',domain:'CIRCULARITY_EVENT',target:found.event};
    if(!c.lot||!source?.lot)return {status:'MISSING_SOURCE_SCOPE',domain:'CIRCULARITY_EVENT',target:found.event};
    if(!found.event?.lot)return {status:'MISSING_TARGET_SCOPE',domain:'CIRCULARITY_EVENT',target:found.event};
    if(source.lot!==c.lot||found.event.lot!==c.lot)return {status:'CROSS_SCOPE_REFERENCE',domain:'CIRCULARITY_EVENT',target:found.event};
    if(!TARGET_KINDS.has(found.event?.eventKind))return {status:'KIND_MISMATCH',domain:'CIRCULARITY_EVENT',target:found.event};
    const a=parsedTime(source.observedAt),b=parsedTime(found.event.observedAt);
    if(a!==null&&b!==null&&b>a)return {status:'FORWARD_REFERENCE',domain:'CIRCULARITY_EVENT',target:found.event};
    return {status:'LINKED',domain:'CIRCULARITY_EVENT',target:found.event};
  }
  function canonicalRows(c,all){
    if(metadata().get(c.id)?.referenceVersion!==VERSION)return [];
    const rows=[];
    for(const e of c.events||[]){
      if(e.eventKind!=='EVIDENCE')continue;
      const refs=(e.supports||[]).length?e.supports:[''];
      for(const ref of refs)rows.push({
        sourceEventId:e.id||'',
        sourceKind:e.eventKind||'',
        kind:'CIRCULARITY_SUPPORT_REF',
        refId:ref||'',
        origin:'DECLARED_CIRCULARITY_EVENT',
        temporalPolicy:'ENFORCED_WHEN_COMPARABLE',
        reference:supportRef(c,e,ref,all)
      });
    }
    return rows;
  }
  function declaredRows(c){
    const out=[];
    for(const e of c.events||[]){
      if(e.eventKind==='EVIDENCE'&&e.evidenceRef)out.push({sourceEventId:e.id,sourceKind:e.eventKind,kind:'EVIDENCE_REF_DECLARED',field:'evidenceRef',refId:String(e.evidenceRef),status:'DECLARED_NON_CANONICAL_REFERENCE'});
      if(e.eventKind==='EXECUTION'&&e.receiverRef)out.push({sourceEventId:e.id,sourceKind:e.eventKind,kind:'RECEIVER_REF_DECLARED',field:'receiverRef',refId:String(e.receiverRef),status:'DECLARED_NON_CANONICAL_REFERENCE'});
      if(e.eventKind==='GENERATION'&&e.sourceActivity)out.push({sourceEventId:e.id,sourceKind:e.eventKind,kind:'SOURCE_ACTIVITY_DECLARED',field:'sourceActivity',refId:String(e.sourceActivity),status:'DECLARED_NON_CANONICAL_REFERENCE'});
    }
    return out;
  }
  function coverage(rows){const linked=rows.filter(r=>r.reference?.status==='LINKED').length,total=rows.length;return {linked,total,percent:total?Math.round(linked/total*100):null,issues:total-linked}}
  function caseFor(id){
    const all=allCases(),c=all.find(x=>x.id===id);if(!c)return null;
    const meta=metadata().get(id)||{},captured=meta.referenceVersion===VERSION,rows=canonicalRows(c,all),cov=coverage(rows);
    return {...c,referenceVersion:meta.referenceVersion||'',referenceState:captured?'CAPTURED_V154':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked:cov.linked,total:cov.total,percent:cov.percent},referenceIssues:cov.issues,referenceRows:rows,declaredReferenceRows:declaredRows(c),declaredReferenceValuePolicy:'LIVE_DECLARED_VALUE_VISIBLE · HISTORY_MUST_MINIMIZE',integrity:`${c.integrity||base.integrity||''} · ${INTEGRITY}`};
  }
  function cases(){return allCases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forCase(id){return caseFor(id)}
  function forLot(lot){return {cases:cases().filter(c=>c.lot===lot),legacy:base.forLot?.(lot)?.legacy||[]}}
  function summary(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V154'),prior=base.summary?.()||{};return {...prior,referenceVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,c)=>n+(c.referenceCoverage?.linked||0),0),referenceExpected:captured.reduce((n,c)=>n+(c.referenceCoverage?.total||0),0),referenceIssues:captured.reduce((n,c)=>n+(c.referenceIssues||0),0),declaredNonCanonical:captured.reduce((n,c)=>n+(c.declaredReferenceRows?.length||0),0),legacyReferenceNotCaptured:all.length-captured.length,integrity:`${prior.integrity||base.integrity||''} · ${INTEGRITY}`}}

  function openReference(caseId){
    const c=allCases().find(x=>x.id===caseId);if(!c)return;
    openModal('CIRCULARIDAD · REFERENCIAS V154','Validar supports internos verificables',`<div class="fields"><input type="hidden" name="sourceSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="caseId" value="${esc(c.id)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot||'SIN_LOTE')}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Activa validación V154 de EVIDENCE.supports. No verifica evidencia externa, receptor, disposición ni impacto."></textarea></label><label class="full">Frontera<input value="SUPPORT REF ≠ EVIDENCE VERIFIED · EXECUTION ≠ RECOVERY/VERIFIED DISPOSITION" readonly></label></div>`,true,'circularity-reference-meta');
  }
  function panel(){
    const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V154'),linked=captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=captured.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=captured.reduce((n,c)=>n+c.referenceIssues,0),declared=captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIRCULARIDAD · REFERENCIAS V154</p><h2>Soportes internos explícitos, sin fabricar verificación externa</h2><p>Solo EVIDENCE.supports entra al denominador. Receptor, evidenceRef y sourceActivity permanecen referencias/declaraciones no canónicas.</p></div><span class="status ${issues?'warn':'teal'}">${issues} ISSUE(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Enlazadas',`${linked}/${total||0}`,'supports internos')}${metric('No canónicas',declared,'fuera del denominador')}${metric('Casos V154',captured.length,'opt-in humano')}${metric('Verificación externa','0','no autoridad','good')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V154'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V154'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.lot||'SIN_LOTE')}</strong><p>${c.referenceState==='CAPTURED_V154'?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} enlazada(s) · ${c.referenceIssues} issue(s) · ${c.declaredReferenceRows.length} no canónica(s)`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválida'}</p></div><button class="btn secondary" data-circularity-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">SUPPORT_REFERENCE ≠ EVIDENCE_VERIFIED · RECEIVER_REFERENCE ≠ VERIFIED_DISPOSITION · DESTINATION_PLAN ≠ EXECUTION · EXECUTION ≠ RECOVERY · REFERENCE ≠ CIRCULARITY_RATE/ENVIRONMENTAL_IMPACT/REGULATORY_CLASSIFICATION/CREDIT/INVESTMENT SIGNAL.</div></div></section>`;
  }
  function insert(html,section){for(const m of ['<footer class="footer-note">','<footer class="footer">']){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const prior=views.circularity;if(prior)views.circularity=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-circularity-ref]');if(b)openReference(b.dataset.circularityRef)});

  window.__SANA_CIRCULARITY_LEDGER__=Object.freeze({...base,cases,forCase,forLot,summary,referenceVersion:VERSION,integrity:`${base.integrity||''} · ${INTEGRITY}`});
})();

// V155 loader: historical Circularity reference provenance only; snapshot-only downstream projections.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const VERSION='V155';
  const ASSETS=['/sana-v3-report-snapshot-circularity-references.js','/sana-v3-cycle-circularity-references.js','/sana-v3-due-diligence-circularity-reference-gaps.js','/sana-v3-dataroom-circularity-references.js'];
  const state={version:VERSION,status:'WAITING',attempts:0,integrity:'SNAPSHOT_ONLY · CONTENT_MINIMIZED · NON_WEIGHTED · NO_RETROFILL · NO_EVIDENCE/DISPOSITION/RECOVERY/IMPACT/REGULATORY/CREDIT/INVESTMENT_AUTHORITY'};
  function expose(){window.__SANA_CIRCULARITY_REFERENCE_HISTORY_LOADER__=Object.freeze({...state})}
  function ready(){return window.__SANA_CIRCULARITY_LEDGER__?.referenceVersion==='V154'}
  function inject(src){return new Promise((resolve,reject)=>{if(document.querySelector?.(`script[src="${src}"]`)){resolve();return}const e=document.createElement('script');e.src=src;e.defer=true;e.dataset.sanaCircularityReferenceHistoryV155='1';e.onload=resolve;e.onerror=reject;document.head.appendChild(e)})}
  async function start(){state.attempts++;expose();if(state.status==='READY'||state.status==='LOADING')return;if(!ready()){if(state.attempts<25){state.status='WAITING_DEPENDENCIES';expose();setTimeout(start,40);return}state.status='BLOCKED_DEPENDENCIES';expose();return}state.status='LOADING';expose();try{for(const src of ASSETS)await inject(src);state.status='READY'}catch{state.status='FAILED'}expose()}
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();
