# M-DESR · Documento 03 · Expediente del proyecto y motor de plantillas por servicio

| Ficha | |
|---|---|
| Marco metodológico | M-DESR, Metodología de Diagnóstico Estratégico de Seguridad y Riesgos |
| Versión | 0.1, propuesta funcional y técnica (texto base del titular, ajustado al esquema real) |
| Fecha | 24 de noviembre de 2026 |
| Parte de | [Documento 02: modelo lógico](02-modelo-logico.md). La [revisión cruzada de los scripts 02 y 09](03-revision-cruzada-02-09.md) es un anexo técnico del 02, no forma parte de este documento |
| Estado | Sin código ni SQL. Falta elegir el formato de referencia de la plantilla piloto (sección 12) |

> **Criterio rector:** el expediente organiza el trabajo, M-DESR estructura el análisis y las plantillas establecen cómo se construye cada entregable. El personal autorizado conserva la responsabilidad técnica de su contenido y de su aprobación.

---

## 1. Objetivo

Integrar en un solo espacio de trabajo la información comercial, técnica, metodológica y documental de cada proyecto de STRATEC.

El expediente del proyecto será el núcleo de operación de la plataforma. Ahí se harán diagnósticos, análisis y valoración de riesgos, tratamientos y documentos técnicos, y se gestionará su revisión, aprobación y emisión, sin capturar la misma información dos veces.

M-DESR es el marco metodológico transversal. Cada servicio del catálogo tendrá además su propia plantilla.

## 2. Precisiones del titular

1. **El expediente es el espacio central de trabajo**, pero no una sola pantalla. Tiene navegación interna por apartados y conserva siempre el contexto del proyecto.
2. **M-DESR es la metodología transversal, no una plantilla universal.** Cada servicio tiene su propia estructura, criterios técnicos, fuentes y reglas de integración.
3. **Un documento aprobado no cambia en esa versión.** Si cambia el diagnóstico, la plantilla o un dato sustantivo, se genera una versión nueva y sigue el flujo de aprobación.

## 3. Principios de diseño

1. **Centralidad del proyecto:** toda la información técnica y documental se vincula al proyecto.
2. **Captura única:** lo registrado una vez se reutiliza en los apartados y documentos que lo necesiten.
3. **Metodología transversal:** M-DESR aporta la lógica común de análisis, trazabilidad y gestión de riesgos.
4. **Método propio por servicio:** cada servicio tiene su plantilla y sus criterios técnicos.
5. **Trazabilidad:** cada dato, hallazgo, valoración, recomendación y documento conserva su origen, autoría y versión.
6. **Validación profesional:** la plataforma facilita el trabajo, pero no sustituye el criterio técnico del personal autorizado.
7. **Control de versiones:** los cambios posteriores a la aprobación no alteran los documentos ya emitidos.
8. **Seguridad por proyecto:** el acceso depende de la asignación, el rol y las facultades.

## 4. Expediente integral del proyecto

### 4.1 Acceso y estructura

Desde **Proyectos** se elige un proyecto y se abre su expediente. El expediente conserva la relación con el cliente, el servicio contratado, la cotización y el equipo asignado.

| Zona | Contenido |
|---|---|
| Encabezado | Proyecto, cliente, servicio, responsable, estado general y fechas |
| Navegación lateral | Apartados del expediente y avance de cada uno |
| Área de trabajo | El apartado elegido |

Ruta propuesta: `/app/proyectos/:id/:apartado`. Así cada apartado tiene su propia dirección y se puede compartir un enlace directo. Los cinco módulos “En preparación” del menú actual pasan a ser apartados del expediente.

### 4.2 Apartados

| Apartado | Función | Tablas (Documento 02) |
|---|---|---|
| Ficha | Cliente, alcance, servicio, cotización, responsables y fechas | `projects`, `project_members`, `client_assignments`, `quotes` |
| Inmuebles y plano | Ubicaciones, áreas, perímetros, características y elementos del mapa | `study_objects`, `sites`, `areas`, `assets`, `site_plans`, `plan_features` |
| Diagnóstico | Instrumentos, respuestas, observaciones, hallazgos, evidencias y PESTEL | `assessments`, `responses`, `findings`, `pestel_factors`, `evidence` |
| Riesgos | Activos, amenazas, vulnerabilidades, escenarios, análisis y valoración | `threats`, `vulnerabilities`, `risk_scenarios`, `risk_evaluations`, `controls` |
| Tratamiento | Recomendaciones, medidas, responsables, prioridades y plazos | `treatments`, `recommendations`, `action_items` |
| Documentos | Documentos del proyecto armados con plantillas | `documents` + tablas nuevas (sección 6) |
| Revisión y aprobación | Elaboración, revisión, observaciones, aprobación y versiones | `approval_records`, `review_comments` |
| Bitácora | Visitas, reuniones, acuerdos, decisiones y eventos | `project_log_entries`, `audit_log` |

