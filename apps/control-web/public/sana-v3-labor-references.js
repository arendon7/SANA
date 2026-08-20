(() => {
  'use strict';
  const base=window.__SANA_LABOR_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_LABOR_LEDGER_V1')return;

  const VERSION='V141';
  const INTEGRITY='LABOR_REFERENCE ≠ LABOR_TRUTH · ACTIVITY_REFERENCE ≠ WORK_EXECUTION · EVIDENCE_REFERENCE ≠ EXTERNAL_VERIFICATION · SUPPORT_REFERENCE ≠ QUALITY · COST_BASIS_REFERENCE ≠ COST_VALIDITY · PERSON_REF ≠ IDENTITY_VERIFICATION · PAYMENT_REF_DECLARED ≠ PAYMENT_VERIFIED · RATE_SOURCE_REF_DECLARED ≠ RATE_VERIFIED · COST_REF_DECLARED ≠ ACCOUNTING_VERIFICATION · REFERENCE ≠ HR_SCORE ≠ PAYROLL_AUTHORITY';
  const SUPPORT_KINDS=new Set(['ASSIGNMENT','ATTENDANCE','WORKED_TIME','TASK_RESULT','RATE_REFERENCE','LABOR_COST','PAYMENT_STATUS']);
  const COST_BASIS_KINDS=new Set(['WORKED_TIME','RATE_REFERENCE']);

  function metadata(){const m=new Map();(storage?.records||[]).filter(r=>r.type==='labor-reference-meta'&&r.values?.laborSchema===base.schema).forEach(r=>{const id=r.values?.caseId||'';if(id)m.set(id,{referenceVersion:r.values?.referenceVersion||'',metadataRecordId:r.id||''})});return m}
  function allEvents(){return base.cases().flatMap(c=>(c.events||[]).map(e=>({...e,caseId:c.id,lot:e.lot||c.lot||''})))}
  function eventIndex(){return new Map(allEvents().map(e=>[e.id,e]))}
  function activity(id){return window.__SANA_PLAN_FIELD_WORKFLOW__?.findActivity?.(id)||null}
  function evidence(id){return (DEMO.evidence||[]).find(e=>e.id===id)||null}
  function ts(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:null}

  function checkActivity(source,id){if(!id)return {status:'NOT_DECLARED',domain:'ACTIVITY',target:null};const t=activity(id);if(!t)return {status:'MISSING_TARGET',domain:'ACTIVITY',target:null};if(source.lot&&t.lot&&source.lot!==t.lot)return {status:'CROSS_LOT_REFERENCE',domain:'ACTIVITY',target:t};return {status:'LINKED',domain:'ACTIVITY',target:t}}
  function checkEvidence(source,id){if(!id)return {status:'MISSING_REFERENCE',domain:'EVIDENCE',target:null};const t=evidence(id);if(!t)return {status:'MISSING_TARGET',domain:'EVIDENCE',target:null};if(source.lot&&t.lot&&source.lot!==t.lot)return {status:'CROSS_LOT_REFERENCE',domain:'EVIDENCE',target:t};return {status:'LINKED',domain:'EVIDENCE',target:t}}
  function checkLaborEvent(source,id,allowed,domain){
    if(!id)return {status:'MISSING_REFERENCE',domain,target:null};const t=eventIndex().get(id)||null;if(!t)return {status:'MISSING_TARGET',domain,target:null};if(t.id===source.id)return {status:'SELF_REFERENCE',domain,target:t};if(t.caseId!==source.caseId)return {status:'CROSS_CASE_REFERENCE',domain,target:t};if(allowed&&!allowed.has(t.kind))return {status:'KIND_MISMATCH',domain,target:t};const a=ts(source.observedAt),b=ts(t.observedAt);if(a!==null&&b!==null&&b>a)return {status:'FORWARD_REFERENCE',domain,target:t};return {status:'LINKED',domain,target:t}
  }
  function rowsFor(c){
    if(metadata().get(c.id)?.referenceVersion!==VERSION)return [];
    const rows=[];
    for(const e of c.events||[]){
      if(e.activityId)rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'ACTIVITY',refId:e.activityId,reference:checkActivity(e,e.activityId)});
      if(e.kind==='EVIDENCE'){
        rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'EVIDENCE_REF',refId:e.evidenceRef||'',reference:checkEvidence(e,e.evidenceRef||'')});
        for(const id of e.supports||[])rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'SUPPORTS',refId:id,reference:checkLaborEvent(e,id,SUPPORT_KINDS,'LABOR_SUPPORT')});
      }
      if(e.kind==='LABOR_COST')for(const id of e.basisRefs||[])rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'COST_BASIS',refId:id,reference:checkLaborEvent(e,id,COST_BASIS_KINDS,'LABOR_COST_BASIS')});
    }
    return rows;
  }
  function nonCanonicalFor(c){const out=[];for(const e of c.events||[]){if(e.kind==='RATE_REFERENCE'&&e.sourceRef)out.push({sourceEventId:e.id,kind:'RATE_SOURCE_REF',refId:e.sourceRef,state:'DECLARED_NOT_CANONICALLY_VERIFIED'});if(e.kind==='LABOR_COST'&&e.costRef)out.push({sourceEventId:e.id,kind:'COST_REF',refId:e.costRef,state:'DECLARED_NOT_CANONICALLY_VERIFIED'});if(e.kind==='PAYMENT_STATUS'&&e.paymentRef)out.push({sourceEventId:e.id,kind:'PAYMENT_REF',refId:e.paymentRef,state:'DECLARED_NOT_CANONICALLY_VERIFIED'})}return out}
  function caseFor(id){const c=base.cases().find(x=>x.id===id);if(!c)return null;const meta=metadata().get(id)||{},rows=rowsFor(c),linked=rows.filter(r=>r.reference.status==='LINKED').length,captured=meta.referenceVersion===VERSION;return {...c,referenceVersion:meta.referenceVersion||'',referenceState:captured?'CAPTURED_V141':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null},referenceIssues:rows.length-linked,referenceRows:rows,declaredNonCanonicalReferences:captured?nonCanonicalFor(c):[],integrity:`${c.integrity} · ${INTEGRITY}`}}
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function forActivity(activityId){return cases().filter(c=>c.activityId===activityId)}
  function summary(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V141');return {...base.summary(),referenceVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:captured.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:captured.reduce((n,c)=>n+c.referenceIssues,0),declaredNonCanonicalReferences:captured.reduce((n,c)=>n+c.declaredNonCanonicalReferences.length,0),legacyReferenceNotCaptured:all.length-captured.length,integrity:`${base.summary().integrity} · ${INTEGRITY}`}}

  function openReference(caseId){const c=base.cases().find(x=>x.id===caseId);if(!c)return;openModal('EQUIPO · REFERENCIAS V141','Validar referencias declaradas',`<div class="fields"><input type="hidden" name="laborSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="caseId" value="${esc(c.id)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.role||'rol')}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Alcance<input value="actividad=${esc(c.activityId||'—')} · lote=${esc(c.lot||'—')} · ${c.events?.length||0} evento(s)" readonly></label><label class="full">Nota<textarea name="detail" placeholder="Marca el caso para validación V141. No verifica identidad, pago, nómina, desempeño ni calidad."></textarea></label><label class="full">Frontera<input value="REFERENCE ≠ WORK TRUTH · SUPPORT ≠ QUALITY · COST BASIS ≠ COST VALIDITY · NO HR SCORING · NO PAYROLL" readonly></label></div>`,true,'labor-reference-meta')}
  function panel(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V141'),linked=captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=captured.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=captured.reduce((n,c)=>n+c.referenceIssues,0),declared=captured.reduce((n,c)=>n+c.declaredNonCanonicalReferences.length,0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">EQUIPO · REFERENCIAS V141</p><h2>Relaciones laborales verificables sin evaluar personas</h2><p>Actividad, evidencia, soportes y bases de costo se validan por destino, caso/lote, tipo y temporalidad cuando existe timestamp comparable.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Capturados V141',captured.length,'opt-in explícito')}${metric('Enlazadas',linked,'referencias canónicas')}${metric('Issues',issues,'integridad documental',issues?'warn':'good')}${metric('Refs declaradas no verificables',declared,'pago/tarifa/costo')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V141'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V141'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.role||'rol')}</strong><p>${c.referenceState==='CAPTURED_V141'?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} referencias · ${c.referenceIssues} issue(s) · ${c.declaredNonCanonicalReferences.length} declarada(s) no verificables`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválido'}</p></div><button class="btn secondary" data-labor-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">ACTIVITY_REFERENCE ≠ WORK_EXECUTION · EVIDENCE_REFERENCE ≠ EXTERNAL_VERIFICATION · SUPPORT_REFERENCE ≠ QUALITY · COST_BASIS_REFERENCE ≠ COST_VALIDITY · PERSON_REF ≠ IDENTITY_VERIFICATION · PAYMENT/RATE/COST REF DECLARED ≠ VERIFIED · NO HR SCORING · NO PAYROLL AUTHORITY.</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const m of markers){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const prior=views.team;if(prior)views.team=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-labor-ref]');if(b)openReference(b.dataset.laborRef)});
  window.__SANA_LABOR_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,cases,forLot,forActivity,forCase:caseFor,summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();
