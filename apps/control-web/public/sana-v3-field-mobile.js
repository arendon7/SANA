(() => {
  'use strict';

  function fieldRole(){
    const role=String(identity?.role||'admin').toLowerCase();
    if(role.includes('producer'))return {name:'Productor',lead:'Registrar lo esencial sin navegar por toda la plataforma.',actions:[['fieldRecord','Actividad'],['phenology','Fenología'],['health','Sanidad']]};
    if(role.includes('technical'))return {name:'Técnico',lead:'Priorizar señales, visitas y evidencia antes de recomendar cambios.',actions:[['visit','Visita'],['health','Sanidad'],['nutrition','Nutrición'],['sensor','Lectura']]};
    return {name:'Administrador',lead:'Ver operación, pendientes y cola local con contexto completo.',actions:[['fieldRecord','Actividad'],['visit','Visita'],['inventory','Inventario'],['sensor','Lectura']]};
  }

  function dueToday(t){return /Hoy/i.test(t.when)}
  function connection(){return navigator.onLine?{label:'EN LÍNEA',tone:'teal',detail:'El navegador tiene conectividad. La DEMO sigue sin transporte productivo.'}:{label:'SIN RED',tone:'warn',detail:'Captura local disponible. Ningún registro recibirá ACK hasta existir servidor válido.'}}
  function queueState(){const count=storage.queue.length;return count?`${count} pendiente(s) LOCAL_ONLY`:'Sin pendientes locales'}

  function fieldMobile(){
    const role=fieldRole();
    const conn=connection();
    const today=DEMO.tasks.filter(dueToday);
    const done=today.filter(t=>storage.done.has(t.id)).length;
    return `${head('AGROWAY · CAMPO MÓVIL','Registrar primero; administrar después.',`${role.name}: ${role.lead}`,`<button class="btn primary" data-action="fieldRecord">Captura rápida</button>`)}
      <section class="field-mobile-hero"><article><small>JORNADA · 14 AGO · FINCA LA ESPERANZA</small><h2>${today.length-done} pendientes hoy</h2><p>${done} cerradas en este navegador · ${queueState()}</p><div class="field-mobile-status"><span class="status ${conn.tone}">${conn.label}</span><span class="status warn">${storage.queue.length} PENDING_SERVER</span><span class="status">${esc(role.name.toUpperCase())}</span></div></article><aside><strong>Contrato offline</strong><p>${esc(conn.detail)}</p><small>LOCAL_ONLY ≠ SYNCED ≠ ACK</small></aside></section>
      <section class="field-quick-actions">${role.actions.map(([action,label])=>`<button data-action="${action}"><span>+</span><strong>${esc(label)}</strong><small>Guardar en sandbox</small></button>`).join('')}</section>
      <section class="field-mobile-grid"><article class="card"><div class="card-head"><div><h2>Lo que toca hoy</h2><p>Una lista corta para trabajar desde el lote.</p></div><span class="status ${done===today.length?'teal':'warn'}">${done}/${today.length}</span></div><div class="card-body field-task-stack">${today.map(t=>{const closed=storage.done.has(t.id);return `<button class="field-task ${closed?'done':''}" data-task="${t.id}"><span>${closed?'✓':'○'}</span><div><strong>${esc(t.title)}</strong><small>${esc(t.lot)} · ${esc(t.owner)} · ${esc(t.when)}</small><em>Evidencia: ${esc(t.evidence)}</em></div><b class="status ${closed?'teal':statusClass(t.priority)}">${closed?'HECHA':esc(t.priority)}</b></button>`}).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Cola offline</h2><p>Eventos guardados localmente, sin afirmar sincronización.</p></div><span class="status warn">${storage.queue.length}</span></div><div class="card-body offline-queue">${queueRows()}<div class="offline-contract"><div><span>1</span><strong>LOCAL_READY</strong><small>Formulario y shell disponibles.</small></div><div><span>2</span><strong>PENDING_SERVER</strong><small>Registro guardado en dispositivo.</small></div><div><span>3</span><strong>ACK_REQUIRED</strong><small>Solo un servidor válido podrá confirmar.</small></div></div></div></article></section>
      <section class="field-mobile-grid" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Señales para revisar</h2><p>No disparan acciones automáticas.</p></div></div><div class="card-body"><div class="gate"><i class="warn">!</i><div><strong>AGU-A2 · humedad 43%</strong><p>Verificar varios puntos antes de fertirriego.</p></div><span class="status danger">ALTA</span></div><div class="gate"><i class="warn">!</i><div><strong>CAC-B1 · monilia</strong><p>Condición climática de vigilancia; no incidencia confirmada.</p></div><span class="status warn">VIGILAR</span></div><div class="gate"><i class="warn">!</i><div><strong>Bioinsumo K · 8 días</strong><p>Comparar consumo planificado contra conteo físico.</p></div><span class="status warn">STOCK</span></div></div></article><article class="card"><div class="card-head"><div><h2>Continuidad de evidencia</h2><p>Cada captura debería saber qué plan y prueba la explican.</p></div></div><div class="card-body"><div class="workflow field-mini-flow"><div class="stage done"><span class="num">1</span><strong>Plan</strong><span>Qué se esperaba</span></div><div class="stage current"><span class="num">2</span><strong>Campo</strong><span>Qué ocurrió</span></div><div class="stage"><span class="num">3</span><strong>Evidencia</strong><span>Qué lo prueba</span></div><div class="stage"><span class="num">4</span><strong>Revisión</strong><span>Qué cambia</span></div></div><div class="quick-grid" style="grid-template-columns:1fr 1fr;margin-top:12px"><button class="quick" data-view-link="plans"><strong>Ver plan</strong><span>Contexto y gates.</span></button><button class="quick" data-view-link="passport"><strong>Ver Passport</strong><span>Historia reconstruible.</span></button></div></div></article></section>${footer()}`;
  }

  views.field=fieldMobile;

  window.addEventListener('online',()=>{if(currentView==='field'&&typeof render==='function')render()});
  window.addEventListener('offline',()=>{if(currentView==='field'&&typeof render==='function')render()});
})();
