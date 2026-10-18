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

`project-catalog-v1.json` contiene una lista local de proyectos sintéticos y enlaza cada uno con su propio dossier y proyección AgroWay aprobada para demo. Los dos dossiers contienen nombres de personas y predios ficticios, área, cantidad de plantas, usos de capital y escenarios ilustrativos. Las cifras demuestran cómo una ficha podría exponer supuestos y aritmética; no son benchmarks agronómicos, presupuestos reales, pronósticos validados, oferta de inversión, utilidad neta, dividendos ni retorno para participantes. `netUtilityEstimate` no se calcula porque los modelos no recogen todos los costos ni términos.

`project-projection-v1.json` y `project-projection-002-v1.json` son fixtures AgroWay separados y sintéticos que validan `apps/sana-project-read/reader-v1.mjs`; las lecturas vencidas o mal mapeadas se ocultan. Los eventos de cosecha son observaciones sintéticas separadas y no alimentan los escenarios de producción estimada. En cada proyecto interesado, “Mi espacio” usa la misma validación para mostrar el resumen de ciclo de solo lectura y su fecha; si faltan valores, los conserva como desconocidos. La intención simulada permanece solo en memoria de la pestaña, no solicita datos personales o financieros, no crea una solicitud ni llama a servicios. “Mi espacio” muestra intereses temporales; nunca una posición, compromiso o aporte.

`DESIGN.md` y `.impeccable/design.json` documentan una dirección específica de SANA, independiente de la identidad GREENATICS. El wordmark tipográfico es provisional; no se encontró un logo autónomo validado. La paleta y las fuentes de respaldo tampoco están aprobadas.

Esta entrega es una demo candidata, no una aplicación productiva ni un despliegue. No habilita audiencia, cuentas, inversiones, pagos, datos reales o servicios adicionales.
