# Plantilla piloto · Programa Interno de Protección Civil · Morelos (riesgo ordinario y alto)

| Ficha | |
|---|---|
| Servicio | STR-02.1 Programa Interno de Protección Civil (sirve también para STR-02.5, actualización) |
| Plantilla | `PIPC-MOR`, versión 1, **borrador**. Una sola plantilla para las dos clasificaciones |
| Fuente de la estructura | Formato de Programa Interno de la Coordinación Estatal de Protección Civil de Morelos (CEPCM), **ejercicio 2025, riesgo alto**, que proporcionó el titular. Es la única guía que emite la CEPCM; los municipios la adoptan con los mismos apartados para los establecimientos de riesgo ordinario. Aquí se toma **solo la estructura** (capítulos, apartados y su orden) y las normas que cita cada apartado. No contiene datos de ningún cliente |
| Base legal | Ley Estatal de Protección Civil de Morelos y su Reglamento (vigentes); normas oficiales mexicanas citadas por apartado |
| Parte de | [Documento 03: expediente y plantillas](../03-expediente-y-plantillas.md) |
| Estado | Modelo para validar. Sin código ni SQL |

> **La plantilla no sustituye la guía oficial.** Cada año hay que confirmar con la CEPCM que el formato sigue vigente. Si cambia, se publica una versión nueva de la plantilla y los programas ya emitidos se quedan como estaban.

---

## 1. Cómo leer este modelo

Cada apartado de la guía se convierte en un apartado de la plantilla con:

- **Contenido:** qué tipo de contenido lleva (ver Documento 03, 5.3).
  - **R:** redacción
  - **D:** dato del expediente
  - **T:** tabla
  - **P:** plano o mapa
  - **E:** evidencia o fotografía
  - **A:** anexo escaneado
  - **M:** viene de M-DESR (hallazgos, riesgos, controles o recomendaciones)
  - **G:** generado automáticamente
- **De dónde sale:** la tabla o el apartado del expediente que lo alimenta.
- **Oblig.:**
  - **Sí:** siempre;
  - **Cond.:** solo si aplica (la condición se indica);
  - **NI:** no aplica a establecimientos de nuevo ingreso.
  - **Ord.:** en riesgo ordinario normalmente no aplica (ver §1.1). Es una sugerencia: lo decide quien elabora.

### 1.1 Clasificaciones y apartados que no aplican

En Morelos solo hay **dos clasificaciones: ordinario y alto**. La CEPCM solo emite la guía de riesgo alto, y los municipios la adoptan con **los mismos apartados** para riesgo ordinario. Por eso es **una sola plantilla**:

- **La clasificación** sale de II.5 (incendio, aforo y actividades altamente riesgosas). Se muestra en la portada y define a quién se presenta: la CEPCM o el municipio.
- **Se conservan todos los apartados** en el orden de la guía, aunque no apliquen. Así lo hace la práctica: el índice muestra “---” en lugar del número de página y el apartado dice “No aplica”, con el motivo.
- **Cada apartado se puede marcar “No aplica”** con un motivo breve. Por ejemplo: “El establecimiento no cuenta con instalación de gas L.P.” o “Establecimiento de nuevo ingreso”. Un apartado obligatorio marcado así no bloquea el envío a revisión, pero el motivo es obligatorio y lo ve el revisor.
- **El panel sugiere** qué no aplica según la clasificación, el giro y lo capturado en el expediente: sin sustancias químicas, sin gas o sin plantas, entre otros. El Consultor confirma.
- **Norma:** referencia que cita la guía en ese apartado (solo el número, nunca el texto).

## 2. Portada

| Elemento | Contenido | De dónde sale |
|---|---|---|
| Logotipo del establecimiento | E | Archivo del cliente (`evidence`) |
| Razón social | D | `clients.name`, o el dato de la ficha |
| Fotografía de la fachada | E | `evidence` (tipo foto, área “fachada”) |
| Título: “Programa Interno de Protección Civil” y ejercicio | G | Año del proyecto |
| Clasificación del riesgo: ordinario o alto | G | Resultado de II.5 |
| Logotipo y datos del asesor que elabora | D | Datos de STRATEC (configuración) |

