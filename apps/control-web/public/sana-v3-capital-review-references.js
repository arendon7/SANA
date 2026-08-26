(() => {
  'use strict';
  const base=window.__SANA_CAPITAL_REVIEW__;
  if(!base?.cases||base.schema!=='SANA_CAPITAL_HUMAN_REVIEW_LEDGER_V1')return;
  const VERSION='V162';
  const REVIEW_TARGET_KINDS=new Set(['REVIEW_REQUESTED','REVIEW_STARTED','DOCUMENT_REQUEST','REVIEW_NOTE_REFERENCE','ASSESSMENT_REFERENCE','REVIEW_COMPLETED','HUMAN_DECISION_REFERENCE']);
  const INTEGRITY='CAPITAL_CASE_REFERENCE ≠ APPROVAL_OR_ELIGIBILITY · SNAPSHOT_REFERENCE ≠ CONTENT_CORRECTNESS ≠ LIVE_STATE · REVIEW_SUPPORT_REFERENCE ≠ VERIFIED_FACT · REVIEWER_REF_DECLARED ≠ VERIFIED_IDENTITY · SCOPE_REF_DECLARED ≠ VERIFIED_SCOPE · REQUEST_REF_DECLARED ≠ VERIFIED_REQUEST · DOCUMENT_REQUEST_REF_DECLARED ≠ DEFICIENCY · NOTE_REF_DECLARED ≠ VERIFIED_FACT · ASSESSMENT_REF_DECLARED ≠ CREDIT_SCORE ≠ INVESTMENT_RECOMMENDATION · OUTCOME_REF_DECLARED ≠ ELIGIBILITY · DECISION_REF_DECLARED ≠ APPROVAL_OR_EXECUTION · EVIDENCE_REF_DECLARED ≠ VERIFIED_DOCUMENT · REFERENCE ≠ OFFER ≠ SOLICITATION ≠ BROKERAGE ≠ CUSTODY ≠ DISBURSEMENT';

  function governance(){return window.__SANA_CAPITAL_GOVERNANCE__}
  function snapshotApi(){return window.__SANA_DUE_DILIGENCE_SNAPSHOT__}
  function metadata(){const out=new Map();for(const r of storage?.records||[]){if(r.type!=='capital-review-reference-meta'||r.values?.sourceSchema!==base.schema)continue;const id=r.values?.caseId||'';if(id)out.set(id,{referenceVersion:r.values?.referenceVersion||'',recordId:r.id||''})}return out}
  function time(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:null}
  function firstEvent(c){return (c.events||[]).slice().sort((a,b)=>String(a.observedAt||'').localeCompare(String(b.observedAt||''))||String(a.id||'').localeCompare(String(b.id||'')))[0]||null}
  function forward(sourceAt,targetAt){const a=time(sourceAt),b=time(targetAt);return a!==null&&b!==null&&b>a?'FORWARD_REFERENCE':null}

  function resolveCapitalCase(c,source){
    const ref=c.capitalCaseRef||'';
    if(!ref)return {status:'MISSING_REFERENCE',domain:'CAPITAL_GOVERNANCE_CASE',targetId:'',targetLot:''};
    const target=governance()?.cases?.().find(x=>x.id===ref)||null;
    if(!target)return {status:'MISSING_TARGET',domain:'CAPITAL_GOVERNANCE_CASE',targetId:'',targetLot:''};
    if(c.lot&&target.lot&&c.lot!==target.lot)return {status:'CROSS_SCOPE_REFERENCE',domain:'CAPITAL_GOVERNANCE_CASE',targetId:target.id||'',targetLot:target.lot||''};
    const temporal=forward(source?.observedAt,firstEvent(target)?.observedAt);
    if(temporal)return {status:temporal,domain:'CAPITAL_GOVERNANCE_CASE',targetId:target.id||'',targetLot:target.lot||''};
    return {status:'LINKED',domain:'CAPITAL_GOVERNANCE_CASE',targetId:target.id||'',targetLot:target.lot||''};
  }

  function resolveSnapshot(source,ref){
    if(!ref)return {status:'MISSING_REFERENCE',domain:'DUE_DILIGENCE_SNAPSHOT',targetId:'',targetSchema:'',targetReportType:''};
    const target=(snapshotApi()?.snapshots?.()||[]).find(x=>x.id===ref)||null;
    if(!target)return {status:'MISSING_TARGET',domain:'DUE_DILIGENCE_SNAPSHOT',targetId:'',targetSchema:'',targetReportType:''};
    const schema=target.manifest?.schema||'';
    if(schema!=='SANA_DUE_DILIGENCE_SNAPSHOT_V1')return {status:'SCHEMA_MISMATCH',domain:'DUE_DILIGENCE_SNAPSHOT',targetId:target.id||'',targetSchema:schema,targetReportType:target.reportType||''};
    const temporal=forward(source?.observedAt,target.createdAt||target.cutoff);
    if(temporal)return {status:temporal,domain:'DUE_DILIGENCE_SNAPSHOT',targetId:target.id||'',targetSchema:schema,targetReportType:target.reportType||''};
    return {status:'LINKED',domain:'DUE_DILIGENCE_SNAPSHOT',targetId:target.id||'',targetSchema:schema,targetReportType:target.reportType||''};
  }

  function resolveSupport(c,e,ref,all){
    if(!ref)return {status:'MISSING_REFERENCE',domain:'CAPITAL_REVIEW_EVENT',targetId:'',targetKind:'',targetCaseId:'',targetLot:''};
    let target=null,owner=null;
    for(const x of all){const found=(x.events||[]).find(ev=>ev.id===ref);if(found){target=found;owner=x;break}}
    if(!target)return {status:'MISSING_TARGET',domain:'CAPITAL_REVIEW_EVENT',targetId:'',targetKind:'',targetCaseId:'',targetLot:''};
    if(owner?.id!==c.id)return {status:'CROSS_CASE_REFERENCE',domain:'CAPITAL_REVIEW_EVENT',targetId:target.id||'',targetKind:target.kind||'',targetCaseId:owner?.id||'',targetLot:target.lot||''};
    if((c.lot&&target.lot&&c.lot!==target.lot)||(c.lot&&e.lot&&c.lot!==e.lot))return {status:'CROSS_SCOPE_REFERENCE',domain:'CAPITAL_REVIEW_EVENT',targetId:target.id||'',targetKind:target.kind||'',targetCaseId:owner?.id||'',targetLot:target.lot||''};
    if(!REVIEW_TARGET_KINDS.has(target.kind))return {status:'KIND_MISMATCH',domain:'CAPITAL_REVIEW_EVENT',targetId:target.id||'',targetKind:target.kind||'',targetCaseId:owner?.id||'',targetLot:target.lot||''};
    const temporal=forward(e.observedAt,target.observedAt);
    if(temporal)return {status:temporal,domain:'CAPITAL_REVIEW_EVENT',targetId:target.id||'',targetKind:target.kind||'',targetCaseId:owner?.id||'',targetLot:target.lot||''};
    return {status:'LINKED',domain:'CAPITAL_REVIEW_EVENT',targetId:target.id||'',targetKind:target.kind||'',targetCaseId:owner?.id||'',targetLot:target.lot||''};
  }

  function canonicalRows(c,all){
    if(metadata().get(c.id)?.referenceVersion!==VERSION)return [];
    const rows=[],source=firstEvent(c)||{};
    rows.push({sourceCaseId:c.id||'',sourceEventId:source.id||'',sourceKind:'CASE',kind:'CAPITAL_CASE_REF',refId:c.capitalCaseRef||'',origin:'DECLARED_REVIEW_CASE',temporalPolicy:'CASE_FIRST_EVENT',reference:resolveCapitalCase(c,source)});
    const seen=new Set();
    for(const e of c.events||[]){const ref=e.snapshotRef||'';if(!ref||seen.has(ref))continue;seen.add(ref);rows.push({sourceCaseId:c.id||'',sourceEventId:e.id||'',sourceKind:e.kind||'',kind:'SNAPSHOT_REF',refId:ref,origin:'DECLARED_REVIEW_EVENT',temporalPolicy:'SNAPSHOT_CREATED_BEFORE_REFERENCE_WHEN_COMPARABLE',reference:resolveSnapshot(e,ref)})}
    if(!seen.size)rows.push({sourceCaseId:c.id||'',sourceEventId:source.id||'',sourceKind:source.kind||'',kind:'SNAPSHOT_REF',refId:'',origin:'DECLARED_REVIEW_EVENT',temporalPolicy:'SNAPSHOT_CREATED_BEFORE_REFERENCE_WHEN_COMPARABLE',reference:resolveSnapshot(source,'')});
    for(const e of c.events||[]){if(e.kind!=='EVIDENCE')continue;const refs=(e.supports||[]).length?e.supports:[''];for(const ref of refs)rows.push({sourceCaseId:c.id||'',sourceEventId:e.id||'',sourceKind:e.kind||'',kind:'REVIEW_SUPPORT_REF',refId:ref||'',origin:'DECLARED_REVIEW_EVENT',temporalPolicy:'WHEN_BOTH_TIMESTAMPS_PARSE',reference:resolveSupport(c,e,ref,all)})}
    return rows;
  }

  function declaredRows(c){
    const fields=[['reviewerRef','REVIEWER_REF_DECLARED'],['scopeRef','SCOPE_REF_DECLARED'],['requestRef','REQUEST_REF_DECLARED'],['documentRequestRef','DOCUMENT_REQUEST_REF_DECLARED'],['noteRef','NOTE_REF_DECLARED'],['assessmentRef','ASSESSMENT_REF_DECLARED'],['outcomeRef','OUTCOME_REF_DECLARED'],['decisionRef','DECISION_REF_DECLARED'],['evidenceRef','EVIDENCE_REF_DECLARED']];
    const out=[];for(const e of c.events||[])for(const [field,kind] of fields)if(e[field]!==undefined&&e[field]!==null&&e[field]!=='')out.push({sourceEventId:e.id||'',sourceKind:e.kind||'',kind,field,status:'DECLARED_NON_CANONICAL_REFERENCE',valueExposed:false});return out;
  }

  function caseFor(id){
    const all=base.cases(),c=all.find(x=>x.id===id);if(!c)return null;
    const meta=metadata().get(id)||{},captured=meta.referenceVersion===VERSION,rows=canonicalRows(c,all),linked=rows.filter(r=>r.reference.status==='LINKED').length;
    return {...c,referenceVersion:meta.referenceVersion||'',referenceSemanticsVersion:VERSION,referenceState:captured?'CAPTURED_V162':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null},referenceIssues:rows.length-linked,referenceRows:rows,declaredReferenceRows:declaredRows(c),declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',integrity:`${c.integrity} · ${INTEGRITY}`};
  }
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function summary(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V162');return {...base.summary(),referenceVersion:VERSION,referenceSemanticsVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:captured.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:captured.reduce((n,c)=>n+c.referenceIssues,0),declaredNonCanonical:captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0),legacyReferenceNotCaptured:all.length-captured.length,declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',integrity:`${base.summary().integrity} · ${INTEGRITY}`}}

  function openReference(caseId){const c=base.cases().find(x=>x.id===caseId);if(!c)return;openModal('CAPITAL REVIEW · REFERENCIAS V162','Validar referencias internas de la revisión',`<div class="fields"><input type="hidden" name="sourceSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="caseId" value="${esc(c.id)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot||'unidad')}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Activa V162: capitalCaseRef, snapshotRef y EVIDENCE.supports. No valida identidad, notas, assessment, outcome o decisión."></textarea></label><label class="full">Frontera<input value="REFERENCE ≠ APPROVAL/ELIGIBILITY/CREDIT SCORE/INVESTMENT RECOMMENDATION/EXECUTION" readonly></label></div>`,true,'capital-review-reference-meta')}
  function panel(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V162'),linked=captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=captured.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=captured.reduce((n,c)=>n+c.referenceIssues,0),declared=captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CAPITAL HUMAN REVIEW · REFERENCIAS V162</p><h2>Expediente, snapshot y soportes internos verificables sin fabricar aprobación</h2><p>Solo capitalCaseRef, snapshotRef y EVIDENCE.supports entran al denominador. Reviewer, scope, request, docs, note, assessment, outcome, decision y evidencia externa siguen declarados no canónicos.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Capturados V162',captured.length,'opt-in explícito')}${metric('Enlazadas',linked,'targets DEMO')}${metric('Issues',issues,'integridad referencial',issues?'warn':'good')}${metric('Refs. declaradas',declared,'conteo/tipo; valor oculto')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V162'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V162'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.lot||'unidad')}</strong><p>${c.referenceState==='CAPTURED_V162'?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} ref(s) · ${c.referenceIssues} issue(s) · ${c.declaredReferenceRows.length} declaradas no canónicas`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválida'}</p></div><button class="btn secondary" data-capital-review-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">CAPITAL_CASE_REFERENCE ≠ APPROVAL · SNAPSHOT_REFERENCE ≠ CONTENT_CORRECTNESS/LIVE_STATE · REVIEW_SUPPORT_REFERENCE ≠ VERIFIED_FACT · REVIEWER/NOTE/ASSESSMENT/OUTCOME/DECISION REFS DECLARED ≠ VERIFIED/EXECUTED · NO SCORE/ELIGIBILITY/INVESTMENT AUTHORITY.</div></div></section>`}
  function insert(html,section){for(const marker of ['<footer class="footer-note">','<footer class="footer">']){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const priorCapital=views.capital;if(priorCapital)views.capital=()=>insert(priorCapital(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-capital-review-ref]');if(b)openReference(b.dataset.capitalReviewRef)});
  window.__SANA_CAPITAL_REVIEW__=Object.freeze({...base,referenceVersion:VERSION,referenceSemanticsVersion:VERSION,cases,forLot,forCase:caseFor,summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();
