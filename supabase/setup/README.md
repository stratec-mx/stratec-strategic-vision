# Configurar Supabase para el sitio y el dashboard de STRATEC

Proyecto en producción: **`xtfsqdwkbsghkzszpisz`** (el que usa el sitio publicado).
Antes de empezar, confirma en la barra de direcciones del dashboard de Supabase que estás en ese proyecto:
`supabase.com/dashboard/project/xtfsqdwkbsghkzszpisz/...`

Situación al 6 de noviembre de 2026:
- Ese proyecto no tenía las tablas del dashboard (`clients`, `quotes`, `leads`, `profiles`, `documents`…).
- La tabla `user_roles` tenía una política recursiva que impide leer los roles.
- La función `submit-lead` no existía (404). Por eso los formularios del sitio (contacto, diagnóstico y agenda) no guardaban los leads.

## Paso 1 · Tipos (1 minuto)
1. Supabase → **SQL Editor** → **New query**.
2. Pega el contenido de [`01-tipos.sql`](01-tipos.sql) y presiona **Run**.
3. Debe terminar con *Success. No rows returned*.

## Paso 2 · Tablas, permisos y tu rol de administrador (1 minuto)
1. Abre una consulta **nueva** (**New query**). No la ejecutes en la misma consulta del paso 1.
2. Pega el contenido de [`02-tablas-y-permisos.sql`](02-tablas-y-permisos.sql).
3. Presiona **Run**. La última tabla del resultado debe mostrar a cada usuario registrado con el rol `admin`.
   Todos los usuarios actuales y los que crees después reciben **admin** automáticamente.

Puedes ejecutar los dos scripts más de una vez sin problema: no borran datos.

## Paso 2b · Cerrar el registro público (obligatorio, 30 segundos)
Como cada usuario nuevo recibe **admin**, nadie debe poder crearse una cuenta por su cuenta. La llave pública del sitio permite registrarse por API aunque el sitio no tenga formulario.
1. Supabase → **Authentication** → **Sign In / Providers**.
2. Desactiva **Allow new users to sign up** y guarda.
3. Para dar acceso a alguien: **Authentication → Users → Add user** (o **Invite user**). Recibirá admin automáticamente.

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
