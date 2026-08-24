(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1',DOMAIN='Capital / referencias de gobernanza',OWNER='Legal + Finanzas + Operaciones',ORDER={ALTA:3,MEDIA:2,BAJA:1};
  const INTEGRITY='SNAPSHOT_CAPITAL_GOVERNANCE_REFERENCE_GAPS_ONLY · NOT_CAPTURED_OR_LEGACY ≠ GAP · DECLARED_NON_CANONICAL_REFERENCE ≠ GAP · CONTENT_LEAK = GAP · REFERENCE_ISSUE ≠ IDENTITY_FAILURE ≠ APPROVAL_FAILURE ≠ TERM_SHEET_INVALIDITY ≠ COMMITMENT_INVALIDITY ≠ FUNDING_FAILURE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION';
  const HIGH=new Set(['MISSING_REFERENCE','MISSING_TARGET','CROSS_SCOPE_REFERENCE','CROSS_CASE_REFERENCE']);
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function derive(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const d=snapshot.manifest?.capitalGovernanceReferences;if(!d)return [];
    const out=[];
    if(Number(d.contentLeakCount)>0)out.push(gap('capital-ref:content-leak',snapshot.manifest?.farm?.id||'Unidad',`${d.contentLeakCount} campo(s) no minimizados detectados en granularidad Capital`,'Capital Governance Reference Snapshot V151','ALTA','La granularidad referencial no puede duplicar contraparte, documentos externos, montos, moneda, estados de transacción ni detalle.'));
    for(const c of d.cases||[]){
      if(c.referenceState!=='CAPTURED_V150')continue;
      if(c.declaredReferenceValuePolicy!=='COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED')out.push(gap(`capital-ref:${c.caseId}:value-policy`,`${c.caseId||'SIN_CASO'} · ${c.lot||'SIN_LOTE'}`,'Política de valores declarados no canónicos incompatible','Capital Governance Reference Snapshot V151','ALTA',String(c.declaredReferenceValuePolicy||'NOT_CAPTURED')));
      for(const r of c.rows||[]){
        if(r.status==='LINKED')continue;
        const sev=HIGH.has(r.status)?'ALTA':'MEDIA';
        out.push(gap(`capital-ref:${c.caseId}:${r.sourceEventId}:${r.kind}:${r.refId||'missing'}`,`${c.caseId||'SIN_CASO'} · ${c.lot||'SIN_LOTE'}`,`${r.kind||'REFERENCE'} · ${r.status||'INVALID_REFERENCE'}`,'Capital Governance Reference Snapshot V151',sev,`ref=${r.refId||'—'} · targetKind=${r.targetKind||'—'} · targetLot=${r.targetLot||'—'} · temporalPolicy=${r.temporalPolicy||'—'}. La inconsistencia solo describe integridad estructural; no prueba identidad, aprobación, invalidez documental, falla de funding ni riesgo financiero.`));
      }
    }
    return out;
  }
  function merge(baseState,snapshot){if(!baseState?.valid)return baseState;const extra=derive(snapshot||baseState.snapshot),gaps=[...(baseState.gaps||[]),...extra];gaps.sort((a,b)=>(ORDER[b.severity]||0)-(ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:`${baseState.integrity||'SNAPSHOT_GAPS_ONLY'} · ${INTEGRITY}`}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current)window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:s=>merge(base.derive(s),s),current:()=>{const s=base.latest?.();return merge(base.derive(s),s)},capitalGovernanceReferenceGaps:derive,integrity:INTEGRITY});
  function panel(){const s=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!s?.valid)return '';const list=(s.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · CAPITAL REFERENCES</p><h2>Sin inconsistencias referenciales capturadas</h2><p>Legacy/no capturado y referencias declaradas no canónicas no constituyen gap por sí solos.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · CAPITAL REFERENCES V151</p><h2>Integridad referencial de Capital que requiere atención</h2><p>${list.length} inconsistencia(s) estructural(es). No se puntúa identidad, aprobación, elegibilidad, crédito, funding ni conveniencia de inversión.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':'warn'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note">NOT_CAPTURED_OR_LEGACY ≠ GAP · DECLARED_NON_CANONICAL_REFERENCE ≠ GAP · REFERENCE ISSUE ≠ IDENTITY/APPROVAL/TERM/COMMITMENT/FUNDING FAILURE ≠ CREDIT/ELIGIBILITY/INVESTMENT SIGNAL.</div></div></section>`}
  function insert(html,section){const m='<footer class="footer">',i=html.lastIndexOf(m);return i<0?html+section:html.slice(0,i)+section+html.slice(i)}
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),panel());
  window.__SANA_DD_CAPITAL_GOVERNANCE_REFERENCE_GAPS__=Object.freeze({derive,integrity:INTEGRITY});
})();
