(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V158';
  const VALUE_POLICY='COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED';
  const INTEGRITY='SNAPSHOT_IMPACT_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_RICH_IMPACT_PAYLOAD · NO_NONCANONICAL_VALUES · NO_RETROFILL · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · SOURCE_REGISTRY_REFERENCE ≠ SOURCE_CONTENT_CORRECTNESS · REFERENCE_CHANGE ≠ IMPACT_CHANGE · REFERENCE ≠ IMPACT_VERIFICATION ≠ CERTIFICATION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';
  const FORBIDDEN=new Set(['name','layer','baseline','current','unit','calculation','estimated','estimationType','quality','qualityScore','verification','method','source','frequency','boundaryUnit','boundaryScope','boundaryPeriod','value','amount','detail','summary','payload','content','reviewer','provenance','navigation']);

  function sanitizedRow(r){const ref=r?.reference||{},t=ref?.target||{};return {sourceIndicatorId:r?.sourceIndicatorId||'',kind:r?.kind||'',refId:r?.refId||'',status:ref.status||'UNKNOWN',domain:ref.domain||'',targetId:t.id||'',targetScope:t.scope||'',targetVersion:t.version||'',targetCut:t.cut||'',targetState:t.state||'REFERENCE_ONLY'}}
  function declaredCounts(rows){const out={};for(const r of rows||[]){const k=r?.kind||'DECLARED_NON_CANONICAL_REFERENCE';out[k]=(out[k]||0)+1}return out}
  function snapshotIndicator(r){return {indicatorId:r.id||'',referenceState:r.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:r.referenceVersion||'',linked:r.referenceCoverage?.linked??0,total:r.referenceCoverage?.total??0,percent:r.referenceCoverage?.percent??null,issues:r.referenceIssues??0,declaredNonCanonicalCount:r.declaredReferenceRows?.length??0,declaredReferenceCounts:declaredCounts(r.declaredReferenceRows),declaredReferenceValuePolicy:VALUE_POLICY,rows:(r.referenceRows||[]).map(sanitizedRow),contentState:'REFERENCE_STRUCTURE_ONLY',integrity:'IMPACT_REFERENCE_STRUCTURE_ONLY · DECLARED_VALUES_NOT_EXPOSED · SOURCE_REGISTRY_REFERENCE ≠ IMPACT_VERIFICATION'}}
  function forbiddenPaths(value,path='impactReferences'){const out=[];if(!value||typeof value!=='object')return out;if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.has(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out}
  function enrichImpactReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    const api=window.__SANA_IMPACT_LEDGER__;if(!api?.rows||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const indicators=api.rows().map(snapshotIndicator),captured=indicators.filter(r=>r.referenceState==='CAPTURED'),summary=api.summary?.()||{};
    const data={indicators,sourceReferenceVersion:SOURCE_VERSION,capturedCount:captured.length,legacyCount:indicators.length-captured.length,linked:captured.reduce((n,r)=>n+r.linked,0),expected:captured.reduce((n,r)=>n+r.total,0),issueCount:captured.reduce((n,r)=>n+r.issues,0),declaredNonCanonicalCount:captured.reduce((n,r)=>n+r.declaredNonCanonicalCount,0),declaredReferenceValuePolicy:VALUE_POLICY,verificationCreatedByReferences:Number(summary.verificationCreatedByReferences)||0,certificationCreatedByReferences:Number(summary.certificationCreatedByReferences)||0,contentState:'REFERENCE_STRUCTURE_ONLY',granularity:'ADDITIVE_V159 · IMPACT_REFERENCE_PROVENANCE',capturedAt:new Date().toISOString(),integrity:INTEGRITY};
    data.contentLeakCount=forbiddenPaths(data).length;manifest.impactReferences=data;return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichImpactReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_IMPACT_REFERENCES__=Object.freeze({enrichImpactReferences,snapshotIndicator,sanitizedRow,declaredCounts,forbiddenPaths,integrity:INTEGRITY});
})();
