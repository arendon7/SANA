# Auditoría técnica Impeccable 4.6.0 — SANA

Corte: 19 de octubre de 2026. Alcance: interfaz pública de apps/sana-project-demo, lectura del sistema de DESIGN.md, inspección estática, detector de Impeccable 4.6.0 y regresión local de navegador. La auditoría no valida un despliegue ni certifica conformidad WCAG.

## Puntaje

| Dimensión | Puntaje / 4 | Evidencia |
|---|---:|---|
| Accesibilidad | 3 | Landmarks, etiquetas y estados semánticos, foco visible, teclado y errores asociados a campos; 24 comprobaciones de navegador. Falta lector de pantalla/dispositivo. |
| Rendimiento | 3 | HTML/CSS/JS local, sin servicios ni dependencias de ejecución externas en la demo; no se ejecutó una medición de rendimiento en navegador. |
| Theming | 3 | Tokens centrales y paleta coherente; la superficie es deliberadamente de tema claro y hay valores puntuales fuera de token. |
| Diseño adaptable | 3 | Reflow y overflow comprobados a 320, 390, 768 y 1280 px en Chromium emulado; falta validación en dispositivo físico. |
| Integridad de implementación | 3 | Dirección específica documentada y límites de demo visibles; cuatro hallazgos pequeños se corrigieron en esta pasada. Tres avisos restantes son falsos positivos confirmados contra el sistema aprobado. |
| **Total** | **15/20 · Bueno** | |

## Veredicto de integridad

La implementación expresa un sistema coherente de demo agrícola: papel cálido, Fraunces local, jerarquía editorial y estados sintéticos explícitos, según DESIGN.md. El detector encontró cuatro rótulos redundantes sobre encabezados o contenido ya identificado; se retiraron sin perder contexto. El detector también marcó Fraunces y el fondo RGB(255,245,232); ambos son decisiones explícitas del sistema visual, así que se registran como falsos positivos, no como deuda.

## Hallazgos

No quedan hallazgos verificados abiertos en el alcance de esta pasada. Se resolvieron los cuatro candidatos siguientes:

- **[Resuelto · P3] Rótulos redundantes sobre títulos.** index.html: “Lectura recibida”, “SANA / Tu seguimiento”, “Paso 2 · Interés” y “SANA · Demo” repetían un estado o una idea ya expresados por el título o el contenido contiguo. Se quitaron; el estado de lectura sigue junto a los hitos.
- **[Resuelto · P3] Padding horizontal ausente.** styles.css, .confirmation-detail: el detector identificó padding: 16px 0 como contenido apretado. Se cambió a padding: 16px.

Avisos restantes del detector (no son issues): Fraunces aparece en dos reglas y el color de papel es #FFF5E8; el token y la fuente local están definidos por DESIGN.md.

## Evidencia y límites

- Impeccable 4.6.0 fijado: un diagnóstico inicial marcó siete candidatos; tras la corrección, la repetición dejó solo los tres avisos deliberados indicados arriba.
- node --test apps/sana-project-demo/sana-project-demo.test.mjs: 17/17.
- browser-qa.cjs: 24/24 en Chromium headless 1.63.0; escritorio y viewport móvil emulado, teclado, estados de error, reintento, respuestas tardías y ausencia de overflow.
- node --check de módulos app/QA/contrato y git diff --check: sin errores en la pasada local.
- Revisión manual del árbol de accesibilidad de Chromium en el preview local (proyecto, interés inválido y confirmación): el grupo conserva su nombre, cada radio y checkbox expone su descripción, el error se anuncia y el foco llega a la primera opción; al confirmar, el foco pasa al encabezado y solo aparece la selección de muestra. Recorrido real por teclado: Tab entra al primer radio; ArrowDown cambia de opción; Tab y Space activan la confirmación; Tab recorre Cancelar y el envío; Enter muestra la confirmación enfocando su título. Es evidencia de Chromium AX/teclado, no una lectura por VoiceOver ni una prueba física.
- Sin medición Lighthouse/perfil de rendimiento, prueba con VoiceOver/lector de pantalla, dispositivo físico ni preview remoto del SHA candidato.

## Siguiente paso

Antes de integrar, completar prueba con lector de pantalla/dispositivo y QA visual del SHA exacto en preview remoto. Mantener el tema claro y Fraunces mientras DESIGN.md los defina como decisiones aprobadas.