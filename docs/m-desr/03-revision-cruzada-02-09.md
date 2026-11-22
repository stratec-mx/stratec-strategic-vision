# M-DESR · Revisión cruzada de los scripts 02 y 09 contra el Documento 02

| Ficha | |
|---|---|
| Fecha | 22 de noviembre de 2026 |
| Revisado | `supabase/setup/02-tablas-y-permisos.sql` y `supabase/setup/propuestas/09-consultor-y-facultades.sql` (en `main`, commit `efc4546`), contra [`02-modelo-logico.md`](02-modelo-logico.md) v0.2 y el borrador [`10-m-desr-modelo.sql`](../../supabase/setup/propuestas/10-m-desr-modelo.sql) |
| Método | Lectura de código. **Ningún script se ejecutó en ninguna base.** Las pruebas del panel (vitest y build) no prueban la base de datos |
| Actualización | 22-nov-2026: incorpora el criterio final del Administrador (no recibe facultades técnicas por su rol) |
| Dictamen | **No ejecutar todavía en producción.** Primero hay que resolver H-01 a H-05 y correr las pruebas de la sección 4 en Supabase de pruebas |

## 1. Respuesta a los cuatro puntos del revisor

### A. Separación entre Administrador y Consultor (criterio final del 22-nov)

- **Criterio:**
  - el Administrador concede, modifica y revoca facultades de cualquiera, incluidas las suyas;
  - no recibe facultades técnicas por su rol;
  - si se da facultades de elaboración, elabora;
  - nunca valida, aprueba ni cierra como Consultor;
  - el CRM no cambia.
- **Script 09 hoy:** `has_capability()` devuelve verdadero para el admin en todo. **Contradice el punto 2 del criterio.** Lo está ajustando la sesión del rol Consultor, junto con el panel (`capabilitiesFromRoles` da todas las facultades al admin).
- **Borrador 10:** ya no depende de ese ajuste:
  - `mdesr_has_faculty()` ignora el rol admin;
  - validar, aprobar, rechazar y cerrar exigen el rol `consultant`, y no ser el autor ni el revisor de la versión, siempre;
  - si el Administrador usa una facultad que se dio a sí mismo, el acto queda como `facultad_autoconcedida`;
  - las facultades quedan en `user_capabilities_log`; los equipos, en `audit_log`; los actos, en `approval_records`.

### B. Alcance del Ejecutivo

- Los scripts 02 y 09 dan al Ejecutivo **lectura de todos los documentos** (`documents: can_read = true`) y de los datos de contacto. Hoy `documents` no está ligada a proyectos. Los 9 tipos de documento actuales guardan hallazgos, riesgos, dictámenes y la descripción del inmueble de **todos** los clientes. La frase “ve todo” es literal en la base.
- **Borrador 10:** los entregables, evidencias, planos y coordenadas de M-DESR quedan con políticas **restrictivas** por proyecto. El Ejecutivo solo los ve si está asignado, por ejemplo como `observador`. Ese tema queda resuelto para lo nuevo.
- **Pendiente (H-02, D-19):** los documentos actuales que no tienen proyecto.

### C. Facultades por persona: qué impide de verdad la base

| Debe impedir | Script 09 solo | Con el borrador 10 |
|---|---|---|
| Que un Analista apruebe sin facultad expresa | No hay nada que aprobar todavía: ninguna tabla usa `has_capability()` | `mdesr_authority()` exige `mdesr.approve` (en un analista, solo por `user_capabilities`) **y** la función `consultor_validador` en ese proyecto |
| Que alguien apruebe su propio diagnóstico | No aplica | `mdesr_is_author()`: quien envió la versión o cambió contenido desde que empezó, según `audit_log`. Aplica también al Administrador |
| Que un Consultor vea expedientes no asignados | **No lo impide:** 09 le da `clients` (lectura) y `documents` (lectura y edición) de todos (H-01) | El contenido de M-DESR solo lo ven los miembros y el Administrador. Los documentos actuales siguen dependiendo de 09 |
| Que alguien conserve facultades que se le retiraron | Sí para las dadas a la persona: se borra la fila y queda en la bitácora. `has_capability()` lee la tabla en cada consulta. **No** para las que trae su rol (H-06) | Igual. El panel actualiza sus botones al recargar; la base no espera |
| Que cambie un diagnóstico aprobado sin versión nueva ni nueva validación | No aplica | Fuera de `borrador` no se edita (trigger y RLS). Reabrir sube la versión, registra `invalidar` y vacía `validation_basis` y `approval_basis`. Un entregable aprobado cuyo contenido cambia vuelve a borrador solo |

