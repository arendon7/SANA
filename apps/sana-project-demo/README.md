# SANA · proyectos productivos

Demo local para recorrer la primera experiencia propia de SANA: comparar dos proyectos agrícolas ficticios, abrir sus fichas con productor/a, predio y escala, revisar necesidades de capital y supuestos productivos, consultar lecturas AgroWay sintéticas y reunir intereses simulados por proyecto en “Mi espacio”.

## Recorrido

1. Comparar dos casos de muestra de cultivos distintos en el catálogo editorial.
2. Revisar productora, predio, cultivo, área y número de plantas.
3. Ver uso del capital, supuestos de producción y valores aún no calculados.
4. Consultar la procedencia y vigencia de la lectura aprobada de AgroWay.
5. Simular una intención y terminar en una revisión humana.
6. Abrir “Mi espacio”: estado vacío, resumen de intereses de la sesión y una tarjeta por proyecto. Cada tarjeta separa su ficha (cultivo, escala y necesidad ficticios) de la lectura AgroWay aprobada para ese mismo proyecto. Las lecturas vencidas o no disponibles no presentan cifras; acuerdos y aportes permanecen deshabilitados.

## Ejecutar localmente

Desde la raíz del repositorio:

```sh
node apps/sana-project-demo/server.mjs
```

Abrir `http://127.0.0.1:4175/`. El servidor Node integrado se vincula a loopback y solo expone los archivos de esta demo junto con el validador de lectura. No usa dependencias externas, backend de producto, persistencia, analítica, autenticación ni datos de usuarios.

## Datos y límites

`project-catalog-v1.json` contiene una lista local de proyectos sintéticos y enlaza cada uno con su propio dossier y proyección AgroWay aprobada para demo. Los dos dossiers `sana.project-dossier/1.1.0` contienen nombres de personas y predios ficticios, área, cantidad de plantas, usos de capital y escenarios ilustrativos. Las cifras demuestran cómo una ficha podría exponer supuestos y aritmética; no son benchmarks agronómicos, presupuestos reales, pronósticos validados, oferta de inversión, utilidad neta, dividendos ni retorno para participantes. `netUtilityEstimate` no se calcula porque los modelos no recogen todos los costos ni términos. `productUse` declara que estas muestras no tienen productos aplicados asociados; `impactAssessment` queda `NOT_CALCULATED` sin metodología y versión de cálculo, línea base, unidad, periodo, fuente de evidencia y revisión/aprobación. El validador rechaza atribuciones de producto e indicadores de impacto no sustentados.

`project-projection-v1.json` y `project-projection-002-v1.json` son fixtures AgroWay separados y sintéticos que validan `apps/sana-project-read/reader-v1.mjs`; las lecturas vencidas o mal mapeadas se ocultan. Los eventos de cosecha son observaciones sintéticas separadas y no alimentan los escenarios de producción estimada. En cada proyecto interesado, “Mi espacio” usa la misma validación para mostrar el resumen de ciclo de solo lectura y su fecha; si faltan valores, los conserva como desconocidos. La intención simulada permanece solo en memoria de la pestaña, no solicita datos personales o financieros, no crea una solicitud ni llama a servicios. “Mi espacio” muestra intereses temporales; nunca una posición, compromiso o aporte.

La demo usa la dirección visual propia de SANA **Proyecto desplegable**, independiente de GREENATICS. `DESIGN.md` resume sus reglas para futuras pantallas. `assets/sana-fold-mark.svg` es una propuesta de símbolo solo para la demo, no un logo corporativo aprobado; `assets/sana-paper-project.jpg` es una ilustración sintética y no representa una finca ni a una persona real. La fuente Fraunces se sirve desde el propio proyecto con su licencia en `assets/fonts/OFL.txt`.

Esta entrega es una demo candidata, no una aplicación productiva ni un despliegue. No habilita audiencia, cuentas, inversiones, pagos, datos reales o servicios adicionales.

## Portafolio de proyectos: visión y alcance actual

La visión es que, cuando exista una cuenta y un vínculo formal verificados, cada persona pueda consultar por proyecto su estado, documentos revisados, compromisos aprobados, aportes realmente conciliados y lecturas AgroWay autorizadas. Esos estados nunca se mezclan: un interés no es un compromiso ni un aporte, y el excedente del escenario agrícola no es utilidad neta o retorno personal.

Esta demo solo prueba la navegación entre proyectos, la lectura sintética de solo consulta y un interés temporal que desaparece al recargar. No crea una cartera real, cuentas, solicitudes o movimientos de dinero. Activar ese siguiente nivel requiere decisiones de producto, identidad y permisos, persistencia con recuperación, reglas de revisión y estructura jurídica aprobada; queda fuera de esta entrega.


## Entrada pública del ecosistema

La página inicial explica SANA, AgroWay, la relación verificable con productos o servicios GREENATICS y los requisitos de evidencia para publicar impacto. La exploración pública no necesita cuenta. Los proyectos de muestra son ficticios; sus fichas no tienen productos aplicados asociados y solo consultan una proyección AgroWay sintética por ciclo. “Mi espacio” sigue siendo una simulación de sesión, no un acceso autenticado.

## Carga y recuperación

La demo oculta las fichas mientras valida el catálogo. Si falla, muestra un reintento; si falla una ficha, solo ofrece alternativas validadas. Cada selección reutiliza su dossier validado durante esta carga y consulta su propia lectura AgroWay; las respuestas tardías no pueden reemplazar indicadores de otro proyecto. Recargar vuelve a validar los fixtures y borra los intereses de sesión. Reiniciar evita recuperar una confirmación inexistente desde el historial.

El [roadmap y ficha de avance](ROADMAP.md) mantiene el alcance completo y los gates pendientes. La regresión opcional `browser-qa.cjs` requiere Playwright ya disponible y el servidor local en 4175; no agrega servicios ni dependencias al producto.
