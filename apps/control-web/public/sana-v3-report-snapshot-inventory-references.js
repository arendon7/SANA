(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  function row(x){const e=x.event||{},r=x.reference||{};return {eventId:e.id||'',eventKind:e.kind||'',observedAt:e.observedAt||'',refId:x.refId||'',domain:r.domain||'',status:r.status||'',targetId:r.target?.id||'',targetLot:r.target?.lot||'',targetItemId:r.target?.itemId||'',temporalState:'SNAPSHOT_CAPTURED_INVENTORY_REFERENCE'}}
  function enrich(manifest){
    const api=window.__SANA_INVENTORY_LEDGER__;
    if(!manifest||manifest.schema!==SCHEMA||!manifest.inventory||api?.referenceVersion!=='V137'||!api.referenceCoverage)return manifest;
    const items=Array.isArray(manifest.inventory.items)?manifest.inventory.items:[];
    items.forEach(i=>{const x=api.referenceCoverage(i.caseId);i.referenceVersion='V137';i.referenceCoverage=x.percent;i.referenceLinkedCount=x.linked;i.referenceExpectedCount=x.total;i.referenceIssueCount=x.issues;i.referenceRows=x.rows.map(row);i.referenceTemporalState='SNAPSHOT_CAPTURED_FROM_INVENTORY_REFERENCE_INTEGRITY'});
    manifest.inventory.referenceGranularity='ADDITIVE_V2 · INVENTORY_CROSS_DOMAIN_REFERENCES';
    manifest.inventory.referenceLinkedCount=items.reduce((n,i)=>n+Number(i.referenceLinkedCount||0),0);
    manifest.inventory.referenceExpectedCount=items.reduce((n,i)=>n+Number(i.referenceExpectedCount||0),0);
    manifest.inventory.referenceIssueCount=items.reduce((n,i)=>n+Number(i.referenceIssueCount||0),0);
    manifest.inventory.integrity='SNAPSHOT_INVENTORY_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_REFERENCE_FILL · STRING_REFERENCE ≠ VALIDATED_REFERENCE · ACTIVITY_LINK ≠ CONSUMPTION · CONSUMPTION ≠ AGRONOMIC_APPLICATION · FORECAST_REFERENCE ≠ PROCUREMENT_AUTHORITY · EVIDENCE_REFERENCE ≠ EXTERNAL_VERIFICATION · SUPPLIER_REF/COST_REF ≠ CANONICALLY_VERIFIED';
    return manifest;
  }
  function form(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const f=form(),field=f?.querySelector('[name="manifest"]');if(!field?.value)return;try{const m=JSON.parse(field.value);enrich(m);field.value=JSON.stringify(m)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_INVENTORY_REFERENCES__=Object.freeze({enrich,sync,row,integrity:'ADDITIVE_V2 · SNAPSHOT_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_REFERENCE_FILL · STRING_REFERENCE ≠ VALIDATED_REFERENCE · NO_PROCUREMENT_OR_FINANCIAL_AUTHORITY'});
})();