### D. Compatibilidad de los scripts 02 y 09

1. **Instrucciones contradictorias.** Los valores del Ejecutivo son iguales en 02 y en 09. No se contradicen. Sí hay una diferencia de comportamiento: 02 inserta con `on conflict do nothing` y 09 con `do update`, así que 09 **pisa** lo que se haya ajustado en el panel cada vez que se corre (H-03).
2. **Pérdida de permisos actuales.** 09 no borra permisos. 02, en cambio, reemplaza **todas** las políticas del CRM al correrse, ya documentado. Las de M-DESR sobre `documents` deben volver a pegarse después (sección 13 del Documento 02).
3. **Ampliación accidental de acceso.** Sí la hay. Cualquier cuenta que hoy tenga el rol `executive` pasa de solo lectura a editar prospectos, clientes, contactos, cotizaciones y analítica. Hay que revisarlo antes con la consulta de H-03.
4. **Compatibilidad con los datos actuales.** 09 es aditivo y funciona con o sin 02. Pero si 09 corre **antes** que 02, el Consultor se queda sin filas en `access_rules` (H-04).
5. **Reversión.** 09 la documenta y es viable: borra tablas y funciones, y el valor del enum queda sin uso. El borrador 10 trae la suya. Revertir 09 **después** de 10 rompería 10, porque 10 usa `has_capability()`: el orden de reversión debe ser 10 → 09.

## 2. Hallazgos

| Id | Gravedad | Dónde | Hallazgo | Propuesta |
|---|---|---|---|---|
| H-01 | **Alta** | 09, paso 2.5 | El Consultor recibe `clients` en lectura y `documents` en lectura y **edición** sobre toda la tabla. Contradice “solo ve los proyectos que tiene asignados” | `consultant`: `clients` y `documents` en falso. Sus entregables los ve por asignación (políticas del borrador 10) y el nombre del cliente por `mdesr_project_overview`. Si el titular quiere que vea los documentos actuales, que sea solo en lectura |
| H-02 | **Alta** | 02 y 09, Ejecutivo | El Ejecutivo lee **todos** los documentos actuales (hallazgos, riesgos y dictámenes de todos los clientes) y todos los datos de contacto | Decidir D-19. Opciones: (a) `documents` en falso para el Ejecutivo y acceso por asignación cuando los documentos tengan proyecto; (b) mantenerlo y dejarlo escrito como decisión consciente |
| H-03 | Media | 09, `do update` del Ejecutivo | Cada ejecución de 09 vuelve a fijar los permisos del Ejecutivo y borra los ajustes del panel. Además, amplía en el acto el acceso de quien ya tenga ese rol | Cambiar a `do nothing` tras la primera ejecución, o avisarlo en el encabezado. Antes de correrlo: `select u.email from public.user_roles r join auth.users u on u.id = r.user_id where r.role = 'executive';` |
| H-04 | Media | Orden 02 → 09 | Si 09 se corre antes que 02, salta el paso 2.5 y el Consultor queda sin reglas de módulo. Correr 02 después no las agrega | Fijar el orden 02 → 03 → 08 → 09 en `supabase/setup/README.md`, o que 02 incluya también las filas del Consultor |
| H-05 | Media | 09, `user_capabilities.note` | Dar `mdesr.approve` o `mdesr.validate` a un analista no exige justificación. El requisito pide “autorización expresa” | `check` o trigger: si la facultad es `mdesr.approve` o `mdesr.validate` y la persona no es `consultant`, la nota es obligatoria (mínimo 20 caracteres) |
| H-06 | Media | 09, modelo de facultades | No se puede quitar a una sola persona una facultad que trae su rol. Por ejemplo, impedir que un Consultor apruebe sin cambiarle el rol | Si el titular lo necesita (D-20): columna `effect` (`grant` o `deny`) en `user_capabilities`, donde `deny` gana en `has_capability()` |
| H-11 | **Alta** | 09, `has_capability()` y `src/lib/capabilities.ts` | Ambos dan todas las facultades al admin, contra el criterio final | Quitar el atajo de admin en las dos. El borrador 10 ya no lo usa. Lo atiende la sesión del rol Consultor |
| H-07 | Baja | 09, `has_capability(_user, …)` | Cualquier usuario con sesión puede consultar las facultades de **otra** persona pasando su id | Limitar `_user` a `auth.uid()` salvo para el Administrador, o dar `execute` solo dentro de funciones `security definer` |
| H-08 | Baja | 02, comentario de la línea 110 | Dice que convertir `executive` en `operations` “daría permiso de edición a quien se asignó como solo lectura”. El Ejecutivo ya no es de solo lectura | Actualizar el comentario |
| H-09 | Baja | 09 y `src/lib/capabilities.ts` | Las facultades por rol están escritas dos veces: en SQL y en TypeScript | Una prueba que compare ambas listas, o leer `role_capabilities()` desde el panel |
| H-10 | Info | 09 | El Consultor no trae `mdesr.prepare`. Es coherente con el flujo (el Analista elabora y el Consultor aprueba) y evita que el único Consultor se bloquee a sí mismo | Ninguna |

