(() => {
  'use strict';
  const base=window.__SANA_FORECAST_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_INPUT_FORECAST_LEDGER_V1')return;

  const VERSION='V139';
  const INTEGRITY='FORECAST_REFERENCE ≠ FORECAST_TRUTH · BASIS_REFERENCE ≠ CAUSAL_BASIS · PLAN_LINK ≠ APPROVAL · ACTIVITY_LINK ≠ EXECUTION · REVIEW_EVIDENCE_REF ≠ EXTERNAL_VERIFICATION · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · NO_TEMPORAL_ORDER_INFERENCE_WITHOUT_FORECAST_TIMESTAMP · NO_AUTOMATIC_PROCUREMENT';

  function metadata(){
    const map=new Map();
    (storage?.records||[]).filter(r=>r.type==='forecast-reference-meta'&&r.values?.forecastSchema===base.schema).forEach(r=>{
      const id=r.values?.forecastId||'';if(id)map.set(id,{referenceVersion:r.values?.referenceVersion||'',metadataRecordId:r.id||''});
    });
    return map;
  }
  function plan(id){return (DEMO.plans||[]).find(p=>p.id===id)||null}
  function nutritionEvent(id){return (window.__SANA_NUTRITION_LEDGER__?.events?.()||[]).find(e=>e.id===id)||null}
  function activity(id){return window.__SANA_PLAN_FIELD_WORKFLOW__?.findActivity?.(id)||null}
  function evidence(id){return (DEMO.evidence||[]).find(e=>e.id===id)||null}

  function checkPlan(c,id){if(!id)return {status:'MISSING_REFERENCE',domain:'PLAN',target:null};const t=plan(id);if(!t)return {status:'MISSING_TARGET',domain:'PLAN',target:null};if(c.lot&&t.lot&&c.lot!==t.lot)return {status:'CROSS_LOT_REFERENCE',domain:'PLAN',target:t};return {status:'LINKED',domain:'PLAN',target:t}}
  function checkBasis(c,id){
    if(!id)return {status:'MISSING_REFERENCE',domain:'BASIS',target:null};
    if(String(id).startsWith('PL-'))return checkPlan(c,id);
    if(String(id).startsWith('NUT-')){const t=nutritionEvent(id);if(!t)return {status:'MISSING_TARGET',domain:'NUTRITION_EVENT',target:null};if(c.lot&&t.lot&&c.lot!==t.lot)return {status:'CROSS_LOT_REFERENCE',domain:'NUTRITION_EVENT',target:t};return {status:'LINKED',domain:'NUTRITION_EVENT',target:t}}
    return {status:'UNSUPPORTED_REFERENCE_KIND',domain:'BASIS',target:null};
  }
  function checkActivity(c,id){if(!id)return {status:'MISSING_REFERENCE',domain:'ACTIVITY',target:null};const t=activity(id);if(!t)return {status:'MISSING_TARGET',domain:'ACTIVITY',target:null};if(c.lot&&t.lot&&c.lot!==t.lot)return {status:'CROSS_LOT_REFERENCE',domain:'ACTIVITY',target:t};return {status:'LINKED',domain:'ACTIVITY',target:t}}
  function checkEvidence(c,id){if(!id)return {status:'NOT_DECLARED',domain:'EVIDENCE',target:null};const t=evidence(id);if(!t)return {status:'MISSING_TARGET',domain:'EVIDENCE',target:null};if(c.lot&&t.lot&&c.lot!==t.lot)return {status:'CROSS_LOT_REFERENCE',domain:'EVIDENCE',target:t};return {status:'LINKED',domain:'EVIDENCE',target:t}}

  function rowsFor(c){
    const meta=metadata().get(c.id);if(meta?.referenceVersion!==VERSION)return [];
    const rows=[{kind:'PLAN',refId:c.planId||'',reference:checkPlan(c,c.planId||'')}];
    const basis=(c.basisRefs||[]);if(!basis.length)rows.push({kind:'BASIS',refId:'',reference:checkBasis(c,'')});else basis.forEach(id=>rows.push({kind:'BASIS',refId:id,reference:checkBasis(c,id)}));
    (c.activityRefs||[]).forEach(id=>rows.push({kind:'ACTIVITY',refId:id,reference:checkActivity(c,id)}));
    if(c.humanReview?.evidenceRef)rows.push({kind:'REVIEW_EVIDENCE',refId:c.humanReview.evidenceRef,reference:checkEvidence(c,c.humanReview.evidenceRef)});
    return rows;
  }
  function coverage(c){const rows=rowsFor(c),linked=rows.filter(r=>r.reference.status==='LINKED').length;return {linked,total:rows.length,issues:rows.length-linked,percent:rows.length?Math.round(linked/rows.length*100):null,rows}}
  function caseFor(id){
    const c=base.cases().find(x=>x.id===id);if(!c)return null;const meta=metadata().get(id)||{};const cov=coverage(c);const captured=meta.referenceVersion===VERSION;
    return {...c,referenceVersion:meta.referenceVersion||'',referenceState:captured?'CAPTURED_V139':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked:cov.linked,total:cov.total,percent:cov.percent},referenceIssues:cov.issues,referenceRows:cov.rows,integrity:`${c.integrity} · ${INTEGRITY}`};
  }
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function forItem(itemId){return cases().filter(c=>c.itemId===itemId)}
  function forActivity(activityId){return cases().filter(c=>(c.activityRefs||[]).includes(activityId))}
  function summary(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V139');return {...base.summary(),referenceVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:captured.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:captured.reduce((n,c)=>n+c.referenceIssues,0),legacyReferenceNotCaptured:all.length-captured.length,integrity:`${base.summary().integrity} · ${INTEGRITY}`}}

  function openReference(forecastId){const c=base.cases().find(x=>x.id===forecastId);if(!c)return;openModal('FORECAST · REFERENCIAS V139','Validar referencias declaradas',`<div class="fields"><input type="hidden" name="forecastSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="forecastId" value="${esc(c.id)}"><label>Forecast<input value="${esc(c.id)} · ${esc(c.item)}" readonly></label><label>Responsable humano<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Referencias declaradas<input value="plan=${esc(c.planId||'—')} · basis=${esc((c.basisRefs||[]).join(', ')||'—')} · activity=${esc((c.activityRefs||[]).join(', ')||'—')}" readonly></label><label class="full">Nota<textarea name="detail" placeholder="Marca este forecast para validación V139. No modifica estimación, necesidad confirmada, solicitud, recepción ni consumo."></textarea></label><label class="full">Frontera<input value="REFERENCE ≠ TRUTH · BASIS ≠ CAUSALITY · PLAN ≠ APPROVAL · ACTIVITY ≠ EXECUTION · NO PROCUREMENT" readonly></label></div>`,true,'forecast-reference-meta')}
  function panel(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V139'),linked=captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=captured.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=captured.reduce((n,c)=>n+c.referenceIssues,0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">FORECAST · REFERENCIAS V139</p><h2>Base documental y operativa explícita</h2><p>Plan, bases nutricionales, actividades y evidencia declarada se validan por destino y lote. Forecasts legacy no entran al denominador.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Capturados V139',captured.length,'validación explícita')}${metric('Enlazadas',linked,'destino + lote')}${metric('Issues',issues,'integridad documental',issues?'warn':'good')}${metric('Legacy',all.length-captured.length,'fuera del denominador')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V139'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V139'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.item)}</strong><p>${c.referenceState==='CAPTURED_V139'?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} referencias · ${c.referenceIssues} issue(s)`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválido'}</p></div><button class="btn secondary" data-forecast-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">PLAN/BASIS/ACTIVITY/EVIDENCE REFERENCE ≠ FORECAST TRUTH · BASIS_REFERENCE ≠ CAUSAL_BASIS · PLAN_LINK ≠ APPROVAL · ACTIVITY_LINK ≠ EXECUTION · REVIEW_EVIDENCE_REF ≠ EXTERNAL_VERIFICATION · NO_TEMPORAL_ORDER_INFERENCE_WITHOUT_FORECAST_TIMESTAMP.</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const prior=views.forecast;if(prior)views.forecast=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-forecast-ref]');if(b)openReference(b.dataset.forecastRef)});

  window.__SANA_FORECAST_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,cases,forLot,forItem,forActivity,forCase:caseFor,referenceCoverage:id=>{const c=caseFor(id);return c?c.referenceCoverage:null},summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();
