# SANA / AGROWAY

Repositorio técnico de la plataforma agrícola SANA / AGROWAY.

## Build de desarrollo recomendada — v0.20.2-rc6

Cadena reconstruida:

`v0.15R-full RECONSTRUCTED → v0.16R RECONSTRUCTED → v0.17 → v0.18 → v0.19 → v0.20 → v0.20.1 → v0.20.2-rc6`

Full reconstructed repository SHA-256:

`e868e31d779e5818604c72e809becc4cc5fe4f3c6c1a1634757fd214516d7cec`

La referencia histórica del ZIP perdido v0.15 se conserva solo para provenance:

`323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`

## Design Engineering System

Desde rc6, diseño y UX forman parte del release gate, no una etapa decorativa posterior.

Responsabilidades:

- **Binario IA App Factory v4**: orquestación Product Lab → Engineering & Delivery → Release/Ops.
- **SANA / AGROWAY Brand Canon**: autoridad visual y de identidad.
- **Taste**: dirección visual y exploración de alternativas.
- **Emil Kowalski Skills**: interacción, motion, prototipado y craft.
- **Impeccable**: crítica, detección de anti-patrones y hardening visual/UX.
- **Vercel Agent Skills**: React/Expo performance, accesibilidad y composición.
- **Figma**: evidencia, prototipos, componentes y design-to-code; no sustituye el repo como verdad ejecutable.
- **Playwright + axe-core + Lighthouse CI + Web Vitals**: QA de navegador cuando las superficies UI estén ejecutables.

Los upstreams externos están fijados a commits exactos; nunca se consumen refs flotantes.

## Gates D0–D10

`D0_TRUTH → D1_ARCHITECTURE → D2_DIRECTION → D3_SYSTEM → D4_BUILD → D5_MOTION → D6_AUDIT → D7_VISUAL_QA → D8_PRODUCT_APPROVED → D9_DELIVERY → D10_PRODUCTION_APPROVED`

Reglas clave:

- Product Approved ≠ Production Approved.
- una superficie mayor debe explorar al menos dos direcciones realmente diferentes antes de converger;
- la identidad SANA prevalece sobre recomendaciones genéricas de cualquier skill;
- no inventar hex/fonts/branding no confirmado;
- teclado, foco y `prefers-reduced-motion` son requisitos;
- QA visual mínimo 1440×900 y 390×844;
- ningún merge, deploy o rollback automático;
- Figma y AI producen evidencia/propuestas, no autoridad de aprobación;
- una versión buena debe quedar recuperable antes de sustituirla.

## Estado técnico rc6

- 41 workspaces.
- 218 Domain Events conceptuales.
- 28 migraciones PostgreSQL entregadas.
- `npm ci --offline --ignore-scripts`: PASS.
- TypeScript strict: PASS.
- guardrails/validators v0.15R–v0.20.2: PASS.
- v0.16R focal runtime: 9/9 PASS.
- suite `.spec.ts`: 23/23 PASS mediante `NODE_TEST_VITEST_COMPAT` — no se presenta como Vitest real.
- PostgreSQL structural lint: 28 migraciones / 102 checks PASS.
- Design governance gate: PASS.
- Design preflight: PASS.
- CI privado local: `PASS_WITH_PENDING`.
- Release readiness: `READY_FOR_PRODUCT_DEVELOPMENT_WITH_RUNTIME_PENDING`.

## Pendiente de infraestructura

- Vitest real.
- PostgreSQL/PostGIS runtime 0001–0022 + RLS adversarial.
- navegador UI ejecutable para Playwright/axe/Lighthouse.
- builds Vite/Expo.
- Graphify real.
- piloto agrícola real certificado.

La sincronización física de skills externos puede reintentarse cuando el runtime tenga acceso DNS a GitHub; sus repositorios y commits ya quedaron verificados y bloqueados en configuración.

Ver `AGROWAY_PATCH_LOCK.json`, `INTEGRATION_STATUS.json`, `AGENTS.md`, `config/design/`, `docs/design/` y `docs/V0202_RC6_DESIGN_ENGINEERING.md`.
