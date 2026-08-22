(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const VERSION='V140';
  const INTEGRITY='SNAPSHOT_FORECAST_REFERENCES_ONLY · NO_LIVE_FALLBACK · LEGACY_REFERENCE_NOT_CAPTURED ≠ GAP · REFERENCE ≠ FORECAST_TRUTH ≠ CAUSAL_BASIS ≠ APPROVAL ≠ EXECUTION ≠ PROCUREMENT';
  function row(r){return {kind:r.kind||'',refId:r.refId||'',status:r.reference?.status||'',domain:r.reference?.domain||'',targetId:r.reference?.target?.id||''}}
  function caseRow(c){return {forecastId:c.id||'',lot:c.lot||'',itemId:c.itemId||'',referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',linked:c.referenceCoverage?.linked??0,total:c.referenceCoverage?.total??0,issues:c.referenceIssues??0,rows:(c.referenceRows||[]).map(row)}}
  function enrich(manifest){const api=window.__SANA_FORECAST_LEDGER__;if(!manifest||manifest.schema!==SCHEMA||!manifest.forecast||api?.referenceVersion!=='V139'||!api?.cases)return manifest;const cases=api.cases().map(caseRow);const captured=cases.filter(c=>c.referenceState==='CAPTURED_V139');manifest.forecastReferences={version:VERSION,cases,capturedCount:captured.length,legacyCount:cases.length-captured.length,linked:captured.reduce((n,c)=>n+c.linked,0),expected:captured.reduce((n,c)=>n+c.total,0),issueCount:captured.reduce((n,c)=>n+c.issues,0),capturedAt:new Date().toISOString(),temporalState:'SNAPSHOT_CAPTURED_FROM_FORECAST_REFERENCES_V139',integrity:INTEGRITY};return manifest}
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrich(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_FORECAST_REFERENCES__=Object.freeze({version:VERSION,enrich,sync,integrity:INTEGRITY});
})();
