(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

  function referenceRow(row){
    const event=row?.event||{};const ref=row?.reference||{};
    return {eventId:event.id||'',eventKind:event.eventKind||'',observedAt:event.observedAt||'',basisEventId:event.basisEventId||'',referenceVersion:event.referenceVersion||'',expectedKind:ref.expectedKind||'',status:ref.status||'',targetId:ref.target?.id||'',targetKind:ref.target?.eventKind||'',targetCaseId:ref.target?.caseId||'',temporalState:'SNAPSHOT_CAPTURED_NUTRITION_REFERENCE'};
  }
  function enrichNutritionV2(manifest){
    const api=window.__SANA_NUTRITION_LEDGER__;
    if(!manifest||manifest.schema!==SCHEMA||!manifest.nutrition||!api?.cases)return manifest;
    const live=new Map(api.cases().map(c=>[c.id,c]));
    const lots=Array.isArray(manifest.nutrition.lots)?manifest.nutrition.lots:[];
    lots.forEach(lot=>(lot.cases||[]).forEach(row=>{
      const c=live.get(row.caseId);if(!c)return;
      row.projectionVersion=c.projectionVersion||api.projectionVersion||'V1';
      row.chainCoverage=c.chainCoverage?.percent??null;
      row.chainCoveredStages=c.chainCoverage?.covered??null;
      row.chainTotalStages=c.chainCoverage?.total??null;
      row.activityLinkEventCount=c.activityLinks?.length??0;
      row.embeddedActivityLinkCount=c.semantics?.embeddedActivityLinksV1??0;
      row.activityLinkIssueCount=c.semantics?.activityLinkIssues??0;
      row.referenceVersion=api.referenceVersion||c.referenceVersion||'';
      row.referenceCoverage=c.referenceCoverage?.percent??null;
      row.referenceLinkedCount=c.referenceCoverage?.linked??0;
      row.referenceExpectedCount=c.referenceCoverage?.total??0;
      row.referenceIssueCount=c.referenceIssues??c.semantics?.referenceIssues??0;
      row.referenceRows=(c.referenceRows||[]).map(referenceRow);
      row.v2TemporalState='SNAPSHOT_CAPTURED_FROM_NUTRITION_CHAIN_V2';
      row.v2Integrity='DECISION ≠ ACTIVITY_LINK ≠ APPLICATION · ACTIVITY_LINK_EVENT ≠ APPLICATION · EMBEDDED_V1_RELATION ≠ V2_STAGE · CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ APPLICATION_AUTHORITY ≠ INVENTORY_MOVEMENT ≠ CAUSALITY';
    }));
    manifest.nutrition.chainGranularity='ADDITIVE_V2 · NUTRITION_CHAIN';
    manifest.nutrition.referenceGranularity='ADDITIVE_V2 · EXPLICIT_PREDECESSOR_REFERENCES';
    manifest.nutrition.projectionVersion=api.projectionVersion||'V2';
    manifest.nutrition.referenceVersion=api.referenceVersion||'';
    manifest.nutrition.v2CapturedAt=new Date().toISOString();
    manifest.nutrition.integrity='SNAPSHOT_NUTRITION_ONLY · NO_LIVE_FALLBACK · NO_PROGRAM_TO_APPLICATION_INFERENCE · NO_INVENTORY_MOVEMENT_INFERENCE · NO_CAUSAL_RESPONSE · NO_V1_TO_V2_STAGE_PROMOTION · NO_RETROACTIVE_REFERENCE_FILL · ACTIVITY_LINK_EVENT ≠ APPLICATION · EMBEDDED_V1_RELATION ≠ V2_STAGE · CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ APPLICATION_AUTHORITY ≠ INVENTORY_MOVEMENT ≠ CAUSALITY · NO_EXTERNAL_CERTIFICATION';
    return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichNutritionV2(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_NUTRITION_V2__=Object.freeze({enrichNutritionV2,sync,referenceRow,integrity:'ADDITIVE_V2 · NUTRITION_CHAIN · EXPLICIT_PREDECESSOR_REFERENCES · SNAPSHOT_DEMO · NO_LIVE_FALLBACK · NO_V1_TO_V2_STAGE_PROMOTION · NO_RETROACTIVE_REFERENCE_FILL · NO_EXTERNAL_WRITE'});
})();
