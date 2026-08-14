const DEMO = Object.freeze({
  farm: { id:'FIN-LE-001', name:'Finca La Esperanza', municipality:'Támesis', department:'Antioquia', area:12.4, producer:'Marta Restrepo', altitude:'1.620 m s. n. m.', model:'Corredor Regenerativo Suroeste' },
  lots:[
    {id:'CAF-A1',crop:'Café',name:'Lote Alto',area:3.2,stage:'Llenado de fruto',plan:86,health:'Estable',water:68,yield:'1.82 t/ha',plants:5120,evidence:94},
    {id:'AGU-A2',crop:'Aguacate',name:'Terraza 2',area:2.8,stage:'Cuajado',plan:74,health:'Atención',water:43,yield:'9.4 t/ha',plants:389,evidence:88},
    {id:'CAC-B1',crop:'Cacao',name:'Quebrada',area:2.1,stage:'Floración',plan:79,health:'Vigilancia',water:71,yield:'0.78 t/ha',plants:1710,evidence:91},
    {id:'VIV-01',crop:'Vivero',name:'Propagación',area:.4,stage:'Propagación',plan:63,health:'Estable',water:77,yield:'680 plántulas',plants:680,evidence:97},
    {id:'RES-01',crop:'Restauración',name:'Franja ribereña',area:3.9,stage:'Establecimiento',plan:58,health:'Estable',water:64,yield:'420 árboles',plants:420,evidence:89}
  ],
  material:[
    {id:'MAT-CAF-2401',type:'Semilla',species:'Café Castillo',origin:'Lote madre certificado DEMO',qty:920,available:420,stage:'Germinación',location:'VIV-01',trace:'Completa'},
    {id:'MAT-AGU-1702',type:'Injerto',species:'Aguacate Hass',origin:'Vivero regional DEMO',qty:460,available:71,stage:'Aclimatación',location:'VIV-01',trace:'Completa'},
    {id:'MAT-CAC-0904',type:'Plántula',species:'Cacao ICS-95',origin:'Propagación propia DEMO',qty:2100,available:390,stage:'Listo para campo',location:'VIV-01',trace:'Revisión'}
  ],
  plans:[
    {id:'PL-CF-04',lot:'CAF-A1',version:4,name:'Café productivo 2026',owner:'Laura Mejía',progress:86,phase:'Llenado de fruto',next:'Aplicación nutricional fase III',updated:'12 ago 2026'},
    {id:'PL-AG-03',lot:'AGU-A2',version:3,name:'Aguacate Hass 2026',owner:'Camila Torres',progress:74,phase:'Cuajado',next:'Verificación hídrica + CE',updated:'13 ago 2026'},
    {id:'PL-CA-02',lot:'CAC-B1',version:2,name:'Cacao renovación',owner:'Laura Mejía',progress:79,phase:'Floración',next:'Monitoreo preventivo monilia',updated:'11 ago 2026'},
    {id:'PL-RS-01',lot:'RES-01',version:1,name:'Restauración ribereña',owner:'Carlos Técnico',progress:58,phase:'Establecimiento',next:'Supervivencia y reposición',updated:'09 ago 2026'}
  ],
  tasks:[
    {id:'T-101',lot:'AGU-A2',title:'Verificar humedad antes de fertirriego',owner:'Camila Torres',when:'Hoy · 07:30',priority:'Alta',evidence:'Pendiente'},
    {id:'T-102',lot:'CAF-A1',title:'Registro fenológico · llenado de fruto',owner:'José Pérez',when:'Hoy · 10:00',priority:'Media',evidence:'Obligatoria'},
    {id:'T-103',lot:'CAC-B1',title:'Monitoreo preventivo de monilia',owner:'Laura Mejía',when:'Hoy · 15:00',priority:'Alta',evidence:'Obligatoria'},
    {id:'T-104',lot:'VIV-01',title:'Conteo y clasificación de plántulas',owner:'Andrés Gómez',when:'Mañana',priority:'Media',evidence:'Pendiente'},
    {id:'T-105',lot:'CAF-A1',title:'Aplicación nutricional fase III',owner:'José Pérez',when:'Mañana',priority:'Media',evidence:'Obligatoria'},
    {id:'T-106',lot:'AGU-A2',title:'Lectura CE solución de riego',owner:'Camila Torres',when:'16 ago',priority:'Media',evidence:'Pendiente'},
    {id:'T-107',lot:'RES-01',title:'Evidencia fotográfica supervivencia',owner:'Marta Restrepo',when:'17 ago',priority:'Baja',evidence:'Obligatoria'}
  ],
  incidents:[
    {id:'INC-23',lot:'AGU-A2',date:'14 ago',finding:'Humedad media 43%; estrés hídrico por confirmar',severity:'Alta',status:'Inspección requerida',owner:'Camila Torres'},
    {id:'INC-22',lot:'CAC-B1',date:'13 ago',finding:'Condición climática favorable para monilia',severity:'Media',status:'Vigilancia',owner:'Laura Mejía'},
    {id:'INC-19',lot:'CAF-A1',date:'08 ago',finding:'Foco menor de broca',severity:'Baja',status:'Cerrada con evidencia',owner:'Laura Mejía'}
  ],
  inventory:[
    {id:'INV-001',name:'2Grow líquido',group:'Agroinsumo',qty:'340 L',coverage:24,pct:68,status:'OK',linked:'CAF-A1 / AGU-A2'},
    {id:'INV-002',name:'2Feed Triple 7',group:'Agroinsumo',qty:'480 kg',coverage:31,pct:81,status:'OK',linked:'CAF-A1'},
    {id:'INV-003',name:'Bioinsumo K',group:'Agroinsumo',qty:'82 L',coverage:8,pct:24,status:'BAJO',linked:'AGU-A2'},
    {id:'INV-004',name:'Cal agrícola',group:'Enmienda',qty:'260 kg',coverage:17,pct:47,status:'VIGILAR',linked:'CAC-B1'},
    {id:'INV-005',name:'Bomba espalda #03',group:'Equipo',qty:'1 und',coverage:null,pct:100,status:'Mantenimiento 21 ago',linked:'Campo'},
    {id:'INV-006',name:'Tanque fertirriego T-02',group:'Espacio / tanque',qty:'2.000 L',coverage:null,pct:76,status:'OPERATIVO',linked:'AGU-A2'}
  ],
  team:[
    {name:'Marta Restrepo',role:'Productora',scope:'Predio + evidencia',done:12,total:14,score:91,last:'Hoy · 06:45'},
    {name:'Camila Torres',role:'Técnica de campo',scope:'AGU-A2 + nutrición',done:18,total:19,score:95,last:'Hoy · 07:12'},
    {name:'José Pérez',role:'Operario',scope:'CAF-A1 + inventario',done:26,total:29,score:90,last:'Hoy · 07:05'},
    {name:'Andrés Gómez',role:'Operario',scope:'VIV-01',done:21,total:24,score:88,last:'Ayer · 17:42'},
    {name:'Laura Mejía',role:'Agrónoma',scope:'Plan técnico + sanidad',done:9,total:9,score:100,last:'Hoy · 07:18'}
  ],
  evidence:[
    {id:'EV-445',date:'12 ago',lot:'CAF-A1',type:'Foto + registro',title:'Aplicación nutricional fase II',integrity:'Completa',by:'José Pérez'},
    {id:'EV-441',date:'11 ago',lot:'AGU-A2',type:'Lectura manual',title:'CE y pH solución de riego',integrity:'Completa',by:'Camila Torres'},
    {id:'EV-434',date:'09 ago',lot:'CAC-B1',type:'Inspección',title:'Monitoreo sanitario 18 puntos',integrity:'Completa',by:'Laura Mejía'},
    {id:'EV-421',date:'06 ago',lot:'RES-01',type:'Georreferencia',title:'Línea base restauración',integrity:'Completa',by:'Marta Restrepo'},
    {id:'EV-408',date:'01 ago',lot:'CAF-A1',type:'Documento',title:'Plan de cultivo v4',integrity:'Versionada',by:'Laura Mejía'}
  ],
  sensors:[
    {layer:'Ambiente',count:'6',variables:'Temperatura · HR · CO₂ · radiación',status:'6/6'},
    {layer:'Suelo',count:'8',variables:'T · humedad · CE · N · P · K',status:'7/8'},
    {layer:'Agua',count:'4',variables:'Temperatura · pH · CE',status:'4/4'},
    {layer:'Gateway',count:'1',variables:'Última sincronización hace 2 min',status:'OK'}
  ],
  reports:[
    {name:'Estado por lote y planta',period:'Semanal',owner:'Técnica',fresh:'Hoy 06:00',status:'Listo'},
    {name:'Variables por lote',period:'Diario',owner:'Sistema + revisión humana',fresh:'Hoy 07:15',status:'Listo'},
    {name:'Incidencias y acciones',period:'Mensual',owner:'Agronomía',fresh:'14 ago',status:'Listo'},
    {name:'Consumo y proyección de insumos',period:'Semanal',owner:'Operaciones',fresh:'14 ago',status:'Revisar stock'},
    {name:'Costos DEMO por unidad productiva',period:'Mensual',owner:'Administración',fresh:'31 jul',status:'Brecha de evidencia'}
  ]
});

