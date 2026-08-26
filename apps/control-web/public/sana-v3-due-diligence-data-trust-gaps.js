(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Data Trust / IoT';
  const OWNER='Técnico + Operaciones';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};
  function readings(manifest){return Array.isArray(manifest?.dataTrust?.lots)?manifest.dataTrust.lots.flatMap(l=>(l.readings||[]).map(r=>({...r,lotId:l.lotId||r.lot||''}))):[]}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function deriveDataTrust(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];const manifest=snapshot.manifest||{};
    if(!manifest.dataTrust)return [gap('data-trust:granularity',manifest.farm?.id||'Unidad','Granularidad Data Trust no capturada en este snapshot','Snapshot manifest · dataTrust','BAJA','El corte sigue válido. No se rellena desde lecturas vivas ni estado actual de nube.')];
    const out=[];
    readings(manifest).forEach(r=>{
      const entity=`${r.lotId||r.lot||'SIN_LOTE'} · ${r.id||'SIN_ID'}`;
      if(!r.unit)out.push(gap(`data-trust:${r.id}:unit`,entity,'Lectura sin unidad capturada','Data Trust Snapshot · unit','ALTA','No normalizar ni comparar valores hasta capturar la unidad.'));
      if(!r.method)out.push(gap(`data-trust:${r.id}:method`,entity,'Lectura sin método capturado','Data Trust Snapshot · method','MEDIA','La ausencia de método es una brecha de procedencia, no prueba de dato incorrecto.'));
      if(!r.observedAt)out.push(gap(`data-trust:${r.id}:time`,entity,'Momento observado no capturado','Data Trust Snapshot · observedAt','MEDIA','CAPTURE_TIME_ONLY no sustituye el momento de observación cuando se requiere trazabilidad temporal.'));
      if(r.sourceClass==='SENSOR_DEMO'&&!r.sourceRef)out.push(gap(`data-trust:${r.id}:source-ref`,entity,'Lectura etiquetada como sensor sin dispositivo/fuente de referencia','Data Trust Snapshot · sourceRef','ALTA','SOURCE_LABEL ≠ SOURCE_AUTHENTICITY.'));
      if(r.ackState==='SERVER_ACK_DEMO_EXPLICIT'&&!r.ackRef)out.push(gap(`data-trust:${r.id}:ack-ref`,entity,'ACK por registro declarado sin referencia explícita','Data Trust Snapshot · ackRef','ALTA','SYNC_ATTEMPT ≠ SERVER_ACK. Un ACK declarado requiere referencia capturada.'));
      if(r.conflictState==='CONFLICT_REVIEW_REQUIRED'&&Number(r.candidateCount||0)<2)out.push(gap(`data-trust:${r.id}:conflict-candidates`,entity,'Conflicto sin candidatos suficientes preservados','Data Trust Snapshot · candidateCount','ALTA','CONFLICT ≠ DATA_LOSS. Deben preservarse los candidatos para revisión humana.'));
      if(Number(r.candidateCount||0)>=2&&r.conflictState!=='CONFLICT_REVIEW_REQUIRED')out.push(gap(`data-trust:${r.id}:conflict-state`,entity,'Múltiples candidatos sin estado de conflicto explícito','Data Trust Snapshot · conflictState','ALTA','No seleccionar ganador por inferencia ni last-write-wins silencioso.'));
    });
    return out;
  }
  function mergeState(baseState,snapshot){if(!baseState?.valid)return baseState;const extra=deriveDataTrust(snapshot||baseState.snapshot);const gaps=[...(baseState.gaps||[]),...extra];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ SENSOR_FAILURE ≠ DATA_QUALITY_SCORE ≠ AGRONOMIC_PERFORMANCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · DATA_TRUST_PROVENANCE'}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},dataTrustGaps:deriveDataTrust,integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ SENSOR_FAILURE ≠ DATA_QUALITY_SCORE ≠ AGRONOMIC_PERFORMANCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · DATA_TRUST_PROVENANCE'})}
  function panel(){const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const list=(state.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DATA TRUST</p><h2>Sin inconsistencias documentales Data Trust según este corte</h2><p>NO_RECORD_ACK, UNVALIDATED o HARDWARE_NOT_VERIFIED no son gap por sí solos.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DATA TRUST</p><h2>Procedencia de datos que requiere atención</h2><p>${list.length} inconsistencia(s) documental(es). No se califica desempeño de sensor, cultivo ni productor.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note">READING_OR_NO_ACK ≠ GAP · HARDWARE_NOT_VERIFIED ≠ GAP · DATA TRUST GAP ≠ SENSOR FAILURE ≠ AGRONOMIC PERFORMANCE ≠ CREDIT RISK ≠ INVESTMENT SIGNAL.</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer">','<footer class="footer-note">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),panel());
  window.__SANA_DD_DATA_TRUST_GAPS__=Object.freeze({derive:deriveDataTrust,integrity:'SNAPSHOT_DATA_TRUST_GAPS_ONLY · NO_LIVE_FALLBACK · READING_OR_NO_ACK ≠ GAP · HARDWARE_NOT_VERIFIED ≠ GAP · NO_SENSOR_FAILURE_OR_CREDIT_INFERENCE'});
})();
