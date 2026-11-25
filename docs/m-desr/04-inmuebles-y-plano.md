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
| Satélite | **Opcional**, solo como referencia visual en pantalla (Esri), si la licencia lo permite. Nunca para calcar ni en el PDF hasta confirmar la licencia | Ver la sección 11.1b del Documento 02 |
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
- **Sin conexión (fase 2):** guardar en el teléfono y sincronizar al volver la señal. En la versión 1 se necesita conexión.

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

**Referencia revisada: Boldr Pro (REEKON Tools).** No es una app para dibujar planos. Sirve para capturar datos de obra: anotar medidas sobre fotos y PDF, llevar listas de medidas y usar calculadoras (área, escaleras), con medidores láser de la marca conectados por Bluetooth. La idea que sí se toma:

- **Fase 2:** capturar medidas desde un distanciómetro láser con Bluetooth directo en el croquis, en lugar de teclearlas;
- en teléfonos Android con Chrome se puede leer el distanciómetro desde el navegador; en iPhone haría falta una app nativa;
- en la versión 1, las medidas se teclean.

## 11. Pendientes antes de construir

| # | Pendiente | Propuesta |
|---|---|---|
| 3 | Satélite como referencia en pantalla | Solo si Esri confirma la licencia (Documento 02, 11.1b) |
| 4 | Precisión del GPS en interiores | En interiores el GPS falla; ahí los elementos se colocan a mano sobre el plano |
| 5 | Diseño de la lámina | Una propuesta visual con la identidad de STRATEC, para que el titular la apruebe |
