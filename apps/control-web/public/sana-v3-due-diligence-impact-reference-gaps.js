(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Impacto · referencias';
  const OWNER='Técnico + Administración';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};
  const INTEGRITY='SNAPSHOT_IMPACT_REFERENCE_GAPS_ONLY · NO_LIVE_FALLBACK · NOT_CAPTURED_OR_LEGACY ≠ GAP · DECLARED_NON_CANONICAL_REFERENCE ≠ GAP · REFERENCE_ISSUE ≠ IMPACT_INVALIDITY · REFERENCE_GAP ≠ METHODOLOGY_FAILURE ≠ EXTERNAL_VERIFICATION_FAILURE ≠ CERTIFICATION_FAILURE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function deriveImpactReference(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const d=snapshot.manifest?.impactReferences;if(!d)return [];
    const out=[];
    if(Number(d.contentLeakCount||0)>0)out.push(gap('impact-reference:content-leak','SANA Impact','Bloque referencial contiene payload prohibido','Impact References Snapshot · contentLeakCount','ALTA',String(d.contentLeakCount)));
    if(Number(d.verificationCreatedByReferences||0)>0)out.push(gap('impact-reference:verification-authority','SANA Impact','Referencias declaran crear verificación de impacto fuera de autoridad','Impact References Snapshot · verificationCreatedByReferences','ALTA'));
    if(Number(d.certificationCreatedByReferences||0)>0)out.push(gap('impact-reference:certification-authority','SANA Impact','Referencias declaran crear certificación fuera de autoridad','Impact References Snapshot · certificationCreatedByReferences','ALTA'));
    for(const r of d.indicators||[]){
      if(r.referenceState!=='CAPTURED')continue;
      const entity=r.indicatorId||'SIN_INDICADOR';
      for(const row of r.rows||[]){if(row.status&&row.status!=='LINKED')out.push(gap(`impact-reference:${entity}:${row.kind||'REF'}:${row.refId||'SIN_REF'}:${row.status}`,entity,`Referencia estructural ${row.status}`,'Impact References Snapshot · referenceRows','MEDIA',`${row.kind||'IMPACT_SOURCE_REF'} → ${row.targetId||row.refId||'sin destino'}`))}
      const rowIssues=(r.rows||[]).filter(x=>x.status&&x.status!=='LINKED').length;
      if(Number(r.issues||0)>rowIssues)out.push(gap(`impact-reference:${entity}:issue-count`,entity,'Conteo de issues excede inconsistencias referenciales detalladas','Impact References Snapshot · issues','MEDIA',`${r.issues} issue(s) · ${rowIssues} fila(s) no enlazada(s)`));
    }
    return out;
  }
  function mergeState(baseState,snapshot){if(!baseState?.valid)return baseState;const extra=deriveImpactReference(snapshot||baseState.snapshot),gaps=[...(baseState.gaps||[]),...extra];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:`${baseState.integrity||'SNAPSHOT_GAPS_ONLY'} · ${INTEGRITY}`}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},impactReferenceGaps:deriveImpactReference,integrity:INTEGRITY})}
  function panel(){const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const list=(state.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · IMPACT REFERENCES</p><h2>Sin inconsistencias referenciales explícitas según este corte</h2><p>Legacy/no capturado y referencias declarativas no canónicas no constituyen brecha por sí solas.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · IMPACT REFERENCES</p><h2>Procedencia referencial que requiere atención</h2><p>${list.length} inconsistencia(s) documental(es). No califican impacto, metodología, verificación externa, crédito o inversión.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':'warn'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note">REFERENCE GAP ≠ IMPACT INVALIDITY · METHODOLOGY FAILURE · EXTERNAL VERIFICATION FAILURE · CERTIFICATION FAILURE · CREDIT RISK · ELIGIBILITY · INVESTMENT SIGNAL.</div></div></section>`}
  function insert(html,section){const marker='<footer class="footer">',i=html.lastIndexOf(marker);return i<0?html+section:html.slice(0,i)+section+html.slice(i)}
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),panel());
  window.__SANA_DD_IMPACT_REFERENCE_GAPS__=Object.freeze({derive:deriveImpactReference,integrity:INTEGRITY});
})();
