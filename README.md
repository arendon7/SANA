# SANA / AGROWAY

Repositorio técnico de la plataforma agrícola SANA / AGROWAY.

## Cadena reconstruida vigente

`v0.15R-full RECONSTRUCTED → v0.16R RECONSTRUCTED → v0.17 → v0.18 → v0.19 → v0.20 → v0.20.1 → v0.20.2-rc5`

La referencia histórica del ZIP perdido v0.15 se conserva solo para provenance:

`323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`

La base funcional reconstruida `v0.15R-full` conserva 26 workspaces, 133 Domain Events, 109 permisos y 21 migraciones; no se representa como byte-identical al release histórico.

## Build recomendada — v0.20.2-rc5

Full reconstructed repository SHA-256:

`356af3151945e1bf4bd86382d0a2b38e6a2af50a16b9eee7190b2f7e656428bb`

Estado validado:

- 41 workspaces.
- 218 Domain Events conceptuales.
- 28 migraciones PostgreSQL entregadas.
- `npm ci --offline --ignore-scripts`: PASS.
- TypeScript strict: PASS.
- guardrails/validators v0.15R–v0.20.2: PASS.
- v0.16R focal runtime: 9/9 PASS.
- suite existente `.spec.ts`: 11/11 archivos y 23/23 tests PASS mediante `NODE_TEST_VITEST_COMPAT`.
- lint PostgreSQL estructural: 28 migraciones / 102 checks PASS.
- 10/10 expresiones RLS `current_setting` con quoting válido.
- 33 FKs tenant-aware y 35 tablas en la lista de `FORCE ROW LEVEL SECURITY`.
- `canonical_fact_v` con `security_invoker=true`.
- raw provider ingestion revocado de `PUBLIC`.
- CI privado local: `PASS_WITH_PENDING`.

### Importante sobre tests

`NODE_TEST_VITEST_COMPAT_PASS` ejecuta los mismos archivos `.spec.ts` con un adapter temporal sobre `node:test`. El adapter se limita al subconjunto de API Vitest que los tests actuales realmente usan y se niega a ocultar un Vitest instalado. **No se reporta como Vitest real.**

## Pendiente de infraestructura

- Vitest real.
- PostgreSQL/PostGIS runtime 0001–0022 + RLS adversarial.
- builds Vite/Expo.
- Graphify real.
- piloto agrícola real certificado.

La recuperación del ZIP histórico v0.15 ya no bloquea el desarrollo reconstruido.
