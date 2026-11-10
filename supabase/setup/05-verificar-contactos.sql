-- STRATEC · Comprobación de la protección de correos y teléfonos de leads y
-- clientes. Ejecutar DESPUÉS de 02. SOLO LECTURA: no crea, modifica ni borra
-- registros, y el resultado muestra conteos, no datos personales.
--
-- Cómo está protegido (02-tablas-y-permisos.sql):
--   · anon y authenticated no pueden leer las columnas email/phone de leads ni
--     contact_email/contact_phone de clients (permiso por columna).
--   · Se leen por las vistas lead_contacts y client_contacts. Las vistas se
--     ejecutan con permisos de su dueño y solo devuelven filas si
--     can_access('contactos','read') es verdadero para quien consulta
--     (admin, o un rol con "Datos de contacto" activado en Niveles de acceso).

drop table if exists pg_temp._resultado_contactos;
create temporary table _resultado_contactos (n int, prueba text, esperado text, obtenido text, ok boolean);

do $$
declare
  fake constant text := '00000000-0000-0000-0000-000000000001';
  admin_id text := (select user_id::text from public.user_roles where role::text = 'admin' limit 1);
  -- Un usuario con rol pero sin permiso de contactos, si existe
  sinperm_id text := (
    select ur.user_id::text from public.user_roles ur
    where not exists (select 1 from public.user_roles a where a.user_id = ur.user_id and a.role::text = 'admin')
      and not exists (select 1 from public.user_roles x join public.access_rules ar on ar.role = x.role
                      where x.user_id = ur.user_id and ar.resource = 'contactos' and ar.can_read)
    limit 1);
  total_leads int := (select count(*) from public.leads);
  total_clients int := (select count(*) from public.clients);
  n int;
  m int;
begin
  if not (pg_has_role(current_user, 'anon', 'MEMBER') and pg_has_role(current_user, 'authenticated', 'MEMBER')) then
    raise exception 'El usuario % no puede simular los roles anon y authenticated. Ejecuta el script desde el SQL Editor de Supabase.', current_user;
  end if;

  -- 1 · Visitante sin sesión
  begin
    execute 'set local role anon';
    perform 1 from public.lead_contacts limit 1;
    execute 'reset role';
    insert into pg_temp._resultado_contactos values (1, 'Visitante sin sesión lee lead_contacts', 'acceso denegado', 'pudo leer', false);
  exception when insufficient_privilege then
    insert into pg_temp._resultado_contactos values (1, 'Visitante sin sesión lee lead_contacts', 'acceso denegado', 'acceso denegado', true);
  end;
  begin
    execute 'set local role anon';
    perform 1 from public.client_contacts limit 1;
    execute 'reset role';
    insert into pg_temp._resultado_contactos values (2, 'Visitante sin sesión lee client_contacts', 'acceso denegado', 'pudo leer', false);
  exception when insufficient_privilege then
    insert into pg_temp._resultado_contactos values (2, 'Visitante sin sesión lee client_contacts', 'acceso denegado', 'acceso denegado', true);
  end;

  -- 3 a 5 · Usuario con sesión pero sin rol
  perform set_config('request.jwt.claims', json_build_object('sub', fake, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', fake, true);
  begin
    execute 'set local role authenticated';
    select count(*) into n from public.lead_contacts;
    select count(*) into m from public.client_contacts;
    execute 'reset role';
    insert into pg_temp._resultado_contactos values (3, 'Usuario sin rol: vistas de contacto', '0 filas',
      n || ' leads, ' || m || ' clientes', n = 0 and m = 0);
  exception when others then
    insert into pg_temp._resultado_contactos values (3, 'Usuario sin rol: vistas de contacto', '0 filas', 'error: ' || sqlerrm, false);
  end;
  begin
    execute 'set local role authenticated';
    perform phone from public.leads limit 1;
    execute 'reset role';
    insert into pg_temp._resultado_contactos values (4, 'Usuario sin rol lee leads.phone directo', 'acceso denegado', 'pudo leer', false);
  exception when insufficient_privilege then
    insert into pg_temp._resultado_contactos values (4, 'Usuario sin rol lee leads.phone directo', 'acceso denegado', 'acceso denegado', true);
  end;

  -- 5 · Usuario con rol pero sin permiso de contactos (si existe alguno)
  if sinperm_id is null then
    insert into pg_temp._resultado_contactos values (5, 'Rol sin permiso de contactos: vistas', '0 filas',
      'no hay usuarios así; se probará al crear uno', null);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', sinperm_id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', sinperm_id, true);
    begin
      execute 'set local role authenticated';
      select count(*) into n from public.lead_contacts;
      select count(*) into m from public.client_contacts;
      execute 'reset role';
      insert into pg_temp._resultado_contactos values (5, 'Rol sin permiso de contactos: vistas', '0 filas',
        n || ' leads, ' || m || ' clientes', n = 0 and m = 0);
    exception when others then
      insert into pg_temp._resultado_contactos values (5, 'Rol sin permiso de contactos: vistas', '0 filas', 'error: ' || sqlerrm, false);
    end;
  end if;

  -- 6 a 8 · Administrador
  if admin_id is null then
    insert into pg_temp._resultado_contactos values (6, 'Administrador', 'existe un admin', 'no hay ningún admin', false);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', admin_id, true);
    begin
      execute 'set local role authenticated';
      select count(*) into n from public.lead_contacts;
      select count(*) into m from public.client_contacts;
      execute 'reset role';
      insert into pg_temp._resultado_contactos values (6, 'Administrador: vistas de contacto', 'todas las filas',
        n || ' de ' || total_leads || ' leads, ' || m || ' de ' || total_clients || ' clientes',
        n = total_leads and m = total_clients);
    exception when others then
      insert into pg_temp._resultado_contactos values (6, 'Administrador: vistas de contacto', 'todas las filas', 'error: ' || sqlerrm, false);
    end;
    begin
      execute 'set local role authenticated';
      perform email from public.leads limit 1;
      execute 'reset role';
      insert into pg_temp._resultado_contactos values (7, 'Administrador lee leads.email directo', 'acceso denegado', 'pudo leer', false);
    exception when insufficient_privilege then
      insert into pg_temp._resultado_contactos values (7, 'Administrador lee leads.email directo', 'acceso denegado', 'acceso denegado', true);
    end;
    begin
      execute 'set local role authenticated';
      select count(*) into n from public.leads;
      execute 'reset role';
      insert into pg_temp._resultado_contactos values (8, 'Administrador lee los demás campos de leads', 'todas las filas',
        n || ' de ' || total_leads, n = total_leads);
    exception when others then
      insert into pg_temp._resultado_contactos values (8, 'Administrador lee los demás campos de leads', 'todas las filas', 'error: ' || sqlerrm, false);
    end;
  end if;
end $$;

select n, prueba, esperado, obtenido,
       case when ok is null then 'NO APLICA' when ok then 'OK' else 'REVISAR' end as estado
from pg_temp._resultado_contactos order by n;
