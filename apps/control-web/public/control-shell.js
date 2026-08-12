const FLOW_KEY='agroway.control.demo.flow-context.v1';
const STAGES=[
  {key:'EXCEPTION',label:'Excepciones',href:'/control/exceptions'},
  {key:'EVIDENCE',label:'Evidencia',href:'/control/evidence'},
  {key:'APPROVAL',label:'Aprobaciones',href:'/control/approvals'},
  {key:'HANDOFF',label:'Handoff',href:'/control/handoff'}
];
const RELATIONS={
  agro:{exceptionId:'agro',evidenceIds:['ev-agro-431','ev-control-001'],proposalId:'ap-agro-431',correlationId:'control-flow:agro:cycle-431'},
  capital:{exceptionId:'capital',evidenceIds:[],proposalId:'ap-invest-yar',correlationId:'control-flow:capital:inv-yar-001'},
  'ev-agro-431':{exceptionId:'agro',evidenceIds:['ev-agro-431','ev-control-001'],proposalId:'ap-agro-431',correlationId:'control-flow:agro:cycle-431'},
  'ev-control-001':{exceptionId:'agro',evidenceIds:['ev-agro-431','ev-control-001'],proposalId:'ap-agro-431',correlationId:'control-flow:agro:cycle-431'},
  'ap-agro-431':{exceptionId:'agro',evidenceIds:['ev-agro-431','ev-control-001'],proposalId:'ap-agro-431',correlationId:'control-flow:agro:cycle-431'},
  'ap-invest-yar':{exceptionId:'capital',evidenceIds:[],proposalId:'ap-invest-yar',correlationId:'control-flow:capital:inv-yar-001'}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const pathStage=()=>location.pathname.includes('/evidence')?'EVIDENCE':location.pathname.includes('/approvals')?'APPROVAL':location.pathname.includes('/handoff')?'HANDOFF':'EXCEPTION';
function read(){try{return JSON.parse(localStorage.getItem(FLOW_KEY)||'null')}catch{return null}}
function packetForProposal(proposalId){try{const p=JSON.parse(localStorage.getItem('agroway.control.demo.handoffs.v1')||'[]');return p.find(x=>x.proposalId===proposalId)?.packetId||null}catch{return null}}
function normalize(base={}){const proposalId=base.proposalId||null;return {version:1,tenantId:'tenant-demo',exceptionId:base.exceptionId||null,evidenceIds:[...new Set(base.evidenceIds||[])],proposalId,packetId:base.packetId||packetForProposal(proposalId),correlationId:base.correlationId||'control-flow:unbound',lastStage:base.lastStage||pathStage(),updatedAt:new Date().toISOString(),authority:'HUMAN_ONLY',aiAuthority:'ADVISORY_ONLY',executionState:'NOT_EXECUTED',canonicalMutated:false,localOnly:true}}
function write(next){const value=normalize(next);localStorage.setItem(FLOW_KEY,JSON.stringify(value));window.AGROWAY_CONTROL_FLOW=value;renderFlow(value);return value}
function bind(id){const rel=RELATIONS[id];if(!rel)return read();const current=read()||{};return write({...current,...rel,lastStage:pathStage()})}
function queryFor(ctx){const q=new URLSearchParams();if(ctx?.exceptionId)q.set('exceptionId',ctx.exceptionId);if(ctx?.proposalId)q.set('proposalId',ctx.proposalId);if(ctx?.correlationId)q.set('correlationId',ctx.correlationId);return q.toString()?`?${q}`:''}
function renderNav(ctx){const nav=document.querySelector('.nav');if(!nav)return;const current=pathStage();nav.innerHTML=STAGES.map(s=>`<button class="${s.key===current?'active':''}" data-control-stage="${s.key}" data-href="${s.href}${queryFor(ctx)}">${s.label}</button>`).join('');nav.querySelectorAll('[data-href]').forEach(b=>b.onclick=()=>{const c=read()||ctx||{};write({...c,lastStage:b.dataset.controlStage});location.href=b.dataset.href.replace(/\?.*$/,queryFor(c))})}
function renderFlow(ctx){renderNav(ctx);let strip=document.querySelector('#controlFlowStrip');if(!strip){strip=document.createElement('section');strip.id='controlFlowStrip';strip.className='control-flow-strip';document.querySelector('.nav')?.insertAdjacentElement('afterend',strip)}if(!strip)return;const packet=ctx?.packetId||packetForProposal(ctx?.proposalId);strip.innerHTML=`<div class="flow-context"><span class="flow-kicker">HILO ACTIVO</span><strong>${esc(ctx?.correlationId||'Sin contexto enlazado')}</strong><small>canonicalMutated=false · executionState=NOT_EXECUTED</small></div><div class="flow-chain" aria-label="Flujo de control">${STAGES.map((s,i)=>{const values=[ctx?.exceptionId,ctx?.evidenceIds?.length?`${ctx.evidenceIds.length} evidencia(s)`:null,ctx?.proposalId,packet];const val=values[i];return `<button class="flow-step ${s.key===pathStage()?'current':''} ${val?'bound':''}" data-flow-href="${s.href}${queryFor(ctx)}"><span>${i+1}</span><b>${s.label}</b><small>${esc(val||'pendiente')}</small></button>`}).join('')}</div>`;strip.querySelectorAll('[data-flow-href]').forEach(b=>b.onclick=()=>location.href=b.dataset.flowHref)}
function hydrateFromQuery(){const q=new URLSearchParams(location.search),exceptionId=q.get('exceptionId'),proposalId=q.get('proposalId');if(exceptionId&&RELATIONS[exceptionId])return bind(exceptionId);if(proposalId&&RELATIONS[proposalId])return bind(proposalId);const c=read();if(c)return write({...c,lastStage:pathStage()});return write({lastStage:pathStage()})}
document.addEventListener('click',e=>{const card=e.target.closest('[data-id]');if(!card)return;const id=card.dataset.id;if(RELATIONS[id])bind(id)},{capture:true});
const ctx=hydrateFromQuery();renderFlow(ctx);
window.AGROWAY_CONTROL_FLOW_API={read,write,bind,queryFor};
