(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V143';
  const INTEGRITY='SNAPSHOT_SOURCE_EVIDENCE_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_SOURCE_CONTENT · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · TARGET_REFERENCE ≠ CONTENT_CORRECTNESS · EVIDENCE_REFERENCE ≠ EXTERNAL_VERIFICATION · REFERENCE ≠ PROCUREMENT_AUTHORITY ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL';
  const FORBIDDEN=['provider','name','externalId','detail','fingerprint','fingerprintType','reviewOutcome','reviewerRole','target'];

  function sanitizedRow(r){const t=r.reference?.target||null;return {sourceEventId:r.sourceEventId||'',sourceKind:r.sourceKind||'',kind:r.kind||'',useType:r.useType||'',refId:r.refId||'',status:r.reference?.status||'UNKNOWN',domain:r.reference?.domain||'',targetId:t?.id||'',targetScope:r.reference?.targetScope||''}}
  function snapshotCase(c){return {sourceId:c.id||'',scope:c.scope||'',referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:c.referenceVersion||'',linked:c.referenceCoverage?.linked??0,total:c.referenceCoverage?.total??0,percent:c.referenceCoverage?.percent??null,issues:c.referenceIssues??0,rows:(c.referenceRows||[]).map(sanitizedRow),contentState:'REFERENCE_STRUCTURE_ONLY',integrity:'REFERENCE_STATE ≠ SOURCE_TRUTH · TARGET_EXISTS ≠ SOURCE_CONTENT_CORRECT · EVIDENCE_REFERENCE ≠ CONTENT_AUTHENTICITY'}}
  function forbiddenPaths(value,path='sourceEvidenceReferences'){const out=[];if(!value||typeof value!=='object')return out;if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.includes(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out}
  function enrichSourceEvidenceReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    window.__SANA_REPORT_SNAPSHOT_SOURCE_EVIDENCE__?.enrichSourceEvidence?.(manifest);
    const api=window.__SANA_SOURCE_EVIDENCE_LEDGER__;if(!api?.cases||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const cases=api.cases().map(snapshotCase),captured=cases.filter(c=>c.referenceState==='CAPTURED_V143');
    const data={cases,capturedCount:captured.length,legacyCount:cases.length-captured.length,linked:captured.reduce((n,c)=>n+c.linked,0),expected:captured.reduce((n,c)=>n+c.total,0),issueCount:captured.reduce((n,c)=>n+c.issues,0),contentState:'REFERENCE_STRUCTURE_ONLY',granularity:'ADDITIVE_V144 · SOURCE_EVIDENCE_REFERENCE_PROVENANCE',capturedAt:new Date().toISOString(),integrity:INTEGRITY};
    data.contentLeakCount=forbiddenPaths(data).length;manifest.sourceEvidenceReferences=data;return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichSourceEvidenceReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_SOURCE_EVIDENCE_REFERENCES__=Object.freeze({enrichSourceEvidenceReferences,snapshotCase,forbiddenPaths,integrity:INTEGRITY});
})();
