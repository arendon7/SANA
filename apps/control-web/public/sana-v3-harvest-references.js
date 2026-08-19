(() => {
  'use strict';
  const base=window.__SANA_HARVEST_LEDGER__;
  if(!base?.events||base.schema!=='SANA_HARVEST_RESULTS_LEDGER_V1')return;

  const VERSION='V135';
  const RULES=Object.freeze({
    CLASSIFICATION:Object.freeze({field:'basisEventId',allowed:Object.freeze(['HARVEST'])}),
    LOSS:Object.freeze({field:'basisEventId',allowed:Object.freeze(['HARVEST','CLASSIFICATION'])}),
    HANDOFF:Object.freeze({field:'basisEventId',allowed:Object.freeze(['HARVEST','CLASSIFICATION'])}),
    SALE_DECLARATION:Object.freeze({field:'basisEventId',allowed:Object.freeze(['HANDOFF'])}),
    EVIDENCE:Object.freeze({field:'supports',allowed:Object.freeze(['HARVEST','CLASSIFICATION','LOSS','HANDOFF','SALE_DECLARATION'])})
  });
  const LABEL=Object.freeze({HARVEST:'Cosecha',CLASSIFICATION:'Clasificación',LOSS:'Merma',HANDOFF:'Entrega / transferencia',SALE_DECLARATION:'Venta declarada',EVIDENCE:'Evidencia'});

  function metadata(){
    const out=new Map();
    (storage?.records||[]).filter(r=>r.type==='harvest-reference-meta'&&r.values?.harvestSchema===base.schema).forEach(r=>{
      const v=r.values||{},source=v.sourceEventId||'';if(!source)return;
      out.set(source,{referenceVersion:v.referenceVersion||'',basisEventId:v.basisEventId||'',metadataRecordId:r.id||''});
    });
    return out;
  }
  function events(){
    const meta=metadata();
    return base.events().map(e=>({...e,...(meta.get(e.id)||{}),referenceVersion:meta.get(e.id)?.referenceVersion||e.referenceVersion||'',basisEventId:meta.get(e.id)?.basisEventId||e.basisEventId||''}));
  }
  function refsOf(event){
    const rule=RULES[event.kind];if(!rule)return [];
    if(rule.field==='supports')return Array.isArray(event.supports)?event.supports.filter(Boolean):[];
    return event.basisEventId?[event.basisEventId]:[];
  }
  function reference(event,refId,scope=null){
    const rule=RULES[event.kind]||null;
    if(!rule)return {required:false,status:'NOT_REQUIRED',target:null,allowedKinds:[]};
    if(event.referenceVersion!==VERSION)return {required:false,status:'LEGACY_REFERENCE_NOT_CAPTURED',target:null,allowedKinds:rule.allowed};
    if(!refId)return {required:true,status:'MISSING_REFERENCE',target:null,allowedKinds:rule.allowed};
    const all=events(),target=all.find(x=>x.id===refId)||null;
    if(!target)return {required:true,status:'MISSING_TARGET',target:null,allowedKinds:rule.allowed};
    if(target.caseId!==event.caseId)return {required:true,status:'CROSS_CASE_REFERENCE',target,allowedKinds:rule.allowed};
    if(target.lot!==event.lot)return {required:true,status:'CROSS_LOT_REFERENCE',target,allowedKinds:rule.allowed};
    if(!rule.allowed.includes(target.kind))return {required:true,status:'KIND_MISMATCH',target,allowedKinds:rule.allowed};
    if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_REFERENCE',target,allowedKinds:rule.allowed};
    if(scope&&!scope.some(x=>x.id===target.id))return {required:true,status:'CROSS_CASE_REFERENCE',target,allowedKinds:rule.allowed};
    return {required:true,status:'LINKED',target,allowedKinds:rule.allowed};
  }
  function rowsForCase(caseId){
    const scope=events().filter(e=>e.caseId===caseId),rows=[];
    scope.filter(e=>RULES[e.kind]&&e.referenceVersion===VERSION).forEach(event=>{
      const refs=refsOf(event);
      if(!refs.length){rows.push({event,refId:'',reference:reference(event,'',scope)});return}
      refs.forEach(refId=>rows.push({event,refId,reference:reference(event,refId,scope)}));
    });
    return rows;
  }
  function referenceCoverage(caseId){
    const rows=rowsForCase(caseId),linked=rows.filter(r=>r.reference.status==='LINKED').length;
    return {linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null,issues:rows.length-linked,rows};
  }
  function caseFor(caseId){
    const c=base.cases().find(x=>x.id===caseId);if(!c)return null;
    const coverage=referenceCoverage(caseId);
    return {...c,events:events().filter(e=>e.caseId===caseId),referenceCoverage:{linked:coverage.linked,total:coverage.total,percent:coverage.percent},referenceIssues:coverage.issues,referenceRows:coverage.rows,integrity:`${c.integrity} · QUANTITY_MATCH ≠ EVENT_REFERENCE · REFERENCE ≠ SALE_VALIDITY · REFERENCE ≠ PAYMENT · REFERENCE ≠ OWNERSHIP_TRANSFER · REFERENCE ≠ PROFITABILITY · REFERENCE ≠ CAUSALITY · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`};
  }
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function summary(){const s=base.summary(),list=cases();return {...s,referenceVersion:VERSION,referenceLinked:list.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:list.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:list.reduce((n,c)=>n+c.referenceIssues,0),integrity:`${s.integrity} · QUANTITY_MATCH ≠ EVENT_REFERENCE · REFERENCE ≠ SALE_VALIDITY ≠ PAYMENT ≠ PROFITABILITY ≠ CAUSALITY`}}

  function sourceOptions(c){return c.events.filter(e=>RULES[e.kind]).map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(LABEL[e.kind]||e.kind)} · ${esc(e.observedAt||'—')}</option>`).join('')}
  function targetOptions(c){return `<option value="">Sin referencia explícita</option>${c.events.filter(e=>e.kind!=='EVIDENCE').map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(LABEL[e.kind]||e.kind)}</option>`).join('')}`}
  function openReference(caseId){const c=caseFor(caseId);if(!c)return;openModal('COSECHA · REFERENCIAS V135','Declarar vínculo semántico',`<div class="fields"><input type="hidden" name="harvestSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot)}" readonly></label><label>Evento fuente<select name="sourceEventId" required>${sourceOptions(c)}</select></label><label>Evento base<select name="basisEventId">${targetOptions(c)}</select></label><label>Responsable humano<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Para EVIDENCE se validan sus supports existentes; el evento base seleccionado no los reemplaza."></textarea></label></div>`,true,'harvest-reference-meta')}
  function panel(){const list=cases(),linked=list.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=list.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=list.reduce((n,c)=>n+c.referenceIssues,0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COSECHA / RESULTADOS · REFERENCIAS V135</p><h2>Vínculos explícitos entre hechos productivos y comerciales</h2><p>La coincidencia de cantidades deja de ser sustituto de una referencia. Solo eventos marcados V135 entran al denominador.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Enlazadas',linked,'tipo + caso + lote + tiempo')}${metric('Esperadas',total,'solo V135')}${metric('Issues',issues,'integridad documental',issues?'warn':'good')}${metric('Casos',list.length,'ledger V1 preservado')}</div>${list.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceIssues?'warn':'ok'}">${c.referenceIssues?'!':'✓'}</i><div><strong>${esc(c.id)} · ${esc(c.lot)}</strong><p>${c.referenceCoverage.linked}/${c.referenceCoverage.total||0} referencias · ${c.referenceIssues} issue(s)</p></div><button class="btn secondary" data-harvest-ref="${esc(c.id)}">Declarar referencia</button></div>`).join('')}<div class="section-note" style="margin-top:12px">CLASSIFICATION→HARVEST · LOSS→HARVEST|CLASSIFICATION · HANDOFF→HARVEST|CLASSIFICATION · SALE_DECLARATION→HANDOFF · EVIDENCE→hechos soportados. QUANTITY_MATCH ≠ EVENT_REFERENCE · REFERENCE ≠ SALE_VALIDITY ≠ PAYMENT ≠ OWNERSHIP_TRANSFER ≠ PROFITABILITY ≠ CAUSALITY.</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer">','<footer class="footer-note">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const prior=views.results;if(prior)views.results=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-harvest-ref]');if(b)openReference(b.dataset.harvestRef)});

  window.__SANA_HARVEST_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,referenceRules:RULES,events,cases,forLot,summary,forCase:caseFor,reference,referenceCoverage,integrity:`${base.integrity} · QUANTITY_MATCH ≠ EVENT_REFERENCE · REFERENCE ≠ SALE_VALIDITY ≠ PAYMENT ≠ OWNERSHIP_TRANSFER ≠ PROFITABILITY ≠ CAUSALITY · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`});
})();
