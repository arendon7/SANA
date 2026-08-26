import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files={
  server:'apps/control-web/server.mjs',html:'apps/control-web/public/demo-auth.html',auth:'apps/control-web/public/demo-auth.js',session:'apps/control-web/public/demo-session.js',
  v3:'apps/control-web/public/sana-v3.html',cloud:'apps/control-web/public/sana-v3-cloud-state.js',access:'apps/control-web/public/sana-v3-access.js',guide:'apps/control-web/public/sana-v3-guided-field.js',
  roleHome:'apps/control-web/public/sana-v3-role-home.js',account:'apps/control-web/public/sana-v3-account.js',results:'apps/control-web/public/sana-v3-results.js',sources:'apps/control-web/public/sana-v3-sources.js',
  territory:'apps/control-web/public/sana-v3-territory-360.js',contract:'config/product/sana-demo-auth.json',firestoreRules:'infra/firebase-demo/firestore.rules'
};
const text=rel=>readFile(path.join(root,rel),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const loaded=Object.fromEntries(await Promise.all(Object.entries(files).map(async([key,rel])=>[key,await text(rel)])));
const {server,html,auth,session,v3,cloud,access,guide,roleHome,account,results,sources,territory,firestoreRules}=loaded;
const contract=JSON.parse(loaded.contract);

assert(contract.mode==='DEMO','DEMO_MODE_REQUIRED');
assert(contract.baseRelease?.immutable===true,'BASE_RELEASE_MUST_REMAIN_IMMUTABLE');
assert(contract.baseRelease?.gitHeadSha==='7f2a47a99b7df6a1682a588d714aca9a18026a95','CERTIFIED_BASE_SHA_DRIFT');
assert(contract.authentication?.provider==='FIREBASE_AUTH','FIREBASE_AUTH_REQUIRED');
assert(contract.authentication?.firebaseProjectId==='sana-demo-web','BOUND_FIREBASE_PROJECT_REQUIRED');
assert(contract.authentication?.publicWebConfigBound===true,'PUBLIC_FIREBASE_WEB_CONFIG_MUST_BE_BOUND');
assert(contract.dataStore?.provider==='CLOUD_FIRESTORE','CLOUD_FIRESTORE_REQUIRED');
assert(contract.dataStore?.firebaseProjectId==='sana-demo-web','FIRESTORE_PROJECT_MUST_MATCH_AUTH_PROJECT');
assert(contract.dataStore?.accessModel==='OWNER_UID_ONLY','OWNER_UID_ACCESS_REQUIRED');
assert(contract.dataStore?.stateCollection==='demo_user_state','DEMO_STATE_COLLECTION_REQUIRED');
assert(contract.dataStore?.stateDocumentId==='AUTH_UID','DEMO_STATE_UID_DOCUMENT_REQUIRED');
assert(contract.dataStore?.optimisticRevisionRequired===true,'OPTIMISTIC_REVISION_REQUIRED');
assert(contract.dataStore?.conflictPolicy==='NO_SILENT_OVERWRITE','NO_SILENT_OVERWRITE_REQUIRED');
assert(contract.dataStore?.roleStoredOutsideOperationalState===true,'ROLE_MUST_BE_OUTSIDE_OPERATIONAL_STATE');
for(const [key,expected] of Object.entries({sandbox:true,syntheticDataOnly:true,productionExecutionAvailable:false,productionActivationAllowed:false,canonicalWriteAvailable:false,financialMovementAvailable:false,canonicalMutated:false}))assert(contract.safetyBoundary?.[key]===expected,`SAFETY_BOUNDARY_${key}`);

for(const label of ['Crear cuenta','Productor demo','Técnico demo','Inversionista demo','Administrador demo','Explorar SANA sin registrarme','Firebase Authentication'])assert(html.includes(label),`AUTH_UI_MISSING_${label}`);
assert(auth.includes('createUserWithEmailAndPassword'),'FIREBASE_SIGNUP_REQUIRED');
assert(auth.includes('signInWithEmailAndPassword'),'FIREBASE_PASSWORD_SIGNIN_REQUIRED');
assert(auth.includes("'demo_profiles'"),'FIRESTORE_PROFILE_COLLECTION_REQUIRED');
assert(auth.includes("authProvider: 'FIREBASE_AUTH'"),'FIREBASE_IDENTITY_PROVIDER_REQUIRED');
assert(auth.includes("|| '/sana-v3.html'"),'SANA_V3_DEFAULT_DESTINATION_REQUIRED');
assert(auth.includes("nextUrl === '/sana-v3.html'"),'SANA_V3_ALLOWLIST_REQUIRED');
assert(auth.includes("nextUrl.startsWith('/control')"),'CONTROL_EXPLICIT_DESTINATION_MUST_REMAIN_ALLOWED');
assert(!/localStorage[^\n;]*password/i.test(auth),'PASSWORD_MUST_NOT_BE_STORED_IN_LOCAL_STORAGE');
assert(!/firebase_admin_private_key|serviceAccount|SUPABASE_AUTH/i.test(auth),'FORBIDDEN_AUTH_SECRET_OR_PROVIDER');

for(const token of ['productionExecutionAvailable: false','productionActivationAllowed: false','canonicalMutated: false','signOut','__SANA_CLOUD_STATE__'])assert(session.includes(token),`SESSION_BOUNDARY_MISSING_${token}`);
for(const token of ["const COLLECTION='demo_user_state'",'runTransaction','REMOTE_REVISION_CONFLICT','RULES_REQUIRED','LOCAL_ONLY','ownerId'])assert(cloud.includes(token),`CLOUD_STATE_MISSING_${token}`);
assert(!cloud.includes('productionExecutionAvailable=true'),'CLOUD_STATE_PRODUCTION_EXECUTION_FORBIDDEN');
assert(!cloud.includes('canonicalMutated=true'),'CLOUD_STATE_CANONICAL_MUTATION_FORBIDDEN');

for(const asset of ['/sana-v3-cloud-state.js','/sana-v3-material-lifecycle.js','/sana-v3-guided-field.js','/sana-v3-results.js','/sana-v3-territory-360.js','/sana-v3-sources.js','/sana-v3-role-home.js','/sana-v3-runtime.js','/sana-v3-access.js','/sana-v3-account.js','/sana-v3-advisory-cases.js','/sana-v3-input-forecast.js'])assert(v3.includes(asset),`V3_WIRING_MISSING_${asset}`);
for(const view of ['guide','territory','sources'])assert(v3.includes(`data-view="${view}"`),`V3_NAV_MISSING_${view}`);

assert(access.includes("new_user:new Set(['home','guide','characterization','passport','impact','capital'])"),'NEW_USER_LIMITED_VIEWS_REQUIRED');
assert(/technical:new Set\(\[[^\]]*'territory'[^\]]*'sources'/.test(access),'TECHNICAL_SOURCES_VIEW_REQUIRED');
assert(/producer:new Set\(\[[^\]]*'territory'[^\]]*'sources'/.test(access),'PRODUCER_SOURCES_VIEW_REQUIRED');
assert(/investor:new Set\(\[[^\]]*'territory'[^\]]*'sources'[^\]]*'passport'/.test(access),'INVESTOR_SOURCE_READ_MODEL_REQUIRED');
assert(!/visitor:new Set\(\[[^\]]*'sources'/.test(access),'VISITOR_SOURCES_VIEW_FORBIDDEN');
assert(!/new_user:new Set\(\[[^\]]*'sources'/.test(access),'NEW_USER_SOURCES_VIEW_FORBIDDEN');
assert(/technical:\[[^\]]*'document-source-link'/.test(access),'TECHNICAL_SOURCE_LINK_REQUIRED');
assert(/producer:\[[^\]]*'document-source-link'/.test(access),'PRODUCER_SOURCE_LINK_REQUIRED');
assert(!/investor:\[[^\]]*'document-source-link'/.test(access),'INVESTOR_SOURCE_WRITE_FORBIDDEN');
assert(access.includes("['[data-document-source]','document-source-link']"),'SOURCE_CAPTURE_GUARD_REQUIRED');
assert(access.includes('canAction')&&access.includes('stopImmediatePropagation'),'ROLE_GUARD_REQUIRED');
assert(!access.includes("new_user:['*']"),'NEW_USER_ADMIN_ESCALATION_FORBIDDEN');

assert(guide.includes('views.guide=guided'),'GUIDED_VIEW_REQUIRED');
assert(guide.includes("type==='guided-checkpoint'"),'GUIDED_PROGRESS_RECORD_REQUIRED');
assert(guide.includes('LOCAL_ONLY no equivale a sincronizado ni ACK'),'GUIDED_OFFLINE_BOUNDARY_REQUIRED');
assert(guide.includes('no asigna privilegios operativos'),'GUIDED_NO_PRIVILEGE_ESCALATION_REQUIRED');
assert(results.includes('views.results=results'),'HARVEST_RESULTS_VIEW_REQUIRED');
assert(results.includes('LOCAL_ONLY · NO ES FACTURA, INGRESO NI CERTIFICACIÓN'),'HARVEST_RESULT_INTEGRITY_REQUIRED');
assert(results.includes('__SANA_RESULT_BASE__'),'RESULT_BASE_EXPORT_REQUIRED');
assert(territory.includes('views.territory=territory360'),'TERRITORY_360_REQUIRED');
assert(territory.includes('no constituye delimitación predial certificada'),'TERRITORY_GEOMETRY_BOUNDARY_REQUIRED');

assert(sources.includes('views.sources=sourcesView'),'DOCUMENT_SOURCE_VIEW_REQUIRED');
assert(sources.includes('__SANA_DOCUMENT_SOURCES__'),'DOCUMENT_SOURCE_READ_MODEL_REQUIRED');
assert(sources.includes('SHAREPOINT'),'SHAREPOINT_PROVIDER_REQUIRED');
assert(sources.includes('REFERENCE_ONLY · NO LEE NI MODIFICA SHAREPOINT · NO ES ACK PRODUCTIVO'),'SOURCE_REFERENCE_BOUNDARY_REQUIRED');
assert(sources.includes('Credenciales en browser'),'SOURCE_BROWSER_CREDENTIAL_DISCLOSURE_REQUIRED');
assert(!/access_token|refresh_token|client_secret|Authorization:\s*Bearer/i.test(sources),'MICROSOFT_TOKEN_BROWSER_FORBIDDEN');
assert(!/graph\.microsoft\.com|fetch\(|XMLHttpRequest|WebSocket/i.test(sources),'DIRECT_SHAREPOINT_BROWSER_IO_FORBIDDEN');

for(const token of ['SANA · MI PREDIO','SANA · CONSOLA TÉCNICA','SANA · VISTA DE EVIDENCIA','SANA · RECORRIDO GUIADO','USUARIO NUEVO · ONBOARDING LIMITADO'])assert(roleHome.includes(token),`ROLE_HOME_MISSING_${token}`);
assert(roleHome.includes("role==='admin'?originalHome"),'ADMIN_HOME_MUST_PRESERVE_FULL_VIEW');
assert(!roleHome.includes('productionExecutionAvailable=true'),'ROLE_HOME_PRODUCTION_EXECUTION_FORBIDDEN');
for(const token of ['Mi cuenta y sincronización','NO DISPONIBLE EN BROWSER','__SANA_CLOUD_STATE__','productionExecutionAvailable=false','canonicalMutated=false'])assert(account.includes(token),`ACCOUNT_BOUNDARY_MISSING_${token}`);

for(const token of ["projectId: 'sana-demo-web'","authDomain: 'sana-demo-web.firebaseapp.com'","appId: '1:454867293969:web:1b4384820692b58449deb0'",'SANA_DEMO_FIREBASE_API_KEY','SANA_DEMO_FIREBASE_AUTH_DOMAIN','SANA_DEMO_FIREBASE_PROJECT_ID','SANA_DEMO_FIREBASE_APP_ID','OIDC_BROWSER_SESSION_ENDPOINT_FORBIDDEN','CANONICAL_WRITE_BROWSER_ENDPOINT_FORBIDDEN','EXTERNAL_ACK_BROWSER_ENDPOINT_FORBIDDEN','PRODUCTION_ACTIVATION_BROWSER_ENDPOINT_FORBIDDEN',"d10HumanProductApproval: 'PENDING'"])assert(server.includes(token),`SERVER_BOUNDARY_MISSING_${token}`);
assert(!server.includes('SANA_DEMO_FIREBASE_ADMIN_PRIVATE_KEY'),'FIREBASE_ADMIN_SECRET_MUST_NOT_BE_EXPOSED');
assert(!server.includes('SANA_DEMO_SUPABASE_'),'SUPABASE_DEMO_CONFIG_MUST_BE_REMOVED');

for(const token of ['request.auth != null','request.auth.uid == userId','match /demo_user_state/{userId}','request.resource.data.revision == resource.data.revision + 1',"request.resource.data.environment == 'DEMO'",'request.resource.data.keys().hasOnly'])assert(firestoreRules.includes(token),`FIRESTORE_RULE_MISSING_${token}`);
assert(!firestoreRules.includes('allow read, write: if true'),'FIRESTORE_OPEN_RULE_FORBIDDEN');

console.log(JSON.stringify({ok:true,mode:contract.mode,authProvider:contract.authentication.provider,firebaseProjectId:contract.authentication.firebaseProjectId,dataStore:contract.dataStore.provider,stateCollection:contract.dataStore.stateCollection,conflictPolicy:contract.dataStore.conflictPolicy,baseReleaseSha:contract.baseRelease.gitHeadSha,defaultDestination:'/sana-v3.html',roleAwareHome:true,guidedFieldMode:true,territory360:true,documentSourceRegistry:true,sharePointBrowserWrite:false,productionExecutionAvailable:false,productionActivationAllowed:false,canonicalMutated:false},null,2));
