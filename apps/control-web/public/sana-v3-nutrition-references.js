(() => {
  'use strict';

  const base=window.__SANA_NUTRITION_LEDGER__;
  if(!base?.projection||base.projection!=='SANA_NUTRITION_CHAIN_V2')return;

  const REFERENCE_VERSION='V129';
  const PREDECESSOR_KIND=Object.freeze({
    PREFLIGHT:'PROGRAM',
    DECISION:'PREFLIGHT',
    ACTIVITY_LINK:'DECISION',
    APPLICATION:'ACTIVITY_LINK',
    EVIDENCE:'APPLICATION',
    RESPONSE:'EVIDENCE'
  });
  const LABEL=Object.freeze({PROGRAM:'Programa / recomendación',PREFLIGHT:'Preflight agronómico',DECISION:'Decisión humana',ACTIVITY_LINK:'Actividad vinculada',APPLICATION:'Aplicación ejecutada',EVIDENCE:'Evidencia',RESPONSE:'Respuesta observada'});
  const workflow=()=>window.__SANA_PLAN_FIELD_WORKFLOW__;

  function metadata(){
    const map=new Map();
    (storage?.records||[]).filter(r=>r.type==='nutrition-ledger-event'&&r.values?.nutritionSchema===base.schema).forEach(r=>{
      map.set(r.id,{basisEventId:r.values?.basisEventId||'',projectionVersion:r.values?.projectionVersion||'',referenceVersion:r.values?.referenceVersion||''});
    });
    return map;
  }
  function enrichedEvents(){
    const meta=metadata();
    return base.events().map(e=>({...e,...(meta.get(e.id)||{}),basisEventId:meta.get(e.id)?.basisEventId||e.basisEventId||'',projectionVersion:meta.get(e.id)?.projectionVersion||e.projectionVersion||'',referenceVersion:meta.get(e.id)?.referenceVersion||e.referenceVersion||''}));
  }
  function eventReference(event,caseEvents){
    const expectedKind=PREDECESSOR_KIND[event.eventKind]||null;
    if(!expectedKind)return {required:false,status:'NOT_REQUIRED',expectedKind:null,target:null};
    if(event.referenceVersion!==REFERENCE_VERSION)return {required:false,status:'LEGACY_REFERENCE_NOT_CAPTURED',expectedKind,target:null};
    if(!event.basisEventId)return {required:true,status:'MISSING_REFERENCE',expectedKind,target:null};
    const all=enrichedEvents();
    const target=all.find(e=>e.id===event.basisEventId)||null;
    if(!target)return {required:true,status:'MISSING_TARGET',expectedKind,target:null};
    if(target.caseId!==event.caseId)return {required:true,status:'CROSS_CASE_REFERENCE',expectedKind,target};
    if(target.eventKind!==expectedKind)return {required:true,status:'KIND_MISMATCH',expectedKind,target};
    if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_REFERENCE',expectedKind,target};
    if(caseEvents&&!caseEvents.some(e=>e.id===target.id))return {required:true,status:'CROSS_CASE_REFERENCE',expectedKind,target};
    return {required:true,status:'LINKED',expectedKind,target};
  }
  function referenceCoverage(events){
    const rows=events.filter(e=>PREDECESSOR_KIND[e.eventKind]&&e.referenceVersion===REFERENCE_VERSION).map(e=>({event:e,reference:eventReference(e,events)}));
    const linked=rows.filter(r=>r.reference.status==='LINKED').length;
    return {linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null,issues:rows.filter(r=>r.reference.status!=='LINKED').length,rows};
  }
  function caseFor(caseId){
    const c=base.forCase(caseId);if(!c)return null;
    const events=enrichedEvents().filter(e=>e.caseId===caseId);
    const refs=referenceCoverage(events);
    return {...c,events,referenceCoverage:{linked:refs.linked,total:refs.total,percent:refs.percent},referenceIssues:refs.issues,referenceRows:refs.rows,semantics:{...(c.semantics||{}),referenceIssues:refs.issues},integrity:`${c.integrity} · CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ APPLICATION_AUTHORITY · REFERENCE ≠ CAUSALITY · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`};
  }
  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function itemOptions(selected=''){return `<option value="">Sin ítem explícito</option>${(DEMO.inventory||[]).filter(i=>/Agroinsumo|Enmienda/.test(i.group)).map(i=>`<option value="${esc(i.id)}" ${i.id===selected?'selected':''}>${esc(i.id)} · ${esc(i.name)}</option>`).join('')}`}
  function activityOptions(lot){const rows=workflow()?.forLot?.(lot)||[];return `<option value="">Seleccionar actividad</option>${rows.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${esc(a.title)}</option>`).join('')}`}
  function predecessorOptions(c,kind){
    const expected=PREDECESSOR_KIND[kind];if(!expected)return '';
    const rows=c.events.filter(e=>e.eventKind===expected).slice().sort((a,b)=>String(b.observedAt||'').localeCompare(String(a.observedAt||''))||String(b.id).localeCompare(String(a.id)));
    return `<option value="">Seleccionar ${esc(LABEL[expected]||expected)}</option>${rows.map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.observedAt||'—')} · ${esc((e.detail||'').slice(0,70))}</option>`).join('')}`;
  }
  function predecessorField(c,kind){const expected=PREDECESSOR_KIND[kind];return expected?`<label>Evento precedente · ${esc(LABEL[expected])}<select name="basisEventId" required>${predecessorOptions(c,kind)}</select></label>`:''}
  function common(c,kind){return `<input type="hidden" name="nutritionSchema" value="${base.schema}"><input type="hidden" name="projectionVersion" value="V2"><input type="hidden" name="referenceVersion" value="${REFERENCE_VERSION}"><input type="hidden" name="eventKind" value="${kind}"><input type="hidden" name="caseId" value="${esc(c.id)}"><input type="hidden" name="lot" value="${esc(c.lot)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot)}" readonly></label><label>Fecha<input name="observedAt" type="date" required></label><label>Responsable humano<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label>${predecessorField(c,kind)}`}
  function openEvent(kind,caseId){
    const c=caseFor(caseId);if(!c)return;
    const head=common(c,kind);let fields='';
    if(kind==='PROGRAM')fields=`${head}<label>Producto<input name="product" required></label><label>Ítem inventario<select name="itemId">${itemOptions()}</select></label><label>Dosis planificada<input name="plannedDose" required placeholder="Ej. 2 L/ha"></label><label>Procedencia<input name="provenance" value="HUMAN_RECOMMENDATION_DEMO" readonly></label><label class="full">Programa / fundamento<textarea name="detail" required></textarea></label>`;
    if(kind==='PREFLIGHT')fields=`${head}<label>Etapa fenológica<input name="phenology"></label><label>Humedad suelo<input name="soilMoisture" placeholder="Ej. 43%"></label><label>CE<input name="ec" placeholder="mS/cm"></label><label>pH<input name="ph"></label><label>Estado<select name="preflightState"><option value="CONDITIONS_REVIEWED">Condiciones revisadas</option><option value="REVIEW_REQUIRED">Revisión requerida</option><option value="INCONCLUSIVE">Inconcluso</option></select></label><label>Procedencia<input name="provenance" value="OBSERVED_CONTEXT_DEMO" readonly></label><label class="full">Observación<textarea name="detail" required></textarea></label>`;
    if(kind==='DECISION')fields=`${head}<label>Decisión humana<select name="decision"><option value="APPROVED_HUMAN_DEMO">Aprobada por responsable humano · DEMO</option><option value="DEFERRED_HUMAN">Aplazada por responsable humano</option><option value="REJECTED_HUMAN">No ejecutar</option><option value="REASSESS_HUMAN">Reevaluar condiciones</option></select></label><label>Procedencia<input name="provenance" value="HUMAN_DECISION_DEMO" readonly></label><label class="full">Fundamento de decisión<textarea name="detail" required></textarea></label>`;
    if(kind==='ACTIVITY_LINK')fields=`${head}<label>Actividad vinculada<select name="activityId" required>${activityOptions(c.lot)}</select></label><label>Procedencia<input name="provenance" value="ACTIVITY_RELATION_DEMO" readonly></label><label class="full">Alcance del vínculo<textarea name="detail" required placeholder="Relación explícita. No demuestra ejecución."></textarea></label>`;
    if(kind==='APPLICATION')fields=`${head}<label>Producto<input name="product" required></label><label>Ítem inventario<select name="itemId">${itemOptions()}</select></label><label>Dosis aplicada<input name="appliedDose" required></label><label>Cantidad total<input name="quantityApplied" type="number" min="0" step="0.01"></label><label>Unidad<input name="quantityUnit"></label><label>Actividad de ejecución<select name="activityId" required>${activityOptions(c.lot)}</select></label><label>Procedencia<input name="provenance" value="EXECUTION_DEMO" readonly></label><label class="full">Ejecución<textarea name="detail" required placeholder="Registrar solo lo ejecutado; la referencia al ACTIVITY_LINK no sustituye este vínculo de ejecución."></textarea></label>`;
    if(kind==='EVIDENCE')fields=`${head}<label>Referencia evidencia<input name="evidenceRef" required></label><label>Procedencia<input name="provenance" value="EVIDENCE_DEMO" readonly></label><label class="full">Qué demuestra<textarea name="detail" required></textarea></label>`;
    if(kind==='RESPONSE')fields=`${head}<label>Respuesta observada<select name="responseClass"><option value="CONDITION_OBSERVED_STABLE">Condición observada estable</option><option value="IMPROVEMENT_OBSERVED">Mejoría observada</option><option value="NO_CHANGE_OBSERVED">Sin cambio observado</option><option value="DETERIORATION_OBSERVED">Deterioro observado</option><option value="INCONCLUSIVE">Inconcluso</option></select></label><label>Atribución<select name="causalAttribution"><option value="NO_CAUSAL_ATTRIBUTION">Sin atribución causal</option><option value="HUMAN_HYPOTHESIS_ONLY">Hipótesis humana · no demostrada</option></select></label><label>Procedencia<input name="provenance" value="FOLLOW_UP_DEMO" readonly></label><label class="full">Seguimiento<textarea name="detail" required></textarea></label>`;
    openModal(`NUTRICIÓN V2 · ${(LABEL[kind]||kind).toUpperCase()}`,`${LABEL[kind]||kind} · ${caseId}`,`<div class="fields">${fields}</div>`,true,'nutrition-ledger-event');
  }
  function panel(){
    const list=cases();const total=list.reduce((n,c)=>n+c.referenceCoverage.total,0),linked=list.reduce((n,c)=>n+c.referenceCoverage.linked,0),issues=list.reduce((n,c)=>n+c.referenceIssues,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">NUTRICIÓN / FERTIRRIEGO · REFERENCIAS V129</p><h2>Procedencia explícita entre transiciones V2</h2><p>Cada transición nueva referencia su predecesor esperado. Los eventos anteriores a V129 permanecen históricos y no se penalizan por no tener referencia.</p></div><span class="status ${issues?'danger':'teal'}">${linked}/${total||0} REF</span></div><div class="card-body"><div class="grid metrics">${metric('Referencias enlazadas',linked,'solo eventos V129')}${metric('Referencias esperadas',total,'legacy fuera del denominador')}${metric('Issues',issues,'referencia documental',issues?'warn':'good')}${metric('Casos',list.length,'cadena V2')}</div><div class="section-note" style="margin-top:12px">CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ APPLICATION_AUTHORITY · REFERENCE ≠ INVENTORY_MOVEMENT · REFERENCE ≠ CAUSALITY · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID.</div></div></section><section class="grid two" style="margin-top:14px">${list.map(c=>`<article class="card"><div class="card-head"><div><small>${esc(c.id)} · ${esc(c.lot)}</small><h2>${esc(c.objective||'Caso nutricional')}</h2><p>Refs ${c.referenceCoverage.total?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} · ${c.referenceCoverage.percent}%`:'sin eventos V129 referenciables'}</p></div><span class="status ${c.referenceIssues?'danger':'teal'}">${c.referenceIssues} ISSUE</span></div><div class="card-body"><div class="head-actions">${Object.keys(LABEL).map(kind=>`<button class="btn secondary" data-nutrition-ref-event="${kind}" data-nutrition-ref-case="${esc(c.id)}">${esc(LABEL[kind])}</button>`).join('')}</div>${c.referenceRows.length?`<div class="timeline" style="margin-top:12px">${c.referenceRows.map(r=>`<div class="timeline-item"><i></i><div><strong>${esc(r.event.id)} · ${esc(LABEL[r.event.eventKind]||r.event.eventKind)}</strong><p>${esc(r.event.basisEventId||'sin referencia')} · ${esc(r.reference.status)}</p></div><time>${esc(r.event.observedAt||'—')}</time></div>`).join('')}</div>`:''}</div></article>`).join('')}</section>`;
  }
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const prior=views.nutrition;if(prior)views.nutrition=()=>insert(prior(),panel());
  document.addEventListener('click',event=>{const b=event.target.closest('[data-nutrition-ref-event]');if(b)openEvent(b.dataset.nutritionRefEvent,b.dataset.nutritionRefCase)});

  window.__SANA_NUTRITION_LEDGER__=Object.freeze({...base,referenceVersion:REFERENCE_VERSION,predecessorKinds:PREDECESSOR_KIND,events:enrichedEvents,cases,forCase:caseFor,forLot,eventReference,integrity:`${base.integrity} · CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ APPLICATION_AUTHORITY · REFERENCE ≠ INVENTORY_MOVEMENT · REFERENCE ≠ CAUSALITY · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`});
})();

