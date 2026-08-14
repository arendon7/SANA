(() => {
  'use strict';

  const STORAGE_KEY = 'sana.demo.v3.state';
  const ROLE_KEY = 'sana.demo.v3.role';
  const DEMO_NOTICE = 'Este cambio vive únicamente en tu sesión DEMO. No toca CONTROL, PostgreSQL ni dinero real.';

  const seed = {
    meta: { version: '3.0', program: 'Corredor Regenerativo Suroeste', region: 'Suroeste de Antioquia', updatedAt: '2026-08-14T20:00:00-05:00' },
    producers: [
      { id:'P-001', name:'María Elena Restrepo', municipality:'Támesis', phone:'300 555 0131', segment:'Café · Cacao', status:'Acompañamiento activo', score:86, farmId:'F-001' },
      { id:'P-002', name:'Jorge Iván Henao', municipality:'Jericó', phone:'300 555 0132', segment:'Café', status:'Acompañamiento activo', score:78, farmId:'F-002' },
      { id:'P-003', name:'Rosa Amelia Vélez', municipality:'Andes', phone:'300 555 0133', segment:'Café · Plátano', status:'Caracterización', score:61, farmId:'F-003' },
      { id:'P-004', name:'Luis Fernando Gil', municipality:'Fredonia', phone:'300 555 0134', segment:'Café', status:'Acompañamiento activo', score:73, farmId:'F-004' },
      { id:'P-005', name:'Ana Milena Cardona', municipality:'Valparaíso', phone:'300 555 0135', segment:'Cacao · Aguacate', status:'Pre-registro', score:48, farmId:'F-005' }
    ],
    farms: [
      { id:'F-001', producerId:'P-001', name:'El Porvenir', municipality:'Támesis', vereda:'San Luis', hectares:8.4, altitude:1640, lat:5.66, lng:-75.71, water:'Nacimiento protegido', tenure:'Propia', status:'Verificada' },
      { id:'F-002', producerId:'P-002', name:'La Primavera', municipality:'Jericó', vereda:'Palocabildo', hectares:5.7, altitude:1880, lat:5.79, lng:-75.79, water:'Acueducto veredal', tenure:'Propia', status:'Verificada' },
      { id:'F-003', producerId:'P-003', name:'La Esperanza', municipality:'Andes', vereda:'Santa Rita', hectares:11.2, altitude:1560, lat:5.66, lng:-75.88, water:'Quebrada', tenure:'Familiar', status:'Caracterización' },
      { id:'F-004', producerId:'P-004', name:'El Silencio', municipality:'Fredonia', vereda:'Marsella', hectares:6.1, altitude:1710, lat:5.92, lng:-75.67, water:'Nacimiento', tenure:'Propia', status:'Verificada' },
      { id:'F-005', producerId:'P-005', name:'La Ilusión', municipality:'Valparaíso', vereda:'La Fabiana', hectares:9.3, altitude:1420, lat:5.62, lng:-75.63, water:'Acueducto', tenure:'Arrendada', status:'Pre-registro' }
    ],
    lots: [
      { id:'L-001', farmId:'F-001', name:'Lote Norte', hectares:2.4, crop:'Café', variety:'Castillo', status:'Activo', soilHealth:81 },
      { id:'L-002', farmId:'F-001', name:'Lote Cacao', hectares:1.6, crop:'Cacao', variety:'ICS 95', status:'Activo', soilHealth:76 },
      { id:'L-003', farmId:'F-002', name:'El Alto', hectares:2.1, crop:'Café', variety:'Cenicafé 1', status:'Activo', soilHealth:72 },
      { id:'L-004', farmId:'F-003', name:'La Vega', hectares:3.8, crop:'Café', variety:'Castillo', status:'Diagnóstico', soilHealth:59 },
      { id:'L-005', farmId:'F-004', name:'Lote 3', hectares:2.7, crop:'Café', variety:'Colombia', status:'Activo', soilHealth:69 },
      { id:'L-006', farmId:'F-005', name:'Cacao Bajo', hectares:2.9, crop:'Cacao', variety:'Mixto', status:'Planeación', soilHealth:54 }
    ],
    cycles: [
      { id:'C-001', lotId:'L-001', crop:'Café', stage:'Desarrollo vegetativo', start:'2026-05-10', progress:68, plan:'Regeneración café 2026', status:'En seguimiento' },
      { id:'C-002', lotId:'L-002', crop:'Cacao', stage:'Floración', start:'2026-04-22', progress:74, plan:'Nutrición cacao 2026', status:'En seguimiento' },
      { id:'C-003', lotId:'L-003', crop:'Café', stage:'Llenado', start:'2026-03-12', progress:83, plan:'Eficiencia nutricional', status:'En seguimiento' },
      { id:'C-004', lotId:'L-004', crop:'Café', stage:'Diagnóstico', start:'2026-07-30', progress:21, plan:'Por asignar', status:'Diagnóstico' },
      { id:'C-005', lotId:'L-005', crop:'Café', stage:'Desarrollo', start:'2026-06-01', progress:57, plan:'Regeneración café 2026', status:'En seguimiento' }
    ],
    activities: [
      { id:'A-001', cycleId:'C-001', type:'Aplicación', title:'Aplicación 2Grow nitrogenado', due:'2026-08-05', owner:'María Elena Restrepo', status:'Completada', evidenceId:'E-001' },
      { id:'A-002', cycleId:'C-001', type:'Medición', title:'Lectura de vigor y cobertura', due:'2026-08-18', owner:'Equipo técnico', status:'Pendiente', evidenceId:null },
      { id:'A-003', cycleId:'C-002', type:'Aplicación', title:'Aplicación foliar de soporte', due:'2026-08-09', owner:'María Elena Restrepo', status:'Completada', evidenceId:'E-002' },
      { id:'A-004', cycleId:'C-003', type:'Visita', title:'Verificación de llenado', due:'2026-08-16', owner:'Equipo técnico', status:'Programada', evidenceId:null },
      { id:'A-005', cycleId:'C-004', type:'Diagnóstico', title:'Muestreo inicial de suelo', due:'2026-08-20', owner:'Equipo técnico', status:'Pendiente', evidenceId:null },
      { id:'A-006', cycleId:'C-005', type:'Aplicación', title:'Aplicación edáfica organomineral', due:'2026-08-12', owner:'Luis Fernando Gil', status:'Completada', evidenceId:'E-004' }
    ],
    visits: [
      { id:'V-001', farmId:'F-001', date:'2026-08-02', technician:'Carlos Andrés Uribe', purpose:'Seguimiento técnico', finding:'Buen vigor; reforzar cobertura en borde norte.', status:'Cerrada' },
      { id:'V-002', farmId:'F-002', date:'2026-08-16', technician:'Equipo técnico SANA', purpose:'Verificación de llenado', finding:'Pendiente de visita.', status:'Programada' },
      { id:'V-003', farmId:'F-003', date:'2026-08-20', technician:'Equipo técnico SANA', purpose:'Caracterización y suelo', finding:'Pendiente de visita.', status:'Programada' }
    ],
    evidences: [
      { id:'E-001', activityId:'A-001', producerId:'P-001', type:'Fotografía', title:'Aplicación lote norte', date:'2026-08-05', file:'IMG_DEMO_001.jpg', note:'Aplicación según recomendación técnica.', status:'Validada', validator:'Equipo técnico SANA' },
      { id:'E-002', activityId:'A-003', producerId:'P-001', type:'Fotografía', title:'Aplicación foliar cacao', date:'2026-08-09', file:'IMG_DEMO_002.jpg', note:'Cobertura homogénea, sin lluvia inmediata.', status:'Pendiente', validator:null },
      { id:'E-003', activityId:null, producerId:'P-002', type:'Documento', title:'Caracterización productiva', date:'2026-07-18', file:'CARACTERIZACION_DEMO.pdf', note:'Ficha de línea base.', status:'Validada', validator:'Equipo técnico SANA' },
      { id:'E-004', activityId:'A-006', producerId:'P-004', type:'Fotografía', title:'Aplicación organomineral', date:'2026-08-12', file:'IMG_DEMO_004.jpg', note:'Registro por lote y dosis.', status:'Pendiente', validator:null }
    ],
    milestones: [
      { id:'H-001', title:'Caracterización y elegibilidad', amount:1800000, status:'Verificado', evidence:'Línea base + predio', progress:100 },
      { id:'H-002', title:'Implementación del plan técnico', amount:2600000, status:'En seguimiento', evidence:'Actividades + aplicaciones', progress:72 },
      { id:'H-003', title:'Verificación de resultado', amount:2200000, status:'No habilitado', evidence:'Indicadores comparables', progress:34 },
      { id:'H-004', title:'Cierre e impacto', amount:1400000, status:'No habilitado', evidence:'Reporte de cierre', progress:12 }
    ],
    documents: [
      { id:'D-001', type:'Ficha', title:'Caracterización · El Porvenir', related:'F-001', date:'2026-06-12', status:'Vigente' },
      { id:'D-002', type:'Plan', title:'Plan técnico · Regeneración café 2026', related:'C-001', date:'2026-06-15', status:'Vigente' },
      { id:'D-003', type:'Consentimiento', title:'Autorización de datos DEMO', related:'P-001', date:'2026-06-12', status:'Vigente' },
      { id:'D-004', type:'Reporte', title:'Seguimiento técnico · agosto', related:'F-001', date:'2026-08-02', status:'Borrador' }
    ],
    impact: { hectares:27.8, producers:5, soilCoverage:68, organicCircularity:11.4, technicalVisits:14, evidenceRate:78, carbonLabel:'Línea base en construcción', waterActions:7 }
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const load = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : clone(seed); } catch { return clone(seed); } };
  let state = load();
  let role = localStorage.getItem(ROLE_KEY) || 'admin';
  let page = 'home';

  const navGroups = [
    { label:'Visión', items:[['home','⌂','Inicio'],['territory','◎','Territorio']] },
    { label:'Operación de campo', items:[['producers','◉','Productores'],['farms','◇','Predios y lotes'],['cycles','↻','Cultivos y ciclos'],['plan','✓','Plan técnico'],['trace','≋','Bitácora y visitas'],['evidence','▣','Evidencias']] },
    { label:'Valor e impacto', items:[['finance','◌','Financiación DEMO'],['impact','△','Impacto'],['documents','▤','Documentos']] }
  ];

  const roleCopy = {
    admin:{ title:'El territorio productivo, conectado de extremo a extremo.', text:'Coordina productores, predios, ciclos, acompañamiento, evidencia, impacto y gobernanza desde una sola vista.' },
    technical:{ title:'Acompañar mejor empieza por saber qué pasa en cada lote.', text:'Prioriza visitas, actividades pendientes, evidencias por validar y alertas del plan técnico.' },
    producer:{ title:'Tu finca, tu plan y tu avance en un solo lugar.', text:'Consulta las próximas actividades, el acompañamiento técnico y la evidencia que construye la historia de tu producción.' },
    investor:{ title:'Invertir en producción real exige evidencia verificable.', text:'Sigue hitos, trazabilidad técnica e impacto. Toda financiación mostrada en esta versión es exclusivamente DEMO.' },
    visitor:{ title:'Producción regenerativa con trazabilidad desde el territorio.', text:'Explora cómo SANA conecta conocimiento, productores, evidencia e impacto en una misma infraestructura.' }
  };

  const $ = sel => document.querySelector(sel);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
  const shortDate = value => { try { return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${value}T12:00:00`)); } catch { return value; } };
  const uid = prefix => `${prefix}-${String(Date.now()).slice(-6)}`;
  const initials = name => String(name).split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const statusClass = s => /valid|verific|complet|cerrad|activo|vigente/i.test(s)?'good':/pend|program|seguimiento|caracter/i.test(s)?'warn':/no habil|rechaz|bloq/i.test(s)?'bad':'pending';
  const persist = () => { state.meta.updatedAt = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); };
  const producerBy = id => state.producers.find(x=>x.id===id);
  const farmBy = id => state.farms.find(x=>x.id===id);
  const lotBy = id => state.lots.find(x=>x.id===id);
  const cycleBy = id => state.cycles.find(x=>x.id===id);

  function toast(title, message=DEMO_NOTICE){ const el=document.createElement('div'); el.className='toast'; el.innerHTML=`<b>${esc(title)}</b><small>${esc(message)}</small>`; $('#toastStack').appendChild(el); setTimeout(()=>el.remove(),4200); }

  function renderNav(){
    $('#mainNav').innerHTML = navGroups.map(group => `<div class="nav-group-label">${group.label}</div>${group.items.map(([key,icon,label])=>`<button data-nav="${key}" class="${page===key?'active':''}"><span class="nav-icon">${icon}</span>${label}${key==='evidence'&&state.evidences.some(e=>e.status==='Pendiente')?`<span class="badge">${state.evidences.filter(e=>e.status==='Pendiente').length}</span>`:''}</button>`).join('')}`).join('');
  }

  function head(title, eyebrow, text, actions=''){ return `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${text}</p></div><div class="page-actions">${actions}</div></div>`; }
  const metric = (label,value,delta='') => `<article class="metric"><div class="label">${label}</div><div class="value">${value}</div>${delta?`<div class="delta">${delta}</div>`:''}</article>`;
  const status = value => `<span class="status ${statusClass(value)}">${esc(value)}</span>`;

  function renderHome(){
    const copy=roleCopy[role]; const active=state.activities.filter(a=>a.status!=='Completada').length; const validated=state.evidences.filter(e=>e.status==='Validada').length; const totalEvidence=state.evidences.length||1; const progress=Math.round(state.cycles.reduce((a,c)=>a+c.progress,0)/(state.cycles.length||1));
    return `<section class="hero"><article class="hero-main"><span class="eyebrow">SANA · ${esc(roleLabel(role))}</span><h1>${copy.title}</h1><p>${copy.text}</p><div class="hero-actions"><button class="primary" data-action="quick-start">${role==='technical'?'Registrar visita':role==='producer'?'Ver mi plan':role==='investor'?'Explorar hitos':'Crear registro'}</button><button class="ghost" data-nav="territory">Explorar territorio</button></div></article><aside class="hero-side"><span class="eyebrow">Salud del programa</span><h3>Avance trazable</h3><div class="progress-ring" style="--pct:${progress}%"><div><b>${progress}%</b><span>avance medio</span></div></div><div class="mini-list"><div class="mini-row"><span>Actividades abiertas</span><b>${active}</b></div><div class="mini-row"><span>Evidencias validadas</span><b>${validated}/${totalEvidence}</b></div><div class="mini-row"><span>Predios verificados</span><b>${state.farms.filter(f=>f.status==='Verificada').length}/${state.farms.length}</b></div></div></aside></section>
    <section class="metric-grid">${metric('Productores',state.producers.length,'red territorial activa')}${metric('Hectáreas vinculadas',state.farms.reduce((a,f)=>a+Number(f.hectares),0).toFixed(1),'caracterizadas en DEMO')}${metric('Ciclos activos',state.cycles.length,'con plan o diagnóstico')}${metric('Evidencia validada',`${Math.round(validated/totalEvidence*100)}%`,'trazabilidad documental')}</section>
    <section class="content-grid"><article class="card"><div class="card-header"><div><span class="eyebrow">Flujo operativo</span><h2>De la línea base a la evidencia</h2><p>Cada hito deja una trazabilidad verificable.</p></div></div><div class="flow">${[['01','Caracterizar','Productor + predio'],['02','Planear','Lote + ciclo'],['03','Acompañar','Actividad + visita'],['04','Evidenciar','Foto + dato'],['05','Validar','Revisión técnica'],['06','Medir','Resultado + impacto']].map(([n,t,s])=>`<div class="flow-step"><b>${n}</b><span>${t}</span><small>${s}</small></div>`).join('')}</div><div class="card-header" style="margin-top:24px"><div><span class="eyebrow">Próximas acciones</span><h3>Agenda operativa</h3></div><button class="secondary" data-action="new-activity">+ Actividad</button></div><div class="timeline">${state.activities.filter(a=>a.status!=='Completada').slice(0,5).map(a=>`<div class="timeline-item"><div class="timeline-dot">${a.type[0]}</div><div><h4>${esc(a.title)}</h4><p>${esc(a.type)} · ${esc(a.owner)} · ${status(a.status)}</p><time>${shortDate(a.due)}</time></div></div>`).join('')}</div></article>
    <aside class="stack"><article class="card"><div class="card-header"><div><span class="eyebrow">Señales</span><h3>Atención esta semana</h3></div></div><div class="mini-list"><div class="mini-row"><span>Evidencias pendientes</span><b>${state.evidences.filter(e=>e.status==='Pendiente').length}</b></div><div class="mini-row"><span>Visitas programadas</span><b>${state.visits.filter(v=>v.status==='Programada').length}</b></div><div class="mini-row"><span>Predios sin verificar</span><b>${state.farms.filter(f=>f.status!=='Verificada').length}</b></div></div></article><article class="card"><div class="card-header"><div><span class="eyebrow">Trazabilidad</span><h3>Últimos eventos</h3></div></div><div class="timeline">${recentEvents(4)}</div></article></aside></section>`;
  }

  function roleLabel(r){ return ({admin:'Administrador',technical:'Técnico',producer:'Productor',investor:'Inversionista',visitor:'Visitante'})[r]||r; }
  function recentEvents(limit=6){ const items=[...state.evidences.map(e=>({date:e.date,title:e.title,detail:`Evidencia · ${e.status}`})),...state.visits.map(v=>({date:v.date,title:v.purpose,detail:`Visita · ${v.status}`})),...state.activities.filter(a=>a.status==='Completada').map(a=>({date:a.due,title:a.title,detail:'Actividad completada'}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit); return items.map(x=>`<div class="timeline-item"><div class="timeline-dot">•</div><div><h4>${esc(x.title)}</h4><p>${esc(x.detail)}</p><time>${shortDate(x.date)}</time></div></div>`).join(''); }

  function renderTerritory(){
    const pins=state.farms.map((f,i)=>`<div class="map-pin" style="left:${[32,58,72,44,63][i%5]}%;top:${[40,28,58,68,76][i%5]}%"><i></i><span>${esc(f.name)} · ${esc(f.municipality)}</span></div>`).join('');
    return `${head('Territorio','Inteligencia territorial','Una lectura conjunta de productores, unidades productivas y avance del acompañamiento.')}
    <section class="metric-grid">${metric('Municipios',new Set(state.farms.map(f=>f.municipality)).size,'Suroeste de Antioquia')}${metric('Predios',state.farms.length,'vinculados a la DEMO')}${metric('Área',`${state.farms.reduce((a,f)=>a+Number(f.hectares),0).toFixed(1)} ha`,'caracterizada')}${metric('Cobertura técnica',`${state.impact.soilCoverage}%`,'indicador DEMO')}</section>
    <section class="content-grid"><article class="card"><div class="card-header"><div><span class="eyebrow">Mapa esquemático</span><h2>Corredor Regenerativo Suroeste</h2><p>Representación conceptual; no sustituye cartografía ni georreferenciación oficial.</p></div></div><div class="map-schematic">${pins}</div></article><aside class="card"><div class="card-header"><div><span class="eyebrow">Municipios</span><h3>Presencia del programa</h3></div></div><div class="mini-list">${[...new Set(state.farms.map(f=>f.municipality))].map(m=>`<div class="mini-row"><span>${esc(m)}</span><b>${state.farms.filter(f=>f.municipality===m).length} predio(s)</b></div>`).join('')}</div></aside></section>`;
  }

  function renderProducers(){
    const rows=state.producers.map(p=>`<tr data-record="producer" data-id="${p.id}"><td><div class="person-cell"><div class="person-dot">${initials(p.name)}</div><div><b>${esc(p.name)}</b><br><small>${p.id}</small></div></div></td><td>${esc(p.municipality)}</td><td>${esc(p.segment)}</td><td>${esc(farmBy(p.farmId)?.name||'—')}</td><td>${p.score}/100</td><td>${status(p.status)}</td></tr>`).join('');
    return `${head('Productores','Territorio humano','Caracterización y seguimiento de las personas que sostienen cada unidad productiva.','<button class="primary" data-action="new-producer">+ Nuevo productor</button>')}<section class="metric-grid">${metric('Vinculados',state.producers.length)}${metric('En acompañamiento',state.producers.filter(p=>/activo/i.test(p.status)).length)}${metric('Caracterización',state.producers.filter(p=>/caracter/i.test(p.status)).length)}${metric('Índice medio',Math.round(state.producers.reduce((a,p)=>a+p.score,0)/(state.producers.length||1))+'/100')}</section><div class="table-wrap"><table><thead><tr><th>Productor</th><th>Municipio</th><th>Sistema productivo</th><th>Predio</th><th>Línea base</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderFarms(){
    return `${head('Predios y lotes','Unidad productiva','El predio aporta el contexto; el lote permite llevar la trazabilidad al nivel donde ocurren las decisiones.','<button class="secondary" data-action="new-lot">+ Lote</button><button class="primary" data-action="new-farm">+ Predio</button>')}<div class="record-grid">${state.farms.map(f=>{const p=producerBy(f.producerId); const lots=state.lots.filter(l=>l.farmId===f.id); return `<article class="record" data-record="farm" data-id="${f.id}"><div class="record-top"><span class="eyebrow">${f.id}</span>${status(f.status)}</div><h3>${esc(f.name)}</h3><p>${esc(f.vereda)}, ${esc(f.municipality)} · ${f.altitude} msnm · ${f.hectares} ha</p><div class="record-meta"><span class="chip">${esc(p?.name||'Sin productor')}</span><span class="chip">${lots.length} lote(s)</span><span class="chip">${esc(f.water)}</span></div></article>`}).join('')}</div><section class="card" style="margin-top:16px"><div class="card-header"><div><span class="eyebrow">Detalle agronómico</span><h2>Lotes productivos</h2></div></div><div class="table-wrap"><table><thead><tr><th>Lote</th><th>Predio</th><th>Cultivo</th><th>Variedad</th><th>Área</th><th>Salud suelo</th><th>Estado</th></tr></thead><tbody>${state.lots.map(l=>`<tr><td><b>${esc(l.name)}</b><br><small>${l.id}</small></td><td>${esc(farmBy(l.farmId)?.name||'—')}</td><td>${esc(l.crop)}</td><td>${esc(l.variety)}</td><td>${l.hectares} ha</td><td>${l.soilHealth}/100</td><td>${status(l.status)}</td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function renderCycles(){
    return `${head('Cultivos y ciclos','Producción viva','Cada ciclo conecta un lote con una etapa fenológica, un plan técnico y una secuencia verificable de actividades.','<button class="primary" data-action="new-cycle">+ Iniciar ciclo</button>')}<div class="record-grid">${state.cycles.map(c=>{const l=lotBy(c.lotId), f=farmBy(l?.farmId); return `<article class="record"><div class="record-top"><span class="eyebrow">${c.id}</span>${status(c.status)}</div><h3>${esc(c.crop)} · ${esc(l?.name||'Lote')}</h3><p>${esc(f?.name||'Predio')} · ${esc(c.stage)} · inicio ${shortDate(c.start)}</p><div class="record-meta"><span class="chip">${esc(c.plan)}</span><span class="chip">${c.progress}% avance</span></div><div style="height:5px;background:#e9ece5;border-radius:99px;margin-top:13px;overflow:hidden"><div style="height:100%;width:${c.progress}%;background:#1c533a"></div></div></article>`}).join('')}</div>`;
  }

  function renderPlan(){
    const open=state.activities.filter(a=>a.status!=='Completada'); const done=state.activities.filter(a=>a.status==='Completada');
    return `${head('Plan técnico','Acompañamiento','Convierte recomendaciones en actividades con responsable, fecha, estado y evidencia.','<button class="primary" data-action="new-activity">+ Nueva actividad</button>')}<section class="metric-grid">${metric('Actividades',state.activities.length)}${metric('Completadas',done.length)}${metric('Abiertas',open.length)}${metric('Con evidencia',state.activities.filter(a=>a.evidenceId).length)}</section><div class="table-wrap"><table><thead><tr><th>Actividad</th><th>Ciclo</th><th>Tipo</th><th>Responsable</th><th>Fecha</th><th>Evidencia</th><th>Estado</th><th></th></tr></thead><tbody>${state.activities.map(a=>`<tr><td><b>${esc(a.title)}</b><br><small>${a.id}</small></td><td>${esc(cycleBy(a.cycleId)?.crop||a.cycleId)}</td><td>${esc(a.type)}</td><td>${esc(a.owner)}</td><td>${shortDate(a.due)}</td><td>${a.evidenceId?status('Vinculada'):'—'}</td><td>${status(a.status)}</td><td>${a.status==='Completada'?'':`<button class="secondary" data-complete-activity="${a.id}">Completar</button>`}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderTrace(){
    return `${head('Bitácora y visitas','Trazabilidad de campo','Una secuencia cronológica de acompañamiento, hallazgos, actividades y decisiones.','<button class="primary" data-action="new-visit">+ Registrar visita</button>')}<section class="split"><article class="card"><div class="card-header"><div><span class="eyebrow">Visitas técnicas</span><h2>Acompañamiento en territorio</h2></div></div><div class="timeline">${state.visits.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(v=>`<div class="timeline-item"><div class="timeline-dot">V</div><div><h4>${esc(v.purpose)} · ${esc(farmBy(v.farmId)?.name||v.farmId)}</h4><p>${esc(v.technician)} · ${esc(v.finding)} · ${status(v.status)}</p><time>${shortDate(v.date)}</time></div></div>`).join('')}</div></article><article class="card"><div class="card-header"><div><span class="eyebrow">Historia</span><h2>Eventos recientes</h2></div></div><div class="timeline">${recentEvents(10)}</div></article></section>`;
  }

  function renderEvidence(){
    const pending=state.evidences.filter(e=>e.status==='Pendiente').length;
    return `${head('Evidencias','Prueba verificable','Fotografías, documentos y registros vinculados a actividades y productores. La validación aquí es exclusivamente DEMO.','<button class="primary" data-action="new-evidence">+ Cargar evidencia</button>')}<section class="metric-grid">${metric('Registros',state.evidences.length)}${metric('Validadas',state.evidences.filter(e=>e.status==='Validada').length)}${metric('Pendientes',pending)}${metric('Cobertura',`${Math.round(state.evidences.filter(e=>e.status==='Validada').length/(state.evidences.length||1)*100)}%`)}</section><div class="record-grid">${state.evidences.map(e=>`<article class="evidence-card"><div class="evidence-visual">${e.type==='Fotografía'?'◫':'DOC'}</div><div class="evidence-body"><span class="eyebrow">${esc(e.type)} · ${e.id}</span><h4>${esc(e.title)}</h4><p>${shortDate(e.date)} · ${esc(producerBy(e.producerId)?.name||'Sin productor')}<br>${esc(e.file)} · ${esc(e.note)}</p><div class="evidence-actions">${status(e.status)}${e.status==='Pendiente'?`<button class="secondary" data-validate-evidence="${e.id}">Validar</button><button class="ghost" data-reject-evidence="${e.id}">Observar</button>`:''}</div></div></article>`).join('')}</div>`;
  }

  function renderFinance(){
    const total=state.milestones.reduce((a,h)=>a+h.amount,0); const verified=state.milestones.filter(h=>h.status==='Verificado').reduce((a,h)=>a+h.amount,0);
    return `${head('Financiación DEMO','Capital con trazabilidad','Simulación conceptual de hitos vinculados a evidencia. No recibe, custodia, aprueba ni mueve dinero. No constituye oferta de inversión.')}
    <div class="card" style="margin-bottom:16px;background:#173d2a;color:white;border-color:#173d2a"><div class="card-header"><div><span class="eyebrow">Caso demostrativo</span><h2 style="color:white">El Porvenir · transición regenerativa</h2><p style="color:#c8d8cd">La lógica financiera se muestra únicamente para explicar cómo la evidencia podría soportar hitos humanos de decisión.</p></div>${status('DEMO')}</div><section class="metric-grid" style="margin:16px 0 0">${metric('Caso total',money(total),'simulado')}${metric('Hitos verificados',money(verified),'sin desembolso real')}${metric('Evidencia',`${state.evidences.filter(e=>e.status==='Validada').length} validada(s)`,'revisión técnica DEMO')}${metric('Ejecución','0 COP','bloqueada')}</section></div>
    <section class="card"><div class="card-header"><div><span class="eyebrow">Hitos</span><h2>Secuencia de verificación</h2></div></div><div class="stack">${state.milestones.map((h,i)=>`<div style="display:grid;grid-template-columns:38px 1fr auto;gap:14px;align-items:center;border-bottom:1px solid #e6e8e1;padding:12px 0"><div class="person-dot">${i+1}</div><div><b style="font-size:11px">${esc(h.title)}</b><p style="font-size:9px;color:#68766f;margin:4px 0">${esc(h.evidence)} · ${h.progress}% avance documental</p><div style="height:4px;background:#e7e9e3;border-radius:99px"><div style="height:100%;width:${h.progress}%;background:#1c533a"></div></div></div><div style="text-align:right"><b>${money(h.amount)}</b><div style="margin-top:5px">${status(h.status)}</div></div></div>`).join('')}</div></section>`;
  }

  function renderImpact(){
    const i=state.impact;
    return `${head('Impacto','Resultados que importan','Indicadores DEMO para conectar desempeño productivo, regeneración del suelo, circularidad y acompañamiento social. Los valores requieren metodología y verificación antes de uso real.')}
    <section class="content-grid"><article class="card"><div class="card-header"><div><span class="eyebrow">Tablero de impacto</span><h2>Línea base y avance</h2></div></div><div class="impact-grid"><div class="impact-tile"><b>${i.hectares} ha</b><span>área bajo acompañamiento</span></div><div class="impact-tile"><b>${i.producers}</b><span>productores vinculados</span></div><div class="impact-tile"><b>${i.soilCoverage}%</b><span>cobertura de suelo · DEMO</span></div><div class="impact-tile"><b>${i.organicCircularity} t</b><span>insumos orgánicos circulares · DEMO</span></div><div class="impact-tile"><b>${i.technicalVisits}</b><span>visitas / acciones técnicas</span></div><div class="impact-tile"><b>${i.waterActions}</b><span>acciones de manejo hídrico</span></div></div></article><aside class="card"><div class="card-header"><div><span class="eyebrow">Integridad</span><h3>Qué falta para afirmar impacto</h3></div></div><div class="timeline"><div class="timeline-item"><div class="timeline-dot">1</div><div><h4>Línea base</h4><p>Definir metodología, periodo y evidencia primaria.</p></div></div><div class="timeline-item"><div class="timeline-dot">2</div><div><h4>Comparabilidad</h4><p>Controlar unidad, cultivo, lote y ventana temporal.</p></div></div><div class="timeline-item"><div class="timeline-dot">3</div><div><h4>Verificación</h4><p>Separar dato reportado, dato validado y cálculo derivado.</p></div></div><div class="timeline-item"><div class="timeline-dot">4</div><div><h4>Comunicación</h4><p>Publicar solo indicadores con evidencia y metodología trazables.</p></div></div></div></aside></section>`;
  }

  function renderDocuments(){
    return `${head('Documentos','Memoria del proceso','Fichas, planes, consentimientos y reportes asociados a productores, predios y ciclos.','<button class="primary" data-action="new-document">+ Registrar documento</button>')}<div class="table-wrap"><table><thead><tr><th>Documento</th><th>Tipo</th><th>Relacionado con</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>${state.documents.map(d=>`<tr><td><b>${esc(d.title)}</b><br><small>${d.id}</small></td><td>${esc(d.type)}</td><td>${esc(d.related)}</td><td>${shortDate(d.date)}</td><td>${status(d.status)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  const renderers={home:renderHome,territory:renderTerritory,producers:renderProducers,farms:renderFarms,cycles:renderCycles,plan:renderPlan,trace:renderTrace,evidence:renderEvidence,finance:renderFinance,impact:renderImpact,documents:renderDocuments};
  const labels={home:'Inicio',territory:'Territorio',producers:'Productores',farms:'Predios y lotes',cycles:'Cultivos y ciclos',plan:'Plan técnico',trace:'Bitácora y visitas',evidence:'Evidencias',finance:'Financiación DEMO',impact:'Impacto',documents:'Documentos'};

  function render(){ renderNav(); $('#breadcrumbs').innerHTML=`<span>SANA</span><b>/</b><strong>${labels[page]}</strong>`; $('#workspace').innerHTML=(renderers[page]||renderHome)(); $('#roleSelect').value=role; window.scrollTo({top:0,behavior:'smooth'}); }
  function navigate(target){ if(!renderers[target])return; page=target; render(); $('#sidebar').classList.remove('open'); }

  const fields = {
    producer: () => `<div class="form-grid"><div class="field full"><label>Nombre completo</label><input name="name" required placeholder="Nombre del productor"></div><div class="field"><label>Municipio</label><input name="municipality" required value="Támesis"></div><div class="field"><label>Teléfono</label><input name="phone" placeholder="300 000 0000"></div><div class="field"><label>Sistema productivo</label><input name="segment" required placeholder="Café · Cacao"></div><div class="field"><label>Estado</label><select name="status"><option>Pre-registro</option><option>Caracterización</option><option>Acompañamiento activo</option></select></div><div class="form-note">${DEMO_NOTICE}</div></div>`,
    farm: () => `<div class="form-grid"><div class="field"><label>Productor</label><select name="producerId" required>${state.producers.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Nombre del predio</label><input name="name" required></div><div class="field"><label>Municipio</label><input name="municipality" required value="Támesis"></div><div class="field"><label>Vereda</label><input name="vereda" required></div><div class="field"><label>Área total (ha)</label><input name="hectares" required type="number" min="0.1" step="0.1"></div><div class="field"><label>Altitud (msnm)</label><input name="altitude" type="number"></div><div class="field"><label>Fuente de agua</label><input name="water" placeholder="Nacimiento / acueducto"></div><div class="field"><label>Tenencia</label><select name="tenure"><option>Propia</option><option>Arrendada</option><option>Familiar</option><option>Otra</option></select></div><div class="form-note">La georreferenciación exacta deberá incorporarse con controles de privacidad y fuente verificable en producto real.</div></div>`,
    lot: () => `<div class="form-grid"><div class="field"><label>Predio</label><select name="farmId" required>${state.farms.map(f=>`<option value="${f.id}">${esc(f.name)} · ${esc(f.municipality)}</option>`).join('')}</select></div><div class="field"><label>Nombre del lote</label><input name="name" required></div><div class="field"><label>Área (ha)</label><input name="hectares" type="number" min="0.1" step="0.1" required></div><div class="field"><label>Cultivo</label><input name="crop" required placeholder="Café"></div><div class="field"><label>Variedad</label><input name="variety" placeholder="Castillo"></div><div class="field"><label>Estado</label><select name="status"><option>Planeación</option><option>Diagnóstico</option><option>Activo</option></select></div><div class="form-note">${DEMO_NOTICE}</div></div>`,
    cycle: () => `<div class="form-grid"><div class="field"><label>Lote</label><select name="lotId" required>${state.lots.map(l=>`<option value="${l.id}">${esc(l.name)} · ${esc(farmBy(l.farmId)?.name||'')}</option>`).join('')}</select></div><div class="field"><label>Cultivo</label><input name="crop" required value="Café"></div><div class="field"><label>Etapa</label><input name="stage" required placeholder="Diagnóstico"></div><div class="field"><label>Fecha de inicio</label><input name="start" type="date" required value="2026-08-14"></div><div class="field full"><label>Plan técnico</label><input name="plan" placeholder="Por asignar"></div><div class="form-note">Iniciar un ciclo en DEMO crea la unidad de seguimiento; no dispara órdenes, compras ni ejecución productiva.</div></div>`,
    activity: () => `<div class="form-grid"><div class="field"><label>Ciclo</label><select name="cycleId" required>${state.cycles.map(c=>`<option value="${c.id}">${esc(c.crop)} · ${esc(lotBy(c.lotId)?.name||'')}</option>`).join('')}</select></div><div class="field"><label>Tipo</label><select name="type"><option>Aplicación</option><option>Medición</option><option>Visita</option><option>Diagnóstico</option><option>Manejo</option></select></div><div class="field full"><label>Actividad</label><input name="title" required></div><div class="field"><label>Fecha objetivo</label><input name="due" type="date" required value="2026-08-20"></div><div class="field"><label>Responsable</label><input name="owner" required value="Equipo técnico SANA"></div><div class="form-note">${DEMO_NOTICE}</div></div>`,
    visit: () => `<div class="form-grid"><div class="field"><label>Predio</label><select name="farmId" required>${state.farms.map(f=>`<option value="${f.id}">${esc(f.name)} · ${esc(f.municipality)}</option>`).join('')}</select></div><div class="field"><label>Fecha</label><input name="date" type="date" required value="2026-08-20"></div><div class="field"><label>Técnico</label><input name="technician" required value="Equipo técnico SANA"></div><div class="field"><label>Propósito</label><input name="purpose" required placeholder="Seguimiento técnico"></div><div class="field full"><label>Hallazgo / nota</label><textarea name="finding" placeholder="Registre una observación trazable."></textarea></div><div class="field"><label>Estado</label><select name="status"><option>Programada</option><option>Cerrada</option></select></div><div class="form-note">${DEMO_NOTICE}</div></div>`,
    evidence: () => `<div class="form-grid"><div class="field"><label>Productor</label><select name="producerId" required>${state.producers.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Actividad</label><select name="activityId"><option value="">Sin actividad específica</option>${state.activities.map(a=>`<option value="${a.id}">${esc(a.title)}</option>`).join('')}</select></div><div class="field"><label>Tipo</label><select name="type"><option>Fotografía</option><option>Documento</option><option>Medición</option></select></div><div class="field"><label>Fecha</label><input name="date" type="date" required value="2026-08-14"></div><div class="field full"><label>Título</label><input name="title" required placeholder="Qué demuestra esta evidencia"></div><div class="field full"><label>Archivo DEMO</label><input name="file" type="file" accept="image/*,.pdf,.csv"></div><div class="field full"><label>Nota de contexto</label><textarea name="note" required></textarea></div><div class="form-note">En esta DEMO solo se conserva el nombre del archivo en localStorage; el binario NO se carga a servidores ni a almacenamiento productivo.</div></div>`,
    document: () => `<div class="form-grid"><div class="field"><label>Tipo</label><select name="type"><option>Ficha</option><option>Plan</option><option>Consentimiento</option><option>Reporte</option><option>Otro</option></select></div><div class="field"><label>Fecha</label><input name="date" type="date" required value="2026-08-14"></div><div class="field full"><label>Título</label><input name="title" required></div><div class="field"><label>Relacionado con</label><input name="related" placeholder="P-001 / F-001 / C-001"></div><div class="field"><label>Estado</label><select name="status"><option>Borrador</option><option>Vigente</option></select></div><div class="form-note">Registro documental DEMO; no constituye firma, aceptación ni expediente oficial.</div></div>`
  };

  let modalType=null;
  function openModal(type,title){ modalType=type; $('#modalTitle').textContent=title; $('#modalBody').innerHTML=fields[type](); $('#modalBackdrop').hidden=false; setTimeout(()=>$('#modalBody input, #modalBody select')?.focus(),20); }
  function closeModal(){ $('#modalBackdrop').hidden=true; modalType=null; $('#modalForm').reset(); }
  function formObject(form){ const fd=new FormData(form); const obj=Object.fromEntries(fd.entries()); const file=form.querySelector('input[type=file]')?.files?.[0]; if(file)obj.file=file.name; return obj; }

  function saveModal(data){
    if(modalType==='producer'){ const id=uid('P'); state.producers.unshift({id,name:data.name,municipality:data.municipality,phone:data.phone,segment:data.segment,status:data.status,score:40,farmId:null}); }
    if(modalType==='farm'){ const id=uid('F'); state.farms.unshift({id,producerId:data.producerId,name:data.name,municipality:data.municipality,vereda:data.vereda,hectares:Number(data.hectares),altitude:Number(data.altitude)||0,lat:null,lng:null,water:data.water||'Por caracterizar',tenure:data.tenure,status:'Caracterización'}); const p=producerBy(data.producerId); if(p&&!p.farmId)p.farmId=id; }
    if(modalType==='lot'){ state.lots.unshift({id:uid('L'),farmId:data.farmId,name:data.name,hectares:Number(data.hectares),crop:data.crop,variety:data.variety||'Por registrar',status:data.status,soilHealth:50}); }
    if(modalType==='cycle'){ state.cycles.unshift({id:uid('C'),lotId:data.lotId,crop:data.crop,stage:data.stage,start:data.start,progress:5,plan:data.plan||'Por asignar',status:'Diagnóstico'}); }
    if(modalType==='activity'){ state.activities.unshift({id:uid('A'),cycleId:data.cycleId,type:data.type,title:data.title,due:data.due,owner:data.owner,status:'Pendiente',evidenceId:null}); }
    if(modalType==='visit'){ state.visits.unshift({id:uid('V'),farmId:data.farmId,date:data.date,technician:data.technician,purpose:data.purpose,finding:data.finding||'Sin hallazgo registrado.',status:data.status}); }
    if(modalType==='evidence'){ const id=uid('E'); state.evidences.unshift({id,activityId:data.activityId||null,producerId:data.producerId,type:data.type,title:data.title,date:data.date,file:data.file||'SIN_ARCHIVO_DEMO',note:data.note,status:'Pendiente',validator:null}); if(data.activityId){const a=state.activities.find(x=>x.id===data.activityId); if(a)a.evidenceId=id;} }
    if(modalType==='document'){ state.documents.unshift({id:uid('D'),type:data.type,title:data.title,related:data.related||'Sin relación',date:data.date,status:data.status}); }
    persist(); closeModal(); render(); toast('Registro DEMO guardado');
  }

  function action(name){
    const map={
      'new-producer':()=>openModal('producer','Nuevo productor'),
      'new-farm':()=>openModal('farm','Registrar predio'),
      'new-lot':()=>openModal('lot','Crear lote productivo'),
      'new-cycle':()=>openModal('cycle','Iniciar ciclo'),
      'new-activity':()=>openModal('activity','Nueva actividad técnica'),
      'new-visit':()=>openModal('visit','Registrar visita'),
      'new-evidence':()=>openModal('evidence','Cargar evidencia DEMO'),
      'new-document':()=>openModal('document','Registrar documento'),
      'quick-start':()=>{ if(role==='technical')openModal('visit','Registrar visita'); else if(role==='producer')navigate('plan'); else if(role==='investor')navigate('finance'); else openModal('producer','Nuevo productor'); }
    }; map[name]?.();
  }

  function validateEvidence(id, accepted){ const e=state.evidences.find(x=>x.id===id); if(!e)return; e.status=accepted?'Validada':'Observada'; e.validator=accepted?'Equipo técnico SANA · DEMO':'Requiere ajuste'; persist(); render(); toast(accepted?'Evidencia validada en DEMO':'Evidencia marcada para ajuste'); }
  function completeActivity(id){ const a=state.activities.find(x=>x.id===id); if(!a)return; a.status='Completada'; persist(); render(); toast('Actividad completada en DEMO', a.evidenceId?'La actividad conserva su evidencia vinculada.':'Queda pendiente asociar evidencia si el protocolo la exige.'); }

  function openSearch(){ $('#commandBackdrop').hidden=false; $('#globalSearch').value=''; renderSearch(''); setTimeout(()=>$('#globalSearch').focus(),10); }
  function closeSearch(){ $('#commandBackdrop').hidden=true; }
  function searchIndex(){ return [
    ...state.producers.map(x=>({type:'Productor',title:x.name,meta:`${x.id} · ${x.municipality} · ${x.segment}`,page:'producers'})),
    ...state.farms.map(x=>({type:'Predio',title:x.name,meta:`${x.id} · ${x.vereda}, ${x.municipality}`,page:'farms'})),
    ...state.lots.map(x=>({type:'Lote',title:x.name,meta:`${x.id} · ${x.crop} · ${farmBy(x.farmId)?.name||''}`,page:'farms'})),
    ...state.cycles.map(x=>({type:'Ciclo',title:`${x.crop} · ${lotBy(x.lotId)?.name||x.lotId}`,meta:`${x.id} · ${x.stage}`,page:'cycles'})),
    ...state.evidences.map(x=>({type:'Evidencia',title:x.title,meta:`${x.id} · ${x.status}`,page:'evidence'})),
    ...state.documents.map(x=>({type:'Documento',title:x.title,meta:`${x.id} · ${x.type}`,page:'documents'}))
  ]; }
  function renderSearch(q){ const term=q.trim().toLowerCase(); const results=searchIndex().filter(x=>!term||`${x.type} ${x.title} ${x.meta}`.toLowerCase().includes(term)).slice(0,12); $('#searchResults').innerHTML=results.length?results.map(x=>`<div class="search-result" data-search-page="${x.page}"><div><b>${esc(x.title)}</b><span>${esc(x.meta)}</span></div><span>${esc(x.type)}</span></div>`).join(''):'<div class="empty"><b>Sin resultados</b>Prueba otro nombre, código o municipio.</div>'; }

  document.addEventListener('click', e=>{
    const nav=e.target.closest('[data-nav]'); if(nav){navigate(nav.dataset.nav);return;}
    const act=e.target.closest('[data-action]'); if(act){action(act.dataset.action);return;}
    const val=e.target.closest('[data-validate-evidence]'); if(val){validateEvidence(val.dataset.validateEvidence,true);return;}
    const rej=e.target.closest('[data-reject-evidence]'); if(rej){validateEvidence(rej.dataset.rejectEvidence,false);return;}
    const comp=e.target.closest('[data-complete-activity]'); if(comp){completeActivity(comp.dataset.completeActivity);return;}
    const result=e.target.closest('[data-search-page]'); if(result){closeSearch();navigate(result.dataset.searchPage);return;}
  });

  $('#roleSelect').addEventListener('change',e=>{role=e.target.value;localStorage.setItem(ROLE_KEY,role);render();toast(`Vista ${roleLabel(role)} activada`,'La DEMO adapta la prioridad de información; no cambia permisos productivos.');});
  $('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#searchBtn').addEventListener('click',openSearch);
  $('#globalSearch').addEventListener('input',e=>renderSearch(e.target.value));
  $('#closeModalBtn').addEventListener('click',closeModal); $('#cancelModalBtn').addEventListener('click',closeModal);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
  $('#commandBackdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)closeSearch();});
  $('#modalForm').addEventListener('submit',e=>{e.preventDefault();saveModal(formObject(e.currentTarget));});
  $('#resetDemoBtn').addEventListener('click',()=>{ if(confirm('¿Restablecer todos los datos editables de esta DEMO?')){state=clone(seed);persist();render();toast('DEMO restablecida','Se recuperaron los datos sintéticos iniciales.');} });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){closeModal();closeSearch();} if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();} });

  render();
})();