Los apartados se habilitan según el servicio contratado y la configuración del proyecto. Un Programa Interno, por ejemplo, no necesita PESTEL. Cada plantilla dice qué apartados del expediente usa (sección 5.2).

### 4.3 Estados de avance

Cada apartado está en uno de estos estados: pendiente, en elaboración, en revisión, con observaciones, aprobado o validado (según corresponda), listo y **no aplica**. “No aplica” exige un motivo, se muestra con “---” en el índice y no bloquea el envío a revisión, aunque el apartado sea obligatorio.

El avance general es informativo. No se calcula solo como porcentaje de apartados terminados: también cuenta los requisitos obligatorios del servicio y las condiciones para emitir entregables.

## 5. Motor de plantillas por servicio

### 5.1 Concepto

La plantilla dice **cómo se construye** un documento; el expediente aporta **la información**. Cada plantilla tiene apartados ordenados, reglas de obligatoriedad, fuentes de información, criterios técnicos y referencias normativas.

### 5.2 Componentes de una plantilla

- Servicio (código del catálogo, por ejemplo `STR-02.1`) y tipo de documento.
- Versión, vigencia y estado.
- Apartados en orden, con su descripción y propósito.
- Tipo de contenido esperado y fuente de información de cada apartado.
- Referencias normativas o técnicas.
- Obligatoriedad y reglas de validación.
- Requisitos para enviar a revisión y para emitir.
- Apartados del expediente que usa (sección 4.2).
- **Restricciones de competencia** (sección 9): qué no puede afirmar el documento o qué firma externa requiere.

### 5.3 Tipos de contenido de un apartado

| Tipo | Origen |
|---|---|
| Redacción | Texto que escribe el responsable |
| Dato del expediente | Información ya registrada en el proyecto (cliente, inmueble, fechas, equipo) |
| Hallazgos | Registros del diagnóstico |
| Riesgos | Escenarios y valoraciones |
| Recomendaciones | Medidas y tratamientos |
| Tabla | Datos estructurados del expediente |
| Plano o mapa | Versión del plano del inmueble, con su advertencia de medidas aproximadas |
| Evidencia | Fotografías, archivos y documentos asociados |
| Anexo | Archivo complementario |
| Combinado | Dos o más de los anteriores |

Un apartado puede combinar contenido automático con texto editable. Cada parte conserva su procedencia: si vino del expediente o si se escribió a mano.

### 5.4 Referencias normativas

Cada apartado puede tener una o varias referencias a la tabla `normative_references` del Documento 02. Cada una lleva:

- el instrumento normativo o técnico;
- el artículo, numeral, cláusula o apartado;
- la versión o fecha de referencia;
- la jurisdicción, si aplica.

**La plataforma guarda la referencia y no reproduce el texto de la norma.** Revisar la vigencia de las normas es parte del mantenimiento de las plantillas.

### 5.5 Versiones

Una plantilla publicada no se modifica. Cuando se actualiza:

1. se crea una versión nueva;
2. la anterior se conserva;
3. los documentos nuevos usan la versión vigente;
4. los documentos en elaboración conservan la versión con la que empezaron, salvo una migración autorizada expresamente;
5. los documentos aprobados conservan su estructura y su contenido.

Es el mismo mecanismo que ya tienen los instrumentos y las escalas en el Documento 02 (`instrument_versions`, `risk_scale_versions`).

## 6. Modelo de información, ajustado al esquema real

Revisé el esquema que ya está en producción: migraciones, scripts 02, 03 y 08 a 11, y el Documento 02.

### 6.1 Lo que se reusa

