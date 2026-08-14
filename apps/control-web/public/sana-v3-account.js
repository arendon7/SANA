(() => {
  'use strict';

  let identity=window.__SANA_DEMO_IDENTITY__||null;
  if(!identity){try{identity=JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{identity=null}}

  const labelForProvider=provider=>provider==='FIREBASE_AUTH'?'Firebase Email/Password':provider==='LOCAL_DEMO_PROFILE'?'Perfil instantáneo local':'Sesión DEMO';
  const safeEmail=value=>value&&value.includes('@demo.sana.local')?'Perfil sintético local':value||'Sin correo';

  function syncData(){
    const data=window.__SANA_CLOUD_STATE__?.describe?.();
    return data||{status:'LOCAL_ONLY',detail:'Sin sincronización cloud activa.',ownerId:'local',connected:false,conflict:false,revision:0,dirty:false};
  }

  function accessData(){
    const access=window.__SANA_ACCESS__;
    return access?{role:access.role,views:access.viewPolicy||[]}:{role:identity?.role||'new_user',views:[]};
  }

  function statusTone(status){return status==='SYNCED'?'teal':status==='CONFLICT'||status==='RULES_REQUIRED'?'warn':status==='ERROR'?'danger':''}
  function statusLabel(status){return ({SYNCED:'NUBE DEMO',SYNCING:'SINCRONIZANDO',CONNECTING:'CONECTANDO',CONFLICT:'CONFLICTO',RULES_REQUIRED:'REGLAS PENDIENTES',ERROR:'FALLBACK LOCAL',LOCAL_ONLY:'LOCAL_ONLY'})[status]||status}

  function accountBody(){
    const sync=syncData();const access=accessData();
    const cloudEligible=identity?.authProvider==='FIREBASE_AUTH';
    return `<div class="grid two"><section><div class="section-note"><strong>${esc(identity?.displayName||'Usuario SANA')}</strong><br>${esc(safeEmail(identity?.email))}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><tbody><tr><th>Proveedor</th><td>${esc(labelForProvider(identity?.authProvider))}</td></tr><tr><th>Rol efectivo</th><td><span class="status">${esc(access.role)}</span></td></tr><tr><th>Entorno</th><td>DEMO</td></tr><tr><th>Cuenta cloud</th><td>${cloudEligible?'Sí · owner UID':'No · perfil local aislado'}</td></tr><tr><th>Elevación de rol</th><td>NO DISPONIBLE EN BROWSER</td></tr></tbody></table></div></section><section><div class="card" style="box-shadow:none"><div class="card-head"><div><h2>Estado de datos</h2><p>Persistencia e integridad de esta identidad.</p></div><span class="status ${statusTone(sync.status)}">${statusLabel(sync.status)}</span></div><div class="card-body"><div class="mini-list"><div class="mini-row"><span>Revisión conocida</span><b>${sync.revision||0}</b></div><div class="mini-row"><span>Cambios locales</span><b>${sync.dirty?'Sí':'No'}</b></div><div class="mini-row"><span>Conexión Firestore</span><b>${sync.connected?'Activa':'No activa'}</b></div><div class="mini-row"><span>Conflicto</span><b>${sync.conflict?'Revisión requerida':'No'}</b></div></div><p style="font-size:9px;line-height:1.55;color:var(--muted);margin-top:12px">${esc(sync.detail||'')}</p>${cloudEligible?'<button type="button" class="btn secondary" style="margin-top:10px" data-account-flush>Sincronizar ahora</button>':''}</div></div></section></div>
      <section class="card" style="margin-top:12px;box-shadow:none"><div class="card-head"><div><h2>Alcance de esta cuenta</h2><p>Las vistas se calculan a partir del rol persistido; ocultar una pantalla no sustituye el guard de acciones.</p></div></div><div class="card-body"><div class="chip-row">${access.views.length?access.views.map(v=>`<span class="chip">${esc(v)}</span>`).join(''):'<span class="chip">Onboarding limitado</span>'}</div></div></section>
      <section class="card" style="margin-top:12px;box-shadow:none"><div class="card-head"><div><h2>Frontera inmutable</h2><p>Independiente de tu rol DEMO.</p></div></div><div class="card-body"><div class="gate"><i class="blocked">×</i><div><strong>Producción / activación</strong><p>productionExecutionAvailable=false · D10=PENDING.</p></div><span class="status danger">BLOQUEADO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Mutación canónica</strong><p>canonicalMutated=false; la nube DEMO no es ACK productivo.</p></div><span class="status danger">BLOQUEADO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Dinero / custodia</strong><p>No hay captación, custodia, desembolso ni movimiento financiero.</p></div><span class="status danger">$0</span></div></div></section>`;
  }

  function openAccount(){
    if(typeof openModal!=='function')return;
    openModal('SANA DEMO · CUENTA','Mi cuenta y sincronización',accountBody(),false,'account');
  }

  function mount(){
    const pill=document.querySelector('.role-pill');
    if(pill&&!pill.dataset.accountReady){
      pill.dataset.accountReady='1';pill.tabIndex=0;pill.setAttribute('role','button');pill.setAttribute('aria-label','Abrir mi cuenta y permisos');pill.style.cursor='pointer';
      pill.addEventListener('click',openAccount);
      pill.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openAccount()}});
    }
  }

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-account-flush]');if(!button)return;
    button.disabled=true;button.textContent='Sincronizando…';
    try{await window.__SANA_CLOUD_STATE__?.flush?.();if(typeof toast==='function')toast('Sincronización DEMO','Se solicitó flush del estado. Revisa el indicador de nube para confirmar el resultado.')}catch{if(typeof toast==='function')toast('Sincronización DEMO','No fue posible completar el flush; los datos locales se conservan.','warn')}
    const modal=document.getElementById('modal');if(modal?.open)modal.close();
  });

  window.addEventListener('sana:cloud-state',()=>{const modal=document.getElementById('modal');if(modal?.open&&document.getElementById('modal-title')?.textContent==='Mi cuenta y sincronización')document.getElementById('modal-body').innerHTML=accountBody()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