## 3. Estructura

### I. Datos generales

| Código | Apartado | Contenido | De dónde sale | Oblig. | Norma |
|---|---|---|---|---|---|
| I.1 | Presentación: objetivos, tipo de instalación, reseña y antecedentes de emergencias (máximo una página) | R | Ficha del proyecto + bitácora | Sí | |
| I.2 | Datos generales y número de registro de protección civil (NRPC) | D | Ficha del cliente y del inmueble | Sí | |
| I.2.1 | Nombre o razón social | D | `clients` | Sí | |
| I.2.2 | Nombre comercial | D | `study_objects.name` | Sí | |
| I.2.3 | Giro o actividad | D | `clients.industry` / `study_objects.description` | Sí | |
| I.2.4 | Domicilio | D | `sites` | Sí | |
| I.2.5 | Teléfonos | D | `client_contacts` (dato protegido) | Sí | |
| I.2.6 | Contacto en caso de emergencia | D | Directorio de la UIPC (II.2.1) | Sí | |
| I.2.7 | Total de personal: administrativo, operativo y flotante | D | `study_objects.fixed_population` y `floating_population` + desglose | Sí | |
| I.2.8 | Aforo máximo | D | II.5.2 | Sí | |
| I.2.9 | Horario de funcionamiento | D | `study_objects.operating_hours` | Sí | |
| I.2.10 | Turnos laborales | T | Dato nuevo del PIPC | Sí | |
| I.2.11 | Correo para oír y recibir notificaciones | D | Dato nuevo del PIPC | Sí | |
| I.2.12 | Responsable de la UIPC | D | II.1 | Sí | |
| I.2.13 | Escrito bajo protesta de decir verdad, firmado por el representante legal y dirigido a la CEPCM | R + A | Texto base con datos + escaneo firmado | Sí | Ley y Reglamento estatales |
| I.2.14 | Identificación oficial del representante legal (anverso y reverso, a color) | A | Archivo del cliente | Sí | |
| I.2.15 | Comprobante de domicilio del establecimiento (licencia de funcionamiento o recibo de luz, a color) | A | Archivo del cliente | Sí | |
| I.3 | Poder notarial y carta poder, con identificaciones del otorgante, el apoderado y dos testigos | A | Archivo del cliente | Cond. (si firma un apoderado) | |
| I.4 | Aprobado del Programa Interno del ejercicio anterior | A | Archivo del cliente | NI | |
| I.5 | Visto bueno del ejercicio anterior | A | Archivo del cliente | NI | |
| I.6 | Carta de corresponsabilidad firmada por el asesor registrado y el representante | A | Firma del asesor y del cliente | Sí | |
| I.7 | Registro vigente del asesor que elabora el Programa Interno | A | Lo coloca el titular a mano: el registro está vigente | Sí | |
| I.8 | Georreferenciación del establecimiento | P | `sites.latitude` y `longitude`; versión vigente del plano | Sí | |
| I.9 | Colindancias: norte, sur, oriente y poniente | T + P | Plano (`plan_features` tipo colindancia) | Sí | |
| I.10 | Áreas del establecimiento con memoria fotográfica | T + E | `areas` + `evidence` por área | Sí | |

### II. Plan operativo · Subprograma de prevención

