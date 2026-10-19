# SANA — plataforma y siguiente corte

Corte: 19 de octubre de 2026. Fuente de esta unidad: PR [SANA #172](https://github.com/arendon7/SANA/pull/172), base de trabajo `44c0bc96be03fc17ae4a96d3bbbe3224a5cb816a`. Esta ficha mide criterios cerrados, no esfuerzo ni preparación para inversión. Los porcentajes se calculan únicamente con los denominadores explícitos siguientes; no existe porcentaje global.

## Ficha de avance

| Dimensión | Avance | Criterios cerrados / total y evidencia | Pendiente |
|---|---:|---|---|
| Contenido | 75% (6/8) | Ecosistema público; productor/propósito; área/cultivo/plantas; necesidad y producción con supuestos; lectura con fuente/fecha/hitos; límites y revisión humana. `index.html`, dossiers y 15 pruebas focales. | Ficha de impacto estimado con metodología/unidades/periodo y evidencia sintética; productos utilizados con trazabilidad propia por proyecto (hoy solo se declara su ausencia). |
| Recorrido y módulos | 33% (3/9) | Explorar sin login, interés simulado, Mi espacio de sesión. `app.mjs`, `browser-qa.cjs`, 19 comprobaciones. | Acceso seguro; proyectos privados; cartera; compromisos y aportes conciliados; documentos; informes. Todos proyectados y sujetos a sus gates. |
| UX e identidad | 60% (3/5) | Dirección propia documentada; composición de escritorio; composición móvil. `DESIGN.md`, QA local a 1280×900 y 390×844, capturas de esta unidad. | Identidad corporativa/activos aprobados para distribución; revisión editorial y de usabilidad con usuarios. La demo conserva su propuesta visual. |
| Calidad y accesibilidad | 50% (3/6) | Sintaxis/contratos/aritmética; regresión de navegador y errores; foco, teclado y validación asociada a campos. | Lector de pantalla formal; contraste/legibilidad y escalado completos; QA remota del SHA exacto. El detector encuentra texto pequeño heredado: no se declara conformidad WCAG. |
| Persistencia | 0% (0/5) | La selección vive solo en memoria. No es persistencia. | Identidad/roles; almacenamiento segregado; integridad y conciliación; recuperación; operación verificable. No activar en esta etapa. |
| Integración | 33% (2/6) | Contrato sintético versionado validado; procedencia y clave idempotente validadas por el lector existente. | Fuente AgroWay real aprobada; operación y permisos separados comprobados; preview remoto exacto; integración aceptada por coordinación. CI de la unidad se registra en el PR, separado de estos criterios. |

## Unidades y gates

1. **Demo pública revisable (en curso).** Ecosistema → catálogo → ficha → lectura agrícola → interés ficticio → Mi espacio. Esta unidad cierra carga, recuperación y coherencia de navegación. Siguiente: legibilidad, contraste, escalado, lector de pantalla y fuente/preview exactos para coordinación.
2. **Ficha pública completa.** Completar impacto y productos utilizados con fixtures explícitos, metodología, unidades, periodo y procedencia; conservar estimaciones separadas de observaciones. No inventar avales, productos aplicados ni beneficios garantizados.
3. **Lecturas AgroWay autorizadas.** Validar envelope, mapeo por proyecto, aprobación, versión, procedencia, vigencia e idempotencia. Solo fixtures por ahora. SANA nunca escribe en campo; no exponer credenciales. Una lectura fallida o vencida oculta indicadores; su ausencia no significa cero.
4. **Acceso seguro y proyectos privados (proyectado).** Decidir identidad, permisos, segregación y recuperación antes de habilitar cuentas u onboarding. No reutilizar bases por nombre ni compartir credenciales entre productos.
5. **Cartera y relaciones (proyectado).** Separar interés, revisión humana, compromiso aprobado y aporte realmente conciliado. Los canales externos y la revisión humana median cualquier relación real. SANA no procesa dinero.
6. **Documentos e informes (proyectado).** Procedencia, versiones, revisión, permisos y recuperación; evidencias por proyecto y cortes de seguimiento. No confundir documento cargado con hecho verificado.
7. **Operación e integración (coordinación).** Reconciliar repo/rama/SHA/CI/preview, revisar candidato, aceptar gates de datos y audiencia. Sin merge ni deploy desde esta tarea. Presupuesto $0; sin servicios nuevos ni datos reales.

## Evidencia de esta unidad

- `node --test apps/sana-project-demo/sana-project-demo.test.mjs`: 15/15.
- `node --check apps/sana-project-demo/app.mjs`: PASS.
- `SANA_PLAYWRIGHT_PATH=<instalación existente de playwright> node apps/sana-project-demo/browser-qa.cjs`: 19/19 en Chromium headless, con movimiento reducido. Requiere servidor loopback existente y dependencia local; no instala nada ni forma parte aún del job remoto.
- [Resultado de navegador](qa/browser-result.json), [ficha móvil](qa/mobile-project.png), [recuperación móvil](qa/mobile-catalog-error.png). Las capturas son QA local, no despliegue ni datos reales.
- QA exploratorio: catálogo 503; dossier por defecto 404 con alternativa validada; lectura 500 y reintento; respuesta tardía del primer proyecto; historial tras reiniciar; confirmación directa sin interés. Sin desborde horizontal observado a 390 px ni errores JavaScript en el recorrido principal.
- Impeccable 4.6.0: detector ejecutado una vez sobre HTML, CSS y app. Advierte texto pequeño, etiquetas y patrones existentes. Se conserva la identidad de demostración; queda una unidad explícita de legibilidad. No sustituye una auditoría de accesibilidad ni prueba en dispositivo físico.

## Activos

Sin activos nuevos o modificados. `DESIGN.md` del candidato gobierna esta superficie, separada de GREENATICS. Símbolo propuesto para demo SHA-256 `70e9f44360f028b63cba9721caf9e3aaf8504b353b1e78559cd16409cee047c5`; ilustración sintética original `0e5076444496845e4ffca4bba9fd458c1bb174566cf0ecf90af8edb62469b594`; Fraunces local `177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb`, licencia SIL en `assets/fonts/OFL.txt`. El registro existente no equivale a aprobación de marca para distribución general.

**Estado:** no listo para integrar. La unidad es revisable localmente; falta QA de accesibilidad y preview remoto exacto. Sin backend, cuentas, pagos, servicios, migraciones, permisos, cambios de audiencia o datos reales. Reversa: revertir el commit de esta unidad; no requiere migraciones. Responsable: conversación SANA; revisor/integrador: coordinación de publicaciones y Agustín. Fechas de fases futuras sin confirmar.
