(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Nutrición / fertirriego';
  const OWNER='Técnico + Productor';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};

  function rows(manifest){const lots=Array.isArray(manifest?.nutrition?.lots)?manifest.nutrition.lots:[];return lots.flatMap(lot=>(lot.cases||[]).map(row=>({...row,lotId:lot.lotId||row.lot||''})))}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function deriveNutrition(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];const manifest=snapshot.manifest||{};
    if(!manifest.nutrition)return [gap('nutrition:granularity',manifest.farm?.id||'Unidad','Granularidad del ledger nutricional no capturada en este snapshot','Snapshot manifest · nutrition','BAJA','El corte sigue siendo válido. No se rellena desde Nutrición viva; requiere un nuevo snapshot.')];
    const out=[];rows(manifest).forEach(r=>{
      const entity=`${r.lotId||r.lot||'SIN_LOTE'} · ${r.caseId||'SIN_CASO'}`;const stage=Number(r.stageCoverage),programs=Number(r.programCount||0),decisions=Number(r.decisionCount||0),approved=Number(r.approvedDecisionCount||0),applications=Number(r.applicationCount||0),evidence=Number(r.evidenceCount||0),responses=Number(r.responseCount||0),issues=Number(r.relationIssues||0),causal=Number(r.causalClaims||0);
      if(Number.isFinite(stage)&&stage<50)out.push(gap(`nutrition:${entity}:stages-high`,entity,`Cobertura de cadena nutricional ${stage}%`,'Nutrition Snapshot · stageCoverage','ALTA','Prioridad documental; no mide calidad agronómica, productividad o riesgo crediticio.'));
      else if(Number.isFinite(stage)&&stage<80)out.push(gap(`nutrition:${entity}:stages`,entity,`Cobertura de cadena nutricional ${stage}%`,'Nutrition Snapshot · stageCoverage','MEDIA'));
      if(issues>0)out.push(gap(`nutrition:${entity}:relations`,entity,`${issues} relación(es) actividad/inventario inconsistentes o no capturadas`,'Nutrition Snapshot · relationIssues','ALTA','Revisar activityId/itemId/movimiento explícito. No crear despacho o consumo por inferencia.'));
      if(applications>0&&evidence===0)out.push(gap(`nutrition:${entity}:application-evidence`,entity,'Aplicación registrada sin evidencia capturada','Nutrition Snapshot · applicationCount/evidenceCount','ALTA','APPLICATION ≠ EVIDENCE ≠ PERFORMANCE.'));
      if(applications>0&&programs===0)out.push(gap(`nutrition:${entity}:program`,entity,'Aplicación registrada sin programa/recomendación capturada en la cadena','Nutrition Snapshot · applicationCount/programCount','MEDIA','La ejecución puede tener otra base; el snapshot no contiene el programa explícito.'));
      if(applications>0&&(decisions===0||approved===0))out.push(gap(`nutrition:${entity}:decision`,entity,'Aplicación registrada sin decisión humana aprobatoria capturada','Nutrition Snapshot · applicationCount/decisionCount/approvedDecisionCount','ALTA','No invalida automáticamente la aplicación; identifica una brecha de autoridad/procedencia documental.'));
      if(responses>0&&applications===0)out.push(gap(`nutrition:${entity}:response-application`,entity,'Respuesta observada sin aplicación capturada en la misma cadena','Nutrition Snapshot · responseCount/applicationCount','MEDIA','La respuesta puede corresponder a otro contexto. No atribuir causalidad ni fabricar aplicación.'));
      if(causal>0)out.push(gap(`nutrition:${entity}:causal-language`,entity,`${causal} atribución(es) causal(es) requieren revisión de procedencia`,'Nutrition Snapshot · causalClaims','ALTA','Una respuesta posterior no demuestra por sí sola efecto causal de la nutrición.'));
    });
    return out;
  }
  function mergeState(baseState,snapshot){
    if(!baseState?.valid)return baseState;const nutrition=deriveNutrition(snapshot||baseState.snapshot);const gaps=[...(baseState.gaps||[]),...nutrition];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>{counts[g.severity]=(counts[g.severity]||0)+1});return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ AGRONOMIC_PERFORMANCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · NUTRITION_PROVENANCE'};
  }
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},nutritionGaps:deriveNutrition,integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ AGRONOMIC_PERFORMANCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · NUTRITION_PROVENANCE'})}

  function panel(){
    const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const list=(state.gaps||[]).filter(g=>g.domain===DOMAIN);
    if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · NUTRICIÓN</p><h2>Sin brechas nutricionales documentales según este corte</h2><p>La lectura se limita a trazabilidad del snapshot. Programa no ejecutado, decisión aplazada, aplicación o respuesta no son brecha por sí solos.</p></div><span class="status teal">0</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · NUTRICIÓN</p><h2>Trazabilidad nutricional que requiere atención documental</h2><p>${list.length} condición(es) del último snapshot. Se revisa procedencia, no desempeño agronómico.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note" style="margin-top:12px">PROGRAM_OR_APPLICATION ≠ GAP · NUTRITION GAP ≠ AGRONOMIC PERFORMANCE ≠ APPLICATION FAILURE ≠ CREDIT RISK ≠ INVESTMENT SIGNAL. Solo un corte posterior puede demostrar cambio documental.</div></div></section>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  const baseReports=views.reports;if(baseReports)views.reports=function reportsWithNutritionGaps(){return insertBeforeFooter(baseReports(),panel())};
  window.__SANA_DD_NUTRITION_GAPS__=Object.freeze({derive:deriveNutrition,integrity:'SNAPSHOT_NUTRITION_GAPS_ONLY · NO_LIVE_FALLBACK · PROGRAM_OR_APPLICATION ≠ GAP · NO_CAUSALITY_OR_CREDIT_INFERENCE'});
})();
