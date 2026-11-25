# M-DESR · Documento 04 · Módulo Inmuebles y plano: especificación funcional

| Ficha | |
|---|---|
| Versión | 0.1, especificación funcional para validar antes de construir la pantalla móvil |
| Fecha | 24 de noviembre de 2026 |
| Parte de | [Documento 02](02-modelo-logico.md) (tablas `sites`, `areas`, `site_plans`, `plan_features`) y [Documento 03](03-expediente-y-plantillas.md) (apartado “Inmuebles y plano” del expediente) |
| Sustituye | La sección 11.1b del Documento 02 en cuanto al proveedor de mapa (ver §3) |
| Estado | Sin código ni SQL. Los cambios a la base van en el script de plantillas (12), probado primero en Supabase de prueba |

> **Qué es este módulo:** un sistema de **levantamiento y representación geográfica de campo**, no un mapa con marcadores. Cada elemento conserva sus propios datos y se reutiliza en el diagnóstico, en el Programa Interno, en el Programa Específico del evento y en cualquier otro entregable.

---

## 1. Modelo cartográfico de STRATEC: cuatro capas

| Capa | Función | Fuente | Se guarda en STRATEC |
|---|---|---|---|
| 1. Cartografía pública | Contexto urbano: calles, nombres, manzanas, construcciones y referencias | Mapa base de terceros (§3) | **No.** Se consulta en vivo; nunca se descarga ni se copia |
| 2. Coordenadas GPS | Ubicación del inmueble y de puntos de referencia | Teléfono del consultor | Sí, con su precisión |
| 3. Geometrías propias | Perímetro, colindancias, áreas, accesos, rutas, equipos, zonas de riesgo y punto de reunión | Las registra el consultor | Sí (PostGIS) |
| 4. Información de inspección | Fotografías, observaciones, medidas, características y condiciones de seguridad | Inspección de campo | Sí, ligada a cada elemento |

**Las geometrías nunca se calcan de una imagen de terceros.** Salen de:

- GPS en campo;
- vértices que el consultor coloca según lo que mide y observa en el sitio;
- el plano o levantamiento que entrega el cliente.

El mapa base solo sirve para orientarse.

## 2. Reglas

1. **Las coordenadas GPS no son un levantamiento topográfico.** Se guardan con la precisión que reporta el teléfono.
2. **Toda medida que calcule el sistema se identifica como aproximada**, en pantalla, en el PDF y en el pie de cada lámina. Leyenda: “Medidas aproximadas obtenidas en campo; no sustituyen un levantamiento topográfico.”
3. **Cada documento aprobado conserva una copia inmutable** de las geometrías, las evidencias y la lámina cartográfica que usó (R-12 del Documento 02).
4. **No se guarda nada como una sola imagen.** Cada elemento conserva sus datos, y la imagen se genera al emitir el documento.
5. **La información de ubicación de cámaras, accesos y puntos ciegos es sensible.** Solo la ven los miembros del proyecto y nunca aparece en demostraciones.

## 3. Decisión de tecnología

| Componente | Decisión | Motivo |
|---|---|---|
| Visor de mapas | **MapLibre** (código abierto) | No depende de un proveedor; funciona en teléfono y computadora |
| Mapa base inicial | **OpenStreetMap** con un proveedor de teselas vectoriales | La licencia de OpenStreetMap (ODbL) permite reproducir el mapa en documentos, incluso comerciales, con la atribución “© colaboradores de OpenStreetMap” |
| Proveedor de teselas | Por definir: **OpenFreeMap** (gratuito, sin llave) o teselas propias en un archivo PMTiles de Morelos | Los servidores públicos de openstreetmap.org no permiten el uso de una aplicación en producción |
| Dibujo táctil | **Terra Draw** (código abierto) | Polígonos, líneas y puntos con el dedo; compatible con MapLibre |
| Geometrías | **PostGIS** en Supabase | Medidas, áreas y búsquedas espaciales en la base; resuelve D-11 del Documento 02 (antes: “después”) |
| Evidencias | Supabase Storage privado (`mdesr-evidencias`) | Ya existe (script 10) |
| Satélite | **Opcional**, solo como referencia visual en pantalla (Esri, con cuenta de ArcGIS Location Platform). Nunca para calcar ni en el PDF sin confirmación escrita de Esri | Ver §11 |
| Google Maps | **Descartado como dependencia.** Se puede evaluar después como mapa base alternativo solo en pantalla | Su política prohíbe usar sus mapas en documentos generados y calcar su imagen satelital |

