(() => {
  'use strict';

  let identity=window.__SANA_DEMO_IDENTITY__||null;
  if(!identity){try{identity=JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{identity=null}}
  const rawRole=String(identity?.role||'new_user').toLowerCase();
  const role=rawRole.includes('admin')?'admin':rawRole.includes('technical')||rawRole.includes('técn')?'technical':rawRole.includes('producer')||rawRole.includes('productor')?'producer':rawRole.includes('invest')?'investor':rawRole.includes('visitor')||rawRole.includes('guest')?'visitor':'new_user';

  const allViews=['home','guide','territory','characterization','material','plans','field','phenology','nutrition','health','inventory','forecast','circularity','results','economics','team','iot','reports','sources','advisory','passport','intelligence','impact','capital','control'];
  const viewPolicy={
    admin:new Set(allViews),
    technical:new Set(['home','guide','territory','characterization','material','plans','field','phenology','nutrition','health','inventory','forecast','circularity','results','economics','team','iot','reports','sources','advisory','passport','intelligence','impact','capital']),
    producer:new Set(['home','guide','territory','characterization','material','plans','field','phenology','nutrition','health','inventory','forecast','circularity','results','economics','team','iot','reports','sources','advisory','passport','intelligence','impact','capital']),
    investor:new Set(['home','territory','forecast','circularity','results','economics','reports','sources','passport','impact','capital']),
    visitor:new Set(['home','territory','passport','impact','capital']),
    new_user:new Set(['home','guide','characterization','passport','impact','capital'])
  };

  const actionPolicy={
    admin:['*'],
    technical:['guided-checkpoint','fieldRecord','quickField','task-toggle','plan-activity','activity-evidence','activity-close','phenology','nutrition','health','inventory','inventory-movement','team-worklog','material','material-lifecycle-event','sensor','visit','structured-visit','agronomist-case','input-forecast-adjustment','plan','plan-review','harvest-result','circularity-residue','report','reportOpen','report-snapshot','document-source-link','methodology','impact-methodology','knowledge','exportPassport','queue-review'],
    producer:['guided-checkpoint','fieldRecord','quickField','task-toggle','plan-activity','activity-evidence','activity-close','phenology','nutrition','health','inventory','inventory-movement','team-worklog','material-lifecycle-event','structured-visit','agronomist-case','input-forecast-adjustment','harvest-result','circularity-residue','cost','report-snapshot','document-source-link','methodology','reportOpen','exportPassport','queue-review','characterization:*','capital-dossier'],
    investor:['reportOpen','methodology','exportPassport'],
    visitor:['methodology','exportPassport'],
    new_user:['guided-checkpoint','methodology','exportPassport','characterization:*']
  };

  const roleLabels={admin:['Administrador demo','Vista integral'],technical:['Técnico demo','Campo + acompañamiento'],producer:['Productor demo','Operación del predio'],investor:['Inversionista demo','Lectura de evidencia + readiness'],visitor:['Visitante demo','Exploración guiada'],new_user:['Usuario nuevo','Onboarding limitado']};
  function matchAction(type,allowed){if(allowed==='*')return true;if(allowed.endsWith(':*'))return String(type||'').startsWith(allowed.slice(0,-1));return type===allowed}
  function canView(view){return Boolean(viewPolicy[role]?.has(view))}
  function canAction(type){return Boolean((actionPolicy[role]||[]).some(allowed=>matchAction(type,allowed)))}
  function defaultView(){return canView('home')?'home':[...(viewPolicy[role]||[])][0]||'home'}
  function deny(message='Esta acción no está disponible para este rol DEMO.'){if(typeof window.toast==='function')window.toast('Permiso DEMO',message,'warn');else window.dispatchEvent(new CustomEvent('sana:access-denied',{detail:{message,role}}))}

  const selectorActions=[['[data-guide-complete]','guided-checkpoint'],['[data-task]','task-toggle'],['[data-queue]','queue-review'],['[data-field-quick]','quickField'],['[data-workflow-create]','plan-activity'],['[data-workflow-evidence]','activity-evidence'],['[data-workflow-close]','activity-close'],['[data-character-section]','characterization:*'],['[data-material-event]','material-lifecycle-event'],['[data-plan-review]','plan-review'],['[data-plan-transition]','plan-review'],['[data-structured-visit]','structured-visit'],['[data-agronomist-case]','agronomist-case'],['[data-forecast-adjust]','input-forecast-adjustment'],['[data-inventory-movement]','inventory-movement'],['[data-team-worklog]','team-worklog'],['[data-report-snapshot]','report-snapshot'],['[data-document-source]','document-source-link'],['[data-harvest-result]','harvest-result'],['[data-circularity-residue]','circularity-residue'],['[data-capital-config]','capital-dossier'],['[data-economics-cost]','cost'],['[data-impact-methodology]','impact-methodology']];
  function enforceNav(){document.querySelectorAll('[data-view]').forEach(button=>{const allowed=canView(button.dataset.view);button.hidden=!allowed;button.setAttribute('aria-hidden',String(!allowed));if(!allowed)button.tabIndex=-1})}
  function enforceRoleLabel(){const [name,context]=roleLabels[role]||roleLabels.new_user;const nameNode=document.getElementById('role-name');const contextNode=document.getElementById('role-context');if(nameNode)nameNode.textContent=name;if(contextNode)contextNode.textContent=context}
  function wrapRuntime(){
    if(typeof window.go==='function'&&!window.go.__sanaRoleGuard){const original=window.go;const guarded=function(view){if(!canView(view)){deny('Este rol no tiene acceso a esa vista en la DEMO.');return}return original(view)};guarded.__sanaRoleGuard=true;window.go=guarded}
    if(typeof window.action==='function'&&!window.action.__sanaRoleGuard){const original=window.action;const guarded=function(type,item){if(!canAction(type)){deny('El rol actual no puede ejecutar esta acción DEMO.');return}return original(type,item)};guarded.__sanaRoleGuard=true;window.action=guarded}
    if(typeof window.toggleTask==='function'&&!window.toggleTask.__sanaRoleGuard){const original=window.toggleTask;const guarded=function(id){if(!canAction('task-toggle')){deny('Este rol no puede cambiar actividades.');return}return original(id)};guarded.__sanaRoleGuard=true;window.toggleTask=guarded}
    if(typeof window.reviewQueue==='function'&&!window.reviewQueue.__sanaRoleGuard){const original=window.reviewQueue;const guarded=function(id){if(!canAction('queue-review')){deny('Este rol no puede revisar la cola de campo.');return}return original(id)};guarded.__sanaRoleGuard=true;window.reviewQueue=guarded}
    if(typeof window.saveModal==='function'&&!window.saveModal.__sanaRoleGuard){const original=window.saveModal;const guarded=function(){const type=typeof modalAction==='string'?modalAction:'record';if(type&&type!=='record'&&!canAction(type)){deny('El rol actual no puede guardar este tipo de registro.');return}return original()};guarded.__sanaRoleGuard=true;window.saveModal=guarded}
    const requested=(location.hash||'#home').slice(1);if(!canView(requested)&&typeof window.go==='function')window.go(defaultView())
  }
  document.addEventListener('click',event=>{const nav=event.target.closest('[data-view],[data-view-link]');if(nav){const view=nav.dataset.view||nav.dataset.viewLink;if(view&&!canView(view)){event.preventDefault();event.stopImmediatePropagation();deny('Este rol no tiene acceso a esa vista en la DEMO.');return}}for(const [selector,type] of selectorActions){if(event.target.closest(selector)&&!canAction(type)){event.preventDefault();event.stopImmediatePropagation();deny('El rol actual es de lectura o tiene un alcance operativo más limitado.');return}}},true);
  const observer=new MutationObserver(()=>{enforceNav();enforceRoleLabel();wrapRuntime()});observer.observe(document.documentElement,{subtree:true,childList:true});const mount=()=>{enforceNav();enforceRoleLabel();wrapRuntime()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();setTimeout(wrapRuntime,0);
  window.__SANA_ACCESS__=Object.freeze({role,canView,canAction,defaultView,deny,viewPolicy:Object.freeze([...(viewPolicy[role]||[])])});
})();
