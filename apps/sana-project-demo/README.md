# SANA · proyectos productivos

Demo local para recorrer la primera experiencia propia de SANA: comparar dos proyectos agrícolas ficticios, abrir sus fichas con productor/a, predio y escala, revisar necesidades de capital y supuestos productivos, consultar lecturas AgroWay sintéticas y avanzar por un seguimiento de muestra por proyecto.

El catálogo compara ambas fichas con la misma jerarquía: responsable, predio, superficie, número de plantas, necesidad de capital, producción estimada y excedente operativo ilustrativo. La utilidad neta y el retorno personal permanecen sin calcular. La dirección toma patrones de descubrimiento de proyectos observados en MiiMOSA y AcreTrader, sin importar sus ofertas o condiciones.

## Recorrido

1. Comparar dos casos de muestra de cultivos distintos en el catálogo editorial.
2. Revisar productora, predio, cultivo, área y número de plantas.
3. Ver uso del capital, supuestos de producción y valores aún no calculados.
4. Consultar la procedencia y vigencia de la lectura aprobada de AgroWay.
5. Simular interés, una revisión representada y un compromiso ficticio con una de tres cantidades didácticas.
6. Abrir “Mi espacio”: estado vacío o una tarjeta por proyecto con etapa, documentos de muestra, lectura AgroWay aprobada y estado de aportes. Cada tarjeta separa su ficha del resumen agrícola asociado. Las lecturas vencidas o no disponibles no presentan cifras; ningún pago, aporte o acuerdo real existe.

## Ejecutar localmente

Desde la raíz del repositorio:

```sh
node apps/sana-project-demo/server.mjs
```

Abrir `http://127.0.0.1:4175/`. El servidor Node integrado se vincula a loopback y solo expone los archivos de esta demo junto con el validador de lectura. No usa dependencias externas, backend de producto, persistencia, analítica, autenticación ni datos de usuarios.

## Datos y límites

`project-catalog-v1.json` contiene una lista local de proyectos sintéticos y enlaza cada uno con su propio dossier y proyección AgroWay aprobada para demo. Los dos dossiers contienen nombres de personas y predios ficticios, área, cantidad de plantas, usos de capital y escenarios ilustrativos. Las cifras demuestran cómo una ficha podría exponer supuestos y aritmética; no son benchmarks agronómicos, presupuestos reales, pronósticos validados, oferta de inversión, utilidad neta, dividendos ni retorno para participantes. `netUtilityEstimate` no se calcula porque los modelos no recogen todos los costos ni términos.

`project-projection-v1.json` y `project-projection-002-v1.json` son fixtures AgroWay separados y sintéticos que validan `apps/sana-project-read/reader-v1.mjs`; las lecturas vencidas o mal mapeadas se ocultan. Los eventos de cosecha son observaciones sintéticas separadas y no alimentan los escenarios de producción estimada. En cada proyecto seguido, “Mi espacio” usa la misma validación para mostrar el resumen de ciclo de solo lectura y su fecha; si faltan valores, los conserva como desconocidos. Interés, revisión y compromiso de muestra viven solo en memoria de la pestaña. No solicitan datos personales o financieros, no crean una solicitud real, no llaman a servicios y se borran al recargar. La revisión es una transición visual que el visitante activa, no una evaluación humana. El monto es un ejercicio no vinculante; aportes y pagos no se registran.

La demo conserva una dirección visual propia de SANA, independiente de GREENATICS. Usa un wordmark tipográfico y una paleta provisional; todavía no hay logo autónomo aprobado.

Esta entrega es una demo candidata, no una aplicación productiva ni un despliegue. No habilita audiencia, cuentas, inversiones, pagos, datos reales o servicios adicionales.

## Portafolio de proyectos: visión y alcance actual

La visión es que, cuando exista una cuenta y un vínculo formal verificados, cada persona pueda consultar por proyecto su estado, documentos revisados, acuerdos formalizados, aportes realmente conciliados y lecturas AgroWay autorizadas. Esos estados nunca se mezclan: un interés no es un compromiso ni un aporte, y el excedente del escenario agrícola no es utilidad neta o retorno personal.

Esta demo prueba la navegación, la lectura sintética de solo consulta y una secuencia ficticia de interés, revisión representada y compromiso didáctico. No crea una cartera real, cuentas, solicitudes, acuerdos o movimientos de dinero. Los pagos futuros serían externos y requerirían conciliación humana. Activar ese siguiente nivel requiere identidad y permisos, persistencia con recuperación, reglas de revisión y estructura jurídica aprobada; queda fuera de esta entrega.
