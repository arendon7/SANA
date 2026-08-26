(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1',DOMAIN='Material vegetal / referencias',OWNER='Técnico + Productor',ORDER={ALTA:3,MEDIA:2,BAJA:1};
  const VALUE_POLICY='COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED';
  const INTEGRITY='SNAPSHOT_MATERIAL_REFERENCE_GAPS_ONLY · NO_LIVE_FALLBACK · NOT_CAPTURED_OR_LEGACY ≠ GAP · DECLARED_NON_CANONICAL_REFERENCE ≠ GAP · CONTENT_LEAK = GAP · REFERENCE_ISSUE ≠ MATERIAL_FAILURE ≠ GENETIC_QUALITY ≠ PHYTOSANITARY_STATUS ≠ ICA_CERTIFICATION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION';
  const HIGH=new Set(['MISSING_TARGET','CROSS_MATERIAL_REFERENCE','SOURCE_MATERIAL_MISSING']);
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function derive(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const d=snapshot.manifest?.materialReferences;if(!d)return [];
    const out=[];
    if(Number(d.contentLeakCount)>0)out.push(gap('material-ref:content-leak',snapshot.manifest?.farm?.id||'Unidad',`${d.contentLeakCount} campo(s) no minimizados detectados`,'Material Reference Snapshot V157','ALTA','La granularidad referencial no puede duplicar sourceRef/evidenceRef, identidad descriptiva, cantidades, montos, pérdidas, supervivencia, evidencia rica o detalle.'));
    if(d.declaredReferenceValuePolicy!==VALUE_POLICY)out.push(gap('material-ref:value-policy',snapshot.manifest?.farm?.id||'Unidad','Política global de valores no canónicos incompatible','Material Reference Snapshot V157','ALTA',String(d.declaredReferenceValuePolicy||'NOT_CAPTURED')));
    for(const c of d.chains||[]){
      if(c.referenceState!=='CAPTURED')continue;
      const entity=`${c.materialId||'SIN_MATERIAL'} · ${c.targetLot||'SIN_LOTE'}`;
      if(c.declaredReferenceValuePolicy!==VALUE_POLICY)out.push(gap(`material-ref:${c.materialId}:value-policy`,entity,'Política de valores no canónicos incompatible','Material Reference Snapshot V157','ALTA',String(c.declaredReferenceValuePolicy||'NOT_CAPTURED')));
      for(const r of c.rows||[]){if(r.status==='LINKED')continue;out.push(gap(`material-ref:${c.materialId}:${r.sourceId}:${r.kind}:${r.targetId||'missing'}`,entity,`${r.kind||'REFERENCE'} · ${r.status||'INVALID_REFERENCE'}`,'Material Reference Snapshot V157',HIGH.has(r.status)?'ALTA':'MEDIA',`sourceType=${r.sourceType||'—'} · targetMaterial=${r.targetMaterialId||'—'} · targetLot=${r.targetLot||'—'}. La inconsistencia describe estructura; no prueba calidad genética, estado fitosanitario, certificación o falla productiva.`))}
    }
    for(const r of d.orphanRows||[]){if(r.status==='LINKED')continue;const entity=`FUENTE HUÉRFANA · ${r.sourceMaterialId||'SIN_MATERIAL'}`;out.push(gap(`material-ref:orphan:${r.sourceId}:${r.kind}:${r.targetId||'missing'}`,entity,`${r.kind||'REFERENCE'} · ${r.status||'INVALID_REFERENCE'}`,'Material Reference Snapshot V157',HIGH.has(r.status)?'ALTA':'MEDIA',`source=${r.sourceId||'—'} · targetMaterial=${r.targetMaterialId||'—'} · targetLot=${r.targetLot||'—'}. La fuente huérfana permanece global y no se asigna a un ciclo por el target.`))}
    return out;
  }
  function merge(baseState,snapshot){if(!baseState?.valid)return baseState;const extra=derive(snapshot||baseState.snapshot),gaps=[...(baseState.gaps||[]),...extra];gaps.sort((a,b)=>(ORDER[b.severity]||0)-(ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:`${baseState.integrity||'SNAPSHOT_GAPS_ONLY'} · ${INTEGRITY}`}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current)window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:s=>merge(base.derive(s),s),current:()=>{const s=base.latest?.();return merge(base.derive(s),s)},materialReferenceGaps:derive,integrity:INTEGRITY});
  function panel(){const s=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!s?.valid)return '';const list=(s.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · MATERIAL REFERENCES</p><h2>Sin inconsistencias referenciales capturadas</h2><p>Legacy/no capturado y referencias declaradas no canónicas no constituyen gap por sí solos.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · MATERIAL REFERENCES V157</p><h2>Integridad referencial que requiere atención</h2><p>${list.length} inconsistencia(s) estructural(es). No se puntúa calidad genética, sanidad, certificación, crédito, elegibilidad ni inversión.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':'warn'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note">NOT_CAPTURED_OR_LEGACY ≠ GAP · DECLARED_NON_CANONICAL_REFERENCE ≠ GAP · REFERENCE ISSUE ≠ MATERIAL/GENETIC/PHYTOSANITARY/ICA FAILURE ≠ CREDIT/ELIGIBILITY/INVESTMENT SIGNAL.</div></div></section>`}
  function insert(html,section){const m='<footer class="footer">',i=html.lastIndexOf(m);return i<0?html+section:html.slice(0,i)+section+html.slice(i)}
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),panel());
  window.__SANA_DD_MATERIAL_REFERENCE_GAPS__=Object.freeze({derive,integrity:INTEGRITY});
})();
