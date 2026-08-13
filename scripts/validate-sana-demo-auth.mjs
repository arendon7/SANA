import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  server: 'apps/control-web/server.mjs',
  html: 'apps/control-web/public/demo-auth.html',
  auth: 'apps/control-web/public/demo-auth.js',
  session: 'apps/control-web/public/demo-session.js',
  contract: 'config/product/sana-demo-auth.json'
};

async function text(rel) {
  return readFile(path.join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [server, html, auth, session, contractText] = await Promise.all([
  text(files.server),
  text(files.html),
  text(files.auth),
  text(files.session),
  text(files.contract)
]);
const contract = JSON.parse(contractText);

assert(contract.mode === 'DEMO', 'DEMO_MODE_REQUIRED');
assert(contract.baseRelease?.immutable === true, 'BASE_RELEASE_MUST_REMAIN_IMMUTABLE');
assert(contract.baseRelease?.gitHeadSha === '7f2a47a99b7df6a1682a588d714aca9a18026a95', 'CERTIFIED_BASE_SHA_DRIFT');
assert(contract.safetyBoundary?.sandbox === true, 'SANDBOX_REQUIRED');
assert(contract.safetyBoundary?.syntheticDataOnly === true, 'SYNTHETIC_DATA_ONLY_REQUIRED');
assert(contract.safetyBoundary?.productionExecutionAvailable === false, 'PRODUCTION_EXECUTION_MUST_BE_FALSE');
assert(contract.safetyBoundary?.productionActivationAllowed === false, 'PRODUCTION_ACTIVATION_MUST_BE_FALSE');
assert(contract.safetyBoundary?.canonicalWriteAvailable === false, 'CANONICAL_WRITE_MUST_BE_FALSE');
assert(contract.safetyBoundary?.financialMovementAvailable === false, 'FINANCIAL_MOVEMENT_MUST_BE_FALSE');
assert(contract.safetyBoundary?.canonicalMutated === false, 'CANONICAL_MUTATED_MUST_BE_FALSE');

assert(html.includes('Crear mi cuenta'), 'SIGNUP_UI_REQUIRED');
assert(html.includes('Productor demo'), 'PRODUCER_PERSONA_REQUIRED');
assert(html.includes('Técnico demo'), 'TECHNICAL_PERSONA_REQUIRED');
assert(html.includes('Inversionista demo'), 'INVESTOR_PERSONA_REQUIRED');
assert(html.includes('Administrador demo'), 'ADMIN_PERSONA_REQUIRED');
assert(html.includes('Explorar SANA sin registrarme'), 'GUEST_ENTRY_REQUIRED');

assert(auth.includes('signUp('), 'SUPABASE_SIGNUP_REQUIRED');
assert(auth.includes('signInWithPassword('), 'SUPABASE_PASSWORD_SIGNIN_REQUIRED');
assert(!/localStorage[^\n;]*password/i.test(auth), 'PASSWORD_MUST_NOT_BE_STORED_IN_LOCAL_STORAGE');
assert(!auth.includes('service_role'), 'SERVICE_ROLE_MUST_NOT_REACH_BROWSER_AUTH');

assert(session.includes("environment !== 'DEMO'"), 'DEMO_SESSION_BOUNDARY_REQUIRED');
assert(session.includes('productionExecutionAvailable: false'), 'SESSION_PRODUCTION_EXECUTION_MUST_BE_FALSE');
assert(session.includes('productionActivationAllowed: false'), 'SESSION_PRODUCTION_ACTIVATION_MUST_BE_FALSE');
assert(session.includes('canonicalMutated: false'), 'SESSION_CANONICAL_MUTATION_MUST_BE_FALSE');

assert(server.includes('SANA_DEMO_SUPABASE_URL'), 'DEMO_SUPABASE_URL_CONFIG_REQUIRED');
assert(server.includes('SANA_DEMO_SUPABASE_PUBLISHABLE_KEY'), 'DEMO_SUPABASE_PUBLISHABLE_KEY_REQUIRED');
assert(!server.includes('SANA_DEMO_SUPABASE_SERVICE_ROLE'), 'SERVICE_ROLE_ENV_MUST_NOT_BE_EXPOSED');
assert(server.includes('OIDC_BROWSER_SESSION_ENDPOINT_FORBIDDEN'), 'PRODUCTION_IDENTITY_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes('CANONICAL_WRITE_BROWSER_ENDPOINT_FORBIDDEN'), 'CANONICAL_WRITE_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes('EXTERNAL_ACK_BROWSER_ENDPOINT_FORBIDDEN'), 'EXTERNAL_ACK_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes('PRODUCTION_ACTIVATION_BROWSER_ENDPOINT_FORBIDDEN'), 'PRODUCTION_ACTIVATION_BROWSER_BLOCK_MUST_REMAIN');
assert(server.includes("d10HumanProductApproval: 'PENDING'"), 'D10_MUST_REMAIN_PENDING');

console.log(JSON.stringify({
  ok: true,
  mode: contract.mode,
  baseReleaseSha: contract.baseRelease.gitHeadSha,
  personas: contract.personas.map((persona) => persona.id),
  productionExecutionAvailable: false,
  productionActivationAllowed: false,
  canonicalMutated: false
}, null, 2));