| Necesidad | Ya existe |
|---|---|
| Proyecto, cliente, equipo y asignaciones | `projects`, `clients`, `project_members`, `client_assignments` |
| Documento del proyecto, con versión y aprobación | `documents` con `project_id`, `assessment_id`, `revision_no`, `approval_status`, `snapshot` y `content_hash`. Ya pasa por `mdesr_document_transition` |
| Historial de aprobación y bitácora | `approval_records`, `review_comments`, `audit_log`, `project_log_entries` |
| Catálogo de normas | `normative_references` |
| Versión de la metodología | `methodology_versions` |
| Evidencias, planos y anexos | `evidence`, `site_plans`, `document_annexes` |
| Servicios | **No hay tabla:** el catálogo vive en el código (`src/data/servicesData.ts` y `src/lib/quoteCatalog.ts`) con códigos `STR-xx`. Las plantillas guardan ese código como texto, igual que `recommendations.service_code` y `service_rates.code` |

### 6.2 Tablas nuevas

**`document_templates`**: identidad de cada plantilla.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| `id` | `uuid` | Sí | |
| `code` | `text` único | Sí | Por ejemplo `PIPC` o `ANALISIS-RIESGO` |
| `service_code` | `text` | Sí | Código del catálogo (`STR-02.1`). Mismo formato que `service_rates.code` |
| `name` | `text` | Sí | |
| `document_type` | `text` | Sí | Tipo de entregable (catálogo; incluye los 5 de M-DESR) |
| `description` | `text` | No | |
| `legacy_template_id` | `text` | No | Id de la plantilla actual en `documentTemplates.ts`, si viene de ahí |
| `active` | `boolean` | Sí | |

**`document_template_versions`**: versiones, que no se tocan una vez publicadas.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| `template_id` | `uuid` FK | Sí | |
| `methodology_version_id` | `uuid` FK | No | Versión de M-DESR en la que se apoya, si aplica |
| `version_label` | `text` | Sí | Única por plantilla |
| `status` | `text` | Sí | `borrador`, `publicada` o `retirada` |
| `effective_from`, `effective_to` | `date` | No | Vigencia |
| `created_by`, `published_by`, `published_at` | | | |
| `change_summary` | `text` | No | |
| `uses_sections` | `text[]` | Sí | Apartados del expediente que usa (`diagnostico`, `riesgos`…) |
| `restrictions` | `text` | No | Restricciones de competencia (sección 9) |
| `content_hash` | `text` | No | Huella al publicar |

**`document_template_sections`**: estructura de cada versión, jerárquica.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| `template_version_id` | `uuid` FK | Sí | |
| `parent_section_id` | `uuid` FK | No | Sub-apartado |
| `section_code` | `text` | Sí | Único por versión, por ejemplo `3.2` |
| `title` | `text` | Sí | |
| `description` | `text` | No | Qué debe contener; guía para quien elabora |
| `sort_order` | `integer` | Sí | |
| `content_type` | `text` | Sí | Uno de los tipos de 5.3 |
| `source_configuration` | `jsonb` | No | Qué datos trae del expediente y con qué filtro. Por ejemplo, hallazgos de severidad alta o crítica |
| `default_text` | `text` | No | Texto base editable |
| `is_required` | `boolean` | Sí | Obligatorio para enviar a revisión |
| `validation_rules` | `jsonb` | No | Por ejemplo, mínimo de evidencias o tabla no vacía |

**`document_template_section_references`** (N:M, en lugar de guardar las referencias como texto): `section_id`, `normative_reference_id` y `clause` (artículo, numeral o cláusula).

**`project_document_sections`**: contenido de cada apartado dentro de un documento del proyecto.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| `document_id` | `uuid` FK `documents` | Sí | |
| `template_section_id` | `uuid` FK | Sí | De la versión de plantilla del documento |
| `content` | `text` o `jsonb` | No | Texto redactado o contenido estructurado |
| `source_references` | `jsonb` | No | Registros del expediente usados, con su id y su versión |
| `status` | `text` | Sí | Estados de 4.3, incluido `no_aplica` |
| `not_applicable_reason` | `text` | Condicional | Obligatorio si el estado es `no_aplica` |
| `author_id` | `uuid` | Sí | |
| `document_revision_no` | `integer` | Sí | Versión del documento a la que pertenece |
| `created_at`, `updated_at` | | | |

**En `documents` se agrega** `template_version_id` (opcional). Los documentos actuales conservan su `template` y su `data` y siguen igual.

### 6.3 Reglas que se heredan del Documento 02

- Candado: un documento aprobado no cambia. Un cambio sustantivo después de aprobar genera una versión nueva y anula la aprobación (R-12).
- Las secciones del documento solo se editan con el documento en `borrador`.
- Las versiones de plantilla publicadas no se editan (igual que R-08).
- Acceso por asignación al proyecto. El Administrador ve todo.

