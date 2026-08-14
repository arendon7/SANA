(() => {
  'use strict';

  function paint(){
    const button=document.getElementById('offline-btn');
    if(!button)return;
    const online=navigator.onLine;
    const registered='serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller);
    button.title=registered?'Shell DEMO cacheado. Los registros locales siguen requiriendo servidor válido para ACK.':'El shell se prepara para reapertura offline después de la primera carga.';
    const label=button.querySelector('span');
    if(label)label.textContent=online?(registered?'Offline-ready':'Preparando offline'):'Sin red · LOCAL_ONLY';
    button.dataset.online=online?'true':'false';
    button.dataset.shellCached=registered?'true':'false';
  }

  async function register(){
    if(!('serviceWorker' in navigator))return paint();
    try{
      await navigator.serviceWorker.register('/sana-v3-sw.js',{scope:'/'});
      await navigator.serviceWorker.ready;
    }catch{
      // La DEMO continúa funcional con localStorage aunque el navegador no permita SW.
    }
    paint();
  }

  window.addEventListener('online',paint);
  window.addEventListener('offline',paint);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});
  else register();
})();