const identity = window.__SANA_DEMO_IDENTITY__ || readJSON('sana.demo.identity', {role:'admin',displayName:'Administrador demo'});
const storage = {
  done:new Set(readJSON('sana.v3.tasks.done', [])),
  records:readJSON('sana.v3.records', []),
  queue:readJSON('sana.v3.offline.queue', [
    {id:'Q-01',type:'Registro fenológico',lot:'CAF-A1',created:'13 ago · 16:42'},
    {id:'Q-02',type:'Evidencia fotográfica',lot:'RES-01',created:'13 ago · 17:06'}
  ]),
  messages:readJSON('sana.v3.messages', [{who:'ai',text:'Tengo contexto de planes, bitácora, sensores, sanidad e inventario. Puedo ayudarte a revisar evidencia y posibles riesgos, pero la decisión agronómica permanece en el responsable humano.',meta:'SANA Intelligence · ADVISORY_ONLY'}])
};
let currentView=(location.hash||'#home').slice(1);

function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function persist(){localStorage.setItem('sana.v3.tasks.done',JSON.stringify([...storage.done]));localStorage.setItem('sana.v3.records',JSON.stringify(storage.records));localStorage.setItem('sana.v3.offline.queue',JSON.stringify(storage.queue));localStorage.setItem('sana.v3.messages',JSON.stringify(storage.messages))}
function esc(value=''){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function statusClass(v=''){const s=v.toLowerCase();if(s.includes('alta')||s.includes('bajo')||s.includes('bloq'))return'danger';if(s.includes('media')||s.includes('vig')||s.includes('brecha')||s.includes('revis'))return'warn';if(s.includes('listo')||s.includes('completa')||s.includes('operativo')||s.includes('cerrada'))return'teal';return''}
function badge(){return'<span class="badge">DATOS DEMO · SIMULADOS</span>'}
function head(kicker,title,desc,actions=''){return `<header class="page-head"><div><p class="kicker">${kicker}</p><h1>${title}</h1><p>${desc}</p></div><div class="head-actions">${badge()}${actions}</div></header>`}
function metric(label,value,foot,kind=''){return `<article class="metric"><span>${label}</span><strong>${value}</strong><small class="${kind}">${foot}</small></article>`}
function footer(){return `<footer class="footer-note"><span><strong>SANA DEMO</strong> · Información sintética para evaluación funcional.</span><span>productionExecutionAvailable=false · canonicalMutated=false · D10=PENDING</span></footer>`}
function progress(p,tone=''){return `<div class="progress"><i class="${tone}" style="width:${Math.max(0,Math.min(100,p))}%"></i></div>`}
function taskRows(items=DEMO.tasks){return items.map(t=>{const done=storage.done.has(t.id);return `<div class="row"><button class="text-btn" data-task="${t.id}" aria-label="${done?'Reabrir':'Completar'} actividad">${done?'✓':'○'}</button><div class="copy"><strong>${esc(t.title)}</strong><span>${t.lot} · ${esc(t.owner)} · evidencia: ${esc(t.evidence)}</span></div><div class="meta"><span class="status ${done?'teal':statusClass(t.priority)}">${done?'Completada':esc(t.priority)}</span><br>${done?'Sandbox':esc(t.when)}</div></div>`}).join('')}
function chart(){return `<div class="chart"><svg viewBox="0 0 620 220" preserveAspectRatio="none" role="img" aria-label="Tendencia sintética de humedad de suelo"><g><line class="gridline" x1="0" y1="50" x2="620" y2="50"/><line class="gridline" x1="0" y1="110" x2="620" y2="110"/><line class="gridline" x1="0" y1="170" x2="620" y2="170"/></g><path class="target" d="M0 100H620"/><path class="line" d="M0 73 C70 67 95 87 150 83 S235 64 305 92 S385 118 450 123 S535 116 620 143"/><text x="0" y="208">08 ago</text><text x="282" y="208">11 ago</text><text x="570" y="208">14 ago</text></svg></div>`}