| Código | Apartado | Contenido | De dónde sale | Oblig. | Norma |
|---|---|---|---|---|---|
| II.1 | Unidad Interna de Protección Civil (UIPC) | T | Integrantes de la UIPC (dato nuevo del PIPC) | Sí | |
| II.1.1 | Acta constitutiva de la UIPC | R + A | Texto base con integrantes + escaneo firmado | Sí | |
| II.1.2 | Organigrama | G | Se genera con los integrantes y las brigadas | Sí | |
| II.1.3 | Actas de sesiones de la UIPC del ejercicio anterior (al menos una, firmada) | A | Archivo del cliente | NI | |
| II.1.4 | Resoluciones de los simulacros del ejercicio anterior | A | Archivo del cliente | NI | |
| II.2.1 | Directorio interno de la UIPC (números de cada integrante) | T | Integrantes de la UIPC (**dato personal**, ver §5) | Sí | |
| II.2.2 | Directorio externo de cuerpos de emergencia | T | Catálogo por municipio (configuración) | Sí | |
| II.3 | Funciones de cada brigada | R | Texto base por tipo de brigada | Sí | |
| II.3.1–II.3.6 | Brigadas: evacuación, incendios, primeros auxilios, búsqueda y rescate, comunicación, otra | T + R | Integrantes por brigada + funciones | Sí (la 3.6, Cond.) | |
| II.4 | Programa de actividades de la UIPC | T | Calendario anual (dato nuevo) | Sí | |
| II.5 | Clasificación del riesgo | — | | Sí | |
| II.5.1 | Grado de riesgo de incendio | T | Cálculo con inventario de materiales y superficie (ver §6) | Sí | NOM-002-STPS-2010 |
| II.5.2 | Aforo de personas | T | Ficha + áreas | Sí | |
| II.5.3 | Actividades altamente riesgosas (AAR) | T | Inventario de materiales y procesos | Sí | |
| II.5.4 | Conclusión: clasificación del establecimiento (ordinario o alto) | G + R | Resultado de II.5.1 a II.5.3 | Sí | NOM-002-STPS-2010 |
| II.6 | Listado de sustancias químicas peligrosas (SQP) | T | Inventario de sustancias (dato nuevo) | Cond. (si las hay) | NOM-018-STPS-2015; NOM-005-STPS-1998 |
| II.6.1 | Actividades o áreas donde se usan SQP | T + P | Inventario + `areas` + plano | Cond. | |
| II.7 | Análisis de riesgos | M | Diagnóstico M-DESR del proyecto | Sí | |
| II.7.1 | Riesgos internos | M + T | `threats`, `risk_scenarios`, `findings` con área interna | Sí | |
| II.7.1.1 | Localización de riesgos internos | P | Plano: `riesgo_puntual` y `zona_riesgo` | Sí | |
| II.7.1.2 | Equipos o sistemas para prevenir, mitigar o eliminar riesgos | M + T | `controls` y su eficacia | Sí | |
| II.7.2 | Riesgos externos | M + T | `threats` del entorno, PESTEL, colindancias | Sí | |
| II.7.2.1 | Localización de riesgos externos | P | Plano con el entorno | Sí | |
| II.8.1 | Inventario de equipos contra emergencias | T | Símbolos del plano (`extintor`, `hidrante`, `botiquin`, `alarma`) + sus datos | Sí | |
| II.8.2 | Localización de equipos contra emergencias | P | Plano | Sí | |
| II.9 | Señalización | T + E | Inventario de señales + fotos | Sí | NOM-003-SEGOB-2011; NOM-026-STPS-2008; NOM-018-STPS-2015 |
| II.9.1 | Localización de la señalización de emergencia | P | Plano (`salida_emergencia`, `ruta_evacuacion`, `punto_reunion`) | Sí | NOM-003-SEGOB-2011 |
| II.10 | Programa de mantenimiento del ejercicio | T | Calendario (dato nuevo); acciones de M-DESR (`action_items`) | Sí | |
| II.11 | Electricidad estática: condiciones de seguridad | T + E | Inspección | Cond. (según el giro) | NOM-022-STPS-2015 |
| II.12.1 | Dictamen de seguridad estructural | A | **Documento de tercero** (§4) | Sí (confirmar con la CEPCM) | |
| II.12.2 | Dictamen de verificación de instalaciones eléctricas | A | **Documento de tercero** | Sí (confirmar con la CEPCM) | NOM-001-SEDE (verificar la versión vigente) |
| II.12.3 | Dictamen de aprovechamiento de gas L.P. | A | **Documento de tercero** | Cond. (si hay gas L.P.) | NOM-004-SEDG-2004 |
| II.12.4 | Evaluación de espesores por pulso-eco | A | **Documento de tercero** | Cond. | |
| II.12.5 | Estaciones de gas L.P. para carburación | A | **Documento de tercero** | Cond. | NOM-003-SEDG-2004 |
| II.12.6 | Plantas de distribución de gas L.P. | A | **Documento de tercero** | Cond. | NOM-001-SESH-2014; NOM-018-ASEA-2023 |
| II.12.7 | Estaciones de servicio de diésel y gasolinas | A | **Documento de tercero** | Cond. | NOM-005-ASEA-2016; NOM-020-STPS-2011; NOM-154-SCFI-2005 |
| II.12.8 | Recipientes sujetos a presión | A | **Documento de tercero** | Cond. | |
| II.12.9 | Extintores: servicio de mantenimiento y recarga | A | **Documento de tercero** | Sí (confirmar con la CEPCM) | |
| II.12.10 | Aprovechamiento de gas natural | A | **Documento de tercero** | Cond. (si hay gas natural) | NOM-002-SECRE-2010 |
| II.13 | Otros dictámenes (carburación de motores, sistemas fijos contra incendio, terminales y bodegas de gas L.P., transporte y ductos) | A | **Documentos de tercero** | Cond. (según el giro) | NOM-003-ASEA-2016; NOM-005-SESH-2010; NOM-007-SESH-2010; NOM-010-ASEA-2016; NOM-011-ASEA-2019 |
| II.14.1 | Programa anual de capacitación | T | Calendario; liga con el servicio STR-03.1 | Sí | |
| II.14.2 | Constancias de capacitación del ejercicio anterior | A | Archivo del cliente o de STRATEC | NI | |
| II.14.3 | Registro del capacitador ante la CEPCM | A | Registro del capacitador | Sí | |
| II.14.4 | Evidencia fotográfica de la capacitación del ejercicio anterior | E | `evidence` | NI | |
| II.15 | Difusión y concientización | R + E | Texto base + evidencias | Sí | |
| II.16 | Programa anual de simulacros: escenario, guion y cronología | T + R | Calendario + escenarios de M-DESR | Sí | Ley estatal (simulacros) |

