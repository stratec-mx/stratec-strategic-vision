-- STRATEC · Paso 4: tarifas por servicio para el precio sugerido en cotizaciones.
-- Se puede ejecutar varias veces sin duplicar nada.
-- Requiere haber ejecutado 02-tablas-y-permisos.sql (usa public.can_access).

create table if not exists public.service_rates (
  code text primary key,
  price_low numeric(14,2),
  price_medium numeric(14,2),
  price_high numeric(14,2),
  extra_site_pct numeric(6,2) not null default 50,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.service_rates enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'service_rates' loop
    execute format('drop policy if exists %I on public.service_rates', p.policyname);
  end loop;
end $$;

-- Mismo permiso que el módulo de Cotizaciones
create policy "rates read" on public.service_rates for select to authenticated
  using (public.can_access('quotes', 'read'));
create policy "rates insert" on public.service_rates for insert to authenticated
  with check (public.can_access('quotes', 'write'));
create policy "rates update" on public.service_rates for update to authenticated
  using (public.can_access('quotes', 'write'));
create policy "rates delete" on public.service_rates for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

revoke all on public.service_rates from anon;
grant select, insert, update, delete on public.service_rates to authenticated;
grant all on public.service_rates to service_role;

notify pgrst, 'reload schema';

select 'service_rates lista' as resultado, count(*) as tarifas_capturadas from public.service_rates;
