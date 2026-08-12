# SANA / AGROWAY

Repositorio técnico de la plataforma agrícola SANA / AGROWAY.

## Estado actual

La v0.16 original nunca llegó a generarse como ZIP y el ZIP histórico v0.15 no está recuperado. La cadena vigente es explícitamente reconstruida y auditable:

`v0.15R-full RECONSTRUCTED → v0.16R RECONSTRUCTED → v0.17 → v0.18 → v0.19 → v0.20 → v0.20.1 → v0.20.2 → v0.21 FIELD`

Referencia histórica v0.15:

`323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`

La reconstrucción no se representa como byte-identical al release histórico perdido.

## AGROWAY FIELD v0.21

Diez verticales operativas/runtime están en revisión:

1. FIELD_HOME
2. CROP_CYCLE_WORKSPACE
3. TASK_EVIDENCE_CAPTURE
4. INVENTORY_APPLICATION_WORKFLOW
5. MONITORING_INCIDENT_RESOLUTION
6. TRACEABILITY_PASSPORT_ASSEMBLY
7. HARVEST_SALE_SETTLEMENT_WORKSPACE
8. OFFLINE_SYNC_CONFLICT_REVIEW
9. ACCESS_ENTITLEMENTS_PORTABILITY
10. LOCAL_DEV_BACKEND_RUNTIME

D10 Human Product Approval permanece **PENDING**. El PR #4 continúa draft y no debe fusionarse ni marcarse Product Approved sin aceptación humana explícita.

## Runtime cerrado en GitHub Actions

### PostgreSQL/PostGIS acumulativo — PASS

Sobre una base limpia `postgis/postgis:16-3.4`:

- 30 migraciones físicas;
- ejecución acumulativa `0001 → 0024`;
- `ON_ERROR_STOP=1`;
- suites adversariales históricas/reconstruidas y v0.21;
- tenant RLS + tenant-aware FKs;
- restricciones de certificación/piloto;
- Copilot evidence binding;
- external-data integrity;
- access/entitlements;
- sync ingress/ACK.

### Vitest real — PASS

`vitest 4.1.7`, Node 22:

- **12/12** archivos `.spec.ts`;
- **28/28** tests;
- source closure verificado por SHA-256;
- `tsconfig` alpha10 verificado por digest JSON canónico;
- instalación aislada con `pnpm@10.15.0` vía Corepack para evitar un fallo interno de npm Arborist, sin modificar código/tests para obtener PASS.

### Chromium → HTTP FIELD real — PASS

Playwright 1.57.0 / Chromium:

- **42/42 checks PASS**;
- navegación real a `127.0.0.1:4173`;
- security headers + secure context;
- Service Worker activo;
- `localStorage` nativo;
- invitación browser→backend real de desarrollo;
- exportación real descargada por Chromium y validada por SHA-256;
- outbox→sync endpoint→ACK real;
- event-time preservado y received-time generado por servidor;
- desktop 1440×900 y mobile 390×844 sin overflow;
- cero console/page errors.

Public bundle SHA-256:

`1ea29026ccf160dfebc15b24f6f27408a8bff459be4c422e0791775520dcf00b`

Evidence artifact SHA-256:

`c205f62ba29dbaf9a32da7d6866d6024c42f0d4051ab3bda47be2eb4667a48d7`

## Migración a source directo

La rama ya empezó a dejar atrás los bundles/slices transicionales. Están persistidos directamente:

- root `package.json`;
- root `package-lock.json`;
- root `tsconfig.json`;
- compatibility type shim;
- FIELD Mobile;
- Control Web en materialización;
- runtime/migrations/tests ya revisables directamente.

El siguiente gate será declarar el monorepo directo únicamente cuando los 41 workspaces estén físicamente presentes y `npm ci + tsc` pasen desde el checkout de GitHub.

## Límites vigentes

- AI advisory-only; Copilot no aprueba ni ejecuta acciones de dominio.
- reglas determinísticas de agronomía/supply/safety siguen siendo autoridad.
- certificación agrícola final requiere evidencia real y firmante humano identificado.
- reconstructed PASS no equivale a provenance byte-for-byte del v0.15 perdido.
- `LOCAL_DEV_BACKEND_NOT_PRODUCTION` no equivale a backend productivo.

## Siguiente cierre técnico

- terminar persistencia legible de packages/services del monorepo;
- `npm ci + tsc` directo desde la rama;
- build productivo web/mobile;
- autenticación/autorización productiva, email de invitaciones, object storage/export worker y canonical sync real;
- D10 Product Approval y piloto agrícola real.

Ver `INTEGRATION_STATUS.json`, `AGROWAY_BASELINE_LOCK.json`, `AGROWAY_PATCH_LOCK.json` y `docs/product/V021_RUNTIME_CLOSURE_VALIDATION.md`.
