-- ═══════════════════════════════════════════════════════════════════════════
-- Propuesta 09 (NO EJECUTADA): rol "Consultor" y facultades M-DESR por persona
-- ═══════════════════════════════════════════════════════════════════════════
-- Qué hace:
--   · Agrega el rol 'consultant' (Consultor): máxima autoridad técnica y
--     metodológica; valida y aprueba diagnósticos. No administra usuarios.
--   · Crea la tabla public.user_capabilities: facultades M-DESR que el
--     administrador da (grant) o retira (deny) a cada persona, además de las
--     que trae su rol. Un "deny" gana siempre.
--   · Crea public.user_capabilities_log: bitácora de quién dio o quitó qué
--     facultad y cuándo (la llena un trigger; nadie la edita a mano).
--   · Crea la función public.has_capability(usuario, facultad).
--   · Si existe access_rules (script 02): agrega los permisos iniciales del
--     Consultor y deja al Ejecutivo como rol comercial (ve todo; modifica todo
--     menos documentos técnicos). Si no
--     existe, se salta ese paso sin error.
--
-- Criterio del titular sobre el Administrador (sustituye al del 21-nov):
--   · "El Administrador tiene facultades técnicas por su rol": trae las 12
--     facultades, incluida mdesr.reassign (reasignar clientes o proyectos a
--     otros asesores o consultores).
--   · mdesr.validate, mdesr.approve y mdesr.close exigen el rol 'consultant'
--     o 'admin', además de la facultad. La regla de no ser autor ni revisor
--     del diagnóstico y el registro del acto como "administrador" van en el
--     script 10 (tablas de flujo M-DESR).
--   · Puede conceder, retirar (deny, aunque la traiga el rol) y revocar
--     facultades de cualquier usuario, incluido él mismo. Todo queda en la
--     bitácora.
--   · Sus permisos de módulos del CRM no cambian (siguen siendo totales).
--
-- Funciona en la producción actual (solo user_roles, has_role() y el CRM) y
-- también en una base donde ya se corrió 02. Es aditivo e idempotente: se
-- puede correr más de una vez, no borra datos y no toca políticas de otras
-- tablas. Únicamente reemplaza las políticas de sus dos tablas nuevas.
--
-- IMPORTANTE: va en DOS consultas separadas en el SQL Editor (Postgres no
-- deja usar un valor de enum recién agregado en la misma transacción, y el
-- SQL Editor corre todo el texto como una sola transacción).
--   1) Copia y ejecuta solo el PASO 1.
--   2) En una consulta NUEVA, copia y ejecuta todo el PASO 2 de una vez.
--
-- ── REVERSIÓN (por si hubiera que deshacerlo) ──────────────────────────────
-- Ejecutar en una consulta aparte. Borra las facultades dadas y su bitácora.
--
--   drop function if exists public.has_capability(uuid, text);
--   drop function if exists public.role_capabilities(text);
--   drop table if exists public.user_capabilities;       -- borra también sus triggers
--   drop table if exists public.user_capabilities_log;
--   drop function if exists public.user_capabilities_audit();
--   drop function if exists public.user_capabilities_stamp();
--   -- Si se corrió con access_rules: quitar las filas del Consultor
--   -- delete from public.access_rules where role = 'consultant';
--   -- (los permisos del Ejecutivo se ajustan desde el panel: Usuarios → matriz)
--
-- El valor 'consultant' del tipo app_role NO se quita: Postgres no permite
-- borrar un valor de un enum sin recrear el tipo y todas las columnas que lo
-- usan. Se deja sin usar; si nadie tiene ese rol, no tiene ningún efecto.
-- Antes de revertir, cambia el rol de quien sea Consultor en el panel.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══ PASO 1 (ejecútalo solo, en su propia consulta) ═══════════════════════
alter type public.app_role add value if not exists 'consultant';


-- ═══ PASO 2 (en una consulta NUEVA, después del paso 1; todo de una vez) ══

-- 2.0 Comprueba que el paso 1 ya se ejecutó; si no, se detiene sin cambiar nada.
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'app_role' and e.enumlabel = 'consultant'
  ) then
    raise exception 'Falta ejecutar el PASO 1 de 09-consultor-y-facultades.sql (en una consulta aparte) antes del PASO 2.';
  end if;
  if to_regprocedure('public.has_role(uuid, public.app_role)') is null then
    raise exception 'No existe la función public.has_role(uuid, app_role). Esta base no tiene la estructura esperada.';
  end if;
end $$;

-- 2.1 Facultades por persona
create table if not exists public.user_capabilities (
  user_id uuid not null references auth.users(id) on delete cascade,
  capability text not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  note text,
  primary key (user_id, capability)
);

