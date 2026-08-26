(() => {
  'use strict';

  const base=window.__SANA_IMPACT_LEDGER__;
  if(!base?.rows)return;

  const SCHEMA='SANA_IMPACT_LEDGER_V1';
  const VERSION='V158';
  const VALUE_POLICY='COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED';
  const INTEGRITY='IMPACT_SOURCE_REFERENCE ≠ SOURCE_CONTENT_CORRECTNESS · SOURCE_REFERENCE ≠ INDICATOR_VALIDITY · SOURCE_REFERENCE ≠ CAUSALITY · SOURCE_REGISTRY_REFERENCE ≠ EXTERNAL_VERIFICATION · SOURCE_SCOPE_MATCH ≠ REPRESENTATIVENESS · NAVIGATION_HINT ≠ EVIDENCE_REFERENCE · PROVENANCE_LABEL ≠ SOURCE_REGISTRY_REFERENCE · REFERENCE ≠ CERTIFICATION ≠ IMPACT_VERIFICATION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';

  function records(){return typeof storage!=='undefined'&&Array.isArray(storage?.records)?storage.records:[]}
  function sourceApi(){return window.__SANA_DOCUMENT_SOURCES__}
  function sources(){return sourceApi()?.rows?.()||[]}
  function splitRefs(v){return [...new Set(String(v||'').split(',').map(x=>x.trim()).filter(Boolean))]}
  function metadata(){
    const candidates=records().filter(r=>r.type==='impact-reference-meta'&&r.values?.sourceSchema===SCHEMA&&r.values?.indicatorId);
    candidates.sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id||'').localeCompare(String(b.id||'')));
    const map=new Map();
    for(const r of candidates){const v=r.values||{};map.set(v.indicatorId,{referenceVersion:v.referenceVersion||'',sourceRefs:splitRefs(v.sourceRefs),recordId:r.id||'',createdAt:r.createdAt||''})}
    return map;
  }
  function parsedTime(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:null}
  function minTarget(s){return s?{id:s.id||'',scope:s.scope||'',version:s.version||'',cut:s.cut||'',state:s.state||'REFERENCE_ONLY'}:null}
  function targetFor(id){return sources().find(s=>s.id===id)||null}
  function validateReference(row,refId,meta){
    if(!refId)return {status:'MISSING_REFERENCE',domain:'SOURCE_REGISTRY',target:null};
    const target=targetFor(refId);
    if(!target)return {status:'MISSING_TARGET',domain:'SOURCE_REGISTRY',target:null};
    const sourceScope=row?.boundary?.unit||'';
    if(!sourceScope)return {status:'MISSING_SOURCE_SCOPE',domain:'SOURCE_REGISTRY',target:minTarget(target)};
    if(!target.scope)return {status:'MISSING_TARGET_SCOPE',domain:'SOURCE_REGISTRY',target:minTarget(target)};
    if(target.scope!==sourceScope)return {status:'CROSS_SCOPE_REFERENCE',domain:'SOURCE_REGISTRY',target:minTarget(target)};
    const declared=parsedTime(meta?.createdAt),cut=parsedTime(target.cut);
    if(declared!==null&&cut!==null&&cut>declared)return {status:'FORWARD_REFERENCE',domain:'SOURCE_REGISTRY',target:minTarget(target)};
    return {status:'LINKED',domain:'SOURCE_REGISTRY',target:minTarget(target)};
  }
  function canonicalRows(row,meta){
    if(meta?.referenceVersion!==VERSION)return [];
    const refs=meta.sourceRefs?.length?meta.sourceRefs:[''];
    return refs.map(refId=>({sourceIndicatorId:row.id||'',kind:'IMPACT_SOURCE_REF',refId:refId||'',origin:'HUMAN_DECLARED_SOURCE_REGISTRY_REFERENCE',temporalPolicy:'SOURCE_CUT_NOT_AFTER_REFERENCE_DECLARATION_WHEN_COMPARABLE',reference:validateReference(row,refId,meta)}));
  }
  function declaredRows(row){
    const out=[];
    if(row?.provenance?.source)out.push({sourceIndicatorId:row.id||'',kind:'PROVENANCE_LABEL_DECLARED',field:'provenance.source',status:'DECLARED_NON_CANONICAL_REFERENCE'});
    for(const _ of row?.navigation||[])out.push({sourceIndicatorId:row.id||'',kind:'NAVIGATION_HINT_DERIVED',field:'navigation.view',status:'DECLARED_NON_CANONICAL_REFERENCE'});
    return out;
  }
  function coverage(rows){const linked=rows.filter(r=>r.reference?.status==='LINKED').length,total=rows.length;return {linked,total,percent:total?Math.round(linked/total*100):null,issues:total-linked}}
  function enrich(row){
    const meta=metadata().get(row.id)||{},captured=meta.referenceVersion===VERSION,refs=canonicalRows(row,meta),cov=coverage(refs),declared=declaredRows(row);
    return {...row,referenceVersion:meta.referenceVersion||'',referenceState:captured?'CAPTURED':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked:cov.linked,total:cov.total,percent:cov.percent},referenceIssues:cov.issues,referenceRows:refs,declaredReferenceRows:declared,declaredNonCanonicalReferences:declared.length,declaredReferenceValuePolicy:VALUE_POLICY,referenceIntegrity:INTEGRITY,integrity:`${row.integrity||base.integrity||''} · ${INTEGRITY}`};
  }
  function rows(){return (base.rows()||[]).map(enrich)}
  function forIndicator(id){return rows().find(r=>r.id===id)||null}
  function summary(){
    const all=rows(),captured=all.filter(r=>r.referenceState==='CAPTURED'),prior=base.summary?.()||{};
    return {...prior,schema:SCHEMA,referenceVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,r)=>n+(r.referenceCoverage?.linked||0),0),referenceExpected:captured.reduce((n,r)=>n+(r.referenceCoverage?.total||0),0),referenceIssues:captured.reduce((n,r)=>n+(r.referenceIssues||0),0),declaredNonCanonical:captured.reduce((n,r)=>n+(r.declaredReferenceRows?.length||0),0),legacyReferenceNotCaptured:all.length-captured.length,verificationCreatedByReferences:0,certificationCreatedByReferences:0,integrity:`${prior.integrity||base.integrity||''} · ${INTEGRITY}`};
  }
  function openReference(indicatorId){
    const row=(base.rows()||[]).find(r=>r.id===indicatorId);if(!row||typeof openModal!=='function')return;
    const available=sources().map(s=>`${s.id} [${s.scope}]`).join(' · ');
    const reviewer=typeof identity!=='undefined'?(identity?.displayName||'Responsable DEMO'):'Responsable DEMO';
    openModal('SANA IMPACT · SOURCE REFERENCES V158','Vincular fuentes estructurales del Source Registry',`<div class="fields"><input type="hidden" name="sourceSchema" value="${SCHEMA}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="indicatorId" value="${esc(row.id)}"><label>Indicador<input value="${esc(row.id)} · ${esc(row.name||'')}" readonly></label><label>Scope requerido<input value="${esc(row.boundary?.unit||'NO_CAPTURADO')}" readonly></label><label class="full">Source Registry IDs<input name="sourceRefs" placeholder="SRC-004, SRC-..." required></label><label>Responsable humano<input name="reviewer" value="${esc(reviewer)}" required></label><label class="full">Nota<textarea name="detail" placeholder="Por qué estas referencias documentales sustentan la lectura metodológica. No afirma contenido correcto ni causalidad."></textarea></label><label class="full">Disponibles<input value="${esc(available||'Sin fuentes registradas')}" readonly></label><label class="full">Frontera<input value="SOURCE REFERENCE ≠ CONTENT CORRECTNESS ≠ CAUSALITY ≠ EXTERNAL VERIFICATION" readonly></label></div>`,true,'impact-reference-meta');
  }
  function panel(){
    const all=rows(),captured=all.filter(r=>r.referenceState==='CAPTURED'),s=summary();
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">IMPACT · SOURCE REFERENCES V158</p><h2>Fuente estructural explícita, sin fabricar verificación de impacto</h2><p>Solo IDs humanos del Source Registry entran al denominador. Labels de procedencia y navegación permanecen declarativos.</p></div><span class="status ${s.referenceIssues?'warn':'teal'}">${s.referenceIssues} ISSUE(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Enlazadas',`${s.referenceLinked}/${s.referenceExpected||0}`,'Source Registry IDs')}${metric('Indicadores V158',captured.length,'opt-in humano')}${metric('Verif. externa ledger',Number(s.externallyVerified)||0,'estado previo del ledger; no creado por refs')}${metric('Verificación creada por refs','0','source reference ≠ verification','good')}</div>${all.map(r=>`<div class="gate" style="margin-top:10px"><i class="${r.referenceState==='CAPTURED'?(r.referenceIssues?'warn':'ok'):''}">${r.referenceState==='CAPTURED'?(r.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(r.id)} · ${esc(r.name||'')}</strong><p>${r.referenceState==='CAPTURED'?`${r.referenceCoverage.linked}/${r.referenceCoverage.total} enlazada(s) · ${r.referenceIssues} issue(s) · scope ${esc(r.boundary?.unit||'—')}`:'LEGACY_REFERENCE_NOT_CAPTURED · indicador válido sin captura V158'}</p></div><button class="btn secondary" data-impact-reference="${esc(r.id)}">Validar fuentes</button></div>`).join('')}<div class="section-note" style="margin-top:12px">SOURCE REGISTRY REFERENCE ≠ SOURCE CONTENT CORRECTNESS · SCOPE MATCH ≠ REPRESENTATIVENESS · REFERENCE ≠ INDICATOR VALIDITY/CAUSALITY/EXTERNAL VERIFICATION/CERTIFICATION.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">',i=html.lastIndexOf(marker);return i<0?html+section:html.slice(0,i)+section+html.slice(i)}
  if(typeof views!=='undefined'&&views.impact){const prior=views.impact;views.impact=()=>insert(prior(),panel())}
  if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('click',e=>{const b=e.target.closest?.('[data-impact-reference]');if(b)openReference(b.dataset.impactReference)});

  window.__SANA_IMPACT_LEDGER__=Object.freeze({...base,schema:SCHEMA,rows,forIndicator,summary,referenceVersion:VERSION,integrity:`${base.integrity||''} · ${INTEGRITY}`});
})();
