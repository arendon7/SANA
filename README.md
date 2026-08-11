# SANA / AGROWAY

Repositorio técnico de la plataforma agrícola SANA / AGROWAY.

## Línea base canónica

- Base aprobada: **AGROWAY v0.16.0-rc1**
- SHA-256: `12f33aed9b60cfe4a0f97e65a65d35dd665cfa3cfeb9e218934a1b056d943d8d`
- v0.16 validada estáticamente con 145 Domain Events, 28 workspaces/servicios y 361 payload files.

## Evolución preparada

- v0.17: External Data Gateway + Weather / IoT / Remote Sensing + Agronomic Alerts.
- v0.18: AGROWAY Invest + Greenatics Control Tower.
- v0.19: Copilot + Knowledge Engine con evidencia/citas verificadas y sin autoridad transaccional.
- v0.20: S10 Certified Real Pilot Harness.
- v0.20.1: Integration Hardening.

Tras v0.20.1 se mantienen **218 Domain Events conceptuales** y **12 workspaces acumulativos** sobre v0.16.

## Integridad

v0.20.1 solo debe materializarse contra una base cuyo SHA-256 coincida exactamente con la base aprobada. El ZIP v0.16 no está actualmente recuperable desde este entorno, por lo que este repositorio todavía **no declara una materialización completa v0.20.1**.

La maquinaria S10 fue validada con fixture sintético. Un piloto agrícola real solo puede marcarse `CERTIFIED` con evidencia real, replay íntegro y firma humana nominal ligada al digest determinista exacto.
