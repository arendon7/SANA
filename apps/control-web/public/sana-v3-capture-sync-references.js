(() => {
  'use strict';
  const base=window.__SANA_CAPTURE_SYNC_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_CAPTURE_SYNC_LEDGER_V1')return;

  const VERSION='V150';
  const INTEGRITY='CAPTURE_SYNC_REFERENCE ≠ VERIFIED_SYNC · RECORD_REFERENCE ≠ SOURCE_AUTHENTICITY · ACK_REFERENCE_COHERENCE ≠ SERVER_VERIFICATION · CANDIDATE_REFERENCE ≠ SOURCE_VERIFICATION · CONFLICT_CANDIDATE ≠ TRUTH · HUMAN_RESOLUTION ≠ AUTOMATIC_CORRECTION · EVIDENCE_REFERENCE_DECLARED ≠ EXTERNAL_VERIFICATION · REFERENCE ≠ DATA_COMPLETENESS ≠ AGRONOMIC_DECISION ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL · NO_CANONICAL_WRITE';

  function metadata(){
    const out=new Map();
    (storage?.records||[]).filter(r=>r.type==='capture-sync-reference-meta'&&r.values?.sourceSchema===base.schema).forEach(r=>{
      const id=r.values?.caseId||'';
      if(id)out.set(id,{referenceVersion:r.values?.referenceVersion||'',recordId:r.id||''});
    });
    return out;
  }
  function trustRows(){return window.__SANA_DATA_TRUST__?.rows?.()||[]}
  function trustRecord(id){return trustRows().find(r=>r.id===id)||null}
  function sameScope(a,b){return !a||!b||a===b}
  function temporalAfter(source,target){const s=Date.parse(source?.observedAt||''),t=Date.parse(target?.capturedAt||target?.observedAt||'');return Number.isFinite(s)&&Number.isFinite(t)&&t>s}
  function recordTypeStatus(c,t){
    const type=String(c.recordType||'').toLowerCase();
    if(!type)return 'MISSING_RECORD_TYPE';
    if(type==='sensor')return ['MANUAL_DEMO','SENSOR_DEMO'].includes(t.sourceClass)?null:'KIND_MISMATCH';
    if(type==='import')return t.sourceClass==='IMPORTED_DEMO'?null:'KIND_MISMATCH';
    return 'UNSUPPORTED_RECORD_TYPE';
  }
  function recordReference(c){
    if(!c.recordRef)return {status:'MISSING_REFERENCE',domain:'DATA_TRUST',target:null};
    const t=trustRecord(c.recordRef);
    if(!t)return {status:'MISSING_TARGET',domain:'DATA_TRUST',target:null};
    if(!sameScope(c.lot,t.lot))return {status:'CROSS_SCOPE_REFERENCE',domain:'DATA_TRUST',target:t};
    const kind=recordTypeStatus(c,t);if(kind)return {status:kind,domain:'DATA_TRUST',target:t};
    return {status:'LINKED',domain:'DATA_TRUST',target:t};
  }
  function ackReference(c,e){
    if(!e.ackRef)return {status:'MISSING_REFERENCE',domain:'DATA_TRUST_ACK',target:null};
    if(!c.recordRef)return {status:'MISSING_RECORD_REFERENCE',domain:'DATA_TRUST_ACK',target:null};
    const t=trustRecord(c.recordRef);
    if(!t)return {status:'MISSING_RECORD_TARGET',domain:'DATA_TRUST_ACK',target:null};
    if(!sameScope(c.lot,t.lot))return {status:'CROSS_SCOPE_REFERENCE',domain:'DATA_TRUST_ACK',target:t};
    const kind=recordTypeStatus(c,t);if(kind)return {status:kind,domain:'DATA_TRUST_ACK',target:t};
    if(t.ackState!=='SERVER_ACK_DEMO_EXPLICIT')return {status:'ACK_STATE_MISMATCH',domain:'DATA_TRUST_ACK',target:t};
    if(!t.ackRef)return {status:'MISSING_TARGET_REFERENCE',domain:'DATA_TRUST_ACK',target:t};
    if(t.ackRef!==e.ackRef)return {status:'ACK_REF_MISMATCH',domain:'DATA_TRUST_ACK',target:t};
    if(temporalAfter(e,t))return {status:'FORWARD_REFERENCE',domain:'DATA_TRUST_ACK',target:t};
    return {status:'LINKED',domain:'DATA_TRUST_ACK',target:t};
  }
  function candidateReference(c,e,ref){
    if(!ref)return {status:'MISSING_REFERENCE',domain:'DATA_TRUST_CANDIDATE',target:null};
    if(!c.recordRef)return {status:'MISSING_RECORD_REFERENCE',domain:'DATA_TRUST_CANDIDATE',target:null};
    const t=trustRecord(c.recordRef);
    if(!t)return {status:'MISSING_RECORD_TARGET',domain:'DATA_TRUST_CANDIDATE',target:null};
    if(!sameScope(c.lot,t.lot))return {status:'CROSS_SCOPE_REFERENCE',domain:'DATA_TRUST_CANDIDATE',target:t};
    const kind=recordTypeStatus(c,t);if(kind)return {status:kind,domain:'DATA_TRUST_CANDIDATE',target:t};
    if(t.conflictState!=='CONFLICT_REVIEW_REQUIRED')return {status:'CONFLICT_STATE_MISMATCH',domain:'DATA_TRUST_CANDIDATE',target:t};
    const candidate=(t.candidates||[]).find(x=>x.sourceRef===ref||x.candidateId===ref)||null;
    if(!candidate)return {status:'MISSING_TARGET',domain:'DATA_TRUST_CANDIDATE',target:null};
    const sourceTime=Date.parse(e.observedAt||''),candidateTime=Date.parse(candidate.capturedAt||'');
    if(Number.isFinite(sourceTime)&&Number.isFinite(candidateTime)&&candidateTime>sourceTime)return {status:'FORWARD_REFERENCE',domain:'DATA_TRUST_CANDIDATE',target:candidate};
    return {status:'LINKED',domain:'DATA_TRUST_CANDIDATE',target:candidate};
  }
  function canonicalRows(c){
    if(metadata().get(c.id)?.referenceVersion!==VERSION)return [];
    const rows=[{sourceEventId:'CASE',sourceKind:'CASE',kind:'RECORD_REF',refId:c.recordRef||'',reference:recordReference(c)}];
    for(const e of c.events||[]){
      if(e.kind==='SERVER_ACK_DEMO_EXPLICIT')rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'ACK_COHERENCE_REF',refId:e.ackRef||'',recordRef:c.recordRef||'',reference:ackReference(c,e)});
      if(e.kind==='CONFLICT_DETECTED'){
        const refs=(e.candidateRefs||[]).length?e.candidateRefs:[''];
        refs.forEach(ref=>rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'CONFLICT_CANDIDATE_REF',refId:ref||'',recordRef:c.recordRef||'',reference:candidateReference(c,e,ref)}));
      }
    }
    return rows;
  }
  function declaredRows(c){
    const out=[];
    for(const e of c.events||[]){
      if(e.kind==='EVIDENCE'&&e.evidenceRef)out.push({sourceEventId:e.id,kind:'EVIDENCE_REF_DECLARED',refId:e.evidenceRef,status:'DECLARED_NON_CANONICAL_REFERENCE'});
    }
    return out;
  }
  function caseFor(id){
    const c=base.cases().find(x=>x.id===id);if(!c)return null;
    const meta=metadata().get(id)||{},captured=meta.referenceVersion===VERSION,rows=canonicalRows(c),linked=rows.filter(r=>r.reference.status==='LINKED').length;
    return {...c,referenceVersion:meta.referenceVersion||'',referenceState:captured?'CAPTURED_V150':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null},referenceIssues:rows.length-linked,referenceRows:rows,declaredReferenceRows:declaredRows(c),integrity:`${c.integrity} · ${INTEGRITY}`};
  }
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function forRecord(recordRef){return cases().filter(c=>c.recordRef===recordRef)}
  function summary(){
    const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V150');
    return {...base.summary(),referenceVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:captured.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:captured.reduce((n,c)=>n+c.referenceIssues,0),declaredNonCanonical:captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0),legacyReferenceNotCaptured:all.length-captured.length,integrity:`${base.summary().integrity} · ${INTEGRITY}`};
  }
  function openReference(caseId){
    const c=base.cases().find(x=>x.id===caseId);if(!c)return;
    openModal('CAPTURE SYNC · REFERENCIAS V150','Validar coherencia interna con Data Trust',`<div class="fields"><input type="hidden" name="sourceSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="caseId" value="${esc(c.id)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot||'—')}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Activa validación V150 de recordRef, ACK y candidatos preservados."></textarea></label><label class="full">Frontera<input value="REFERENCE COHERENCE ≠ SERVER/SOURCE VERIFICATION · NO CANONICAL WRITE" readonly></label></div>`,true,'capture-sync-reference-meta');
  }
  function panel(){
    const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V150'),linked=captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=captured.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=captured.reduce((n,c)=>n+c.referenceIssues,0),declared=captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CAPTURE SYNC · REFERENCIAS V150</p><h2>Record, ACK y candidatos enlazados sin fabricar verificación</h2><p>Data Trust sirve como destino interno de coherencia. Un enlace válido no autentica servidor, fuente, hardware, calibración ni medición.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Capturados V150',captured.length,'opt-in explícito')}${metric('Enlazadas',linked,'coherencia interna')}${metric('Issues',issues,'integridad referencial',issues?'warn':'good')}${metric('Refs. declaradas',declared,'fuera del denominador')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V150'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V150'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.recordRef||'sin recordRef')}</strong><p>${c.referenceState==='CAPTURED_V150'?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} refs · ${c.referenceIssues} issue(s) · ${c.declaredReferenceRows.length} declarada(s) no canónica(s)`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválida'}</p></div><button class="btn secondary" data-capture-sync-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">RECORD/ACK/CANDIDATE LINK ≠ VERIFIED SYNC/SOURCE · CONFLICT CANDIDATE ≠ TRUTH · NO DATA COMPLETENESS/AGRONOMIC/CREDIT/INVESTMENT SIGNAL.</div></div></section>`;
  }
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const m of markers){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const prior=views.iot;if(prior)views.iot=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-capture-sync-ref]');if(b)openReference(b.dataset.captureSyncRef)});
  window.__SANA_CAPTURE_SYNC_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,cases,forLot,forRecord,forCase:caseFor,summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();