### III. Subprograma de auxilio

| Código | Apartado | Contenido | De dónde sale | Oblig. | Norma |
|---|---|---|---|---|---|
| III.1 | Procedimientos de emergencia | R | Biblioteca de procedimientos (se comparte con STR-01.4 Protocolos) | Sí | |
| III.1.1 | Para personas con discapacidad | R | Biblioteca + población del inmueble | Sí | NOM-008-SEGOB-2015 |
| III.1.2 | Sismo | R | Biblioteca | Sí | |
| III.1.3 | Incendio | R | Biblioteca | Sí | |
| III.1.4 | Fugas o derrames de sustancias químicas | R | Biblioteca | Cond. (si hay SQP) | |
| III.1.5 | Amenaza de bomba | R | Biblioteca | Sí | |
| III.1.6 | Otros procedimientos | R | Según los escenarios de riesgo de M-DESR | Cond. | |

### IV. Subprograma de recuperación

| Código | Apartado | Contenido | De dónde sale | Oblig. |
|---|---|---|---|---|
| IV.1 | Plan de evaluación de daños | R | Texto base | Sí |
| IV.1.1–IV.1.3 | Inspección visual, física y técnica | R + T | Texto base + listas de verificación | Sí |
| IV.2 | Plan de vuelta a la normalidad | R | Texto base | Sí |
| IV.2.1 | Acciones para restablecer la UIPC | R | Texto base | Sí |
| IV.2.2 | Vuelta a la normalidad | R | Texto base | Sí |

### V. Plan de contingencias

| Código | Apartado | Contenido | De dónde sale | Oblig. |
|---|---|---|---|---|
| V.1 | Evaluación inicial de riesgo de cada puesto de trabajo | T | Puestos de trabajo (dato nuevo) + `assets` tipo personas | Sí |
| V.2 | Valoración del riesgo | M | Matriz 5×5 de M-DESR (`risk_evaluations`) | Sí |
| V.3 | Medidas y acciones de autoprotección | M + R | `recommendations` y `treatments` | Sí |
| V.4 | Procedimientos de seguridad para trabajos peligrosos | R | Biblioteca de procedimientos | Cond. (según el giro) |
| V.5 | Difusión y socialización | R + E | Texto base + evidencias | Sí |

