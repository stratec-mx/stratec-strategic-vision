-- ═══════════════════════════════════════════════════════════════════════════
-- STRATEC · PROPUESTA 11 · Correcciones de la auditoría de permisos
--
--   ███  NO EJECUTADO  ███  Probarlo primero en el proyecto de PRUEBA  ███
--
-- Va DESPUÉS de 02, 03, 08, 09 y 10 (ya aplicados en producción el 23-nov).
-- Corrige cuatro hallazgos de la auditoría:
--   M-2  project_members: la política "mdesr dar de baja" dejaba cambiar el
--        proyecto, la persona o la función de una asignación (with check sin
--        condiciones). Ahora solo se puede dar de baja o anotar.
--   M-3  review_comments: "mdesr atender" tenía with check (true). Cualquiera
--        que viera el comentario podía reescribirlo o cambiarle el autor.
--        Ahora solo se cambia el estado (y quién/cuándo lo pone la base).
--   N-3  clients: al dar de alta un cliente desde el cotizador, un rol limitado
--        por asignación (Asesor, Operaciones, Ejecutivo, Solo lectura) podía
--        recibir "new row violates row-level security policy": la función
--        STABLE mdesr_client_assigned() no ve la fila recién insertada. Se
--        agrega owner_id = auth.uid() directo en la política. No amplía el
--        acceso: esa función ya contaba al responsable (owner_id).
--   C-5  user_roles: la base no impedía quedarse sin ningún administrador
--        (solo lo impedía el panel). Ahora un trigger lo bloquea.
-- Las otras dos correcciones pedidas van en los scripts originales:
--   N-4  02-tablas-y-permisos.sql ya no borra las políticas "mdesr ..." ni
--        reescribe lead_contacts / client_contacts si existen. Este script
--        solo comprueba (al final) que las vistas conservan el filtro del 10.
--   00   00-revisar-estado.sql ya no falla en una base sin user_roles.
--
-- Es idempotente: se puede correr varias veces. No borra ni modifica datos:
-- solo crea o reemplaza 3 funciones, 3 triggers y 3 políticas.
-- Va en UNA sola consulta del SQL Editor (todo o nada).
-- Reversión: al final del archivo, comentada.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══ PASO 0 · Requisitos (se detiene sin cambiar nada si falta algo) ═══════
do $$
declare
  falta text[] := '{}';
  o text;
begin
  foreach o in array array['public.user_roles', 'public.clients', 'public.project_members',
                           'public.review_comments', 'public.client_assignments'] loop
    if to_regclass(o) is null then falta := falta || o; end if;
  end loop;
  foreach o in array array['public.has_capability(uuid, text)', 'public.mdesr_has_faculty(text, uuid)',
                           'public.mdesr_functions(uuid, uuid)', 'public.mdesr_can_read(uuid)',
                           'public.mdesr_assessment_project(uuid)', 'public.mdesr_crm_limited(uuid)',
                           'public.mdesr_client_assigned(uuid, uuid)'] loop
    if to_regprocedure(o) is null then falta := falta || o; end if;
  end loop;
  if cardinality(falta) > 0 then
    raise exception 'Faltan objetos de los scripts 02, 09 o 10: %. No se cambió nada.', array_to_string(falta, ', ');
  end if;
end $$;


-- ═══ PASO 1 · M-2 · Asignaciones de proyecto (project_members) ═════════════
-- Una asignación no se edita: se da de baja y se crea otra. El trigger deja
-- cambiar solo la baja (removed_at, removal_reason) y las notas; quién dio
-- la baja lo pone la base. Una baja no se deshace.
create or replace function public.mdesr_guard_member_update()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.project_id is distinct from old.project_id
     or new.user_id is distinct from old.user_id
     or new.project_function is distinct from old.project_function
     or new.assigned_by is distinct from old.assigned_by
     or new.assigned_at is distinct from old.assigned_at
     or new.reason is distinct from old.reason then
    raise exception 'Una asignación no se modifica: dala de baja y crea una nueva.'
      using errcode = 'check_violation';
  end if;
  if old.removed_at is not null
     and (new.removed_at is distinct from old.removed_at
          or new.removed_by is distinct from old.removed_by
          or new.removal_reason is distinct from old.removal_reason) then
    raise exception 'Esta asignación ya se dio de baja; no se puede reactivar ni cambiar la baja.'
      using errcode = 'check_violation';
  end if;
  if old.removed_at is null and new.removed_at is not null then
    new.removed_by := coalesce(auth.uid(), new.removed_by);
  elsif old.removed_at is null then
    new.removed_by := old.removed_by;  -- sin baja no hay quién la dio
  end if;
  return new;
end $$;
revoke execute on function public.mdesr_guard_member_update() from public, anon, authenticated;

