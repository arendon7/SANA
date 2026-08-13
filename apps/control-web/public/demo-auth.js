const config = window.__SANA_DEMO_CONFIG__ || {};
const nextUrl = new URLSearchParams(window.location.search).get('next') || '/control';
const safeNext = nextUrl.startsWith('/control') ? nextUrl : '/control';

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
let supabase = null;

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

async function getSupabase() {
  if (supabase) return supabase;
  if (!config.supabaseUrl || !config.supabasePublishableKey) return null;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return supabase;
}

async function hydrateExistingSession() {
  try {
    const client = await getSupabase();
    if (!client) return;
    const { data } = await client.auth.getSession();
    const user = data?.session?.user;
    if (!user) return;
    saveIdentity({
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.full_name || user.email || 'Usuario SANA',
      role: user.user_metadata?.demo_role || 'new_user',
      authProvider: 'SUPABASE_AUTH'
    });
  } catch {
    // The demo remains usable through local sandbox profiles if Supabase is unavailable.
  }
}

async function submitAuth(event) {
  event.preventDefault();
  setStatus('');
  if (!email.validity.valid) return setStatus('Ingresa un correo válido.', 'error');
  if (password.value.length < 6) return setStatus('La contraseña debe tener al menos 6 caracteres.', 'error');
  if (mode === 'signup' && !fullName.value.trim()) return setStatus('Ingresa tu nombre.', 'error');

  submitButton.disabled = true;
  try {
    const client = await getSupabase();
    if (!client) {
      setStatus('El registro por correo quedará habilitado al conectar el proyecto Supabase SANA-DEMO. Mientras tanto puedes entrar con cualquiera de los perfiles demo.', 'error');
      return;
    }

    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: {
          data: {
            full_name: fullName.value.trim(),
            demo_role: 'new_user',
            environment: 'DEMO'
          }
        }
      });
      if (error) throw error;
      if (data.session && data.user) {
        saveIdentity({
          id: data.user.id,
          email: data.user.email || email.value.trim(),
          displayName: fullName.value.trim(),
          role: 'new_user',
          authProvider: 'SUPABASE_AUTH'
        });
        return goToDemo();
      }
      setStatus('Cuenta creada. Revisa tu correo si la confirmación está habilitada en Supabase.', 'success');
      return;
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    });
    if (error) throw error;
    if (!data.user) throw new Error('No fue posible recuperar el usuario.');
    saveIdentity({
      id: data.user.id,
      email: data.user.email || email.value.trim(),
      displayName: data.user.user_metadata?.full_name || data.user.email || 'Usuario SANA',
      role: data.user.user_metadata?.demo_role || 'new_user',
      authProvider: 'SUPABASE_AUTH'
    });
    goToDemo();
  } catch (error) {
    setStatus(error?.message || 'No fue posible completar el acceso.', 'error');
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
