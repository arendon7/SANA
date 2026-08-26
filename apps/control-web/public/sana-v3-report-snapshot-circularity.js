(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

  function evidenceCoverage(c){
    const supported=new Set((c.evidence||[]).flatMap(e=>e.supports||[]));
    const executionIds=(c.executions||[]).map(e=>e.id);
    const recoveryIds=(c.outcomes||[]).filter(e=>Number.isFinite(e.recoveredQuantity)).map(e=>e.id);
    return {
      executionEvidenceCount:executionIds.filter(id=>supported.has(id)).length,
      recoveryEvidenceCount:recoveryIds.filter(id=>supported.has(id)).length,
      unsupportedExecutionCount:executionIds.filter(id=>!supported.has(id)).length,
      unsupportedRecoveryCount:recoveryIds.filter(id=>!supported.has(id)).length
    };
  }
  function row(c){
    const coverage=evidenceCoverage(c);
    const quantifications=(c.quantification||[]).map(e=>({id:e.id||'',observedAt:e.observedAt||'',quantity:Number.isFinite(e.quantity)?e.quantity:null,unit:e.unit||'',quantityBasis:e.quantityBasis||'',method:e.method||'',provenance:e.provenance||''}));
    const executions=(c.executions||[]).map(e=>({id:e.id||'',observedAt:e.observedAt||'',executionType:e.executionType||'',actualDestination:e.actualDestination||'',handledQuantity:Number.isFinite(e.handledQuantity)?e.handledQuantity:null,unit:e.unit||'',receiverRef:e.receiverRef||'',provenance:e.provenance||''}));
    const outcomes=(c.outcomes||[]).map(e=>({id:e.id||'',observedAt:e.observedAt||'',outcomeClass:e.outcomeClass||'',recoveredQuantity:Number.isFinite(e.recoveredQuantity)?e.recoveredQuantity:null,unit:e.unit||'',provenance:e.provenance||''}));
    const plans=(c.plans||[]).map(e=>({id:e.id||'',observedAt:e.observedAt||'',plannedDestination:e.plannedDestination||'',plannedTreatment:e.plannedTreatment||'',provenance:e.provenance||''}));
    const missingQuantificationMetadata=quantifications.filter(x=>x.quantity===null||!x.unit||!x.quantityBasis||!x.method).length;
    const missingExecutionMetadata=executions.filter(x=>!x.executionType||!x.actualDestination||(x.handledQuantity!==null&&!x.unit)).length;
    const externalHandoffMissingReceiver=executions.filter(x=>x.executionType==='EXTERNAL_HANDOFF'&&!x.receiverRef).length;
    const generatedUnits=[...new Set(quantifications.map(x=>x.unit).filter(Boolean))];
    const handledUnits=[...new Set(executions.map(x=>x.unit).filter(Boolean))];
    const crossUnitConflict=generatedUnits.length&&handledUnits.length&&new Set([...generatedUnits,...handledUnits]).size>1?1:0;
    const recoveredExceedsHandled=(c.quantities?.comparable&&Number(c.quantities?.explicitRecovered||0)>Number(c.quantities?.explicitHandled||0))?1:0;
    return {caseId:c.id,lot:c.lot||'',material:c.material||'',openedAt:c.openedAt||'',stageCoverage:c.stageCoverage?.percent??null,coveredStages:c.stageCoverage?.covered??null,totalStages:c.stageCoverage?.total??null,generationCount:c.generation?.length??0,classificationCount:c.classification?.length??0,quantificationCount:quantifications.length,segregationCount:c.segregation?.length??0,planCount:plans.length,executionCount:executions.length,evidenceCount:c.evidence?.length??0,outcomeCount:outcomes.length,generatedQuantity:c.quantities?.explicitGenerated??0,handledQuantity:c.quantities?.explicitHandled??0,recoveredQuantity:c.quantities?.explicitRecovered??0,units:c.quantities?.units||[],quantityComparable:Boolean(c.quantities?.comparable),handledCoverage:c.quantities?.handledCoverage??null,plannedButNotExecuted:Boolean(c.semantics?.plannedButNotExecuted),recoveryDeclared:Boolean(c.semantics?.recoveryDeclared),unresolvedEvidenceRefs:c.semantics?.unresolvedEvidenceRefs??0,missingQuantificationMetadata,missingExecutionMetadata,externalHandoffMissingReceiver,crossUnitConflict,recoveredExceedsHandled,...coverage,plans,quantifications,executions,outcomes,evidence:(c.evidence||[]).map(e=>({id:e.id||'',observedAt:e.observedAt||'',evidenceRef:e.evidenceRef||'',supports:e.supports||[],unresolvedSupports:e.unresolvedSupports||[],provenance:e.provenance||''})),temporalState:'SNAPSHOT_CAPTURED_FROM_CIRCULARITY_LEDGER',integrity:'GENERATED ≠ RECOVERED · DESTINATION_PLAN ≠ EXECUTION · EXECUTION ≠ RECOVERY · EXTERNAL_HANDOFF ≠ VERIFIED_DISPOSITION · HANDLED_COVERAGE ≠ CIRCULARITY_RATE · EVIDENCE ≠ ENVIRONMENTAL_IMPACT'};
  }
  function enrichCircularity(manifest){
    const api=window.__SANA_CIRCULARITY_LEDGER__;
    if(!manifest||manifest.schema!==SCHEMA||!api?.cases||!api?.legacy)return manifest;
    const cases=api.cases().map(row);
    const legacy=api.legacy().map(x=>({id:x.id||'',sourceId:x.sourceId||'',lot:x.lot||'',observedAt:x.observedAt||'',summary:x.summary||'',quantity:x.quantity??null,unit:x.unit||'',destination:x.destination||'',semanticState:x.semanticState||'',temporalState:'SNAPSHOT_CAPTURED_CIRCULARITY_LEGACY'}));
    const lots=[...new Set([...cases.map(c=>c.lot),...legacy.map(x=>x.lot)].filter(Boolean))].map(lotId=>({lotId,cases:cases.filter(c=>c.lot===lotId),legacy:legacy.filter(x=>x.lot===lotId)}));
    manifest.circularity={lots,caseCount:cases.length,legacyCount:legacy.length,granularity:'ADDITIVE_V1 · CIRCULARITY_LEDGER',capturedAt:new Date().toISOString(),temporalState:'SNAPSHOT_CAPTURED_FROM_CIRCULARITY_LEDGER',integrity:'SNAPSHOT_CIRCULARITY_ONLY · NO_LIVE_FALLBACK · NO_PLAN_TO_EXECUTION_INFERENCE · NO_EXECUTION_TO_RECOVERY_INFERENCE · NO_HANDOFF_TO_VERIFIED_DISPOSITION_INFERENCE · NO_CIRCULARITY_RATE_INFERENCE · NO_ENVIRONMENTAL_IMPACT_INFERENCE · NO_EXTERNAL_CERTIFICATION'};
    return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichCircularity(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_CIRCULARITY__=Object.freeze({enrichCircularity,sync,integrity:'ADDITIVE_V1 · CIRCULARITY_LEDGER · SNAPSHOT_DEMO · NO_LIVE_FALLBACK · NO_EXTERNAL_WRITE'});
})();
