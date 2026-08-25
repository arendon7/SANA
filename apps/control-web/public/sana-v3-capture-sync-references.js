(() => {
  'use strict';
  const base=window.__SANA_CAPTURE_SYNC_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_CAPTURE_SYNC_LEDGER_V1')return;

  const VERSION='V152';
  const INTEGRITY='CAPTURE_SYNC_REFERENCE ≠ VERIFIED_SYNC · RECORD_REFERENCE ≠ SOURCE_AUTHENTICITY · ACK_REFERENCE_COHERENCE ≠ SERVER_VERIFICATION · CANDIDATE_REFERENCE ≠ SOURCE_VERIFICATION · CONFLICT_CANDIDATE ≠ TRUTH · HUMAN_RESOLUTION ≠ AUTOMATIC_CORRECTION · EVIDENCE_REFERENCE_DECLARED ≠ EXTERNAL_VERIFICATION · REFERENCE ≠ DATA_COMPLETENESS ≠ AGRONOMIC_DECISION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL · NO_CANONICAL_WRITE';

  function metadata(){
    const out=new Map();
    for(const r of storage?.records||[]){
      if(r.type!=='capture-sync-reference-meta'||r.values?.sourceSchema!==base.schema)continue;
      const id=r.values?.caseId||'';
      if(id)out.set(id,{referenceVersion:r.values?.referenceVersion||'',recordId:r.id||''});
    }
    return out;
  }
  function trustRows(){return window.__SANA_DATA_TRUST__?.rows?.()||[]}
  function trustRecord(id){return trustRows().find(r=>r.id===id)||null}
  function scopeStatus(c,t){
    if(!c?.lot)return 'MISSING_SOURCE_SCOPE';
    if(!t?.lot)return 'MISSING_TARGET_SCOPE';
    return c.lot===t.lot?null:'CROSS_SCOPE_REFERENCE';
  }
  function temporalAfter(source,targetTime){const s=Date.parse(source?.observedAt||''),t=Date.parse(targetTime||'');return Number.isFinite(s)&&Number.isFinite(t)&&t>s}
  function recordTypeStatus(c,t){
    const type=String(c.recordType||'').toLowerCase();
    if(!type)return 'MISSING_RECORD_TYPE';
    if(type==='sensor')return ['MANUAL_DEMO','SENSOR_DEMO'].includes(t.sourceClass)?null:'KIND_MISMATCH';
    if(type==='import')return t.sourceClass==='IMPORTED_DEMO'?null:'KIND_MISMATCH';
    return 'UNSUPPORTED_RECORD_TYPE';
  }
  function targetMeta(t){return t?{targetId:t.id||'',targetLot:t.lot||'',targetClass:t.sourceClass||'',targetAckState:t.ackState||'',targetConflictState:t.conflictState||''}:{targetId:'',targetLot:'',targetClass:'',targetAckState:'',targetConflictState:''}}
  function result(status,domain,t=null,extra={}){return {status,domain,...targetMeta(t),...extra}}

  function recordReference(c){
    if(!c.recordRef)return result('MISSING_REFERENCE','DATA_TRUST');
    const t=trustRecord(c.recordRef);
    if(!t)return result('MISSING_TARGET','DATA_TRUST');
    const scope=scopeStatus(c,t);if(scope)return result(scope,'DATA_TRUST',t);
    const kind=recordTypeStatus(c,t);if(kind)return result(kind,'DATA_TRUST',t);
    return result('LINKED','DATA_TRUST',t);
  }
  function ackReference(c,e){
    if(!e.ackRef)return result('MISSING_REFERENCE','DATA_TRUST_ACK');
    if(!c.recordRef)return result('MISSING_RECORD_REFERENCE','DATA_TRUST_ACK');
    const t=trustRecord(c.recordRef);
    if(!t)return result('MISSING_RECORD_TARGET','DATA_TRUST_ACK');
    const scope=scopeStatus(c,t);if(scope)return result(scope,'DATA_TRUST_ACK',t);
    const kind=recordTypeStatus(c,t);if(kind)return result(kind,'DATA_TRUST_ACK',t);
    if(t.ackState!=='SERVER_ACK_DEMO_EXPLICIT')return result('ACK_STATE_MISMATCH','DATA_TRUST_ACK',t);
    if(!t.ackRef)return result('MISSING_TARGET_REFERENCE','DATA_TRUST_ACK',t);
    if(t.ackRef!==e.ackRef)return result('ACK_REF_MISMATCH','DATA_TRUST_ACK',t);
    if(temporalAfter(e,t.capturedAt||t.observedAt))return result('FORWARD_REFERENCE','DATA_TRUST_ACK',t);
    return result('LINKED','DATA_TRUST_ACK',t);
  }
  function candidateReference(c,e,ref){
    if(!ref)return result('MISSING_REFERENCE','DATA_TRUST_CANDIDATE');
    if(!c.recordRef)return result('MISSING_RECORD_REFERENCE','DATA_TRUST_CANDIDATE');
    const t=trustRecord(c.recordRef);
    if(!t)return result('MISSING_RECORD_TARGET','DATA_TRUST_CANDIDATE');
    const scope=scopeStatus(c,t);if(scope)return result(scope,'DATA_TRUST_CANDIDATE',t);
    const kind=recordTypeStatus(c,t);if(kind)return result(kind,'DATA_TRUST_CANDIDATE',t);
    if(t.conflictState!=='CONFLICT_REVIEW_REQUIRED')return result('CONFLICT_STATE_MISMATCH','DATA_TRUST_CANDIDATE',t);
    const candidate=(t.candidates||[]).find(x=>x.sourceRef===ref||x.candidateId===ref)||null;
    if(!candidate)return result('MISSING_TARGET','DATA_TRUST_CANDIDATE',t);
    if(temporalAfter(e,candidate.capturedAt))return result('FORWARD_REFERENCE','DATA_TRUST_CANDIDATE',t,{targetCandidateId:candidate.candidateId||''});
    return result('LINKED','DATA_TRUST_CANDIDATE',t,{targetCandidateId:candidate.candidateId||''});
  }
  function canonicalRows(c){
    if(metadata().get(c.id)?.referenceVersion!==VERSION)return [];
    const rows=[{sourceEventId:'CASE',sourceKind:'CASE',kind:'RECORD_REF',refId:c.recordRef||'',origin:'DECLARED_CAPTURE_SYNC_CASE',temporalPolicy:'NOT_APPLICABLE',reference:recordReference(c)}];
    for(const e of c.events||[]){
      if(e.kind==='SERVER_ACK_DEMO_EXPLICIT')rows.push({sourceEventId:e.id||'',sourceKind:e.kind,kind:'ACK_COHERENCE_REF',refId:e.ackRef||'',origin:'DECLARED_CAPTURE_SYNC_EVENT',temporalPolicy:'WHEN_BOTH_TIMESTAMPS_PARSE',reference:ackReference(c,e)});
      if(e.kind==='CONFLICT_DETECTED'){
        const refs=(e.candidateRefs||[]).length?e.candidateRefs:[''];
        for(const ref of refs)rows.push({sourceEventId:e.id||'',sourceKind:e.kind,kind:'CONFLICT_CANDIDATE_REF',refId:ref||'',origin:'DECLARED_CAPTURE_SYNC_EVENT',temporalPolicy:'WHEN_BOTH_TIMESTAMPS_PARSE',reference:candidateReference(c,e,ref)});
      }
    }
    return rows;
  }
  function declaredRows(c){
    const out=[];
    for(const e of c.events||[])if(e.kind==='EVIDENCE'&&e.evidenceRef)out.push({sourceEventId:e.id||'',sourceKind:e.kind,kind:'EVIDENCE_REF_DECLARED',field:'evidenceRef',status:'DECLARED_NON_CANONICAL_REFERENCE',valueExposed:false});
    return out;
  }
  function caseFor(id){
    const c=base.cases().find(x=>x.id===id);if(!c)return null;
    const meta=metadata().get(id)||{},captured=meta.referenceVersion===VERSION,rows=canonicalRows(c),linked=rows.filter(r=>r.reference.status==='LINKED').length;
    return {...c,referenceVersion:meta.referenceVersion||'',referenceSemanticsVersion:VERSION,referenceState:captured?'CAPTURED_V152':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null},referenceIssues:rows.length-linked,referenceRows:rows,declaredReferenceRows:declaredRows(c),declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',integrity:`${c.integrity} · ${INTEGRITY}`};
  }
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function forRecord(recordRef){return cases().filter(c=>c.recordRef===recordRef)}
  function summary(){
    const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V152');
    return {...base.summary(),referenceVersion:VERSION,referenceSemanticsVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:captured.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:captured.reduce((n,c)=>n+c.referenceIssues,0),declaredNonCanonical:captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0),legacyReferenceNotCaptured:all.length-captured.length,declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',integrity:`${base.summary().integrity} · ${INTEGRITY}`};
  }
  function openReference(caseId){
    const c=base.cases().find(x=>x.id===caseId);if(!c)return;
    openModal('CAPTURE SYNC · REFERENCIAS V152','Validar coherencia interna con Data Trust',`<div class="fields"><input type="hidden" name="sourceSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="caseId" value="${esc(c.id)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot||'—')}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Activa validación V152 de recordRef, ACK y candidatos preservados."></textarea></label><label class="full">Frontera<input value="REFERENCE COHERENCE ≠ SERVER/SOURCE VERIFICATION · NO CANONICAL WRITE" readonly></label></div>`,true,'capture-sync-reference-meta');
  }
  function panel(){
    const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V152'),linked=captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=captured.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=captured.reduce((n,c)=>n+c.referenceIssues,0),declared=captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CAPTURE SYNC · REFERENCIAS V152</p><h2>Record, ACK y candidatos enlazados sin fabricar verificación</h2><p>Data Trust sirve como destino interno de coherencia. Un enlace válido no autentica servidor, fuente, hardware, calibración ni medición.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Capturados V152',captured.length,'opt-in explícito')}${metric('Enlazadas',linked,'coherencia interna')}${metric('Issues',issues,'integridad referencial',issues?'warn':'good')}${metric('Refs. declaradas',declared,'conteo/tipo; valor oculto')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V152'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V152'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.recordRef||'sin recordRef')}</strong><p>${c.referenceState==='CAPTURED_V152'?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} refs · ${c.referenceIssues} issue(s) · ${c.declaredReferenceRows.length} declarada(s) no canónica(s)`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválida'}</p></div><button class="btn secondary" data-capture-sync-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">RECORD/ACK/CANDIDATE LINK ≠ VERIFIED SYNC/SOURCE · CONFLICT CANDIDATE ≠ TRUTH · NO DATA COMPLETENESS/AGRONOMIC/CREDIT/ELIGIBILITY/INVESTMENT SIGNAL.</div></div></section>`;
  }
  function insert(html,section){for(const m of ['<footer class="footer-note">','<footer class="footer">']){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const prior=views.iot;if(prior)views.iot=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-capture-sync-ref]');if(b)openReference(b.dataset.captureSyncRef)});
  window.__SANA_CAPTURE_SYNC_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,referenceSemanticsVersion:VERSION,cases,forLot,forRecord,forCase:caseFor,summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();
