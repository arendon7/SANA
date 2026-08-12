const gateOrder=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'];
const fixture=Object.freeze({
  trust:'FIXTURE_SYNTHETIC',decision:'NOT_CAPITAL_READY',assessmentVersion:1,evidenceCoverage:72,
  projects:[
    {id:'hass-san-miguel',name:'Hass San Miguel',producer:'Productor A',crop:'Hass',state:'NOT_CAPITAL_READY',blockers:3,evidence:72,risk:'0 critical',next:'Resolver presupuesto, mercado y trazabilidad'},
    {id:'hass-la-esperanza',name:'Hass La Esperanza',producer:'Productor B',crop:'Hass',state:'HUMAN_REVIEW',blockers:0,evidence:94,risk:'0 critical',next:'Revisión humana'},
    {id:'hass-el-retiro',name:'Hass El Retiro',producer:'Productor C',crop:'Hass',state:'REASSESSMENT_REQUIRED',blockers:2,evidence:88,risk:'1 high',next:'Actualizar evidencia vencida'},
  ],
  gaps:[
    {id:'gap-g4-budget',gate:'G4_BUDGET',title:'Presupuesto incompleto',description:'Falta cuantificar la mano de obra de cosecha en la versión presupuestal actual.',owner:'Productor',due:'18 ago',blocking:true},
    {id:'gap-g5-market',gate:'G5_MARKET',title:'Evidencia comercial insuficiente',description:'Existe comprador identificado, pero no evidencia actual suficiente de intención de compra.',owner:'Analista',due:'19 ago',blocking:true},
    {id:'gap-g7-traceability',gate:'G7_TRACEABILITY',title:'Cobertura de trazabilidad incompleta',description:'El lote L04 conserva evidencia crítica pendiente de sincronización/validación canónica.',owner:'Agrónomo',due:'17 ago',blocking:true},
  ],
  gates:[
    ['G1_ACTOR','Actor','PASS','6 evidencias'],['G2_ASSET','Activo productivo','PASS','8 evidencias'],['G3_AGRONOMY','Agronomía','PASS_WITH_CONDITIONS','11 evidencias · 1 condición'],['G4_BUDGET','Presupuesto','INCOMPLETE','7 evidencias · 1 bloqueo'],['G5_MARKET','Mercado','INCOMPLETE','3 evidencias · 1 bloqueo'],['G6_RISK','Riesgo','PASS_WITH_CONDITIONS','9 dimensiones · 1 condición'],['G7_TRACEABILITY','Trazabilidad','INCOMPLETE','14 evidencias · 1 bloqueo'],['G8_IMPACT','Impacto','PASS','plan definido · 0 claims'],['G9_FINANCIAL_STRUCTURE','Estructura de capital','PASS','necesidad identificada'],
  ],
  risks:[
    ['PRODUCER','BAJO','Alta'],['OPERATION','MODERADO','Alta'],['AGRONOMY','MODERADO','Alta'],['DATA','MODERADO','Alta'],['FINANCIAL','INDETERMINADO','Media'],['MARKET','ALTO','Media'],['CLIMATE','MODERADO','Media'],['TRACEABILITY','BAJO','Alta'],['MANAGEMENT','BAJO','Alta'],
  ],
});
function esc(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function stateClass(state){if(state==='HUMAN_REVIEW')return'review';return'blocked';}
function gateClass(state){if(state==='PASS')return'pass';if(state==='PASS_WITH_CONDITIONS')return'condition';return'incomplete';}
function shortGate(id){return id.slice(0,2);}
function renderQueue(){const root=document.querySelector('#projectQueue');root.innerHTML=`<div class="project-row header"><span>Proyecto</span><span>Productor</span><span>Cultivo</span><span>Estado</span><span>Bloqueos</span><span>Evidencia</span><span>Próxima acción</span></div>`+fixture.projects.map(p=>`<a class="project-row" href="/control/capital/projects/${esc(p.id)}"><span><strong>${esc(p.name)}</strong><small>Fixture productivo</small></span><span>${esc(p.producer)}</span><span>${esc(p.crop)}</span><span class="state ${stateClass(p.state)}">${esc(p.state)}</span><span><strong>${p.blockers}</strong></span><span><strong>${p.evidence}%</strong></span><span class="next-action">${esc(p.next)} →</span></a>`).join('');}
function renderProject(){document.querySelector('#queueView').hidden=true;document.querySelector('#projectView').hidden=false;document.querySelector('#pageTitle').textContent='Hass San Miguel · Readiness';document.querySelector('#pageIntro').textContent='Expediente productivo vivo: bloqueos, evidencia, riesgo y procedencia antes de cualquier proceso financiero.';
  document.querySelector('#blockingGaps').innerHTML=fixture.gaps.map(g=>`<article class="gap-card" id="${esc(g.id)}"><div class="gap-card-top"><div><span class="eyebrow">${esc(shortGate(g.gate))} · BLOQUEANTE</span><h3>${esc(g.title)}</h3></div><span class="state blocked">OPEN</span></div><p>${esc(g.description)}</p><div class="gap-meta">Responsable: ${esc(g.owner)} · objetivo: ${esc(g.due)}</div><a class="gap-link" href="#${esc(g.id)}">Ver contexto canónico · read-only</a></article>`).join('');
  document.querySelector('#gateRail').innerHTML=fixture.gates.map(([id,label,state,context])=>`<div class="gate-item"><span class="gate-code">${esc(shortGate(id))}</span><div><b>${esc(label)}</b><small>${esc(context)}</small></div><span class="gate-state ${gateClass(state)}">${esc(state)}</span></div>`).join('');
  document.querySelector('#riskGrid').innerHTML=fixture.risks.map(([dimension,state,confidence])=>`<div class="risk-item"><span>${esc(dimension)}</span><strong>${esc(state)}</strong><small>Confianza: ${esc(confidence)}</small></div>`).join('');
}
function validateFixture(){if(fixture.trust!=='FIXTURE_SYNTHETIC')throw new Error('CAPITAL_UX1_FIXTURE_TRUST_REQUIRED');if(fixture.decision!=='NOT_CAPITAL_READY')throw new Error('CAPITAL_UX1_INITIAL_DECISION_INVALID');if(fixture.gaps.length!==3||fixture.gaps.some(g=>!g.blocking))throw new Error('CAPITAL_UX1_EXPECTED_THREE_BLOCKERS');const gapGates=fixture.gaps.map(g=>g.gate).sort().join('|');if(gapGates!==['G4_BUDGET','G5_MARKET','G7_TRACEABILITY'].sort().join('|'))throw new Error('CAPITAL_UX1_BLOCKER_GATE_SET_INVALID');if(fixture.gates.length!==9||fixture.gates.map(g=>g[0]).join('|')!==gateOrder.join('|'))throw new Error('CAPITAL_UX1_GATE_SET_INVALID');if(fixture.gates.filter(g=>g[2]==='PASS_WITH_CONDITIONS').length!==2)throw new Error('CAPITAL_UX1_EXPECTED_TWO_CONDITIONS');if(fixture.risks.length!==9)throw new Error('CAPITAL_UX1_RISK_VECTOR_INVALID');}
validateFixture();renderQueue();if(location.pathname==='/control/capital/projects/hass-san-miguel')renderProject();Object.freeze(fixture);