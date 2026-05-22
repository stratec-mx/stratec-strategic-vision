# Portal institucional privado — eliminación de registro público

Convertir `/app` en un sistema cerrado: solo usuarios creados manualmente desde Lovable Cloud pueden entrar. Sin registro, sin auto-confirmación, con control de roles real.

> **Nota importante sobre `/schedule`:** ese formulario público de captación de leads **se mantiene** (es para visitantes web, no crea usuarios). Lo que se elimina es el registro de cuentas del panel.

---

## 1. Backend — Lovable Cloud

- **Deshabilitar signups** en la configuración de auth (`disable_signup: true`). Cualquier intento de `signUp` desde el cliente será rechazado por el servidor, aunque alguien manipule el frontend.
- **Ampliar el enum de roles** `app_role`. Hoy es `admin | executive | analyst`. Pasará a:
  - `admin` — control total (incluye gestión de usuarios y roles)
  - `analyst` — lectura + edición operativa del CRM
  - `operations` — edición operativa del CRM (reemplaza a `executive`)
  - `viewer` — solo lectura
- **Migrar usuarios existentes con rol `executive` → `operations`** y dejar de exponer `executive` en la UI (el valor del enum se mantiene en BD por compatibilidad, pero nadie nuevo lo recibe).
- **Actualizar políticas RLS** de las tablas CRM (`leads`, `clients`, `deals`, `quotes`, `activities`, `appointments`):
  - SELECT: cualquier usuario con al menos un rol (`has_any_role`).
  - INSERT/UPDATE: `admin`, `analyst` u `operations`.
  - DELETE: solo `admin`.
  - `viewer` solo puede leer.
- **Eliminar la asignación automática de rol** (ya no hay; el trigger `handle_new_user` solo crea el `profile`). Si un admin no asigna rol explícitamente, el usuario nuevo no puede entrar al panel — comportamiento deseado.

## 2. Frontend — Auth

- **Reescribir `src/pages/Auth.tsx`** como pantalla **login-only** (eliminar toggle signup, eliminar campo "nombre completo", eliminar texto "Solicitar acceso"). Diseño premium institucional consistente con el sistema actual (split screen, gradient navy, eyebrow olive, tipografía display).
- Mensaje claro cuando las credenciales no son válidas: "Acceso restringido. Contacte al administrador."
- Pie del formulario: enlace `mailto:contacto@stratecsecurity.com` para solicitar acceso (en lugar de auto-registro).

## 3. Guardia de rutas

- **`useAuth`** expone `roles` (ya lo hace). Añadir helper `hasAccess = roles.length > 0`.
- **`AppShell`** (cubre `/app/*` incluyendo dashboard, leads, clients, pipeline, quotes, agenda, analytics, messaging, settings):
  - Si `loading` → spinner.
  - Si no hay sesión → `Navigate to="/auth"`.
  - Si hay sesión pero `roles.length === 0` → mostrar pantalla "Acceso no autorizado. Contacte al administrador." con botón de cerrar sesión. No se accede a ningún módulo.
- **Ocultar acciones según rol** en el sidebar/botones (ej. `viewer` no ve botones de crear/editar).
- **Redirect legacy:** `/admin/leads` ya redirige a `/app/leads`; mantener.

## 4. Settings (opcional, recomendado)

- En `/app/settings`, sección visible solo para `admin`: lista de usuarios (`profiles`) con su rol actual y un `<Select>` para cambiarlo (`admin | analyst | operations | viewer`). Sin botón de "crear usuario" (los usuarios se crean manualmente desde la consola de Lovable Cloud, como pidió).

## 5. Limpieza

- Eliminar de `useAuth` el tipo `executive`, dejar `"admin" | "analyst" | "operations" | "viewer"`.
- Quitar cualquier referencia a "Crear cuenta" / "Solicitar acceso" en el sitio público.

---

## Detalles técnicos (para revisión)

- Migración SQL:
  ```sql
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
  UPDATE public.user_roles SET role = 'operations' WHERE role = 'executive';
  ```
  Luego recrear las policies `crm insert/update` para incluir `operations` además de `admin`/`analyst`. (Postgres no permite eliminar un valor de enum, así que `executive` queda como valor huérfano sin filas — aceptable.)
- `configure_auth({ disable_signup: true, auto_confirm_email: false, password_hibp_enabled: true, external_anonymous_users_enabled: false })`.
- `AppShell` y todas las páginas `/app/*` ya están bajo el shell — un solo punto de control.
- No se toca el formulario público `/schedule` ni el Edge Function `submit-lead`.

---

## Archivos a modificar

- `src/pages/Auth.tsx` — login-only, sin signup.
- `src/hooks/useAuth.tsx` — nuevo tipo `Role`, helper `hasAccess`.
- `src/components/app/AppShell.tsx` — bloqueo por roles vacíos + pantalla "no autorizado".
- `src/App.tsx` — sin cambios estructurales (solo limpieza si aplica).
- `src/pages/app/Placeholders.tsx` (Settings) — sección de gestión de roles para admin.
- Migración SQL para enum + policies.
- Configuración de auth (sin tocar archivos, vía tool).

## Pendiente de confirmar

¿OK con migrar los usuarios `executive` → `operations`, o prefieres mapearlos a `admin`?
