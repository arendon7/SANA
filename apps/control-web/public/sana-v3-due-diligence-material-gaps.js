(() => {
  'use strict';

  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Material vegetal';
  const OWNER='Técnico + Productor / vivero';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};

  function rows(manifest){
    const lots=Array.isArray(manifest?.material?.lots)?manifest.material.lots:[];
    const assigned=lots.flatMap(lot=>(lot.materials||[]).map(row=>({...row,lotId:lot.lotId||row.targetLot||''})));
    const unassigned=Array.isArray(manifest?.material?.unassigned)?manifest.material.unassigned.map(row=>({...row,lotId:'SIN_ASIGNAR'})):[];
    return [...assigned,...unassigned];
  }
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){
    return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'};
  }
  function deriveMaterial(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const manifest=snapshot.manifest||{};
    if(!manifest.material){
      return [gap('material:granularity',manifest.farm?.id||'Unidad','Granularidad de Material Chain no capturada en este snapshot','Snapshot manifest · material','BAJA','El corte es válido y puede ser anterior a esta capacidad. No se rellena desde la cadena viva; requiere un nuevo snapshot para capturarla.')];
    }
    const out=[];
    const list=rows(manifest);
    if(!list.length)out.push(gap('material:none',manifest.farm?.id||'Unidad','Sin cadenas de material/lote capturadas en el corte','Snapshot material · lots','ALTA','No implica inexistencia de material; significa ausencia de procedencia vegetal capturada en este snapshot.'));
    list.forEach(r=>{
      const entity=`${r.lotId||r.targetLot||'SIN_LOTE'} · ${r.materialId||'SIN_MATERIAL'}`;
      const stage=Number(r.stageCoverage);
      const evidence=Number(r.evidenceCoverage);
      const explicit=Number(r.explicitEvents||0);
      const legacy=Number(r.legacyEvents||0);
      const mismatches=Number(r.countMismatch||0);
      if(!r.origin)out.push(gap(`material:${entity}:origin`,entity,'Origen declarado no capturado','Material Snapshot · origin','MEDIA'));
      if(Number.isFinite(stage)&&stage<50)out.push(gap(`material:${entity}:stages-high`,entity,`Cobertura de etapas ${stage}%`,'Material Snapshot · stageCoverage','ALTA','Prioridad documental; no evalúa calidad genética ni desempeño productivo.'));
      else if(Number.isFinite(stage)&&stage<80)out.push(gap(`material:${entity}:stages`,entity,`Cobertura de etapas ${stage}%`,'Material Snapshot · stageCoverage','MEDIA'));
      if(Number.isFinite(evidence)&&evidence<50)out.push(gap(`material:${entity}:evidence-high`,entity,`Cobertura de evidencia ${evidence}%`,'Material Snapshot · evidenceCoverage','ALTA'));
      else if(Number.isFinite(evidence)&&evidence<80)out.push(gap(`material:${entity}:evidence`,entity,`Cobertura de evidencia ${evidence}%`,'Material Snapshot · evidenceCoverage','MEDIA'));
      if(mismatches>0)out.push(gap(`material:${entity}:count-mismatch`,entity,`${mismatches} inconsistencia(s) de conservación de conteos`,'Material Snapshot · countMismatch','ALTA','Revisar entrada, viables y pérdidas. No corregir automáticamente ni reinterpretar históricos.'));
      if(explicit===0&&legacy>0)out.push(gap(`material:${entity}:legacy-only`,entity,'Solo existen eventos legacy de cantidad única; supervivencia no demostrable','Material Snapshot · explicitEvents/legacyEvents','BAJA','LEGACY_QUANTITY ≠ LOSS ≠ SURVIVAL.'));
      else if(explicit>0&&(r.latestSurvivalRate===null||r.latestSurvivalRate===undefined))out.push(gap(`material:${entity}:survival`,entity,'Eventos explícitos sin supervivencia cuantitativa capturada','Material Snapshot · latestSurvivalRate','MEDIA','No inferir supervivencia desde cantidades incompatibles o incompletas.'));
    });
    return out;
  }
  function mergeState(baseState,snapshot){
    if(!baseState?.valid)return baseState;
    const material=deriveMaterial(snapshot||baseState.snapshot);
    const gaps=[...(baseState.gaps||[]),...material];
    gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));
    const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>{counts[g.severity]=(counts[g.severity]||0)+1});
    return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · MATERIAL_PROVENANCE'};
  }

  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){
    const wrapped=Object.freeze({
      schema:base.schema,
      latest:base.latest,
      derive:snapshot=>mergeState(base.derive(snapshot),snapshot),
      current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},
      materialGaps:deriveMaterial,
      integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION · MATERIAL_PROVENANCE'
    });
    window.__SANA_DUE_DILIGENCE_GAPS__=wrapped;
  }

  function panel(){
    const api=window.__SANA_DUE_DILIGENCE_GAPS__;
    const state=api?.current?.();
    if(!state?.valid)return '';
    const material=(state.gaps||[]).filter(g=>g.domain===DOMAIN);
    if(!material.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · MATERIAL VEGETAL</p><h2>Sin brechas vegetales según este corte</h2><p>La lectura se limita a procedencia y completitud del snapshot. No equivale a certificación, sanidad o calidad genética.</p></div><span class="status teal">0</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · MATERIAL VEGETAL</p><h2>Procedencia vegetal que requiere atención documental</h2><p>${material.length} condición(es) del último snapshot. La pérdida declarada por sí sola no se considera brecha.</p></div><span class="status warn">${material.length}</span></div><div class="card-body">${material.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note" style="margin-top:12px">MATERIAL GAP ≠ GENETIC QUALITY ≠ PHYTOSANITARY STATUS ≠ CREDIT RISK. La brecha permanece vinculada al snapshot histórico y solo un corte posterior puede demostrar cambio.</div></div></section>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  const baseReports=views.reports;
  if(baseReports)views.reports=function reportsWithMaterialGaps(){return insertBeforeFooter(baseReports(),panel())};

  window.__SANA_DD_MATERIAL_GAPS__=Object.freeze({derive:deriveMaterial,integrity:'SNAPSHOT_MATERIAL_GAPS_ONLY · NO_LIVE_FALLBACK · LOSS_DECLARED ≠ GAP · NO_CREDIT_OR_CERTIFICATION_INFERENCE'});
})();