### VI. Plan de continuidad de operaciones

Es la misma estructura de la plantilla de STR-02.2 (Plan de Continuidad). Se comparte, no se duplica.

| Código | Apartado | Contenido | Oblig. |
|---|---|---|---|
| VI.1 | Fundamento legal | G (desde `normative_references`) | Sí |
| VI.2 | Propósito: metas y tiempos de recuperación | R | Sí |
| VI.3 | Funciones críticas o esenciales, con tiempo tolerable de interrupción y de recuperación | T | Sí |
| VI.4 | Sedes alternas | T | Sí |
| VI.5 | Líneas de sucesión o cadenas de mando | T | Sí |
| VI.6 | Recursos humanos | T + R | Sí |
| VI.7 | Dependencias e interdependencias | T | Sí |
| VI.8 | Requerimientos mínimos | T | Sí |
| VI.9 | Interoperabilidad de las comunicaciones | R | Sí |
| VI.10 | Protección y respaldo de la información | T | Sí |
| VI.11 | Activación del plan | R | Sí |

### VII a IX. Cierre

| Código | Apartado | Contenido | De dónde sale | Oblig. |
|---|---|---|---|---|
| VII | Guía de anexos (índice de anexos, en el mismo orden que el archivo de anexos) | G | `document_annexes` en orden | Sí |
| VIII | Conclusiones y recomendaciones del asesor: acciones preventivas y correctivas, incluido el cumplimiento normativo | M + R | `recommendations` de M-DESR + redacción | Sí |
| IX | Bibliografía | G | `normative_references` usadas en la plantilla | Sí |

## 4. Restricciones de competencia (alertas internas, nunca en textos al cliente)

- **Dictámenes (II.12 y II.13):** los emiten terceros (unidades de verificación, peritos u otros profesionistas con registro). STRATEC no los elabora. La plantilla solo los **anexa** y, si faltan, registra la recomendación de obtenerlos.
- **Carta de corresponsabilidad (I.6) y registro del asesor (I.7):** requieren un asesor con registro vigente ante la CEPCM. El registro de STRATEC **está vigente** (24-nov-2026) y el titular lo anexa a mano. El panel solo recuerda anexarlo.
- **Registro del capacitador (II.14.3):** igual, para quien imparte la capacitación.
- Estas restricciones van en el campo `restrictions` de la versión de plantilla. Se muestran a quien elabora y se reflejan en la cotización, no en el documento.

## 5. Datos personales

El Programa Interno incluye datos personales de terceros: integrantes de la UIPC y sus teléfonos, identificación del representante legal, firmas y fotografías. Por eso:

- se guardan solo dentro del proyecto, con acceso por asignación (como las evidencias);
- las identificaciones y firmas van en el almacenamiento privado, nunca en el repositorio;
- el cliente proporciona esos datos y el **contrato de servicio** ya lo contempla (decisión del titular): no hace falta cambiar el aviso de privacidad.

## 6. Datos nuevos que el expediente todavía no captura

El Programa Interno necesita información que hoy no está en ninguna tabla. En la versión 1 se guarda como contenido estructurado de cada apartado (`project_document_sections.content`). Si después otro servicio la reutiliza, se pasa a una tabla propia.

| Dato | Apartados | ¿Se reutiliza en otro servicio? |
|---|---|---|
| NRPC, turnos y correo de notificaciones | I.2 | No |
| Representante legal y apoderado | I.2.13, I.3 | Sí: cotización y contrato |
| Integrantes de la UIPC y brigadas | II.1–II.3 | **Sí:** capacitación de brigadas (STR-03.1) y simulacros |
| Directorio externo por municipio | II.2.2 | Sí: protocolos y eventos masivos (catálogo común) |
| Inventario de materiales para el cálculo de riesgo de incendio | II.5.1, II.5.3 | Sí: Protección Civil para eventos (STR-02.6) |
| Sustancias químicas peligrosas | II.6 | Sí |
| Calendarios (actividades, mantenimiento, capacitación y simulacros) | II.4, II.10, II.14.1, II.16 | Parcial |
| Puestos de trabajo | V.1 | Sí: NOM-035 (STR-01.5) |

