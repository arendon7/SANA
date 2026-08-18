(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Sanidad vegetal';
  const OWNER='Técnico + Productor';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};

  function rows(manifest){const lots=Array.isArray(manifest?.health?.lots)?manifest.health.lots:[];return lots.flatMap(lot=>(lot.cases||[]).map(row=>({...row,lotId:lot.lotId||row.lot||''})))}
  function legacyRows(manifest){const lots=Array.isArray(manifest?.health?.lots)?manifest.health.lots:[];return lots.flatMap(lot=>(lot.legacy||[]).map(row=>({...row,lotId:lot.lotId||row.lot||''})))}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function deriveHealth(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];const manifest=snapshot.manifest||{};
    if(!manifest.health)return [gap('health:granularity',manifest.farm?.id||'Unidad','Granularidad del ledger sanitario no capturada en este snapshot','Snapshot manifest · health','BAJA','El corte es válido y puede ser anterior a esta capacidad. No se rellena desde Sanidad viva; requiere un nuevo snapshot.')];
    const out=[];const list=rows(manifest),legacy=legacyRows(manifest);
    if(!list.length&&legacy.length)out.push(gap('health:legacy-only',manifest.farm?.id||'Unidad','Solo existen resúmenes sanitarios legacy en el corte','Health Snapshot · legacy','BAJA','LEGACY_INCIDENT_SUMMARY ≠ OBSERVED_PRESENCE ≠ DIAGNOSIS ≠ TREATMENT ≠ EFFICACY.'));
    list.forEach(r=>{
      const entity=`${r.lotId||r.lot||'SIN_LOTE'} · ${r.caseId||'SIN_CASO'}`;const stage=Number(r.stageCoverage),evidence=Number(r.evidenceCount||0),actions=Number(r.actionCount||0),follow=Number(r.followUpCount||0),linkIssues=Number(r.actionLinkIssues||0),diagnosis=Number(r.confirmedDiagnosis||0),presence=Number(r.observedPresence||0);
      if(Number.isFinite(stage)&&stage<50)out.push(gap(`health:${entity}:stages-high`,entity,`Cobertura de cadena sanitaria ${stage}%`,'Health Snapshot · stageCoverage','ALTA','Prioridad documental; no evalúa severidad clínica/agronómica ni riesgo crediticio.'));
      else if(Number.isFinite(stage)&&stage<80)out.push(gap(`health:${entity}:stages`,entity,`Cobertura de cadena sanitaria ${stage}%`,'Health Snapshot · stageCoverage','MEDIA'));
      if(linkIssues>0)out.push(gap(`health:${entity}:activity-link`,entity,`${linkIssues} vínculo(s) de acción con actividad inconsistente`,'Health Snapshot · actionLinkIssues','ALTA','Revisar activityId/lote. No corregir automáticamente ni afirmar ejecución si el vínculo es inconsistente.'));
      if(actions>0&&evidence===0)out.push(gap(`health:${entity}:action-evidence`,entity,'Acción sanitaria registrada sin evidencia capturada','Health Snapshot · actionCount/evidenceCount','ALTA','ACCIÓN REGISTRADA ≠ EFICACIA DEMOSTRADA.'));
      if(actions>0&&follow===0)out.push(gap(`health:${entity}:follow-up`,entity,'Acción sanitaria registrada sin seguimiento capturado','Health Snapshot · actionCount/followUpCount','MEDIA','No permite describir resultado posterior; tampoco implica ineficacia.'));
      if(diagnosis>0&&presence===0)out.push(gap(`health:${entity}:diagnosis-presence`,entity,'Diagnóstico humano confirmado sin presencia observada capturada en la cadena','Health Snapshot · confirmedDiagnosis/observedPresence','MEDIA','Puede existir otra base diagnóstica, pero el snapshot no contiene la observación explícita de presencia. No invalidar automáticamente el diagnóstico.'));
      if(Number(r.efficacyObservationCount||0)>0&&actions===0)out.push(gap(`health:${entity}:efficacy-action`,entity,'Observación de eficacia sin acción registrada en la cadena capturada','Health Snapshot · efficacyObservationCount/actionCount','ALTA','Revisar procedencia. FOLLOW_UP ≠ CAUSAL_ATTRIBUTION.'));
    });
    return out;
  }
  function mergeState(baseState,snapshot){
    if(!baseState?.valid)return baseState;const health=deriveHealth(snapshot||baseState.snapshot);const gaps=[...(baseState.gaps||[]),...health];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>{counts[g.severity]=(counts[g.severity]||0)+1});return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ AGRONOMIC_SEVERITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · PHYTOSANITARY_PROVENANCE'};
  }
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},healthGaps:deriveHealth,integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ AGRONOMIC_SEVERITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · PHYTOSANITARY_PROVENANCE'})}

  function panel(){
    const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const health=(state.gaps||[]).filter(g=>g.domain===DOMAIN);
    if(!health.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · SANIDAD VEGETAL</p><h2>Sin brechas sanitarias documentales según este corte</h2><p>La lectura se limita a trazabilidad del snapshot. No equivale a ausencia de plagas/enfermedades, certificación o bajo riesgo.</p></div><span class="status teal">0</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · SANIDAD VEGETAL</p><h2>Trazabilidad sanitaria que requiere atención documental</h2><p>${health.length} condición(es) del último snapshot. La presencia de enfermedad o una acción aplicada no constituyen por sí solas una brecha Due Diligence.</p></div><span class="status warn">${health.length}</span></div><div class="card-body">${health.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note" style="margin-top:12px">HEALTH GAP ≠ DISEASE SEVERITY ≠ TREATMENT FAILURE ≠ CREDIT RISK ≠ INVESTMENT SIGNAL. La brecha permanece vinculada al snapshot y solo un corte posterior puede demostrar cambio documental.</div></div></section>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  const baseReports=views.reports;if(baseReports)views.reports=function reportsWithHealthGaps(){return insertBeforeFooter(baseReports(),panel())};
  window.__SANA_DD_HEALTH_GAPS__=Object.freeze({derive:deriveHealth,integrity:'SNAPSHOT_HEALTH_GAPS_ONLY · NO_LIVE_FALLBACK · PRESENCE_OR_TREATMENT ≠ GAP · NO_CAUSALITY_OR_CREDIT_INFERENCE'});
})();
