(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V152';
  const SEMANTICS_VERSION='V152';
  const VALUE_POLICY='COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED';
  const INTEGRITY='SNAPSHOT_CAPTURE_SYNC_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_DATA_TRUST_PAYLOAD · NO_NONCANONICAL_VALUES · NO_RETROFILL · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · RECORD_REFERENCE ≠ SOURCE_AUTHENTICITY · ACK_REFERENCE_COHERENCE ≠ SERVER_VERIFICATION · CANDIDATE_REFERENCE ≠ SOURCE_VERIFICATION · REFERENCE_CHANGE ≠ SYNC/SOURCE_CHANGE · REFERENCE ≠ DATA_COMPLETENESS ≠ AGRONOMIC_DECISION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';
  const FORBIDDEN=['value','measurement','sourceRef','candidateRefs','candidates','evidenceRef','detail','owner','reviewer','reviewerRole','ackRef','resolution','payload','raw','content'];

  function sanitizedRow(r){
    const x=r?.reference||{};
    return {
      sourceEventId:r?.sourceEventId||'',
      sourceKind:r?.sourceKind||'',
      kind:r?.kind||'',
      refId:r?.refId||'',
      origin:r?.origin||'DECLARED_CAPTURE_SYNC_EVENT',
      temporalPolicy:r?.temporalPolicy||'LEGACY_TEMPORAL_POLICY_NOT_CAPTURED',
      status:x.status||'UNKNOWN',
      domain:x.domain||'',
      targetId:x.targetId||'',
      targetLot:x.targetLot||'',
      targetClass:x.targetClass||'',
      targetAckState:x.targetAckState||'',
      targetConflictState:x.targetConflictState||'',
      targetCandidateId:x.targetCandidateId||''
    };
  }
  function declaredCounts(rows){const out={};for(const r of rows||[]){const k=r?.kind||'DECLARED_NON_CANONICAL_REFERENCE';out[k]=(out[k]||0)+1}return out}
  function snapshotCase(c){
    return {
      caseId:c.id||'',
      lot:c.lot||'',
      recordType:c.recordType||'',
      referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',
      referenceVersion:c.referenceVersion||'',
      referenceSemanticsVersion:c.referenceSemanticsVersion||SEMANTICS_VERSION,
      linked:c.referenceCoverage?.linked??0,
      total:c.referenceCoverage?.total??0,
      percent:c.referenceCoverage?.percent??null,
      issues:c.referenceIssues??0,
      declaredNonCanonicalCount:c.declaredReferenceRows?.length??0,
      declaredReferenceCounts:declaredCounts(c.declaredReferenceRows),
      declaredReferenceValuePolicy:c.declaredReferenceValuePolicy||VALUE_POLICY,
      rows:(c.referenceRows||[]).map(sanitizedRow),
      contentState:'REFERENCE_STRUCTURE_ONLY',
      integrity:'CAPTURE_SYNC_REFERENCE ≠ VERIFIED_SYNC/SOURCE · TARGET PAYLOAD NOT COPIED · DECLARED NONCANONICAL VALUE NOT EXPOSED'
    };
  }
  function forbiddenPaths(value,path='captureSyncReferences'){
    const out=[];if(!value||typeof value!=='object')return out;
    if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}
    for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.includes(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out;
  }
  function enrichCaptureSyncReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    window.__SANA_REPORT_SNAPSHOT_CAPTURE_SYNC__?.enrichCaptureSync?.(manifest);
    const api=window.__SANA_CAPTURE_SYNC_LEDGER__;
    if(!api?.cases||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const cases=api.cases().map(snapshotCase),captured=cases.filter(c=>c.referenceState==='CAPTURED_V152');
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
      declaredReferenceValuePolicy:VALUE_POLICY,
      contentState:'REFERENCE_STRUCTURE_ONLY',
      granularity:'ADDITIVE_V153 · CAPTURE_SYNC_REFERENCE_PROVENANCE',
      capturedAt:new Date().toISOString(),
      integrity:INTEGRITY
    };
    data.contentLeakCount=forbiddenPaths(data).length;
    manifest.captureSyncReferences=data;
    return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichCaptureSyncReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_CAPTURE_SYNC_REFERENCES__=Object.freeze({enrichCaptureSyncReferences,snapshotCase,sanitizedRow,declaredCounts,forbiddenPaths,integrity:INTEGRITY});
})();
