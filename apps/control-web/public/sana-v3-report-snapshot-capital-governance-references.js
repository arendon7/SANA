(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V150';
  const SEMANTICS_VERSION='V150';
  const INTEGRITY='SNAPSHOT_CAPITAL_GOVERNANCE_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_NONCANONICAL_VALUES · NO_RETROFILL · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · CAPITAL_SUPPORT_REFERENCE ≠ VERIFIED_FACT · REFERENCE_CHANGE ≠ CAPITAL_FACT_CHANGE · REFERENCE ≠ VERIFIED_IDENTITY/APPROVAL/TERM_SHEET/COMMITMENT/CLOSING/FUNDING · DOCUMENT_COMPLETENESS ≠ ELIGIBILITY ≠ CREDIT_SCORE · NO_OFFER/SOLICITATION/BROKERAGE/CUSTODY/INVESTMENT_RECOMMENDATION';
  const FORBIDDEN=['counterpartyRef','requestRef','termSheetRef','decisionRef','commitmentRef','closingRef','fundingRef','evidenceRef','amount','currency','horizon','useOfFunds','interestState','instrumentType','requestState','termSheetState','decisionState','commitmentState','closingState','fundingState','detail','reviewer','reviewerRole'];

  function referenceTarget(r){return r?.reference?.target||null}
  function sanitizedRow(r){
    const t=referenceTarget(r);
    return {
      sourceEventId:r?.sourceEventId||'',
      sourceKind:r?.sourceKind||'',
      kind:r?.kind||'',
      refId:r?.refId||'',
      origin:r?.origin||'DECLARED_CAPITAL_EVENT',
      temporalPolicy:r?.temporalPolicy||'LEGACY_TEMPORAL_POLICY_NOT_CAPTURED',
      status:r?.reference?.status||'UNKNOWN',
      domain:r?.reference?.domain||'',
      targetId:r?.reference?.targetId||t?.id||'',
      targetKind:r?.reference?.targetKind||t?.kind||'',
      targetLot:r?.reference?.targetLot||t?.lot||''
    };
  }
  function declaredCounts(rows){const out={};for(const r of rows||[]){const k=r?.kind||'DECLARED_NON_CANONICAL_REFERENCE';out[k]=(out[k]||0)+1}return out}
  function snapshotCase(c){
    return {
      caseId:c.id||'',
      lot:c.lot||'',
      referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',
      referenceVersion:c.referenceVersion||'',
      referenceSemanticsVersion:c.referenceSemanticsVersion||SEMANTICS_VERSION,
      linked:c.referenceCoverage?.linked??0,
      total:c.referenceCoverage?.total??0,
      percent:c.referenceCoverage?.percent??null,
      issues:c.referenceIssues??0,
      declaredNonCanonicalCount:c.declaredReferenceRows?.length??0,
      declaredReferenceCounts:declaredCounts(c.declaredReferenceRows),
      declaredReferenceValuePolicy:c.declaredReferenceValuePolicy||'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',
      rows:(c.referenceRows||[]).map(sanitizedRow),
      contentState:'REFERENCE_STRUCTURE_ONLY',
      integrity:'CAPITAL_SUPPORT_REFERENCE ≠ VERIFIED_FACT · DECLARED_NON_CANONICAL_REFERENCE ≠ VERIFIED_IDENTITY/APPROVAL/TERM_SHEET/COMMITMENT/CLOSING/FUNDING · VALUE_NOT_EXPOSED'
    };
  }
  function forbiddenPaths(value,path='capitalGovernanceReferences'){
    const out=[];if(!value||typeof value!=='object')return out;
    if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}
    for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.includes(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out;
  }
  function enrichCapitalGovernanceReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    window.__SANA_REPORT_SNAPSHOT_CAPITAL_GOVERNANCE__?.enrichCapitalGovernance?.(manifest);
    const api=window.__SANA_CAPITAL_GOVERNANCE__;
    if(!api?.cases||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const cases=api.cases().map(snapshotCase),captured=cases.filter(c=>c.referenceState==='CAPTURED_V150');
    const data={
      cases,
      sourceReferenceVersion:SOURCE_VERSION,
      referenceSemanticsVersion:api.referenceSemanticsVersion||SEMANTICS_VERSION,
      capturedCount:captured.length,
      legacyCount:cases.length-captured.length,
      linked:captured.reduce((n,c)=>n+c.linked,0),
      expected:captured.reduce((n,c)=>n+c.total,0),
      issueCount:captured.reduce((n,c)=>n+c.issues,0),
      declaredNonCanonicalCount:captured.reduce((n,c)=>n+c.declaredNonCanonicalCount,0),
      declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',
      contentState:'REFERENCE_STRUCTURE_ONLY',
      granularity:'ADDITIVE_V151 · CAPITAL_GOVERNANCE_REFERENCE_PROVENANCE',
      capturedAt:new Date().toISOString(),
      integrity:INTEGRITY
    };
    data.contentLeakCount=forbiddenPaths(data).length;
    manifest.capitalGovernanceReferences=data;
    return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichCapitalGovernanceReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_CAPITAL_GOVERNANCE_REFERENCES__=Object.freeze({enrichCapitalGovernanceReferences,snapshotCase,sanitizedRow,declaredCounts,forbiddenPaths,integrity:INTEGRITY});
})();