Como el modelo guarda geometrías propias en coordenadas estándar (WGS84), **el mapa base se puede cambiar sin perder ningún plano.**

## 4. Flujo de campo

Ejemplo: el consultor inspecciona un inmueble en Jiutepec.

1. Abre el proyecto en el teléfono, entra a **Inmuebles y plano** y elige la ubicación, o la crea.
2. **Ubicar:** el mapa se centra con el GPS. Confirma la posición y queda guardada con su precisión.
3. **Delimitar el predio:** elige el método:
   - **recorrido GPS:** toca “Marcar vértice” en cada esquina mientras camina el perímetro;
   - **vértices a mano:** coloca y mueve los puntos con el dedo, con el mapa como orientación;
   - **plano del cliente:** sube el plano como anexo y registra las medidas.

   El sistema calcula la superficie y el perímetro aproximados.
4. **Colindancias:** para cada lado marca orientación (norte, sur, oriente o poniente), tipo (calle, casa habitación, comercio, baldío, industria…) y descripción. Puede tomar foto.
5. **Áreas:** dibuja o nombra las áreas internas, con fotos (memoria fotográfica del Programa Interno, I.10).
6. **Elementos:** coloca extintores, salidas, rutas, punto de reunión, señales, cámaras con su cobertura y zonas de riesgo. Cada uno lleva su tipo, sus características (por ejemplo, agente y capacidad del extintor) y fotos.
7. **Hallazgos:** desde un elemento o un punto del mapa crea un hallazgo del diagnóstico, que queda ligado a esa ubicación.
8. Todo se guarda en el expediente. Desde la computadora se revisa, se corrige y se completa.

## 5. Funciones

| # | Función | Detalle |
|---|---|---|
| F-01 | Ubicar con GPS | Centra y registra latitud, longitud y precisión |
| F-02 | Delimitar el predio | Por recorrido GPS, por vértices a mano o con el plano del cliente. Calcula superficie y perímetro aproximados (PostGIS) |
| F-03 | Colindancias | Orientación, tipo, descripción y foto por cada lado |
| F-04 | Áreas | Polígono, nombre, tipo, importancia y fotos. Se liga a `areas` |
| F-05 | Símbolos y elementos | Catálogo C-11 del Documento 02, más los del evento (escenario, gradas, carpas, accesos de público, planta eléctrica, módulo médico, apoyo externo y puesto de mando) |
| F-06 | Cámaras con cobertura | Dirección, ángulo y alcance; dibuja el cono de visión |
| F-07 | Rutas de evacuación | Líneas con orden y sentido, hasta el punto de reunión |
| F-08 | Fotos por elemento | Desde la cámara del teléfono, con fecha, autor y coordenadas. Van al almacenamiento privado |
| F-09 | Hallazgos ubicados | Crear o ligar un hallazgo desde un elemento o un punto |
| F-10 | Medir | Distancia y área sobre las geometrías, siempre marcadas como aproximadas |
| F-11 | Capas | Encender o apagar grupos: protección civil, seguridad, riesgos, intervención. Lo sensible solo lo ven los miembros del proyecto |
| F-12 | Versiones del plano | Cada cambio importante crea una versión. La versión de un diagnóstico cerrado queda congelada |
| F-13 | Lámina técnica | Genera la imagen del plano para el documento (§7) |
| F-14 | **Mapa de cartera** | Vista general con un marcador por cada inmueble donde interviene STRATEC, con color por estado del proyecto. **Cada quien ve solo lo que puede ver:** el Administrador, todos; el Consultor, el Analista y los demás, solo sus proyectos asignados (RLS). Al tocar un marcador se abre el expediente |
| F-15 | **Navegación tipo Prezi** | Acercamientos animados y continuos: cartera → municipio → inmueble → área → elemento (`flyTo` de MapLibre). Como el mapa y los trazos son vectoriales, no pierden calidad al acercarse |

