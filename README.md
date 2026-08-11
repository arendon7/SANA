# SANA / AGROWAY

Repositorio técnico de la plataforma agrícola SANA / AGROWAY.

## Línea base canónica

- Base: **AGROWAY v0.16.0-rc1**
- SHA-256: `12f33aed9b60cfe4a0f97e65a65d35dd665cfa3cfeb9e218934a1b056d943d8d`
- Estado preparado: **v0.20.2-rc1 Domain Integrity Hardening**
- Patch SHA-256: `8f4b28cc21a0607279cb9df6b809ae50d68b932b27993797cfaa2f0bc222d710`

Tras v0.20.2 se mantienen **218 Domain Events conceptuales** y **12 workspaces acumulativos** sobre v0.16.

La aplicación completa solo puede materializarse cuando esté físicamente disponible el ZIP v0.16 exacto y su SHA coincida. El patch v0.20.2 también se verifica por SHA antes de cualquier extracción.

No se reconstruye la base desde resúmenes ni se sustituye otra versión. El CI técnico tampoco equivale a certificar un piloto agrícola real.

Ver `AGROWAY_BASELINE_LOCK.json`, `AGROWAY_PATCH_LOCK.json`, `INTEGRATION_STATUS.json` y `docs/V0202_DOMAIN_INTEGRITY_RUNBOOK.md`.
