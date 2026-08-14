const key = 'sana.demo.identity';
const config = window.__SANA_DEMO_CONFIG__ || {};
const FIREBASE_SDK_VERSION = '12.16.0';
let identity = null;
try {
  identity = JSON.parse(localStorage.getItem(key) || 'null');
} catch {
  identity = null;
}

async function firebaseSignOut() {
  if (identity?.authProvider !== 'FIREBASE_AUTH') return;
  if (!config.firebaseApiKey || !config.firebaseAuthDomain || !config.firebaseProjectId || !config.firebaseAppId) return;

  try {
    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
    const [appModule, authModule] = await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-auth.js`)
    ]);
    const existing = appModule.getApps().find((app) => app.name === 'sana-demo-session-signout');
    const app = existing || appModule.initializeApp({
      apiKey: config.firebaseApiKey,
      authDomain: config.firebaseAuthDomain,
      projectId: config.firebaseProjectId,
      appId: config.firebaseAppId
    }, 'sana-demo-session-signout');
    const auth = authModule.getAuth(app);
    await authModule.signOut(auth);
  } catch {
    // Local session cleanup still proceeds if the Firebase network call fails.
  }
}

async function flushDemoState() {
  try {
    const flush = window.__SANA_CLOUD_STATE__?.flush;
    if (typeof flush !== 'function') return;
    await Promise.race([
      flush(),
      new Promise((resolve) => setTimeout(resolve, 1400))
    ]);
  } catch {
    // Sign-out must remain available even if cloud state cannot be flushed.
  }
}

if (!identity || identity.environment !== 'DEMO') {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace('/demo-auth.html?next=' + next);
} else {
  window.__SANA_DEMO_IDENTITY__ = Object.freeze({ ...identity });
  window.__SANA_RUNTIME_BOUNDARY__ = Object.freeze({
    environment: 'DEMO',
    sandbox: true,
    productionExecutionAvailable: false,
    productionActivationAllowed: false,
    canonicalMutated: false
  });

  const mount = () => {
    const style = document.createElement('style');
    style.textContent = '#sana-demo-session{position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:999px;background:#14281c;color:#f7faf5;box-shadow:0 10px 30px rgba(0,0,0,.18);font:12px/1.2 system-ui,sans-serif}#sana-demo-session b{color:#cfe0a7;font-size:10px;letter-spacing:.08em}#sana-demo-session button{border:0;border-left:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;padding:2px 4px 2px 9px;cursor:pointer}';
    document.head.appendChild(style);
    const badge = document.createElement('div');
    badge.id = 'sana-demo-session';
    const label = document.createElement('span');
    const strong = document.createElement('b');
    strong.textContent = 'DEMO';
    label.append(strong, document.createTextNode(' · ' + (identity.displayName || identity.email || 'Usuario')));
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.textContent = 'Salir';
    exit.addEventListener('click', async () => {
      exit.disabled = true;
      await flushDemoState();
      await firebaseSignOut();
      localStorage.removeItem(key);
      window.location.replace('/demo-auth.html');
    });
    badge.append(label, exit);
    document.body.appendChild(badge);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
}