El SQL de estas tablas será un script nuevo (12 o el siguiente libre), aditivo, que se prueba primero en el proyecto de Supabase de prueba.

## 7. Construcción de un documento

En **Documentos** del expediente, el usuario elige el tipo de entregable disponible para el proyecto. El sistema:

1. identifica el servicio contratado (de la cotización o de la ficha);
2. muestra las plantillas publicadas para ese servicio;
3. inicia el documento con la versión vigente;
4. crea sus apartados en orden;
5. trae la información del expediente donde corresponde;
6. deja redactar, editar y completar cada apartado;
7. verifica los requisitos obligatorios;
8. permite enviar a revisión cuando se cumplen.

La integración automática no impide la edición profesional. Cada apartado muestra si su contenido vino del expediente o se escribió a mano.

**Al aprobar,** el documento guarda su `snapshot`: el contenido final de cada apartado y los datos del expediente tal como estaban. El PDF se genera de esa copia. Así, cambiar después un hallazgo no altera un documento ya emitido.

## 8. Revisión y aprobación

Se usa el flujo ya definido en el Documento 02 (sección 5) y aplicado en el script 10.

| | Vía A: Consultor | Vía B: Administrador |
|---|---|---|
| Quién aprueba | Consultor asignado como validador, dentro de sus proyectos | Administrador, por su rol, en cualquier proyecto |
| Segundo Analista (revisor) | Lo pide el Consultor cuando lo considera necesario | Opcional |
| Registro | “Validado y aprobado por el Consultor” | “Aprobado por el Administrador”, nunca como validación del Consultor |
| Emisión | Autorizada tras la aprobación | Autorizada tras la aprobación |

Reglas que siguen vigentes:

- nadie aprueba lo que elaboró o modificó, incluido el Administrador;
- quien revisó no aprueba esa versión;
- **rechazar es solo del Administrador**; el Consultor puede devolver para corrección;
- a un Analista nunca se le puede dar validar ni aprobar;
- cada acto queda en el historial con su autoridad.

## 9. Catálogo de servicios y métodos específicos

| Código | Servicio | Método o estructura | Plantilla actual en el panel |
|---|---|---|---|
| STR-01.1 | Estudio y Análisis de Riesgo | M-DESR | `analisis-riesgo` |
| STR-01.2 | Auditoría de Seguridad Institucional | Criterios de auditoría y evidencias | `auditoria-seguridad` |
| STR-01.3 | Dictamen de Seguridad | Estructura del tipo de dictamen y competencia profesional | `dictamen-seguridad` |
| STR-01.4 | Protocolos de Seguridad y Prevención de Extorsión | Escenarios, responsabilidades y procedimientos | `protocolo-seguridad` |
| STR-01.5 | NOM-035 | Instrumentos y procedimientos de la norma | `informe-nom-035` |
| STR-01 | Consultoría en Seguridad (diagnóstico) | M-DESR | `diagnostico-seguridad` |
| STR-02.1 | Programa Interno de Protección Civil | Estructura y requisitos oficiales aplicables en Morelos | Nueva, **piloto**: [`plantillas/pipc-morelos-v1.md`](plantillas/pipc-morelos-v1.md) |
| STR-02.2 | Plan de Continuidad de Operaciones | Análisis de impacto, estrategias, recuperación y pruebas | `plan-continuidad` |
| STR-02.3 | Revisión de Programa Interno | Verificación de requisitos | `revision-programa-interno` |
| STR-02.5 | Actualización de Programa Interno | Igual que STR-02.1, sobre una versión anterior | — |
| STR-02.6 | Protección Civil para Eventos Masivos (servicio adicional) | Programa Específico de Protección Civil del evento | Nueva: [`plantillas/pepc-morelos-evento-masivo-v1.md`](plantillas/pepc-morelos-evento-masivo-v1.md) |
| STR-03 / 03.1 | Capacitación y brigadas | Objetivos, contenidos, evaluación y evidencias | — |
| STR-04 / 04.1 / 04.2 | Integración tecnológica, CCTV, GPS | Especificación técnica y propuesta por niveles | — |
| STR-99 | Servicio personalizado | Informe técnico genérico | `informe-tecnico` |

**Restricciones de competencia.** Que un servicio esté en el catálogo no habilita a STRATEC para emitir cualquier dictamen, certificación o documento reservado a una autoridad o a un profesional con registro. La plantilla guarda esas restricciones (`restrictions`) y el panel las muestra a quien elabora. **No van en los textos para el cliente:** van en la cotización o como alerta interna.

