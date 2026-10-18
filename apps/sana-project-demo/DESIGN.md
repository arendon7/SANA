# SANA · diseño de exploración de proyectos

**Estado:** dirección visual provisional para una demo sintética. No es una identidad corporativa aprobada ni una interfaz financiera de producción.

## Producto y audiencia

SANA hace visibles proyectos productivos para que una persona pueda entender quién los impulsa, dónde se desarrollarían, qué escala tienen, qué capital requieren y cómo se informaría su avance. El recorrido de esta demo compara dos fichas agrícolas ficticias (cacao y café), permite explorar cada caso y simular interés para revisión humana. “Mi espacio” agrupa esos intereses por proyecto dentro de la sesión temporal.

## Dirección visual

- Construir una experiencia SANA propia, con un catálogo editorial y una ficha de proyecto organizada por identidad, escala, uso del capital, escenario productivo y lectura agrícola.
- Do not inherit GREENATICS website layouts. GREENATICS puede aparecer como afiliación institucional discreta cuando haga falta; no gobierna la identidad de esta interfaz.
- Usar SANA como marca tipográfica hasta encontrar un logo independiente aprobado. No se encontró un activo autónomo validado; no se inventa un símbolo oficial.
- Basar la composición en contexto y procedencia: una ficha editorial principal, una lista comparativa compacta, ilustración vectorial agrícola, datos agrupados y estados escritos. No usar fotos de archivo, geolocalizaciones, métricas de popularidad, testimonios ni progreso de financiación que no existan en los fixtures.
- El canon SANA/AgroWay nombra Forest, Earth, Ivory, Growth y Signal, y orienta hacia Sofia Pro y Merriweather. Los valores CSS y las fuentes de sistema de esta demo son provisionales; no representan activos ni tokens aprobados.
- Tomar como referencia de arquitectura de información los proyectos publicados por FarmTogether y AcreTrader: contexto del activo/cultivo, ubicación, escala, estructura del proyecto, supuestos y divulgaciones. Son ofertas reales de otros servicios; no trasladar a SANA rentabilidades, términos, estados, métricas ni promesas.

## Referentes de arquitectura de información

Revisión de sitios oficiales consultados el 17 de octubre de 2026, usada solo para aprender patrones de presentación:

- [FarmTogether · matriz de productos](https://farmtogether.com/products/overview) separa vehículos y estructuras y da contexto sobre acceso, mínimos, horizonte y costos; sus preguntas frecuentes describen el material legal asociado a cada oferta. En SANA, esto se traduce en explicar qué significa cada cifra, su fuente, estado y documentos que faltarían, sin copiar mínimos, rentabilidades ni términos.
- [AcreTrader · ofertas](https://acretrader.com/investments/primary-offerings) organiza cada oportunidad con ubicación, cultivos, tipo, estado y mínimo; su [vista de inversión](https://acretrader.com/investments) agrupa Overview, Maps, Financials y Documents y explica límites de propiedad y riesgos. Para SANA, la ficha agrupa identidad y escala, uso del capital, escenario productivo, lectura AgroWay y revisión.
- [Harvest Returns · cómo funciona](https://www.harvestreturns.com/how-our-platform-works) diferencia a quien busca capital de quien explora oportunidades y mantiene el proceso de captación ligado a documentos y estructuración. SANA debe hablar primero de proyectos y validación, sin prometer captación.
- [Agrapp Colombia](https://agrapp.co/) actualmente presenta financiación crediticia al productor y declara que no realiza ofertas públicas de inversión. No se toma su antigua narrativa de inversión como estado vigente ni como patrón de transacción.

Estos referentes no acreditan la situación jurídica de SANA ni recomiendan inversiones. La demo no recibe dinero, no muestra retornos para participantes y no crea ofertas. Cualquier operación real necesita una estructura y revisión propias antes de diseñar acciones de inversión.

## Información y estados

- La demo abre en explorar proyectos y compara dos casos sintéticos. La lista es ilustrativa, no un catálogo abierto ni una convocatoria.
- Separar los datos de proyecto del resumen agrícola AgroWay. Cada fixture conserva esquema, responsable y procedencia propios.
- Mantener separados valores observados, supuestos, proyecciones, valores ausentes y alcance futuro con texto y etiquetas, nunca solo con color.
- No calcular utilidad neta, dividendo ni retorno cuando falten costos, estructura contractual y revisión humana.
- La lectura de AgroWay es de solo lectura, versionada y aprobada solo para la demostración. Una lectura caducada, no aprobada o mal mapeada se oculta.
- “Mi espacio” separa intereses temporales del futuro historial personal. Muestra el resumen de sesión, escala de la ficha, lectura agrícola propia de cada proyecto y la fecha de corte. No llama “cartera” a una intención simulada ni presenta acuerdos o aportes como existentes.
- Ocultar los indicadores agrícolas vencidos o no disponibles; conservar los valores ausentes como desconocidos, sin convertirlos en cero. Nombrar AgroWay como fuente de solo lectura.
- El interés simulado permanece en memoria de la pestaña, no solicita datos personales, no llega a un servidor y no modifica AgroWay. La tarjeta explica que nadie recibió la selección y que desaparece al recargar.

## Interacción y accesibilidad

- Mantener rutas reconocibles en la URL, foco visible, orden de títulos, etiqueta persistente, errores junto a la acción, y área táctil de al menos 44 px.
- La navegación de la ficha permite llegar a proyecto, capital, lectura agrícola y seguimiento personal; los encabezados tienen margen frente a la navegación fija.
- Reordenar el contenido en móvil sin ocultar el proyecto, la fuente, las limitaciones ni la acción principal.
- Respetar prefers-reduced-motion. Usar formato es-CO para cifras y fechas.
- No incluir logos GREENATICS ni presentar SANA como una extensión visual de la web institucional.

## Tokens provisionales de la demo

La página usa papel cálido, tinta oscura, Forest, Earth, Clay y Signal como acentos. Los valores exactos viven en styles.css y .impeccable/design.json y solo describen esta propuesta local. No llamarlos colores oficiales.
