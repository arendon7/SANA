(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const REPORT_TYPE='RPT-DD';
  function snapshotApi(){return window.__SANA_DUE_DILIGENCE_SNAPSHOT__}
  function snapshots(){return (snapshotApi()?.snapshots?.()||[]).filter(s=>s?.manifest?.schema===SCHEMA&&s?.reportType===REPORT_TYPE).slice().sort((a,b)=>String(b.cutoff||b.createdAt||'').localeCompare(String(a.cutoff||a.createdAt||'')))}
  function flatten(manifest){const lots=Array.isArray(manifest?.health?.lots)?manifest.health.lots:[];return lots.flatMap(lot=>(lot.cases||[]).map(row=>({...row,lotId:lot.lotId||row.lot||''})))}
  function latestState(){
    const latest=snapshots()[0]||null;if(!latest)return {valid:false,state:'NO_SNAPSHOT',snapshot:null,rows:[]};
    const captured=Boolean(latest.manifest?.health?.lifecycleGranularity);
    return {valid:true,state:captured?'CAPTURED':'NOT_CAPTURED_IN_SNAPSHOT',snapshot:latest,rows:captured?flatten(latest.manifest):[],granularity:latest.manifest?.health?.lifecycleGranularity||null,integrity:'SNAPSHOT_HEALTH_LIFECYCLE_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_CLOSURE_FILL · CASE_STATE_CHANGE ≠ CONDITION_CHANGE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY'};
  }
  function selectedPair(){const selection=window.__SANA_SNAPSHOT_COMPARE__?.selection?.()||{};const list=snapshots();return {base:list.find(s=>s.id===selection.base)||null,target:list.find(s=>s.id===selection.target)||null}}
  function key(row){return `${row.lotId||row.lot||'SIN_LOTE'}::${row.caseId||'SIN_CASO'}`}
  function value(v){return v===undefined||v===null||v===''?'—':String(v)}
  function diff(base,target){
    if(base?.manifest?.schema!==SCHEMA||target?.manifest?.schema!==SCHEMA)return {valid:false,reason:'SCHEMA_INCOMPATIBLE',changes:[]};
    const capturedA=Boolean(base.manifest?.health?.lifecycleGranularity),capturedB=Boolean(target.manifest?.health?.lifecycleGranularity);
    if(!capturedA||!capturedB)return {valid:true,state:'PARTIAL_GRANULARITY',changes:[],total:0,integrity:'NO_LIVE_FALLBACK · NO_RETROACTIVE_CLOSURE_FILL'};
    const a=new Map(flatten(base.manifest).map(r=>[key(r),r]));const b=new Map(flatten(target.manifest).map(r=>[key(r),r]));const keys=new Set([...a.keys(),...b.keys()]);const fields=[['caseState','Estado humano del caso'],['closureCount','Cierres humanos capturados'],['closureIssueCount','Issues cierre humano'],['closedAt','Fecha cierre humano'],['latestClosureClass','Clase último cierre'],['latestClosureBasisResultId','RESULT referenciado por cierre']];const changes=[];
    keys.forEach(k=>{const left=a.get(k),right=b.get(k);if(!left||!right)return;fields.forEach(([field,label])=>{if(JSON.stringify(left[field]??null)===JSON.stringify(right[field]??null))return;changes.push({entity:k,field:label,before:value(left[field]),after:value(right[field]),kind:'PROCEDENCIA'})})});
    return {valid:true,state:'CAPTURED_BOTH',changes,total:changes.length,integrity:'SNAPSHOT_HEALTH_LIFECYCLE_DIFF_ONLY · CASE_STATE_CHANGE ≠ CONDITION_CHANGE · CLOSED_HUMAN ≠ RESOLVED · RESULT ≠ CASE_CLOSURE · CHANGE ≠ IMPROVEMENT ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL'};
  }
  function historyPanel(){
    const s=latestState();if(!s.valid)return '';
    if(s.state!=='CAPTURED')return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · LIFECYCLE SNAPSHOT</p><h2>Lifecycle humano no capturado en este corte</h2><p>El snapshot permanece válido. No se consulta el ledger vivo para completar cierres históricos.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    const closed=s.rows.filter(r=>r.caseState==='CLOSED_HUMAN').length;const open=s.rows.filter(r=>r.caseState!=='CLOSED_HUMAN').length;const issues=s.rows.reduce((n,r)=>n+Number(r.closureIssueCount||0),0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · LIFECYCLE SNAPSHOT</p><h2>Estado humano de los casos en el corte</h2><p>${esc(s.snapshot.cutoff||'sin corte')} · lifecycle histórico snapshot-only.</p></div><span class="status ${issues?'danger':'teal'}">${issues} ISSUE(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Casos abiertos',open,'OPEN no es brecha por sí solo')}${metric('Cerrados humanos',closed,'cierre ≠ resolución')}${metric('Issues de cierre',issues,'integridad documental')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Lote / caso</th><th>Estado</th><th>Cierre</th><th>RESULT referenciado</th><th>Integridad</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td><strong>${esc(r.lotId||r.lot||'—')} · ${esc(r.caseId||'—')}</strong></td><td>${esc(r.caseState||'OPEN')}</td><td>${esc(r.closedAt||'—')}<br><small>${esc(r.latestClosureClass||'sin cierre')}</small></td><td>${esc(r.latestClosureBasisResultId||'—')}</td><td>${esc(r.closureIssueCount||0)} issue(s)</td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">CASE_STATE_CHANGE ≠ CONDITION_CHANGE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY.</div></div></section>`;
  }
  function comparisonPanel(){
    const {base,target}=selectedPair();if(!base||!target||base.id===target)return '';const d=diff(base,target);if(!d.valid)return '';
    if(d.state==='PARTIAL_GRANULARITY')return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMPARADOR · LIFECYCLE SANIDAD</p><h2>Lifecycle parcial entre cortes</h2><p>Uno de los snapshots es anterior a esta granularidad. No se rellena desde estado vivo.</p></div><span class="status warn">PARCIAL</span></div></section>`;
    if(!d.total)return '';
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMPARADOR · LIFECYCLE SANIDAD</p><h2>Cambios de estado humano entre cortes</h2><p>${d.total} diferencia(s) de procedencia. Un cambio de estado del expediente no demuestra cambio biológico.</p></div><span class="status warn">LIFECYCLE DIFF</span></div><div class="card-body">${d.changes.slice(0,20).map(c=>`<div class="row"><span class="dot warn"></span><div class="copy"><strong>${esc(c.entity)} · ${esc(c.field)}</strong><span>${esc(c.before)} → ${esc(c.after)}</span></div><div class="meta"><span class="status">PROCEDENCIA</span></div></div>`).join('')}<div class="section-note" style="margin-top:12px">CASE_STATE_CHANGE ≠ CONDITION_CHANGE · CLOSED_HUMAN ≠ RESOLVED · RESULT ≠ CASE_CLOSURE · CHANGE ≠ INVESTMENT_SIGNAL.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const baseDataRoom=views.dataroom;if(baseDataRoom)views.dataroom=()=>insert(baseDataRoom(),historyPanel());
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),comparisonPanel());
  window.__SANA_DATAROOM_HEALTH_LIFECYCLE__=Object.freeze({state:latestState,diff,flatten,integrity:'SNAPSHOT_HEALTH_LIFECYCLE_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_CLOSURE_FILL · CASE_STATE_CHANGE ≠ CONDITION_CHANGE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · NO_EXTERNAL_CERTIFICATION'});
})();
