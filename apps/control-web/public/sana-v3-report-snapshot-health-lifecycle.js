(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

  function closureRow(row){
    const event=row?.event||{};const ref=row?.reference||{};
    return {eventId:event.id||'',eventKind:event.eventKind||'CASE_CLOSE',observedAt:event.observedAt||'',basisEventId:event.basisEventId||'',closureClass:event.closureClass||'',provenance:event.provenance||'',expectedKind:ref.expectedKind||'RESULT',status:ref.status||'',targetId:ref.target?.id||'',targetKind:ref.target?.eventKind||'',targetCaseId:ref.target?.caseId||'',temporalState:'SNAPSHOT_CAPTURED_HEALTH_CASE_LIFECYCLE'};
  }
  function enrichLifecycle(manifest){
    const api=window.__SANA_PHYTOSANITARY_LEDGER__;
    if(!manifest||manifest.schema!==SCHEMA||!manifest.health||!api?.cases)return manifest;
    const live=new Map(api.cases().map(c=>[c.id,c]));
    const lots=Array.isArray(manifest.health.lots)?manifest.health.lots:[];
    lots.forEach(lot=>(lot.cases||[]).forEach(row=>{
      const c=live.get(row.caseId);if(!c)return;
      row.caseState=c.caseState||'OPEN';
      row.closureCount=c.closures?.length??0;
      row.closureIssueCount=c.closureIssues??0;
      row.closedAt=c.closedAt||'';
      row.latestClosureEventId=c.latestClosure?.id||'';
      row.latestClosureClass=c.latestClosure?.closureClass||'';
      row.latestClosureBasisResultId=c.latestClosure?.basisEventId||'';
      row.closureRows=(c.closureRows||[]).map(closureRow);
      row.lifecycleTemporalState='SNAPSHOT_CAPTURED_FROM_HUMAN_CASE_LIFECYCLE';
      row.lifecycleIntegrity='RESULT ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY';
    }));
    const rows=lots.flatMap(lot=>lot.cases||[]);
    manifest.health.lifecycleGranularity='ADDITIVE_V2 · HUMAN_CASE_LIFECYCLE';
    manifest.health.closedCaseCount=rows.filter(r=>r.caseState==='CLOSED_HUMAN').length;
    manifest.health.lifecycleIssueCount=rows.reduce((n,r)=>n+Number(r.closureIssueCount||0),0);
    manifest.health.integrity='SNAPSHOT_HEALTH_ONLY · NO_LIVE_FALLBACK · NO_RETROACTIVE_DIAGNOSIS · NO_TREATMENT_OR_EFFICACY_INFERENCE · NO_V1_TO_V2_STAGE_PROMOTION · NO_RETROACTIVE_REFERENCE_FILL · NO_RETROACTIVE_CLOSURE_FILL · RESULT ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY · REFERENCE ≠ CAUSALITY · NO_EXTERNAL_CERTIFICATION';
    return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichLifecycle(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_HEALTH_LIFECYCLE__=Object.freeze({enrichLifecycle,sync,closureRow,integrity:'ADDITIVE_V2 · HUMAN_CASE_LIFECYCLE · SNAPSHOT_DEMO · NO_LIVE_FALLBACK · NO_RETROACTIVE_CLOSURE_FILL · RESULT ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · NO_EXTERNAL_WRITE'});
})();
