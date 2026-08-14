(() => {
  'use strict';
  const STORAGE_KEY='sana.demo.v3.state';
  const PAGE_KEY='characterization';
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}};
  const write=s=>localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
  const statusClass=s=>/complet|verific/i.test(s)?'good':/progreso|pend|caracter/i.test(s)?'warn':'pending';
  const badge=s=>`<span class="status ${statusClass(s)}">${esc(s)}</span>`;
  const sectionDefs=[
    ['identity','Identidad y unidad productiva','Productor, predio, tenencia y contexto territorial.'],
    ['productive','Sistema productivo','Cultivos, áreas, etapa, diversificación y prácticas.'],
    ['soil','Suelo y regeneración','Cobertura, textura, pendiente, erosión, materia orgánica y diagnóstico.'],
    ['water','Agua','Fuente, disponibilidad, protección, riego y riesgos.'],
    ['inputs','Insumos y circularidad','Fertilización, bioinsumos, residuos orgánicos y aprovechamiento.'],
    ['infrastructure','Infraestructura','Beneficio, almacenamiento, acceso, energía y conectividad.'],
    ['risks','Riesgos y alertas','Clima, plagas, erosión, deslizamiento y vulnerabilidades.'],
    ['market','Comercialización','Canal, comprador, calidad, asociatividad y restricciones.'],
    ['support','Acompañamiento','Asistencia técnica, necesidades, objetivos y próximos pasos.'],
    ['evidence','Evidencia de línea base','Fotografías, documentos y observaciones de verificación.']
  ];

  function ensureState(){
    const s=read();
    if(!Array.isArray(s.characterizations)) s.characterizations=[
      {id:'CH-001',farmId:'F-001',date:'2026-06-12',technician:'Equipo técnico SANA',status:'Completa',completion:92,sections:{identity:true,productive:true,soil:true,water:true,inputs:true,infrastructure:true,risks:true,market:true,support:true,evidence:false},summary:'Unidad cafetera-cacaotera con buena disponibilidad hídrica y oportunidad de fortalecer cobertura del suelo.',priority:'Media',next:'Verificar cobertura del borde norte y completar evidencia fotográfica.'},
      {id:'CH-002',farmId:'F-002',date:'2026-07-18',technician:'Equipo técnico SANA',status:'En progreso',completion:71,sections:{identity:true,productive:true,soil:true,water:true,inputs:true,infrastructure:false,risks:true,market:false,support:true,evidence:false},summary:'Sistema cafetero establecido; requiere completar infraestructura, mercado y evidencia de línea base.',priority:'Media',next:'Completar ficha comercial y registro de infraestructura.'},
      {id:'CH-003',farmId:'F-003',date:'2026-08-01',technician:'Equipo técnico SANA',status:'En progreso',completion:43,sections:{identity:true,productive:true,soil:false,water:true,inputs:false,infrastructure:false,risks:true,market:false,support:true,evidence:false},summary:'Caracterización inicial abierta; falta diagnóstico de suelo e inventario de prácticas e infraestructura.',priority:'Alta',next:'Realizar visita de suelo y completar inventario de manejo.'}
    ];
    write(s); return s;
  }

  function navButton(){
    const nav=document.querySelector('#mainNav'); if(!nav||nav.querySelector('[data-char-nav]'))return;
    const labels=[...nav.querySelectorAll('.nav-group-label')];
    const target=labels.find(x=>/operación/i.test(x.textContent))||labels[labels.length-1];
    const btn=document.createElement('button'); btn.type='button'; btn.dataset.charNav='1'; btn.innerHTML='<span class="nav-icon">◫</span>Caracterización integral';
    if(target){ let anchor=target; while(anchor.nextElementSibling&& !anchor.nextElementSibling.classList.contains('nav-group-label')) anchor=anchor.nextElementSibling; anchor.after(btn); } else nav.appendChild(btn);
    btn.addEventListener('click',renderPage);
  }

  function farmName(s,id){return s.farms?.find(f=>f.id===id)?.name||id}
  function producerName(s,farmId){const f=s.farms?.find(x=>x.id===farmId);return s.producers?.find(p=>p.id===f?.producerId)?.name||'Sin productor'}
  function checklist(c){return sectionDefs.map(([key,title,desc],i)=>`<div style="display:grid;grid-template-columns:34px 1fr auto;gap:12px;align-items:start;padding:12px 0;border-bottom:1px solid #e7e9e3"><div class="person-dot">${c.sections?.[key]?'✓':String(i+1).padStart(2,'0')}</div><div><b style="font-size:11px">${title}</b><p style="font-size:9px;color:#68766f;margin:4px 0 0">${desc}</p></div>${c.sections?.[key]?badge('Completa'):badge('Pendiente')}</div>`).join('')}

  function renderPage(){
    const s=ensureState(); navButton();
    document.querySelectorAll('#mainNav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-char-nav]')?.classList.add('active');
    const crumbs=document.querySelector('#breadcrumbs'); if(crumbs)crumbs.innerHTML='<span>SANA</span><b>/</b><strong>Caracterización integral</strong>';
    const w=document.querySelector('#workspace'); if(!w)return;
    const total=s.characterizations.length||1, avg=Math.round(s.characterizations.reduce((a,c)=>a+(c.completion||0),0)/total), complete=s.characterizations.filter(c=>c.status==='Completa').length;
    w.innerHTML=`<div class="page-head"><div><span class="eyebrow">Línea base de conocimiento</span><h1>Caracterización integral</h1><p>La ficha reúne contexto productivo, suelo, agua, manejo, infraestructura, riesgos, comercialización, acompañamiento y evidencia. Su propósito es construir una línea base útil para decisiones técnicas; no reemplaza diagnósticos especializados.</p></div><div class="page-actions"><button class="primary" data-new-characterization>+ Nueva caracterización</button></div></div>
    <section class="metric-grid"><article class="metric"><div class="label">Fichas</div><div class="value">${total}</div><div class="delta">líneas base DEMO</div></article><article class="metric"><div class="label">Completas</div><div class="value">${complete}</div><div class="delta">con secciones cerradas</div></article><article class="metric"><div class="label">Avance medio</div><div class="value">${avg}%</div><div class="delta">cobertura de ficha</div></article><article class="metric"><div class="label">Alta prioridad</div><div class="value">${s.characterizations.filter(c=>c.priority==='Alta').length}</div><div class="delta">requieren seguimiento</div></article></section>
    <section class="content-grid"><article class="card"><div class="card-header"><div><span class="eyebrow">Unidades productivas</span><h2>Estado de la línea base</h2><p>Selecciona una ficha para revisar su profundidad.</p></div></div><div class="stack">${s.characterizations.map(c=>`<button type="button" data-char-id="${c.id}" style="text-align:left;border:1px solid #dfe3db;background:#fffdf8;border-radius:15px;padding:15px;cursor:pointer"><div style="display:flex;justify-content:space-between;gap:12px"><div><span class="eyebrow">${c.id} · ${esc(farmName(s,c.farmId))}</span><h3 style="font-family:Georgia,serif;font-weight:500;margin:6px 0 4px">${esc(producerName(s,c.farmId))}</h3><p style="font-size:10px;color:#68766f;margin:0;line-height:1.45">${esc(c.summary)}</p></div>${badge(c.status)}</div><div style="height:5px;background:#e8ebe5;border-radius:99px;margin-top:13px"><div style="height:100%;width:${c.completion}%;background:#1c533a;border-radius:99px"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px;font-size:9px;color:#68766f"><span>${c.completion}% completado</span><span>Prioridad ${esc(c.priority)}</span></div></button>`).join('')}</div></article>
    <aside class="card"><div class="card-header"><div><span class="eyebrow">Arquitectura de ficha</span><h3>10 dimensiones</h3><p>La profundidad mínima que debe tener una unidad productiva en SANA.</p></div></div>${sectionDefs.map(([k,t,d],i)=>`<div class="timeline-item"><div class="timeline-dot">${i+1}</div><div><h4>${t}</h4><p>${d}</p></div></div>`).join('')}</aside></section>`;
    w.querySelector('[data-new-characterization]')?.addEventListener('click',openForm);
    w.querySelectorAll('[data-char-id]').forEach(el=>el.addEventListener('click',()=>renderDetail(el.dataset.charId)));
  }

  function renderDetail(id){
    const s=ensureState(), c=s.characterizations.find(x=>x.id===id); if(!c)return renderPage();
    const w=document.querySelector('#workspace');
    w.innerHTML=`<div class="page-head"><div><span class="eyebrow">${esc(c.id)} · Línea base</span><h1>${esc(farmName(s,c.farmId))}</h1><p>${esc(producerName(s,c.farmId))} · ${esc(c.technician)} · ${esc(c.date)}. ${esc(c.summary)}</p></div><div class="page-actions"><button class="ghost" data-char-back>← Volver</button><button class="secondary" data-char-progress>Completar siguiente sección</button></div></div>
    <section class="metric-grid"><article class="metric"><div class="label">Avance</div><div class="value">${c.completion}%</div><div class="delta">ficha DEMO</div></article><article class="metric"><div class="label">Prioridad</div><div class="value" style="font-size:22px">${esc(c.priority)}</div><div class="delta">seguimiento técnico</div></article><article class="metric"><div class="label">Secciones</div><div class="value">${Object.values(c.sections||{}).filter(Boolean).length}/10</div><div class="delta">completadas</div></article><article class="metric"><div class="label">Estado</div><div class="value" style="font-size:18px">${esc(c.status)}</div><div class="delta">línea base</div></article></section>
    <section class="content-grid"><article class="card"><div class="card-header"><div><span class="eyebrow">Cobertura</span><h2>Dimensiones de caracterización</h2></div></div>${checklist(c)}</article><aside class="stack"><article class="card"><div class="card-header"><div><span class="eyebrow">Próximo paso</span><h3>Recomendación operativa</h3></div></div><p style="font-size:11px;line-height:1.55;color:#68766f">${esc(c.next)}</p></article><article class="card"><div class="card-header"><div><span class="eyebrow">Integridad del dato</span><h3>Regla SANA</h3></div></div><p style="font-size:10px;line-height:1.6;color:#68766f">Distinguir siempre entre dato declarado por el productor, observación del técnico, evidencia adjunta y resultado calculado. Una ficha “completa” no significa automáticamente que todo su contenido esté verificado.</p></article></aside></section>`;
    w.querySelector('[data-char-back]').addEventListener('click',renderPage);
    w.querySelector('[data-char-progress]').addEventListener('click',()=>completeNext(c.id));
  }

  function completeNext(id){
    const s=ensureState(), c=s.characterizations.find(x=>x.id===id); if(!c)return;
    const next=sectionDefs.find(([key])=>!c.sections?.[key]);
    if(!next){c.status='Completa';c.completion=100;write(s);renderDetail(id);return;}
    c.sections[next[0]]=true;
    const done=Object.values(c.sections).filter(Boolean).length;
    c.completion=Math.round(done/sectionDefs.length*100);
    c.status=done===sectionDefs.length?'Completa':'En progreso';
    write(s); renderDetail(id);
  }

  function openForm(){
    const s=ensureState(), overlay=document.createElement('div'); overlay.className='modal-backdrop'; overlay.innerHTML=`<section class="modal" role="dialog" aria-modal="true"><header><div><span class="eyebrow">Nueva línea base</span><h2>Caracterización integral</h2></div><button class="icon-btn" type="button" data-close>×</button></header><form data-char-form><div class="form-grid"><div class="field"><label>Predio</label><select name="farmId" required>${(s.farms||[]).map(f=>`<option value="${f.id}">${esc(f.name)} · ${esc(f.municipality)}</option>`).join('')}</select></div><div class="field"><label>Fecha</label><input type="date" name="date" value="2026-08-14" required></div><div class="field"><label>Técnico / facilitador</label><input name="technician" value="Equipo técnico SANA" required></div><div class="field"><label>Prioridad inicial</label><select name="priority"><option>Media</option><option>Alta</option><option>Baja</option></select></div><div class="field full"><label>Lectura inicial</label><textarea name="summary" required placeholder="Síntesis del sistema productivo, fortalezas y brechas."></textarea></div><div class="field full"><label>Próximo paso</label><textarea name="next" required placeholder="Actividad concreta para completar o verificar la línea base."></textarea></div><div class="form-note">DEMO: esta ficha se almacena únicamente en localStorage. No sincroniza con bases productivas ni sustituye visita, análisis de laboratorio o verificación especializada.</div></div><footer><button type="button" class="ghost" data-close>Cancelar</button><button class="primary" type="submit">Crear ficha DEMO</button></footer></form></section>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>overlay.remove()));
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
    overlay.querySelector('[data-char-form]').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));const st=ensureState();st.characterizations.unshift({id:`CH-${String(Date.now()).slice(-6)}`,farmId:d.farmId,date:d.date,technician:d.technician,status:'En progreso',completion:10,sections:{identity:true,productive:false,soil:false,water:false,inputs:false,infrastructure:false,risks:false,market:false,support:false,evidence:false},summary:d.summary,priority:d.priority,next:d.next});write(st);overlay.remove();renderPage();});
  }

  const observer=new MutationObserver(navButton); observer.observe(document.documentElement,{subtree:true,childList:true});
  navButton(); ensureState();
})();
