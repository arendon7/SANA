(() => {
  'use strict';

  const LAYERS=[
    {id:'water',name:'Fuentes de agua',variables:[['Temperatura','22.4 °C','OBSERVADO DEMO'],['pH','6.4','OBSERVADO DEMO'],['Electroconductividad','0.82 mS/cm','OBSERVADO DEMO']],status:'3/3 variables modeladas'},
    {id:'environment',name:'Ambiente',variables:[['Temperatura','24.8 °C','OBSERVADO DEMO'],['Humedad relativa','71 %','OBSERVADO DEMO'],['CO₂','428 ppm','OBSERVADO DEMO'],['Radiación solar directa','612 W/m²','ESTIMACIÓN DEMO'],['Radiación solar indirecta','184 W/m²','ESTIMACIÓN DEMO']],status:'5/5 variables modeladas'},
    {id:'soil',name:'Suelo',variables:[['Temperatura','21.6 °C','OBSERVADO DEMO'],['Humedad','43 %','OBSERVADO DEMO'],['Electroconductividad','1.12 mS/cm','OBSERVADO DEMO'],['Fósforo','—','SIN SENSOR REAL'],['Potasio','—','SIN SENSOR REAL'],['Nitrógeno','—','SIN SENSOR REAL']],status:'3 observadas · 3 sin sensor real'}
  ];

  function latestLocal(){return storage.records.filter(r=>r.type==='sensor').slice(-6).reverse()}

  function sourceIot(){
    const local=latestLocal();
    return `${head('AGROWAY · IOT Y CAPTURA OFFLINE','La matriz original de variables, con procedencia visible.','La especificación histórica de AGROWAY separa agua, ambiente y suelo. SANA conserva esa matriz, pero ninguna lectura aislada autoriza manejo agronómico y los valores DEMO no se presentan como telemetría real.',`<button class="btn primary" data-iot-source-reading>Registrar lectura DEMO</button>`)}
      <section class="grid metrics">${metric('Capas instrumentables','3','agua · ambiente · suelo','good')}${metric('Variables fuente','14','definidas en AGROWAY histórico','good')}${metric('Lecturas usuario',local.length,'persisten por identidad',local.length?'good':'warn')}${metric('Decisiones automáticas','0','HUMAN_REVIEW_REQUIRED','warn')}</section>
      <section class="grid three">${LAYERS.map(layer=>`<article class="card"><div class="card-head"><div><h2>${esc(layer.name)}</h2><p>${esc(layer.status)}</p></div><span class="status">SOURCE MATRIX</span></div><div class="card-body">${layer.variables.map(v=>`<div class="mini-row"><span>${esc(v[0])}</span><b>${esc(v[1])}</b><small>${esc(v[2])}</small></div>`).join('')}</div></article>`).join('')}</section>
      <section class="grid split" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Humedad suelo · AGU-A2</h2><p>Serie sintética usada para demostrar tendencia y no para ejecutar riego.</p></div><span class="status warn">DEMO</span></div><div class="card-body">${chart()}<div class="section-note" style="margin-top:12px">AGROWAY planteaba dispositivos IoT para apoyar decisiones en tiempo real. En SANA, la lectura alimenta observación y alerta; la decisión técnica permanece en una persona responsable.</div></div></article><article class="card"><div class="card-head"><div><h2>Lecturas registradas por esta cuenta</h2><p>Estado multiusuario / nube DEMO según sincronización.</p></div></div><div class="card-body">${local.length?local.map(r=>`<div class="row"><span class="dot"></span><div class="copy"><strong>${esc(r.values?.variable||r.title||'Lectura')}</strong><span>${esc(r.lot)} · ${esc(r.values?.value||'—')} ${esc(r.values?.unit||'')}</span></div><div class="meta">${new Date(r.createdAt).toLocaleDateString('es-CO')}<br><span class="status">LOCAL/NUBE DEMO</span></div></div>`).join(''):'<div class="empty">Aún no has registrado lecturas con esta identidad.</div>'}<div class="section-note" style="margin-top:12px">Una lectura creada en esta DEMO es un registro del usuario, no un dato certificado por hardware, laboratorio o proveedor externo.</div></div></article></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Contrato de captura</h2><p>Qué debe conservar cada lectura.</p></div></div><div class="card-body"><div class="flow"><div class="flow-step"><b>01</b><span>Fuente</span><small>sensor / manual</small></div><div class="flow-step"><b>02</b><span>Variable</span><small>unidad explícita</small></div><div class="flow-step"><b>03</b><span>Ubicación</span><small>lote / punto</small></div><div class="flow-step"><b>04</b><span>Momento</span><small>fecha y hora</small></div><div class="flow-step"><b>05</b><span>Calidad</span><small>observado / estimado</small></div><div class="flow-step"><b>06</b><span>Uso</span><small>alerta / revisión humana</small></div></div></div></section>${footer()}`;
  }

  views.iot=sourceIot;

  function openReading(){
    const lotOptions=DEMO.lots.map(l=>`<option value="${l.id}">${l.id} · ${esc(l.crop)}</option>`).join('');
    const variableOptions=LAYERS.flatMap(layer=>layer.variables.map(v=>`${layer.name} · ${v[0]}`)).map(v=>`<option>${esc(v)}</option>`).join('');
    const body=`<div class="fields"><label>Lote<select name="lot">${lotOptions}</select></label><label>Variable<select name="variable">${variableOptions}</select></label><label>Valor<input name="value" type="number" step="0.01" required></label><label>Unidad<input name="unit" placeholder="%, °C, pH, mS/cm, ppm..."></label><label>Fuente<select name="source"><option>Lectura manual DEMO</option><option>Sensor DEMO</option><option>Dato importado DEMO</option></select></label><label>Calidad<select name="quality"><option>OBSERVADO DEMO</option><option>ESTIMACIÓN DEMO</option><option>PENDIENTE VERIFICACIÓN</option></select></label><label class="full">Contexto / observación<textarea name="detail" placeholder="Punto de lectura, condición y motivo de captura..."></textarea></label><label class="full">Autoridad<input value="HUMAN_REVIEW_REQUIRED · NO EJECUTA MANEJO" readonly></label></div>`;
    openModal('IOT / CAPTURA · AGROWAY','Registrar lectura DEMO',body,true,'sensor');
  }

  document.addEventListener('click',event=>{if(event.target.closest('[data-iot-source-reading]'))openReading()});
})();
