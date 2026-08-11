# SANA / AGROWAY

Repositorio técnico de la plataforma agrícola SANA / AGROWAY.

## Cadena canónica corregida

- Última base real: **AGROWAY v0.15.0-rc1**
- Base SHA-256: `323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4`
- v0.16 original: **no llegó a generarse como ZIP**.
- Capa intermedia oficial: **v0.16R (reconstructed)**.
- Estado preparado: **v0.20.2-rc2 rebased from v0.15**.
- Patch SHA-256: `0e39e545a27a7595d4cdbbdee46720a3c28129b039a77e37c8eeaf1527ad564f`.

Cadena:

`v0.15 REAL → v0.16R RECONSTRUCTED → v0.17 → v0.18 → v0.19 → v0.20 → v0.20.1 → v0.20.2-rc2`

v0.16R reconstruye **Knowledge Registry + AI Gateway + Agronomy Copilot** con +12 Domain Events, +2 permisos y +3 workspaces. El total final permanece en **218 Domain Events conceptuales** y **15 workspaces nuevos acumulados sobre v0.15**.

La aplicación completa solo puede materializarse cuando esté físicamente disponible el ZIP v0.15 exacto y su SHA coincida. El patch rc2 también se verifica por SHA antes de cualquier extracción.

No se representa v0.16R como una release histórica original. El CI técnico tampoco equivale a certificar un piloto agrícola real.

Ver `AGROWAY_BASELINE_LOCK.json`, `AGROWAY_PATCH_LOCK.json`, `INTEGRATION_STATUS.json`, `docs/ADR-016R_RECONSTRUCTION_FROM_V015.md` y `docs/V0202_RC2_REBASE_RUNBOOK.md`.
