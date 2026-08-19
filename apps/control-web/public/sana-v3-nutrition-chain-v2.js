(() => {
  'use strict';

  const PROJECTION='SANA_NUTRITION_CHAIN_V2';
  const STAGES=Object.freeze(['PROGRAM','PREFLIGHT','DECISION','APPLICATION','EVIDENCE','RESPONSE']);
  const PREDECESSOR_KIND=Object.freeze({
    PREFLIGHT:'PROGRAM',
    DECISION:'PREFLIGHT',
    APPLICATION:'DECISION',
    EVIDENCE:'APPLICATION',
    RESPONSE:'EVIDENCE'
  });

  function eventReference(event,events=[]){
    const expectedKind=PREDECESSOR_KIND[event?.eventKind]||null;
    if(!expectedKind)return {required:false,status:'NOT_REQUIRED',expectedKind:null,target:null};
    if(event?.projectionVersion!=='V2'&&!event?.basisEventId)return {required:false,status:'LEGACY_NOT_CAPTURED',expectedKind,target:null};
    if(!event?.basisEventId)return {required:true,status:'MISSING_REFERENCE',expectedKind,target:null};
    const target=events.find(e=>e?.id===event.basisEventId)||null;
    if(!target)return {required:true,status:'MISSING_TARGET',expectedKind,target:null};
    if(target.caseId!==event.caseId)return {required:true,status:'CROSS_CASE_REFERENCE',expectedKind,target};
    if(target.eventKind!==expectedKind)return {required:true,status:'KIND_MISMATCH',expectedKind,target};
    if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_REFERENCE',expectedKind,target};
    return {required:true,status:'LINKED',expectedKind,target};
  }

  function analyzeEvents(events=[]){
    const rows=events
      .filter(e=>PREDECESSOR_KIND[e?.eventKind]&&e?.projectionVersion==='V2')
      .map(event=>({event,reference:eventReference(event,events)}));
    const linked=rows.filter(r=>r.reference.status==='LINKED').length;
    const issues=rows.filter(r=>r.reference.status!=='LINKED').length;
    return {
      projection:PROJECTION,
      linked,
      total:rows.length,
      percent:rows.length?Math.round(linked/rows.length*100):null,
      issues,
      rows,
      integrity:'PROGRAM ≠ PREFLIGHT ≠ HUMAN_DECISION ≠ APPLICATION ≠ EVIDENCE ≠ RESPONSE · CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ AUTHORIZATION · REFERENCE ≠ EXECUTION · RESPONSE ≠ CAUSAL_EFFECT · LEGACY_NOT_PROMOTED'
    };
  }

  function analyzeCase(caseRecord){
    const events=Array.isArray(caseRecord?.events)?caseRecord.events:[];
    const refs=analyzeEvents(events);
    return {
      caseId:caseRecord?.id||caseRecord?.caseId||'',
      lot:caseRecord?.lot||'',
      stageCoverage:caseRecord?.stageCoverage||null,
      referenceCoverage:{linked:refs.linked,total:refs.total,percent:refs.percent},
      referenceIssues:refs.issues,
      referenceRows:refs.rows,
      integrity:refs.integrity
    };
  }

  window.__SANA_NUTRITION_CHAIN_V2__=Object.freeze({
    projection:PROJECTION,
    stages:STAGES,
    predecessorKinds:PREDECESSOR_KIND,
    eventReference,
    analyzeEvents,
    analyzeCase,
    integrity:'NUTRITION_V2_REFERENCE_CONTRACT_ONLY · NO_CANONICAL_WRITE · NO_AUTOMATIC_AUTHORIZATION · NO_INVENTORY_INFERENCE · NO_CAUSAL_EFFECT_INFERENCE'
  });
})();
