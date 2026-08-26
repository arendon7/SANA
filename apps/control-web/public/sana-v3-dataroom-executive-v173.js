(() => {
  'use strict';

  const VERSION='V173';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_CLAIMS_V1';
  const PARENT='V172';
  const PARENT_SHA='61a9eb5df8dffdc536bc107f886dcdf195d7c258';
  const CLAIM_CLASSES=Object.freeze(['SOURCE_REFERENCE_PRESENT','SOURCE_REFERENCE_UNAVAILABLE','SNAPSHOT_REFERENCE_PRESENT','CASE_REFERENCE_PRESENT','EVENT_REFERENCE_PRESENT','ENTITY_REFERENCE_PRESENT']);
  const SUPPORT_STATES=Object.freeze(['REFERENCED_ONLY','UNAVAILABLE_OR_PARTIAL']);
  const KIND_TO_CLASS=Object.freeze({SNAPSHOT_REF:'SNAPSHOT_REFERENCE_PRESENT',CASE_REF:'CASE_REFERENCE_PRESENT',EVENT_REF:'EVENT_REFERENCE_PRESENT',ENTITY_REF:'ENTITY_REFERENCE_PRESENT'});
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,truthVerificationAuthority:false,sufficiencyAuthority:false,decisionAuthority:false,aiAuthority:'ADVISORY_ONLY',offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='CLAIM_STATEMENT ≠ VERIFIED_FACT · LOCATOR_SUPPORT ≠ EVIDENTIARY_SUFFICIENCY · MULTIPLE_LOCATORS ≠ STRONGER_TRUTH · SOURCE_PRESENT ≠ COMPLETE_DOSSIER · SOURCE_UNAVAILABLE ≠ NEGATIVE_PROJECT_CONCLUSION · REFERENCE_CHAIN ≠ CAUSAL_PROOF · CLAIM_COUNT ≠ SCORE · CONTROLLED_TEMPLATES_ONLY · NO_LLM_CLAIM_GENERATION · NO_MUTATION · READ_ONLY';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function uniq(values){return [...new Set(values.filter(v=>v!==undefined&&v!==null&&v!==''))]}
  function sourceLabel(def){return def?.id||def?.globalName||'FUENTE'}
  function claimId(sourceId,claimClass,lot){return `CLM::${sourceId}::${claimClass}::${lot||'GLOBAL'}`}
  function statement(def,claimClass,lot){
    const src=sourceLabel(def),scope=lot?` para el lote declarado ${lot}`:' para el alcance disponible';
    const templates={
      SOURCE_REFERENCE_PRESENT:`La fuente ${src} tiene referencias explícitas localizables${scope}.`,
      SOURCE_REFERENCE_UNAVAILABLE:`La fuente ${src} no presenta una referencia explícita localizable${scope}.`,
      SNAPSHOT_REFERENCE_PRESENT:`La fuente ${src} contiene al menos una referencia explícita de snapshot${scope}.`,
      CASE_REFERENCE_PRESENT:`La fuente ${src} contiene al menos una referencia explícita de caso${scope}.`,
      EVENT_REFERENCE_PRESENT:`La fuente ${src} contiene al menos una referencia explícita de evento${scope}.`,
      ENTITY_REFERENCE_PRESENT:`La fuente ${src} contiene al menos una referencia explícita de entidad acotada${scope}.`
    };
    return templates[claimClass]||'';
  }
  function countKinds(locators){
    const out={SNAPSHOT_REF:0,CASE_REF:0,EVENT_REF:0,ENTITY_REF:0,SOURCE_ONLY:0};for(const l of locators)out[l.kind]=(out[l.kind]||0)+1;return Object.freeze(out);
  }
  function makeClaim(def,claimClass,locators,lot,supportState){
    const locatorKeys=Object.freeze(locators.map(l=>l.locatorKey));
    return deepFreeze({
      schema:SCHEMA,version:VERSION,claimId:claimId(def.id,claimClass,lot),sectionId:def.section,sourceId:def.id,sourceGlobal:def.globalName,sourceFile:def.file,sourceView:def.view,
      claimClass,statement:statement(def,claimClass,lot),templateVersion:'CLAIM_TEMPLATES_V1',supportState,locatorKeys,locatorKindCounts:countKinds(locators),
      selectedLot:lot||null,scopeQualities:Object.freeze(uniq(locators.map(l=>l.scopeQuality))),limitations:Object.freeze(uniq(locators.flatMap(l=>l.limitations||[]))),
      truthVerified:false,sufficiencyDetermined:false,decisionAuthority:false,referenceOnly:true,authority:AUTHORITY,integrity:INTEGRITY
    });
  }
  function claimsForSource(def,locators,lot){
    const explicit=locators.filter(l=>l.kind!=='SOURCE_ONLY');const unavailable=locators.filter(l=>l.kind==='SOURCE_ONLY');const out=[];
    if(explicit.length){
      out.push(makeClaim(def,'SOURCE_REFERENCE_PRESENT',explicit,lot,'REFERENCED_ONLY'));
      for(const [kind,claimClass] of Object.entries(KIND_TO_CLASS)){const rows=explicit.filter(l=>l.kind===kind);if(rows.length)out.push(makeClaim(def,claimClass,rows,lot,'REFERENCED_ONLY'));}
    }else{
      const supports=unavailable.length?unavailable:[];out.push(makeClaim(def,'SOURCE_REFERENCE_UNAVAILABLE',supports,lot,'UNAVAILABLE_OR_PARTIAL'));
    }
    return out;
  }
  function summarize(claims){
    const classes=Object.fromEntries(CLAIM_CLASSES.map(k=>[k,0]));const support=Object.fromEntries(SUPPORT_STATES.map(k=>[k,0]));
    for(const c of claims){classes[c.claimClass]=(classes[c.claimClass]||0)+1;support[c.supportState]=(support[c.supportState]||0)+1;}
    return deepFreeze({total:claims.length,classes,support,truthVerified:0,sufficiencyDetermined:0,decisionAuthority:0,semantics:'CLAIM_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'});
  }
  function build(host,options={}){
    const v171Factory=globalThis.__SANA_DATAROOM_EXECUTIVE_V171_FACTORY__||host?.__SANA_DATAROOM_EXECUTIVE_V171_FACTORY__;
    const v172Factory=globalThis.__SANA_DATAROOM_EXECUTIVE_V172_FACTORY__||host?.__SANA_DATAROOM_EXECUTIVE_V172_FACTORY__;
    if(!v171Factory?.create)throw new Error('V171_FACTORY_REQUIRED');if(!v172Factory?.create)throw new Error('V172_FACTORY_REQUIRED');
    const v171=v171Factory.create(host),v172=v172Factory.create(host),lot=options.lot?String(options.lot):null,locatorResult=v172.build({lot});
    const locatorSet=new Set(locatorResult.locators.map(l=>l.locatorKey));const claims=[];
    for(const def of v171.registry){const locators=locatorResult.locators.filter(l=>l.sourceId===def.id);claims.push(...claimsForSource(def,locators,lot));}
    for(const claim of claims)for(const key of claim.locatorKeys)if(!locatorSet.has(key))throw new Error(`LOCATOR_KEY_OUTSIDE_PARENT:${key}`);
    const ordered=claims.slice().sort((a,b)=>String(a.sectionId).localeCompare(String(b.sectionId))||String(a.sourceId).localeCompare(String(b.sourceId))||String(a.claimClass).localeCompare(String(b.claimClass)));
    return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,parentSha:PARENT_SHA,scope:{lot,mode:lot?'LOT_LENS':'GLOBAL_OR_SNAPSHOT'},claims:ordered,summary:summarize(ordered),authority:AUTHORITY,provenance:{parent:PARENT,parentSha:PARENT_SHA,locatorSchema:locatorResult.schema,sourceRegistry:'V171_TYPED_REGISTRY',templates:'CLAIM_TEMPLATES_V1'},integrity:INTEGRITY});
  }
  function forSection(host,sectionId,options={}){const r=build(host,options),claims=r.claims.filter(c=>c.sectionId===sectionId);return deepFreeze({...r,sectionId,claims,summary:summarize(claims)});}
  function forSource(host,sourceId,options={}){const r=build(host,options),claims=r.claims.filter(c=>c.sourceId===sourceId);return deepFreeze({...r,sourceId,claims,summary:summarize(claims)});}
  function create(host){const target=host||globalThis;return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,claimClasses:CLAIM_CLASSES,supportStates:SUPPORT_STATES,authority:AUTHORITY,build:o=>build(target,o),forSection:(id,o)=>forSection(target,id,o),forSource:(id,o)=>forSource(target,id,o),integrity:INTEGRITY});}

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,integrity:INTEGRITY});
  if(typeof window!=='undefined')window.__SANA_DATAROOM_EXECUTIVE_V173_FACTORY__=factory;
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V173_FACTORY__=factory;
})();
