(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Sanidad vegetal';
  const OWNER='Técnico + Productor';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};
  function rows(manifest){const lots=Array.isArray(manifest?.health?.lots)?manifest.health.lots:[];return lots.flatMap(lot=>(lot.cases||[]).map(row=>({...row,lotId:lot.lotId||row.lot||''})))}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function lifecycleState(row){
    const captured=row.caseState!==undefined||row.closureCount!==undefined||row.closureIssueCount!==undefined||Array.isArray(row.closureRows);
    if(!captured)return {captured:false,state:'NOT_CAPTURED',closures:0,issues:0,statuses:[]};
    const state=String(row.caseState||'OPEN');const closures=Number(row.closureCount||0);const issues=Number(row.closureIssueCount||0);const statuses=(Array.isArray(row.closureRows)?row.closureRows:[]).filter(x=>x?.status&&x.status!=='LINKED').map(x=>x.status);
    return {captured:true,state,closures,issues,statuses,closedAt:row.closedAt||'',latestClosureClass:row.latestClosureClass||'',basisResultId:row.latestClosureBasisResultId||''};
  }
  function derive(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA||!snapshot.manifest?.health?.lifecycleGranularity)return [];
    const out=[];
    rows(snapshot.manifest).forEach(r=>{
      const life=lifecycleState(r);if(!life.captured)return;const entity=`${r.lotId||r.lot||'SIN_LOTE'} · ${r.caseId||'SIN_CASO'}`;
      if(life.issues>0){const statusText=[...new Set(life.statuses)].join(', ')||'referencia de cierre inconsistente';out.push(gap(`health:${entity}:case-lifecycle`,entity,`${life.issues} inconsistencia(s) de lifecycle sanitario`,'Health Snapshot · closureIssueCount/closureRows','MEDIA',`${statusText}. RESULT ≠ CASE_CLOSURE; CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED. No reconstruir cierres automáticamente.`))}
      if(life.state==='CLOSED_HUMAN'&&life.closures===0)out.push(gap(`health:${entity}:closed-without-closure`,entity,'Estado CLOSED_HUMAN sin evento CASE_CLOSE capturado','Health Snapshot · caseState/closureCount','MEDIA','Inconsistencia documental de lifecycle. CLOSED_HUMAN ≠ CONDITION_RESOLVED y no demuestra eficacia.'));
      if(life.state==='CLOSED_HUMAN'&&life.closures>0&&!life.basisResultId)out.push(gap(`health:${entity}:closure-without-result-ref`,entity,'Cierre humano sin RESULT de referencia capturado','Health Snapshot · latestClosureBasisResultId','MEDIA','RESULT ≠ CASE_CLOSURE. El cierre debe conservar su referencia explícita; no se infiere desde pertenencia al caso.'));
    });
    return out;
  }
  function merge(baseState,snapshot){
    if(!baseState?.valid)return baseState;const lifecycle=derive(snapshot||baseState.snapshot);const existing=new Set((baseState.gaps||[]).map(g=>g.id));const gaps=[...(baseState.gaps||[]),...lifecycle.filter(g=>!existing.has(g.id))];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>{counts[g.severity]=(counts[g.severity]||0)+1});return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · HEALTH_CASE_LIFECYCLE_DOCUMENTARY_ONLY · OPEN_CASE ≠ GAP · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY · CASE_STATE ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL'};
  }
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>merge(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return merge(base.derive(snapshot),snapshot)},healthLifecycleGaps:derive,integrity:'SNAPSHOT_GAPS_ONLY · OPEN_CASE ≠ GAP · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY · CASE_STATE ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL'})}
  window.__SANA_DD_HEALTH_LIFECYCLE_GAPS__=Object.freeze({derive,lifecycleState,integrity:'SNAPSHOT_HEALTH_LIFECYCLE_GAPS_ONLY · NO_LIVE_FALLBACK · OPEN_CASE ≠ GAP · CLOSED_HUMAN ≠ RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY · NO_CREDIT_OR_INVESTMENT_INFERENCE'});
})();