### 5.1 Liga con el cliente

- Cada levantamiento pertenece a un **objeto de estudio** ligado a un **cliente que ya existe** en `clients` (`study_objects.client_id`, Documento 02).
- El módulo **solo lee** los datos del cliente (nombre y contacto según los permisos); no los crea ni los modifica.
- Un cliente nuevo se da de alta en el módulo Clientes.
- **Sin conexión con el cotizador en la versión 1.** La liga proyecto–cotización ya existe en el modelo (`projects.quote_id`) y se usará cuando el cotizador lo integre.

### 5.2 Croquis interior por niveles

El mapa (capas 1 a 3) resuelve **el exterior**: ubicación, predio, colindancias y entorno. Pero las láminas del Programa Interno de equipos, señalización y rutas de evacuación son casi siempre **planos interiores por planta**. Para eso hace falta un editor sencillo de croquis, distinto del mapa.

**Qué hace (versión 1):**

| # | Función | Detalle |
|---|---|---|
| C-01 | Niveles | Planta baja, nivel 1, sótano, azotea…, con su **nivel de piso** (metros respecto a la planta baja) |
| C-02 | Perímetro y geometría del nivel | Muros exteriores con medidas **escritas o tomadas con cinta o distanciómetro**: el usuario teclea el largo de cada tramo, con ángulos rectos por defecto y ajuste a cuadrícula. Calcula la superficie aproximada |
| C-03 | Espacios | Polígonos con nombre y tipo: oficina, departamento X, estacionamiento, lobby, bodega, sanitarios, cuarto de máquinas, área de público… Cada espacio se liga a `areas` del Documento 02 |
| C-04 | Aberturas y circulaciones | Puertas (ancho y sentido de apertura), ventanas, escaleras (sube o baja y hacia qué nivel), elevador y rampas |
| C-05 | Replicar planta | “Copiar este nivel” para pisos iguales. Después se ajustan las diferencias, como los nombres de los departamentos |
| C-06 | Elementos de protección civil y seguridad | Los mismos símbolos del mapa (extintores, salidas, rutas, señales, botiquín, alarmas, cámaras con cobertura y zonas de riesgo), colocados sobre el croquis del nivel |
| C-07 | Fotos | Ligadas a cada espacio o elemento, como en el mapa |
| C-08 | Amarre al predio | El croquis se coloca sobre el perímetro del predio con un punto de origen y un giro, para que el plano exterior y el interior coincidan |

**Cómo se dibuja y cómo reconoce los espacios:**

| Comportamiento | Cómo funciona |
|---|---|
| Trazar muros | Tramo por tramo, con el dedo o tecleando el largo. Ángulos de 90° y 45° por defecto. Los muros tienen grosor (15 cm de inicio, editable) y se unen solos en las esquinas |
| Imán | Al acercarse, el trazo se pega a vértices, a muros existentes, a la prolongación de un muro, a la cuadrícula y al contorno del predio dibujado en el mapa |
| **Reconoce espacios** | Cuando los muros cierran un recinto, el sistema lo detecta como espacio, calcula su superficie y pide nombre y tipo (oficina, lobby, estacionamiento…) |
| **Ajusta espacios** | Mover un muro o un vértice actualiza todos los espacios que lo comparten, con sus superficies. Las puertas y ventanas de ese muro se mueven con él |
| Dividir y unir | Un muro trazado dentro de un espacio lo divide en dos. Borrar un muro une los dos espacios en uno, conservando el nombre del mayor |
| Cotas | Cada tramo muestra su medida. Editar la cota mueve el muro y ajusta los espacios |
| Puertas y ventanas | Se colocan sobre un muro y quedan pegadas a él: no pueden quedar sueltas. Tienen ancho y la puerta, sentido de apertura |
| Escaleras | Rectángulo con flecha de sube o baja y el nivel al que llega; aparece también en ese nivel |
| Relación con el plano exterior | El contorno del nivel se encaja en el perímetro del predio del mapa (C-08). Si el croquis se sale del predio, el sistema avisa. Cada espacio se liga a las `areas` del expediente, que usan el diagnóstico y los documentos |
| Replicar planta | Copia muros, espacios, aberturas y escaleras; luego se ajustan las diferencias |
| Deshacer y rehacer | Siempre disponibles |

