(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V147';
  const INTEGRITY='SNAPSHOT_COMMERCIAL_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_NONCANONICAL_VALUES · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · REFERENCE ≠ BUYER_IDENTITY ≠ VERIFIED_CONTRACT ≠ ORDER_EXECUTION ≠ PAYMENT_EXECUTION ≠ GUARANTEED_REVENUE ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL';
  const FORBIDDEN=['buyerRef','buyerRefs','agreementRef','priceRef','invoiceRef','paymentState','receiptRef','evidenceRef','commercialRef','detail','reviewer','reviewerRole'];
  function sanitizedRow(r){const t=r.reference?.target||null;return {sourceEventId:r.sourceEventId||'',sourceKind:r.sourceKind||'',kind:r.kind||'',refId:r.refId||'',sourceDomain:r.sourceDomain||'',sourceKindExpected:r.sourceKindExpected||'',status:r.reference?.status||'UNKNOWN',domain:r.reference?.domain||'',targetId:t?.id||'',targetKind:t?.kind||'',targetLot:t?.lot||''}}
  function snapshotCase(c){return {caseId:c.id||'',lot:c.lot||'',referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:c.referenceVersion||'',linked:c.referenceCoverage?.linked??0,total:c.referenceCoverage?.total??0,percent:c.referenceCoverage?.percent??null,issues:c.referenceIssues??0,declaredNonCanonicalCount:c.declaredReferenceRows?.length??0,rows:(c.referenceRows||[]).map(sanitizedRow),contentState:'REFERENCE_STRUCTURE_ONLY',integrity:'INTERNAL_TARGET_EXISTS ≠ COMMERCIAL_EXECUTION · DECLARED_NON_CANONICAL_REFERENCE ≠ VERIFIED_IDENTITY/CONTRACT/PRICE/INVOICE/PAYMENT/RECEIPT'}}
  function forbiddenPaths(value,path='commercialReferences'){const out=[];if(!value||typeof value!=='object')return out;if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.includes(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out}
  function enrichCommercialReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    window.__SANA_REPORT_SNAPSHOT_COMMERCIAL__?.enrichCommercial?.(manifest);
    const api=window.__SANA_COMMERCIAL_LEDGER__;if(!api?.cases||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const cases=api.cases().map(snapshotCase),captured=cases.filter(c=>c.referenceState==='CAPTURED_V147');
    const data={cases,capturedCount:captured.length,legacyCount:cases.length-captured.length,linked:captured.reduce((n,c)=>n+c.linked,0),expected:captured.reduce((n,c)=>n+c.total,0),issueCount:captured.reduce((n,c)=>n+c.issues,0),declaredNonCanonicalCount:captured.reduce((n,c)=>n+c.declaredNonCanonicalCount,0),contentState:'REFERENCE_STRUCTURE_ONLY',granularity:'ADDITIVE_V148 · COMMERCIAL_REFERENCE_PROVENANCE',capturedAt:new Date().toISOString(),integrity:INTEGRITY};
    data.contentLeakCount=forbiddenPaths(data).length;manifest.commercialReferences=data;return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichCommercialReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_COMMERCIAL_REFERENCES__=Object.freeze({enrichCommercialReferences,snapshotCase,forbiddenPaths,integrity:INTEGRITY});
})();
