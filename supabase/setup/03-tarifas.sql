-- STRATEC · Paso 2c: tarifas por servicio para el precio sugerido en cotizaciones
-- y horas reales por cotización.
-- Requiere haber ejecutado ANTES 02-tablas-y-permisos.sql (crea can_access,
-- has_role y access_rules). Si faltan, este script se detiene sin cambiar nada.
-- Se puede ejecutar varias veces: no duplica estructuras ni borra datos.
-- Revertir: ver el final del archivo.

-- ── 0. Dependencias ─────────────────────────────────────────────────────────
do $$
begin
  if to_regprocedure('public.can_access(text, text)') is null then
    raise exception 'Falta public.can_access(text, text). Ejecuta primero 02-tablas-y-permisos.sql.';
  end if;
  if to_regprocedure('public.has_role(uuid, public.app_role)') is null then
    raise exception 'Falta public.has_role(uuid, app_role). Ejecuta primero 02-tablas-y-permisos.sql.';
  end if;
  if to_regclass('public.access_rules') is null then
    raise exception 'Falta la tabla public.access_rules. Ejecuta primero 02-tablas-y-permisos.sql.';
  end if;
  if to_regclass('public.quotes') is null then
    raise exception 'Falta la tabla public.quotes. Ejecuta primero 02-tablas-y-permisos.sql.';
  end if;
end $$;

-- ── 1. Tabla de tarifas ─────────────────────────────────────────────────────
-- Los precios pueden quedar vacíos (aún no definidos), pero nunca negativos.
create table if not exists public.service_rates (
  code text primary key,
  price_low numeric(14,2),
  price_medium numeric(14,2),
  price_high numeric(14,2),
  extra_site_pct numeric(6,2) not null default 50,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Validaciones (se agregan aunque la tabla ya existiera)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'service_rates_code_format') then
    alter table public.service_rates add constraint service_rates_code_format
      check (code ~ '^STR-[0-9]{2}(\.[0-9]{1,2})?$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'service_rates_prices_nonnegative') then
    alter table public.service_rates add constraint service_rates_prices_nonnegative
      check (coalesce(price_low, 0) >= 0 and coalesce(price_medium, 0) >= 0 and coalesce(price_high, 0) >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'service_rates_extra_site_pct_range') then
    alter table public.service_rates add constraint service_rates_extra_site_pct_range
      check (extra_site_pct between 0 and 200);
  end if;
end $$;

-- updated_at y updated_by se llenan solos en cada alta o cambio.
-- auth.uid() es el usuario del dashboard; desde el SQL Editor es nulo y se
-- conserva el valor que traiga la fila.
create or replace function public.service_rates_stamp()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;
revoke execute on function public.service_rates_stamp() from public, anon, authenticated;

drop trigger if exists service_rates_stamp on public.service_rates;
create trigger service_rates_stamp before insert or update on public.service_rates
  for each row execute function public.service_rates_stamp();

-- ── 2. Seguridad por filas ──────────────────────────────────────────────────
alter table public.service_rates enable row level security;

-- Solo se reemplazan las políticas propias de este script; cualquier otra se conserva.
drop policy if exists "rates read" on public.service_rates;
drop policy if exists "rates insert" on public.service_rates;
drop policy if exists "rates update" on public.service_rates;
drop policy if exists "rates delete" on public.service_rates;

-- Mismo permiso que el módulo de Cotizaciones
create policy "rates read" on public.service_rates for select to authenticated
  using (public.can_access('quotes', 'read'));
create policy "rates insert" on public.service_rates for insert to authenticated
  with check (public.can_access('quotes', 'write'));
create policy "rates update" on public.service_rates for update to authenticated
  using (public.can_access('quotes', 'write'))
  with check (public.can_access('quotes', 'write'));
create policy "rates delete" on public.service_rates for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

revoke all on public.service_rates from anon, public;
grant select, insert, update, delete on public.service_rates to authenticated;
grant all on public.service_rates to service_role;

-- ── 3. Horas reales por cotización ──────────────────────────────────────────
-- Columna nueva y vacía: no modifica cotizaciones existentes. Interna: no
-- aparece en el PDF. Las políticas de quotes (02) ya controlan quién la edita.
alter table public.quotes add column if not exists hours_actual numeric(8,2);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quotes_hours_actual_nonnegative') then
    alter table public.quotes add constraint quotes_hours_actual_nonnegative
      check (hours_actual is null or hours_actual >= 0);
  end if;
end $$;

notify pgrst, 'reload schema';

select 'service_rates lista' as resultado, count(*) as tarifas_capturadas from public.service_rates;

-- ── Revertir (no se ejecuta; copiar y correr solo si hiciera falta) ─────────
-- drop table if exists public.service_rates;
-- drop function if exists public.service_rates_stamp();
-- alter table public.quotes drop constraint if exists quotes_hours_actual_nonnegative;
-- alter table public.quotes drop column if exists hours_actual;