**Cómo se guarda:**

- coordenadas **locales en metros** (x, y) por nivel, no latitud y longitud, porque un interior no necesita GPS;
- tablas nuevas (script 12): `building_levels` (nivel, nombre, nivel de piso, altura y origen del amarre) y `floor_plan_elements` (tipo, geometría local y propiedades: ancho de puerta, sentido, “sube a”…);
- los espacios reutilizan `areas`, y los equipos reutilizan los tipos de `plan_feature_types`.

**Lo que no hace en la versión 1:** escaneo 3D, LiDAR ni medición automática con la cámara. Si más adelante se usa una app de escaneo, se importará su plano exportado (DXF o SVG) como base del nivel.

**Láminas que produce:** croquis por nivel con rutas de evacuación, equipos y señalización (Programa Interno II.8, II.9 y II.16), con el mismo cajetín, simbología y leyenda de medidas aproximadas que las láminas del mapa (§7).

## 6. Qué agrega a la base de datos (script 12, probado antes en Supabase de prueba)

| Cambio | Detalle |
|---|---|
| Activar PostGIS | Extensión `postgis` en Supabase |
| Columnas espaciales | `sites.location` (punto); `site_plans.perimeter_geom` (polígono); `plan_features.geom` (geometría). Se calculan desde el GeoJSON que ya existe, que se conserva |
| Medidas en la base | Superficie y perímetro se calculan con PostGIS (`geography`), no en el navegador |
| Origen de la medida | `measurement_method` acepta `gps_campo` y pasa a `levantamiento_campo` por defecto. Los planos existentes no cambian |
| Precisión GPS | `gps_accuracy_m` en `sites` y en los vértices |
| Datos de colindancia | En `plan_features.properties`: `orientation` (norte, sur, oriente, poniente, noreste…), `boundary_type` y `description` |
| Fotos por elemento | Tabla nueva `plan_feature_evidence` (N:M, igual que `finding_evidence`) |
| Símbolos del evento | Se agregan a `plan_feature_types` (Documento de la plantilla del evento, §5) |

## 7. Lámina técnica con identidad STRATEC

El plano que se entrega **no es una captura de pantalla**: es una lámina técnica compuesta por el sistema, con identidad STRATEC.

| Elemento | Contenido |
|---|---|
| Cuerpo | Mapa base (OpenStreetMap) con las geometrías propias encima, en la simbología de STRATEC |
| Rosa de los vientos | Indica el norte, junto al cuadro de colindancias |
| Escala | Gráfica y numérica |
| Cuadro de colindancias | Norte, sur, oriente y poniente, con tipo y descripción |
| Simbología | Solo los símbolos que aparecen en la lámina |
| Cajetín | Logotipo de STRATEC, proyecto, cliente, ubicación, coordenadas del inmueble, fecha, versión del plano, elaboró y revisó |
| Fuentes | “Cartografía base: © colaboradores de OpenStreetMap” y el método de medición |
| Leyenda | “Medidas aproximadas obtenidas en campo; no sustituyen un levantamiento topográfico” |

Láminas típicas del Programa Interno:

- georreferencia (I.8);
- colindancias (I.9);
- áreas (I.10);
- riesgos internos y externos (II.7);
- equipos contra emergencias (II.8);
- señalización, rutas y punto de reunión (II.9).

En el evento: escenario (I.9.3) y apoyo externo (II.7.8). Cada lámina se congela con el documento aprobado.

## 8. Uso en el teléfono

- Botones grandes y pocos pasos; se usa con una mano en campo.
- Modo “recorrido”: el GPS sigue al consultor y un botón grande marca cada vértice.
- Fotos directo desde la cámara, ligadas al elemento abierto.
- **Sin conexión, completo, desde la versión 1** (decisión del 24-nov, §13): mapas descargados por zona y sincronización automática al volver la señal.

