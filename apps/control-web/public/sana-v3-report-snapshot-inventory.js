(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

  function eventRow(e){return {id:e.id||'',kind:e.kind||'',observedAt:e.observedAt||'',quantity:e.quantity??null,unit:e.unit||'',lot:e.lot||'',location:e.location||'',activityId:e.activityId||'',nutritionEventRef:e.nutritionEventRef||'',forecastRef:e.forecastRef||'',costRef:e.costRef||'',supplierRef:e.supplierRef||'',evidenceRef:e.evidenceRef||'',supports:[...(e.supports||[])],purpose:e.purpose||'',reason:e.reason||'',requestState:e.requestState||'',owner:e.owner||'',provenance:e.provenance||''}}
  function snapshotCase(c){
    const latest=c.latestCount?eventRow(c.latestCount):null;
    const rows=(c.events||[]).map(eventRow);
    const postCount=latest?rows.filter(e=>String(e.observedAt||'')>String(latest.observedAt||'')&&['RECEIPT','CONSUMPTION','ADJUSTMENT'].includes(e.kind)):[];
    const unitConflicts=latest?postCount.filter(e=>e.unit&&e.unit!==latest.unit).map(e=>e.id):[];
    return {caseId:c.id||'',itemId:c.itemId||'',itemName:c.item?.name||c.itemId||'',group:c.item?.group||'',latestPhysicalCount:latest,rollForward:c.rollForward??null,rollForwardUnit:c.rollForwardUnit||'',reservedComparable:c.reservedComparable??0,reservationCount:c.reservations?.length??0,consumptionCount:c.consumptions?.length??0,purchaseRequestCount:c.requests?.length??0,receiptCount:c.receipts?.length??0,adjustmentCount:c.adjustments?.length??0,evidenceCount:c.evidence?.length??0,unsupported:[...(c.semantics?.unsupported||[])],unitConflicts,requestWithoutForecast:[...(c.semantics?.requestWithoutForecast||[])],receiptWithoutSupplier:[...(c.semantics?.receiptWithoutSupplier||[])],explicitCostLinks:c.semantics?.explicitCostLinks??0,events:rows,negativeRollForward:Number.isFinite(c.rollForward)&&c.rollForward<0,overReserved:Number.isFinite(c.rollForward)&&Number(c.reservedComparable||0)>c.rollForward,temporalState:'SNAPSHOT_CAPTURED_FROM_INVENTORY_LEDGER',integrity:'PHYSICAL_COUNT ≠ THEORETICAL_STOCK · ROLL_FORWARD_BALANCE ≠ PHYSICAL_COUNT · RESERVATION ≠ CONSUMPTION · PURCHASE_REQUEST ≠ PURCHASE_ORDER · PURCHASE_REQUEST ≠ RECEIPT · RECEIPT ≠ INVOICE ≠ PAYMENT · CONSUMPTION ≠ AGRONOMIC_APPLICATION'};
  }
  function legacyRow(e){return {id:e.id||'',itemId:e.itemId||'',movement:e.movement||'',quantity:e.quantity??null,unit:e.unit||'',lot:e.lot||'',activityId:e.activityId||'',evidenceRef:e.evidenceRef||'',observedAt:e.observedAt||'',provenance:e.provenance||'LEGACY_EXPLICIT_MOVEMENT',temporalState:'SNAPSHOT_CAPTURED_INVENTORY_LEGACY'}}
  function enrichInventory(manifest){
    const api=window.__SANA_INVENTORY_LEDGER__;
    if(!manifest||manifest.schema!==SCHEMA||!api?.cases)return manifest;
    const items=api.cases().map(snapshotCase);const legacy=(api.legacy?.()||[]).map(legacyRow);
    manifest.inventory={items,legacy,itemCount:items.length,physicalCountItems:items.filter(x=>x.latestPhysicalCount).length,reservationCount:items.reduce((n,x)=>n+x.reservationCount,0),consumptionCount:items.reduce((n,x)=>n+x.consumptionCount,0),purchaseRequestCount:items.reduce((n,x)=>n+x.purchaseRequestCount,0),receiptCount:items.reduce((n,x)=>n+x.receiptCount,0),unsupportedCount:items.reduce((n,x)=>n+x.unsupported.length,0),unitConflictCount:items.reduce((n,x)=>n+x.unitConflicts.length,0),negativeRollForwardCount:items.filter(x=>x.negativeRollForward).length,overReservedCount:items.filter(x=>x.overReserved).length,legacyCount:legacy.length,granularity:'ADDITIVE_V1 · INVENTORY_LEDGER',capturedAt:new Date().toISOString(),temporalState:'SNAPSHOT_CAPTURED_FROM_INVENTORY_LEDGER',integrity:'SNAPSHOT_INVENTORY_ONLY · NO_LIVE_FALLBACK · NO_COUNT_TO_CERTIFIED_STOCK_INFERENCE · NO_RESERVATION_TO_CONSUMPTION_INFERENCE · NO_REQUEST_TO_ORDER_OR_RECEIPT_INFERENCE · NO_RECEIPT_TO_INVOICE_OR_PAYMENT_INFERENCE · NO_CONSUMPTION_TO_APPLICATION_INFERENCE · NO_AUTOMATIC_PROCUREMENT · NO_FINANCIAL_EXECUTION'};
    return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichInventory(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_INVENTORY__=Object.freeze({enrichInventory,sync,integrity:'ADDITIVE_V1 · INVENTORY_LEDGER · SNAPSHOT_DEMO · NO_LIVE_FALLBACK · NO_EXTERNAL_WRITE'});
})();
