# SANA DEMO — Firebase setup

This document connects the isolated SANA DEMO branch to a Firebase project without touching the certified RC2 production bindings.

## 1. Create the Firebase project

In Firebase Console create a project named `SANA-DEMO` on the Spark plan. Do not link the demo to the production Supabase project.

## 2. Register a Web app

Create a Web app named `sana-demo-web`. Copy these four public configuration values:

- `apiKey`
- `authDomain`
- `projectId`
- `appId`

The SANA demo server expects them as:

```text
SANA_DEMO_FIREBASE_API_KEY=<apiKey>
SANA_DEMO_FIREBASE_AUTH_DOMAIN=<authDomain>
SANA_DEMO_FIREBASE_PROJECT_ID=<projectId>
SANA_DEMO_FIREBASE_APP_ID=<appId>
```

Do not add Firebase Admin SDK credentials, service account JSON, private keys, database passwords, or production credentials to browser configuration.

## 3. Enable simple Authentication

Firebase Console → Authentication → Sign-in method → Email/Password → Enable.

The app uses only email/password for self-registration in the demo. Predefined Productor, Técnico, Inversionista, Administrador and Visitante personas remain local sandbox profiles.

## 4. Create Firestore

Create Cloud Firestore for the Firebase project. Do not leave permissive test rules in place.

Deploy the repository rules from:

```text
infra/firebase-demo/firestore.rules
```

The rules allow an authenticated user to access only `demo_profiles/{theirUid}` and deny every other document by default.

## 5. Runtime configuration

Provide the four `SANA_DEMO_FIREBASE_*` variables to the demo hosting runtime. They are web application configuration, not Firebase Admin credentials.

Check:

```text
GET /demo/health
```

Expected after configuration:

```json
{
  "status": "OK",
  "environment": "DEMO",
  "firebaseConfigured": true,
  "localProfilesEnabled": true,
  "productionExecutionAvailable": false,
  "productionActivationAllowed": false,
  "executionState": "NOT_EXECUTED",
  "canonicalMutated": false
}
```

## 6. Functional acceptance

Verify all of the following:

1. Create a new email/password account.
2. Sign out and sign in again with that account.
3. Confirm a `demo_profiles/{uid}` document exists in Firestore.
4. Confirm one user cannot read another user's profile.
5. Confirm all five instant demo personas still enter without registration.
6. Confirm `/api/control/production-activation` remains unavailable.
7. Confirm D10 remains pending and no canonical write or financial movement is available.

## Production boundary

This setup is DEMO-only. It must not be used as a substitute for the production OIDC/MFA boundary, D10 human approval, external ACK, commissioning or activation ceremony. The certified RC2 base remains immutable.