(() => {
  'use strict';
  const assets=[
    '/sana-v3-report-snapshot-nutrition-v2.js',
    '/sana-v3-cycle-nutrition-v2-provenance.js',
    '/sana-v3-due-diligence-nutrition-v2-gaps.js',
    '/sana-v3-dataroom-nutrition-v2-history.js'
  ];
  const state={version:'V130',status:'PENDING',loaded:[],failed:''};
  function loadAt(index){
    if(index>=assets.length){state.status='READY';return}
    const src=assets[index];const script=document.createElement('script');script.src=src;script.async=false;
    script.onload=()=>{state.loaded.push(src);loadAt(index+1)};
    script.onerror=()=>{state.status='FAILED';state.failed=src};
    document.head.appendChild(script);
  }
  window.addEventListener('load',()=>loadAt(0),{once:true});
  window.__SANA_NUTRITION_V2_HISTORY_LOADER__=Object.freeze({version:'V130',assets:Object.freeze([...assets]),state});
})();

(() => {
  'use strict';
  const state={version:'V131',status:'PENDING',loaded:false,failed:false};
  function load(){
    if(state.loaded||state.failed)return;
    const script=document.createElement('script');script.src='/sana-v3-nutrition-lifecycle.js';script.async=false;
    script.onload=()=>{state.loaded=true;state.status='READY'};
    script.onerror=()=>{state.failed=true;state.status='FAILED'};
    document.head.appendChild(script);
  }
  function start(){
    const prior=window.__SANA_NUTRITION_V2_HISTORY_LOADER__?.state?.status;
    if(prior==='READY'||prior==='FAILED'){load();return}
    setTimeout(start,25);
  }
  if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
  window.__SANA_NUTRITION_LIFECYCLE_LOADER__=Object.freeze({version:'V131',asset:'/sana-v3-nutrition-lifecycle.js',state});
})();
