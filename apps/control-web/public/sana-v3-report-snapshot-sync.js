(() => {
  'use strict';

  function activeForm(){
    if(typeof modalAction==='undefined'||modalAction!=='report-snapshot')return null;
    return document.getElementById('modal-form');
  }
  function enrichEconomics(manifest){
    const econ=window.__SANA_ECONOMICS__;
    if(!manifest||!econ?.costs||!Array.isArray(manifest.economics))return manifest;
    const costs=econ.costs();
    manifest.economics=manifest.economics.map(row=>{
      const lotCosts=costs.filter(c=>c.lot===row.lotId);
      const explicit=lotCosts.filter(c=>c.planId&&c.linkIntegrity==='OK');
      const supported=explicit.filter(c=>c.supported);
      const mismatched=lotCosts.filter(c=>c.planId&&c.linkIntegrity!=='OK');
      const unallocated=lotCosts.filter(c=>!c.planId);
      return {
        ...row,
        explicitCostCount:explicit.length,
        supportedExplicitCount:supported.length,
        supportCoverage:explicit.length?Math.round(supported.length/explicit.length*100):0,
        mismatchCount:mismatched.length,
        unallocatedCount:unallocated.length,
        provenanceGranularity:'ADDITIVE_V1 · LOCAL_ONLY_COST_LINKS'
      };
    });
    return manifest;
  }
  function syncManifest(){
    const form=activeForm();
    const api=window.__SANA_DUE_DILIGENCE_SNAPSHOT__;
    if(!form||!api?.currentManifest||!api?.schema)return;
    const reportType=form.querySelector('[name="reportType"]')?.value||'RPT-DD';
    const manifest=enrichEconomics(api.currentManifest(reportType));
    if(!manifest||manifest.schema!==api.schema)return;
    manifest.cutoff=form.querySelector('[name="cutoff"]')?.value||'';
    manifest.reviewer=form.querySelector('[name="reviewer"]')?.value||'';
    manifest.snapshotContext='FORM_BOUND_DEMO';
    manifest.formBoundAt=new Date().toISOString();
    const manifestField=form.querySelector('[name="manifest"]');
    if(manifestField)manifestField.value=JSON.stringify(manifest);
    const sourcesField=form.querySelector('[name="sources"]');
    if(sourcesField)sourcesField.value=(manifest.contracts||[]).map(c=>`${c.label}: ${c.available?'AVAILABLE':'MISSING'} · ${c.state}`).join(' | ');
  }

  document.addEventListener('change',event=>{
    if(event.target.closest('#modal-form [name="reportType"],#modal-form [name="cutoff"],#modal-form [name="reviewer"]'))syncManifest();
  });
  document.addEventListener('input',event=>{
    if(event.target.closest('#modal-form [name="reviewer"]'))syncManifest();
  });
  document.addEventListener('click',event=>{
    if(event.target.closest('#modal-save')&&typeof modalAction!=='undefined'&&modalAction==='report-snapshot')syncManifest();
  },true);

  window.__SANA_REPORT_SNAPSHOT_SYNC__=Object.freeze({syncManifest,enrichEconomics,integrity:'FORM_CONTEXT_BOUND · ADDITIVE_V1_PROVENANCE · SNAPSHOT_DEMO · NO_EXTERNAL_WRITE'});
})();
