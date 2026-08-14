(() => {
  'use strict';

  let activeIdentity=window.__SANA_DEMO_IDENTITY__||null;
  if(!activeIdentity){try{activeIdentity=JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{activeIdentity=null}}
  const rawRole=String(activeIdentity?.role||'new_user').toLowerCase();
  const role=rawRole.includes('admin')?'admin':rawRole.includes('technical')||rawRole.includes('técn')?'technical':rawRole.includes('producer')||rawRole.includes('productor')?'producer':rawRole.includes('invest')?'investor':rawRole.includes('visitor')||rawRole.includes('guest')?'visitor':'new_user';

  const FLOWS={
    new_user:[
      {id:'welcome',title:'Entender qué es DEMO',desc:'Revisa límites: datos sintéticos, sin producción, sin dinero y sin autopromoción de rol.',view:'home',action:'Volver a bienvenida'},
      {id:'baseline',title:'Contar cómo es tu unidad',desc:'Completa la caracterización con lo que sabes y separa declarado, observado y evidencia.',view:'characterization',action:'Abrir caracterización'},
      {id:'evidence',title:'Entender la trazabilidad',desc:'Mira Passport para aprender cómo SANA diferencia contexto, actividad, prueba y resultado.',view:'passport',action:'Ver Passport'},
      {id:'account',title:'Revisar tu cuenta',desc:'Confirma identidad, rol y estado Local/Nube DEMO antes de continuar.',account:true,action:'Abrir Mi cuenta'}
    ],
    producer:[
      {id:'baseline',title:'1 · Revisar mi línea base',desc:'Confirma que finca, agua, suelo, manejo, riesgos y comercialización reflejen la situación DEMO.',view:'characterization',action:'Revisar caracterización'},
      {id:'material',title:'2 · Registrar el origen del material',desc:'Conecta semilla/plántula/injerto con vivero, lote y responsable.',view:'material',action:'Abrir material vegetal'},
      {id:'today',title:'3 · Registrar lo que pasó hoy',desc:'Usa Campo móvil para actividad, observación o evidencia incluso con conectividad limitada.',view:'field',action:'Abrir Campo móvil'},
      {id:'support',title:'4 · Pedir acompañamiento',desc:'Si hay una duda técnica, crea un caso con Agrónomo en lugar de resolverla solo por una alerta.',view:'advisory',action:'Abrir acompañamiento'},
      {id:'proof',title:'5 · Confirmar que quedó evidencia',desc:'Reconstruye la historia del lote y detecta si falta una prueba o compromiso.',view:'passport',action:'Ver Passport'},
      {id:'result',title:'6 · Cerrar con resultado',desc:'Cuando corresponda, registra cosecha/resultado sin convertir escenarios en ventas reales.',view:'results',action:'Abrir resultados'}
    ],
    technical:[
      {id:'context',title:'1 · Entender el contexto',desc:'Lee caracterización, riesgos y evidencia antes de emitir criterio.',view:'characterization',action:'Abrir línea base'},
      {id:'plan',title:'2 · Revisar el plan vigente',desc:'Confirma versión, fase, variables y gates antes de recomendar ajustes.',view:'plans',action:'Abrir planes'},
      {id:'signals',title:'3 · Contrastar señales',desc:'Revisa campo, sanidad e IoT; una lectura aislada no debe gobernar una decisión.',view:'iot',action:'Abrir IoT'},
      {id:'visit',title:'4 · Documentar visita o caso',desc:'Separa observación, hallazgo, recomendación humana, compromiso y evidencia.',view:'advisory',action:'Abrir acompañamiento'},
      {id:'inputs',title:'5 · Revisar necesidades del ciclo',desc:'Contrasta proyección de insumos contra inventario sin generar compras automáticas.',view:'forecast',action:'Abrir proyección'},
      {id:'audit',title:'6 · Auditar la cadena',desc:'Usa Passport e Informes para verificar que el corte tenga fuentes y versiones.',view:'passport',action:'Auditar Passport'}
    ],
    admin:[
      {id:'people',title:'1 · Verificar contexto y roles',desc:'Asegura que la cuenta y el alcance DEMO correspondan al recorrido esperado.',account:true,action:'Abrir Mi cuenta'},
      {id:'baseline',title:'2 · Revisar caracterización',desc:'Prioriza brechas de línea base antes de leer scores o escenarios.',view:'characterization',action:'Abrir caracterización'},
      {id:'operation',title:'3 · Revisar operación',desc:'Cruza tareas, planes, material, IoT, inventarios y acompañamiento.',view:'field',action:'Abrir operación'},
      {id:'evidence',title:'4 · Revisar evidencia',desc:'Usa Passport e Informes para comprobar procedencia y cortes.',view:'passport',action:'Abrir Passport'},
      {id:'readiness',title:'5 · Revisar impacto/readiness',desc:'Lee indicadores y brechas sin convertirlos en aprobación o transacción.',view:'capital',action:'Abrir readiness'}
    ]
  };

  function steps(){return FLOWS[role]||FLOWS.new_user}
  function completions(){return new Set(storage.records.filter(r=>r.type==='guided-checkpoint').map(r=>r.values?.stepId).filter(Boolean))}
  function network(){
    const cloud=window.__SANA_CLOUD_STATE__?.describe?.();
    return {online:navigator.onLine,cloud:cloud?.status||'LOCAL_ONLY',revision:cloud?.revision||0,dirty:Boolean(cloud?.dirty)};
  }

  function guided(){
    const flow=steps(),done=completions(),net=network();const count=flow.filter(s=>done.has(s.id)).length;const pct=Math.round(count/flow.length*100);
    const next=flow.find(s=>!done.has(s.id))||flow[flow.length-1];
    return `${head('SANA · MODO GUIADO','Una acción clara a la vez.','Este recorrido traduce la operación a pasos cortos para campo y baja conectividad. No reemplaza capacitación técnica ni autoridad humana; ayuda a saber qué hacer después y qué evidencia dejar.',`<button class="btn primary" data-guide-open="${next.id}">${count===flow.length?'Revisar recorrido':'Continuar donde iba'}</button>`)}
      <section class="guided-status"><article><small>PROGRESO DE ESTA IDENTIDAD</small><strong>${pct}%</strong><span>${count} de ${flow.length} pasos marcados</span><div class="progress"><i style="width:${pct}%"></i></div></article><article><small>CONECTIVIDAD</small><strong>${net.online?'En línea':'Sin red'}</strong><span>${esc(net.cloud)} · rev ${net.revision}${net.dirty?' · cambios locales':''}</span><p>${net.online?'Puedes trabajar normalmente; confirma Nube DEMO antes de asumir sincronización.':'Puedes seguir capturando en el dispositivo. LOCAL_ONLY no equivale a sincronizado ni ACK.'}</p></article></section>
      <section class="guided-grid" style="margin-top:14px">${flow.map((s,i)=>stepCard(s,i,done.has(s.id))).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Reglas del modo campo</h2><p>Diseñado para reducir errores de uso, no para ocultar complejidad.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>Una acción principal</strong><p>Evita menús dentro de menús durante captura en campo.</p></div><span class="status">UX</span></div><div class="gate"><i>2</i><div><strong>Guardar antes de depender de red</strong><p>El dato puede permanecer LOCAL_ONLY hasta que haya sincronización válida.</p></div><span class="status warn">OFFLINE</span></div><div class="gate"><i>3</i><div><strong>Separar observar de decidir</strong><p>Una lectura, foto o alerta no reemplaza el criterio técnico.</p></div><span class="status">HUMAN</span></div></div></article><article class="card"><div class="card-head"><div><h2>Necesitas ayuda</h2><p>El soporte debe quedar conectado con el trabajo real.</p></div></div><div class="card-body"><div class="section-note"><strong>Productor/Técnico:</strong> usa Acompañamiento para una duda agronómica y conviértela en caso trazable.<br><strong>Usuario nuevo:</strong> termina caracterización y revisa Mi cuenta; crear la cuenta no asigna privilegios operativos.</div><div class="quick-grid" style="grid-template-columns:1fr 1fr;margin-top:12px">${role==='new_user'?'<button class="quick" data-view-link="characterization"><strong>Caracterización</strong><span>Completar contexto.</span></button>':'<button class="quick" data-view-link="advisory"><strong>Acompañamiento</strong><span>Caso técnico / visita.</span></button>'}<button class="quick" data-guide-account><strong>Mi cuenta</strong><span>Rol, nube y seguridad.</span></button></div></div></article></section>${footer()}`;
  }

  function stepCard(step,index,isDone){
    return `<article class="guided-step ${isDone?'done':''}" data-guide-step="${step.id}"><header><span>${String(index+1).padStart(2,'0')}</span><div><strong>${esc(step.title)}</strong><small>${isDone?'MARCADO EN ESTA IDENTIDAD':'SIGUIENTE ACCIÓN DEMO'}</small></div><b>${isDone?'✓':'→'}</b></header><p>${esc(step.desc)}</p><footer><button class="btn secondary" data-guide-open="${step.id}">${esc(step.action)}</button><button class="guided-check" data-guide-complete="${step.id}">${isDone?'Marcar pendiente':'Marcar hecho'}</button></footer></article>`;
  }

  views.guide=guided;

  function findStep(id){return steps().find(s=>s.id===id)}
  function openStep(id){const step=findStep(id);if(!step)return;if(step.account){document.querySelector('.role-pill')?.click();return}if(step.view&&typeof window.go==='function')window.go(step.view)}
  function toggle(id){
    const done=completions();
    if(done.has(id)){
      const idx=storage.records.findIndex(r=>r.type==='guided-checkpoint'&&r.values?.stepId===id);if(idx>=0){storage.records.splice(idx,1);storage.persist()}
    }else{
      const step=findStep(id);storage.add('guided-checkpoint',{stepId:id,title:step?.title||id,role,completedAt:new Date().toISOString(),integrity:'LOCAL/NUBE DEMO · NO ES CERTIFICACIÓN DE CAPACITACIÓN'},'GUIDE');
    }
    if(typeof render==='function')render();
  }

  document.addEventListener('click',event=>{
    const open=event.target.closest('[data-guide-open]');if(open){openStep(open.dataset.guideOpen);return}
    const complete=event.target.closest('[data-guide-complete]');if(complete){toggle(complete.dataset.guideComplete);return}
    if(event.target.closest('[data-guide-account]'))document.querySelector('.role-pill')?.click();
  });
})();
