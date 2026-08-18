(() => {
  'use strict';
  function api(){return window.__SANA_INVENTORY_LEDGER__}
  function linked(){return (api()?.cases?.()||[]).flatMap(c=>c.events.filter(e=>e.activityId).map(e=>({...e,caseId:c.id,itemName:c.item?.name||c.itemId}))) }
  function panel(){const rows=linked();if(!rows.length)return '';return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CAMPO · INVENTARIO</p><h2>Reservas y movimientos vinculados a actividad</h2><p>Solo vínculos explícitos por activityId; completar una actividad no descuenta inventario.</p></div><span class="status teal">${rows.length} LINK</span></div><div class="card-body">${rows.map(e=>`<div class="row"><span class="dot"></span><div class="copy"><strong>${esc(e.activityId)} · ${esc(e.itemName)}</strong><span>${esc(e.kind)} · ${e.quantity??'—'} ${esc(e.unit||'')} · ${esc(e.purpose||'sin propósito')}</span></div><div class="meta"><span class="status">EXPLICIT</span></div></div>`).join('')}<div class="section-note">ACTIVITY_LINK ≠ CONSUMPTION · ACTIVITY_COMPLETION ≠ INVENTORY_MOVEMENT · RESERVATION ≠ APPLICATION.</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const base=views.field;if(base)views.field=()=>insert(base(),panel());
  window.__SANA_INVENTORY_ACTIVITY_BRIDGE__=Object.freeze({linked,integrity:'EXPLICIT_ACTIVITY_LINK_ONLY · ACTIVITY_COMPLETION ≠ INVENTORY_MOVEMENT · NO_AUTOMATIC_CONSUMPTION'});
})();
