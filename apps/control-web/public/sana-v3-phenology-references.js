(() => {
  'use strict';
  const base=window.__SANA_PHENOLOGY_SERIES__;
  if(!base?.entries||base.schema!=='SANA_PHENOLOGY_SERIES_V1')return;

  const VERSION='V133';
  const RULES=Object.freeze({
    HUMAN_INTERPRETATION:Object.freeze({field:'basisRefs',allowed:Object.freeze(['STAGE_OBSERVATION','VARIABLE_MEASUREMENT'])}),
    EVIDENCE:Object.freeze({field:'supports',allowed:Object.freeze(['STAGE_OBSERVATION','VARIABLE_MEASUREMENT','HUMAN_INTERPRETATION'])})
  });
  const LABEL=Object.freeze({STAGE_OBSERVATION:'Etapa observada',VARIABLE_MEASUREMENT:'Medición de variable',HUMAN_INTERPRETATION:'Interpretación humana',EVIDENCE:'Evidencia'});

  function metadata(){
    const out=new Map();
    (storage?.records||[]).filter(r=>r.type==='phenology-series-event'&&r.values?.phenologySchema===base.schema).forEach(r=>{
      out.set(r.id,{referenceVersion:r.values?.referenceVersion||''});
    });
    return out;
  }
  function entries(){
    const meta=metadata();
    return base.entries().map(e=>({...e,referenceVersion:meta.get(e.id)?.referenceVersion||e.referenceVersion||''}));
  }
  function refsOf(event){
    const rule=RULES[event.eventKind];
    if(!rule)return [];
    const refs=event[rule.field];
    return Array.isArray(refs)?refs.filter(Boolean):[];
  }
  function reference(event,refId,scope=null){
    const rule=RULES[event.eventKind]||null;
    if(!rule)return {required:false,status:'NOT_REQUIRED',target:null,allowedKinds:[]};
    if(event.referenceVersion!==VERSION)return {required:false,status:'LEGACY_REFERENCE_NOT_CAPTURED',target:null,allowedKinds:rule.allowed};
    if(!refId)return {required:true,status:'MISSING_REFERENCE',target:null,allowedKinds:rule.allowed};
    const all=entries();
    const target=all.find(x=>x.id===refId)||null;
    if(!target)return {required:true,status:'MISSING_TARGET',target:null,allowedKinds:rule.allowed};
    if(target.lot!==event.lot)return {required:true,status:'CROSS_LOT_REFERENCE',target,allowedKinds:rule.allowed};
    if(!rule.allowed.includes(target.eventKind))return {required:true,status:'KIND_MISMATCH',target,allowedKinds:rule.allowed};
    if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_REFERENCE',target,allowedKinds:rule.allowed};
    if(scope&&!scope.some(x=>x.id===target.id))return {required:true,status:'CROSS_LOT_REFERENCE',target,allowedKinds:rule.allowed};
    return {required:true,status:'LINKED',target,allowedKinds:rule.allowed};
  }
  function rowsForLot(lot){
    const scope=entries().filter(e=>e.lot===lot);
    const rows=[];
    scope.filter(e=>RULES[e.eventKind]&&e.referenceVersion===VERSION).forEach(event=>{
      const refs=refsOf(event);
      if(!refs.length){rows.push({event,refId:'',reference:reference(event,'',scope)});return}
      refs.forEach(refId=>rows.push({event,refId,reference:reference(event,refId,scope)}));
    });
    return rows;
  }
  function referenceCoverage(lot){
    const rows=rowsForLot(lot);const linked=rows.filter(r=>r.reference.status==='LINKED').length;
    return {linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null,issues:rows.length-linked,rows};
  }
  function summary(lot){
    const s=base.summary(lot);const coverage=referenceCoverage(lot);
    return {...s,entries:entries().filter(e=>e.lot===lot),referenceCoverage:{linked:coverage.linked,total:coverage.total,percent:coverage.percent},referenceIssues:coverage.issues,referenceRows:coverage.rows,integrity:`${s.integrity} · REFERENCE ≠ PLAN_PHASE · REFERENCE ≠ MANAGEMENT_DECISION · REFERENCE ≠ CAUSALITY · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`};
  }
  function forLot(lot){const x=base.forLot(lot);return {...x,entries:entries().filter(e=>e.lot===lot),referenceCoverage:referenceCoverage(lot)}}

  function lotOptions(){return (DEMO.lots||[]).map(l=>`<option value="${esc(l.id)}">${esc(l.id)} · ${esc(l.crop)}</option>`).join('')}
  function openEntry(){
    const body=`<div class="fields"><input type="hidden" name="phenologySchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><label>Lote<select name="lot">${lotOptions()}</select></label><label>Tipo<select name="eventKind"><option value="STAGE_OBSERVATION">Etapa observada</option><option value="VARIABLE_MEASUREMENT">Medición de variable</option><option value="HUMAN_INTERPRETATION">Interpretación humana</option><option value="EVIDENCE">Evidencia</option></select></label><label>Fecha y hora<input name="observedAt" type="datetime-local" required></label><label>Responsable<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Etapa<input name="stage"></label><label>Avance DEMO %<input name="progress" type="number" min="0" max="100" step="0.1"></label><label>Variable<input name="variable"></label><label>Valor<input name="value" type="number" step="0.001"></label><label>Unidad<input name="unit"></label><label>Método<input name="method"></label><label>Punto / muestra<input name="point"></label><label>Alcance muestra<input name="sampleScope"></label><label>Fuente<input name="sourceClass" value="OBSERVED_DEMO"></label><label>Calidad<input name="quality" value="OBSERVED_DEMO"></label><label>Clase interpretación<input name="interpretationClass"></label><label>Refs base · interpretación<input name="basisRefs" placeholder="IDs de etapa/medición separados por coma"></label><label>Ref evidencia<input name="evidenceRef"></label><label>Soporta eventos · evidencia<input name="supports" placeholder="IDs de etapa/medición/interpretación separados por coma"></label><label class="full">Detalle<textarea name="detail" required></textarea></label></div>`;
    openModal('FENOLOGÍA · REFERENCIAS V133','Nuevo registro trazable',body,true,'phenology-series-event');
  }
  function panel(){
    const lots=(DEMO.lots||[]).map(l=>({lot:l.id,...referenceCoverage(l.id)})).filter(x=>x.total||summary(x.lot).interpretations.length||summary(x.lot).evidence.length);
    const total=lots.reduce((n,x)=>n+x.total,0),linked=lots.reduce((n,x)=>n+x.linked,0),issues=lots.reduce((n,x)=>n+x.issues,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">FENOLOGÍA · REFERENCIAS V133</p><h2>Integridad semántica entre observación, medición, interpretación y evidencia</h2><p>Solo registros V133 entran al denominador. La historia V1 permanece válida y no se rellena retroactivamente.</p></div><button class="btn primary" data-phenology-v133-entry>Nuevo registro V133</button></div><div class="card-body"><div class="grid metrics">${metric('Referencias enlazadas',linked,'mismo lote + tipo + tiempo')}${metric('Referencias esperadas',total,'solo V133')}${metric('Issues',issues,'procedencia documental',issues?'warn':'good')}${metric('Lotes',lots.length,'con interpretación/evidencia')}</div>${lots.map(x=>`<div class="gate" style="margin-top:10px"><i class="${x.issues?'warn':'ok'}">${x.issues?'!':'✓'}</i><div><strong>${esc(x.lot)} · ${x.linked}/${x.total||0}</strong><p>${x.issues} issue(s) de referencia explícita</p></div><span class="status ${x.issues?'warn':'teal'}">${x.percent===null?'—':x.percent+'%'}</span></div>`).join('')}<div class="section-note" style="margin-top:12px">HUMAN_INTERPRETATION → STAGE_OBSERVATION | VARIABLE_MEASUREMENT · EVIDENCE → STAGE_OBSERVATION | VARIABLE_MEASUREMENT | HUMAN_INTERPRETATION · REFERENCE ≠ PLAN_PHASE ≠ MANAGEMENT_DECISION ≠ CAUSALITY.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const prior=views.phenology;
  if(prior)views.phenology=()=>insert(prior().replaceAll('data-phenology-entry','data-phenology-v133-entry'),panel());
  document.addEventListener('click',event=>{if(event.target.closest('[data-phenology-v133-entry]'))openEntry()});

  window.__SANA_PHENOLOGY_SERIES__=Object.freeze({...base,referenceVersion:VERSION,entries,forLot,summary,reference,referenceCoverage,referenceRules:RULES,integrity:`${base.integrity} · REFERENCE ≠ PLAN_PHASE · REFERENCE ≠ MANAGEMENT_DECISION · REFERENCE ≠ CAUSALITY · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID`});
})();
