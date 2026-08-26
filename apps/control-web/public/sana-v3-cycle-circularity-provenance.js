(() => {
  'use strict';
  const circularityApi=()=>window.__SANA_CIRCULARITY_LEDGER__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;

  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return {valid:false,cases:[],legacy:[]};
    const data=circularityApi()?.forLot?.(plan.lot)||{cases:[],legacy:[]};
    const cases=(data.cases||[]).map(c=>({
      caseId:c.id,
      lot:c.lot,
      material:c.material,
      stageCoverage:c.stageCoverage?.percent??0,
      generatedQuantity:c.quantities?.explicitGenerated??0,
      handledQuantity:c.quantities?.explicitHandled??0,
      recoveredQuantity:c.quantities?.explicitRecovered??0,
      units:c.quantities?.units||[],
      handledCoverage:c.quantities?.handledCoverage??null,
      plannedDestination:c.semantics?.plannedDestination||false,
      executionRecorded:c.semantics?.executionRecorded||false,
      plannedButNotExecuted:c.semantics?.plannedButNotExecuted||false,
      evidenceCount:c.evidence?.length??0,
      outcomeCount:c.outcomes?.length??0,
      unresolvedEvidenceRefs:c.semantics?.unresolvedEvidenceRefs??0,
      recoveryDeclared:c.semantics?.recoveryDeclared||false
    }));
    return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},cases,legacy:data.legacy||[],integrity:'CIRCULARITY_PROVENANCE ≠ CYCLE_GATE · GENERATED ≠ RECOVERED · DESTINATION_PLAN ≠ EXECUTION · EXECUTION ≠ VERIFIED_DISPOSITION · HANDLED_COVERAGE ≠ CIRCULARITY_RATE · EVIDENCE ≠ ENVIRONMENTAL_IMPACT'};
  }
  function selected(){const p=cycleApi()?.selectedPlan?.();return p?forPlan(p.id):{valid:false,cases:[],legacy:[]}}
  function panel(){
    const s=selected();if(!s.valid)return '';
    if(!s.cases.length&&!s.legacy.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · CIRCULARIDAD</p><h2>Sin procedencia circular vinculada</h2><p>Ausencia de captura no equivale a ausencia de residuos o manejo. Esta capa no modifica gates de cierre.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    const generated=s.cases.reduce((n,c)=>n+c.generatedQuantity,0),handled=s.cases.reduce((n,c)=>n+c.handledQuantity,0),recovered=s.cases.reduce((n,c)=>n+c.recoveredQuantity,0),pending=s.cases.filter(c=>c.plannedButNotExecuted).length,issues=s.cases.reduce((n,c)=>n+c.unresolvedEvidenceRefs,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · CIRCULARIDAD</p><h2>Procedencia de residuos y manejo del ciclo</h2><p>${esc(s.plan.id)} v${s.plan.version} · lote ${esc(s.plan.lot)} · lectura documental viva y no ponderada.</p></div><span class="status ${issues?'danger':'teal'}">${s.cases.length} V1 · ${s.legacy.length} LEGACY</span></div><div class="card-body"><div class="grid metrics">${metric('Generado explícito',generated,'suma solo V1 · unidades pueden diferir')}${metric('Manejado explícito',handled,'plan ≠ ejecución')}${metric('Recuperado declarado',recovered,'0 no implica fracaso')}${metric('Destinos pendientes',pending,'previsto sin ejecución')}${metric('Refs evidencia',issues,'no resueltas',issues?'warn':'good')}</div>${s.cases.length?`<div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Caso</th><th>Cadena</th><th>Generado</th><th>Manejo</th><th>Recuperación</th><th>Estado</th></tr></thead><tbody>${s.cases.map(c=>`<tr><td><strong>${esc(c.caseId)}</strong><br><small>${esc(c.material||'—')}</small></td><td>${c.stageCoverage}%</td><td>${c.generatedQuantity} ${esc(c.units[0]||'')}</td><td>${c.handledQuantity} ${esc(c.units[0]||'')}<br><small>${c.handledCoverage===null?'sin cobertura comparable':`${c.handledCoverage}% cobertura manejada · no circularidad`}</small></td><td>${c.recoveryDeclared?`${c.recoveredQuantity} ${esc(c.units[0]||'')}`:'NO DECLARADA'}</td><td>${c.plannedButNotExecuted?'DESTINO PENDIENTE':c.executionRecorded?'EJECUCIÓN REGISTRADA':'PARCIAL'}</td></tr>`).join('')}</tbody></table></div>`:''}<div class="section-note" style="margin-top:12px">CIRCULARITY_PROVENANCE ≠ CYCLE_GATE · GENERATED ≠ RECOVERED · DESTINATION_PLAN ≠ EXECUTION · EXECUTION ≠ VERIFIED_DISPOSITION · HANDLED_COVERAGE ≠ CIRCULARITY_RATE · EVIDENCE ≠ ENVIRONMENTAL_IMPACT. No modifica completeness ni readyForArchive.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_CIRCULARITY__=Object.freeze({forPlan,selected,integrity:'CIRCULARITY_PROVENANCE ≠ CYCLE_GATE · GENERATED ≠ RECOVERED · DESTINATION_PLAN ≠ EXECUTION · EXECUTION ≠ VERIFIED_DISPOSITION · HANDLED_COVERAGE ≠ CIRCULARITY_RATE · EVIDENCE ≠ ENVIRONMENTAL_IMPACT'});
})();

// V154 loader: internal Circularity support references only; no evidence/disposition/recovery/impact authority.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const VERSION='V154',SRC='/sana-v3-circularity-references.js';
  const state={version:VERSION,status:'WAITING',attempts:0,integrity:'SUPPORT_REFERENCE ≠ EVIDENCE_VERIFIED · RECEIVER_REF ≠ VERIFIED_DISPOSITION · NO_RECOVERY/IMPACT/REGULATORY/CREDIT/INVESTMENT_AUTHORITY'};
  function expose(){window.__SANA_CIRCULARITY_REFERENCES_LOADER__=Object.freeze({...state})}
  function ready(){return window.__SANA_CIRCULARITY_LEDGER__?.schema==='SANA_CIRCULARITY_LEDGER_V1'&&window.__SANA_CIRCULARITY_LEDGER__?.cases}
  function start(){
    state.attempts++;expose();
    if(window.__SANA_CIRCULARITY_LEDGER__?.referenceVersion===VERSION){state.status='READY';expose();return}
    if(!ready()){if(state.attempts<25){state.status='WAITING_DEPENDENCIES';expose();setTimeout(start,40);return}state.status='BLOCKED_DEPENDENCIES';expose();return}
    if(document.querySelector?.('script[data-sana-circularity-references-v154]'))return;
    state.status='LOADING';expose();const s=document.createElement('script');s.src=SRC;s.defer=true;s.dataset.sanaCircularityReferencesV154='1';
    s.onload=()=>{state.status=window.__SANA_CIRCULARITY_LEDGER__?.referenceVersion===VERSION?'READY':'FAILED_CONTRACT';expose()};
    s.onerror=()=>{state.status='FAILED';expose()};document.head.appendChild(s);
  }
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();
