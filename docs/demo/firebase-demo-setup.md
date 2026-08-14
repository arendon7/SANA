# SANA DEMO — Firebase setup

This document connects the isolated SANA DEMO branch to Firebase without touching the certified RC2 production bindings.

## Current bound project

The DEMO web runtime is bound to the public Firebase Web App configuration for:

```text
projectId: sana-demo-web
authDomain: sana-demo-web.firebaseapp.com
appId: 1:454867293969:web:1b4384820692b58449deb0
```

The Firebase Web API key is public client configuration, not an Admin credential. No service account, Admin SDK private key, database password or production credential is embedded in the browser runtime.

Environment variables remain available only as optional overrides:

```text
SANA_DEMO_FIREBASE_API_KEY
SANA_DEMO_FIREBASE_AUTH_DOMAIN
SANA_DEMO_FIREBASE_PROJECT_ID
SANA_DEMO_FIREBASE_STORAGE_BUCKET
SANA_DEMO_FIREBASE_MESSAGING_SENDER_ID
SANA_DEMO_FIREBASE_APP_ID
SANA_DEMO_FIREBASE_MEASUREMENT_ID
```

## 1. Authentication console setting

Firebase Console → Authentication → Sign-in method → Email/Password → Enable.

The app uses only email/password for self-registration in the demo. Predefined Productor, Técnico, Inversionista, Administrador and Visitante personas remain local sandbox profiles.

A newly self-registered Firebase account starts with role `new_user`; the browser cannot promote that persisted role. In SANA V3 this role receives a limited onboarding view rather than administrator permissions.

## 2. Firestore security rules

Cloud Firestore must not use permissive test rules.

Publish exactly the repository rules from:

```text
infra/firebase-demo/firestore.rules
```

The rules define two owner-scoped resources:

```text
demo_profiles/{uid}
demo_user_state/{uid}
```

`demo_profiles/{uid}` stores the authentication profile and persisted role. A user can only read/write their own profile and cannot change their own persisted role through the browser.

`demo_user_state/{uid}` stores the user's DEMO operating state. It is deliberately separate from the role/profile and has these protections:

- `request.auth.uid == uid` is mandatory.
- `environment` must remain `DEMO`.
- only the declared top-level fields are accepted.
- the document revision must increase exactly by `+1` on each update.
- delete is denied.
- every other Firestore path is denied by default.

The browser uses optimistic concurrency. If the remote revision advanced while a device has unsaved local work, SANA shows a conflict and does **not** silently overwrite either side.

### Publish in Firebase Console

Firebase Console → Firestore Database → **Rules** → replace the current rules with the complete contents of `infra/firebase-demo/firestore.rules` → **Publish**.

Until these updated rules are published, SANA V3 remains functional with isolated local storage and shows `Reglas pendientes`; it must not label local records as synchronized or ACK.

## 3. Multiuser state model

Every signed-in identity receives a separate browser scope. When the user changes account/profile, SANA saves the previous owner's local scope and loads the new owner's scope before the application state is constructed.

For Firebase-authenticated accounts, SANA additionally synchronizes the following DEMO state families to `demo_user_state/{uid}`:

- completed activities;
- local records and field queue;
- advisory messages;
- plan reviews / selected plan;
- characterization;
- Passport selection;
- Capital Readiness configuration;
- crop economics;
- SANA Impact methodology state;
- last mobile-field context.

Predefined local personas remain browser-only and do not write Firestore.

## 4. Runtime check

Start the DEMO runtime and request:

```text
GET /demo/health
```

Expected:

```json
{
  "status": "OK",
  "environment": "DEMO",
  "firebaseConfigured": true,
  "firebaseProjectId": "sana-demo-web",
  "localProfilesEnabled": true,
  "productionExecutionAvailable": false,
  "productionActivationAllowed": false,
  "executionState": "NOT_EXECUTED",
  "canonicalMutated": false
}
```

## 5. Functional acceptance

Verify all of the following:

1. Email/Password is enabled in Firebase Authentication.
2. The repository Firestore rules are published.
3. Create a new email/password account through SANA DEMO.
4. Confirm the UI shows `Usuario nuevo · Onboarding limitado`, not Administrator.
5. Complete or modify a DEMO onboarding/characterization field.
6. Confirm `demo_profiles/{uid}` exists in Firestore.
7. Confirm `demo_user_state/{uid}` is created and its `revision` is at least `1`.
8. Sign out and sign in again with that account; confirm its DEMO state returns.
9. Confirm a second user cannot read either the first user's profile or state document.
10. Confirm switching between local DEMO personas does not leak records from one local identity into another.
11. Confirm an Inversionista or Visitante cannot execute field/task/inventory actions.
12. Confirm all five instant demo personas still enter without registration.
13. Confirm `/api/control/production-activation` remains unavailable.
14. Confirm D10 remains pending and no canonical write or financial movement is available.

## Production boundary

This setup is DEMO-only. It must not be used as a substitute for the production OIDC/MFA boundary, D10 human approval, external ACK, commissioning or activation ceremony. The certified RC2 base remains immutable.
