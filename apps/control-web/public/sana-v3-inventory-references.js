(() => {
  'use strict';
  const base=window.__SANA_INVENTORY_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_INVENTORY_LEDGER_V1')return;

  const VERSION='V137';
  const RULES=Object.freeze({
    RESERVATION:Object.freeze({field:'activityId',domain:'ACTIVITY'}),
    CONSUMPTION:Object.freeze({field:'nutritionEventRef',domain:'NUTRITION_APPLICATION'}),
    PURCHASE_REQUEST:Object.freeze({field:'forecastRef',domain:'FORECAST'}),
    EVIDENCE:Object.freeze({field:'supports',domain:'INVENTORY_EVENT'})
  });
  const INVENTORY_TARGET_KINDS=Object.freeze(['COUNT','RESERVATION','CONSUMPTION','PURCHASE_REQUEST','RECEIPT','ADJUSTMENT']);

  function metadata(){
    const map=new Map();
    (storage?.records||[]).filter(r=>r.type==='inventory-reference-meta'&&r.values?.inventorySchema===base.schema).forEach(r=>{
      const source=r.values?.sourceEventId||'';if(source)map.set(source,{referenceVersion:r.values?.referenceVersion||'',metadataRecordId:r.id||''});
    });
    return map;
  }
  function events(){
    const meta=metadata();
    return base.cases().flatMap(c=>(c.events||[]).map(e=>({...e,caseId:c.id,itemId:e.itemId||c.itemId,referenceVersion:meta.get(e.id)?.referenceVersion||e.referenceVersion||''})));
  }
  function refsOf(event){const rule=RULES[event.kind];if(!rule)return [];const v=event[rule.field];return rule.field==='supports'?(Array.isArray(v)?v.filter(Boolean):[]):v?[v]:[]}
  function activityTarget(id){return window.__SANA_PLAN_FIELD_WORKFLOW__?.findActivity?.(id)||null}
  function nutritionTarget(id){return (window.__SANA_NUTRITION_LEDGER__?.events?.()||[]).find(e=>e.id===id)||null}
  function forecastTarget(id){return (window.__SANA_FORECAST_LEDGER__?.cases?.()||[]).find(c=>c.id===id)||null}
  function inventoryTarget(id){return events().find(e=>e.id===id)||null}

  function reference(event,refId,scope=null){
    const rule=RULES[event.kind]||null;
    if(!rule)return {required:false,status:'NOT_REQUIRED',domain:null,target:null};
    if(event.referenceVersion!==VERSION)return {required:false,status:'LEGACY_REFERENCE_NOT_CAPTURED',domain:rule.domain,target:null};
    if(!refId)return {required:true,status:'MISSING_REFERENCE',domain:rule.domain,target:null};
    if(rule.domain==='ACTIVITY'){
      const target=activityTarget(refId);if(!target)return {required:true,status:'MISSING_TARGET',domain:rule.domain,target:null};
      if(event.lot&&target.lot&&event.lot!==target.lot)return {required:true,status:'CROSS_LOT_REFERENCE',domain:rule.domain,target};
      return {required:true,status:'LINKED',domain:rule.domain,target};
    }
    if(rule.domain==='NUTRITION_APPLICATION'){
      const target=nutritionTarget(refId);if(!target)return {required:true,status:'MISSING_TARGET',domain:rule.domain,target:null};
      if(target.eventKind!=='APPLICATION')return {required:true,status:'KIND_MISMATCH',domain:rule.domain,target};
      if(event.lot&&target.lot&&event.lot!==target.lot)return {required:true,status:'CROSS_LOT_REFERENCE',domain:rule.domain,target};
      if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_REFERENCE',domain:rule.domain,target};
      return {required:true,status:'LINKED',domain:rule.domain,target};
    }
    if(rule.domain==='FORECAST'){
      const target=forecastTarget(refId);if(!target)return {required:true,status:'MISSING_TARGET',domain:rule.domain,target:null};
      if(event.itemId&&target.itemId&&event.itemId!==target.itemId)return {required:true,status:'ITEM_MISMATCH',domain:rule.domain,target};
      if(event.lot&&target.lot&&event.lot!==target.lot)return {required:true,status:'CROSS_LOT_REFERENCE',domain:rule.domain,target};
      return {required:true,status:'LINKED',domain:rule.domain,target};
    }
    const target=inventoryTarget(refId);if(!target)return {required:true,status:'MISSING_TARGET',domain:rule.domain,target:null};
    if(target.caseId!==event.caseId)return {required:true,status:'CROSS_CASE_REFERENCE',domain:rule.domain,target};
    if(target.itemId!==event.itemId)return {required:true,status:'ITEM_MISMATCH',domain:rule.domain,target};
    if(!INVENTORY_TARGET_KINDS.includes(target.kind))return {required:true,status:'KIND_MISMATCH',domain:rule.domain,target};
    if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_REFERENCE',domain:rule.domain,target};
    if(scope&&!scope.some(e=>e.id===target.id))return {required:true,status:'CROSS_CASE_REFERENCE',domain:rule.domain,target};
    return {required:true,status:'LINKED',domain:rule.domain,target};
  }
  function rowsForCase(caseId){
    const scope=events().filter(e=>e.caseId===caseId),rows=[];
    scope.filter(e=>RULES[e.kind]&&e.referenceVersion===VERSION).forEach(event=>{const refs=refsOf(event);if(!refs.length){rows.push({event,refId:'',reference:reference(event,'',scope)});return}refs.forEach(refId=>rows.push({event,refId,reference:reference(event,refId,scope)}))});
    return rows;
  }
  function referenceCoverage(caseId){const rows=rowsForCase(caseId),linked=rows.filter(r=>r.reference.status==='LINKED').length;return {linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null,issues:rows.length-linked,rows}}
  function caseFor(caseId){const c=base.cases().find(x=>x.id===caseId);if(!c)return null;const coverage=referenceCoverage(caseId);return {...c,events:events().filter(e=>e.caseId===caseId),referenceCoverage:{linked:coverage.linked,total:coverage.total,percent:coverage.percent},referenceIssues:coverage.issues,referenceRows:coverage.rows,integrity:`${c.integrity} · STRING_REFERENCE ≠ VALIDATED_REFERENCE · ACTIVITY_LINK ≠ CONSUMPTION · CONSUMPTION ≠ AGRONOMIC_APPLICATION · FORECAST_REFERENCE ≠ PROCUREMENT_AUTHORITY · EVIDENCE_REFERENCE ≠ EXTERNAL_VERIFICATION · SUPPLIER_REF/COST_REF ≠ CANONICALLY_VERIFIED · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`}}
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forItem(itemId){return cases().filter(c=>c.itemId===itemId)}
  function forLot(lot){return cases().filter(c=>c.events.some(e=>e.lot===lot))}
  function summary(){const s=base.summary(),list=cases();return {...s,referenceVersion:VERSION,referenceLinked:list.reduce((n,c)=>n+c.referenceCoverage.linked,0),referenceExpected:list.reduce((n,c)=>n+c.referenceCoverage.total,0),referenceIssues:list.reduce((n,c)=>n+c.referenceIssues,0),integrity:`${s.integrity} · STRING_REFERENCE ≠ VALIDATED_REFERENCE · REFERENCE ≠ EXECUTION_AUTHORITY ≠ PROCUREMENT_AUTHORITY ≠ PAYMENT ≠ CAUSALITY`}}

  function eligible(c){return c.events.filter(e=>RULES[e.kind])}
  function sourceOptions(c){return eligible(c).map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.kind)} · ${esc(e.observedAt||'—')}</option>`).join('')}
  function openReference(caseId){const c=caseFor(caseId);if(!c)return;openModal('INVENTARIO · REFERENCIAS V137','Validar referencia declarada',`<div class="fields"><input type="hidden" name="inventorySchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><label>Caso<input value="${esc(c.id)} · ${esc(c.itemId)}" readonly></label><label>Evento fuente<select name="sourceEventId" required>${sourceOptions(c)}</select></label><label>Responsable humano<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Marca el evento para validación V137. No crea ni sustituye activityId, nutritionEventRef, forecastRef o supports."></textarea></label><label class="full">Frontera<input value="STRING_REFERENCE ≠ VALIDATED_REFERENCE · SUPPLIER_REF/COST_REF siguen identificadores explícitos no verificados" readonly></label></div>`,true,'inventory-reference-meta')}
  function panel(){const list=cases(),linked=list.reduce((n,c)=>n+c.referenceCoverage.linked,0),total=list.reduce((n,c)=>n+c.referenceCoverage.total,0),issues=list.reduce((n,c)=>n+c.referenceIssues,0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">INVENTARIO · REFERENCIAS V137</p><h2>Validación semántica de vínculos ya declarados</h2><p>Actividad, aplicación nutricional, forecast y evidencia dejan de tratarse como strings suficientes. Solo eventos V137 entran al denominador.</p></div><span class="status ${issues?'warn':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Enlazadas',linked,'dominio + destino + contexto')}${metric('Esperadas',total,'solo V137')}${metric('Issues',issues,'integridad documental',issues?'warn':'good')}${metric('Casos',list.length,'ledger V1 preservado')}</div>${list.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceIssues?'warn':'ok'}">${c.referenceIssues?'!':'✓'}</i><div><strong>${esc(c.id)} · ${esc(c.itemId)}</strong><p>${c.referenceCoverage.linked}/${c.referenceCoverage.total||0} referencias · ${c.referenceIssues} issue(s)</p></div>${eligible(c).length?`<button class="btn secondary" data-inventory-ref="${esc(c.id)}">Validar referencia</button>`:''}</div>`).join('')}<div class="section-note" style="margin-top:12px">RESERVATION→ACTIVITY · CONSUMPTION→NUTRITION APPLICATION · PURCHASE_REQUEST→FORECAST · EVIDENCE→INVENTORY EVENT. STRING_REFERENCE ≠ VALIDATED_REFERENCE · ACTIVITY_LINK ≠ CONSUMPTION · CONSUMPTION ≠ AGRONOMIC_APPLICATION · FORECAST_REFERENCE ≠ PROCUREMENT_AUTHORITY · EVIDENCE_REFERENCE ≠ EXTERNAL_VERIFICATION · SUPPLIER_REF/COST_REF ≠ CANONICALLY_VERIFIED.</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const prior=views.inventory;if(prior)views.inventory=()=>insert(prior(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-inventory-ref]');if(b)openReference(b.dataset.inventoryRef)});

  window.__SANA_INVENTORY_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,referenceRules:RULES,cases,forItem,forLot,summary,forCase:caseFor,reference,referenceCoverage,integrity:`${base.integrity} · STRING_REFERENCE ≠ VALIDATED_REFERENCE · ACTIVITY_LINK ≠ CONSUMPTION · CONSUMPTION ≠ AGRONOMIC_APPLICATION · FORECAST_REFERENCE ≠ PROCUREMENT_AUTHORITY · EVIDENCE_REFERENCE ≠ EXTERNAL_VERIFICATION · SUPPLIER_REF/COST_REF ≠ CANONICALLY_VERIFIED · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`});
})();
