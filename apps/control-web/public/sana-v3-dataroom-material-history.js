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
  function flatten(manifest){
    const lots=Array.isArray(manifest?.material?.lots)?manifest.material.lots:[];
    const assigned=lots.flatMap(lot=>(lot.materials||[]).map(row=>({...row,lotId:lot.lotId||row.targetLot||''})));
    const unassigned=Array.isArray(manifest?.material?.unassigned)?manifest.material.unassigned.map(row=>({...row,lotId:'SIN_ASIGNAR'})):[];
    return [...assigned,...unassigned];
  }
  function latestState(){
    const latest=snapshots()[0]||null;
    if(!latest)return {valid:false,state:'NO_SNAPSHOT',snapshot:null,rows:[],integrity:'SNAPSHOT_MATERIAL_ONLY · NO_LIVE_FALLBACK'};
    const rows=flatten(latest.manifest);
    return {
      valid:true,
      state:latest.manifest?.material?'CAPTURED':'NOT_CAPTURED_IN_SNAPSHOT',
      snapshot:latest,
      rows,
      granularity:latest.manifest?.material?.granularity||null,
      capturedAt:latest.manifest?.material?.capturedAt||null,
      integrity:'SNAPSHOT_MATERIAL_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_FILL · NO_EXTERNAL_CERTIFICATION'
    };
  }
  function selectedPair(){
    const compare=window.__SANA_SNAPSHOT_COMPARE__;
    const selection=compare?.selection?.()||{};
    const list=snapshots();
    return {base:list.find(s=>s.id===selection.base)||null,target:list.find(s=>s.id===selection.target)||null};
  }
  function value(v){return v===undefined||v===null||v===''?'—':String(v)}
  function key(row){return `${row.lotId||row.targetLot||'SIN_LOTE'}::${row.materialId||'SIN_MATERIAL'}`}
  function diff(base,target){
    if(base?.manifest?.schema!==SCHEMA||target?.manifest?.schema!==SCHEMA)return {valid:false,reason:'SCHEMA_INCOMPATIBLE',changes:[]};
    const a=new Map(flatten(base.manifest).map(r=>[key(r),r]));
    const b=new Map(flatten(target.manifest).map(r=>[key(r),r]));
    const keys=new Set([...a.keys(),...b.keys()]);
    const fields=[
      ['stageCoverage','Cobertura de etapas %'],['explicitEvents','Eventos con conteo explícito'],['legacyEvents','Eventos legacy'],['declaredLoss','Pérdidas declaradas'],
      ['latestSurvivalRate','Supervivencia explícita %'],['evidenceCoverage','Cobertura de evidencia %'],['countMismatch','Inconsistencias de conteo'],
      ['costCount','Costos relacionados'],['costAmount','Monto relacionado COP'],['inventoryMovementCount','Movimientos relacionados'],['origin','Origen declarado'],['temporalState','Estado temporal']
    ];
    const changes=[];
    keys.forEach(k=>{
      const left=a.get(k),right=b.get(k);
      if(!left){changes.push({entity:k,field:'Registro material',before:'—',after:'AGREGADO',kind:'PROCEDENCIA'});return}
      if(!right){changes.push({entity:k,field:'Registro material',before:'PRESENTE',after:'RETIRADO',kind:'PROCEDENCIA'});return}
      fields.forEach(([field,label])=>{
        if(JSON.stringify(left[field]??null)===JSON.stringify(right[field]??null))return;
        changes.push({entity:k,field:label,before:value(left[field]),after:value(right[field]),kind:/cost|Monto/i.test(field)?'ECONOMICO':/origin|temporal/i.test(field)?'PROCEDENCIA':'OPERATIVO'});
      });
    });
    return {
      valid:true,
      state:base.manifest?.material&&target.manifest?.material?'CAPTURED_BOTH':'PARTIAL_GRANULARITY',
      changes,
      total:changes.length,
      integrity:'SNAPSHOT_MATERIAL_DIFF_ONLY · CHANGE ≠ IMPROVEMENT ≠ SURVIVAL_CAUSALITY ≠ INVESTMENT_SIGNAL'
    };
  }
  function historyPanel(){
    const s=latestState();
    if(!s.valid)return '';
    if(s.state!=='CAPTURED')return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATERIAL VEGETAL · SNAPSHOT</p><h2>Granularidad vegetal no capturada en este corte</h2><p>${esc(s.snapshot.cutoff||'sin corte')} · el snapshot sigue siendo válido, pero fue creado antes de incorporar Material Chain al manifest.</p></div><span class="status warn">NO CAPTURADO</span></div><div class="card-body"><div class="section-note"><strong>Sin fallback:</strong> Data Room no consulta la cadena vegetal viva para completar historia. Registra un nuevo corte cuando corresponda. LIVE MATERIAL CHAIN ≠ SNAPSHOT HISTORY.</div></div></section>`;
    const explicit=s.rows.reduce((n,r)=>n+Number(r.explicitEvents||0),0);
    const losses=s.rows.reduce((n,r)=>n+Number(r.declaredLoss||0),0);
    const withSurvival=s.rows.filter(r=>r.latestSurvivalRate!==null&&r.latestSurvivalRate!==undefined).length;
    const mismatches=s.rows.reduce((n,r)=>n+Number(r.countMismatch||0),0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATERIAL VEGETAL · SNAPSHOT</p><h2>Procedencia vegetal capturada en el corte</h2><p>${esc(s.snapshot.cutoff||'sin corte')} · ${s.rows.length} cadena(s) material/lote · ${esc(s.granularity||'granularidad aditiva')}</p></div><span class="status ${mismatches?'danger':'teal'}">${mismatches} MISMATCH</span></div><div class="card-body"><div class="grid metrics">${metric('Cadenas capturadas',s.rows.length,'material × lote')}${metric('Eventos explícitos',explicit,'conteos V1')}${metric('Supervivencia capturada',withSurvival,'solo donde fue explícita')}${metric('Pérdidas declaradas',losses,'no inferidas desde legacy',losses?'warn':'good')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Lote / material</th><th>Origen</th><th>Etapas</th><th>Supervivencia</th><th>Evidencia</th><th>Relaciones</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td><strong>${esc(r.lotId||r.targetLot||'—')} · ${esc(r.materialId||'—')}</strong><br><small>${esc(r.species||r.type||'')}</small></td><td>${esc(r.origin||'—')}</td><td>${esc(r.stageCoverage??'—')}%<br><small>${esc(r.explicitEvents||0)} explícitos · ${esc(r.legacyEvents||0)} legacy</small></td><td>${r.latestSurvivalRate===null||r.latestSurvivalRate===undefined?'—':`${esc(r.latestSurvivalRate)}%`}<br><small>pérdidas ${esc(r.declaredLoss||0)}</small></td><td>${esc(r.evidenceCoverage??0)}%</td><td>${esc(r.costCount||0)} costo(s) · ${esc(r.inventoryMovementCount||0)} mov.</td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px"><strong>Frontera:</strong> SNAPSHOT MATERIAL ≠ LIVE MATERIAL CHAIN ≠ EXTERNAL CERTIFICATION. Supervivencia solo se reproduce cuando estaba explícitamente capturada; un histórico legacy jamás se convierte retroactivamente en pérdida.</div></div></section>`;
  }
  function comparisonPanel(){
    const {base,target}=selectedPair();
    if(!base||!target||base.id===target)return '';
    const result=diff(base,target);
    if(!result.valid)return '';
    if(result.state==='PARTIAL_GRANULARITY')return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMPARADOR · MATERIAL VEGETAL</p><h2>Granularidad vegetal parcial entre cortes</h2><p>Uno de los snapshots fue creado antes de capturar Material Chain. La ausencia de detalle histórico no se rellena con estado vivo.</p></div><span class="status warn">PARCIAL</span></div><div class="card-body"><div class="section-note">“— → valor” describe nueva granularidad de procedencia cuando exista en el corte posterior; no demuestra mejora productiva, reducción de pérdidas ni mayor supervivencia.</div></div></section>`;
    if(!result.total)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMPARADOR · MATERIAL VEGETAL</p><h2>Sin cambios vegetales comparables</h2><p>Los campos capturados de Material Chain coinciden entre los dos snapshots seleccionados.</p></div><span class="status teal">0 DELTAS</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMPARADOR · MATERIAL VEGETAL</p><h2>Cambios de procedencia vegetal entre cortes</h2><p>${result.total} diferencia(s) históricas. El delta es descriptivo: no implica mejora, causalidad ni certificación.</p></div><span class="status warn">MATERIAL DIFF</span></div><div class="card-body">${result.changes.slice(0,24).map(c=>`<div class="row"><span class="dot warn"></span><div class="copy"><strong>${esc(c.entity)} · ${esc(c.field)}</strong><span>${esc(c.before)} → ${esc(c.after)}</span></div><div class="meta"><span class="status">${esc(c.kind)}</span></div></div>`).join('')}${result.total>24?`<div class="section-note">${result.total-24} cambio(s) adicional(es) no mostrados en esta vista compacta.</div>`:''}<div class="section-note" style="margin-top:12px">CHANGE ≠ IMPROVEMENT ≠ SURVIVAL_CAUSALITY ≠ EXTERNAL_CERTIFICATION ≠ INVESTMENT_SIGNAL.</div></div></section>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}

  const baseDataRoom=views.dataroom;
  if(baseDataRoom)views.dataroom=function dataroomWithMaterialHistory(){return insertBeforeFooter(baseDataRoom(),historyPanel())};
  const baseReports=views.reports;
  if(baseReports)views.reports=function reportsWithMaterialHistory(){return insertBeforeFooter(baseReports(),comparisonPanel())};

  window.__SANA_DATAROOM_MATERIAL_HISTORY__=Object.freeze({state:latestState,diff,flatten,integrity:'SNAPSHOT_MATERIAL_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_FILL · NO_EXTERNAL_CERTIFICATION'});
})();
