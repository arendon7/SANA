(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

  function snapshotRow(r){
    return {
      id:r.id||'',lot:r.lot||'',variable:r.variable||'',value:r.value??null,unit:r.unit||'',observedAt:r.observedAt||'',capturedAt:r.capturedAt||'',point:r.point||'',method:r.method||'',sourceClass:r.sourceClass||'',sourceRef:r.sourceRef||'',qualityClaim:r.qualityClaim||'',hardwareVerification:r.hardwareVerification||'',calibrationState:r.calibrationState||'',locationIntegrity:r.locationIntegrity||'',timeIntegrity:r.timeIntegrity||'',captureState:r.captureState||'',queueState:r.queueState||'',syncAttemptState:r.syncAttemptState||'',ackState:r.ackState||'',ackRef:r.ackRef||'',validationState:r.validationState||'',conflictState:r.conflictState||'',humanReview:r.humanReview||'',provenance:r.provenance||'',decisionUse:r.decisionUse||'',reviewFlags:[...(r.reviewFlags||[])],candidateCount:(r.candidates||[]).length,candidates:(r.candidates||[]).map(c=>({candidateId:c.candidateId||'',value:c.value??null,unit:c.unit||'',sourceRef:c.sourceRef||'',capturedAt:c.capturedAt||''})),accountCloudStatus:r.accountCloudStatus||'',accountCloudRevision:r.accountCloudRevision??null,accountCloudConflict:Boolean(r.accountCloudConflict),temporalState:'SNAPSHOT_CAPTURED_FROM_DATA_TRUST',integrity:'CAPTURED ≠ SYNCED · ACCOUNT_SYNC_STATUS ≠ RECORD_ACK · SERVER_ACK ≠ HARDWARE_VERIFIED · READING ≠ VALIDATED_MEASUREMENT · CONFLICT ≠ DATA_LOSS'};
  }

  function enrichDataTrust(manifest){
    const api=window.__SANA_DATA_TRUST__;
    if(!manifest||manifest.schema!==SCHEMA||!api?.rows)return manifest;
    const rows=api.rows().map(snapshotRow);
    const cloud=api.cloudContext?.()||{};
    const lots=[...new Set(rows.map(r=>r.lot).filter(Boolean))].map(lotId=>({lotId,readings:rows.filter(r=>r.lot===lotId)}));
    manifest.dataTrust={
      lots,readingCount:rows.length,noRecordAckCount:rows.filter(r=>r.ackState==='NO_RECORD_ACK').length,demoAckCount:rows.filter(r=>r.ackState==='SERVER_ACK_DEMO_EXPLICIT').length,conflictCount:rows.filter(r=>r.conflictState==='CONFLICT_REVIEW_REQUIRED').length,unvalidatedCount:rows.filter(r=>r.validationState!=='VALIDATED').length,hardwareNotVerifiedCount:rows.filter(r=>/NOT_VERIFIED/.test(r.hardwareVerification)).length,accountContext:{status:cloud.status||'LOCAL_ONLY',connected:Boolean(cloud.connected),conflict:Boolean(cloud.conflict),revision:cloud.revision??0,dirty:Boolean(cloud.dirty)},granularity:'ADDITIVE_V1 · DATA_TRUST',capturedAt:new Date().toISOString(),temporalState:'SNAPSHOT_CAPTURED_FROM_DATA_TRUST',integrity:'SNAPSHOT_DATA_TRUST_ONLY · NO_LIVE_FALLBACK · NO_ACCOUNT_STATUS_TO_RECORD_ACK_INFERENCE · NO_ACK_TO_HARDWARE_VERIFICATION_INFERENCE · NO_READING_TO_VALIDATION_INFERENCE · NO_DECISION_AUTHORITY · NO_EXTERNAL_CERTIFICATION'};
    return manifest;
  }

  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichDataTrust(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);

  window.__SANA_REPORT_SNAPSHOT_DATA_TRUST__=Object.freeze({enrichDataTrust,sync,integrity:'ADDITIVE_V1 · DATA_TRUST · SNAPSHOT_DEMO · NO_LIVE_FALLBACK · NO_EXTERNAL_WRITE'});
})();
