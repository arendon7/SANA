(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V145';
  const INTEGRITY='SNAPSHOT_ECONOMIC_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_ACCOUNTING_PAYLOAD · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · REFERENCE ≠ ACCOUNTING_VERIFICATION ≠ PAYMENT_EXECUTION ≠ SALE_VERIFICATION ≠ CASH_RECEIPT_VERIFICATION ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL';
  const FORBIDDEN=['amount','currency','category','concept','detail','evidenceRef','invoiceRef','paymentState','saleRef','receiptRef','target','reviewer','reviewerRole'];

  function sanitizedRow(r){const t=r.reference?.target||null;return {sourceEventId:r.sourceEventId||'',sourceKind:r.sourceKind||'',kind:r.kind||'',refId:r.refId||'',sourceDomain:r.sourceDomain||'',status:r.reference?.status||'UNKNOWN',domain:r.reference?.domain||'',targetId:t?.id||t?.costRef||'',targetLot:t?.lot||''}}
  function snapshotCase(c){return {caseId:c.id||'',lot:c.lot||'',referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:c.referenceVersion||'',linked:c.referenceCoverage?.linked??0,total:c.referenceCoverage?.total??0,percent:c.referenceCoverage?.percent??null,issues:c.referenceIssues??0,declaredNonCanonicalCount:c.declaredReferenceRows?.length??0,rows:(c.referenceRows||[]).map(sanitizedRow),contentState:'REFERENCE_STRUCTURE_ONLY',integrity:'REFERENCE_STATE ≠ ACCOUNTING_FACT · INTERNAL_TARGET_EXISTS ≠ EXPENSE_VERIFIED · DECLARED_NON_CANONICAL_REFERENCE ≠ VERIFIED_DOCUMENT'}}
  function forbiddenPaths(value,path='economicReferences'){const out=[];if(!value||typeof value!=='object')return out;if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.includes(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out}
  function enrichEconomicReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    window.__SANA_REPORT_SNAPSHOT_ECONOMIC_RECONCILIATION__?.enrichEconomicReconciliation?.(manifest);
    const api=window.__SANA_ECONOMIC_RECONCILIATION__;if(!api?.cases||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const cases=api.cases().map(snapshotCase),captured=cases.filter(c=>c.referenceState==='CAPTURED_V145');
    const data={cases,capturedCount:captured.length,legacyCount:cases.length-captured.length,linked:captured.reduce((n,c)=>n+c.linked,0),expected:captured.reduce((n,c)=>n+c.total,0),issueCount:captured.reduce((n,c)=>n+c.issues,0),declaredNonCanonicalCount:captured.reduce((n,c)=>n+c.declaredNonCanonicalCount,0),contentState:'REFERENCE_STRUCTURE_ONLY',granularity:'ADDITIVE_V146 · ECONOMIC_REFERENCE_PROVENANCE',capturedAt:new Date().toISOString(),integrity:INTEGRITY};
    data.contentLeakCount=forbiddenPaths(data).length;manifest.economicReferences=data;return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichEconomicReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_ECONOMIC_REFERENCES__=Object.freeze({enrichEconomicReferences,snapshotCase,forbiddenPaths,integrity:INTEGRITY});
})();
