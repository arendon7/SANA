(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  function closureRow(row){const e=row?.event||{},r=row?.reference||{};return {eventId:e.id||'',observedAt:e.observedAt||'',closureClass:e.closureClass||'',basisEventId:e.basisEventId||'',lifecycleVersion:e.lifecycleVersion||'',status:r.status||'',targetId:r.target?.id||'',targetKind:r.target?.eventKind||'',temporalState:'SNAPSHOT_CAPTURED_NUTRITION_CLOSURE'}}
  function enrich(manifest){
    const api=window.__SANA_NUTRITION_LEDGER__;if(!manifest||manifest.schema!==SCHEMA||!manifest.nutrition||!api?.cases||api.lifecycleVersion!=='V131')return manifest;
    const live=new Map(api.cases().map(c=>[c.id,c]));
    (manifest.nutrition.lots||[]).forEach(lot=>(lot.cases||[]).forEach(row=>{const c=live.get(row.caseId);if(!c?.lifecycle)return;row.lifecycleVersion=c.lifecycle.version||api.lifecycleVersion;row.lifecycleState=c.lifecycle.state||'OPEN';row.closedAt=c.lifecycle.closedAt||'';row.closureClass=c.lifecycle.closureClass||'';row.closureBasisEventId=c.lifecycle.basisEventId||'';row.closureEventId=c.lifecycle.closureEventId||'';row.closureIssueCount=c.lifecycle.closureIssues??0;row.closureRows=(c.closureRows||[]).map(closureRow);row.lifecycleTemporalState='SNAPSHOT_CAPTURED_FROM_NUTRITION_LIFECYCLE';row.lifecycleIntegrity='RESPONSE ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ NUTRITION_OBJECTIVE_ACHIEVED · CASE_CLOSE ≠ APPLICATION_SUCCESS · CASE_CLOSE ≠ INVENTORY_RECONCILED · OPEN_CASE ≠ GAP';}));
    manifest.nutrition.lifecycleGranularity='ADDITIVE_V131 · HUMAN_CASE_LIFECYCLE';manifest.nutrition.lifecycleVersion=api.lifecycleVersion;manifest.nutrition.lifecycleCapturedAt=new Date().toISOString();return manifest;
  }
  function form(){return typeof modalAction!=='undefined'&&modalAction==='report-snapshot'?document.getElementById('modal-form'):null}
  function sync(){const f=form(),field=f?.querySelector('[name="manifest"]');if(!field?.value)return;try{const m=JSON.parse(field.value);enrich(m);field.value=JSON.stringify(m)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_NUTRITION_LIFECYCLE__=Object.freeze({enrich,sync,integrity:'SNAPSHOT_ONLY · NUTRITION_LIFECYCLE_V131 · NO_LIVE_HISTORICAL_FALLBACK · NO_RETROACTIVE_CLOSURE_FILL'});
})();