**Migración de las 9 plantillas actuales.** Se cargan como versión `0` (“heredada”) de su plantilla, con los mismos apartados. Los documentos ya hechos se quedan como están (`approval_status = 'sin_flujo'`). Cada plantilla se rehace en su versión 1 cuando se defina su método.

## 10. Orden de implementación

| Etapa | Contenido |
|---|---|
| 1. Expediente del proyecto | Navegación interna, apartados y sus estados, y relación con las tablas que ya existen. Los cinco módulos “En preparación” se integran aquí |
| 2. Motor de plantillas | Tablas de la sección 6, apartados y fuentes, obligatoriedad y versiones. Pantalla para administrar plantillas (facultad `mdesr.manage_instruments`) |
| 3. Integración documental | Apartados ligados al expediente: hallazgos, riesgos, recomendaciones, tablas, plano y evidencias. Captura y edición |
| 4. Revisión y aprobación | Flujo existente, facultades, registro de eventos y versiones, y control de emisión. Copia al aprobar y PDF desde esa copia |
| 5. Plantilla piloto | Plantilla del servicio elegido, validación de su estructura, prueba con el diagnóstico y PDF final |

Cada etapa se trabaja en una rama propia y se publica con tu visto bueno. Las tablas nuevas, como siempre, se prueban primero en el proyecto de Supabase de prueba.

## 11. Pruebas de aceptación

1. Se entra al expediente de un proyecto y se navegan sus apartados sin perder el contexto.
2. La información del diagnóstico se reutiliza en los documentos sin capturarla dos veces.
3. Cada documento conserva la versión de plantilla con la que se creó.
4. Los apartados obligatorios impiden enviar a revisión si están incompletos.
5. Los documentos conservan sus fuentes y evidencias.
6. Cada usuario accede solo a los proyectos y funciones que le corresponden.
7. La aprobación del Administrador y la del Consultor se distinguen en el historial.
8. Nadie aprueba un documento que elaboró, ni el Consultor ni el Administrador.
9. Un cambio sustantivo después de aprobar genera una versión nueva.
10. Un documento emitido se consulta igual aunque después se actualice la plantilla.

## 12. Decisiones y pendientes

**Decidido:**

- el proyecto es el centro del expediente;
- los documentos se elaboran dentro del expediente;
- M-DESR es la base transversal;
- cada servicio tiene su plantilla y su método;
- los apartados pueden traer información de otras secciones;
- se conservan versiones de plantillas y documentos;
- se usa el flujo de aprobación de M-DESR.

**Pendiente:**

| Id | Pendiente | Propuesta |
|---|---|---|
| P-01 | **Formato de referencia de la plantilla piloto.** El *Documento Maestro Integrado v3* (mayo de 2026) **no sirve**: es un plan de negocio (estructura de marcas, catálogo con precios y márgenes, inversión, fases y metas), no un formato de documento técnico. El otro archivo de la misma carpeta, *Template Propuesta*, es una propuesta comercial: sirve de referencia para Cotizaciones, no para entregables | Para el Programa Interno, partir de los requisitos oficiales vigentes en Morelos y de los formatos o términos de referencia de la autoridad estatal. Si STRATEC ya tiene un Programa Interno bien hecho, se usa como modelo (sin datos del cliente) |
| P-02 | Estructura vigente de cada documento por servicio | Una plantilla por vez, empezando por el piloto |
| P-03 | Verificar los términos de referencia y requisitos oficiales del Programa Interno en Morelos | Investigarlos en fuentes oficiales y que el titular confirme la versión vigente |
| P-04 | Servicio piloto | **Confirmado: Programa Interno de Protección Civil (STR-02.1).** Modelo de plantilla en [`plantillas/pipc-morelos-v1.md`](plantillas/pipc-morelos-v1.md), tomado del formato 2025 de la CEPCM (riesgo alto): usa casi todo el expediente (inmueble, plano, diagnóstico, evidencias, riesgos, medidas, responsables y anexos) y prueba que el motor no solo sirve para diagnósticos |
| P-05 | Migración de los documentos actuales | Plantillas heredadas como versión 0; documentos actuales sin cambios (sección 9) |
| P-06 | Integrar la prevención del delito mediante el diseño ambiental (ISO 22341) como sección del instrumento maestro | Pendiente de autorización del titular (aparte de este documento) |
