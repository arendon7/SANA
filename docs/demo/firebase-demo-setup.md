# SANA DEMO — Firebase setup

This document connects the isolated SANA DEMO branch to Firebase without touching the certified RC2 production bindings.

## Current bound project

The DEMO web runtime is now bound to the public Firebase Web App configuration for:

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

## 2. Firestore security rules

Cloud Firestore must not use permissive test rules.

Publish exactly the repository rules from:

```text
infra/firebase-demo/firestore.rules
```

The rules allow an authenticated user to access only `demo_profiles/{theirUid}` and deny every other document by default.

## 3. Runtime check

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

## 4. Functional acceptance

Verify all of the following:

1. Email/Password is enabled in Firebase Authentication.
2. The repository Firestore rules are published.
3. Create a new email/password account through SANA DEMO.
4. Sign out and sign in again with that account.
5. Confirm a `demo_profiles/{uid}` document exists in Firestore.
6. Confirm one user cannot read another user's profile.
7. Confirm all five instant demo personas still enter without registration.
8. Confirm `/api/control/production-activation` remains unavailable.
9. Confirm D10 remains pending and no canonical write or financial movement is available.

## Production boundary

This setup is DEMO-only. It must not be used as a substitute for the production OIDC/MFA boundary, D10 human approval, external ACK, commissioning or activation ceremony. The certified RC2 base remains immutable.
