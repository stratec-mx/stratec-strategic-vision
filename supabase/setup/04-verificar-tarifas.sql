-- STRATEC · Comprobación de 03-tarifas.sql. Ejecutar DESPUÉS de 02 y 03.
-- Simula tres usuarios (visitante sin sesión, usuario sin permiso y
-- administrador) y prueba lo que cada uno puede hacer con las tarifas.
-- No deja cambios: las tarifas de prueba STR-97 y STR-98 se crean y se borran
-- dentro de la misma prueba, y no se toca ninguna cotización.
-- Cada prueba cambia de rol solo durante su consulta; si la consulta falla, el
-- cambio de rol se revierte con ella.
-- La tabla de resultados es temporal (esquema pg_temp): desaparece al cerrar
-- la sesión y no puede borrar ni pisar una tabla real.

drop table if exists pg_temp._resultado;
create temporary table _resultado (n int, prueba text, esperado text, obtenido text, ok boolean);

do $$
declare
  fake constant text := '00000000-0000-0000-0000-000000000001';
  admin_id text := (select user_id::text from public.user_roles where role::text = 'admin' limit 1);
  n int;
  precio numeric;
  stamped uuid;
  t_alta timestamptz;
  t_cambio timestamptz;
begin
  -- Sin esto, la prueba 1 daría "acceso denegado" por no poder cambiar de rol
  if not (pg_has_role(current_user, 'anon', 'MEMBER') and pg_has_role(current_user, 'authenticated', 'MEMBER')) then
    raise exception 'El usuario % no puede simular los roles anon y authenticated. Ejecuta el script desde el SQL Editor de Supabase.', current_user;
  end if;

  -- Preparación (como postgres, sin sesión): tarifa de prueba STR-98
  delete from public.service_rates where code in ('STR-97', 'STR-98');
  insert into public.service_rates (code, price_low) values ('STR-98', 1000) returning updated_at into t_alta;

  -- 1 · Visitante sin sesión (rol anon) intenta leer
  begin
    execute 'set local role anon';
    perform 1 from public.service_rates limit 1;
    execute 'reset role';
    insert into pg_temp._resultado values (1, 'Visitante sin sesión lee tarifas', 'acceso denegado', 'pudo leer', false);
  exception when insufficient_privilege then
    insert into pg_temp._resultado values (1, 'Visitante sin sesión lee tarifas', 'acceso denegado', 'acceso denegado', true);
  end;

  -- 2 a 5 · Usuario con sesión pero sin rol ni permiso
  perform set_config('request.jwt.claims', json_build_object('sub', fake, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', fake, true);
  begin
    execute 'set local role authenticated';
    select count(*) into n from public.service_rates;
    execute 'reset role';
    insert into pg_temp._resultado values (2, 'Usuario sin permiso ve tarifas', '0 filas', n || ' filas', n = 0);
  exception when others then
    insert into pg_temp._resultado values (2, 'Usuario sin permiso ve tarifas', '0 filas', 'error: ' || sqlerrm, false);
  end;
  begin
    execute 'set local role authenticated';
    insert into public.service_rates (code, price_low) values ('STR-97', 1);
    execute 'reset role';
    delete from public.service_rates where code = 'STR-97';
    insert into pg_temp._resultado values (3, 'Usuario sin permiso crea una tarifa', 'rechazado', 'se creó', false);
  exception when others then
    insert into pg_temp._resultado values (3, 'Usuario sin permiso crea una tarifa', 'rechazado', 'rechazado', true);
  end;
  begin
    execute 'set local role authenticated';
    update public.service_rates set price_low = 1 where code = 'STR-98';
    get diagnostics n = row_count;
    execute 'reset role';
    select price_low into precio from public.service_rates where code = 'STR-98';
    insert into pg_temp._resultado values (4, 'Usuario sin permiso modifica una tarifa', 'sin cambios',
      case when precio = 1000 then 'sin cambios' else 'cambió a ' || precio end, n = 0 and precio = 1000);
  exception when others then
    insert into pg_temp._resultado values (4, 'Usuario sin permiso modifica una tarifa', 'sin cambios', 'rechazado', true);
  end;
  begin
    execute 'set local role authenticated';
    delete from public.service_rates where code = 'STR-98';
    get diagnostics n = row_count;
    execute 'reset role';
    insert into pg_temp._resultado values (5, 'Usuario sin permiso borra una tarifa', 'sin cambios',
      case when n = 0 then 'sin cambios' else 'la borró' end, n = 0);
  exception when others then
    insert into pg_temp._resultado values (5, 'Usuario sin permiso borra una tarifa', 'sin cambios', 'rechazado', true);
  end;

  -- 6 a 13 · Administrador real
  if admin_id is null then
    insert into pg_temp._resultado values (6, 'Administrador', 'existe un admin', 'no hay ningún admin', false);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', admin_id, true);
    begin
      execute 'set local role authenticated';
      select count(*) into n from public.service_rates where code = 'STR-98';
      execute 'reset role';
      insert into pg_temp._resultado values (6, 'Administrador consulta las tarifas', '1 fila', n || ' filas', n = 1);
    exception when others then
      insert into pg_temp._resultado values (6, 'Administrador consulta las tarifas', '1 fila', 'error: ' || sqlerrm, false);
    end;
    begin
      execute 'set local role authenticated';
      insert into public.service_rates (code, price_low) values ('STR-97', 500);
      update public.service_rates set price_low = 1200 where code = 'STR-98';
      get diagnostics n = row_count;
      execute 'reset role';
      insert into pg_temp._resultado values (7, 'Administrador crea y modifica tarifas', 'permitido',
        case when n = 1 then 'permitido' else 'no modificó' end, n = 1);
    exception when others then
      insert into pg_temp._resultado values (7, 'Administrador crea y modifica tarifas', 'permitido', 'error: ' || sqlerrm, false);
    end;
    select updated_by, updated_at into stamped, t_cambio from public.service_rates where code = 'STR-98';
    insert into pg_temp._resultado values (8, 'updated_by registra al administrador', 'su id',
      coalesce(stamped::text, 'vacío'), coalesce(stamped::text = admin_id, false));
    insert into pg_temp._resultado values (9, 'updated_at cambia al modificar', 'fecha posterior al alta',
      case when t_cambio > t_alta then 'fecha posterior al alta' else 'no cambió' end, coalesce(t_cambio > t_alta, false));
    begin
      execute 'set local role authenticated';
      delete from public.service_rates where code = 'STR-97';
      get diagnostics n = row_count;
      execute 'reset role';
      insert into pg_temp._resultado values (10, 'Administrador borra una tarifa', 'permitido',
        case when n = 1 then 'permitido' else 'no la borró' end, n = 1);
    exception when others then
      insert into pg_temp._resultado values (10, 'Administrador borra una tarifa', 'permitido', 'error: ' || sqlerrm, false);
    end;
  end if;

  -- 11 a 13 · Validaciones de valores (aplican a cualquier usuario)
  begin
    update public.service_rates set price_low = -5 where code = 'STR-98';
    insert into pg_temp._resultado values (11, 'Precio negativo', 'rechazado', 'se aceptó', false);
  exception when check_violation then
    insert into pg_temp._resultado values (11, 'Precio negativo', 'rechazado', 'rechazado', true);
  end;
  begin
    update public.service_rates set extra_site_pct = -10 where code = 'STR-98';
    insert into pg_temp._resultado values (12, 'Porcentaje por inmueble negativo', 'rechazado', 'se aceptó', false);
  exception when check_violation then
    insert into pg_temp._resultado values (12, 'Porcentaje por inmueble negativo', 'rechazado', 'rechazado', true);
  end;
  begin
    update public.service_rates set extra_site_pct = 250 where code = 'STR-98';
    insert into pg_temp._resultado values (13, 'Porcentaje por inmueble mayor a 200', 'rechazado', 'se aceptó', false);
  exception when check_violation then
    insert into pg_temp._resultado values (13, 'Porcentaje por inmueble mayor a 200', 'rechazado', 'rechazado', true);
  end;

  -- 14 · Horas reales negativas bloqueadas en quotes (sin tocar cotizaciones)
  perform 1 from pg_constraint where conname = 'quotes_hours_actual_nonnegative';
  insert into pg_temp._resultado values (14, 'Horas reales negativas bloqueadas', 'regla presente',
    case when found then 'regla presente' else 'falta la regla' end, found);

  -- 15 · Limpieza: no queda ninguna tarifa de prueba
  delete from public.service_rates where code in ('STR-97', 'STR-98');
  select count(*) into n from public.service_rates where code in ('STR-97', 'STR-98');
  insert into pg_temp._resultado values (15, 'Limpieza de las tarifas de prueba', '0 filas', n || ' filas', n = 0);
end $$;

select n, prueba, esperado, obtenido, case when ok then 'OK' else 'REVISAR' end as estado
from pg_temp._resultado order by n;

-- Horas en el PDF: no se prueba con SQL. El PDF de cotización (src/lib/quotePdf.ts)
-- solo imprime código, concepto, descripción, cantidad y precio de cada partida;
-- ni las horas estimadas ni hours_actual se pasan al generador.