**Cálculo del grado de riesgo de incendio (II.5.1):** con el inventario de materiales y la superficie, el panel puede calcular el grado según el método de la NOM-002-STPS-2010 y mostrar la operación. Lo revisa y confirma quien elabora. Es la pieza más técnica de la plantilla y conviene validarla aparte.

## 7. Variante institucional (segunda guía revisada)

El titular compartió una segunda guía: una “guía de llenado” para la **actualización 2024-2025** del Programa Interno de una unidad académica universitaria. La elaboró la propia institución; **no es un formato de la CEPCM**.

**Conclusión: es la misma estructura base en otro formato, no una modalidad de riesgo distinta.** No menciona modalidad ni nivel de riesgo y conserva los seis bloques de la guía de la CEPCM: datos generales, prevención, auxilio, recuperación, contingencias y continuidad. Al final lleva conclusiones, anexos y bibliografía.

| Diferencia | Guía CEPCM 2025 (riesgo alto) | Guía institucional 2024-2025 |
|---|---|---|
| Documentos legales y administrativos (identificación, poder, aprobado y visto bueno anteriores, carta de corresponsabilidad, registro del asesor) | Sí | No |
| Clasificación de riesgo | Incendio, aforo, actividades altamente riesgosas y conclusión | Solo incendio (NOM-002-STPS-2010) y aforo |
| Dictámenes | 10 tipos más “otros” | Solo estructural, gas L.P. y eléctrico |
| Simulacros | Programa anual | Programa y guion con **mínimo 6 al año**, con hipótesis por fenómeno |
| Procedimientos de emergencia | Discapacidad, sismo, incendio, sustancias, bomba y otros | Los mismos, más **emergencia médica**, **incendio forestal o de pastizal** y **atención de siniestros con la póliza de seguro** |
| Población | Personal administrativo, operativo y flotante | Censo de la comunidad (fijos y externos) y cronograma por ciclo escolar |

**Cómo se usa:** la plantilla piloto se queda con la estructura de la CEPCM, que es la que pide la autoridad. Lo que la guía institucional agrega se incorpora como apartados **opcionales** (Cond.) para clientes institucionales o educativos:

- III.1.6 se divide en emergencia médica, incendio forestal o de pastizal y siniestros con póliza de seguro;
- II.16 permite indicar un número mínimo de simulacros y la hipótesis de cada uno;
- I.2.7 acepta el censo por tipo de población.

No hace falta una plantilla aparte.

## 8. Decisiones del titular (24-nov-2026)

- **Formato de entrega: solo físico.** El Programa Interno se entrega impreso. El panel genera un PDF listo para imprimir, en el orden de la guía, con la guía de anexos para armar la carpeta.
- **Textos base** de brigadas, procedimientos de emergencia, recuperación y difusión: **los redacta y valida el Consultor.** Se comparten con la plantilla de Protocolos (STR-01.4).
- **Datos personales:** los cubre el contrato de servicio (§5).

## 9. Pendientes para cerrar la versión 1

1. ~~Modalidades~~ **Resuelto (24-nov):** solo hay ordinario y alto, con la misma guía y los mismos apartados. Lo que no aplica se marca “No aplica” (§1.1).
2. **Lista de apartados que normalmente no aplican en riesgo ordinario:** el Consultor la valida con casos reales; hasta entonces el panel solo sugiere.
3. **Vigencia de las normas.** Revisar cada NOM citada; por ejemplo, la de instalaciones eléctricas tiene una versión posterior a 2012. La guía 2025 cita algunas versiones anteriores.
4. **Cálculo del riesgo de incendio** (§6): validarlo aparte, con un caso real.
