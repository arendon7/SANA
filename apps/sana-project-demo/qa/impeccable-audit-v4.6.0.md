# Auditoría técnica Impeccable 4.6.0 — SANA

Corte: 19 de octubre de 2026. Alcance: interfaz pública de apps/sana-project-demo, lectura del sistema de DESIGN.md, inspección estática, detector de Impeccable 4.6.0 y regresión local de navegador. La auditoría no valida un despliegue ni certifica conformidad WCAG.

## Puntaje

| Dimensión | Puntaje / 4 | Evidencia |
|---|---:|---|
| Accesibilidad | 3 | Landmarks, etiquetas y estados semánticos, foco visible, teclado y errores asociados a campos; 24 comprobaciones de navegador. Falta lector de pantalla/dispositivo. |
| Rendimiento | 3 | HTML/CSS/JS local, sin servicios ni dependencias de ejecución externas en la demo; no se ejecutó una medición de rendimiento en navegador. |
| Theming | 3 | Tokens centrales y paleta coherente; la superficie es deliberadamente de tema claro y hay valores puntuales fuera de token. |
| Diseño adaptable | 3 | Reflow y overflow comprobados a 320, 390, 768 y 1280 px en Chromium emulado; falta validación en dispositivo físico. |
| Integridad de implementación | 3 | Dirección específica documentada y límites de demo visibles; hallazgos puntuales se corrigieron en esta pasada. Tres avisos restantes son falsos positivos confirmados contra el sistema aprobado. |
| **Total** | **15/20 · Bueno** | |

## Resumen ejecutivo

Puntaje: **15/20 · Bueno**. No quedan issues verificados abiertos en la UI. Se resolvieron dos grupos de hallazgos P3: nueve rótulos redundantes y el padding de la ficha de confirmación. Conteo final: P0 **0**, P1 **0**, P2 **0**, P3 **2 categorías resueltas**. Los tres avisos deliberados del detector no se cuentan como issues.

## Patrones y puntos fuertes

La primera pasada mostró una tendencia a anteponer etiquetas a títulos que ya explicaban el contenido; la revisión manual corrigió ese patrón en catálogo, sesión y recorrido. Se mantienen la identidad SANA propia, fuentes locales, textos sintéticos visibles, estados de lectura de solo consulta y control por teclado. El adaptador exige una proyección válida de solo lectura y aplica una política de presentación antes de exponer el resumen.

## Acciones recomendadas

1. **P2 · Validación de accesibilidad externa:** completar VoiceOver/lector de pantalla y prueba en dispositivo físico antes de ampliar audiencia o afirmar conformidad.
2. **P2 · Preview del commit:** verificar el SHA exacto en un preview remoto ya disponible antes de integrar; esta tarea no crea despliegues.
3. No quedan recomendaciones de diseño que requieran más comandos Impeccable. Fraunces y el papel #FFF5E8 son decisiones del sistema vigente, no cambios sugeridos por el detector.

## Veredicto de integridad

La implementación expresa un sistema coherente de demo agrícola: papel cálido, Fraunces local, jerarquía editorial y estados sintéticos explícitos, según DESIGN.md. El diagnóstico marcó cuatro rótulos redundantes y el espaciado de confirmación; la revisión manual de Mi espacio, catálogo y recorrido encontró otras cinco redundancias. Se retiraron los nueve rótulos sin perder contexto. El detector también marcó Fraunces y el fondo RGB(255,245,232); ambos son decisiones explícitas del sistema visual, así que se registran como falsos positivos, no como deuda.

## Hallazgos

No quedan hallazgos verificados abiertos en el alcance de esta pasada. Se corrigieron los rótulos señalados por el detector y cinco redundancias identificadas en la revisión manual del catálogo, Mi espacio y recorrido:

- **[Resuelto · P3] Rótulos redundantes sobre títulos.** index.html: “Lectura recibida”, “SANA / Tu seguimiento”, “Paso 2 · Interés” y “SANA · Demo” repetían un estado o una idea ya expresados por el título o el contenido contiguo. La revisión manual encontró también “Actividad de esta pestaña”, “Resumen de la sesión”, “Portafolio de muestra”, “Otras iniciativas” y “Cómo se construiría la relación”. Se retiraron los nueve rótulos y se integró el contexto en los títulos: catálogo “Proyectos de muestra para conocer”, shelf “Otras iniciativas de muestra”, y Mi espacio “Proyectos que sigues en esta pestaña”. El texto explica que el interés desaparece al recargar; el estado de lectura sigue junto a los hitos.
- **[Resuelto · P3] Padding horizontal ausente.** styles.css, .confirmation-detail: el detector identificó padding: 16px 0 como contenido apretado. Se cambió a padding: 16px.

Avisos restantes del detector (no son issues): Fraunces aparece en dos reglas y el color de papel es #FFF5E8; el token y la fuente local están definidos por DESIGN.md.

## Evidencia y límites

- Impeccable 4.6.0 fijado: el diagnóstico inicial encontró ocho candidatos: cuatro rótulos y el padding como hallazgos, más tres falsos positivos verificados. Tras corregir los cinco hallazgos automáticos, el rerun dejó solo los tres avisos aprobados. La revisión manual posterior del catálogo, Mi espacio y recorrido encontró otras cinco redundancias; las cinco se retiraron.
- node --test apps/sana-project-demo/sana-project-demo.test.mjs: 17/17.
- browser-qa.cjs: 24/24 en Chromium headless 1.63.0; escritorio y viewport móvil emulado, teclado, estados de error, reintento, respuestas tardías y ausencia de overflow.
- node --check de módulos app/QA/contrato y git diff --check: sin errores en la pasada local.
- Revisión manual del árbol de accesibilidad de Chromium en el preview local (proyecto, interés inválido y confirmación): el grupo conserva su nombre, cada radio y checkbox expone su descripción, el error se anuncia y el foco llega a la primera opción; al confirmar, el foco pasa al encabezado y solo aparece la selección de muestra. Recorrido real por teclado: Tab entra al primer radio; ArrowDown cambia de opción; Tab y Space activan la confirmación; Tab recorre Cancelar y el envío; Enter muestra la confirmación enfocando su título. Es evidencia de Chromium AX/teclado, no una lectura por VoiceOver ni una prueba física.
- Sin medición Lighthouse/perfil de rendimiento, prueba con VoiceOver/lector de pantalla, dispositivo físico ni preview remoto del SHA candidato.

## Siguiente paso

Antes de integrar, completar prueba con lector de pantalla/dispositivo y QA visual del SHA exacto en preview remoto. Mantener el tema claro y Fraunces mientras DESIGN.md los defina como decisiones aprobadas.