## 3. Cambios hechos en el Documento 02 por esta revisión

- Adopta el diseño del script 09 (`user_capabilities`, `has_capability()`) y retira `role_faculties` y `user_faculties`.
- Criterio final del Administrador: administra facultades, sin facultades técnicas por su rol. Validar, aprobar y cerrar exigen el rol Consultor y no ser autor ni revisor (5.6, R-04b).
- El Ejecutivo queda en M-DESR solo por asignación.
- El borrador SQL pasa a llamarse `10-m-desr-modelo.sql`, requiere 02, 08 y 09, y ya no toca `app_role` ni `access_rules`.
- Decisiones nuevas: D-18, D-19 y D-20. D-03 queda decidida.

## 4. Pruebas funcionales para Supabase de pruebas

Se hacen con cuentas ficticias y simulando a cada usuario en el SQL Editor (`set local role authenticated` y `set local request.jwt.claims`), como los scripts 04 y 05. Cada fila debe dar el resultado esperado.

Cuentas: **Admin**, **Consultor 1**, **Consultor 2**, **Analista A**, **Analista B**, **Analista C** (con `mdesr.approve` expresa), **Ejecutivo** y **Operaciones**. Proyecto P1: A elaborador, B revisor, Consultor 1 validador y Ejecutivo observador. Proyecto P2: solo Consultor 2.

| # | Quién | Intenta | Esperado |
|---|---|---|---|
| 1 | Analista B | Aprobar en P1 | Error: no tiene la facultad o la función |
| 2 | Analista A | Revisar su propia versión enviada | Error: es autor |
| 3 | Consultor 1 | Ver diagnósticos, evidencias o el plano de P2 | 0 filas |
| 4 | Consultor 1 | Leer `clients` y `documents` de clientes ajenos | 0 filas (tras corregir H-01) |
| 5 | Ejecutivo | Ver evidencias y plano de P1 | Las ve (está asignado) |
| 6 | Ejecutivo | Ver evidencias de P2 | 0 filas |
| 7 | Ejecutivo | Modificar un diagnóstico o un entregable de P1 | Error |
| 8 | Admin | Quitar a C `mdesr.approve` y C intenta aprobar | Error, sin recargar nada |
| 9 | Analista A | Editar un hallazgo con el diagnóstico `aprobado` | Error: hay que reabrir |
| 10 | Consultor 1 | Reabrir, cambiar un hallazgo y aprobar sin nueva revisión | Error: la versión nueva está en `borrador` y exige el flujo completo |
| 11 | Admin | Aprobar P1, asignado o no, aun dándose `mdesr.approve` | Error: requiere el rol Consultor |
| 12 | Admin | Darse `mdesr.prepare`, asignarse como elaborador y editar un hallazgo en borrador | Pasa. Queda como autor, el acto queda como `facultad_autoconcedida` y la concesión aparece en `user_capabilities_log` |
| 12b | Consultor 1 | Validar una versión que él revisó, con `requires_independence = false` | Error: nunca puede validar lo que revisó |
| 13 | Consultor 1 | Validar una versión que él mismo revisó (`requires_independence`) | Error |
| 14 | Cualquiera | `update` o `delete` en `approval_records`, `audit_log` o `risk_evaluations` | Error |
| 15 | Operaciones | Leer `user_capabilities` de otra persona | 0 filas |
| 16 | Cualquiera | Editar algo de un diagnóstico `cerrado`, incluso como Admin | Error |

El resultado de estas pruebas, con la salida real, es lo que debe acompañar la solicitud de autorización para producción. A eso se suman el respaldo (`00b-respaldo.sql`) y el procedimiento de reversión en orden 10 → 09.
