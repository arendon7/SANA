import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  server: 'apps/control-web/server.mjs',
  html: 'apps/control-web/public/demo-auth.html',
  auth: 'apps/control-web/public/demo-auth.js',
  session: 'apps/control-web/public/demo-session.js',
  v3: 'apps/control-web/public/sana-v3.html',
  cloud: 'apps/control-web/public/sana-v3-cloud-state.js',
  access: 'apps/control-web/public/sana-v3-access.js',
  roleHome: 'apps/control-web/public/sana-v3-role-home.js',
  account: 'apps/control-web/public/sana-v3-account.js',
  contract: 'config/product/sana-demo-auth.json',
  firestoreRules: 'infra/firebase-demo/firestore.rules'
};

async function text(rel) {
  return readFile(path.join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [server, html, auth, session, v3, cloud, access, roleHome, account, contractText, firestoreRules] = await Promise.all([
  text(files.server),
  text(files.html),
  text(files.auth),
  text(files.session),
  text(files.v3),
  text(files.cloud),
  text(files.access),
  text(files.roleHome),
  text(files.account),
  text(files.contract),
  text(files.firestoreRules)
]);
const contract = JSON.parse(contractText);

assert(contract.mode === 'DEMO', 'DEMO_MODE_REQUIRED');
assert(contract.baseRelease?.immutable === true, 'BASE_RELEASE_MUST_REMAIN_IMMUTABLE');
assert(contract.baseRelease?.gitHeadSha === '7f2a47a99b7df6a1682a588d714aca9a18026a95', 'CERTIFIED_BASE_SHA_DRIFT');
assert(contract.authentication?.provider === 'FIREBASE_AUTH', 'FIREBASE_AUTH_REQUIRED');
assert(contract.authentication?.firebaseProjectId === 'sana-demo-web', 'BOUND_FIREBASE_PROJECT_REQUIRED');
assert(contract.authentication?.publicWebConfigBound === true, 'PUBLIC_FIREBASE_WEB_CONFIG_MUST_BE_BOUND');
assert(contract.dataStore?.provider === 'CLOUD_FIRESTORE', 'CLOUD_FIRESTORE_REQUIRED');
assert(contract.dataStore?.firebaseProjectId === 'sana-demo-web', 'FIRESTORE_PROJECT_MUST_MATCH_AUTH_PROJECT');
assert(contract.dataStore?.accessModel === 'OWNER_UID_ONLY', 'OWNER_UID_ACCESS_REQUIRED');
assert(contract.dataStore?.stateCollection === 'demo_user_state', 'DEMO_STATE_COLLECTION_REQUIRED');
assert(contract.dataStore?.stateDocumentId === 'AUTH_UID', 'DEMO_STATE_UID_DOCUMENT_REQUIRED');
assert(contract.dataStore?.optimisticRevisionRequired === true, 'OPTIMISTIC_REVISION_REQUIRED');
assert(contract.dataStore?.conflictPolicy === 'NO_SILENT_OVERWRITE', 'NO_SILENT_OVERWRITE_REQUIRED');
assert(contract.dataStore?.roleStoredOutsideOperationalState === true, 'ROLE_MUST_BE_OUTSIDE_OPERATIONAL_STATE');
assert(contract.safetyBoundary?.sandbox === true, 'SANDBOX_REQUIRED');
assert(contract.safetyBoundary?.syntheticDataOnly === true, 'SYNTHETIC_DATA_ONLY_REQUIRED');
assert(contract.safetyBoundary?.productionExecutionAvailable === false, 'PRODUCTION_EXECUTION_MUST_BE_FALSE');
assert(contract.safetyBoundary?.productionActivationAllowed === false, 'PRODUCTION_ACTIVATION_MUST_BE_FALSE');
assert(contract.safetyBoundary?.canonicalWriteAvailable === false, 'CANONICAL_WRITE_MUST_BE_FALSE');
assert(contract.safetyBoundary?.financialMovementAvailable === false, 'FINANCIAL_MOVEMENT_MUST_BE_FALSE');
assert(contract.safetyBoundary?.canonicalMutated === false, 'CANONICAL_MUTATED_MUST_BE_FALSE');

assert(html.includes('Crear cuenta'), 'SIGNUP_TAB_REQUIRED');
assert(auth.includes('Crear mi cuenta'), 'SIGNUP_ACTION_REQUIRED');
assert(html.includes('Productor demo'), 'PRODUCER_PERSONA_REQUIRED');
assert(html.includes('Técnico demo'), 'TECHNICAL_PERSONA_REQUIRED');
assert(html.includes('Inversionista demo'), 'INVESTOR_PERSONA_REQUIRED');
assert(html.includes('Administrador demo'), 'ADMIN_PERSONA_REQUIRED');
assert(html.includes('Explorar SANA sin registrarme'), 'GUEST_ENTRY_REQUIRED');
assert(html.includes('Firebase Authentication'), 'FIREBASE_DISCLOSURE_REQUIRED');

assert(auth.includes("|| '/sana-v3.html'"), 'SANA_V3_DEFAULT_DESTINATION_REQUIRED');
assert(auth.includes("nextUrl === '/sana-v3.html'"), 'SANA_V3_ALLOWLIST_REQUIRED');
assert(auth.includes("nextUrl.startsWith('/control')"), 'CONTROL_EXPLICIT_DESTINATION_MUST_REMAIN_ALLOWED');
assert(v3.includes('id="app-content"'), 'SANA_V3_APP_SHELL_REQUIRED');
assert(v3.includes('/sana-v3-cloud-state.js'), 'SANA_V3_CLOUD_STATE_WIRING_REQUIRED');
assert(v3.includes('/sana-v3-core.js'), 'SANA_V3_CORE_WIRING_REQUIRED');
assert(v3.includes('/sana-v3-role-home.js'), 'SANA_V3_ROLE_HOME_WIRING_REQUIRED');
assert(v3.includes('/sana-v3-runtime.js'), 'SANA_V3_RUNTIME_WIRING_REQUIRED');
assert(v3.includes('/sana-v3-access.js'), 'SANA_V3_ACCESS_GUARD_WIRING_REQUIRED');
assert(v3.includes('/sana-v3-account.js'), 'SANA_V3_ACCOUNT_WIRING_REQUIRED');

assert(auth.includes('createUserWithEmailAndPassword'), 'FIREBASE_SIGNUP_REQUIRED');
assert(auth.includes('signInWithEmailAndPassword'), 'FIREBASE_PASSWORD_SIGNIN_REQUIRED');
assert(auth.includes("'demo_profiles'"), 'FIRESTORE_PROFILE_COLLECTION_REQUIRED');
assert(auth.includes("authProvider: 'FIREBASE_AUTH'"), 'FIREBASE_IDENTITY_PROVIDER_REQUIRED');
assert(!/localStorage[^\n;]*password/i.test(auth), 'PASSWORD_MUST_NOT_BE_STORED_IN_LOCAL_STORAGE');
assert(!auth.includes('firebase_admin_private_key'), 'FIREBASE_ADMIN_KEY_MUST_NOT_REACH_BROWSER_AUTH');
assert(!auth.includes('serviceAccount'), 'FIREBASE_SERVICE_ACCOUNT_MUST_NOT_REACH_BROWSER_AUTH');
assert(!auth.includes('SUPABASE_AUTH'), 'SUPABASE_AUTH_MUST_BE_REMOVED');

assert(session.includes("environment !== 'DEMO'"), 'DEMO_SESSION_BOUNDARY_REQUIRED');
assert(session.includes('productionExecutionAvailable: false'), 'SESSION_PRODUCTION_EXECUTION_MUST_BE_FALSE');
assert(session.includes('productionActivationAllowed: false'), 'SESSION_PRODUCTION_ACTIVATION_MUST_BE_FALSE');
assert(session.includes('canonicalMutated: false'), 'SESSION_CANONICAL_MUTATION_MUST_BE_FALSE');
assert(session.includes('signOut'), 'FIREBASE_SIGNOUT_REQUIRED');
assert(session.includes('__SANA_CLOUD_STATE__'), 'STATE_FLUSH_BEFORE_SIGNOUT_REQUIRED');

assert(cloud.includes("const COLLECTION='demo_user_state'"), 'CLOUD_STATE_COLLECTION_REQUIRED');
assert(cloud.includes('runTransaction'), 'CLOUD_STATE_TRANSACTION_REQUIRED');
assert(cloud.includes('REMOTE_REVISION_CONFLICT'), 'CLOUD_STATE_CONFLICT_DETECTION_REQUIRED');
assert(cloud.includes('RULES_REQUIRED'), 'CLOUD_STATE_PERMISSION_FALLBACK_REQUIRED');
assert(cloud.includes('LOCAL_ONLY'), 'LOCAL_PROFILE_ISOLATION_REQUIRED');
assert(cloud.includes('ownerId'), 'OWNER_SCOPING_REQUIRED');
assert(!cloud.includes('productionExecutionAvailable=true'), 'CLOUD_STATE_PRODUCTION_EXECUTION_FORBIDDEN');
assert(!cloud.includes('canonicalMutated=true'), 'CLOUD_STATE_CANONICAL_MUTATION_FORBIDDEN');

assert(access.includes("new_user:new Set(['home','characterization','passport','impact','capital'])"), 'NEW_USER_LIMITED_VIEWS_REQUIRED');
assert(access.includes("investor:new Set(['home','territory','economics','reports','passport','impact','capital'])"), 'INVESTOR_READ_MODEL_REQUIRED');
assert(access.includes("new_user:['methodology','exportPassport','characterization:*']"), 'NEW_USER_LIMITED_ACTIONS_REQUIRED');
assert(access.includes("Usuario nuevo','Onboarding limitado"), 'NEW_USER_ROLE_LABEL_REQUIRED');
assert(access.includes('canAction'), 'ROLE_ACTION_GUARD_REQUIRED');
assert(access.includes('stopImmediatePropagation'), 'ROLE_CAPTURE_GUARD_REQUIRED');
assert(!access.includes("new_user:['*']"), 'NEW_USER_ADMIN_ESCALATION_FORBIDDEN');

assert(roleHome.includes('SANA · MI PREDIO'), 'PRODUCER_HOME_REQUIRED');
assert(roleHome.includes('SANA · CONSOLA TÉCNICA'), 'TECHNICAL_HOME_REQUIRED');
assert(roleHome.includes('SANA · VISTA DE EVIDENCIA'), 'INVESTOR_HOME_REQUIRED');
assert(roleHome.includes('SANA · RECORRIDO GUIADO'), 'VISITOR_HOME_REQUIRED');
assert(roleHome.includes('USUARIO NUEVO · ONBOARDING LIMITADO'), 'NEW_USER_HOME_REQUIRED');
assert(roleHome.includes("role==='admin'?originalHome"), 'ADMIN_HOME_MUST_PRESERVE_FULL_VIEW');
assert(!roleHome.includes('productionExecutionAvailable=true'), 'ROLE_HOME_PRODUCTION_EXECUTION_FORBIDDEN');

assert(account.includes('Mi cuenta y sincronización'), 'ACCOUNT_DIAGNOSTICS_REQUIRED');
assert(account.includes('NO DISPONIBLE EN BROWSER'), 'BROWSER_ROLE_ELEVATION_FORBIDDEN_DISCLOSURE_REQUIRED');
assert(account.includes('__SANA_CLOUD_STATE__'), 'ACCOUNT_CLOUD_STATUS_REQUIRED');
assert(account.includes('productionExecutionAvailable=false'), 'ACCOUNT_PRODUCTION_BOUNDARY_REQUIRED');
assert(account.includes('canonicalMutated=false'), 'ACCOUNT_CANONICAL_BOUNDARY_REQUIRED');

assert(server.includes("projectId: 'sana-demo-web'"), 'FIREBASE_DEFAULT_PROJECT_REQUIRED');
assert(server.includes("authDomain: 'sana-demo-web.firebaseapp.com'"), 'FIREBASE_DEFAULT_AUTH_DOMAIN_REQUIRED');
assert(server.includes("appId: '1:454867293969:web:1b4384820692b58449deb0'"), 'FIREBASE_DEFAULT_APP_ID_REQUIRED');
assert(server.includes('SANA_DEMO_FIREBASE_API_KEY'), 'FIREBASE_API_KEY_OVERRIDE_REQUIRED');
assert(server.includes('SANA_DEMO_FIREBASE_AUTH_DOMAIN'), 'FIREBASE_AUTH_DOMAIN_OVERRIDE_REQUIRED');
assert(server.includes('SANA_DEMO_FIREBASE_PROJECT_ID'), 'FIREBASE_PROJECT_ID_OVERRIDE_REQUIRED');
assert(server.includes('SANA_DEMO_FIREBASE_APP_ID'), 'FIREBASE_APP_ID_OVERRIDE_REQUIRED');
assert(!server.includes('SANA_DEMO_FIREBASE_ADMIN_PRIVATE_KEY'), 'FIREBASE_ADMIN_SECRET_MUST_NOT_BE_EXPOSED');
assert(!server.includes('SANA_DEMO_SUPABASE_'), 'SUPABASE_DEMO_CONFIG_MUST_BE_REMOVED');
assert(server.includes('OIDC_BROWSER_SESSION_ENDPOINT_FORBIDDEN'), 'PRODUCTION_IDENTITY_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes('CANONICAL_WRITE_BROWSER_ENDPOINT_FORBIDDEN'), 'CANONICAL_WRITE_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes('EXTERNAL_ACK_BROWSER_ENDPOINT_FORBIDDEN'), 'EXTERNAL_ACK_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes('PRODUCTION_ACTIVATION_BROWSER_ENDPOINT_FORBIDDEN'), 'PRODUCTION_ACTIVATION_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes("d10HumanProductApproval: 'PENDING'"), 'D10_MUST_REMAIN_PENDING');

assert(firestoreRules.includes('request.auth != null'), 'FIRESTORE_AUTH_REQUIRED');
assert(firestoreRules.includes('request.auth.uid == userId'), 'FIRESTORE_OWNER_UID_RULE_REQUIRED');
assert(firestoreRules.includes('match /demo_user_state/{userId}'), 'FIRESTORE_STATE_RULE_REQUIRED');
assert(firestoreRules.includes('request.resource.data.revision == resource.data.revision + 1'), 'FIRESTORE_STATE_REVISION_INCREMENT_REQUIRED');
assert(firestoreRules.includes("request.resource.data.environment == 'DEMO'"), 'FIRESTORE_STATE_DEMO_BOUNDARY_REQUIRED');
assert(firestoreRules.includes("request.resource.data.keys().hasOnly"), 'FIRESTORE_STATE_CLOSED_SHAPE_REQUIRED');
assert(!firestoreRules.includes('allow read, write: if true'), 'FIRESTORE_OPEN_RULE_FORBIDDEN');

console.log(JSON.stringify({
  ok: true,
  mode: contract.mode,
  authProvider: contract.authentication.provider,
  firebaseProjectId: contract.authentication.firebaseProjectId,
  dataStore: contract.dataStore.provider,
  stateCollection: contract.dataStore.stateCollection,
  conflictPolicy: contract.dataStore.conflictPolicy,
  baseReleaseSha: contract.baseRelease.gitHeadSha,
  defaultDestination: '/sana-v3.html',
  roleAwareHome: true,
  accountDiagnostics: true,
  personas: contract.personas.map((persona) => persona.id),
  productionExecutionAvailable: false,
  productionActivationAllowed: false,
  canonicalMutated: false
}, null, 2));
