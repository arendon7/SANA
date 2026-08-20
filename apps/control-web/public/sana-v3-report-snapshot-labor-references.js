(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V141';
  const INTEGRITY='SNAPSHOT_LABOR_REFERENCES_ONLY · PRIVACY_MINIMIZED · NO_IDENTITY_FIELDS · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · REFERENCE ≠ WORK_TRUTH ≠ QUALITY ≠ HR_SCORE ≠ PAYROLL_STATUS ≠ PAYMENT_VERIFICATION';
  const FORBIDDEN=['personRef','personLabel','owner','reviewer'];

  function sanitizedRow(r){const t=r.reference?.target||null;return {sourceEventId:r.sourceEventId||'',sourceKind:r.sourceKind||'',kind:r.kind||'',refId:r.refId||'',status:r.reference?.status||'UNKNOWN',domain:r.reference?.domain||'',targetId:t?.id||'',targetKind:t?.kind||t?.eventKind||'',targetLot:t?.lot||''}}
  function snapshotCase(c){return {caseId:c.id||'',role:c.role||'',lot:c.lot||'',activityId:c.activityId||'',referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:c.referenceVersion||'',linked:c.referenceCoverage?.linked??0,total:c.referenceCoverage?.total??0,percent:c.referenceCoverage?.percent??null,issues:c.referenceIssues??0,rows:(c.referenceRows||[]).map(sanitizedRow),declaredNonCanonicalReferenceCount:c.declaredNonCanonicalReferences?.length??0,privacyState:'IDENTITY_REDACTED',integrity:'REFERENCE_STATE ≠ LABOR_TRUTH · SUPPORT_REFERENCE ≠ QUALITY · COST_BASIS_REFERENCE ≠ COST_VALIDITY · DECLARED_NON_CANONICAL_REFERENCE ≠ VERIFIED_REFERENCE'}}
  function forbiddenPaths(value,path='laborReferences'){const out=[];if(!value||typeof value!=='object')return out;if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.includes(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out}
  function enrichLaborReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    window.__SANA_REPORT_SNAPSHOT_LABOR__?.enrichLabor?.(manifest);
    const api=window.__SANA_LABOR_LEDGER__;if(!api?.cases||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const cases=api.cases().map(snapshotCase),captured=cases.filter(c=>c.referenceState==='CAPTURED_V141');
    const data={cases,capturedCount:captured.length,legacyCount:cases.length-captured.length,linked:captured.reduce((n,c)=>n+c.linked,0),expected:captured.reduce((n,c)=>n+c.total,0),issueCount:captured.reduce((n,c)=>n+c.issues,0),declaredNonCanonicalReferenceCount:captured.reduce((n,c)=>n+c.declaredNonCanonicalReferenceCount,0),privacyState:'IDENTITY_REDACTED',granularity:'ADDITIVE_V142 · LABOR_REFERENCE_PROVENANCE',capturedAt:new Date().toISOString(),integrity:INTEGRITY};
    data.privacyLeakCount=forbiddenPaths(data).length;manifest.laborReferences=data;return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichLaborReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',event=>{if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',event=>{if(event.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',event=>{if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_LABOR_REFERENCES__=Object.freeze({enrichLaborReferences,snapshotCase,forbiddenPaths,integrity:INTEGRITY});
})();
