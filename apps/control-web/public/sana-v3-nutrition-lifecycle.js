(() => {
  'use strict';

  const base=window.__SANA_NUTRITION_LEDGER__;
  if(!base?.projection||base.projection!=='SANA_NUTRITION_CHAIN_V2')return;

  const VERSION='V131';
  const RULES=Object.freeze({
    COMPLETED_REVIEWED:Object.freeze({label:'Cierre tras respuesta revisada',expectedKind:'RESPONSE'}),
    CLOSED_NOT_EXECUTED:Object.freeze({label:'Cierre por decisión humana de no ejecutar',expectedKind:'DECISION',expectedDecision:'REJECTED_HUMAN'})
  });

  function metadata(){
    const map=new Map();
    (storage?.records||[]).filter(r=>r.type==='nutrition-ledger-event'&&r.values?.nutritionSchema===base.schema).forEach(r=>{
      const v=r.values||{};
      map.set(r.id,{lifecycleVersion:v.lifecycleVersion||'',closureClass:v.closureClass||'',basisEventId:v.basisEventId||'',closureChoice:v.closureChoice||''});
    });
    return map;
  }
  function events(){
    const meta=metadata();
    return base.events().map(e=>({...e,...(meta.get(e.id)||{}),lifecycleVersion:meta.get(e.id)?.lifecycleVersion||e.lifecycleVersion||'',closureClass:meta.get(e.id)?.closureClass||e.closureClass||'',basisEventId:meta.get(e.id)?.basisEventId||e.basisEventId||''}));
  }
  function closureReference(event,caseEvents){
    if(event.eventKind!=='CASE_CLOSE')return {required:false,status:'NOT_APPLICABLE',rule:null,target:null};
    const rule=RULES[event.closureClass]||null;
    if(event.lifecycleVersion!==VERSION)return {required:false,status:'LEGACY_CLOSURE_NOT_CAPTURED',rule,target:null};
    if(!rule)return {required:true,status:'CLOSURE_CLASS_INVALID',rule:null,target:null};
    if(!event.basisEventId)return {required:true,status:'MISSING_CLOSURE_REFERENCE',rule,target:null};
    const target=events().find(e=>e.id===event.basisEventId)||null;
    if(!target)return {required:true,status:'MISSING_CLOSURE_TARGET',rule,target:null};
    if(target.caseId!==event.caseId)return {required:true,status:'CROSS_CASE_CLOSURE_REFERENCE',rule,target};
    if(target.eventKind!==rule.expectedKind)return {required:true,status:'CLOSURE_KIND_MISMATCH',rule,target};
    if(rule.expectedDecision&&target.decision!==rule.expectedDecision)return {required:true,status:'NON_TERMINAL_DECISION',rule,target};
    if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_CLOSURE_REFERENCE',rule,target};
    if(caseEvents&&!caseEvents.some(e=>e.id===target.id))return {required:true,status:'CROSS_CASE_CLOSURE_REFERENCE',rule,target};
    return {required:true,status:'LINKED',rule,target};
  }
  function closureCandidates(caseEvents){
    const out=[];
    caseEvents.filter(e=>e.eventKind==='RESPONSE').forEach(e=>out.push({closureClass:'COMPLETED_REVIEWED',basisEventId:e.id,event:e,label:`Respuesta ${e.id} · ${e.observedAt||'—'}`}));
    caseEvents.filter(e=>e.eventKind==='DECISION'&&e.decision==='REJECTED_HUMAN').forEach(e=>out.push({closureClass:'CLOSED_NOT_EXECUTED',basisEventId:e.id,event:e,label:`No ejecutar ${e.id} · ${e.observedAt||'—'}`}));
    return out.sort((a,b)=>String(b.event.observedAt||'').localeCompare(String(a.event.observedAt||''))||String(b.event.id).localeCompare(String(a.event.id)));
  }
  function caseFor(caseId){
    const c=base.forCase(caseId);if(!c)return null;
    const caseEvents=events().filter(e=>e.caseId===caseId);
    const closures=caseEvents.filter(e=>e.eventKind==='CASE_CLOSE');
    const closureRows=closures.map(event=>({event,reference:closureReference(event,caseEvents)}));
    const valid=closureRows.filter(r=>r.reference.status==='LINKED').sort((a,b)=>String(a.event.observedAt||'').localeCompare(String(b.event.observedAt||''))||String(a.event.id).localeCompare(String(b.event.id)));
    const latestValid=valid.at(-1)||null;
    const issues=closureRows.filter(r=>r.event.lifecycleVersion===VERSION&&r.reference.status!=='LINKED').length;
    const state=latestValid?'CLOSED_HUMAN':'OPEN';
    return {...c,events:caseEvents,closures,closureRows,closureCandidates:closureCandidates(caseEvents),lifecycle:{version:VERSION,state,closedAt:latestValid?.event?.observedAt||'',closureClass:latestValid?.event?.closureClass||'',basisEventId:latestValid?.event?.basisEventId||'',closureEventId:latestValid?.event?.id||'',closureIssues:issues},semantics:{...(c.semantics||{}),closureEvents:closures.length,closureIssues:issues},integrity:`${c.integrity} · RESPONSE ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ NUTRITION_OBJECTIVE_ACHIEVED · CASE_CLOSE ≠ APPLICATION_SUCCESS · CASE_CLOSE ≠ INVENTORY_RECONCILED · DEFERRED_HUMAN ≠ TERMINAL_CLOSURE · CASE_CLOSE ≠ CYCLE_GATE`};
  }
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function optionValue(x){return `${x.closureClass}::${x.basisEventId}`}
  function closeOptions(c){return c.closureCandidates.map((x,i)=>`<option value="${esc(optionValue(x))}" ${i===0?'selected':''}>${esc(RULES[x.closureClass]?.label||x.closureClass)} · ${esc(x.label)}</option>`).join('')}
  function openClose(caseId){
    const c=caseFor(caseId);if(!c||c.lifecycle.state==='CLOSED_HUMAN'||!c.closureCandidates.length)return;
    const first=c.closureCandidates[0];
    openModal('NUTRICIÓN · LIFECYCLE V131','Cerrar caso nutricional',`<div class="fields"><input type="hidden" name="nutritionSchema" value="${base.schema}"><input type="hidden" name="projectionVersion" value="V2"><input type="hidden" name="lifecycleVersion" value="${VERSION}"><input type="hidden" name="eventKind" value="CASE_CLOSE"><input type="hidden" name="caseId" value="${esc(c.id)}"><input type="hidden" name="lot" value="${esc(c.lot)}"><input type="hidden" name="closureClass" value="${esc(first.closureClass)}"><input type="hidden" name="basisEventId" value="${esc(first.basisEventId)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot)}" readonly></label><label>Fecha de cierre<input name="observedAt" type="date" required></label><label>Responsable humano<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Base terminal<select name="closureChoice" required>${closeOptions(c)}</select></label><label>Procedencia<input name="provenance" value="HUMAN_CASE_CLOSURE_DEMO" readonly></label><label class="full">Motivo / alcance del cierre<textarea name="detail" required placeholder="El cierre administrativo/técnico del caso no demuestra logro del objetivo, éxito de aplicación ni conciliación de inventario."></textarea></label></div>`,true,'nutrition-ledger-event');
  }
  function panel(){
    const list=cases();const closed=list.filter(c=>c.lifecycle.state==='CLOSED_HUMAN').length,issues=list.reduce((n,c)=>n+c.lifecycle.closureIssues,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">NUTRICIÓN / FERTIRRIEGO · LIFECYCLE V131</p><h2>Cierre humano separado de respuesta y desempeño</h2><p>Un caso solo se cierra con una respuesta revisada o una decisión explícita de no ejecutar. Aplazar o reevaluar mantiene el caso abierto.</p></div><span class="status ${issues?'danger':'teal'}">${closed}/${list.length} CERRADOS</span></div><div class="card-body"><div class="grid metrics">${metric('Casos',list.length,'lifecycle explícito')}${metric('Cerrados humanos',closed,'estado documental')}${metric('Abiertos',list.length-closed,'incluye aplazados')}${metric('Issues cierre',issues,'referencia terminal',issues?'warn':'good')}</div>${list.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.lifecycle.state==='CLOSED_HUMAN'?'ok':'warn'}">${c.lifecycle.state==='CLOSED_HUMAN'?'✓':'·'}</i><div><strong>${esc(c.id)} · ${esc(c.objective||'Caso nutricional')}</strong><p>${esc(c.lifecycle.state)}${c.lifecycle.closureClass?` · ${esc(c.lifecycle.closureClass)} · base ${esc(c.lifecycle.basisEventId)}`:''}${c.lifecycle.closureIssues?` · ${c.lifecycle.closureIssues} issue(s)`:''}</p></div>${c.lifecycle.state!=='CLOSED_HUMAN'&&c.closureCandidates.length?`<button class="btn secondary" data-nutrition-close="${esc(c.id)}">Cerrar caso</button>`:`<span class="status ${c.lifecycle.state==='CLOSED_HUMAN'?'teal':'warn'}">${esc(c.lifecycle.state)}</span>`}</div>`).join('')}<div class="section-note" style="margin-top:12px">RESPONSE ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ NUTRITION_OBJECTIVE_ACHIEVED · CASE_CLOSE ≠ APPLICATION_SUCCESS · CASE_CLOSE ≠ INVENTORY_RECONCILED · DEFERRED_HUMAN ≠ TERMINAL_CLOSURE · CASE_CLOSE ≠ CYCLE_GATE.</div></div></section>`;
  }
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const prior=views.nutrition;if(prior)views.nutrition=()=>insert(prior(),panel());
  document.addEventListener('click',event=>{const b=event.target.closest('[data-nutrition-close]');if(b)openClose(b.dataset.nutritionClose)});
  document.addEventListener('change',event=>{const select=event.target.closest('#modal-form [name="closureChoice"]');if(!select)return;const [closureClass,basisEventId]=String(select.value||'').split('::');const form=select.closest('form');const classField=form?.querySelector('[name="closureClass"]');const basisField=form?.querySelector('[name="basisEventId"]');if(classField)classField.value=closureClass||'';if(basisField)basisField.value=basisEventId||''});

  window.__SANA_NUTRITION_LEDGER__=Object.freeze({...base,lifecycleVersion:VERSION,lifecycleRules:RULES,events,cases,forCase:caseFor,forLot,closureReference,integrity:`${base.integrity} · RESPONSE ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ NUTRITION_OBJECTIVE_ACHIEVED · CASE_CLOSE ≠ APPLICATION_SUCCESS · CASE_CLOSE ≠ INVENTORY_RECONCILED · DEFERRED_HUMAN ≠ TERMINAL_CLOSURE · CASE_CLOSE ≠ CYCLE_GATE`});
})();