## 9. Pruebas de aceptación

1. Desde un teléfono se ubica un inmueble con GPS y la precisión queda guardada.
2. Se delimita un predio por recorrido GPS y se obtienen superficie y perímetro aproximados.
3. Se registran las cuatro colindancias con orientación, tipo y foto.
4. Un extintor colocado en el mapa conserva su tipo, sus características y sus fotos.
5. Un hallazgo creado desde el mapa aparece en el diagnóstico con su ubicación.
6. La lámina de colindancias sale con rosa de los vientos, escala, cuadro, cajetín, fuentes y leyenda.
7. Cambiar el plano después de aprobar un documento no altera la lámina del documento emitido.
8. Una persona no asignada al proyecto no ve cámaras, accesos ni puntos ciegos.
9. Cambiar el mapa base no altera ninguna geometría guardada.

## 10. Decisiones y prueba visual (24-nov-2026)

| # | Tema | Resultado |
|---|---|---|
| 1 | Proveedor de teselas | **OpenFreeMap** (gratuito, sin llave ni tarjeta; datos de OpenStreetMap). Si algún día falla, se cambia por un archivo PMTiles propio de Morelos sin tocar las geometrías |
| 2 | Prueba visual en Morelos | Hecha con MapLibre + OpenFreeMap, estilo *liberty* (capturas en [`pruebas/`](pruebas/)). Resultados por zona en la tabla siguiente. **Es suficiente como mapa de orientación** para ubicar y nombrar colindancias; las geometrías salen de campo, así que no depende de que el mapa tenga cada construcción |
| 3 | Interiores | De acuerdo: dentro de edificios los elementos se colocan a mano sobre el croquis del nivel (§5.2) |
| 4 | Diseño de la lámina | De acuerdo: se presentará una propuesta visual para aprobación |

| Zona | Resultado |
|---|---|
| Centro de Cuernavaca | Calles con nombre, sentido de circulación, construcciones, comercios y servicios, parques y escala |
| CIVAC, Jiutepec | Calles y avenidas con nombre, colonias, escuelas, comercios y unidades habitacionales. En las zonas residenciales faltan casi todas las construcciones |
| Tlayacapan | Calles con nombre y edificios principales (presidencia, mercado, ex convento); casi sin construcciones |
| Tlaltizapán | Calles con nombre, carreteras (MOR 2 y MOR 4), río y clínica; sin construcciones |

## 11. Licencia de Esri World Imagery (validación del 24-nov-2026)

Se revisaron solo fuentes oficiales de Esri y del INEGI. **No es una opinión legal.**

| # | Pregunta | Resultado |
|---|---|---|
| 1 | Uso comercial recurrente en un panel interno | Permitido dentro de una **aplicación del cliente** con una cuenta de **ArcGIS Location Platform**. El acuerdo incluye como usuarios a los “usuarios finales o clientes” de quien contrata. Las salidas del servicio solo sirven “para visualización” y “dentro de las aplicaciones del cliente”, y no se pueden revender ni redistribuir a terceros (Acuerdo de ArcGIS Location Platform, rev. 21-nov-2025, art. 3.1 d) |
| 2 | Atribución | Obligatoria en toda salida del mapa base (art. 3.1 d 4), sin quitar ni ocultar avisos (art. 3.1 a 3). Texto vigente del servicio: **“Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community”** (Maxar ahora aparece como Vantor). Hay condiciones adicionales de proveedores de datos en esri.com/legal/third-party-data, que todavía no se revisan |
| 3 | Dibujar encima y exportar a PDF para el cliente | **No está claro.** Dibujar figuras propias encima es visualización y no está prohibido. Se permite usar la salida “en formato estático (PDF, GIF, JPEG, HTML), en forma final inalterable” (art. 3.1 d 6 B). Pero el mismo artículo prohíbe “redistribuir la salida a terceros” y la limita a la aplicación. La página de mapas estáticos de ArcGIS Online sí menciona “un informe para un cliente”, pero es de otro producto. **Hace falta una confirmación por escrito de Esri** antes de poner su imagen en el Programa Interno. Además, no se puede extraer, descargar ni guardar la imagen fuera de lo permitido (art. 3.1 d 6) |
| 4 | Cuenta, llave y nivel gratuito | Hace falta una **cuenta de ArcGIS Location Platform** y un token de acceso. Gratis al mes: **2 millones de teselas** (después, 0.15 USD por cada 1,000), o **1,000 sesiones** (después, 4 USD por cada 1,000), y **1,000 mapas estáticos** (después, 0.90 USD por cada 1,000). Para 5 a 20 usuarios se queda dentro de lo gratuito. Nota: el mapa de demostración actual (`/mapa-demo`) usa las teselas de ArcGIS Online sin token; eso no sirve para producción |
| 5 | Calidad en Morelos (metadatos del servicio) | **Buena.** Centro de Cuernavaca y CIVAC: 0.5 m por pixel, WorldView-2, 15-ene-2024, precisión ±5 m. Tlayacapan: 0.5 m, 26-ene-2024. Tlaltizapán: 0.34 m, 26-feb-2026. Alcanza para identificar techos, patios y accesos, no para medir |

