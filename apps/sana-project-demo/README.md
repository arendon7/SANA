# SANA · proyectos productivos

Demo local para recorrer la primera experiencia propia de SANA: explorar un proyecto ficticio, abrir una ficha con predio y escala, revisar la necesidad de capital y el modelo productivo, consultar una lectura AgroWay sintética y simular interés para revisión humana.

## Recorrido

1. Explorar un caso de muestra en el catálogo.
2. Revisar productora, predio, cultivo, área y número de plantas.
3. Ver uso del capital, supuestos de producción y valores aún no calculados.
4. Consultar la procedencia y vigencia de la lectura aprobada de AgroWay.
5. Simular una intención y terminar en una revisión humana.
6. Abrir “Mi espacio”: primero muestra el estado vacío y, después de enviar la simulación, conserva una tarjeta efímera de interés para recorrer el seguimiento previsto sin inventar cuentas o inversiones.

## Ejecutar localmente

Desde la raíz del repositorio:

```sh
node apps/sana-project-demo/server.mjs
```

Abrir `http://127.0.0.1:4175/`. El servidor Node integrado se vincula a loopback y solo expone los archivos de esta demo junto con el validador de lectura. No usa dependencias externas, backend de producto, persistencia, analítica, autenticación ni datos de usuarios.

## Datos y límites

`project-dossier-v1.json` contiene una productora y un predio ficticios, área, cantidad de plantas, usos de capital y un escenario ilustrativo. Las cifras demuestran cómo una ficha puede mostrar supuestos y su aritmética; no son benchmarks agronómicos, presupuestos reales, pronósticos validados, oferta de inversión, utilidad neta, dividendos ni retorno para participantes. `netUtilityEstimate` no se calcula porque la muestra no modela todos los costos ni términos.

`project-projection-v1.json` es un fixture AgroWay separado y sintético que valida `apps/sana-project-read/reader-v1.mjs`; las lecturas vencidas o mal mapeadas se ocultan. La cosecha sintética de 12 kg no alimenta el escenario del año cinco. La intención simulada permanece solo en memoria de la pestaña, no solicita datos personales o financieros, no crea una solicitud ni llama a servicios. “Mi espacio” muestra el estado vacío o una tarjeta temporal de interés simulado; nunca una posición, compromiso o aporte ficticio.

`DESIGN.md` y `.impeccable/design.json` documentan una dirección específica de SANA, independiente de la identidad GREENATICS. El wordmark tipográfico es provisional; no se encontró un logo autónomo validado. La paleta y las fuentes de respaldo tampoco están aprobadas.

Esta entrega es una demo candidata, no una aplicación productiva ni un despliegue. No habilita audiencia, cuentas, inversiones, pagos, datos reales o servicios adicionales.
