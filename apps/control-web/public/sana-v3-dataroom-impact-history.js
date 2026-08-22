(() => {
  'use strict';

  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const REPORT_TYPE='RPT-DD';

  function snapshotApi(){return window.__SANA_DUE_DILIGENCE_SNAPSHOT__}
  function snapshots(){
    return (snapshotApi()?.snapshots?.()||[])
      .filter(s=>s?.manifest?.schema===SCHEMA&&s?.reportType===REPORT_TYPE)
      .slice()
      .sort((a,b)=>String(b.cutoff||b.createdAt||'').localeCompare(String(a.cutoff||a.createdAt||'')));
  }
  function state(){
    const latest=snapshots()[0]||null;
    if(!latest)return {valid:false,state:'NO_SNAPSHOT',snapshot:null,indicators:[],integrity:'SNAPSHOT_IMPACT_ONLY · NO_LIVE_FALLBACK'};
    const rows=Array.isArray(latest.manifest?.impact?.indicators)?latest.manifest.impact.indicators.map(r=>({...r})):[];
    return {
      valid:true,
      state:rows.length?'CAPTURED':'NOT_CAPTURED_IN_SNAPSHOT',
      snapshot:latest,
      indicators:rows,
      granularity:latest.manifest?.impact?.methodologyGranularity||null,
      capturedAt:latest.manifest?.impact?.ledgerCapturedAt||null,
      estimated:rows.filter(r=>r.estimated===true).length,
      externallyVerified:rows.filter(r=>r.verification==='VERIFICADO_EXTERNO').length,
      integrity:'SNAPSHOT_IMPACT_ONLY · NO_LIVE_FALLBACK · NO_EXTERNAL_VERIFICATION_INFERENCE'
    };
  }
  function value(v,unit=''){return v===undefined||v===null||v===''?'—':`${v}${unit?` ${unit}`:''}`}
  function panel(){
    const s=state();
    if(!s.valid)return '';
    if(!s.indicators.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">IMPACTO HISTÓRICO · SNAPSHOT</p><h2>Granularidad por indicador no capturada en este corte</h2><p>${esc(s.snapshot.cutoff||'sin corte')} · el snapshot sigue siendo válido, pero fue creado antes de incorporar el Impact Ledger aditivo.</p></div><span class="status warn">NO CAPTURADO</span></div><div class="card-body"><div class="section-note"><strong>Sin fallback:</strong> esta vista no consulta el ledger vivo para rellenar historia. Registra un nuevo snapshot cuando corresponda para capturar la granularidad actual. LIVE_METHOD ≠ SNAPSHOT_HISTORY.</div></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">IMPACTO HISTÓRICO · SNAPSHOT</p><h2>Ledger metodológico capturado en el corte</h2><p>${esc(s.snapshot.cutoff||'sin corte')} · ${s.indicators.length} indicador(es) · ${esc(s.granularity||'granularidad aditiva')}</p></div><span class="status ${s.externallyVerified?'teal':'warn'}">${s.externallyVerified} VERIF. EXTERNA</span></div><div class="card-body"><div class="grid metrics">${metric('Indicadores capturados',s.indicators.length,'historia del snapshot')}${metric('Estimados',s.estimated,'con etiqueta preservada',s.estimated?'warn':'good')}${metric('Verificados externamente',s.externallyVerified,'solo lo declarado en el corte')}${metric('Captura ledger',s.capturedAt?String(s.capturedAt).slice(0,10):'—','metadato del snapshot')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Indicador</th><th>Línea base</th><th>Observación</th><th>Cálculo</th><th>Calidad</th><th>Verificación</th></tr></thead><tbody>${s.indicators.map(i=>`<tr><td><strong>${esc(i.name||i.id)}</strong><br><small>${esc(i.layer||'')}</small></td><td>${esc(value(i.baseline,i.unit))}</td><td>${esc(value(i.current,i.unit))}${i.estimated?'<br><span class="status warn">ESTIMADO</span>':''}</td><td>${esc(i.calculation||'—')}</td><td>${esc(i.quality||'—')}${i.qualityScore!==null&&i.qualityScore!==undefined?` · ${esc(i.qualityScore)}%`:''}</td><td>${esc(i.verification||'—')}</td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px"><strong>Frontera:</strong> SNAPSHOT IMPACT LEDGER ≠ CURRENT LIVE METHOD ≠ EXTERNAL CERTIFICATION. La tabla reproduce únicamente lo capturado por el manifest histórico.</div></div></section>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}

  const base=views.dataroom;
  if(base)views.dataroom=function dataroomWithImpactHistory(){return insertBeforeFooter(base(),panel())};

  window.__SANA_DATAROOM_IMPACT_HISTORY__=Object.freeze({state,integrity:'SNAPSHOT_IMPACT_ONLY · NO_LIVE_FALLBACK · NO_EXTERNAL_VERIFICATION_INFERENCE'});
})();