**Cuidado con mezclar licencias:** el acuerdo de Esri prohíbe combinar su salida de forma que quede sujeta a licencias abiertas de bases de datos (art. 3.1 a 4). Mostrar OpenStreetMap y la imagen de Esri como capas separadas en pantalla es visualización. No hay que generar un producto que mezcle los datos de los dos.

**Alternativas libres:**

| Opción | Uso comercial y en PDF | Pendiente |
|---|---|---|
| **OpenStreetMap** (calles), con OpenFreeMap | Sí, con “© colaboradores de OpenStreetMap” | Ya elegido como mapa base (§10) |
| **Ortoimágenes del INEGI** (imagen) | Sí: sus Términos de libre uso permiten “explotar comercialmente la información”, con el crédito “Fuente: INEGI, [producto]” y avisando de las transformaciones | No se pudo leer la página del producto: falta confirmar resolución, año y cobertura en Morelos, y cómo se sirve (descarga o servicio) |

**Conclusión:** la lámina del documento se queda con OpenStreetMap, que tiene licencia clara. Esri se puede usar como referencia satelital **solo en pantalla**, con cuenta de ArcGIS Location Platform y dentro del nivel gratuito. No se pone su imagen en el PDF hasta que Esri lo confirme por escrito. Si el titular quiere imagen satelital en el documento, la opción más clara es una ortoimagen del INEGI, sujeta a revisar su resolución en Morelos.

Fuentes:

