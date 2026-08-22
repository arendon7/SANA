(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  function row(x){const r=x.reference||{},e=x.event||{};return {eventId:e.id||'',eventKind:e.eventKind||'',observedAt:e.observedAt||'',refId:x.refId||'',status:r.status||'',targetId:r.target?.id||'',targetKind:r.target?.eventKind||'',targetLot:r.target?.lot||'',temporalState:'SNAPSHOT_CAPTURED_PHENOLOGY_REFERENCE'}}
  function enrich(manifest){
    const api=window.__SANA_PHENOLOGY_SERIES__;
    if(!manifest||manifest.schema!==SCHEMA||!manifest.phenology||api?.referenceVersion!=='V133'||!api.referenceCoverage)return manifest;
    const lots=Array.isArray(manifest.phenology.lots)?manifest.phenology.lots:[];
    lots.forEach(x=>{const c=api.referenceCoverage(x.lotId);x.referenceVersion='V133';x.referenceCoverage=c.percent;x.referenceLinkedCount=c.linked;x.referenceExpectedCount=c.total;x.referenceIssueCount=c.issues;x.referenceRows=c.rows.map(row);x.referenceTemporalState='SNAPSHOT_CAPTURED_FROM_PHENOLOGY_REFERENCE_INTEGRITY'});
    manifest.phenology.referenceGranularity='ADDITIVE_V2 · PHENOLOGY_SEMANTIC_REFERENCES';
    manifest.phenology.referenceLinkedCount=lots.reduce((n,x)=>n+Number(x.referenceLinkedCount||0),0);
    manifest.phenology.referenceExpectedCount=lots.reduce((n,x)=>n+Number(x.referenceExpectedCount||0),0);
    manifest.phenology.referenceIssueCount=lots.reduce((n,x)=>n+Number(x.referenceIssueCount||0),0);
    manifest.phenology.integrity='SNAPSHOT_PHENOLOGY_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_REFERENCE_FILL · OBSERVED_STAGE ≠ PLAN_PHASE · MEASUREMENT ≠ INTERPRETATION · REFERENCE ≠ MANAGEMENT_DECISION · REFERENCE ≠ CAUSALITY · NO_EXTERNAL_CERTIFICATION';
    return manifest;
  }
  function form(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const f=form();const field=f?.querySelector('[name="manifest"]');if(!field?.value)return;try{const m=JSON.parse(field.value);enrich(m);field.value=JSON.stringify(m)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_PHENOLOGY_REFERENCES__=Object.freeze({enrich,sync,row,integrity:'ADDITIVE_V2 · SNAPSHOT_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_REFERENCE_FILL · REFERENCE ≠ PLAN_PHASE ≠ MANAGEMENT_DECISION ≠ CAUSALITY'});
})();
