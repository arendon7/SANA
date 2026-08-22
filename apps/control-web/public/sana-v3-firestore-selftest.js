(() => {
  'use strict';

  const SDK_VERSION='12.16.0';
  const COLLECTION='demo_user_state';
  const RESULT_KEY='sana.v3.firestore.selftest.result';
  const config=window.__SANA_DEMO_CONFIG__||{};
  let identity=window.__SANA_DEMO_IDENTITY__||null;
  if(!identity){try{identity=JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{identity=null}}
  let running=false;
  let lastResult=null;
  try{lastResult=JSON.parse(sessionStorage.getItem(RESULT_KEY)||'null')}catch{lastResult=null}

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const eligible=()=>identity?.authProvider==='FIREBASE_AUTH'&&Boolean(identity?.id);
  const codeOf=error=>String(error?.code||error?.message||'');

  async function waitForFirebaseUser(auth,authModule,timeout=7000){
    if(auth.currentUser)return auth.currentUser;
    return new Promise(resolve=>{
      let settled=false;
      let off=()=>{};
      const timer=setTimeout(()=>{if(settled)return;settled=true;off();resolve(null)},timeout);
      off=authModule.onAuthStateChanged(auth,user=>{if(settled)return;settled=true;clearTimeout(timer);off();resolve(user)});
    });
  }

  async function firebaseContext(){
    if(!config.firebaseApiKey||!config.firebaseAuthDomain||!config.firebaseProjectId||!config.firebaseAppId)throw new Error('FIREBASE_PUBLIC_CONFIG_MISSING');
    const base=`https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
    const [appModule,authModule,firestore]=await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-auth.js`),
      import(`${base}/firebase-firestore.js`)
    ]);
    const cfg={apiKey:config.firebaseApiKey,authDomain:config.firebaseAuthDomain,projectId:config.firebaseProjectId,appId:config.firebaseAppId};
    const app=appModule.getApps().find(item=>item.name==='sana-v3-rules-selftest')||appModule.initializeApp(cfg,'sana-v3-rules-selftest');
    const auth=authModule.getAuth(app);
    const user=await waitForFirebaseUser(auth,authModule);
    if(!user||user.uid!==identity?.id)throw new Error('FIREBASE_IDENTITY_MISMATCH');
    return {user,db:firestore.getFirestore(app),firestore};
  }

  async function waitForCloudProof(timeout=9000){
    const cloud=window.__SANA_CLOUD_STATE__;
    if(!cloud)return {status:'UNAVAILABLE',revision:0,connected:false};
    try{await cloud.flush?.()}catch{}
    const started=Date.now();
    while(Date.now()-started<timeout){
      const current=cloud.describe?.()||{};
      if(current.status==='SYNCED'&&Number(current.revision)>0)return current;
      if(['CONFLICT','ERROR'].includes(current.status))return current;
      if(current.status==='RULES_REQUIRED'){
        try{await cloud.flush?.()}catch{}
      }
      await sleep(350);
    }
    return cloud.describe?.()||{status:'TIMEOUT',revision:0,connected:false};
  }

  async function run(){
    if(running)return lastResult;
    running=true;renderIntoAccount();
    const startedAt=new Date().toISOString();
    try{
      if(!eligible())throw new Error('FIREBASE_ACCOUNT_REQUIRED');
      const cloud=await waitForCloudProof();
      const writeProof=cloud.status==='SYNCED'&&Number(cloud.revision)>0;
      const {user,db,firestore}=await firebaseContext();
      const ownRef=firestore.doc(db,COLLECTION,user.uid);
      const ownSnap=await firestore.getDoc(ownRef);
      const ownData=ownSnap.exists()?ownSnap.data():null;
      const ownRead=Boolean(
        ownSnap.exists()&&
        ownData?.userId===user.uid&&
        ownData?.environment==='DEMO'&&
        ownData?.schemaVersion==='1.0.0'&&
        Number(ownData?.revision)>0&&
        Array.isArray(ownData?.payload)
      );

      const foreignId=`__sana_foreign_probe_${user.uid.slice(0,8)}__`;
      let foreignReadDenied=false;
      let foreignReadCode='';
      try{
        await firestore.getDoc(firestore.doc(db,COLLECTION,foreignId));
        foreignReadCode='UNEXPECTEDLY_ALLOWED';
      }catch(error){
        foreignReadCode=codeOf(error);
        foreignReadDenied=foreignReadCode.includes('permission-denied');
      }

      lastResult={
        pass:Boolean(writeProof&&ownRead&&foreignReadDenied),
        startedAt,
        finishedAt:new Date().toISOString(),
        projectId:config.firebaseProjectId||'',
        ownUid:user.uid,
        revision:Number(ownData?.revision||cloud.revision||0),
        checks:{
          ownWriteRevision:writeProof,
          ownRead,
          foreignReadDenied
        },
        cloudStatus:cloud.status||'UNKNOWN',
        foreignReadCode
      };
    }catch(error){
      lastResult={
        pass:false,
        startedAt,
        finishedAt:new Date().toISOString(),
        projectId:config.firebaseProjectId||'',
        checks:{ownWriteRevision:false,ownRead:false,foreignReadDenied:false},
        error:codeOf(error)
      };
    }finally{
      running=false;
      try{sessionStorage.setItem(RESULT_KEY,JSON.stringify(lastResult))}catch{}
      window.dispatchEvent(new CustomEvent('sana:firestore-selftest',{detail:lastResult}));
      renderIntoAccount();
    }
    return lastResult;
  }

  function checkRow(label,ok,detail){
    return `<div class="mini-row"><span>${label}</span><b>${ok?'✓ PASS':'× FAIL'}</b>${detail?`<small style="grid-column:1/-1;color:var(--muted);line-height:1.45">${detail}</small>`:''}</div>`;
  }

  function resultMarkup(){
    if(running)return '<div class="section-note" style="margin-top:10px"><strong>Verificando Firestore…</strong><br>Comprobando sincronización propia y aislamiento por UID.</div>';
    if(!lastResult)return '<p style="font-size:9px;line-height:1.5;color:var(--muted);margin-top:10px">La prueba realiza lectura propia y confirma que un UID ajeno sea rechazado. La escritura propia se prueba mediante la revisión sincronizada por el módulo cloud normal.</p>';
    const c=lastResult.checks||{};
    return `<div class="section-note" style="margin-top:10px"><strong>${lastResult.pass?'Firestore multiusuario verificado':'Verificación incompleta'}</strong><br>${lastResult.pass?'Owner UID y sincronización DEMO se comportan como espera SANA.':'Revisa el detalle antes de considerar activa la persistencia cloud.'}</div><div class="mini-list" style="margin-top:8px">${checkRow('Escritura propia versionada',Boolean(c.ownWriteRevision),lastResult.revision?`Revisión ${lastResult.revision}`:'Sin revisión cloud confirmada')}${checkRow('Lectura de documento propio',Boolean(c.ownRead),'demo_user_state/{uid}')}${checkRow('Lectura de UID ajeno rechazada',Boolean(c.foreignReadDenied),lastResult.foreignReadCode||'Sin código')}</div>`;
  }

  function renderIntoAccount(){
    const modal=document.getElementById('modal');
    const title=document.getElementById('modal-title');
    const body=document.getElementById('modal-body');
    if(!modal?.open||title?.textContent!=='Mi cuenta y sincronización'||!body||!eligible())return;
    let host=body.querySelector('[data-firestore-selftest-host]');
    if(!host){
      host=document.createElement('section');
      host.className='card';
      host.style.marginTop='12px';
      host.style.boxShadow='none';
      host.dataset.firestoreSelftestHost='1';
      body.appendChild(host);
    }
    host.innerHTML=`<div class="card-head"><div><h2>Verificación Firestore</h2><p>Prueba viva del aislamiento multiusuario publicado.</p></div><span class="status ${lastResult?.pass?'teal':lastResult?'warn':''}">${lastResult?.pass?'VERIFICADO':lastResult?'REVISAR':'NO EJECUTADO'}</span></div><div class="card-body"><button type="button" class="btn secondary" data-firestore-selftest ${running?'disabled':''}>${running?'Verificando…':'Verificar reglas Firestore'}</button>${resultMarkup()}<p style="font-size:8px;line-height:1.5;color:var(--muted);margin-top:10px">La prueba no accede a producción, no modifica roles, no realiza ACK productivo y no intenta escribir documentos de otros usuarios.</p></div>`;
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('[data-firestore-selftest]'))run();
  });
  window.addEventListener('sana:cloud-state',()=>setTimeout(renderIntoAccount,0));
  window.addEventListener('sana:firestore-selftest',()=>setTimeout(renderIntoAccount,0));
  const observer=new MutationObserver(()=>renderIntoAccount());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{subtree:true,childList:true}),{once:true});
  else observer.observe(document.body,{subtree:true,childList:true});

  window.__SANA_FIRESTORE_SELFTEST__=Object.freeze({run,get result(){return lastResult}});
})();
