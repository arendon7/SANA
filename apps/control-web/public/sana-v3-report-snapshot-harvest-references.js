(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  function row(x){const e=x.event||{},r=x.reference||{};return {eventId:e.id||'',eventKind:e.kind||'',observedAt:e.observedAt||'',refId:x.refId||'',status:r.status||'',targetId:r.target?.id||'',targetKind:r.target?.kind||'',targetCaseId:r.target?.caseId||'',targetLot:r.target?.lot||'',temporalState:'SNAPSHOT_CAPTURED_HARVEST_REFERENCE'}}
  function enrich(manifest){
    const api=window.__SANA_HARVEST_LEDGER__;
    if(!manifest||manifest.schema!==SCHEMA||!manifest.harvestResults||api?.referenceVersion!=='V135'||!api.referenceCoverage)return manifest;
    const cases=Array.isArray(manifest.harvestResults.cases)?manifest.harvestResults.cases:[];
    cases.forEach(c=>{const x=api.referenceCoverage(c.caseId);c.referenceVersion='V135';c.referenceCoverage=x.percent;c.referenceLinkedCount=x.linked;c.referenceExpectedCount=x.total;c.referenceIssueCount=x.issues;c.referenceRows=x.rows.map(row);c.referenceTemporalState='SNAPSHOT_CAPTURED_FROM_HARVEST_REFERENCE_INTEGRITY'});
    manifest.harvestResults.referenceGranularity='ADDITIVE_V2 · HARVEST_SEMANTIC_REFERENCES';
    manifest.harvestResults.referenceLinkedCount=cases.reduce((n,c)=>n+Number(c.referenceLinkedCount||0),0);
    manifest.harvestResults.referenceExpectedCount=cases.reduce((n,c)=>n+Number(c.referenceExpectedCount||0),0);
    manifest.harvestResults.referenceIssueCount=cases.reduce((n,c)=>n+Number(c.referenceIssueCount||0),0);
    manifest.harvestResults.integrity='SNAPSHOT_HARVEST_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_REFERENCE_FILL · QUANTITY_MATCH ≠ EVENT_REFERENCE · REFERENCE ≠ SALE_VALIDITY ≠ PAYMENT ≠ OWNERSHIP_TRANSFER ≠ PROFITABILITY ≠ CAUSALITY · NO_EXTERNAL_CERTIFICATION';
    return manifest;
  }
  function form(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const f=form(),field=f?.querySelector('[name="manifest"]');if(!field?.value)return;try{const m=JSON.parse(field.value);enrich(m);field.value=JSON.stringify(m)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_HARVEST_REFERENCES__=Object.freeze({enrich,sync,row,integrity:'ADDITIVE_V2 · SNAPSHOT_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_REFERENCE_FILL · QUANTITY_MATCH ≠ EVENT_REFERENCE · REFERENCE ≠ SALE_VALIDITY ≠ PAYMENT ≠ PROFITABILITY ≠ CAUSALITY'});
})();
