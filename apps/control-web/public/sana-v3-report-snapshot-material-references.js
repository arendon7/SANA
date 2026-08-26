(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const SOURCE_VERSION='V156';
  const VALUE_POLICY='COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED';
  const INTEGRITY='SNAPSHOT_MATERIAL_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_NONCANONICAL_VALUES · NO_RICH_MATERIAL_PAYLOAD · NO_RETROFILL · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · MATERIAL_REFERENCE ≠ MATERIAL_IDENTITY_VERIFICATION · REFERENCE_CHANGE ≠ MATERIAL/GENETIC/PHYTOSANITARY_CHANGE · REFERENCE ≠ ICA_CERTIFICATION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';
  const FORBIDDEN=new Set(['sourceRef','evidenceRef','responsible','owner','reviewer','origin','species','materialType','identityBasis','quantity','unit','amount','costAmount','declaredLoss','latestSurvivalRate','evidenceCoverage','detail','summary','payload','content','observedAt']);

  function sanitizedRow(r){const s=r?.source||{},t=r?.target||{};return {sourceId:s.id||'',sourceType:s.type||'',sourceMaterialId:s.materialId||r?.sourceMaterialId||'',kind:r?.kind||'',targetId:r?.targetId||'',status:r?.status||'UNKNOWN',targetMaterialId:t.materialId||r?.targetMaterialId||'',targetLot:t.lot||'',orphanSource:Boolean(r?.orphanSource)}}
  function declaredCounts(rows){const out={};for(const r of rows||[]){const k=r?.kind||'DECLARED_NON_CANONICAL_REFERENCE';out[k]=(out[k]||0)+1}return out}
  function snapshotChain(c){return {materialId:c.identity?.id||c.material?.id||'',targetLot:c.target||c.identity?.targetLot||'',referenceState:c.referenceState||'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:c.referenceVersion||'',linked:c.referenceCoverage?.linked??0,total:c.referenceCoverage?.total??0,percent:c.referenceCoverage?.percent??null,issues:c.referenceIssues??0,declaredNonCanonicalCount:c.declaredReferenceRows?.length??0,declaredReferenceCounts:declaredCounts(c.declaredReferenceRows),declaredReferenceValuePolicy:VALUE_POLICY,rows:(c.referenceRows||[]).map(sanitizedRow),contentState:'REFERENCE_STRUCTURE_ONLY',integrity:'MATERIAL_REFERENCE_STRUCTURE_ONLY · SOURCE/EVIDENCE_VALUE_NOT_EXPOSED · REFERENCE ≠ MATERIAL_IDENTITY_VERIFICATION'}}
  function forbiddenPaths(value,path='materialReferences'){const out=[];if(!value||typeof value!=='object')return out;if(Array.isArray(value)){value.forEach((v,i)=>out.push(...forbiddenPaths(v,`${path}[${i}]`)));return out}for(const [k,v] of Object.entries(value)){const p=`${path}.${k}`;if(FORBIDDEN.has(k))out.push(p);out.push(...forbiddenPaths(v,p))}return out}
  function enrichMaterialReferences(manifest){
    if(!manifest||manifest.schema!==SCHEMA)return manifest;
    const api=window.__SANA_MATERIAL_CHAIN__;if(!api?.all||api.referenceVersion!==SOURCE_VERSION)return manifest;
    const chains=api.all().map(snapshotChain),captured=chains.filter(c=>c.referenceState==='CAPTURED');
    const orphanRows=(api.orphanReferenceRows?.()||[]).map(sanitizedRow),summary=api.summary?.()||{};
    const data={chains,orphanRows,sourceReferenceVersion:SOURCE_VERSION,capturedCount:captured.length,legacyCount:chains.length-captured.length,orphanSourceCount:Number(summary.orphanSourceCount)||0,linked:captured.reduce((n,c)=>n+c.linked,0)+orphanRows.filter(r=>r.status==='LINKED').length,expected:captured.reduce((n,c)=>n+c.total,0)+orphanRows.length,issueCount:captured.reduce((n,c)=>n+c.issues,0)+orphanRows.filter(r=>r.status!=='LINKED').length,declaredNonCanonicalCount:Number(summary.declaredNonCanonical)||0,declaredReferenceValuePolicy:VALUE_POLICY,contentState:'REFERENCE_STRUCTURE_ONLY',granularity:'ADDITIVE_V157 · MATERIAL_REFERENCE_PROVENANCE',capturedAt:new Date().toISOString(),integrity:INTEGRITY};
    data.contentLeakCount=forbiddenPaths(data).length;manifest.materialReferences=data;return manifest;
  }
  function activeForm(){if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;return document.getElementById('modal-form')}
  function sync(){const form=activeForm();if(!form)return;const field=form.querySelector('[name="manifest"]');if(!field?.value)return;try{const manifest=JSON.parse(field.value);enrichMaterialReferences(manifest);field.value=JSON.stringify(manifest)}catch{}}
  document.addEventListener('change',e=>{if(e.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('input',e=>{if(e.target.closest('#modal-form [name="reviewer"]'))queueMicrotask(sync)});
  document.addEventListener('click',e=>{if(e.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')queueMicrotask(sync)},true);
  window.__SANA_REPORT_SNAPSHOT_MATERIAL_REFERENCES__=Object.freeze({enrichMaterialReferences,snapshotChain,sanitizedRow,declaredCounts,forbiddenPaths,integrity:INTEGRITY});
})();
