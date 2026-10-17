# SANA project exploration demo

A local-only synthetic experience for the first SANA journey: explore one project, view an approved-for-demo AgroWay progress projection, and simulate interest for human review.

## Run locally

From the repository root, run:

```sh
node apps/sana-project-demo/server.mjs
```

Open `http://127.0.0.1:4175/`. The built-in Node server binds to loopback and exposes only this demo's files plus the SANA read-only projection validator. It has no external packages, backend, persistence, analytics, authentication, real projects, or real user data.

## Data and limits

`project-projection-v1.json` is a synthetic fixture validated by `apps/sana-project-read/reader-v1.mjs`. The browser renders it only if the versioned contract and demo-only approval pass. The interest flow is held in memory, requests no contact details, sends no network request, and is discarded on reload. The confirmation illustrates a human-review step; it does not create a request, commitment, investment, payment, or field update.

This is a candidate demo, not a production application or deployment. A hosting destination, audience, authentication, and real-data access have not been approved for this app.