drop trigger if exists mdesr_guard_member_update on public.project_members;
create trigger mdesr_guard_member_update before update on public.project_members
  for each row execute function public.mdesr_guard_member_update();

-- La política exige ahora en la fila nueva las mismas condiciones que en la
-- anterior (antes el with check solo pedía el motivo de la baja).
drop policy if exists "mdesr dar de baja" on public.project_members;
create policy "mdesr dar de baja" on public.project_members for update to authenticated
  using (public.has_capability(auth.uid(), 'admin.reassign_clients_projects')
         or (project_function = 'revisor'
             and public.mdesr_has_faculty('mdesr.assign_reviewer')
             and 'consultor_validador' = any(public.mdesr_functions(project_id))))
  with check ((public.has_capability(auth.uid(), 'admin.reassign_clients_projects')
               or (project_function = 'revisor'
                   and public.mdesr_has_faculty('mdesr.assign_reviewer')
                   and 'consultor_validador' = any(public.mdesr_functions(project_id))))
              and (removed_at is null or coalesce(length(btrim(removal_reason)), 0) >= 5));


-- ═══ PASO 2 · M-3 · Comentarios de revisión (review_comments) ══════════════
-- "Atender" un comentario = cambiar su estado. El texto, el autor y a qué se
-- refiere no cambian; quién lo resolvió y cuándo lo pone la base.
create or replace function public.mdesr_guard_comment_update()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.assessment_id is distinct from old.assessment_id
     or new.document_id is distinct from old.document_id
     or new.subject_revision_no is distinct from old.subject_revision_no
     or new.target_table is distinct from old.target_table
     or new.target_id is distinct from old.target_id
     or new.body is distinct from old.body
     or new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Un comentario de revisión no se edita: solo cambia su estado. Para corregirlo, agrega otro comentario.'
      using errcode = 'check_violation';
  end if;
  if new.status = 'abierta' then
    new.resolved_by := null;
    new.resolved_at := null;
  elsif new.status is distinct from old.status then
    new.resolved_by := auth.uid();
    new.resolved_at := now();
  else
    new.resolved_by := old.resolved_by;
    new.resolved_at := old.resolved_at;
  end if;
  return new;
end $$;
revoke execute on function public.mdesr_guard_comment_update() from public, anon, authenticated;

drop trigger if exists mdesr_guard_comment_update on public.review_comments;
create trigger mdesr_guard_comment_update before update on public.review_comments
  for each row execute function public.mdesr_guard_comment_update();

drop policy if exists "mdesr atender" on public.review_comments;
create policy "mdesr atender" on public.review_comments for update to authenticated
  using (public.mdesr_can_read(coalesce(public.mdesr_assessment_project(assessment_id),
                                         (select d.project_id from public.documents d where d.id = document_id))))
  with check (public.mdesr_can_read(coalesce(public.mdesr_assessment_project(assessment_id),
                                              (select d.project_id from public.documents d where d.id = document_id))));


-- ═══ PASO 3 · N-3 · Alta de clientes por un rol limitado ═══════════════════
-- Igual que en el 10, más owner_id = auth.uid() en USING. Al insertar con
-- .select("id") (cotizador), Postgres aplica también la regla de lectura a la
-- fila nueva, y la función STABLE no la ve todavía; la comparación directa sí.
drop policy if exists "mdesr crm asignados" on public.clients;
create policy "mdesr crm asignados" on public.clients as restrictive for all to authenticated
  using (not public.mdesr_crm_limited() or owner_id = auth.uid() or public.mdesr_client_assigned(id))
  with check (not public.mdesr_crm_limited() or owner_id = auth.uid() or public.mdesr_client_assigned(id));


-- ═══ PASO 4 · C-5 · Siempre debe quedar al menos un administrador ══════════
-- Bloquea borrar o cambiar la última fila con rol admin, venga del panel, de
-- la API, del SQL Editor o del borrado de la cuenta en Authentication (que
-- borra sus roles en cascada). El candado evita que dos bajas simultáneas
-- dejen la base sin admin.
create or replace function public.user_roles_keep_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.role::text = 'admin'
     and (tg_op = 'DELETE' or new.role::text <> 'admin' or new.user_id is distinct from old.user_id) then
    perform pg_advisory_xact_lock(hashtext('stratec.user_roles.ultimo_admin'));
    -- En un BEFORE la fila que se quita todavía cuenta: debe haber otra.
    -- (Contar filas no depende de la columna id y tolera duplicados.)
    if (select count(*) from public.user_roles where role::text = 'admin') <= 1 then
      raise exception 'No se puede quitar el último rol de Administrador: primero asigna admin a otra cuenta.'
        using errcode = 'check_violation';
    end if;
  end if;
  return coalesce(new, old);
