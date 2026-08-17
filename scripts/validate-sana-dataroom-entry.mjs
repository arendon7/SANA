import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-entry.js','utf8');

function boot(role,{valid=true}={}){
  globalThis.window={
    __SANA_ACCESS__:{role},
    __SANA_DATAROOM_360__:{state:()=>valid?{
      valid:true,
      latest:{id:'SNAP-1',cutoff:'2026-08-17'},
      gaps:{total:3},
      postCut:{prepared:1,total:3},
      diff:{valid:true,total:4}
    }:{valid:false}}
  };
  globalThis.localStorage={getItem:()=>null};
  globalThis.views={home:()=>'<header>HOME</header><main>BODY</main><footer class="footer">FOOT</footer>'};
  globalThis.metric=(label,value)=>`<m>${label}:${value}</m>`;
  globalThis.esc=v=>String(v??'');
  vm.runInThisContext(source,{filename:'sana-v3-dataroom-entry.js'});
  return {api:window.__SANA_DATAROOM_ENTRY__,html:views.home()};
}

let out=boot('investor');
assert.ok(out.api);
assert.match(out.html,/LECTURA EJECUTIVA PRIORITARIA/);
assert.match(out.html,/Abrir Data Room 360°/);
assert.match(out.html,/READ_ONLY ≠ INVESTMENT_RECOMMENDATION/);
assert.match(out.api.integrity,/NO_PRIVILEGE_ESCALATION/);

for(const role of ['admin','technical','producer']){
  out=boot(role);
  assert.match(out.html,/DATA ROOM 360°/);
  assert.match(out.html,/data-view-link="dataroom"/);
  assert.doesNotMatch(out.html,/LECTURA EJECUTIVA PRIORITARIA/);
}

for(const role of ['visitor','new_user']){
  out=boot(role);
  assert.equal(out.html,'<header>HOME</header><main>BODY</main><footer class="footer">FOOT</footer>');
}

out=boot('investor',{valid:false});
assert.match(out.html,/Sin corte RPT-DD/);
assert.match(out.html,/Abrir Data Room 360°/);

console.log('Data Room role entry contract OK · investor primary · operator secondary · visitor/new_user unchanged');
