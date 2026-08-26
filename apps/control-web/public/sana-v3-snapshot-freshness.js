(() => {
  'use strict';

  const REPORT_TYPE='RPT-DD';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

  function snapshotApi(){return window.__SANA_DUE_DILIGENCE_SNAPSHOT__}
  function compareApi(){return window.__SANA_SNAPSHOT_COMPARE__}
  function ddSnapshots(){return (snapshotApi()?.snapshots?.()||[]).filter(s=>s?.reportType===REPORT_TYPE&&s?.manifest?.schema===SCHEMA)}
  function latest(){return ddSnapshots()[0]||null}
  function canSnapshot(){return window.__SANA_ACCESS__?.canAction?.('report-snapshot')===true}
  function livePseudo(){const manifest=snapshotApi()?.currentManifest?.(REPORT_TYPE);return manifest?{id:'LIVE_UNREGISTERED',manifest}:null}
  function freshness(){
    const last=latest();const live=livePseudo();const api=compareApi();
    if(!last)return {state:'NO_SNAPSHOT',last:null,changes:0,domains:[],comparable:false};
    if(!live||!api?.compare)return {state:'UNAVAILABLE',last,changes:0,domains:[],comparable:false};
    const diff=api.compare(last,live);
    if(!diff.valid)return {state:'SCHEMA_MISMATCH',last,changes:0,domains:[],comparable:false};
    return {state:diff.total?'CHANGED_SINCE_SNAPSHOT':'ALIGNED_WITH_SNAPSHOT',last,changes:diff.total,domains:diff.domains||[],comparable:true};
  }
  function label(s){if(s==='ALIGNED_WITH_SNAPSHOT')return 'ALINEADO';if(s==='CHANGED_SINCE_SNAPSHOT')return 'NUEVO CORTE RECOMENDADO';if(s==='NO_SNAPSHOT')return 'SIN SNAPSHOT';return 'REVISAR'}
  function tone(s){return s==='ALIGNED_WITH_SNAPSHOT'?'teal':'warn'}
  function panel(){
    const f=freshness();
    const cutoff=f.last?.cutoff||String(f.last?.createdAt||f.last?.manifest?.generatedAt||'').slice(0,10)||'—';
    const domains=f.domains.length?f.domains.map(d=>`<span class="chip">${esc(d)}</span>`).join(''):'<span class="chip">Sin dominios modificados</span>';
    const action=f.state==='CHANGED_SINCE_SNAPSHOT'&&canSnapshot()?'<button class="btn primary" data-report-snapshot>Registrar nuevo snapshot</button>':'';
    const description=f.state==='NO_SNAPSHOT'?'No existe todavía un snapshot Due Diligence registrado. El estado vivo no se presenta como evidencia histórica.':f.state==='ALIGNED_WITH_SNAPSHOT'?'Los campos comparables del manifest actual coinciden con el último snapshot registrado.':f.state==='CHANGED_SINCE_SNAPSHOT'?`${f.changes} diferencia(s) existen entre el último corte y el estado actual. Solo se muestran los dominios afectados; los valores antes/después requieren dos snapshots registrados.`:'No fue posible evaluar vigencia con el contrato actual.';
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">VIGENCIA DEL DATA ROOM · READ ONLY</p><h2>¿El último corte sigue representando el estado actual?</h2><p>${esc(description)}</p></div><span class="status ${tone(f.state)}">${esc(label(f.state))}</span></div><div class="card-body"><div class="grid metrics">${metric('Último corte',cutoff,'snapshot Due Diligence registrado')}${metric('Cambios no capturados',f.changes,f.state==='CHANGED_SINCE_SNAPSHOT'?'requieren nuevo corte para historial':'comparación estructural')}${metric('Dominios afectados',f.domains.length,'sin interpretar dirección')}${metric('Estado vivo','NO ES EVIDENCIA','solo detector de vigencia','warn')}</div><div class="chip-row" style="margin-top:12px">${domains}</div><div class="section-note" style="margin-top:12px"><strong>Regla:</strong> LIVE_STATE ≠ SNAPSHOT ≠ HISTORICAL_EVIDENCE. Esta señal solo indica que el estado actual difiere o no del último manifest registrado; no muestra cambios como hechos históricos hasta registrar un nuevo snapshot y no genera señal de inversión, causalidad ni conclusión de desempeño.</div>${action?`<div class="head-actions" style="margin-top:12px">${action}</div>`:''}</div></section>`;
  }
  function insertAfterHead(html,section){const marker='</header>';const at=html.indexOf(marker);return at<0?`${section}${html}`:`${html.slice(0,at+marker.length)}${section}${html.slice(at+marker.length)}`}

  const baseReports=views.reports;
  if(baseReports)views.reports=function reportsWithFreshness(){return insertAfterHead(baseReports(),panel())};

  window.__SANA_SNAPSHOT_FRESHNESS__=Object.freeze({state:freshness,latest,integrity:'LIVE_STATE ≠ SNAPSHOT ≠ HISTORICAL_EVIDENCE · FRESHNESS_ONLY · NO_INVESTMENT_SIGNAL'});
})();