-- Lista de facultades válidas. Se reemplaza la regla para que volver a correr
-- el script con una lista nueva la actualice.
alter table public.user_capabilities drop constraint if exists user_capabilities_capability_check;
alter table public.user_capabilities add constraint user_capabilities_capability_check check (capability in (
  'mdesr.prepare', 'mdesr.review', 'mdesr.comment', 'mdesr.submit',
  'mdesr.validate', 'mdesr.approve', 'mdesr.reject', 'mdesr.return_for_correction',
  'mdesr.close', 'mdesr.manage_instruments', 'mdesr.assign_reviewer', 'mdesr.reassign'
));

-- grant = se le da; deny = se le retira aunque la traiga su rol (deny gana).
alter table public.user_capabilities add column if not exists effect text not null default 'grant';
alter table public.user_capabilities drop constraint if exists user_capabilities_effect_check;
alter table public.user_capabilities add constraint user_capabilities_effect_check check (effect in ('grant', 'deny'));

-- 2.2 Bitácora de cambios (solo la escribe el trigger)
create table if not exists public.user_capabilities_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  capability text not null,
  action text not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  note text
);
-- grant/deny = alta de la fila; update = cambio; revoke = se borra la fila.
alter table public.user_capabilities_log drop constraint if exists user_capabilities_log_action_check;
alter table public.user_capabilities_log add constraint user_capabilities_log_action_check
  check (action in ('grant', 'deny', 'revoke', 'update'));
create index if not exists user_capabilities_log_user_idx on public.user_capabilities_log (user_id, changed_at desc);

-- Quién la dio y cuándo: lo pone la base, no lo que mande el panel.
-- Validar, aprobar y cerrar solo se pueden dar (grant) a un Consultor o admin.
-- Retirarlas (deny) se puede a cualquiera.
create or replace function public.user_capabilities_stamp()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.effect = 'grant'
     and new.capability in ('mdesr.validate', 'mdesr.approve', 'mdesr.close')
     and not exists (select 1 from public.user_roles ur
                     where ur.user_id = new.user_id and ur.role::text in ('consultant', 'admin')) then
    raise exception 'Solo un Consultor o un Administrador puede tener la facultad %.', new.capability
      using errcode = 'check_violation', hint = 'Asigna primero el rol Consultor a esa persona.';
  end if;
  new.granted_by := coalesce(auth.uid(), new.granted_by);
  new.granted_at := now();
  return new;
end $$;

create or replace function public.user_capabilities_audit()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.user_capabilities_log (user_id, capability, action, changed_by, note)
    values (new.user_id, new.capability, new.effect, coalesce(auth.uid(), new.granted_by), new.note);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.user_capabilities_log (user_id, capability, action, changed_by, note)
    values (new.user_id, new.capability, 'update', coalesce(auth.uid(), new.granted_by),
            concat_ws(' · ', 'efecto: ' || new.effect, new.note));
    return new;
  else
    insert into public.user_capabilities_log (user_id, capability, action, changed_by, note)
    values (old.user_id, old.capability, 'revoke', auth.uid(), old.note);
    return old;
  end if;
end $$;
revoke execute on function public.user_capabilities_audit() from public, anon, authenticated;
revoke execute on function public.user_capabilities_stamp() from public, anon, authenticated;

drop trigger if exists user_capabilities_stamp on public.user_capabilities;
create trigger user_capabilities_stamp before insert or update on public.user_capabilities
  for each row execute function public.user_capabilities_stamp();

drop trigger if exists user_capabilities_audit on public.user_capabilities;
create trigger user_capabilities_audit after insert or update or delete on public.user_capabilities
  for each row execute function public.user_capabilities_audit();

-- 2.3 Permisos de las dos tablas nuevas
--   · Solo el admin concede, modifica o revoca facultades (a cualquiera,
--     incluido él mismo). Cada usuario solo lee las suyas.
--   · Nadie más se da facultades a sí mismo.
--   · La bitácora solo la lee el admin; nadie la modifica desde el panel.
alter table public.user_capabilities enable row level security;
alter table public.user_capabilities_log enable row level security;

do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('user_capabilities', 'user_capabilities_log') loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "caps admin all" on public.user_capabilities for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "caps read own" on public.user_capabilities for select to authenticated
  using (user_id = auth.uid());
create policy "caps log admin read" on public.user_capabilities_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

revoke all on public.user_capabilities, public.user_capabilities_log from anon;
grant select, insert, update, delete on public.user_capabilities to authenticated;
grant select on public.user_capabilities_log to authenticated;
grant all on public.user_capabilities, public.user_capabilities_log to service_role;

