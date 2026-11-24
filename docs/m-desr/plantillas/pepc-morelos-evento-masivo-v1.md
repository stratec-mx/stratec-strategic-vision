# Plantilla opcional · Programa Específico de Protección Civil · Evento masivo · Morelos

| Ficha | |
|---|---|
| Servicio | STR-02.6 Protección Civil para Eventos Masivos. Es un **servicio adicional**, se ofrece cuando el cliente lo requiere |
| Plantilla | `PEPC-MOR-EVT`, versión 1, **borrador** |
| Fuente de la estructura | Un Programa Específico de Protección Civil para evento masivo, presentado ante la CEPCM en 2026, que proporcionó el titular. Aquí se toma **solo la estructura** (capítulos, apartados y su orden) y las normas que cita. No contiene datos del organizador, del evento ni del asesor que lo elaboró |
| Base legal | Ley Estatal de Protección Civil de Morelos y su Reglamento; normas citadas por apartado |
| Hermana de | [Plantilla del Programa Interno](pipc-morelos-v1.md). Comparte buena parte de los apartados |
| Estado | Modelo para validar. Sin código ni SQL |

> Los nombres “Programa Específico” y “Programa Especial” se usan para el mismo documento. Antes de publicar el servicio en el sitio hay que confirmar con la CEPCM cuál usa hoy.

---

## 1. En qué se distingue del Programa Interno

| | Programa Interno (PIPC) | Programa Específico del evento (PEPC) |
|---|---|---|
| Objeto | Un inmueble que opera todo el año | Un evento con fecha, aforo y montaje propios |
| Bloques | Prevención, auxilio, recuperación, contingencias y continuidad | Prevención, auxilio y recuperación. **No lleva** plan de contingencias ni plan de continuidad |
| Lo propio del evento | — | Descripción del evento y del escenario, montaje y desmontaje, **memoria de cálculo de estructuras**, plantas de energía, pirotecnia, **póliza de daños a terceros** y **apoyo de personal externo** (corporaciones) |
| Clasificación de riesgo | Incendio (NOM-002-STPS-2010), aforo y actividades altamente riesgosas | No hay clasificación formal: se usa el aforo estimado frente a la capacidad del inmueble |
| Dictámenes del inmueble | Sí (II.12 y II.13) | No: se sustituyen por la memoria de cálculo de las estructuras temporales |