end $$;
revoke execute on function public.user_roles_keep_admin() from public, anon, authenticated;

drop trigger if exists user_roles_keep_admin on public.user_roles;
create trigger user_roles_keep_admin before update or delete on public.user_roles
  for each row execute function public.user_roles_keep_admin();


notify pgrst, 'reload schema';


-- ═══ PASO 5 · Comprobaciones (solo lectura). Todas deben decir ok = true ═══
select 'M-2 trigger de asignaciones' as objeto,
       exists (select 1 from pg_trigger where tgname = 'mdesr_guard_member_update'
               and tgrelid = 'public.project_members'::regclass and not tgisinternal) as ok
union all
select 'M-2 política "mdesr dar de baja" con condiciones en with check',
       coalesce((select with_check like '%admin.reassign_clients_projects%' from pg_policies
                 where schemaname = 'public' and tablename = 'project_members' and policyname = 'mdesr dar de baja'), false)
union all
select 'M-3 trigger de comentarios',
       exists (select 1 from pg_trigger where tgname = 'mdesr_guard_comment_update'
               and tgrelid = 'public.review_comments'::regclass and not tgisinternal)
union all
select 'M-3 política "mdesr atender" sin with check (true)',
       coalesce((select with_check is not null and with_check <> 'true' from pg_policies
                 where schemaname = 'public' and tablename = 'review_comments' and policyname = 'mdesr atender'), false)
union all
select 'N-3 política de clientes con owner_id directo',
       coalesce((select qual like '%owner_id = auth.uid()%' from pg_policies
                 where schemaname = 'public' and tablename = 'clients' and policyname = 'mdesr crm asignados'), false)
union all
select 'C-5 trigger del último administrador',
       exists (select 1 from pg_trigger where tgname = 'user_roles_keep_admin'
               and tgrelid = 'public.user_roles'::regclass and not tgisinternal)
union all
select 'C-5 hay al menos un administrador',
       exists (select 1 from public.user_roles where role::text = 'admin')
union all
select 'N-4 lead_contacts conserva el filtro por asignación del 10',
       coalesce(pg_get_viewdef('public.lead_contacts'::regclass) like '%mdesr_crm_limited%', false)
union all
select 'N-4 client_contacts conserva el filtro por asignación del 10',
       coalesce(pg_get_viewdef('public.client_contacts'::regclass) like '%mdesr_crm_limited%', false)
union all
select 'N-4 políticas restrictivas "mdesr crm asignados" (deben ser 6)',
       (select count(*) = 6 from pg_policies where schemaname = 'public' and policyname = 'mdesr crm asignados'
          and tablename in ('clients','leads','deals','quotes','appointments','activities'));


-- ═══ REVERSIÓN (no se ejecuta; copiar y correr solo si hiciera falta) ══════
-- Devuelve exactamente lo que dejó el script 10. No toca datos.
--
--   drop trigger if exists user_roles_keep_admin on public.user_roles;
--   drop function if exists public.user_roles_keep_admin();
--
--   drop policy if exists "mdesr crm asignados" on public.clients;
--   create policy "mdesr crm asignados" on public.clients as restrictive for all to authenticated
--     using (not public.mdesr_crm_limited() or public.mdesr_client_assigned(id))
--     with check (not public.mdesr_crm_limited() or public.mdesr_client_assigned(id) or owner_id = auth.uid());
--
--   drop trigger if exists mdesr_guard_comment_update on public.review_comments;
--   drop function if exists public.mdesr_guard_comment_update();
--   drop policy if exists "mdesr atender" on public.review_comments;
--   create policy "mdesr atender" on public.review_comments for update to authenticated
--     using (public.mdesr_can_read(coalesce(public.mdesr_assessment_project(assessment_id),
--                                            (select d.project_id from public.documents d where d.id = document_id))))
--     with check (true);
--
--   drop trigger if exists mdesr_guard_member_update on public.project_members;
--   drop function if exists public.mdesr_guard_member_update();
--   drop policy if exists "mdesr dar de baja" on public.project_members;
--   create policy "mdesr dar de baja" on public.project_members for update to authenticated
--     using (public.has_capability(auth.uid(), 'admin.reassign_clients_projects')
--            or (project_function = 'revisor'
--                and public.mdesr_has_faculty('mdesr.assign_reviewer')
--                and 'consultor_validador' = any(public.mdesr_functions(project_id))))
--     with check (removed_at is null or coalesce(length(btrim(removal_reason)), 0) >= 5);
--
--   notify pgrst, 'reload schema';
--
-- Los cambios a 00 y 02 son solo de los archivos del repositorio: no hay nada
-- que revertir en la base.
