# Configurar Supabase para el sitio y el dashboard de STRATEC

Proyecto en producción: **`xtfsqdwkbsghkzszpisz`** (el que usa el sitio publicado).
Antes de empezar, confirma en la barra de direcciones del dashboard de Supabase que estás en ese proyecto:
`supabase.com/dashboard/project/xtfsqdwkbsghkzszpisz/...`

Situación al 6 de noviembre de 2026:
- Ese proyecto no tenía las tablas del dashboard (`clients`, `quotes`, `leads`, `profiles`, `documents`…).
- La tabla `user_roles` tenía una política recursiva que impide leer los roles.
- La función `submit-lead` no existía (404). Por eso los formularios del sitio (contacto, diagnóstico y agenda) no guardaban los leads.

## Orden y qué hace cada script
| Script | Qué hace | ¿Modifica datos? |
|---|---|---|
| `00-revisar-estado.sql` | Muestra tablas, tipos, funciones, políticas, columnas de cotizaciones y conteos de roles, incluido lo que 02 cambiaría. | No, solo lectura |
| `00b-respaldo.sql` | Copia roles, reglas de acceso, perfiles y la definición de las políticas al esquema privado `respaldo`. | Solo crea copias; no toca las originales |
| `01-tipos.sql` | Crea los tipos (roles, estados) que falten y agrega valores de rol faltantes. | No |
| `02-tablas-y-permisos.sql` | Crea tablas, funciones y vistas que falten. **Reemplaza todas las políticas** de roles, perfiles, reglas y CRM. **Borra asignaciones de rol repetidas** (queda una de cada una). **Si no hay ningún admin, da admin a todas las cuentas.** Quita la lectura directa de correo y teléfono. | Sí: políticas y roles. No borra leads, clientes ni cotizaciones |
| `03-tarifas.sql` | Crea la tabla de tarifas con sus validaciones y la columna vacía de horas reales en cotizaciones. Solo reemplaza sus 4 políticas propias. | Solo estructura nueva |
| `04-verificar-tarifas.sql` | Prueba permisos y validaciones de tarifas con usuarios simulados. Crea y borra 2 tarifas de prueba. | No deja cambios |
| `05-verificar-contactos.sql` | Prueba que solo quien tiene permiso vea correos y teléfonos. | No, solo lectura |

Orden: **00 → 00b → 01 → 02 → 03 → 04 → 05**, cada uno en una consulta nueva. Antes de 02, revisa en el resultado de 00 las filas "02 cambiaría": si "cuentas que recibirían admin" no es 0, confirma que todas esas cuentas deben ser admin.

## Paso 1 · Tipos (1 minuto)
1. Supabase → **SQL Editor** → **New query**.
2. Pega el contenido de [`01-tipos.sql`](01-tipos.sql) y presiona **Run**.
3. Debe terminar con *Success. No rows returned*.

## Paso 2 · Tablas, permisos y tu rol de administrador (1 minuto)
1. Abre una consulta **nueva** (**New query**). No la ejecutes en la misma consulta del paso 1.
2. Pega el contenido de [`02-tablas-y-permisos.sql`](02-tablas-y-permisos.sql).
3. Presiona **Run**. La última tabla del resultado muestra a los usuarios con su rol.
   En una base sin ningún administrador, todos los usuarios existentes reciben **admin** para poder entrar. Si ya hay un admin, el script no cambia ningún rol. Los usuarios nuevos **no** reciben rol automáticamente.

Puedes ejecutar los dos scripts más de una vez. No borran leads, clientes ni cotizaciones, pero 02 sí reemplaza políticas y limpia roles repetidos (ver la tabla de arriba).

## Paso 2b · Cerrar el registro público (30 segundos)
La llave pública del sitio permite registrarse por API aunque el sitio no tenga formulario. Conviene cerrarlo para que solo tú des de alta las cuentas.
1. Supabase → **Authentication** → **Sign In / Providers**.
2. Desactiva **Allow new users to sign up** y guarda.