Las claves de contenido (R, D, T, P, E, A, M y G) y la columna “Oblig.” significan lo mismo que en la [plantilla del Programa Interno](pipc-morelos-v1.md#1-cómo-leer-este-modelo).

## 2. Portada y control del documento

Cada página lleva un encabezado con:

- organizador;
- título “Programa Específico de Protección Civil (evento masivo)”;
- fecha de emisión, número de revisión y paginación “x de y”.

El pie de cada página lleva los datos del asesor. La portada incluye el nombre del evento y el año, y el cuadro **“Elaboró”** (asesor, con su número de registro ante la CEPCM) y **“Revisó”** (representante del organizador o de la UIPC).

## 3. Estructura

### I. Descripción

| Código | Apartado | Contenido | De dónde sale | Oblig. | Norma |
|---|---|---|---|---|---|
| I.1 | Datos generales | — | | Sí | |
| I.1.1 | Nombre o razón social del organizador | D | `clients` | Sí | |
| I.1.2 | Domicilio fiscal o para oír y recibir notificaciones | D | Ficha del cliente | Sí | |
| I.1.3 | Nombre del evento | D | `study_objects.name` (tipo `evento_masivo`) | Sí | |
| I.1.4 | Tipo de evento | D | `study_objects.description` | Sí | |
| I.1.5 | Domicilio del evento | D | `sites` | Sí | |
| I.1.6 | Teléfonos del representante legal | D | `client_contacts` (dato protegido) | Sí | |
| I.1.7 | Contacto en caso de emergencia | D | Directorio de la UIPC | Sí | |
| I.1.8 | Total de personal: administrativo, operativo y apoyo externo | T | Personal del evento + II.7 | Sí | |
| I.1.9 | Capacidad máxima del inmueble | D | Ficha del inmueble | Sí | |
| I.1.10 | Aforo estimado del evento | D | `study_objects.expected_attendance` | Sí | |
| I.1.11 | Horario del evento | D | `study_objects.event_start` y `event_end` | Sí | |
| I.1.12 | Correo para oír y recibir notificaciones | D | Dato del PEPC | Sí | |
| I.1.13 | Responsable de la UIPC | D | II.1 | Sí | |
| I.2 | Escrito bajo protesta de decir verdad, firmado por el representante legal | R + A | Texto base + escaneo firmado | Sí | Ley y Reglamento estatales |
| I.3 | Identificación oficial del representante legal | A | Archivo del cliente | Sí | |
| I.4 | Comprobante de domicilio del lugar del evento | A | Archivo del cliente | Sí | |
| I.5 | Poder notarial y carta poder | A | Archivo del cliente | Cond. (si firma un apoderado) | |
| I.6 | Carta de corresponsabilidad | A | Firma del asesor y del organizador | Sí | |
| I.7 | Registro vigente del asesor | A | Lo coloca el titular a mano | Sí | |
| I.8 | Georreferenciación del evento y colindancias | P + T | `sites` + plano | Sí | |
| I.9.1 | Descripción general del evento: programa, público, horarios de acceso y salida | R | Ficha + redacción | Sí | |
| I.9.2 | Descripción y características del escenario | R + E | Redacción + fotos o renders | Sí | |
| I.9.3 | Localización del escenario | P | Plano: símbolo `escenario` (nuevo, §5) | Sí | |
| I.9.4 | Programa de montaje y desmontaje | T | Cronograma (dato nuevo) | Sí | |
| I.9.5 | Memoria de cálculo del escenario, templetes, gradas, carpas y demás estructuras | A | **Documento de tercero** (§4) | Sí | |
| I.9.6 | Plantas de energía eléctrica: capacidad, ubicación y protección | T + P | Inventario + plano | Cond. (si hay plantas) | |
| I.9.7 | Artificios pirotécnicos | A + T | Permisos y proveedor | Cond. (si hay pirotecnia) | |
| I.9.8 | Póliza de seguro de daños a terceros vigente | A | Archivo del organizador | Sí | |

### II. Plan operativo · Subprograma de prevención

| Código | Apartado | Contenido | De dónde sale | Oblig. | Norma |
|---|---|---|---|---|---|
| II.1 | UIPC del evento | T | Integrantes (comparte el modelo del PIPC) | Sí | |
| II.2 | Acta constitutiva de la UIPC | R + A | Texto base + escaneo firmado | Sí | |
| II.2.1 | Organigrama | G | Integrantes y brigadas | Sí | |
| II.3 | Directorios interno y externo | T | Integrantes + catálogo municipal | Sí | |
| II.3.x | Funciones de cada brigada: evacuación, incendios, primeros auxilios, búsqueda y rescate, comunicación y otra | T + R | Integrantes + textos base del Consultor | Sí (otra: Cond.) | |
| II.4 | Análisis de riesgos | M | Diagnóstico M-DESR del evento (módulo `eventos_masivos`) | Sí | |
| II.4.1 | Riesgos internos y su localización | M + P | `threats`, `risk_scenarios`; plano | Sí | |
| II.4.1.2 | Equipos o sistemas de prevención y mitigación | M + T | `controls` | Sí | |
| II.4.2 | Riesgos externos y su localización | M + P | Entorno, PESTEL, colindancias | Sí | |
| II.5 | Equipos contra emergencias: inventario y localización | T + P | Plano (`extintor`, `botiquin`…) | Sí | NOM-002-STPS-2010 |
| II.6 | Señalización y su localización | T + P | Plano (`salida_emergencia`, `ruta_evacuacion`, `punto_reunion`) | Sí | NOM-003-SEGOB-2011 (hoy citada como NOM-003-SSPC-2011); NOM-026-STPS-2008; NOM-018-STPS-2015 |
| II.7 | Apoyo de personal externo | T | Tabla de corporaciones (dato nuevo, §6) | Sí | NOM-010-SSPC-2019 (Sistema de Comando de Incidentes) |
| II.7.1 | Seguridad pública | T | Elementos, horario y responsable | Sí | |
| II.7.2 | Seguridad privada | T | Empresa, elementos y funciones | Cond. | |
| II.7.3 | Emergencias médicas: ambulancias, módulos y personal | T | Proveedor, unidades y ubicación | Sí | NOM-034-SSA3-2013 |
| II.7.4 | Tránsito y vialidad | T | Cortes, accesos y estacionamiento | Cond. | |
| II.7.5 | Bomberos | T | Unidades y ubicación | Cond. | |
| II.7.6 | Protección Civil (municipal o estatal) | T | Enlace y presencia | Sí | |
| II.7.7 | Otro apoyo externo | T | | Cond. | |
| II.7.8 | Localización del personal externo | P | Plano: posiciones de apoyo externo (nuevo, §5) | Sí | |
| II.8.1 | Constancias de capacitación vigentes del personal | A | Archivo | Sí | |
| II.8.2 | Registro del capacitador ante la CEPCM | A | Registro | Sí | |
| II.8.3 | Difusión y concientización: mensajes al público y al personal | R + E | Texto base + evidencias | Sí | |

### III. Subprograma de auxilio

| Código | Apartado | Contenido | Oblig. |
|---|---|---|---|
| III.1.1 | Procedimiento por sismo | R (biblioteca compartida con el PIPC y con Protocolos) | Sí |
| III.1.2 | Procedimiento por incendio | R | Sí |
| III.1.3 | Fugas o derrames de sustancias químicas | R | Cond. |
| III.1.4 | Amenaza de bomba | R | Sí |
| III.1.5 | Otros, según los escenarios del evento: aglomeración o estampida, persona extraviada, riña, clima severo, falla eléctrica | R (de los escenarios de M-DESR) | Cond. |

### IV. Subprograma de recuperación

| Código | Apartado | Contenido | Oblig. |
|---|---|---|---|
| IV.1 | Plan de evaluación de daños: inspección visual, física y técnica | R + T | Sí |
| IV.2 | Vuelta a la normalidad y restablecimiento de la UIPC | R | Sí |

### V a VII. Cierre

| Código | Apartado | Contenido | De dónde sale | Oblig. |
|---|---|---|---|---|
| V | Conclusiones y recomendaciones | M + R | `recommendations` + redacción | Sí |
| VI | Bibliografía | G | `normative_references` usadas | Sí |
| VII | Anexos | G | `document_annexes` en orden | Sí |

## 4. Restricciones de competencia (alertas internas)

- **Memoria de cálculo de estructuras (I.9.5):** la firma un profesionista competente (ingeniero estructurista). STRATEC no la elabora: la anexa.
- **Pirotecnia (I.9.7):** el proveedor y sus permisos son de la autoridad competente. STRATEC solo anexa y verifica que existan.
- **Póliza de seguro (I.9.8):** es del organizador. Solo se anexa.
- **Carta de corresponsabilidad y registro del asesor (I.6 y I.7):** igual que en el PIPC. El registro de STRATEC está vigente y el titular lo anexa a mano.
- Igual que en el PIPC, estas alertas no van en los textos para el cliente.

## 5. Símbolos nuevos para el plano del evento

Se suman al catálogo C-11 del Documento 02:

| `code` | Etiqueta | Geometría |
|---|---|---|
| `escenario` | Escenario o templete | polígono |
| `gradas` | Gradas | polígono |
| `carpa` | Carpa | polígono |
| `zona_publico` | Zona de público (con aforo) | polígono |
| `acceso_publico` | Acceso o filtro de público | punto |
| `planta_electrica` | Planta de energía | punto |
| `modulo_medico` | Módulo médico o ambulancia | punto |
| `puesto_apoyo_externo` | Posición de seguridad, tránsito, bomberos o Protección Civil | punto |
| `puesto_mando` | Puesto de mando (Sistema de Comando de Incidentes) | punto |

## 6. Datos nuevos del evento

| Dato | Apartados | Se reutiliza en |
|---|---|---|
| Programa del evento y horarios de acceso y salida | I.9.1 | Diagnóstico de eventos del sitio |
| Cronograma de montaje y desmontaje | I.9.4 | — |
| Inventario de plantas de energía | I.9.6 | — |
| Corporaciones y personal externo (número de elementos, horario, enlace y ubicación) | II.7 | Protocolos de seguridad para eventos |
| Integrantes de la UIPC y brigadas | II.1–II.3 | PIPC y capacitación de brigadas |

El diagnóstico gratuito de **eventos** del sitio ya pide tipo de evento y asistencia. Al convertirlo en proyecto (Documento 02, sección 12), esos datos llenan I.1.4 e I.1.10.

## 7. Pendientes

1. Confirmar con la CEPCM el nombre vigente (Programa Específico o Especial) y si hay un formato oficial para eventos. Este modelo sale de un programa presentado, no de una guía oficial.
2. Plazos de presentación antes del evento. Van como alerta interna y en la cotización, no en el documento.
3. Textos base de los procedimientos propios de eventos (estampida, persona extraviada, clima severo): los redacta y valida el Consultor.
4. Vigencia de las normas citadas, igual que en el PIPC.
