(() => {
  'use strict';

  function registry(){return window.__SANA_DOCUMENT_SOURCES__}
  function sourceRows(scope){return registry()?.forScope?.(scope)||[]}
  function farmSources(){return sourceRows(DEMO.farm.id)}
  function lotSources(){const lot=window.__SANA_TERRITORY_360__?.selected?.();return lot?sourceRows(lot):[]}
  function allRelevantSources(){
    const seen=new Set();
    return [...farmSources(),...lotSources()].filter(row=>{const key=`${row.externalId}|${row.version}`;if(seen.has(key))return false;seen.add(key);return true});
  }
  function sourceLine(row){return `${row.provider} · ${row.externalId} · ${row.version} · corte ${row.cut} · ${row.scope} · ${row.state}`}

  function provenanceSection(){
    const rows=allRelevantSources();
    const selected=window.__SANA_TERRITORY_360__?.selected?.()||DEMO.farm.id;
    return `<section class="card territory-source-card" style="margin-top:14px"><div class="card-head"><div><h2>Fuentes documentales del expediente</h2><p>Referencias aplicables al predio y al lote ${esc(selected)}. Son metadatos de procedencia, no copias verificadas del contenido externo.</p></div><button class="text-btn" data-view-link="sources">Abrir Source Registry</button></div><div class="card-body">${rows.length?rows.map(row=>`<div class="gate"><i>${esc(row.provider==='SHAREPOINT'?'SP':'DOC')}</i><div><strong>${esc(row.name)}</strong><p>${esc(row.externalId)} · ${esc(row.version)} · corte ${esc(row.cut)} · revisor ${esc(row.reviewer)}</p></div><span class="status warn">REFERENCE_ONLY</span></div>`).join(''):'<div class="empty">No hay referencias documentales vinculadas a este predio/lote.</div>'}<div class="section-note" style="margin-top:12px">Una referencia documental indica qué fuente fue usada. No significa que SANA haya leído, validado, firmado o modificado el documento en SharePoint.</div></div></section>`;
  }

  const territoryBase=views.territory;
  if(typeof territoryBase==='function'){
    views.territory=function territoryWithSources(){
      const html=territoryBase();
      const foot=footer();
      const pos=html.lastIndexOf(foot);
      return pos>=0?`${html.slice(0,pos)}${provenanceSection()}${html.slice(pos)}`:`${html}${provenanceSection()}`;
    };
  }

  const reportsBase=views.reports;
  if(typeof reportsBase==='function'){
    views.reports=function reportsWithSourceRegistry(){
      const html=reportsBase();
      const all=registry()?.rows?.()||[];
      const section=`<section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Registro documental disponible</h2><p>Referencias externas que pueden declararse como procedencia de un corte.</p></div><button class="text-btn" data-view-link="sources">Fuentes documentales</button></div><div class="card-body"><div class="chip-row">${all.slice(0,8).map(row=>`<span class="chip">${esc(row.scope)} · ${esc(row.externalId)} · ${esc(row.version)}</span>`).join('')||'<span class="chip">Sin referencias</span>'}</div><div class="section-note" style="margin-top:12px">Incluir una referencia en un informe no la convierte en documento verificado ni produce radicación, firma o ACK.</div></div></section>`;
      const foot=footer();const pos=html.lastIndexOf(foot);return pos>=0?`${html.slice(0,pos)}${section}${html.slice(pos)}`:`${html}${section}`;
    };
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-report-snapshot]'))return;
    queueMicrotask(()=>{
      const field=document.querySelector('#modal-form textarea[name="sources"]');
      if(!field)return;
      const refs=(registry()?.rows?.()||[]).map(sourceLine);
      if(!refs.length)return;
      const marker='\n\nFUENTES DOCUMENTALES REFERENCE_ONLY:\n';
      if(!field.value.includes('FUENTES DOCUMENTALES REFERENCE_ONLY:'))field.value+=marker+refs.join('\n');
    });
  });

  window.__SANA_SOURCE_BRIDGE__=Object.freeze({
    relevant:()=>allRelevantSources().map(row=>({...row})),
    reportLines:()=>((registry()?.rows?.()||[]).map(sourceLine))
  });
})();
