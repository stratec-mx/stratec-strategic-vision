-- STRATEC · Comprobación de 03-tarifas.sql. Ejecutar DESPUÉS de 02 y 03.
-- Simula tres usuarios (visitante sin sesión, usuario sin permiso y
-- administrador) y prueba lo que cada uno puede hacer con las tarifas.
-- No deja cambios: la tarifa de prueba STR-98 se crea y se borra dentro de la
-- misma prueba, y no se toca ninguna cotización.
-- Cada prueba cambia de rol solo durante su consulta; si la consulta falla, el
-- cambio de rol se revierte con ella y el resultado se anota como postgres.

drop table if exists _resultado;
create temp table _resultado (n int, prueba text, esperado text, obtenido text, ok boolean);

do $$
declare
  fake constant text := '00000000-0000-0000-0000-000000000001';
  admin_id text := (select user_id::text from public.user_roles where role::text = 'admin' limit 1);
  n int;
  stamped uuid;
begin
  -- 1 · Visitante sin sesión (rol anon) intenta leer
  begin
    execute 'set local role anon';
    perform 1 from public.service_rates limit 1;
    execute 'reset role';
    insert into _resultado values (1, 'Visitante sin sesión lee tarifas', 'acceso denegado', 'pudo leer', false);
  exception when insufficient_privilege then
    insert into _resultado values (1, 'Visitante sin sesión lee tarifas', 'acceso denegado', 'acceso denegado', true);
  end;

  -- 2 y 3 · Usuario con sesión pero sin rol ni permiso
  perform set_config('request.jwt.claims', json_build_object('sub', fake, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', fake, true);
  begin
    execute 'set local role authenticated';
    select count(*) into n from public.service_rates;
    execute 'reset role';
    insert into _resultado values (2, 'Usuario sin permiso ve tarifas', '0 filas', n || ' filas', n = 0);
  exception when others then
    insert into _resultado values (2, 'Usuario sin permiso ve tarifas', '0 filas', 'error: ' || sqlerrm, false);
  end;
  begin
    execute 'set local role authenticated';
    insert into public.service_rates (code, price_low) values ('STR-98', 1);
    execute 'reset role';
    delete from public.service_rates where code = 'STR-98';
    insert into _resultado values (3, 'Usuario sin permiso crea una tarifa', 'rechazado', 'se creó', false);
  exception when others then
    insert into _resultado values (3, 'Usuario sin permiso crea una tarifa', 'rechazado', 'rechazado', true);
  end;

  -- 4 a 7 · Administrador real
  if admin_id is null then
    insert into _resultado values (4, 'Administrador', 'existe un admin', 'no hay ningún admin', false);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', admin_id, true);
    begin
      execute 'set local role authenticated';
      insert into public.service_rates (code, price_low) values ('STR-98', 1000) returning updated_by into stamped;
      update public.service_rates set price_low = 1200 where code = 'STR-98';
      execute 'reset role';
      insert into _resultado values (4, 'Administrador crea y modifica una tarifa', 'permitido', 'permitido', true);
      insert into _resultado values (5, 'updated_by registra al administrador', 'su id',
        coalesce(stamped::text, 'vacío'), stamped::text = admin_id);
    exception when others then
      insert into _resultado values (4, 'Administrador crea y modifica una tarifa', 'permitido', 'error: ' || sqlerrm, false);
    end;
    begin
      update public.service_rates set price_low = -5 where code = 'STR-98';
      insert into _resultado values (6, 'Precio negativo', 'rechazado', 'se aceptó', false);
    exception when check_violation then
      insert into _resultado values (6, 'Precio negativo', 'rechazado', 'rechazado', true);
    end;
    begin
      update public.service_rates set extra_site_pct = -10 where code = 'STR-98';
      insert into _resultado values (7, 'Porcentaje por inmueble negativo', 'rechazado', 'se aceptó', false);
    exception when check_violation then
      insert into _resultado values (7, 'Porcentaje por inmueble negativo', 'rechazado', 'rechazado', true);
    end;
    delete from public.service_rates where code = 'STR-98';
  end if;

  -- 8 · Horas reales negativas bloqueadas en quotes (sin tocar cotizaciones)
  perform 1 from pg_constraint where conname = 'quotes_hours_actual_nonnegative';
  insert into _resultado values (8, 'Horas reales negativas bloqueadas', 'regla presente',
    case when found then 'regla presente' else 'falta la regla' end, found);

  -- 9 · No quedó ninguna tarifa de prueba
  select count(*) into n from public.service_rates where code = 'STR-98';
  insert into _resultado values (9, 'Limpieza de la tarifa de prueba', '0 filas', n || ' filas', n = 0);
end $$;

select n, prueba, esperado, obtenido, case when ok then 'OK' else 'REVISAR' end as estado
from _resultado order by n;
