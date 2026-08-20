(() => {
  'use strict';
  const base=window.__SANA_SOURCE_EVIDENCE_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_SOURCE_EVIDENCE_LEDGER_V1')return;

  const VERSION='V143';
  const USE_TARGETS={PLAN_CONTEXT:'PLAN',INPUT_CONTEXT:'FORECAST',HEALTH_CONTEXT:'LOT',FARM_BASELINE_CONTEXT:'FARM'};
  const INTEGRITY='SOURCE_REFERENCE ≠ SOURCE_VERIFIED · USE_REFERENCE ≠ RELIANCE_VALIDATED · PLAN_CONTEXT_REFERENCE ≠ PLAN_APPROVAL · INPUT_CONTEXT_REFERENCE ≠ PROCUREMENT_NEED · HEALTH_CONTEXT_REFERENCE ≠ DIAGNOSIS · FARM_BASELINE_REFERENCE ≠ FARM_CERTIFICATION · EVIDENCE_REFERENCE ≠ CONTENT_AUTHENTICITY · TARGET_EXISTS ≠ SOURCE_CONTENT_CORRECT · EXTERNAL_ID ≠ CONTENT_HASH · FINGERPRINT_DECLARED ≠ HASH_VERIFIED · NO_TEMPORAL_INFERENCE_WITHOUT_CANONICAL_TIMESTAMP · NO_EXTERNAL_FETCH · NO_ACCESS_VERIFICATION · NO_CERTIFICATION';

  function metadata(){const m=new Map();(storage?.records||[]).filter(r=>r.type==='source-evidence-reference-meta'&&r.values?.sourceSchema===base.schema).forEach(r=>{const id=r.values?.sourceId||'';if(id)m.set(id,{referenceVersion:r.values?.referenceVersion||'',metadataRecordId:r.id||''})});return m}
  function plan(id){return (DEMO.plans||[]).find(x=>x.id===id)||null}
  function forecast(id){return (window.__SANA_INPUT_FORECAST__?.rows?.()||[]).find(x=>x.id===id)||null}
  function lot(id){return (DEMO.lots||[]).find(x=>x.id===id)||null}
  function farm(id){return DEMO.farm?.id===id?DEMO.farm:null}
  function evidence(id){return (DEMO.evidence||[]).find(x=>x.id===id)||null}
  function scopeCompatible(sourceScope,targetScope){if(!sourceScope||!targetScope)return true;if(sourceScope===DEMO.farm?.id)return true;return sourceScope===targetScope}
  function targetFor(useType,id){const domain=USE_TARGETS[useType]||'';if(!domain)return {domain:'',target:null};if(domain==='PLAN')return {domain,target:plan(id)};if(domain==='FORECAST')return {domain,target:forecast(id)};if(domain==='LOT')return {domain,target:lot(id)};if(domain==='FARM')return {domain,target:farm(id)};return {domain,target:null}}
  function targetScope(domain,target){if(!target)return '';if(domain==='PLAN'||domain==='FORECAST')return target.lot||'';if(domain==='LOT')return target.id||'';if(domain==='FARM')return target.id||'';return ''}
  function checkUse(source,e){
    if(!USE_TARGETS[e.useType])return {status:'UNSUPPORTED_USE_TYPE',domain:'',target:null,targetScope:''};
    if(!e.targetRef)return {status:'MISSING_REFERENCE',domain:USE_TARGETS[e.useType],target:null,targetScope:''};
    const {domain,target}=targetFor(e.useType,e.targetRef);if(!target)return {status:'MISSING_TARGET',domain,target:null,targetScope:''};
    const scope=targetScope(domain,target);if(!scopeCompatible(source.scope,scope))return {status:'CROSS_SCOPE_REFERENCE',domain,target,targetScope:scope};
    return {status:'LINKED',domain,target,targetScope:scope};
  }
  function checkEvidence(source,e){if(!e.evidenceRef)return {status:'MISSING_REFERENCE',domain:'EVIDENCE',target:null,targetScope:''};const target=evidence(e.evidenceRef);if(!target)return {status:'MISSING_TARGET',domain:'EVIDENCE',target:null,targetScope:''};const scope=target.lot||'';if(!scopeCompatible(source.scope,scope))return {status:'CROSS_SCOPE_REFERENCE',domain:'EVIDENCE',target,targetScope:scope};return {status:'LINKED',domain:'EVIDENCE',target,targetScope:scope}}
  function rowsFor(c){
    if(metadata().get(c.id)?.referenceVersion!==VERSION)return [];
    const rows=[];
    for(const e of c.events||[]){
      if(e.kind==='USE_DECLARED')rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'USE_TARGET',useType:e.useType||'',refId:e.targetRef||'',reference:checkUse(c,e)});
      if(e.kind==='EVIDENCE')rows.push({sourceEventId:e.id,sourceKind:e.kind,kind:'EVIDENCE_REF',useType:'',refId:e.evidenceRef||'',reference:checkEvidence(c,e)});
    }
    return rows;
  }
  function caseFor(id){const c=base.cases().find(x=>x.id===id);if(!c)return null;const meta=metadata().get(id)||{},rows=rowsFor(c),linked=rows.filter(r=>r.reference.status==='LINKED').length,captured=meta.referenceVersion===VERSION;return {...c,referenceVersion:meta.referenceVersion||'',referenceState:captured?'CAPTURED_V143':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null},referenceIssues:rows.length-linked,referenceRows:rows,integrity:`${c.integrity} · ${INTEGRITY}`}}
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forScope(scope){return cases().filter(c=>c.scope===scope)}
  function forTarget(ref){return cases().filter(c=>(c.uses||[]).some(u=>u.targetRef===ref))}
  function summary(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V143');return {...base.summary(),referenceVersion:VERSION,referenceCaptured:captured.length,referenceLinked:captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:captured.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:captured.reduce((n,c)=>n+c.referenceIssues,0),legacyReferenceNotCaptured:all.length-captured.length,integrity:`${base.summary().integrity} · ${INTEGRITY}`}}

  function openReference(sourceId){const c=base.cases().find(x=>x.id===sourceId);if(!c)return;openModal('SOURCE EVIDENCE · REFERENCIAS V143','Validar usos y evidencia declarada',`<div class="fields"><input type="hidden" name="sourceSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="sourceId" value="${esc(c.id)}"><label>Fuente<input value="${esc(c.id)} · ${esc(c.name||'fuente')}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Alcance<input value="${esc(c.scope||'—')} · ${c.uses?.length||0} uso(s) · ${c.evidence?.length||0} evidencia(s)" readonly></label><label class="full">Nota<textarea name="detail" placeholder="Marca esta fuente para validación V143. No verifica contenido, SharePoint, hash, permisos ni autenticidad."></textarea></label><label class="full">Frontera<input value="TARGET EXISTS ≠ CONTENT CORRECT · USE ≠ RELIANCE VALIDATED · NO EXTERNAL FETCH · NO CERTIFICATION" readonly></label></div>`,true,'source-evidence-reference-meta')}
  function panel(){const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V143'),linked=captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=captured.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=captured.reduce((n,c)=>n+c.referenceIssues,0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SOURCE EVIDENCE · REFERENCIAS V143</p><h2>Usos declarados con destino semántico explícito</h2><p>Plan, forecast, lote, predio y evidencia se validan contra registros DEMO existentes; la existencia del target no prueba el contenido de la fuente.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Capturadas V143',captured.length,'opt-in explícito')}${metric('Enlazadas',linked,'target existente + scope compatible')}${metric('Issues',issues,'integridad documental',issues?'warn':'good')}${metric('Legacy',all.length-captured.length,'fuera del denominador')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V143'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V143'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.name||'fuente')}</strong><p>${c.referenceState==='CAPTURED_V143'?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} referencias · ${c.referenceIssues} issue(s)`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválida'}</p></div><button class="btn secondary" data-source-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">USE_REFERENCE ≠ RELIANCE_VALIDATED · PLAN_CONTEXT ≠ APPROVAL · INPUT_CONTEXT ≠ PROCUREMENT_NEED · HEALTH_CONTEXT ≠ DIAGNOSIS · EVIDENCE_REFERENCE ≠ CONTENT_AUTHENTICITY · TARGET_EXISTS ≠ SOURCE_CONTENT_CORRECT · NO EXTERNAL FETCH.</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const m of markers){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const prior=views.sources;if(prior)views.sources=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-source-ref]');if(b)openReference(b.dataset.sourceRef)});
  window.__SANA_SOURCE_EVIDENCE_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,cases,forScope,forTarget,forCase:caseFor,summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();
