(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V147';
  const SEMANTICS_VERSION='V149';
  const INTEGRITY='SNAPSHOT_COMMERCIAL_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_NONCANONICAL_VALUES · DECLARED_REFERENCE ≠ DERIVED_CROSS_DOMAIN_PROJECTION · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · REFERENCE ≠ BUYER_IDENTITY ≠ VERIFIED_CONTRACT ≠ ORDER_EXECUTION ≠ PAYMENT_EXECUTION ≠ GUARANTEED_REVENUE ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL';
  const FORBIDDEN=['buyerRef','buyerRefs','agreementRef','priceRef','invoiceRef','paymentState','receiptRef','evidenceRef','commercialRef','detail','reviewer','reviewerRole'];

  function sanitizedRow(r){
    const t=r.reference?.target||null;
    return {
      sourceEventId:r.sourceEventId||'',
      sourceKind:r.sourceKind||'',
      kind:r.kind||'',
      refId:r.refId||'',
      sourceDomain:r.sourceDomain||'',
      sourceKindExpected:r.sourceKindExpected||'',
      origin:r.origin||'LEGACY_ORIGIN_NOT_CAPTURED',
      temporalPolicy:r.temporalPolicy||'LEGACY_TEMPORAL_POLICY_NOT_CAPTURED',
      status:r.reference?.status||'UNKNOWN',
      domain:r.reference?.domain||'',
      targetId:t?.id||'',
      targetKind:t?.kind||'',
      targetLot:t?.lot||''
    };
  }

  function coverage(c,key){
    const v=c?.[key];
    if(v&&typeof v==='object')return {linked:Number(v.linked)||0,total:Number(v.total)||0,issues:Number(v.issues)||0,percent:v.percent??null};
    const origin=key==='declaredReferenceCoverage'?'DECLARED_COMMERCIAL_EVENT':'DERIVED_CROSS_DOMAIN_PROJECTION';
    const rows=(c?.referenceRows||[]).filter(r=>r.origin===origin);
    const linked=rows.filter(r=>r.reference?.status==='LINKED').length,total=rows.length;
    return {linked,total,issues:total-linked,percent:total?Math.round(linked/total*100):null};
  }

  function snapshotCase(c){
    const declared=coverage(c,'declaredReferenceCoverage');
    const derived=coverage(c,'derivedCrossDomainCoverage');
    return {
      caseId:c.id||'',
      lot:c.lot||'',
      referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',
      referenceVersion:c.referenceVersion||'',
      referenceSemanticsVersion:c.referenceSemanticsVersion||'LEGACY_SEMANTICS_NOT_CAPTURED',
      linked:c.referenceCoverage?.linked??0,
      total:c.referenceCoverage?.total??0,
      percent:c.referenceCoverage?.percent??null,
      issues:c.referenceIssues??0,
      declaredCanonicalLinked:declared.linked,
      declaredCanonicalTotal:declared.total,
      declaredCanonicalIssues:declared.issues,
      derivedCrossDomainLinked:derived.linked,
      derivedCrossDomainTotal:derived.total,
      derivedCrossDomainIssues:derived.issues,
      declaredNonCanonicalCount:c.declaredReferenceRows?.length??0,
      rows:(c.referenceRows||[]).map(sanitizedRow),
      contentState:'REFERENCE_STRUCTURE_ONLY',
      integrity:'DECLARED_REFERENCE ≠ DERIVED_CROSS_DOMAIN_PROJECTION · INTERNAL_TARGET_EXISTS ≠ COMMERCIAL_EXECUTION · DECLARED_NON_CANONICAL_REFERENCE ≠ VERIFIED_IDENTITY/CONTRACT/PRICE/INVOICE/PAYMENT/RECEIPT'
    };
  }

  function forbiddenPaths(value,path='commercialReferences'){
    const out=[];
    if(!value||typeof value!=='object')return out;
    if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}
    for(const [k,v] of Object.entries(value)){
      const p=`${path}.${k}`;
      if(FORBIDDEN.includes(k))out.push(p);
      out.push(...forbiddenPaths(v,p));
    }
    return out;
  }

  function enrichCommercialReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    window.__SANA_REPORT_SNAPSHOT_COMMERCIAL__?.enrichCommercial?.(manifest);
    const api=window.__SANA_COMMERCIAL_LEDGER__;
    if(!api?.cases||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const cases=api.cases().map(snapshotCase),captured=cases.filter(c=>c.referenceState==='CAPTURED_V147');
    const data={
      cases,
      sourceReferenceVersion:SOURCE_VERSION,
      referenceSemanticsVersion:api.referenceSemanticsVersion||'LEGACY_SEMANTICS_NOT_CAPTURED',
      capturedCount:captured.length,
      legacyCount:cases.length-captured.length,
      linked:captured.reduce((n,c)=>n+c.linked,0),
      expected:captured.reduce((n,c)=>n+c.total,0),
      issueCount:captured.reduce((n,c)=>n+c.issues,0),
      declaredCanonicalLinked:captured.reduce((n,c)=>n+c.declaredCanonicalLinked,0),
      declaredCanonicalExpected:captured.reduce((n,c)=>n+c.declaredCanonicalTotal,0),
      declaredCanonicalIssues:captured.reduce((n,c)=>n+c.declaredCanonicalIssues,0),
      derivedCrossDomainLinked:captured.reduce((n,c)=>n+c.derivedCrossDomainLinked,0),
      derivedCrossDomainExpected:captured.reduce((n,c)=>n+c.derivedCrossDomainTotal,0),
      derivedCrossDomainIssues:captured.reduce((n,c)=>n+c.derivedCrossDomainIssues,0),
      declaredNonCanonicalCount:captured.reduce((n,c)=>n+c.declaredNonCanonicalCount,0),
      contentState:'REFERENCE_STRUCTURE_ONLY',
      granularity:api.referenceSemanticsVersion===SEMANTICS_VERSION?'ADDITIVE_V149 · COMMERCIAL_REFERENCE_PROVENANCE_HARDENED':'ADDITIVE_V148 · COMMERCIAL_REFERENCE_PROVENANCE',
      capturedAt:new Date().toISOString(),
      integrity:INTEGRITY
    };
    data.contentLeakCount=forbiddenPaths(data).length;
    manifest.commercialReferences=data;
    return manifest;
  }

  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){
    const form=activeForm();if(!form)return;
    const field=form.querySelector('[name="manifest"]');if(!field?.value)return;
    try{const manifest=JSON.parse(field.value);enrichCommercialReferences(manifest);field.value=JSON.stringify(manifest)}catch{}
  }
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_COMMERCIAL_REFERENCES__=Object.freeze({enrichCommercialReferences,snapshotCase,forbiddenPaths,integrity:INTEGRITY});
})();
