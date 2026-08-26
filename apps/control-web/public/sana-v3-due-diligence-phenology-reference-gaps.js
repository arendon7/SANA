(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1',DOMAIN='Fenología / referencias',OWNER='Técnico + Productor';
  function gap(id,entity,detail){return {id,domain:DOMAIN,entity,condition:'Integridad referencial fenológica incompleta',source:'Phenology Snapshot · referenceIssueCount',severity:'MEDIA',owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function derive(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const p=snapshot.manifest?.phenology;if(!p?.referenceGranularity)return [];
    const out=[];(p.lots||[]).forEach(x=>{const n=Number(x.referenceIssueCount||0);if(n>0)out.push(gap(`phenology-reference:${x.lotId||'SIN_LOTE'}`,x.lotId||'SIN_LOTE',`${n} referencia(s) V133 con inconsistencia de destino, tipo, lote, tiempo o ausencia explícita. Es una brecha documental; no indica desempeño fenológico.`))});return out;
  }
  function merge(s,snapshot){if(!s?.valid)return s;const extra=derive(snapshot||s.snapshot),gaps=[...(s.gaps||[]),...extra];const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...s,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · NO_LIVE_FALLBACK · LEGACY_REFERENCE_NOT_CAPTURED ≠ GAP · REFERENCE_ISSUE ≠ PHENOLOGICAL_PERFORMANCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION'} }
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current)window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({...base,derive:s=>merge(base.derive(s),s),current:()=>{const snap=base.latest?.();return merge(base.derive(snap),snap)},phenologyReferenceGaps:derive,integrity:'SNAPSHOT_GAPS_ONLY · NO_LIVE_FALLBACK · LEGACY_REFERENCE_NOT_CAPTURED ≠ GAP · REFERENCE_ISSUE ≠ PHENOLOGICAL_PERFORMANCE ≠ CREDIT_RISK ≠ INVESTMENT_RECOMMENDATION'});
  window.__SANA_DD_PHENOLOGY_REFERENCE_GAPS__=Object.freeze({derive,integrity:'SNAPSHOT_ONLY · NO_LIVE_FALLBACK · LEGACY_REFERENCE_NOT_CAPTURED ≠ GAP · REFERENCE_ISSUE ≠ PERFORMANCE ≠ INVESTMENT_SIGNAL'});
})();