- [Acuerdo de ArcGIS Location Platform (E204, rev. 21-nov-2025)](https://www.esri.com/content/dam/esrisites/en-us/media/legal/platform/platform-legal.pdf)
- [Precios de ArcGIS Location Platform](https://location.arcgis.com/pricing/)
- [Static Basemap Tiles service](https://developers.arcgis.com/rest/static-basemap-tiles/)
- [Servicio World Imagery y sus metadatos](https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer)
- [Mapas estáticos en ArcGIS Online](https://doc.esri.com/en/arcgis-online/latest/reference/static-maps.html)
- [Términos de libre uso del INEGI](https://www.inegi.org.mx/inegi/terminos.html)

## 13. Decisiones del titular sobre el prototipo (24-nov-2026)

El prototipo está publicado en `/app/inmuebles` (main `90a9c92`) y por ahora **guarda solo en el navegador**. Decisiones para la versión conectada a la base (script 12):

| # | Tema | Decisión | Efecto en el modelo |
|---|---|---|---|
| D-P1 | **Versiones del plano (F-12)** | Automáticas en momentos clave: al ligar el plano a un diagnóstico, al cerrarlo y al aprobar un documento. Además, guardado al editar, automático o con botón, con una nota de “qué cambió”. **Exterior y croquis interior van en la misma versión.** Un proyecto nuevo en el mismo inmueble parte de una copia del último plano vigente | `building_levels` y `floor_plan_elements` **cuelgan de `site_plans`** (la versión), no de `sites`. `site_plans` agrega `change_note`, `version_reason` (`diagnostico`, `cierre`, `aprobacion_documento`, `edicion`) y `copied_from_plan_id` |
| D-P2 | **Sin conexión** | Trabajo sin conexión **completo** desde la versión 1: mapas descargados por zona y sincronización automática | Teselas guardadas en el teléfono para la zona del proyecto y cola de cambios con resolución de conflictos (gana el último y queda en la bitácora). Las fotos se suben al volver la señal |
| D-P3 | **Permisos por función** | Todos ven lo sensible, **menos el observador comercial**. Editan el elaborador y el apoyo de campo. El **revisor** marca el plano como “revisado” y su nombre va en “Revisó” del cajetín. El Administrador ve todo | `site_plans.status` suma `revisado`, con `reviewed_by` y `reviewed_at`. Política: a quien solo es `observador` se le ocultan los elementos con `is_sensitive` |
| D-P4 | **Lo sensible en PDF** | Sale en el **diagnóstico** y en los **estudios de riesgo**, que se integran con el diagnóstico, el análisis y las propuestas. **No sale** en el Programa Interno ni en documentos para autoridades | `document_template_versions.allows_sensitive_features` (Documento 03): verdadero en el diagnóstico y el análisis de riesgo, falso en el Programa Interno, el Programa Específico y los documentos para autoridades |
| D-P5 | **Tipos sensibles separados** | Alarma de emergencia y salida **no** son sensibles. Sensor de intrusión y acceso controlado **sí** lo son | `plan_feature_types`: `alarma_emergencia` (no sensible) y `sensor_intrusion` (sensible) en lugar de `alarma`; `salida_emergencia` (no) y `control_acceso` (sí) |
| D-P6 | **Fichas de equipos** | Datos fijos: extintor (agente, capacidad y fecha de recarga), botiquín, hidrante, salida (ancho) y alarma. Para todos, un **estado de un toque**: bueno, regular, malo o no funciona | Esquema de `plan_features.properties` por tipo + `condition` (`bueno`, `regular`, `malo`, `no_funciona`). Alimenta el inventario del Programa Interno (II.8.1) |
| D-P7 | **Hallazgos desde el mapa** | Captura rápida (foto, título y ubicación) **solo con un diagnóstico abierto**. Se completa en la computadora. Lo que captura el apoyo de campo lo revisa el elaborador. Puede haber varios hallazgos por elemento | `findings` con `review_status = 'propuesta'` cuando lo captura el apoyo de campo. Tabla `plan_feature_findings` (N:M) en lugar de un solo `finding_id` |
| D-P8 | **Espacios del croquis y áreas** | El consultor agrupa espacios en áreas. Pasillos, sanitarios y escaleras **no crean área** por omisión | `floor_plan_elements.area_id` (varios espacios, una área), opcional. Tipos que no generan área: `pasillo`, `sanitario`, `escalera` |
| D-P9 | **Fotos** | Con la cámara (sin copia en la galería) o desde la galería, marcada como “subida después”. Si lleva la casilla “aparecen personas o placas”, **no sale en documentos** | `evidence.capture_mode` (`camara`, `galeria`). La casilla usa `evidence.contains_personal_data`, que ya existe; el generador de documentos la excluye siempre |
| D-P10 | **Satélite en pantalla** | Botón Mapa / Satélite con Esri. El titular crea la cuenta de ArcGIS Location Platform y pone la llave en Vercel. El botón aparece solo si existe la variable | Ninguno en la base. La imagen de Esri no va al PDF (§11) |

## 12. Pendientes antes de construir

| # | Pendiente | Propuesta |
|---|---|---|
| 3 | Satélite como referencia en pantalla | Solo si Esri confirma la licencia (Documento 02, 11.1b) |
| 4 | Precisión del GPS en interiores | En interiores el GPS falla; ahí los elementos se colocan a mano sobre el plano |
| 5 | Diseño de la lámina | Una propuesta visual con la identidad de STRATEC, para que el titular la apruebe |
