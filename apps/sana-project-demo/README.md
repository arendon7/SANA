# SANA project dossier demo

A local-only synthetic experience for the first SANA journey: explore a fictional productive project, review its land, plants, capital allocation and illustrative production model, read an approved-for-demo AgroWay progress projection, and simulate interest for human review.

## Run locally

From the repository root, run:

```sh
node apps/sana-project-demo/server.mjs
```

Open `http://127.0.0.1:4175/`. The built-in Node server binds to loopback and exposes only this demo's files plus the SANA read-only projection validator. It has no external packages, product backend, persistence, analytics, authentication, real projects, or real user data.

## Data and limits

`project-dossier-v1.json` contains a fully fictional SANA case with an invented farmer and property, area, plant count, capital uses, and an illustrative year-five production/economic scenario. These numbers only demonstrate how a dossier can show its assumptions and arithmetic. They are not agronomic benchmarks, a real budget, validated forecast, investment offer, net profit, dividend, or participant return. `netUtilityEstimate` is deliberately uncalculated because the sample does not model all costs and terms. `project-projection-v1.json` is a separate synthetic AgroWay fixture validated by `apps/sana-project-read/reader-v1.mjs`; stale or unmapped readings stay hidden. The 12 kg example is a recorded synthetic harvest, not a yield projection and does not feed the year-five model. The interest flow is held in memory, requests no contact details, sends no network request, and is discarded on reload. The confirmation illustrates a human-review step; it does not create a request, commitment, investment, payment, or field update.

The participant portfolio is a planned module described in the interface. No account, holdings, commitments, or returns are shown in this demo. `DESIGN.md` and `.impeccable/design.json` document a provisional SANA-specific direction; their palette and local font fallbacks are not approved brand tokens.

This is a candidate demo, not a production application or deployment. A hosting destination, audience, authentication, and real-data access have not been approved for this app.
