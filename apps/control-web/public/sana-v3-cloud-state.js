(() => {
  'use strict';

  const FIREBASE_SDK_VERSION='12.16.0';
  const COLLECTION='demo_user_state';
  const ACTIVE_OWNER_KEY='sana.v3.activeOwner';
  const STATE_KEYS=[
    'sana.v3.tasks.done',
    'sana.v3.records',
    'sana.v3.offline.queue',
    'sana.v3.messages',
    'sana.v3.plan.reviews',
    'sana.v3.plan.selected',
    'sana.v3.characterization',
    'sana.v3.passport.lot',
    'sana.v3.capital.dossier',
    'sana.v3.economics',
    'sana.v3.impact.state',
    'sana.v3.mobile.last'
  ];

  const config=window.__SANA_DEMO_CONFIG__||{};
  let identity=window.__SANA_DEMO_IDENTITY__||null;
  if(!identity){try{identity=JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{identity=null}}
  const ownerId=identity?.id?`${identity.authProvider==='FIREBASE_AUTH'?'firebase':'local'}:${identity.id}`:'local:anonymous';
  const ownerToken=encodeURIComponent(ownerId);
  const scopeKey=key=>`sana.v3.scope.${ownerToken}.${key}`;
  const revisionKey=`sana.v3.cloud.revision.${ownerToken}`;
  const dirtyKey=`sana.v3.cloud.dirty.${ownerToken}`;
  const reloadPrefix='sana.v3.cloud.reloaded.';

  let status='LOCAL_ONLY';
  let detail=identity?.authProvider==='FIREBASE_AUTH'?'Preparando sincronización Firebase…':'Perfil local aislado; sin nube.';
  let connected=false;
  let conflict=false;
  let cloudClient=null;
  let pushTimer=null;
  let lastFingerprint='';

  function ownerScopeKey(owner,key){return `sana.v3.scope.${encodeURIComponent(owner)}.${key}`}
  function snapshotGlobal(){return STATE_KEYS.flatMap(key=>{const value=localStorage.getItem(key);return value===null?[]:[{key,value}]})}
  function fingerprint(payload=snapshotGlobal()){return JSON.stringify(payload)}
  function saveGlobalsToOwner(owner){if(!owner)return;for(const key of STATE_KEYS){const value=localStorage.getItem(key);const scoped=ownerScopeKey(owner,key);if(value===null)localStorage.removeItem(scoped);else localStorage.setItem(scoped,value)}}
  function loadOwnerToGlobals(owner){for(const key of STATE_KEYS){const scoped=ownerScopeKey(owner,key);const value=localStorage.getItem(scoped);if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}}
  function adoptGlobals(){for(const key of STATE_KEYS){const value=localStorage.getItem(key);if(value!==null)localStorage.setItem(scopeKey(key),value)}}
  function mirrorGlobals(){for(const key of STATE_KEYS){const value=localStorage.getItem(key);if(value===null)localStorage.removeItem(scopeKey(key));else localStorage.setItem(scopeKey(key),value)}}

  const previousOwner=localStorage.getItem(ACTIVE_OWNER_KEY);
  if(!previousOwner){adoptGlobals()}
  else if(previousOwner!==ownerId){saveGlobalsToOwner(previousOwner);loadOwnerToGlobals(ownerId)}
  localStorage.setItem(ACTIVE_OWNER_KEY,ownerId);
  mirrorGlobals();
  lastFingerprint=fingerprint();

  function setStatus(next,nextDetail=''){
    status=next;detail=nextDetail||detail;
    window.dispatchEvent(new CustomEvent('sana:cloud-state',{detail:{status,detail,ownerId,connected,conflict}}));
    updatePill();
  }

  function mountPill(){
    const host=document.querySelector('.top-actions');
    if(!host||document.getElementById('cloud-sync-pill'))return;
    const pill=document.createElement('button');
    pill.type='button';pill.id='cloud-sync-pill';pill.className='status-btn';
    pill.addEventListener('click',()=>{
      if(typeof window.toast==='function')window.toast('Estado de sincronización',detail,status==='CONFLICT'?'warn':'');
      else pill.title=detail;
    });
    host.insertBefore(pill,host.lastElementChild||null);
    updatePill();
  }
  function updatePill(){
    const pill=document.getElementById('cloud-sync-pill');if(!pill)return;
    const labels={LOCAL_ONLY:'Local',CONNECTING:'Conectando',SYNCING:'Sincronizando',SYNCED:'Nube DEMO',CONFLICT:'Conflicto',RULES_REQUIRED:'Reglas pendientes',ERROR:'Sin nube'};
    pill.innerHTML=`<i></i><span>${labels[status]||status}</span>`;
    pill.title=detail;
    pill.dataset.syncStatus=status;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountPill,{once:true});else mountPill();

  function payloadSize(payload){try{return new TextEncoder().encode(JSON.stringify(payload)).length}catch{return JSON.stringify(payload).length}}
  function knownRevision(){return Number(localStorage.getItem(revisionKey)||0)}
  function setKnownRevision(value){localStorage.setItem(revisionKey,String(Number(value)||0))}
  function isDirty(){return localStorage.getItem(dirtyKey)==='1'}
  function setDirty(value){if(value)localStorage.setItem(dirtyKey,'1');else localStorage.removeItem(dirtyKey)}

  function applyRemote(data){
    const entries=Array.isArray(data?.payload)?data.payload:[];
    const allowed=new Map(entries.filter(x=>x&&STATE_KEYS.includes(x.key)&&typeof x.value==='string').map(x=>[x.key,x.value]));
    for(const key of STATE_KEYS){
      const value=allowed.get(key);
      if(value===undefined){localStorage.removeItem(key);localStorage.removeItem(scopeKey(key))}
      else{localStorage.setItem(key,value);localStorage.setItem(scopeKey(key),value)}
    }
    setKnownRevision(data.revision||0);setDirty(false);lastFingerprint=fingerprint();
    const reloadKey=`${reloadPrefix}${ownerToken}.${data.revision||0}`;
    if(!sessionStorage.getItem(reloadKey)){
      sessionStorage.setItem(reloadKey,'1');
      location.reload();
    }
  }

  async function pushSnapshot(){
    if(!connected||!cloudClient||conflict||!isDirty())return;
    const payload=snapshotGlobal();
    if(payloadSize(payload)>650000){setStatus('ERROR','El estado local supera el límite seguro definido para esta DEMO. No se enviará a Firestore.');return}
    clearTimeout(pushTimer);pushTimer=null;setStatus('SYNCING','Guardando estado DEMO del usuario en Firestore…');
    const {db,user,firestore}=cloudClient;
    const ref=firestore.doc(db,COLLECTION,user.uid);
    const expected=knownRevision();
    try{
      const nextRevision=await firestore.runTransaction(db,async transaction=>{
        const snap=await transaction.get(ref);
        const remote=snap.exists()?snap.data():null;
        const remoteRevision=Number(remote?.revision||0);
        if(remoteRevision!==expected){const err=new Error('REMOTE_REVISION_CONFLICT');err.remote=remote;throw err}
        const next=remoteRevision+1;
        transaction.set(ref,{
          userId:user.uid,
          environment:'DEMO',
          schemaVersion:'1.0.0',
          revision:next,
          payload,
          clientUpdatedAtMs:Date.now(),
          lastWriterId:ownerId,
          updatedAt:firestore.serverTimestamp()
        });
        return next;
      });
      setKnownRevision(nextRevision);setDirty(false);mirrorGlobals();lastFingerprint=fingerprint();
      setStatus('SYNCED',`Estado DEMO sincronizado en Firestore · revisión ${nextRevision}.`);
    }catch(error){
      if(error?.message==='REMOTE_REVISION_CONFLICT'){
        conflict=true;setStatus('CONFLICT','Existe una versión más reciente en Firestore. La DEMO conserva tus cambios locales y no sobrescribe automáticamente la nube.');return;
      }
      const code=String(error?.code||'');
      if(code.includes('permission-denied')){setStatus('RULES_REQUIRED','Firebase está conectado, pero las reglas publicadas aún no permiten demo_user_state. Tus datos siguen aislados localmente.');return}
      setStatus('ERROR','No fue posible sincronizar con Firestore. El estado local se conserva y no se marca como ACK.');
    }
  }

  function schedulePush(delay=1200){if(!connected||conflict)return;clearTimeout(pushTimer);pushTimer=setTimeout(pushSnapshot,delay)}

  function pollLocalChanges(){
    const next=fingerprint();
    if(next===lastFingerprint)return;
    lastFingerprint=next;mirrorGlobals();setDirty(true);
    if(identity?.authProvider==='FIREBASE_AUTH')schedulePush();
    else setStatus('LOCAL_ONLY','Cambios guardados en el espacio local aislado de este perfil DEMO.');
  }
  const pollTimer=setInterval(pollLocalChanges,900);
  window.addEventListener('beforeunload',()=>{pollLocalChanges();mirrorGlobals()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){pollLocalChanges();if(connected)schedulePush(0)}});

  async function waitForUser(auth,authModule){
    if(auth.currentUser)return auth.currentUser;
    return new Promise(resolve=>{let off=()=>{};off=authModule.onAuthStateChanged(auth,user=>{off();resolve(user)})});
  }

  async function connectFirebase(){
    if(identity?.authProvider!=='FIREBASE_AUTH'){setStatus('LOCAL_ONLY','Perfil DEMO local con almacenamiento aislado por identidad.');return}
    if(!config.firebaseApiKey||!config.firebaseAuthDomain||!config.firebaseProjectId||!config.firebaseAppId){setStatus('ERROR','Falta configuración pública de Firebase; se mantiene almacenamiento local.');return}
    setStatus('CONNECTING','Validando sesión Firebase y estado remoto DEMO…');
    try{
      const base=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
      const [appModule,authModule,firestore]=await Promise.all([
        import(`${base}/firebase-app.js`),import(`${base}/firebase-auth.js`),import(`${base}/firebase-firestore.js`)
      ]);
      const cfg={apiKey:config.firebaseApiKey,authDomain:config.firebaseAuthDomain,projectId:config.firebaseProjectId,appId:config.firebaseAppId};
      const existing=appModule.getApps().find(app=>app.name==='sana-v3-state');
      const app=existing||appModule.initializeApp(cfg,'sana-v3-state');
      const auth=authModule.getAuth(app);
      const user=await waitForUser(auth,authModule);
      if(!user||user.uid!==identity.id){setStatus('ERROR','La sesión Firebase no coincide con la identidad DEMO local. No se sincronizará estado.');return}
      const db=firestore.getFirestore(app);cloudClient={db,user,firestore};connected=true;
      const ref=firestore.doc(db,COLLECTION,user.uid);
      const snap=await firestore.getDoc(ref);
      if(!snap.exists()){
        setKnownRevision(0);setDirty(true);await pushSnapshot();
      }else{
        const remote=snap.data();const remoteRevision=Number(remote?.revision||0);const localRevision=knownRevision();
        if(remote?.environment!=='DEMO'||remote?.userId!==user.uid){setStatus('ERROR','El documento remoto no cumple la frontera DEMO/owner UID. Se ignora.');return}
        if(remoteRevision>localRevision){
          if(isDirty()){conflict=true;setStatus('CONFLICT','La nube contiene una revisión posterior y este navegador tiene cambios locales. Requiere revisión; no hay overwrite automático.');return}
          applyRemote(remote);return;
        }
        if(remoteRevision<localRevision){conflict=true;setStatus('CONFLICT','La revisión local y la remota no son compatibles. Se conserva el estado local sin sobrescribir Firestore.');return}
        if(isDirty())await pushSnapshot();else setStatus('SYNCED',`Estado DEMO conectado · revisión ${remoteRevision}.`);
      }

      firestore.onSnapshot(ref,snapshot=>{
        if(!snapshot.exists())return;
        const remote=snapshot.data();const remoteRevision=Number(remote?.revision||0);const localRevision=knownRevision();
        if(remoteRevision<=localRevision)return;
        if(isDirty()){conflict=true;setStatus('CONFLICT','Se recibió una revisión remota mientras existen cambios locales. Revisión manual requerida.');return}
        applyRemote(remote);
      },error=>{
        if(String(error?.code||'').includes('permission-denied'))setStatus('RULES_REQUIRED','Las reglas Firestore publicadas todavía no permiten el estado multiusuario. El modo local permanece disponible.');
      });
    }catch(error){
      const code=String(error?.code||'');
      if(code.includes('permission-denied'))setStatus('RULES_REQUIRED','Publica las reglas Firestore actualizadas para habilitar sincronización por usuario. El modo local sigue funcionando.');
      else setStatus('ERROR','Firebase no estuvo disponible; SANA conserva el estado local aislado.');
    }
  }

  window.__SANA_CLOUD_STATE__=Object.freeze({
    ownerId,
    keys:[...STATE_KEYS],
    get status(){return status},
    flush:async()=>{pollLocalChanges();if(connected&&!conflict)await pushSnapshot()},
    describe:()=>({status,detail,ownerId,connected,conflict,revision:knownRevision(),dirty:isDirty()})
  });

  connectFirebase();
})();