### Dar acceso a un colaborador
1. Supabase → **Authentication → Users → Add user → Create new user**. Escribe su correo y una contraseña temporal, y marca **Auto Confirm User**.
2. En el dashboard de STRATEC: **Configuración → Usuarios y permisos → Actualizar**. El usuario nuevo aparece como *Sin acceso*. Elige su rol: Administrador, Analista u Operaciones pueden crear y editar; Solo lectura solo consulta.
3. Sin rol, la cuenta puede iniciar sesión, pero solo ve una pantalla de "Sin rol asignado".

## Paso 2c · Tarifas para el precio sugerido y horas reales (30 segundos)
1. Abre una consulta **nueva** (**New query**).
2. Pega el contenido de [`03-tarifas.sql`](03-tarifas.sql) y presiona **Run**.
3. Debe terminar con *service_rates lista*.
4. En consultas nuevas, ejecuta [`04-verificar-tarifas.sql`](04-verificar-tarifas.sql) y [`05-verificar-contactos.sql`](05-verificar-contactos.sql). Todas las filas deben decir **OK** (o **NO APLICA**). Si alguna dice **REVISAR**, no captures tarifas todavía.
5. Captura tus precios en el dashboard: **Cotizaciones → Tarifas**.

## Paso 3 · Función que recibe los leads del sitio (3 minutos)
1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nombre de la función: `submit-lead` (exactamente así).
3. Borra el código de ejemplo y pega el contenido de [`../functions/submit-lead/index.ts`](../functions/submit-lead/index.ts).
4. Presiona **Deploy function**.
5. En **Details** (o **Settings**) de la función, **desactiva "Verify JWT"** / "Enforce JWT verification" y guarda. Los formularios públicos no envían sesión de usuario; la función tiene su propio límite de envíos por IP.
6. Opcional, para recibir aviso en Telegram de cada lead nuevo: en **Edge Functions → Secrets** agrega `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`. Escríbelos tú directamente en Supabase; no los compartas por chat.

## Paso 4 · Comprobar
- Recarga el dashboard. Ya no debe aparecer el aviso amarillo de rol.
- Registra un cliente de prueba en **Clientes** y luego una cotización.
- Envía el formulario de contacto del sitio con datos de prueba. Debe aparecer en **Leads**.

## Leads anteriores
Los leads que llegaron antes del cambio de proyecto están en el proyecto anterior (`ivscwwcxasamaxzqmjwd`, creado con Lovable). Si tienes acceso a él (por ejemplo desde Lovable → Cloud → Database), exporta la tabla `leads` a CSV e impórtala aquí con **Table Editor → leads → Insert → Import data from CSV**.

## Paso 5 · Niveles de acceso y alta de usuarios desde el dashboard
Requiere que el sitio ya tenga la versión con **Ajustes → Niveles de acceso**.
1. **SQL Editor → New query:** vuelve a ejecutar [`02-tablas-y-permisos.sql`](02-tablas-y-permisos.sql) completo. Crea la tabla `access_rules` con los valores iniciales (Cotizaciones, Documentos y Datos de contacto solo para admin), las reglas por módulo y las vistas `lead_contacts` y `client_contacts`. Si lo vuelves a correr después, **no** borra los cambios que hagas desde el dashboard.
2. **Edge Functions → Deploy a new function → Via Editor:** nómbrala `admin-create-user`, pega el código de [`../functions/admin-create-user/index.ts`](../functions/admin-create-user/index.ts) y presiona **Deploy**. Deja **Verify JWT activado**: solo responde a usuarios con sesión, y además verifica que quien la llama sea admin.
3. Recarga el dashboard. En **Ajustes** verás **Agregar usuario** (crea la cuenta ya confirmada) y la tabla **Niveles de acceso**, donde marcas Ver / Editar por rol y módulo.

Cómo funciona la protección:
- Las reglas de la base de datos consultan `access_rules` en cada lectura y escritura, así que ocultar un módulo no es solo visual.
- Nadie puede leer el correo ni el teléfono de leads y clientes directamente de las tablas, ni siquiera un admin. Se leen por las vistas, que solo devuelven datos a quien tenga el permiso **Datos de contacto**.
- Eliminar registros es exclusivo del admin.
