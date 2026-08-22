(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Fenología / variables';
  const OWNER='Técnico + Productor';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};

  function rows(manifest){return Array.isArray(manifest?.phenology?.lots)?manifest.phenology.lots:[]}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function derivePhenology(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];const manifest=snapshot.manifest||{};
    if(!manifest.phenology)return [gap('phenology:granularity',manifest.farm?.id||'Unidad','Granularidad fenológica no capturada en este snapshot','Snapshot manifest · phenology','BAJA','El corte sigue válido. No se rellena desde Fenología viva; requiere un nuevo snapshot.')];
    const out=[];rows(manifest).forEach(r=>{
      const entity=r.lotId||'SIN_LOTE',missingMeasurements=Number(r.missingMeasurementMetadata||0),missingStages=Number(r.missingStageMetadata||0),unresolved=Number(r.unresolvedReferences||0),unitConflicts=Number(r.unitConflictCount||0);
      if(missingMeasurements>0)out.push(gap(`phenology:${entity}:measurement-metadata`,entity,`${missingMeasurements} medición(es) con metadatos incompletos`,'Phenology Snapshot · missingMeasurementMetadata','ALTA','Revisar variable, unidad, método, fuente y calidad. La medición no se invalida automáticamente; queda incompleta en procedencia.'));
      if(missingStages>0)out.push(gap(`phenology:${entity}:stage-metadata`,entity,`${missingStages} observación(es) de etapa con metadatos incompletos`,'Phenology Snapshot · missingStageMetadata','MEDIA','Revisar etapa, método, fuente y calidad. OBSERVED_STAGE ≠ PLAN_PHASE.'));
      if(unresolved>0)out.push(gap(`phenology:${entity}:references`,entity,`${unresolved} referencia(s) de interpretación/evidencia no resueltas`,'Phenology Snapshot · unresolvedReferences','ALTA','La interpretación o evidencia apunta a eventos no capturados en el mismo corte.'));
      if(unitConflicts>0)out.push(gap(`phenology:${entity}:units`,entity,`${unitConflicts} serie(s) con unidades incompatibles en el mismo variable`,'Phenology Snapshot · unitConflictCount','ALTA','No comparar deltas hasta normalizar o separar unidades.'));
    });
    return out;
  }
  function mergeState(baseState,snapshot){if(!baseState?.valid)return baseState;const phenology=derivePhenology(snapshot||baseState.snapshot);const gaps=[...(baseState.gaps||[]),...phenology];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>{counts[g.severity]=(counts[g.severity]||0)+1});return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ PHENOLOGICAL_ADVANCE ≠ AGRONOMIC_PERFORMANCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · PHENOLOGY_PROVENANCE'}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},phenologyGaps:derivePhenology,integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ PHENOLOGICAL_ADVANCE ≠ AGRONOMIC_PERFORMANCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · PHENOLOGY_PROVENANCE'})}

  function panel(){const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const list=(state.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · FENOLOGÍA</p><h2>Sin brechas fenológicas documentales según este corte</h2><p>Etapa, porcentaje observado, tendencia creciente/decreciente o valor fuera de una expectativa no son gap por sí solos.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · FENOLOGÍA</p><h2>Procedencia temporal que requiere atención documental</h2><p>${list.length} condición(es) del snapshot. Se revisa calidad de captura, no desempeño del cultivo.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note" style="margin-top:12px">STAGE_OR_TREND ≠ GAP · PHENOLOGY GAP ≠ PHENOLOGICAL ADVANCE ≠ AGRONOMIC PERFORMANCE ≠ CREDIT RISK ≠ INVESTMENT SIGNAL. Solo un corte posterior puede demostrar mejora documental.</div></div></section>`}
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const baseReports=views.reports;if(baseReports)views.reports=function reportsWithPhenologyGaps(){return insertBeforeFooter(baseReports(),panel())};
  window.__SANA_DD_PHENOLOGY_GAPS__=Object.freeze({derive:derivePhenology,integrity:'SNAPSHOT_PHENOLOGY_GAPS_ONLY · NO_LIVE_FALLBACK · STAGE_OR_TREND ≠ GAP · NO_CAUSALITY_OR_CREDIT_INFERENCE'});
})();
