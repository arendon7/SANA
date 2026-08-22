(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

  function snapshotCase(c){
    return {
      caseId:c.id||'',lot:c.lot||'',
      harvestQuantity:c.quantities?.harvestQuantity??null,harvestUnit:c.quantities?.harvestUnit||'',
      lossQuantity:c.quantities?.lossQuantity??null,lossUnit:c.quantities?.lossUnit||'',
      handoffQuantity:c.quantities?.handoffQuantity??null,handoffUnit:c.quantities?.handoffUnit||'',
      soldQuantity:c.quantities?.soldQuantity??null,soldUnit:c.quantities?.soldUnit||'',
      observedYield:c.quantities?.observedYield??null,yieldUnit:c.quantities?.yieldUnit||'',
      classificationCount:c.classifications?.length??0,evidenceCount:c.evidence?.length??0,
      saleDeclarationCount:c.sales?.length??0,paymentCaptured:c.semantics?.paymentCaptured??0,
      unsupportedExecution:[...(c.semantics?.unsupportedExecution||[])],
      saleWithoutHandoff:[...(c.semantics?.saleWithoutHandoff||[])],
      soldExceedsHarvest:Boolean(c.semantics?.soldExceedsHarvest),lossExceedsHarvest:Boolean(c.semantics?.lossExceedsHarvest),
      events:(c.events||[]).map(e=>({id:e.id||'',kind:e.kind||'',observedAt:e.observedAt||'',quantity:e.quantity??null,unit:e.unit||'',method:e.method||'',source:e.source||'',owner:e.owner||'',provenance:e.provenance||'',classification:e.classification||'',classifiedShare:e.classifiedShare??null,shareUnit:e.shareUnit||'',evidenceRef:e.evidenceRef||'',supports:[...(e.supports||[])],receiverRef:e.receiverRef||'',handoffType:e.handoffType||'',pricePerUnit:e.pricePerUnit??null,priceUnit:e.priceUnit||'',declaredRevenue:e.declaredRevenue??null,revenueUnit:e.revenueUnit||'',commercialRef:e.commercialRef||'',paymentState:e.paymentState||'',lossClass:e.lossClass||'',reason:e.reason||''})),
      temporalState:'SNAPSHOT_CAPTURED_FROM_HARVEST_LEDGER',
      integrity:'HARVEST ≠ SALE · HANDOFF ≠ SALE · SALE_DECLARATION ≠ PAYMENT · PRICE_REFERENCE ≠ REALIZED_PRICE · EXPECTED_REVENUE ≠ REALIZED_REVENUE · QUALITY_CLASSIFICATION ≠ CERTIFICATION · LOSS_DECLARED ≠ PROCESS_FAILURE · YIELD ≠ PROFITABILITY · RESULT ≠ CAUSALITY'
    };
  }

  function enrichHarvest(manifest){
    const api=window.__SANA_HARVEST_LEDGER__;
    if(!manifest||manifest.schema!==SCHEMA||!api?.cases)return manifest;
    const cases=api.cases().map(snapshotCase);
    manifest.harvestResults={
      cases,
      caseCount:cases.length,
      harvestCaseCount:cases.filter(c=>c.harvestQuantity!==null).length,
      saleDeclarationCount:cases.reduce((n,c)=>n+Number(c.saleDeclarationCount||0),0),
      paymentCapturedCount:cases.reduce((n,c)=>n+Number(c.paymentCaptured||0),0),
      unsupportedExecutionCount:cases.reduce((n,c)=>n+c.unsupportedExecution.length,0),
      saleWithoutHandoffCount:cases.reduce((n,c)=>n+c.saleWithoutHandoff.length,0),
      quantityConsistencyIssues:cases.filter(c=>c.soldExceedsHarvest||c.lossExceedsHarvest).length,
      granularity:'ADDITIVE_V1 · HARVEST_RESULTS_LEDGER',capturedAt:new Date().toISOString(),
      temporalState:'SNAPSHOT_CAPTURED_FROM_HARVEST_LEDGER',
      integrity:'SNAPSHOT_HARVEST_ONLY · NO_LIVE_FALLBACK · NO_HARVEST_TO_SALE_INFERENCE · NO_SALE_TO_PAYMENT_INFERENCE · NO_PRICE_TO_REVENUE_REALIZATION_INFERENCE · NO_YIELD_TO_PROFITABILITY_INFERENCE · NO_RESULT_TO_CAUSALITY_INFERENCE · NO_FINANCIAL_EXECUTION · NO_EXTERNAL_CERTIFICATION'
    };
    return manifest;
  }

  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichHarvest(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);

  window.__SANA_REPORT_SNAPSHOT_HARVEST__=Object.freeze({enrichHarvest,sync,integrity:'ADDITIVE_V1 · HARVEST_RESULTS_LEDGER · SNAPSHOT_DEMO · NO_LIVE_FALLBACK · NO_EXTERNAL_WRITE'});
})();