-- 2.4 Facultades que trae cada rol (deben coincidir con src/lib/capabilities.ts)
--   Administrador: las 12.
--   Consultor: revisar, validar, aprobar, rechazar, devolver para corrección,
--              cerrar, administrar instrumentos y asignar revisor.
--   Analista:  elaborar, revisar, comentar y enviar a validación.
-- Se compara como texto para que no dependa del orden de los valores del enum.
create or replace function public.role_capabilities(_role text)
returns text[] language sql immutable set search_path = public
as $$
  select case _role
    when 'admin' then array['mdesr.prepare', 'mdesr.review', 'mdesr.comment', 'mdesr.submit',
                            'mdesr.validate', 'mdesr.approve', 'mdesr.reject',
                            'mdesr.return_for_correction', 'mdesr.close',
                            'mdesr.manage_instruments', 'mdesr.assign_reviewer', 'mdesr.reassign']
    when 'consultant' then array['mdesr.review', 'mdesr.validate', 'mdesr.approve', 'mdesr.reject',
                                 'mdesr.return_for_correction', 'mdesr.close',
                                 'mdesr.manage_instruments', 'mdesr.assign_reviewer']
    when 'analyst' then array['mdesr.prepare', 'mdesr.review', 'mdesr.comment', 'mdesr.submit']
    else array[]::text[]
  end
$$;

-- Verdadero si NO se le retiró (deny) y además su rol la trae o se la dieron
-- (grant). Validar, aprobar y cerrar exigen además el rol Consultor o admin
-- (si alguien deja de serlo, las pierde aunque su fila siga en la tabla).
-- SECURITY DEFINER: lee user_roles y user_capabilities sin pasar por sus
-- políticas.
create or replace function public.has_capability(_user uuid, _cap text)
returns boolean language sql stable security definer set search_path = public
as $$
  select _user is not null
    and not exists (select 1 from public.user_capabilities c
                    where c.user_id = _user and c.capability = _cap and c.effect = 'deny')
    and (
         exists (select 1 from public.user_capabilities c
                 where c.user_id = _user and c.capability = _cap and c.effect = 'grant')
      or exists (select 1 from public.user_roles ur
                 where ur.user_id = _user and _cap = any (public.role_capabilities(ur.role::text)))
    )
    and (
         _cap not in ('mdesr.validate', 'mdesr.approve', 'mdesr.close')
      or exists (select 1 from public.user_roles ur where ur.user_id = _user and ur.role::text in ('consultant', 'admin'))
    )
$$;
revoke execute on function public.has_capability(uuid, text) from public, anon;
grant execute on function public.has_capability(uuid, text) to authenticated, service_role;
grant execute on function public.role_capabilities(text) to authenticated, service_role;

-- 2.5 Niveles de acceso por módulo (solo si ya se corrió 02 y existe access_rules)
--   Consultor: ve clientes, agenda y documentos; edita documentos. Lo comercial
--              (leads, contactos, pipeline, cotizaciones, analítica) queda cerrado.
--              "do nothing": no pisa lo que ya se haya ajustado en el panel.
--   Ejecutivo: rol comercial. Ve todo y modifica lo comercial y operativo
--              (leads, clientes, contactos, pipeline, agenda, cotizaciones,
--              analítica). Ve los documentos pero NO modifica diagnósticos ni
--              valoraciones técnicas ("do update": se fija aunque ya exista).
do $$
begin
  if to_regclass('public.access_rules') is null then
    raise notice 'access_rules no existe todavía (falta 02): se omiten los niveles de acceso.';
    return;
  end if;

  execute $sql$
    insert into public.access_rules (role, resource, can_read, can_write) values
      ('consultant','leads',false,false), ('consultant','clients',true,false), ('consultant','contactos',false,false),
      ('consultant','pipeline',false,false), ('consultant','agenda',true,false), ('consultant','quotes',false,false),
      ('consultant','documents',true,true), ('consultant','analytics',false,false)
    on conflict (role, resource) do nothing
  $sql$;

  execute $sql$
    insert into public.access_rules (role, resource, can_read, can_write) values
      ('executive','leads',true,true), ('executive','clients',true,true), ('executive','contactos',true,true),
      ('executive','pipeline',true,true), ('executive','agenda',true,true), ('executive','quotes',true,true),
      ('executive','documents',true,false), ('executive','analytics',true,true)
    on conflict (role, resource) do update
      set can_read = excluded.can_read, can_write = excluded.can_write, updated_at = now()
  $sql$;
end $$;

-- 2.6 Comprobación: todas las filas deben decir ok = true
-- (la última dice false si todavía no se ha corrido 02; eso está bien).
select 'rol consultant' as objeto,
       exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
               where t.typname = 'app_role' and e.enumlabel = 'consultant') as ok
union all select 'tabla user_capabilities', to_regclass('public.user_capabilities') is not null
union all select 'tabla user_capabilities_log', to_regclass('public.user_capabilities_log') is not null
union all select 'función has_capability', to_regprocedure('public.has_capability(uuid, text)') is not null
union all select 'políticas (3)', (select count(*) = 3 from pg_policies where schemaname = 'public'
                                     and tablename in ('user_capabilities', 'user_capabilities_log'))
union all select 'access_rules (solo si ya se corrió 02)', to_regclass('public.access_rules') is not null;

-- Opcional, solo si ya se corrió 02: deben salir 8 filas de consultant y 8 de executive
-- (executive: todo en true salvo documents, que queda can_write = false).
-- select role, resource, can_read, can_write from public.access_rules
--   where role in ('consultant', 'executive') order by role, resource;
