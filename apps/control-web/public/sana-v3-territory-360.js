(() => {
  'use strict';

  const selectedKey='sana.v3.territory360.selectedLot';
  let selectedLot=sessionStorage.getItem(selectedKey)||DEMO.lots[0]?.id||'';

  function lotById(id){return DEMO.lots.find(l=>l.id===id)||DEMO.lots[0]}
  function recordsForLot(id){return storage.records.filter(r=>(r.lot||r.values?.lot)===id)}
  function planForLot(id){return DEMO.plans.find(p=>p.lot===id)||null}
  function tasksForLot(id){return DEMO.tasks.filter(t=>t.lot===id)}
  function incidentsForLot(id){return DEMO.incidents.filter(i=>i.lot===id)}
  function evidenceForLot(id){return DEMO.evidence.filter(e=>e.lot===id)}
  function inventoryForLot(id){return DEMO.inventory.filter(i=>String(i.linked||'').includes(id))}
  function materialsForLot(id){
    const api=window.__SANA_MATERIAL_LIFECYCLE__;
    if(!api?.targetLot)return [];
    return DEMO.material.filter(m=>api.targetLot(m.id)===id);
  }
  function circularityForLot(id){return window.__SANA_CIRCULARITY__?.forLot?.(id)||[]}
  function resultForLot(id){return window.__SANA_RESULT_BASE__?.[id]||null}
  function openIncidentCount(){return DEMO.incidents.filter(i=>!String(i.status).toLowerCase().includes('cerrada')).length}
  function avgEvidence(){return Math.round(DEMO.lots.reduce((sum,l)=>sum+l.evidence,0)/Math.max(1,DEMO.lots.length))}
  function doneTasksForLot(id){const list=tasksForLot(id);return list.filter(t=>storage.done.has(t.id)).length}
  function localObservedCount(id){return recordsForLot(id).length}
  function toneHealth(value=''){return /Atención/i.test(value)?'danger':/Vigilancia/i.test(value)?'warn':'teal'}
  function safePct(value){return Math.max(0,Math.min(100,Number(value)||0))}
  function resultText(result){return result?`${result.observed} ${result.unit} observadas / ${result.planned} ${result.unit} plan DEMO`:'Sin resultado productivo base para esta unidad'}
  function localTypes(id){
    const groups=new Map();
    recordsForLot(id).forEach(r=>groups.set(r.type,(groups.get(r.type)||0)+1));
    return [...groups.entries()].sort((a,b)=>b[1]-a[1]);
  }

  function parcelMap(){
    return `<article class="card map-card territory360-map" aria-label="Esquema ilustrativo de unidades DEMO">
      <button class="parcel p1 ${selectedLot==='CAF-A1'?'selected':''}" data-territory-lot="CAF-A1"><span><strong>CAF-A1</strong>Café · 3.2 ha</span></button>
      <button class="parcel p2 ${selectedLot==='AGU-A2'?'selected':''}" data-territory-lot="AGU-A2"><span><strong>AGU-A2</strong>Aguacate · 2.8 ha</span></button>
      <button class="parcel p3 ${selectedLot==='CAC-B1'?'selected':''}" data-territory-lot="CAC-B1"><span><strong>CAC-B1</strong>Cacao · 2.1 ha</span></button>
      <button class="parcel p4 ${selectedLot==='VIV-01'?'selected':''}" data-territory-lot="VIV-01"><span><strong>VIV-01</strong>Vivero · 0.4 ha</span></button>
      <button class="parcel p5 ${selectedLot==='RES-01'?'selected':''}" data-territory-lot="RES-01"><span><strong>RES-01</strong>Restauración · 3.9 ha</span></button>
      <div class="territory360-map-note">ESQUEMA DEMO · NO ES CARTOGRAFÍA CATASTRAL NI DELIMITACIÓN CERTIFICADA</div>
    </article>`;
  }

  function lotSelector(){return `<div class="territory360-selector" role="list" aria-label="Seleccionar lote">${DEMO.lots.map(l=>`<button class="${l.id===selectedLot?'active':''}" data-territory-lot="${l.id}" role="listitem"><small>${l.id}</small><strong>${esc(l.crop)}</strong><span>${l.area} ha · ${esc(l.stage)}</span></button>`).join('')}</div>`}

  function dossier(lot){
    const plan=planForLot(lot.id);
    const tasks=tasksForLot(lot.id);
    const incidents=incidentsForLot(lot.id);
    const evidence=evidenceForLot(lot.id);
    const inventory=inventoryForLot(lot.id);
    const materials=materialsForLot(lot.id);
    const circular=circularityForLot(lot.id);
    const result=resultForLot(lot.id);
    const local=recordsForLot(lot.id);
    const done=doneTasksForLot(lot.id);
    const types=localTypes(lot.id);
    const evidenceCount=evidence.length+local.filter(r=>/evidence|fieldRecord|phenology|health|nutrition|harvest-result/i.test(r.type)).length;

    return `<section class="territory360-dossier">
      <article class="territory360-hero">
        <div><small>LOTE 360° · ${esc(lot.id)}</small><h2>${esc(lot.crop)} · ${esc(lot.name)}</h2><p>${lot.area} ha · ${esc(lot.stage)} · ${lot.plants} plantas/unidades modeladas. Esta ficha relaciona datos existentes; no crea una nueva copia de la operación.</p></div>
        <div class="territory360-score"><span>Evidencia</span><strong>${lot.evidence}%</strong>${progress(safePct(lot.evidence),'teal')}</div>
      </article>

      <section class="grid metrics territory360-metrics">
        ${metric('Estado agronómico',lot.health,incidents.length?`${incidents.length} señal(es) asociadas`:'sin incidencias base abiertas',toneHealth(lot.health))}
        ${metric('Plan',plan?`v${plan.version} · ${plan.progress}%`:'Sin plan',plan?`${plan.owner} · ${plan.phase}`:'unidad sin plan técnico base',plan?'good':'warn')}
        ${metric('Agua / humedad',`${lot.water}%`,'indicador sintético DEMO',lot.water<50?'warn':'good')}
        ${metric('Resultado base',result?`${result.observed} ${result.unit}`:'N/A',result?`${Math.round(result.observed/result.planned*100)}% del plan DEMO`:'no aplica / sin cosecha base',result?'good':'')}
      </section>

      <section class="territory360-chain">
        <article><span>01</span><div><small>CONTEXTO</small><strong>${esc(DEMO.farm.municipality)} · ${lot.area} ha</strong><p>${esc(DEMO.farm.model)}</p></div><button data-view-link="characterization">Línea base</button></article>
        <article><span>02</span><div><small>MATERIAL</small><strong>${materials.length?`${materials.length} material(es) vinculados`:'Sin vínculo base'}</strong><p>${materials.length?materials.map(m=>m.id).join(' · '):'No se infiere origen sin registro.'}</p></div><button data-view-link="material">Ver ciclo</button></article>
        <article><span>03</span><div><small>PLAN</small><strong>${plan?`${plan.name} · v${plan.version}`:'Sin plan activo'}</strong><p>${plan?`${plan.progress}% · siguiente: ${esc(plan.next)}`:'Requiere definición humana.'}</p></div><button data-view-link="plans">Ver plan</button></article>
        <article><span>04</span><div><small>EJECUCIÓN</small><strong>${done}/${tasks.length} actividades cerradas</strong><p>${local.length} registros creados por esta identidad.</p></div><button data-view-link="field">Campo</button></article>
        <article><span>05</span><div><small>EVIDENCIA</small><strong>${evidenceCount} piezas/registros relacionados</strong><p>Cobertura declarada del lote: ${lot.evidence}%.</p></div><button data-view-link="passport">Passport</button></article>
        <article><span>06</span><div><small>CIRCULARIDAD</small><strong>${circular.length} flujo(s) trazados</strong><p>${circular.length?circular.map(r=>r.stage).join(' · '):'Sin flujo residual base asociado.'}</p></div><button data-view-link="circularity">Ver cierre</button></article>
      </section>

      <section class="grid two territory360-lower">
        <article class="card"><div class="card-head"><div><h2>Trabajo, riesgos y soporte</h2><p>Lo que requiere atención alrededor de este lote.</p></div><span class="status ${toneHealth(lot.health)}">${esc(lot.health)}</span></div><div class="card-body">
          <div class="territory360-stack"><div><span>Actividades</span><strong>${tasks.length}</strong><small>${done} completadas en sandbox</small></div><div><span>Incidencias</span><strong>${incidents.length}</strong><small>${incidents.filter(i=>!String(i.status).toLowerCase().includes('cerrada')).length} abiertas / vigilancia</small></div><div><span>Inventario ligado</span><strong>${inventory.length}</strong><small>${inventory.map(i=>i.name).slice(0,2).join(' · ')||'sin vínculo explícito'}</small></div><div><span>Evidencia base</span><strong>${evidence.length}</strong><small>${evidence.map(e=>e.id).join(' · ')||'sin piezas base'}</small></div></div>
          ${incidents.length?`<div class="territory360-incidents">${incidents.map(i=>`<div class="gate"><i class="${i.severity==='Alta'?'blocked':'warn'}">${i.severity==='Alta'?'!':'•'}</i><div><strong>${esc(i.finding)}</strong><p>${esc(i.owner)} · ${esc(i.status)}</p></div><span class="status ${statusClass(i.severity)}">${esc(i.severity)}</span></div>`).join('')}</div>`:'<div class="section-note">No hay incidencias base asociadas a esta unidad.</div>'}
        </div></article>
        <article class="card"><div class="card-head"><div><h2>Procedencia y estado del expediente</h2><p>Qué viene de línea base y qué creó esta identidad.</p></div><span class="status">READ MODEL</span></div><div class="card-body">
          <div class="territory360-provenance"><div><strong>BASE DEMO</strong><p>Lote, cultivo, área, etapa, plan, señales, inventario y evidencia sintética.</p></div><div><strong>REGISTROS DE IDENTIDAD</strong><p>${local.length?`${local.length} registro(s) local/nube DEMO asociados.`:'Aún no hay registros propios para este lote.'}</p></div><div><strong>RESULTADO</strong><p>${esc(resultText(result))}.</p></div><div><strong>GEOMETRÍA</strong><p>Ilustrativa. No hay polígono catastral o georreferenciación certificada en esta DEMO.</p></div></div>
          ${types.length?`<div class="chip-row territory360-types">${types.map(([type,count])=>`<span class="chip">${esc(type)} · ${count}</span>`).join('')}</div>`:''}
        </div></article>
      </section>

      <section class="quick-grid territory360-links">
        <button class="quick" data-view-link="material"><strong>Material vegetal</strong><span>Origen, propagación y vínculo productivo.</span></button>
        <button class="quick" data-view-link="advisory"><strong>Acompañamiento</strong><span>Visitas y casos con criterio humano.</span></button>
        <button class="quick" data-view-link="economics"><strong>Economía</strong><span>Costos y escenarios separados de contabilidad oficial.</span></button>
        <button class="quick" data-view-link="impact"><strong>Impacto</strong><span>Método, evidencia y calidad del indicador.</span></button>
      </section>
    </section>`;
  }

  function territory360(){
    const lot=lotById(selectedLot); selectedLot=lot.id;
    const totalLocal=DEMO.lots.reduce((sum,l)=>sum+localObservedCount(l.id),0);
    return `${head('AGROWAY · TERRITORIO / PREDIO / LOTE 360°','Una ficha espacial que conecta toda la historia operativa.','Predio y lotes funcionan como eje de relación entre caracterización, material vegetal, planes, campo, riesgos, evidencia, resultados, circularidad, economía e impacto. La geometría de esta DEMO es ilustrativa y no constituye delimitación predial certificada.',`<button class="btn secondary" data-view-link="characterization">Caracterización del predio</button><button class="btn primary" data-view-link="passport">Abrir Passport</button>`)}
      <section class="grid metrics">${metric('Área predio',`${DEMO.farm.area} ha`,`${DEMO.lots.length} unidades modeladas`,'good')}${metric('Evidencia media',`${avgEvidence()}%`,'cobertura sintética por lote','good')}${metric('Señales abiertas',openIncidentCount(),'requieren revisión humana',openIncidentCount()?'warn':'good')}${metric('Registros propios',totalLocal,'asociados explícitamente a lote',totalLocal?'good':'')}</section>
      <section class="territory360-overview"><div>${parcelMap()}</div><article class="card territory360-farm"><div class="card-head"><div><h2>${esc(DEMO.farm.name)}</h2><p>${esc(DEMO.farm.id)} · expediente de predio DEMO</p></div><span class="status teal">ACOMPAÑAMIENTO ACTIVO</span></div><div class="card-body"><div class="territory360-farm-grid"><div><span>Productora</span><strong>${esc(DEMO.farm.producer)}</strong></div><div><span>Ubicación</span><strong>${esc(DEMO.farm.municipality)}, ${esc(DEMO.farm.department)}</strong></div><div><span>Altitud</span><strong>${esc(DEMO.farm.altitude)}</strong></div><div><span>Modelo</span><strong>${esc(DEMO.farm.model)}</strong></div></div><div class="section-note">El predio es la raíz del expediente. Los lotes heredan este contexto, pero cada dato operativo conserva lote, fuente, responsable y estado propio.</div></div></article></section>
      ${lotSelector()}
      ${dossier(lot)}
      ${footer()}`;
  }

  views.territory=territory360;
  window.__SANA_TERRITORY_360__=Object.freeze({
    selected:()=>selectedLot,
    dossier:lotId=>({
      lot:{...lotById(lotId)},
      plan:planForLot(lotId)?{...planForLot(lotId)}:null,
      tasks:tasksForLot(lotId).map(x=>({...x})),
      incidents:incidentsForLot(lotId).map(x=>({...x})),
      evidence:evidenceForLot(lotId).map(x=>({...x})),
      records:recordsForLot(lotId).map(x=>({...x}))
    })
  });

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-territory-lot]');
    if(!button)return;
    const next=button.dataset.territoryLot;
    if(!DEMO.lots.some(l=>l.id===next))return;
    selectedLot=next;
    sessionStorage.setItem(selectedKey,next);
    if(typeof window.go==='function')window.go('territory');
  });
})();
