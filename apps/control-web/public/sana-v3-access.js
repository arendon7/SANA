(() => {
  'use strict';

  let identity=window.__SANA_DEMO_IDENTITY__||null;
  if(!identity){try{identity=JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{identity=null}}
  const rawRole=String(identity?.role||'new_user').toLowerCase();
  const role=rawRole.includes('admin')?'admin':rawRole.includes('technical')||rawRole.includes('técn')?'technical':rawRole.includes('producer')||rawRole.includes('productor')?'producer':rawRole.includes('invest')?'investor':rawRole.includes('visitor')||rawRole.includes('guest')?'visitor':'new_user';

  const allViews=['home','territory','characterization','material','plans','field','phenology','nutrition','health','inventory','economics','team','iot','reports','advisory','passport','intelligence','impact','capital','control'];
  const viewPolicy={
    admin:new Set(allViews),
    technical:new Set(['home','territory','characterization','material','plans','field','phenology','nutrition','health','inventory','economics','iot','reports','advisory','passport','intelligence','impact','capital']),
    producer:new Set(['home','territory','characterization','plans','field','phenology','nutrition','health','inventory','economics','iot','reports','advisory','passport','intelligence','impact','capital']),
    investor:new Set(['home','territory','economics','reports','passport','impact','capital']),
    visitor:new Set(['home','territory','passport','impact','capital']),
    new_user:new Set(['home','characterization','passport','impact','capital'])
  };

  const actionPolicy={
    admin:['*'],
    technical:['fieldRecord','quickField','task-toggle','phenology','nutrition','health','inventory','material','sensor','visit','structured-visit','plan','plan-review','report','reportOpen','methodology','impact-methodology','knowledge','exportPassport','queue-review'],
    producer:['fieldRecord','quickField','task-toggle','phenology','nutrition','health','inventory','cost','methodology','reportOpen','exportPassport','queue-review','characterization:*','capital-dossier'],
    investor:['reportOpen','methodology','exportPassport'],
    visitor:['methodology','exportPassport'],
    new_user:['methodology','exportPassport','characterization:*']
  };

  function matchAction(type,allowed){
    if(allowed==='*')return true;
    if(allowed.endsWith(':*'))return String(type||'').startsWith(allowed.slice(0,-1));
    return type===allowed;
  }
  function canView(view){return Boolean(viewPolicy[role]?.has(view))}
  function canAction(type){return Boolean((actionPolicy[role]||[]).some(allowed=>matchAction(type,allowed)))}
  function defaultView(){return canView('home')?'home':[...(viewPolicy[role]||[])][0]||'home'}

  function deny(message='Esta acción no está disponible para este rol DEMO.'){
    if(typeof window.toast==='function')window.toast('Permiso DEMO',message,'warn');
    else window.dispatchEvent(new CustomEvent('sana:access-denied',{detail:{message,role}}));
  }

  const selectorActions=[
    ['[data-task]','task-toggle'],
    ['[data-queue]','queue-review'],
    ['[data-field-quick]','quickField'],
    ['[data-character-section]','characterization:*'],
    ['[data-plan-review]','plan-review'],
    ['[data-plan-transition]','plan-review'],
    ['[data-structured-visit]','structured-visit'],
    ['[data-capital-config]','capital-dossier'],
    ['[data-economics-cost]','cost'],
    ['[data-impact-methodology]','impact-methodology']
  ];

  function enforceNav(){
    document.querySelectorAll('[data-view]').forEach(button=>{
      const allowed=canView(button.dataset.view);
      button.hidden=!allowed;
      button.setAttribute('aria-hidden',String(!allowed));
      if(!allowed)button.tabIndex=-1;
    });
  }

  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-view],[data-view-link]');
    if(nav){const view=nav.dataset.view||nav.dataset.viewLink;if(view&&!canView(view)){event.preventDefault();event.stopImmediatePropagation();deny('Este rol no tiene acceso a esa vista en la DEMO.');return}}
    for(const [selector,type] of selectorActions){
      if(event.target.closest(selector)&&!canAction(type)){
        event.preventDefault();event.stopImmediatePropagation();deny('El rol actual es de lectura o tiene un alcance operativo más limitado.');return;
      }
    }
  },true);

  const observer=new MutationObserver(enforceNav);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforceNav,{once:true});else enforceNav();

  window.__SANA_ACCESS__=Object.freeze({role,canView,canAction,defaultView,deny,viewPolicy:Object.freeze([...viewPolicy[role]||[]])});
})();
