(() => {
  'use strict';
  const base=window.__SANA_DATA_TRUST__;
  if(!base?.rows||base.schema!=='SANA_DATA_TRUST_V1')return;

  const VERSION='V160';
  const INTEGRITY='DATA_TRUST_REFERENCE_COHERENCE ≠ VERIFIED_SYNC · ACK_COHERENCE ≠ SERVER_VERIFICATION · CONFLICT_CANDIDATE_COHERENCE ≠ SOURCE_AUTHENTICITY ≠ TRUTH · SOURCE_REF_DECLARED ≠ SOURCE_IDENTITY_VERIFIED · DEVICE_LABEL ≠ CERTIFIED_INSTRUMENT · READING ≠ VALIDATED_MEASUREMENT · REFERENCE ≠ DATA_QUALITY_SCORE ≠ AGRONOMIC_DECISION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL · NO_CANONICAL_WRITE';

  function metadata(){const out=new Map();for(const r of storage?.records||[]){if(r.type!=='data-trust-reference-meta'||r.values?.sourceSchema!==base.schema)continue;const id=r.values?.readingId||'';if(id)out.set(id,{referenceVersion:r.values?.referenceVersion||'',recordId:r.id||''})}return out}
  function syncCases(){return window.__SANA_CAPTURE_SYNC_LEDGER__?.cases?.()||[]}
  function casesForReading(id){return syncCases().filter(c=>c.recordRef===id)}
  function parse(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:null}
  function result(status,domain,c=null,e=null,extra={}){return {status,domain,targetCaseId:c?.id||'',targetLot:c?.lot||'',targetEventId:e?.id||'',targetKind:e?.kind||'',...extra}}
  function uniqueCase(r,domain){const all=casesForReading(r.id);if(!all.length)return {error:result('MISSING_TARGET',domain)};if(all.length>1)return {error:result('AMBIGUOUS_TARGET',domain,null,null,{targetCount:all.length})};const c=all[0];if(!r.lot)return {error:result('MISSING_SOURCE_SCOPE',domain,c)};if(!c.lot)return {error:result('MISSING_TARGET_SCOPE',domain,c)};if(c.lot!==r.lot)return {error:result('CROSS_SCOPE_REFERENCE',domain,c)};return {case:c}}
  function ackReference(r){
    if(r.ackState!=='SERVER_ACK_DEMO_EXPLICIT'&&!r.ackRef)return result('NOT_APPLICABLE','CAPTURE_SYNC_ACK');
    if(r.ackState!=='SERVER_ACK_DEMO_EXPLICIT')return result('ACK_STATE_MISMATCH','CAPTURE_SYNC_ACK');
    if(!r.ackRef)return result('MISSING_REFERENCE','CAPTURE_SYNC_ACK');
    const q=uniqueCase(r,'CAPTURE_SYNC_ACK');if(q.error)return q.error;const c=q.case;
    const matches=(c.events||[]).filter(e=>e.kind==='SERVER_ACK_DEMO_EXPLICIT'&&e.ackRef===r.ackRef);
    if(!matches.length)return result('MISSING_TARGET','CAPTURE_SYNC_ACK',c);
    if(matches.length>1)return result('AMBIGUOUS_TARGET','CAPTURE_SYNC_ACK',c,null,{targetCount:matches.length});
    const e=matches[0],sourceTime=parse(r.capturedAt||r.observedAt),targetTime=parse(e.observedAt);
    if(sourceTime!==null&&targetTime!==null&&targetTime<sourceTime)return result('TEMPORAL_ORDER_MISMATCH','CAPTURE_SYNC_ACK',c,e);
    return result('LINKED','CAPTURE_SYNC_ACK',c,e);
  }
  function candidateReference(r,candidate){
    const ref=candidate?.sourceRef||candidate?.candidateId||'';if(!ref)return result('MISSING_REFERENCE','CAPTURE_SYNC_CONFLICT');
    if(r.conflictState!=='CONFLICT_REVIEW_REQUIRED')return result('CONFLICT_STATE_MISMATCH','CAPTURE_SYNC_CONFLICT');
    const q=uniqueCase(r,'CAPTURE_SYNC_CONFLICT');if(q.error)return q.error;const c=q.case;
    const matches=(c.events||[]).filter(e=>e.kind==='CONFLICT_DETECTED'&&(e.candidateRefs||[]).includes(ref));
    if(!matches.length)return result('MISSING_TARGET','CAPTURE_SYNC_CONFLICT',c);
    if(matches.length>1)return result('AMBIGUOUS_TARGET','CAPTURE_SYNC_CONFLICT',c,null,{targetCount:matches.length});
    const e=matches[0],sourceTime=parse(candidate?.capturedAt||r.capturedAt||r.observedAt),targetTime=parse(e.observedAt);
    if(sourceTime!==null&&targetTime!==null&&targetTime<sourceTime)return result('TEMPORAL_ORDER_MISMATCH','CAPTURE_SYNC_CONFLICT',c,e,{targetCandidateRef:ref});
    return result('LINKED','CAPTURE_SYNC_CONFLICT',c,e,{targetCandidateRef:ref});
  }
  function canonicalRows(r){
    if(metadata().get(r.id)?.referenceVersion!==VERSION)return [];
    const out=[];
    if(r.ackState==='SERVER_ACK_DEMO_EXPLICIT'||r.ackRef)out.push({sourceReadingId:r.id,sourceKind:'DATA_TRUST_READING',kind:'ACK_COHERENCE_REF',refId:r.ackRef||'',origin:'DECLARED_DATA_TRUST_STATE',temporalPolicy:'ACK_NOT_BEFORE_CAPTURE_WHEN_PARSEABLE',reference:ackReference(r)});
    if(r.conflictState==='CONFLICT_REVIEW_REQUIRED'||(r.candidates||[]).length){const candidates=(r.candidates||[]).length?r.candidates:[null];for(const candidate of candidates)out.push({sourceReadingId:r.id,sourceKind:'DATA_TRUST_READING',kind:'CONFLICT_CANDIDATE_COHERENCE_REF',refId:candidate?.sourceRef||candidate?.candidateId||'',origin:'DECLARED_DATA_TRUST_CANDIDATE',temporalPolicy:'CONFLICT_NOT_BEFORE_CANDIDATE_WHEN_PARSEABLE',reference:candidateReference(r,candidate)})}
    return out;
  }
  function declaredRows(r){const out=[];if(r.sourceRef)out.push({sourceReadingId:r.id,sourceKind:r.sourceClass||'DATA_TRUST_READING',kind:'SOURCE_REF_DECLARED',field:'sourceRef',status:'DECLARED_NON_CANONICAL_REFERENCE',valueExposed:false});return out}
  function rowFor(id){
    const r=base.rows().find(x=>x.id===id);if(!r)return null;const meta=metadata().get(id)||{},captured=meta.referenceVersion===VERSION,rows=canonicalRows(r),applicable=rows.filter(x=>x.reference.status!=='NOT_APPLICABLE'),linked=applicable.filter(x=>x.reference.status==='LINKED').length;
    return {...r,referenceVersion:meta.referenceVersion||'',referenceSemanticsVersion:VERSION,referenceState:captured?'CAPTURED_V160':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked,total:applicable.length,percent:applicable.length?Math.round(linked/applicable.length*100):null},referenceIssues:applicable.length-linked,referenceRows:rows,declaredReferenceRows:declaredRows(r),declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',integrity:`${r.integrity||base.integrity} · ${INTEGRITY}`};
  }
  function rows(){return base.rows().map(r=>rowFor(r.id)).filter(Boolean)}
  function forLot(lot){return rows().filter(r=>r.lot===lot)}
  function summary(){const all=rows(),captured=all.filter(r=>r.referenceState==='CAPTURED_V160');return {...base.summary(),referenceVersion:VERSION,referenceSemanticsVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,r)=>n+r.referenceCoverage.linked,0),referenceExpected:captured.reduce((n,r)=>n+r.referenceCoverage.total,0),referenceIssues:captured.reduce((n,r)=>n+r.referenceIssues,0),declaredNonCanonical:captured.reduce((n,r)=>n+r.declaredReferenceRows.length,0),legacyReferenceNotCaptured:all.length-captured.length,declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',integrity:`${base.summary().integrity} · ${INTEGRITY}`}}
  function openReference(readingId){const r=base.rows().find(x=>x.id===readingId);if(!r)return;openModal('DATA TRUST · REFERENCIAS V160','Validar coherencia interna con Capture/Sync',`<div class="fields"><input type="hidden" name="sourceSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="readingId" value="${esc(r.id)}"><label>Lectura<input value="${esc(r.id)} · ${esc(r.lot||'—')}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Activa validación V160 de ACK y candidatos contra Capture/Sync."></textarea></label><label class="full">Frontera<input value="COHERENCE ≠ SERVER/SOURCE VERIFICATION · NO CANONICAL WRITE" readonly></label></div>`,true,'data-trust-reference-meta')}
  function panel(){const all=rows(),captured=all.filter(r=>r.referenceState==='CAPTURED_V160'),linked=captured.reduce((n,r)=>n+r.referenceCoverage.linked,0),total=captured.reduce((n,r)=>n+r.referenceCoverage.total,0),issues=captured.reduce((n,r)=>n+r.referenceIssues,0),declared=captured.reduce((n,r)=>n+r.declaredReferenceRows.length,0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">DATA TRUST · REFERENCIAS V160</p><h2>ACK y candidatos coherentes sin fabricar verificación</h2><p>Capture/Sync sirve como destino interno de coherencia. Un enlace válido no autentica servidor, fuente, hardware, calibración ni medición.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Capturadas V160',captured.length,'opt-in explícito')}${metric('Enlazadas',linked,'coherencia interna')}${metric('Issues',issues,'integridad referencial',issues?'warn':'good')}${metric('Refs. fuente',declared,'conteo/tipo; valor oculto')}</div>${all.map(r=>`<div class="gate" style="margin-top:10px"><i class="${r.referenceState==='CAPTURED_V160'?(r.referenceIssues?'warn':'ok'):''}">${r.referenceState==='CAPTURED_V160'?(r.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(r.id)} · ${esc(r.lot||'sin lote')}</strong><p>${r.referenceState==='CAPTURED_V160'?`${r.referenceCoverage.linked}/${r.referenceCoverage.total} refs · ${r.referenceIssues} issue(s) · ${r.declaredReferenceRows.length} fuente(s) no canónica(s)`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválida'}</p></div><button class="btn secondary" data-data-trust-ref="${esc(r.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">ACK/CANDIDATE COHERENCE ≠ VERIFIED SYNC/SOURCE · SOURCE_REF ≠ IDENTITY/AUTHENTICITY · REFERENCE ≠ DATA QUALITY/AGRONOMIC/CREDIT/ELIGIBILITY/INVESTMENT SIGNAL.</div></div></section>`}
  function insert(html,section){for(const m of ['<footer class="footer-note">','<footer class="footer">']){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const prior=views.iot;if(prior)views.iot=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-data-trust-ref]');if(b)openReference(b.dataset.dataTrustRef)});
  window.__SANA_DATA_TRUST__=Object.freeze({...base,referenceVersion:VERSION,referenceSemanticsVersion:VERSION,rows,forLot,forReading:rowFor,summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();