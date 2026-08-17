const CACHE='sana-v3-demo-shell-v17';
const SHELL=[
  '/sana-v3.html','/sana-v3.css','/sana-v3-extensions.css','/sana-v3-characterization.css','/sana-v3-capital.css','/sana-v3-economics.css','/sana-v3-impact.css','/sana-v3-mobile.css','/sana-v3-material.css','/sana-v3-guide.css','/sana-v3-territory-360.css',
  '/sana-v3-cloud-state.js','/sana-v3-core.js','/sana-v3-views-1.js','/sana-v3-views-2.js','/sana-v3-views-3.js','/sana-v3-views-4.js','/sana-v3-material-lifecycle.js','/sana-v3-circularity.js','/sana-v3-iot-source.js','/sana-v3-input-forecast.js','/sana-v3-inventory-operations.js','/sana-v3-team-worklogs.js','/sana-v3-reports-provenance.js','/sana-v3-characterization-protocol.js','/sana-v3-plan-protocols.js','/sana-v3-advisory-protocols.js','/sana-v3-advisory-cases.js','/sana-v3-results.js','/sana-v3-field-mobile.js','/sana-v3-plan-field-workflow.js','/sana-v3-passport-chain.js','/sana-v3-territory-360.js','/sana-v3-sources.js','/sana-v3-source-bridge.js','/sana-v3-economics.js','/sana-v3-impact-methodology.js','/sana-v3-activity-relations.js','/sana-v3-capital-dossier.js','/sana-v3-integration-bridge.js','/sana-v3-role-home.js','/sana-v3-guided-field.js','/sana-v3-runtime.js','/sana-v3-access.js','/sana-v3-account.js','/sana-v3-firestore-selftest.js','/sana-v3-offline-runtime.js','/demo-session.js','/agroway-logo-legacy.svg','/sana-v3-manifest.webmanifest'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('sana-v3-demo-shell-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/'))return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{if(!response||response.status!==200||response.type==='opaque')return response;const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match('/sana-v3.html'))));
});
