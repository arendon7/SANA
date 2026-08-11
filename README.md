# SANA / AGROWAY

Repositorio técnico de la plataforma agrícola SANA / AGROWAY.

## Estado actual

La v0.16 original **nunca llegó a generarse como ZIP** y el ZIP histórico v0.15 ya no está recuperable. Para no bloquear el desarrollo, la cadena se reconstruyó de forma explícita y auditable:

`v0.15R-full RECONSTRUCTED → v0.16R RECONSTRUCTED → v0.17 → v0.18 → v0.19 → v0.20 → v0.20.1 → v0.20.2-rc4`

La referencia histórica de v0.15 se conserva únicamente como provenance:

`323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`

### v0.15R-full

La base reconstruida recupera de forma funcional los hechos técnicos documentados de v0.15:

- 26 workspaces.
- 133 Domain Events.
- 109 permisos.
- 21 migraciones SQL.
- 19 documentos Canon.
- 16 memorias.
- ProductManifest `STAGED → VALIDATED → APPROVED → PUBLISHED`.
- Product → ProductVersion → SKU.
- identidad MKTG separada de aptitud técnica.
- snapshots inmutables y omisión/inactivación explícita de SKU.
- Demand Forecast PIPELINE / COMMITTED / ORDERED en 30/60/90.
- salvaguardas de Purchase Orders.
- dominios de productor/finca/lote/ciclo, agronomía, finanzas, supply, field/offline, monitoreo, cosecha/liquidación, Impact Ledger y Traceability Passport.

SHA de la reconstrucción:

`ad1de9f9442f70613433f8721a021c09bb50b4d08ca196213b67aefca447db21`

Esta reconstrucción **no es byte-identical** al release histórico perdido.

## v0.20.2-rc4 — full reconstructed build

El overlay acumulativo se aplicó positivamente sobre `v0.15R-full` usando el mismo motor que mantiene cerrado el gate de producción contra el SHA histórico.

Resultado materializado:

- **41 workspaces**.
- **218 Domain Events conceptuales**.
- **28 migraciones entregadas** (`0001`–`0022`, incluyendo sufijos históricos reconstruidos).
- versiones internas de todos los workspaces normalizadas a `0.20.2-rc4`.
- cero mismatches de dependencias internas.
- `package-lock.json` generado offline.
- `npm ci --offline --ignore-scripts`: PASS.
- TypeScript strict del repositorio completo: PASS.
- guardrails/validators v0.15R–v0.20.2: PASS.
- v0.16R focal runtime: **9/9 PASS**.
- inversión/certificación/replay focal runtime: **13/13 PASS**.
- SQL RLS defectuoso de la migración reconstruida 0016: corregido y protegido por guardrail.

Full reconstructed repository SHA-256:

`b444f4e7cc68000ea8a030a53dccb96ffd905588fd146245883b7076c37ab783`

## Trust boundary

Existen tres niveles explícitos:

1. `PRODUCTION_EXACT_V015_SHA`: solo acepta el ZIP histórico exacto v0.15 si alguna vez reaparece.
2. `RECONSTRUCTED_V015R_FULL_NOT_HISTORICAL_SHA`: permite continuar desarrollo y pruebas sobre la base funcional reconstruida.
3. `SYNTHETIC_COMPATIBILITY_ONLY`: únicamente smoke tests del motor de overlay.

El gate de producción **rechaza** tanto la base reconstruida como el fixture sintético. Por tanto, reconstructed PASS no se representa como equivalencia histórica byte-for-byte.

## Pendiente de runtime

- Vitest real.
- PostgreSQL/PostGIS 0001–0022 y pruebas RLS cross-tenant.
- builds Vite/Expo.
- Graphify real.
- certificación de un piloto agrícola real.

La recuperación del ZIP histórico v0.15 queda como una tarea de provenance; ya no bloquea el desarrollo reconstruido.

Ver `AGROWAY_BASELINE_LOCK.json`, `AGROWAY_PATCH_LOCK.json`, `INTEGRATION_STATUS.json` y la documentación de reconstrucción/hardening.
