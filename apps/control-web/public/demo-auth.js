const config = window.__SANA_DEMO_CONFIG__ || {};
const nextUrl = new URLSearchParams(window.location.search).get('next') || '/control';
const safeNext = nextUrl.startsWith('/control') ? nextUrl : '/control';
const FIREBASE_SDK_VERSION = '12.16.0';

const tabs = {
  signin: document.getElementById('signin-tab'),
  signup: document.getElementById('signup-tab')
};
const form = document.getElementById('auth-form');
const nameField = document.getElementById('name-field');
const fullName = document.getElementById('full-name');
const email = document.getElementById('email');
const password = document.getElementById('password');
const submitButton = document.getElementById('submit-button');
const status = document.getElementById('auth-status');
const guestButton = document.getElementById('guest-button');
let mode = 'signin';
let firebase = null;

function setStatus(message = '', kind = '') {
  status.textContent = message;
  status.className = `status${kind ? ` ${kind}` : ''}`;
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === 'signup';
  tabs.signin.classList.toggle('active', !isSignup);
  tabs.signup.classList.toggle('active', isSignup);
  tabs.signin.setAttribute('aria-selected', String(!isSignup));
  tabs.signup.setAttribute('aria-selected', String(isSignup));
  nameField.classList.toggle('hidden', !isSignup);
  password.autocomplete = isSignup ? 'new-password' : 'current-password';
  submitButton.textContent = isSignup ? 'Crear mi cuenta' : 'Entrar';
  setStatus('');
}

function saveIdentity(identity) {
  localStorage.setItem('sana.demo.identity', JSON.stringify({
    ...identity,
    environment: 'DEMO',
    productionExecutionAvailable: false,
    productionActivationAllowed: false,
    canonicalMutated: false,
    signedInAt: new Date().toISOString()
  }));
}

function goToDemo() {
  window.location.assign(safeNext);
}

function enterLocalProfile(role, displayName) {
  saveIdentity({
    id: `demo-${role}`,
    email: `${role}@demo.sana.local`,
    displayName,
    role,
    authProvider: 'LOCAL_DEMO_PROFILE'
  });
  goToDemo();
}

function firebaseConfig() {
  return {
    apiKey: config.firebaseApiKey || '',
    authDomain: config.firebaseAuthDomain || '',
    projectId: config.firebaseProjectId || '',
    appId: config.firebaseAppId || ''
  };
}

function firebaseConfigured() {
  const cfg = firebaseConfig();
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

async function getFirebase() {
  if (firebase) return firebase;
  if (!firebaseConfigured()) return null;

  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`)
  ]);

  const app = appModule.initializeApp(firebaseConfig());
  const auth = authModule.getAuth(app);
  await authModule.setPersistence(auth, authModule.browserLocalPersistence);
  const db = firestoreModule.getFirestore(app);

  firebase = { app, auth, db, authModule, firestoreModule };
  return firebase;
}

async function readProfile(client, user) {
  try {
    const ref = client.firestoreModule.doc(client.db, 'demo_profiles', user.uid);
    const snapshot = await client.firestoreModule.getDoc(ref);
    if (!snapshot.exists()) return null;
    return snapshot.data();
  } catch {
    return null;
  }
}

async function persistProfile(client, user, { displayName, role = 'new_user' }) {
  const ref = client.firestoreModule.doc(client.db, 'demo_profiles', user.uid);
  await client.firestoreModule.setDoc(ref, {
    userId: user.uid,
    email: user.email || '',
    displayName,
    role,
    environment: 'DEMO',
    updatedAt: client.firestoreModule.serverTimestamp()
  }, { merge: true });
}

async function hydrateExistingSession() {
  try {
    const client = await getFirebase();
    if (!client) return;
    const user = await new Promise((resolve) => {
      let unsubscribe = () => {};
      unsubscribe = client.authModule.onAuthStateChanged(client.auth, (currentUser) => {
        unsubscribe();
        resolve(currentUser);
      });
    });
    if (!user) return;
    const profile = await readProfile(client, user);
    saveIdentity({
      id: user.uid,
      email: user.email || '',
      displayName: profile?.displayName || user.displayName || user.email || 'Usuario SANA',
      role: profile?.role || 'new_user',
      authProvider: 'FIREBASE_AUTH'
    });
  } catch {
    // Local sandbox profiles keep the demo usable when Firebase is unavailable.
  }
}

function friendlyFirebaseError(error) {
  const code = error?.code || '';
  if (code === 'auth/email-already-in-use') return 'Ese correo ya tiene una cuenta. Intenta ingresar.';
  if (code === 'auth/invalid-credential') return 'Correo o contraseña incorrectos.';
  if (code === 'auth/weak-password') return 'Usa una contraseña más segura.';
  if (code === 'auth/too-many-requests') return 'Hay demasiados intentos. Intenta nuevamente más tarde.';
  return error?.message || 'No fue posible completar el acceso.';
}

async function submitAuth(event) {
  event.preventDefault();
  setStatus('');
  if (!email.validity.valid) return setStatus('Ingresa un correo válido.', 'error');
  if (password.value.length < 6) return setStatus('La contraseña debe tener al menos 6 caracteres.', 'error');
  if (mode === 'signup' && !fullName.value.trim()) return setStatus('Ingresa tu nombre.', 'error');

  submitButton.disabled = true;
  try {
    const client = await getFirebase();
    if (!client) {
      setStatus('El registro por correo quedará habilitado al conectar el proyecto Firebase SANA-DEMO. Mientras tanto puedes entrar con cualquiera de los perfiles demo.', 'error');
      return;
    }

    if (mode === 'signup') {
      const credential = await client.authModule.createUserWithEmailAndPassword(
        client.auth,
        email.value.trim(),
        password.value
      );
      await client.authModule.updateProfile(credential.user, { displayName: fullName.value.trim() });
      await persistProfile(client, credential.user, { displayName: fullName.value.trim(), role: 'new_user' });
      saveIdentity({
        id: credential.user.uid,
        email: credential.user.email || email.value.trim(),
        displayName: fullName.value.trim(),
        role: 'new_user',
        authProvider: 'FIREBASE_AUTH'
      });
      return goToDemo();
    }

    const credential = await client.authModule.signInWithEmailAndPassword(
      client.auth,
      email.value.trim(),
      password.value
    );
    const profile = await readProfile(client, credential.user);
    const displayName = profile?.displayName || credential.user.displayName || credential.user.email || 'Usuario SANA';
    const role = profile?.role || 'new_user';
    if (!profile) await persistProfile(client, credential.user, { displayName, role });
    saveIdentity({
      id: credential.user.uid,
      email: credential.user.email || email.value.trim(),
      displayName,
      role,
      authProvider: 'FIREBASE_AUTH'
    });
    goToDemo();
  } catch (error) {
    setStatus(friendlyFirebaseError(error), 'error');
  } finally {
    submitButton.disabled = false;
  }
}

tabs.signin.addEventListener('click', () => setMode('signin'));
tabs.signup.addEventListener('click', () => setMode('signup'));
form.addEventListener('submit', submitAuth);
guestButton.addEventListener('click', () => enterLocalProfile('visitor', 'Visitante demo'));

document.querySelectorAll('[data-demo-role]').forEach((button) => {
  button.addEventListener('click', () => {
    const role = button.dataset.demoRole;
    const label = button.querySelector('strong')?.textContent?.replace(' demo', '') || 'Usuario';
    enterLocalProfile(role, `${label} demo`);
  });
});

await hydrateExistingSession();
