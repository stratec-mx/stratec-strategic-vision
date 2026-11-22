-- ═══════════════════════════════════════════════════════════════════════════
-- STRATEC · PROPUESTA 10 · M-DESR: modelo lógico (etapas E1 a E7)
--
--   ███  NO EJECUTADO  ███  NO EJECUTAR EN PRODUCCIÓN  ███
--
-- Estado: borrador de revisión que acompaña a docs/m-desr/02-modelo-logico.md.
-- No se ha corrido en ninguna base. Solo se revisó la sintaxis de PostgreSQL.
-- Antes de usarlo:
--   1. Partirlo en un archivo por etapa (E1…E7, ver sección 13 del documento).
--   2. Correrlo en el proyecto de Supabase DE PRUEBAS, con datos ficticios.
--   3. Verificar cada regla con usuarios simulados (como 04 y 05).
--   4. Solo el titular lo pega en producción, etapa por etapa.
--
-- Requisitos, en este orden: 02-tablas-y-permisos.sql, 08-rol-asesor.sql y
-- 09-consultor-y-facultades.sql (rol 'consultant', user_capabilities,
-- role_capabilities). Este script NO redefine nada de esos tres.
--
-- Criterio del titular (23-nov-2026), sustituye al del 22-nov:
--   · El Administrador TIENE las facultades técnicas por su rol (las da
--     has_capability() de 09 por role_capabilities('admin')). Puede elaborar,
--     validar, aprobar, rechazar y cerrar en cualquier proyecto, asignado o no.
--   · Su aprobación permite emitir el entregable.
--   · Cada acto suyo queda con authority_basis = 'administrador': el expediente
--     distingue siempre al Administrador del Consultor.
--   · Sigue sin poder aprobar lo que él mismo elaboró o modificó (regla de
--     autoría, igual para todos).
--   · Tiene además la facultad de reasignar clientes y proyectos a otros
--     asesores o consultores (mdesr.reassign, la agrega 09).
--   · La revisión técnica es opcional: si el proyecto tiene revisor asignado,
--     la versión pasa por él; si no, va directo a validación o aprobación.
--   · El Consultor solo ve sus proyectos; el Ejecutivo solo ve los documentos
--     asignados (políticas restrictivas sobre clients y documents, E5).
--   · El CRM no cambia para el admin: ve y hace todo.
--
-- Es aditivo: crea tablas, funciones, triggers y políticas nuevas. A la tabla
-- existente `documents` solo le agrega columnas opcionales y políticas
-- RESTRICTIVAS que afectan únicamente a los entregables de M-DESR.
--
-- OJO: si después se vuelve a correr 02, este borra TODAS las políticas de
-- `documents`. Hay que volver a pegar el bloque "E5 · políticas de documents".
--
-- Va en una sola consulta (el valor 'consultant' ya lo agregó 09).
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regprocedure('public.has_capability(uuid, text)') is null then
    raise exception 'Falta ejecutar 09-consultor-y-facultades.sql (has_capability).';
  end if;
  if to_regclass('public.access_rules') is null then
    raise exception 'Falta ejecutar 02-tablas-y-permisos.sql (access_rules).';
  end if;
end $$;

-- ═══ E1 · Núcleo ═══════════════════════════════════════

-- Facultades: las da 09-consultor-y-facultades.sql (user_capabilities, role_capabilities, has_capability).

create table if not exists public.methodology_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  title text not null,
  document_ref text,
  status text not null default 'borrador' check (status in ('borrador','publicada','retirada')),
  published_at timestamptz,
  published_by uuid references auth.users(id),
  change_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  quote_id uuid references public.quotes(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  sector_module text not null check (sector_module in ('residencial','empresarial_institucional','eventos_masivos','instalaciones_estrategicas')),
  objective text,
  scope text,
  status text not null default 'propuesta' check (status in ('propuesta','activo','suspendido','cerrado','cancelado')),
  current_phase smallint not null default 1 check (current_phase between 1 and 8),
  requires_independence boolean not null default true,
  start_date date,
  target_end_date date,
  closed_at timestamptz,
  owner_id uuid references auth.users(id) on delete set null default auth.uid(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_function text not null check (project_function in ('elaborador','revisor','consultor_validador','apoyo_campo','observador')),
  assigned_by uuid references auth.users(id) default auth.uid(),
  assigned_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users(id),
  notes text
);
create unique index if not exists project_members_active_key
  on public.project_members (project_id, user_id, project_function) where removed_at is null;
create index if not exists project_members_user_idx on public.project_members (user_id) where removed_at is null;

create table if not exists public.project_phases (
  project_id uuid not null references public.projects(id) on delete cascade,
  phase smallint not null check (phase between 1 and 8),
  status text not null default 'pendiente' check (status in ('pendiente','en_curso','completada','no_aplica')),
  started_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (project_id, phase),
  check (status <> 'no_aplica' or coalesce(btrim(notes), '') <> '')
);

create table if not exists public.study_objects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  object_type text not null check (object_type in ('residencia','empresa','institucion','instalacion_estrategica','evento_masivo','otro')),
  sector_module text not null check (sector_module in ('residencial','empresarial_institucional','eventos_masivos','instalaciones_estrategicas')),
  description text,
  fixed_population integer check (fixed_population >= 0),
  floating_population integer check (floating_population >= 0),
  operating_hours text,
  event_start timestamptz,
  event_end timestamptz,
  expected_attendance integer check (expected_attendance >= 0),
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (event_end is null or event_start is null or event_end >= event_start)
);

create table if not exists public.project_study_objects (
  project_id uuid not null references public.projects(id) on delete cascade,
  study_object_id uuid not null references public.study_objects(id) on delete restrict,
  is_primary boolean not null default true,
  primary key (project_id, study_object_id)
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  study_object_id uuid not null references public.study_objects(id) on delete cascade,
  name text not null,
  address_line text, neighborhood text, municipality text, state text, postal_code text,
  country text not null default 'MX',
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  geo_precision text check (geo_precision in ('exacta','aproximada','municipio')),
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists sites_one_primary on public.sites (study_object_id) where is_primary;

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  parent_area_id uuid references public.areas(id) on delete set null,
  name text not null,
  area_type text not null default 'otro' check (area_type in ('acceso','perimetro','estacionamiento','oficinas','produccion','almacen','cuarto_maquinas','site_telecom','area_critica','zona_publico','escenario','backstage','interior_residencial','exterior','otro')),
  criticality smallint check (criticality between 1 and 5),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, name)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  study_object_id uuid not null references public.study_objects(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  name text not null,
  asset_type text not null check (asset_type in ('personas','instalaciones','equipos','informacion','procesos','bienes_valor','reputacion','otro')),
  criticality smallint not null default 3 check (criticality between 1 and 5),
  description text,
  owner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_log_entries (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  assessment_id uuid,  -- FK se agrega en E3, cuando existe assessments
  entry_type text not null default 'nota' check (entry_type in ('visita','entrevista','reunion','revision_documental','incidente','decision','nota')),
  occurred_at timestamptz not null default now(),
  summary text not null,
  details text,
  appointment_id uuid references public.appointments(id) on delete set null,
  author_id uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default clock_timestamp(),
  actor_id uuid default auth.uid(),
  table_name text not null,
  record_id text not null,
  project_id uuid,
  assessment_id uuid,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  via_transition boolean not null default false,  -- lo escribió mdesr_transition (no cuenta como autoría)
  old_data jsonb,
  new_data jsonb,
  changed_fields text[]
);
create index if not exists audit_log_assessment_idx on public.audit_log (assessment_id, actor_id, occurred_at);
create index if not exists audit_log_record_idx on public.audit_log (table_name, record_id, occurred_at);
create index if not exists audit_log_project_idx on public.audit_log (project_id, occurred_at desc);

-- ── Funciones de facultades y membresía (security definer: sin recursión) ──
create or replace function public.mdesr_has_faculty(_faculty text, _user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
  -- Fuente única: has_capability() del script 09 (versión da728e8). Ya no tiene
  -- atajo de admin y exige el rol consultant para validate, approve y close.
  select public.has_capability(_user, _faculty)
$$;

create or replace function public.mdesr_functions(_project uuid, _user uuid default auth.uid())
returns text[] language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(project_function), '{}')
  from public.project_members
  where project_id = _project and user_id = _user and removed_at is null
$$;

create or replace function public.mdesr_is_member(_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select cardinality(public.mdesr_functions(_project)) > 0 $$;

-- Leer un proyecto: sus miembros y el Administrador (decisión del titular).
create or replace function public.mdesr_can_read(_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select _project is not null and (public.mdesr_is_member(_project) or public.has_role(auth.uid(), 'admin')) $$;

-- ¿Con qué autoridad actúa _user para una facultad en un proyecto?
--   administrador     es admin y tiene la facultad (por su rol); asignado o no
--   funcion_asignada  tiene la función en el proyecto y la facultad por su rol técnico
--   facultad_expresa  tiene la función y la facultad dada a su persona en user_capabilities
--   null              no puede
create or replace function public.mdesr_authority(_project uuid, _functions text[], _faculty text, _user uuid default auth.uid())
returns text language sql stable security definer set search_path = public
as $$
  select case
    when public.has_role(_user, 'admin') and public.has_capability(_user, _faculty)
      then 'administrador'
    when public.mdesr_functions(_project, _user) && _functions
         and public.has_capability(_user, _faculty)
         and exists (select 1 from public.user_roles ur
                     where ur.user_id = _user and _faculty = any (public.role_capabilities(ur.role::text)))
      then 'funcion_asignada'
    when public.mdesr_functions(_project, _user) && _functions
         and public.has_capability(_user, _faculty)
      then 'facultad_expresa'
    else null
  end
$$;

create or replace function public.mdesr_can_read_object(_object uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.project_study_objects pso
                 where pso.study_object_id = _object and public.mdesr_can_read(pso.project_id))
      or exists (select 1 from public.study_objects so
                 where so.id = _object and so.created_by = auth.uid()
                   and not exists (select 1 from public.project_study_objects x where x.study_object_id = so.id))
$$;

create or replace function public.mdesr_can_edit_object(_object uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.mdesr_can_read_object(_object) and public.mdesr_has_faculty('mdesr.prepare') $$;

create or replace function public.mdesr_try_uuid(_t text)
returns uuid language plpgsql immutable
as $$ begin return _t::uuid; exception when others then return null; end $$;

-- Rango de niveles de riesgo para comparar
create or replace function public.mdesr_level_rank(_level text)
returns int language sql immutable
as $$ select case _level when 'bajo' then 1 when 'medio' then 2 when 'alto' then 3 when 'critico' then 4 else 0 end $$;

-- ── Triggers del núcleo ────────────────────────────────────────────────────
-- 8 fases al crear un proyecto; si lo crea un Consultor, queda como validador.
create or replace function public.mdesr_project_after_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.project_phases (project_id, phase)
  select new.id, g from generate_series(1, 8) g on conflict do nothing;
  if auth.uid() is not null and public.has_role(auth.uid(), 'consultant') then
    insert into public.project_members (project_id, user_id, project_function)
    values (new.id, auth.uid(), 'consultor_validador') on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists mdesr_project_after_insert on public.projects;
create trigger mdesr_project_after_insert after insert on public.projects
  for each row execute function public.mdesr_project_after_insert();

-- R-01: objeto del mismo cliente; demo solo con demo
create or replace function public.mdesr_check_project_object()
returns trigger language plpgsql security definer set search_path = public
as $$
declare p record; o record;
begin
  select client_id, is_demo into p from public.projects where id = new.project_id;
  select client_id, is_demo into o from public.study_objects where id = new.study_object_id;
  if p.client_id <> o.client_id then
    raise exception 'El objeto de estudio es de otro cliente.';
  end if;
  if p.is_demo <> o.is_demo then
    raise exception 'Un proyecto de demostración solo usa objetos de demostración (y viceversa).';
  end if;
  return new;
end $$;
drop trigger if exists mdesr_check_project_object on public.project_study_objects;
create trigger mdesr_check_project_object before insert or update on public.project_study_objects
  for each row execute function public.mdesr_check_project_object();

-- R-02: sub-área en la misma ubicación; área del activo en el mismo objeto
create or replace function public.mdesr_check_area_asset()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_table_name = 'areas' and new.parent_area_id is not null then
    if not exists (select 1 from public.areas where id = new.parent_area_id and site_id = new.site_id) then
      raise exception 'La sub-área debe estar en la misma ubicación.';
    end if;
  elsif tg_table_name = 'assets' and new.area_id is not null then
    if not exists (select 1 from public.areas a join public.sites s on s.id = a.site_id
                   where a.id = new.area_id and s.study_object_id = new.study_object_id) then
      raise exception 'El área del activo debe ser del mismo objeto de estudio.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists mdesr_check_area on public.areas;
create trigger mdesr_check_area before insert or update on public.areas
  for each row execute function public.mdesr_check_area_asset();
drop trigger if exists mdesr_check_asset on public.assets;
create trigger mdesr_check_asset before insert or update on public.assets
  for each row execute function public.mdesr_check_area_asset();

-- Miembros: la persona debe tener la facultad que pide su función (5.4)
create or replace function public.mdesr_check_member()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.removed_at is not null then return new; end if;
  if (new.project_function in ('elaborador','apoyo_campo') and not public.mdesr_has_faculty('mdesr.prepare', new.user_id))
     or (new.project_function = 'revisor' and not public.mdesr_has_faculty('mdesr.review', new.user_id))
     or (new.project_function = 'consultor_validador'
         and not ((public.has_role(new.user_id, 'consultant') or public.has_role(new.user_id, 'admin'))
                  and (public.mdesr_has_faculty('mdesr.validate', new.user_id) or public.mdesr_has_faculty('mdesr.approve', new.user_id)))) then
    raise exception 'La persona no tiene la facultad que requiere la función %.', new.project_function;
  end if;
  return new;
end $$;
drop trigger if exists mdesr_check_member on public.project_members;
create trigger mdesr_check_member before insert or update on public.project_members
  for each row execute function public.mdesr_check_member();


-- R-17: tablas que solo crecen
create or replace function public.mdesr_append_only()
returns trigger language plpgsql
as $$
begin
  if coalesce(current_setting('mdesr.internal', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  raise exception 'La tabla % solo admite agregar registros.', tg_table_name;
end $$;
drop trigger if exists mdesr_append_only on public.project_log_entries;
create trigger mdesr_append_only before update or delete on public.project_log_entries
  for each row execute function public.mdesr_append_only();
drop trigger if exists mdesr_append_only on public.audit_log;
create trigger mdesr_append_only before update or delete on public.audit_log
  for each row execute function public.mdesr_append_only();

-- Vista para el Consultor: sus proyectos con el nombre del cliente,
-- sin abrirle toda la tabla de clientes (D-16).
create or replace view public.mdesr_project_overview as
  select p.id, p.code, p.name, p.status, p.current_phase, p.sector_module, p.is_demo,
         p.client_id, c.name as client_name, p.start_date, p.target_end_date
  from public.projects p join public.clients c on c.id = p.client_id
  where public.mdesr_can_read(p.id) or public.has_role(auth.uid(), 'admin');

-- Las filas de access_rules del Consultor y del Ejecutivo las pone 09. Ver la revisión cruzada (hallazgo H-01).

-- ═══ E2 · Biblioteca metodológica ══════════════════════════════════════════

create table if not exists public.normative_references (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  issuer text,
  edition_year smallint,
  reference_type text not null check (reference_type in ('norma_internacional','norma_mexicana','ley','reglamento','guia_oficial','buena_practica')),
  jurisdiction text not null check (jurisdiction in ('internacional','federal','estatal','municipal')),
  url text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind text not null check (kind in ('maestro','modulo_sectorial','version_corta_web')),
  sector_module text check (sector_module in ('residencial','empresarial_institucional','eventos_masivos','instalaciones_estrategicas')),
  web_type text check (web_type in ('negocio','casa','evento')),
  parent_instrument_id uuid references public.instruments(id) on delete restrict,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind <> 'modulo_sectorial' or sector_module is not null),
  check (kind <> 'version_corta_web' or web_type is not null)
);

create table if not exists public.instrument_versions (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete restrict,
  methodology_version_id uuid not null references public.methodology_versions(id) on delete restrict,
  version_label text not null,
  status text not null default 'borrador' check (status in ('borrador','publicada','retirada')),
  published_at timestamptz,
  published_by uuid references auth.users(id),
  change_notes text,
  content_hash text,
  created_at timestamptz not null default now(),
  unique (instrument_id, version_label)
);

create table if not exists public.instrument_sections (
  id uuid primary key default gen_random_uuid(),
  instrument_version_id uuid not null references public.instrument_versions(id) on delete cascade,
  code text not null,
  title text not null,
  methodology_level text not null check (methodology_level in ('contexto','diagnostico','evaluacion','intervencion')),
  phase smallint not null check (phase between 1 and 8),
  sort_order integer not null default 0,
  unique (instrument_version_id, code)
);

create table if not exists public.criteria (
  id uuid primary key default gen_random_uuid(),
  instrument_version_id uuid not null references public.instrument_versions(id) on delete cascade,
  section_id uuid not null references public.instrument_sections(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  unique (instrument_version_id, code)
);

create table if not exists public.criterion_references (
  criterion_id uuid not null references public.criteria(id) on delete cascade,
  normative_reference_id uuid not null references public.normative_references(id) on delete restrict,
  clause text,
  primary key (criterion_id, normative_reference_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  instrument_version_id uuid not null references public.instrument_versions(id) on delete cascade,
  section_id uuid not null references public.instrument_sections(id) on delete cascade,
  criterion_id uuid references public.criteria(id) on delete set null,
  code text not null,
  text text not null,
  help_text text,
  answer_type text not null default 'si_no_ns' check (answer_type in ('si_no_ns','escala_1_5','opcion_unica','opcion_multiple','numero','texto','fecha')),
  options jsonb,
  weight numeric(6,2) not null default 1 check (weight >= 0),
  is_critical boolean not null default false,
  requires_evidence boolean not null default false,
  applies_by_area boolean not null default false,
  legacy_web_id smallint,
  sort_order integer not null default 0,
  unique (instrument_version_id, code),
  check (answer_type not in ('opcion_unica','opcion_multiple') or jsonb_typeof(options) = 'array')
);

create table if not exists public.question_equivalences (
  web_question_id uuid not null references public.questions(id) on delete cascade,
  master_question_id uuid not null references public.questions(id) on delete cascade,
  mapping_note text,
  primary key (web_question_id, master_question_id)
);

create table if not exists public.risk_scales (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);

create table if not exists public.risk_scale_versions (
  id uuid primary key default gen_random_uuid(),
  risk_scale_id uuid not null references public.risk_scales(id) on delete restrict,
  methodology_version_id uuid not null references public.methodology_versions(id) on delete restrict,
  version_label text not null,
  probability_levels smallint not null default 5,
  impact_levels smallint not null default 5,
  status text not null default 'borrador' check (status in ('borrador','publicada','retirada')),
  published_at timestamptz,
  published_by uuid references auth.users(id),
  change_notes text,
  created_at timestamptz not null default now(),
  unique (risk_scale_id, version_label)
);

create table if not exists public.risk_scale_levels (
  id uuid primary key default gen_random_uuid(),
  scale_version_id uuid not null references public.risk_scale_versions(id) on delete cascade,
  axis text not null check (axis in ('probabilidad','impacto')),
  value smallint not null check (value between 1 and 5),
  label text not null,
  descriptor text,
  unique (scale_version_id, axis, value)
);

create table if not exists public.risk_level_bands (
  id uuid primary key default gen_random_uuid(),
  scale_version_id uuid not null references public.risk_scale_versions(id) on delete cascade,
  level_code text not null check (level_code in ('bajo','medio','alto','critico')),
  label text not null,
  min_score smallint not null,
  max_score smallint not null,
  color_hex text,
  required_response text,
  unique (scale_version_id, level_code),
  check (min_score <= max_score)
);

create table if not exists public.escalation_rules (
  id uuid primary key default gen_random_uuid(),
  scale_version_id uuid not null references public.risk_scale_versions(id) on delete cascade,
  criterion text not null check (criterion in ('vida_humana','evacuacion','integridad_estructural','cumplimiento_legal')),
  minimum_level text not null check (minimum_level in ('bajo','medio','alto','critico')),
  description text not null,
  unique (scale_version_id, criterion)
);

create table if not exists public.threat_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  phenomenon text not null check (phenomenon in ('geologico','hidrometeorologico','quimico_tecnologico','sanitario_ecologico','socio_organizativo','astronomico','delictivo','informatico')),
  description text,
  sector_modules text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- R-08: lo publicado no se toca. Se aplica a la versión y a todo lo que cuelga de ella.
create or replace function public.mdesr_guard_library()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  r jsonb := to_jsonb(coalesce(new, old));
  st text;
begin
  if coalesce(current_setting('mdesr.internal', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  if tg_table_name in ('methodology_versions','instrument_versions','risk_scale_versions') then
    st := (to_jsonb(old) ->> 'status');
    if tg_op <> 'INSERT' and st <> 'borrador' then
      raise exception 'Esta versión ya está %: no se modifica. Crea una versión nueva.', st;
    end if;
    if tg_op <> 'DELETE' and (to_jsonb(new) ->> 'status') <> 'borrador' then
      raise exception 'Para publicar o retirar usa la función de publicación.';
    end if;
    return coalesce(new, old);
  end if;
  if tg_table_name in ('instrument_sections','criteria','questions') then
    select status into st from public.instrument_versions where id = (r ->> 'instrument_version_id')::uuid;
  elsif tg_table_name = 'criterion_references' then
    select v.status into st from public.criteria c join public.instrument_versions v on v.id = c.instrument_version_id
    where c.id = (r ->> 'criterion_id')::uuid;
  elsif tg_table_name in ('risk_scale_levels','risk_level_bands','escalation_rules') then
    select status into st from public.risk_scale_versions where id = (r ->> 'scale_version_id')::uuid;
  end if;
  if st is distinct from 'borrador' then
    raise exception 'La versión a la que pertenece este registro ya está publicada o retirada.';
  end if;
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['methodology_versions','instrument_versions','risk_scale_versions','instrument_sections',
                           'criteria','questions','criterion_references','risk_scale_levels','risk_level_bands','escalation_rules']
  loop
    execute format('drop trigger if exists mdesr_guard_library on public.%I', t);
    execute format('create trigger mdesr_guard_library before insert or update or delete on public.%I
                    for each row execute function public.mdesr_guard_library()', t);
  end loop;
end $$;

-- Publicación con comprobaciones (R-08). Solo quien tiene mdesr.manage_instruments.
create or replace function public.mdesr_publish(_kind text, _id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare n int; huecos int;
begin
  if not public.mdesr_has_faculty('mdesr.manage_instruments') then
    raise exception 'Se requiere la facultad mdesr.manage_instruments.';
  end if;
  perform set_config('mdesr.internal', 'on', true);
  if _kind = 'metodologia' then
    update public.methodology_versions set status = 'publicada', published_at = now(), published_by = auth.uid()
    where id = _id and status = 'borrador';
  elsif _kind = 'instrumento' then
    if exists (select 1 from public.instrument_versions v join public.methodology_versions m on m.id = v.methodology_version_id
               where v.id = _id and m.status <> 'publicada') then
      raise exception 'Primero publica la versión de la metodología.';
    end if;
    select count(*) into n from public.questions where instrument_version_id = _id;
    if n = 0 then raise exception 'El instrumento no tiene preguntas.'; end if;
    update public.instrument_versions
       set status = 'publicada', published_at = now(), published_by = auth.uid(),
           content_hash = (select md5(coalesce(string_agg(q.code || '|' || q.text || '|' || q.answer_type || '|' || q.weight::text, '§' order by q.code), ''))
                           from public.questions q where q.instrument_version_id = _id)
     where id = _id and status = 'borrador';
  elsif _kind = 'escala' then
    select count(*) into n from public.risk_scale_levels where scale_version_id = _id;
    if n <> 10 then raise exception 'La escala debe tener 5 niveles de probabilidad y 5 de impacto.'; end if;
    select count(*) into n from public.escalation_rules where scale_version_id = _id;
    if n <> 4 then raise exception 'La escala debe tener las 4 reglas de escalamiento.'; end if;
    -- Bandas: cada puntaje de 1 a 25 en una y solo una banda
    select count(*) into huecos from generate_series(1, 25) s
     where (select count(*) from public.risk_level_bands b
             where b.scale_version_id = _id and s between b.min_score and b.max_score) <> 1;
    if huecos > 0 then raise exception 'Las bandas de nivel tienen huecos o traslapes entre 1 y 25.'; end if;
    update public.risk_scale_versions set status = 'publicada', published_at = now(), published_by = auth.uid()
    where id = _id and status = 'borrador';
  else
    raise exception 'Tipo desconocido: %', _kind;
  end if;
  perform set_config('mdesr.internal', 'off', true);
end $$;

-- ═══ E3 · Diagnóstico y evidencia ══════════════════════════════════════════

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  study_object_id uuid not null references public.study_objects(id) on delete restrict,
  code text not null unique,
  kind text not null default 'diagnostico_inicial' check (kind in ('diagnostico_inicial','rediagnostico','seguimiento')),
  previous_assessment_id uuid references public.assessments(id) on delete restrict,
  methodology_version_id uuid not null references public.methodology_versions(id) on delete restrict,
  risk_scale_version_id uuid not null references public.risk_scale_versions(id) on delete restrict,
  status text not null default 'borrador' check (status in ('borrador','enviado','en_revision','devuelto','revisado','validado','aprobado','cerrado','rechazado')),
  revision_no integer not null default 1,
  revision_started_at timestamptz not null default now(),
  fieldwork_start date,
  fieldwork_end date,
  summary text,
  overall_level text check (overall_level in ('bajo','medio','alto','critico')),
  content_hash text,
  validation_basis text check (validation_basis in ('funcion_asignada','facultad_expresa','administrador')),
  approval_basis text check (approval_basis in ('funcion_asignada','facultad_expresa','administrador')),
  closed_at timestamptz,
  closed_by uuid references auth.users(id),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'rediagnostico' or previous_assessment_id is not null)
);

alter table public.project_log_entries drop constraint if exists project_log_entries_assessment_fk;
alter table public.project_log_entries add constraint project_log_entries_assessment_fk
  foreign key (assessment_id) references public.assessments(id) on delete set null;

create table if not exists public.assessment_instruments (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  instrument_version_id uuid not null references public.instrument_versions(id) on delete restrict,
  primary key (assessment_id, instrument_version_id)
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  area_id uuid references public.areas(id) on delete restrict,
  answer_value text,
  answer_numeric numeric,
  answer_options jsonb,
  not_applicable boolean not null default false,
  comment text,
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  answered_by uuid references auth.users(id) default auth.uid(),
  answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists responses_unique_key on public.responses
  (assessment_id, question_id, coalesce(area_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists public.information_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  institution text not null,
  document_title text not null,
  url text,
  publication_date date,
  period_covered text,
  consulted_at date not null,
  geographic_scope text not null check (geographic_scope in ('internacional','nacional','estatal','municipal','local','inmueble')),
  reliability text not null check (reliability in ('alta','media','baja')),
  source_type text not null check (source_type in ('oficial','academica','prensa','organismo_privado','cliente','observacion_propia')),
  notes text,
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.pestel_factors (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  dimension text not null check (dimension in ('politico','economico','social','tecnologico','ecologico','legal')),
  title text not null,
  description text not null,
  effect text not null default 'neutral' check (effect in ('amenaza','oportunidad','neutral')),
  relevance smallint not null default 3 check (relevance between 1 and 5),
  time_horizon text check (time_horizon in ('corto','mediano','largo')),
  trend text check (trend in ('al_alza','estable','a_la_baja','incierta')),
  has_statistics boolean not null default false,
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pestel_factor_sources (
  pestel_factor_id uuid not null references public.pestel_factors(id) on delete cascade,
  source_id uuid not null references public.information_sources(id) on delete restrict,
  citation_detail text,
  primary key (pestel_factor_id, source_id)
);

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  finding_type text not null check (finding_type in ('vulnerabilidad_observada','incumplimiento','buena_practica','observacion','oportunidad_mejora')),
  severity text check (severity in ('baja','media','alta','critica')),
  area_id uuid references public.areas(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  question_id uuid references public.questions(id) on delete set null,
  criterion_id uuid references public.criteria(id) on delete set null,
  observed_at timestamptz,
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, code),
  check (finding_type = 'buena_practica' or severity is not null)
);

create table if not exists public.threats (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  threat_catalog_id uuid references public.threat_catalog(id) on delete restrict,
  name text not null,
  phenomenon text not null check (phenomenon in ('geologico','hidrometeorologico','quimico_tecnologico','sanitario_ecologico','socio_organizativo','astronomico','delictivo','informatico')),
  description text,
  is_intentional boolean not null default false,
  pestel_factor_id uuid references public.pestel_factors(id) on delete set null,
  has_statistics boolean not null default false,
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.threat_sources (
  threat_id uuid not null references public.threats(id) on delete cascade,
  source_id uuid not null references public.information_sources(id) on delete restrict,
  citation_detail text,
  primary key (threat_id, source_id)
);

create table if not exists public.vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  code text not null,
  description text not null,
  vulnerability_type text not null check (vulnerability_type in ('fisica','organizacional','tecnologica','procedimental','humana','entorno')),
  area_id uuid references public.areas(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, code)
);

create table if not exists public.vulnerability_findings (
  vulnerability_id uuid not null references public.vulnerabilities(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade,
  primary key (vulnerability_id, finding_id)
);

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  assessment_id uuid references public.assessments(id) on delete restrict,
  storage_bucket text not null default 'mdesr-evidencias' check (storage_bucket = 'mdesr-evidencias'),
  storage_path text not null unique,
  original_filename text,
  mime_type text not null,
  size_bytes bigint check (size_bytes > 0),
  sha256 text,
  evidence_type text not null default 'foto' check (evidence_type in ('foto','video','audio','documento','captura_pantalla','plano')),
  captured_at timestamptz,
  captured_by uuid not null references auth.users(id) default auth.uid(),
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  description text,
  contains_personal_data boolean not null default false,
  status text not null default 'activa' check (status in ('activa','retirada')),
  created_at timestamptz not null default now(),
  -- R-13: la ruta empieza con {project_id}/{id}
  check (storage_path like project_id::text || '/' || id::text || '%')
);

create table if not exists public.finding_evidence (
  finding_id uuid not null references public.findings(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  primary key (finding_id, evidence_id)
);

create table if not exists public.response_evidence (
  response_id uuid not null references public.responses(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  primary key (response_id, evidence_id)
);

-- Resolver el diagnóstico de un registro (directo o por la tabla padre)
create or replace function public.mdesr_parent_assessment(_parent text, _id uuid)
returns uuid language plpgsql stable security definer set search_path = public
as $$
declare r uuid;
begin
  if _id is null then return null; end if;
  execute format('select assessment_id from public.%I where id = $1', _parent) into r using _id;
  return r;
end $$;

create or replace function public.mdesr_row_assessment(_row jsonb, _parent text, _fk text)
returns uuid language plpgsql stable security definer set search_path = public
as $$
begin
  if _row ? 'assessment_id' then return (_row ->> 'assessment_id')::uuid; end if;
  if _parent is null or _parent = '' then return null; end if;
  return public.mdesr_parent_assessment(_parent, (_row ->> _fk)::uuid);
end $$;

create or replace function public.mdesr_assessment_project(_assessment uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select project_id from public.assessments where id = _assessment $$;

create or replace function public.mdesr_can_prepare(_assessment uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select (public.has_role(auth.uid(), 'admin') and public.mdesr_has_faculty('mdesr.prepare')
          and exists (select 1 from public.assessments a join public.projects p on p.id = a.project_id
                      where a.id = _assessment and a.status = 'borrador' and p.status = 'activo'))
      or public.mdesr_has_faculty('mdesr.prepare')
     and exists (select 1
                 from public.assessments a
                 join public.projects p on p.id = a.project_id
                 join public.project_members pm on pm.project_id = a.project_id
                 where a.id = _assessment and a.status = 'borrador' and p.status = 'activo'
                   and pm.user_id = auth.uid() and pm.removed_at is null
                   and pm.project_function in ('elaborador','apoyo_campo','consultor_validador'))
$$;

-- R-02, R-09, R-15: candado de contenido del diagnóstico.
-- Argumentos del trigger: tabla padre y columna FK (vacíos si la fila tiene assessment_id).
create or replace function public.mdesr_guard_content()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  r jsonb := to_jsonb(coalesce(new, old));
  a_id uuid := public.mdesr_row_assessment(r, tg_argv[0], tg_argv[1]);
  a record;
begin
  if a_id is null then return coalesce(new, old); end if;
  select status, study_object_id into a from public.assessments where id = a_id;
  if a.status = 'cerrado' then
    raise exception 'El diagnóstico está cerrado: no se puede modificar.';
  end if;
  if a.status <> 'borrador' and coalesce(current_setting('mdesr.internal', true), '') <> 'on' then
    raise exception 'El diagnóstico está "%": para cambiar contenido hay que reabrirlo (versión nueva).', a.status;
  end if;
  if tg_op <> 'DELETE' then
    -- R-02: el área y el activo deben ser del objeto de estudio del diagnóstico
    if (r ? 'area_id') and (r ->> 'area_id') is not null and not exists (
         select 1 from public.areas ar join public.sites s on s.id = ar.site_id
         where ar.id = (r ->> 'area_id')::uuid and s.study_object_id = a.study_object_id) then
      raise exception 'El área no pertenece al objeto de estudio del diagnóstico.';
    end if;
    if (r ? 'asset_id') and (r ->> 'asset_id') is not null and not exists (
         select 1 from public.assets x where x.id = (r ->> 'asset_id')::uuid and x.study_object_id = a.study_object_id) then
      raise exception 'El activo no pertenece al objeto de estudio del diagnóstico.';
    end if;
    -- R-15: lo que propone la IA entra como propuesta
    if tg_op = 'INSERT' and (r ->> 'origin') = 'ia_propuesta' then
      new := jsonb_populate_record(new, jsonb_build_object('review_status', 'propuesta'));
    end if;
  end if;
  return coalesce(new, old);
end $$;

-- R-07: versiones publicadas y respuestas a preguntas del diagnóstico
create or replace function public.mdesr_check_assessment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_table_name = 'assessments' then
    if tg_op = 'INSERT' then
      if not exists (select 1 from public.project_study_objects
                     where project_id = new.project_id and study_object_id = new.study_object_id) then
        raise exception 'El objeto de estudio no está ligado al proyecto.';
      end if;
      if not exists (select 1 from public.methodology_versions where id = new.methodology_version_id and status = 'publicada')
         or not exists (select 1 from public.risk_scale_versions where id = new.risk_scale_version_id and status = 'publicada') then
        raise exception 'El diagnóstico solo usa versiones publicadas de la metodología y de la escala.';
      end if;
      new.status := 'borrador';
      new.revision_no := 1;
      new.revision_started_at := now();
    else
      if coalesce(current_setting('mdesr.internal', true), '') <> 'on' then
        if old.status = 'cerrado' then
          raise exception 'El diagnóstico está cerrado: no se puede modificar.';
        end if;
        if new.status is distinct from old.status or new.revision_no is distinct from old.revision_no
           or new.revision_started_at is distinct from old.revision_started_at
           or new.closed_at is distinct from old.closed_at or new.content_hash is distinct from old.content_hash then
          raise exception 'El estado y la versión solo cambian con mdesr_transition.';
        end if;
        if old.status <> 'borrador' then
          raise exception 'El diagnóstico está "%": para cambiarlo hay que reabrirlo.', old.status;
        end if;
      end if;
      if new.methodology_version_id is distinct from old.methodology_version_id
         or new.risk_scale_version_id is distinct from old.risk_scale_version_id
         or new.project_id is distinct from old.project_id
         or new.study_object_id is distinct from old.study_object_id then
        raise exception 'Las versiones, el proyecto y el objeto de estudio de un diagnóstico no cambian.';
      end if;
    end if;
  elsif tg_table_name = 'assessment_instruments' then
    if not exists (select 1 from public.instrument_versions where id = new.instrument_version_id and status = 'publicada') then
      raise exception 'Solo se usan versiones publicadas del instrumento.';
    end if;
  elsif tg_table_name = 'responses' then
    if not exists (select 1 from public.questions q
                   join public.assessment_instruments ai on ai.instrument_version_id = q.instrument_version_id
                   where q.id = new.question_id and ai.assessment_id = new.assessment_id) then
      raise exception 'La pregunta no es de los instrumentos del diagnóstico.';
    end if;
    if new.area_id is null and exists (select 1 from public.questions where id = new.question_id and applies_by_area) then
      raise exception 'Esta pregunta se contesta por área: falta el área.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists mdesr_check_assessment on public.assessments;
create trigger mdesr_check_assessment before insert or update on public.assessments
  for each row execute function public.mdesr_check_assessment();
drop trigger if exists mdesr_check_assessment on public.assessment_instruments;
create trigger mdesr_check_assessment before insert or update on public.assessment_instruments
  for each row execute function public.mdesr_check_assessment();
drop trigger if exists mdesr_check_assessment on public.responses;
create trigger mdesr_check_assessment before insert or update on public.responses
  for each row execute function public.mdesr_check_assessment();

-- R-19: las fuentes las da de alta una persona con sesión (la IA no)
create or replace function public.mdesr_check_source()
returns trigger language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'Las fuentes solo las registra una persona con sesión iniciada.';
  end if;
  new.created_by := auth.uid();
  return new;
end $$;
drop trigger if exists mdesr_check_source on public.information_sources;
create trigger mdesr_check_source before insert on public.information_sources
  for each row execute function public.mdesr_check_source();

-- R-14: la evidencia no se borra; se retira
create or replace function public.mdesr_guard_evidence()
returns trigger language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'La evidencia no se borra: márcala como retirada.';
  end if;
  if (to_jsonb(new) - 'status' - 'description' - 'contains_personal_data')
     is distinct from (to_jsonb(old) - 'status' - 'description' - 'contains_personal_data') then
    raise exception 'De una evidencia solo cambian su estado, su descripción y la marca de datos personales.';
  end if;
  return new;
end $$;
drop trigger if exists mdesr_guard_evidence on public.evidence;
create trigger mdesr_guard_evidence before update or delete on public.evidence
  for each row execute function public.mdesr_guard_evidence();

-- Bucket privado de evidencias (R-13). Ruta: {project_id}/{evidence_id}.{ext}
insert into storage.buckets (id, name, public) values ('mdesr-evidencias', 'mdesr-evidencias', false)
on conflict (id) do nothing;
drop policy if exists "mdesr evidencias leer" on storage.objects;
create policy "mdesr evidencias leer" on storage.objects for select to authenticated
  using (bucket_id = 'mdesr-evidencias'
         and public.mdesr_can_read(public.mdesr_try_uuid((storage.foldername(name))[1])));
drop policy if exists "mdesr evidencias subir" on storage.objects;
create policy "mdesr evidencias subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'mdesr-evidencias'
              and public.mdesr_has_faculty('mdesr.prepare')
              and public.mdesr_can_read(public.mdesr_try_uuid((storage.foldername(name))[1])));
-- Sin políticas de update ni delete: los archivos no se reemplazan ni se borran desde el panel.

-- ═══ E4 · Riesgo e intervención ════════════════════════════════════════════

create table if not exists public.risk_scenarios (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  code text not null,
  title text not null,
  threat_id uuid not null references public.threats(id) on delete restrict,
  cause text,
  description text,
  consequence text not null,
  area_id uuid references public.areas(id) on delete set null,
  priority_rank integer,
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, code)
);

create table if not exists public.risk_scenario_vulnerabilities (
  risk_scenario_id uuid not null references public.risk_scenarios(id) on delete cascade,
  vulnerability_id uuid not null references public.vulnerabilities(id) on delete cascade,
  primary key (risk_scenario_id, vulnerability_id)
);
create table if not exists public.risk_scenario_assets (
  risk_scenario_id uuid not null references public.risk_scenarios(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  primary key (risk_scenario_id, asset_id)
);
create table if not exists public.risk_scenario_findings (
  risk_scenario_id uuid not null references public.risk_scenarios(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade,
  primary key (risk_scenario_id, finding_id)
);

create table if not exists public.controls (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  control_nature text not null check (control_nature in ('preventivo','detectivo','correctivo','disuasivo')),
  control_line text not null check (control_line in ('organizacional','fisico','tecnologico','procedimental','capacitacion')),
  status text not null default 'existente' check (status in ('existente','propuesto')),
  area_id uuid references public.areas(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, code)
);

create table if not exists public.risk_scenario_controls (
  risk_scenario_id uuid not null references public.risk_scenarios(id) on delete cascade,
  control_id uuid not null references public.controls(id) on delete cascade,
  primary key (risk_scenario_id, control_id)
);

create table if not exists public.control_effectiveness_reviews (
  id uuid primary key default gen_random_uuid(),
  control_id uuid not null references public.controls(id) on delete restrict,
  rating text not null check (rating in ('inexistente','deficiente','parcial','adecuada','efectiva')),
  method text not null check (method in ('observacion','prueba','entrevista','revision_documental')),
  justification text not null check (length(btrim(justification)) >= 10),
  evidence_id uuid references public.evidence(id) on delete restrict,
  evaluated_by uuid not null references auth.users(id) default auth.uid(),
  evaluated_at timestamptz not null default now()
);

create table if not exists public.risk_evaluations (
  id uuid primary key default gen_random_uuid(),
  risk_scenario_id uuid not null references public.risk_scenarios(id) on delete restrict,
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  assessment_revision_no integer not null default 0,  -- lo pone el trigger
  evaluation_type text not null check (evaluation_type in ('inherente','residual')),
  probability smallint not null check (probability between 1 and 5),
  impact smallint not null check (impact between 1 and 5),
  score smallint generated always as (probability * impact) stored,
  calculated_level text not null default 'bajo' check (calculated_level in ('bajo','medio','alto','critico')),
  affects_life boolean not null default false,
  requires_evacuation boolean not null default false,
  structural_integrity boolean not null default false,
  legal_compliance boolean not null default false,
  final_level text not null default 'bajo' check (final_level in ('bajo','medio','alto','critico')),
  escalation_applied text[] not null default '{}',
  justification text not null,
  supersedes_id uuid references public.risk_evaluations(id) on delete restrict,
  is_current boolean not null default true,
  evaluated_by uuid not null references auth.users(id) default auth.uid(),
  evaluated_at timestamptz not null default now(),
  check (length(btrim(justification)) >= 30 or evaluation_type = 'inherente'),
  check (length(btrim(justification)) >= 10)
);
create index if not exists risk_evaluations_current_idx
  on public.risk_evaluations (risk_scenario_id, evaluation_type) where is_current;

create table if not exists public.risk_evaluation_controls (
  risk_evaluation_id uuid not null references public.risk_evaluations(id) on delete restrict,
  control_id uuid not null references public.controls(id) on delete restrict,
  effectiveness_review_id uuid references public.control_effectiveness_reviews(id) on delete restrict,
  primary key (risk_evaluation_id, control_id)
);

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  risk_scenario_id uuid not null references public.risk_scenarios(id) on delete cascade,
  strategy text not null check (strategy in ('evitar','reducir_probabilidad','reducir_impacto','compartir','aceptar')),
  description text not null,
  justification text,
  target_level text check (target_level in ('bajo','medio','alto','critico')),
  owner_party text not null default 'cliente' check (owner_party in ('cliente','stratec','tercero')),
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (strategy <> 'aceptar' or coalesce(length(btrim(justification)), 0) >= 10)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  solution_line text not null check (solution_line in ('organizacional','fisico','tecnologico','procedimental','capacitacion')),
  priority text not null default 'media' check (priority in ('alta','media','baja')),
  term text not null default 'corto' check (term in ('inmediato','corto','mediano','largo')),
  service_code text check (service_code ~ '^STR-[0-9]{2}(\.[0-9]{1,2})?$'),
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  review_status text not null default 'aceptada' check (review_status in ('propuesta','aceptada','editada','descartada')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, code)
);

create table if not exists public.treatment_recommendations (
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  primary key (treatment_id, recommendation_id)
);
create table if not exists public.recommendation_findings (
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade,
  primary key (recommendation_id, finding_id)
);

-- R-10, R-11, R-18: evaluación de riesgo. Calcula banda y escalamiento; NO calcula la residual.
create or replace function public.mdesr_before_risk_evaluation()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  a record;
  banda text;
  minimo text;
  regla record;
begin
  select ass.id, ass.revision_no, ass.risk_scale_version_id into a
  from public.risk_scenarios rs join public.assessments ass on ass.id = rs.assessment_id
  where rs.id = new.risk_scenario_id;
  if a.id is distinct from new.assessment_id then
    raise exception 'La evaluación debe ser del mismo diagnóstico que el escenario.';
  end if;
  new.assessment_revision_no := a.revision_no;
  new.evaluated_by := coalesce(auth.uid(), new.evaluated_by);
  new.evaluated_at := now();
  new.is_current := true;

  if new.evaluation_type = 'residual' and not exists (
       select 1 from public.risk_evaluations
       where risk_scenario_id = new.risk_scenario_id and evaluation_type = 'inherente' and is_current) then
    raise exception 'Primero registra la evaluación inherente vigente de este escenario.';
  end if;

  select level_code into banda from public.risk_level_bands
  where scale_version_id = a.risk_scale_version_id and (new.probability * new.impact) between min_score and max_score;
  if banda is null then raise exception 'La escala del diagnóstico no tiene banda para el puntaje %.', new.probability * new.impact; end if;
  new.calculated_level := banda;
  new.final_level := banda;
  new.escalation_applied := '{}';
  for regla in select criterion, minimum_level from public.escalation_rules where scale_version_id = a.risk_scale_version_id loop
    if (regla.criterion = 'vida_humana' and new.affects_life)
       or (regla.criterion = 'evacuacion' and new.requires_evacuation)
       or (regla.criterion = 'integridad_estructural' and new.structural_integrity)
       or (regla.criterion = 'cumplimiento_legal' and new.legal_compliance) then
      minimo := regla.minimum_level;
      if public.mdesr_level_rank(minimo) > public.mdesr_level_rank(new.final_level) then
        new.final_level := minimo;
        new.escalation_applied := array_append(new.escalation_applied, regla.criterion);
      end if;
    end if;
  end loop;

  -- La anterior del mismo tipo deja de estar vigente (sin editar nada más)
  perform set_config('mdesr.internal', 'on', true);
  update public.risk_evaluations set is_current = false
  where risk_scenario_id = new.risk_scenario_id and evaluation_type = new.evaluation_type and is_current;
  perform set_config('mdesr.internal', 'off', true);
  return new;
end $$;
drop trigger if exists mdesr_before_risk_evaluation on public.risk_evaluations;
create trigger mdesr_before_risk_evaluation before insert on public.risk_evaluations
  for each row execute function public.mdesr_before_risk_evaluation();

drop trigger if exists mdesr_append_only on public.risk_evaluations;
create trigger mdesr_append_only before update or delete on public.risk_evaluations
  for each row execute function public.mdesr_append_only();
drop trigger if exists mdesr_append_only on public.control_effectiveness_reviews;
create trigger mdesr_append_only before update or delete on public.control_effectiveness_reviews
  for each row execute function public.mdesr_append_only();
drop trigger if exists mdesr_append_only on public.risk_evaluation_controls;
create trigger mdesr_append_only before update or delete on public.risk_evaluation_controls
  for each row execute function public.mdesr_append_only();

-- ═══ E5 · Aprobación y entregables ═════════════════════════════════════════

alter table public.documents add column if not exists project_id uuid references public.projects(id) on delete restrict;
alter table public.documents add column if not exists assessment_id uuid references public.assessments(id) on delete restrict;
alter table public.documents add column if not exists deliverable_type text;
alter table public.documents add column if not exists revision_no integer not null default 1;
alter table public.documents add column if not exists revision_started_at timestamptz not null default now();
alter table public.documents add column if not exists approval_status text not null default 'sin_flujo';
alter table public.documents add column if not exists snapshot jsonb;
alter table public.documents add column if not exists content_hash text;
alter table public.documents add column if not exists issued_at timestamptz;
alter table public.documents add column if not exists issued_by uuid references auth.users(id);
alter table public.documents add column if not exists issued_file_path text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'documents_deliverable_type_check') then
    alter table public.documents add constraint documents_deliverable_type_check check (deliverable_type is null or deliverable_type in
      ('informe_diagnostico','informe_pestel','matriz_riesgos','plan_tratamiento','resumen_ejecutivo'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'documents_approval_status_check') then
    alter table public.documents add constraint documents_approval_status_check check (approval_status in
      ('sin_flujo','borrador','enviado','en_revision','devuelto','revisado','validado','aprobado','rechazado'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'documents_mdesr_consistency') then
    -- Entregable de M-DESR <=> tiene proyecto y está en el flujo
    alter table public.documents add constraint documents_mdesr_consistency check (
      (deliverable_type is null and approval_status = 'sin_flujo')
      or (deliverable_type is not null and project_id is not null and approval_status <> 'sin_flujo'));
  end if;
end $$;

create table if not exists public.approval_records (
  id bigint generated always as identity primary key,
  subject_type text not null check (subject_type in ('assessment','document')),
  assessment_id uuid references public.assessments(id) on delete restrict,
  document_id uuid references public.documents(id) on delete restrict,
  subject_revision_no integer not null,
  action text not null check (action in ('enviar','tomar_revision','revisar','devolver','corregir','validar','aprobar','rechazar','cerrar','reabrir','invalidar','asignar_revisor','asignar_validador','comentar')),
  decision text check (decision in ('favorable','con_observaciones','desfavorable')),
  comments text,
  actor_id uuid references auth.users(id) default auth.uid(),
  actor_roles text[] not null default '{}',
  actor_function text,
  authority_basis text not null default 'funcion_asignada' check (authority_basis in ('funcion_asignada','facultad_expresa','administrador','sistema')),
  methodology_version_label text not null,
  instrument_versions_applied jsonb not null default '[]',
  scale_version_label text,
  content_hash text,
  created_at timestamptz not null default clock_timestamp(),
  check ((subject_type = 'assessment' and assessment_id is not null and document_id is null)
      or (subject_type = 'document' and document_id is not null)),
  check (action not in ('devolver','rechazar','reabrir') or coalesce(length(btrim(comments)), 0) >= 10)
);
create index if not exists approval_records_assessment_idx on public.approval_records (assessment_id, subject_revision_no);
create index if not exists approval_records_document_idx on public.approval_records (document_id, subject_revision_no);
drop trigger if exists mdesr_append_only on public.approval_records;
create trigger mdesr_append_only before update or delete on public.approval_records
  for each row execute function public.mdesr_append_only();

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  subject_revision_no integer not null,
  target_table text,
  target_id uuid,
  body text not null,
  status text not null default 'abierta' check (status in ('abierta','atendida','descartada')),
  author_id uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  check ((assessment_id is null) <> (document_id is null))
);

create table if not exists public.document_annexes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  annex_type text not null check (annex_type in ('plano','evidencia','matriz','otro')),
  site_plan_id uuid,  -- FK en E6
  evidence_id uuid references public.evidence(id) on delete restrict,
  caption text,
  sort_order integer not null default 0,
  check (annex_type <> 'plano' or site_plan_id is not null),
  check (annex_type <> 'evidencia' or evidence_id is not null)
);

-- ¿Es autor de la versión? Envió la versión o cambió contenido desde que empezó (R-04)
create or replace function public.mdesr_is_author(_type text, _id uuid, _user uuid)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare rev int; desde timestamptz;
begin
  if _type = 'assessment' then
    select revision_no, revision_started_at into rev, desde from public.assessments where id = _id;
    return exists (select 1 from public.approval_records
                   where assessment_id = _id and subject_revision_no = rev and action = 'enviar' and actor_id = _user)
        or exists (select 1 from public.audit_log
                   where assessment_id = _id and actor_id = _user and occurred_at >= desde
                     and not via_transition and table_name not in ('review_comments','approval_records'));
  else
    select revision_no, revision_started_at into rev, desde from public.documents where id = _id;
    return exists (select 1 from public.approval_records
                   where document_id = _id and subject_revision_no = rev and action = 'enviar' and actor_id = _user)
        or exists (select 1 from public.audit_log
                   where table_name = 'documents' and record_id = _id::text and actor_id = _user
                     and occurred_at >= desde and not via_transition);
  end if;
end $$;

-- Comprobaciones al enviar a revisión (R-11, R-15, R-19, R-20)
create or replace function public.mdesr_check_submission(_assessment uuid)
returns void language plpgsql stable security definer set search_path = public
as $$
declare problemas text[] := '{}'; n int;
begin
  select count(*) into n from public.questions q
    join public.assessment_instruments ai on ai.instrument_version_id = q.instrument_version_id and ai.assessment_id = _assessment
   where not exists (select 1 from public.responses r where r.assessment_id = _assessment and r.question_id = q.id);
  if n > 0 then problemas := problemas || format('%s preguntas sin contestar', n); end if;

  select count(*) into n from public.responses r join public.questions q on q.id = r.question_id
   where r.assessment_id = _assessment and q.is_critical and r.answer_value = 'no' and not r.not_applicable
     and not exists (select 1 from public.findings f where f.assessment_id = _assessment and f.question_id = q.id);
  if n > 0 then problemas := problemas || format('%s preguntas críticas con "no" sin hallazgo', n); end if;

  select count(*) into n from public.responses r join public.questions q on q.id = r.question_id
   where r.assessment_id = _assessment and q.requires_evidence and not r.not_applicable
     and not exists (select 1 from public.response_evidence re where re.response_id = r.id);
  if n > 0 then problemas := problemas || format('%s respuestas sin la evidencia que exige la pregunta', n); end if;

  select count(*) into n from public.risk_scenarios s
   where s.assessment_id = _assessment and s.review_status <> 'descartada'
     and not exists (select 1 from public.risk_evaluations e
                     where e.risk_scenario_id = s.id and e.evaluation_type = 'inherente' and e.is_current);
  if n > 0 then problemas := problemas || format('%s escenarios sin evaluación inherente', n); end if;

  -- R-11: una residual menor que la inherente necesita un control con eficacia comprobada
  select count(*) into n
    from public.risk_evaluations res
    join public.risk_evaluations inh on inh.risk_scenario_id = res.risk_scenario_id
         and inh.evaluation_type = 'inherente' and inh.is_current
   where res.assessment_id = _assessment and res.evaluation_type = 'residual' and res.is_current
     and res.score < inh.score
     and not exists (
       select 1 from public.risk_evaluation_controls rec
       join public.control_effectiveness_reviews cer on cer.id = rec.effectiveness_review_id
       where rec.risk_evaluation_id = res.id and cer.rating in ('parcial','adecuada','efectiva'));
  if n > 0 then problemas := problemas || format('%s residuales menores que la inherente sin control eficaz que las respalde', n); end if;

  select count(*) into n from public.pestel_factors p
   where p.assessment_id = _assessment and p.has_statistics and p.review_status <> 'descartada'
     and not exists (select 1 from public.pestel_factor_sources s where s.pestel_factor_id = p.id);
  select n + count(*) into n from public.threats t
   where t.assessment_id = _assessment and t.has_statistics and t.review_status <> 'descartada'
     and not exists (select 1 from public.threat_sources s where s.threat_id = t.id);
  if n > 0 then problemas := problemas || format('%s factores o amenazas con cifras sin fuente', n); end if;

  select (select count(*) from public.responses where assessment_id = _assessment and review_status = 'propuesta')
       + (select count(*) from public.pestel_factors where assessment_id = _assessment and review_status = 'propuesta')
       + (select count(*) from public.findings where assessment_id = _assessment and review_status = 'propuesta')
       + (select count(*) from public.threats where assessment_id = _assessment and review_status = 'propuesta')
       + (select count(*) from public.vulnerabilities where assessment_id = _assessment and review_status = 'propuesta')
       + (select count(*) from public.risk_scenarios where assessment_id = _assessment and review_status = 'propuesta')
       + (select count(*) from public.controls where assessment_id = _assessment and review_status = 'propuesta')
       + (select count(*) from public.recommendations where assessment_id = _assessment and review_status = 'propuesta')
    into n;
  if n > 0 then problemas := problemas || format('%s propuestas (de IA o del sitio) sin aceptar ni descartar', n); end if;

  if cardinality(problemas) > 0 then
    raise exception 'No se puede enviar a revisión: %.', array_to_string(problemas, '; ');
  end if;
end $$;

-- Transición única del flujo de aprobación (R-04, R-05, R-06)
create or replace function public.mdesr_transition_subject(
  _type text, _id uuid, _action text, _comments text default null, _decision text default null)
returns text language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_project uuid; v_status text; v_rev int; v_assessment uuid;
  fns text[];
  nuevo text;
  revisor uuid;
  es_autor boolean;
  base text;
  hay_revisor boolean;
  mv_label text; sv_label text; inst jsonb; huella text;
begin
  if uid is null then raise exception 'Se requiere sesión iniciada.'; end if;
  if _type = 'assessment' then
    select project_id, status, revision_no, id into v_project, v_status, v_rev, v_assessment
      from public.assessments where id = _id for update;
  elsif _type = 'document' then
    select project_id, approval_status, revision_no, assessment_id into v_project, v_status, v_rev, v_assessment
      from public.documents where id = _id and deliverable_type is not null for update;
  else
    raise exception 'Tipo desconocido: %', _type;
  end if;
  if v_project is null then raise exception 'No existe o no es de M-DESR.'; end if;
  if v_status in ('cerrado','rechazado') then raise exception 'Ya está %: no admite más cambios.', v_status; end if;

  fns := public.mdesr_functions(v_project, uid);
  -- La revisión técnica es opcional: solo es obligatoria si el proyecto tiene revisor asignado.
  hay_revisor := exists (select 1 from public.project_members
                         where project_id = v_project and project_function = 'revisor' and removed_at is null);
  es_autor := public.mdesr_is_author(_type, _id, uid);
  select actor_id into revisor from public.approval_records
   where ((_type = 'assessment' and assessment_id = _id) or (_type = 'document' and document_id = _id))
     and subject_revision_no = v_rev and action = 'revisar'
   order by id desc limit 1;

  if _action = 'enviar' then
    if v_status <> 'borrador' then raise exception 'Solo se envía desde borrador.'; end if;
    base := public.mdesr_authority(v_project, array['elaborador'], 'mdesr.submit', uid);
    if base is null then
      raise exception 'Solo el elaborador con la facultad mdesr.submit envía a revisión.';
    end if;
    if _type = 'assessment' then perform public.mdesr_check_submission(_id); end if;
    nuevo := 'enviado';
  elsif _action = 'tomar_revision' then
    if v_status <> 'enviado' then raise exception 'No hay una versión enviada.'; end if;
    base := public.mdesr_authority(v_project, array['revisor'], 'mdesr.review', uid);
    if base is null then
      raise exception 'Solo el revisor asignado toma la revisión.';
    end if;
    if es_autor then raise exception 'No puedes revisar una versión de la que eres autor.'; end if;
    nuevo := 'en_revision';
  elsif _action = 'revisar' then
    if v_status <> 'en_revision' then raise exception 'La versión no está en revisión.'; end if;
    base := public.mdesr_authority(v_project, array['revisor'], 'mdesr.review', uid);
    if base is null then
      raise exception 'Solo el revisor asignado registra la revisión.';
    end if;
    if es_autor then raise exception 'No puedes revisar una versión de la que eres autor.'; end if;
    if coalesce(_decision, '') not in ('favorable','con_observaciones') then
      raise exception 'Indica la decisión de la revisión: favorable o con observaciones. Para devolver usa "devolver".';
    end if;
    nuevo := 'revisado';
  elsif _action = 'devolver' then
    if v_status not in ('en_revision','revisado','validado') then raise exception 'No hay nada que devolver.'; end if;
    base := public.mdesr_authority(v_project, array['revisor','consultor_validador'], 'mdesr.return_for_correction', uid);
    if base is null then
      raise exception 'Solo el revisor o el consultor validador devuelven para corrección.';
    end if;
    if es_autor then raise exception 'No puedes devolver una versión de la que eres autor.'; end if;
    nuevo := 'devuelto';
  elsif _action = 'corregir' then
    if v_status <> 'devuelto' then raise exception 'Solo se corrige una versión devuelta.'; end if;
    base := public.mdesr_authority(v_project, array['elaborador'], 'mdesr.prepare', uid);
    if base is null then
      raise exception 'Solo el elaborador abre la corrección.';
    end if;
    nuevo := 'borrador';
  elsif _action = 'validar' then
    if not (v_status = 'revisado' or (v_status = 'enviado' and not hay_revisor)) then
      raise exception 'Solo se valida una versión revisada (o enviada, si el proyecto no tiene revisor asignado).';
    end if;
    base := public.mdesr_authority(v_project, array['consultor_validador'], 'mdesr.validate', uid);
    if base is null then
      raise exception 'Solo el consultor validador asignado o el Administrador validan.';
    end if;
    if not (public.has_role(uid, 'consultant') or base = 'administrador') then
      raise exception 'Validar un diagnóstico formal requiere el rol Consultor o Administrador.';
    end if;
    if es_autor then raise exception 'No puedes validar una versión de la que eres autor.'; end if;
    if revisor = uid then raise exception 'Revisaste esta versión: la validación debe hacerla otra persona.'; end if;
    nuevo := 'validado';
  elsif _action = 'aprobar' then
    base := public.mdesr_authority(v_project, array['consultor_validador'], 'mdesr.approve', uid);
    -- Consultor: aprueba una versión validada. Administrador: también una revisada,
    -- o una enviada si el proyecto no tiene revisor (su aprobación permite emitir).
    if not (v_status = 'validado'
            or (base = 'administrador' and (v_status = 'revisado' or (v_status = 'enviado' and not hay_revisor)))) then
      raise exception 'Esta versión todavía no se puede aprobar en su estado actual (%).', v_status;
    end if;
    if base is null then
      raise exception 'Solo el consultor validador asignado o el Administrador aprueban.';
    end if;
    if not (public.has_role(uid, 'consultant') or base = 'administrador') then
      raise exception 'Aprobar un diagnóstico formal requiere el rol Consultor o Administrador.';
    end if;
    if es_autor then raise exception 'No puedes aprobar una versión de la que eres autor.'; end if;
    if revisor = uid then raise exception 'Revisaste esta versión: la aprobación debe hacerla otra persona.'; end if;
    if _type = 'document' and not exists (select 1 from public.assessments
                                          where id = v_assessment and status in ('aprobado','cerrado')) then
      raise exception 'El entregable se aprueba después de aprobar su diagnóstico.';
    end if;
    nuevo := 'aprobado';
  elsif _action = 'rechazar' then
    if v_status not in ('enviado','en_revision','revisado','validado') then raise exception 'No hay nada que rechazar.'; end if;
    base := public.mdesr_authority(v_project, array['consultor_validador'], 'mdesr.reject', uid);
    if base is null then
      raise exception 'Solo el consultor validador rechaza.';
    end if;
    if not (public.has_role(uid, 'consultant') or base = 'administrador') then
      raise exception 'Rechazar un diagnóstico formal requiere el rol Consultor o Administrador.';
    end if;
    if es_autor then raise exception 'No puedes rechazar una versión de la que eres autor.'; end if;
    if revisor = uid then raise exception 'Revisaste esta versión: el rechazo debe hacerla otra persona.'; end if;
    nuevo := 'rechazado';
  elsif _action = 'cerrar' then
    if _type <> 'assessment' or v_status <> 'aprobado' then raise exception 'Solo se cierra un diagnóstico aprobado.'; end if;
    base := public.mdesr_authority(v_project, array['consultor_validador'], 'mdesr.close', uid);
    if base is null then
      raise exception 'Solo el consultor validador cierra.';
    end if;
    if not (public.has_role(uid, 'consultant') or base = 'administrador') then
      raise exception 'Cerrar un diagnóstico formal requiere el rol Consultor o Administrador.';
    end if;
    if es_autor then raise exception 'No puedes cerrar una versión de la que eres autor.'; end if;
    if revisor = uid then raise exception 'Revisaste esta versión: el cierre debe hacerla otra persona.'; end if;
    nuevo := 'cerrado';
  elsif _action = 'reabrir' then
    if v_status not in ('enviado','en_revision','revisado','validado','aprobado') then
      raise exception 'Solo se reabre una versión enviada o aprobada.';
    end if;
    base := coalesce(public.mdesr_authority(v_project, array['elaborador'], 'mdesr.prepare', uid),
                     public.mdesr_authority(v_project, array['consultor_validador'], 'mdesr.validate', uid));
    -- Reabrir anula lo aprobado: queda en el historial con su base de autoridad.
    if base is null then
      raise exception 'Solo el elaborador o el consultor validador reabren.';
    end if;
    nuevo := 'borrador';
  else
    raise exception 'Acción desconocida: %', _action;
  end if;

  -- Datos de versión para el historial
  select m.label, sv.version_label,
         coalesce((select jsonb_agg(jsonb_build_object('instrumento', i.code, 'version', iv.version_label) order by i.code)
                   from public.assessment_instruments ai
                   join public.instrument_versions iv on iv.id = ai.instrument_version_id
                   join public.instruments i on i.id = iv.instrument_id
                   where ai.assessment_id = a.id), '[]'::jsonb)
    into mv_label, sv_label, inst
    from public.assessments a
    join public.methodology_versions m on m.id = a.methodology_version_id
    join public.risk_scale_versions sv on sv.id = a.risk_scale_version_id
   where a.id = v_assessment;
  if mv_label is null then
    raise exception 'El entregable debe estar ligado a un diagnóstico para registrar la versión de M-DESR.';
  end if;

  if nuevo in ('aprobado','cerrado') then
    if _type = 'assessment' then
      select md5(coalesce(string_agg(t, '§' order by t), '')) into huella from (
        select 'R' || r.question_id || coalesce(r.area_id::text, '') || coalesce(r.answer_value, '') || coalesce(r.answer_numeric::text, '') as t
          from public.responses r where r.assessment_id = _id
        union all select 'H' || f.code || f.description || coalesce(f.severity, '') from public.findings f where f.assessment_id = _id
        union all select 'E' || e.id || e.final_level from public.risk_evaluations e where e.assessment_id = _id and e.is_current
        union all select 'C' || c.code || c.name from public.recommendations c where c.assessment_id = _id) x;
    else
      select md5(data::text) into huella from public.documents where id = _id;
    end if;
  end if;

  perform set_config('mdesr.internal', 'on', true);

  if _action = 'reabrir' then
    insert into public.approval_records (subject_type, assessment_id, document_id, subject_revision_no, action, comments,
      actor_id, actor_roles, actor_function, authority_basis, methodology_version_label, instrument_versions_applied, scale_version_label)
    values (_type, case when _type = 'assessment' then _id else v_assessment end, case when _type = 'document' then _id end,
      v_rev, 'invalidar', coalesce(_comments, 'Reapertura por cambio sustancial'),
      uid, (select coalesce(array_agg(role::text), '{}') from public.user_roles where user_id = uid),
      array_to_string(fns, ','), coalesce(base, 'funcion_asignada'), mv_label, inst, sv_label);
  end if;

  if _type = 'assessment' then
    update public.assessments
       set status = nuevo,
           revision_no = case when _action in ('corregir','reabrir') then revision_no + 1 else revision_no end,
           revision_started_at = case when _action in ('corregir','reabrir') then clock_timestamp() else revision_started_at end,
           content_hash = coalesce(huella, content_hash),
           validation_basis = case when _action = 'validar' then base
                                   when _action in ('corregir','reabrir') then null else validation_basis end,
           approval_basis = case when _action = 'aprobar' then base
                                 when _action in ('corregir','reabrir') then null else approval_basis end,
           closed_at = case when nuevo = 'cerrado' then now() else closed_at end,
           closed_by = case when nuevo = 'cerrado' then uid else closed_by end
     where id = _id;
  else
    update public.documents
       set approval_status = nuevo,
           revision_no = case when _action in ('corregir','reabrir') then revision_no + 1 else revision_no end,
           revision_started_at = case when _action in ('corregir','reabrir') then clock_timestamp() else revision_started_at end,
           content_hash = case when nuevo = 'aprobado' then huella else content_hash end,
           snapshot = case when nuevo = 'aprobado' then data else snapshot end,
           status = case when _action in ('corregir','reabrir') then 'draft' else status end
     where id = _id;
  end if;

  insert into public.approval_records (subject_type, assessment_id, document_id, subject_revision_no, action, decision, comments,
    actor_id, actor_roles, actor_function, authority_basis, methodology_version_label, instrument_versions_applied, scale_version_label, content_hash)
  values (_type, case when _type = 'assessment' then _id else v_assessment end, case when _type = 'document' then _id end,
    v_rev, _action, _decision, _comments,
    uid, (select coalesce(array_agg(role::text), '{}') from public.user_roles where user_id = uid),
    array_to_string(fns, ','), coalesce(base, 'funcion_asignada'), mv_label, inst, sv_label, huella);

  perform set_config('mdesr.internal', 'off', true);
  return nuevo;
end $$;

create or replace function public.mdesr_transition(_assessment uuid, _action text, _comments text default null, _decision text default null)
returns text language sql security definer set search_path = public
as $$ select public.mdesr_transition_subject('assessment', _assessment, _action, _comments, _decision) $$;

create or replace function public.mdesr_document_transition(_document uuid, _action text, _comments text default null, _decision text default null)
returns text language sql security definer set search_path = public
as $$ select public.mdesr_transition_subject('document', _document, _action, _comments, _decision) $$;

-- R-12: candado de entregables de M-DESR (los documentos actuales no se tocan)
create or replace function public.mdesr_guard_document()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Un entregable de M-DESR nace siempre en borrador, versión 1, sin aprobación
    if new.deliverable_type is not null then
      new.approval_status := 'borrador';
      new.revision_no := 1;
      new.revision_started_at := now();
      new.snapshot := null;
      new.content_hash := null;
      if new.status in ('final','delivered') then new.status := 'draft'; end if;
    end if;
    return new;
  end if;
  if new.deliverable_type is null and old.deliverable_type is null then
    return new;  -- documento fuera de M-DESR: sin cambios de comportamiento
  end if;
  if coalesce(current_setting('mdesr.internal', true), '') = 'on' then
    return new;
  end if;
  if new.approval_status is distinct from old.approval_status
     or new.revision_no is distinct from old.revision_no
     or new.snapshot is distinct from old.snapshot
     or new.content_hash is distinct from old.content_hash then
    raise exception 'El estado de aprobación solo cambia con mdesr_document_transition.';
  end if;
  if new.status in ('final','delivered') and new.approval_status <> 'aprobado' then
    raise exception 'Un entregable de M-DESR solo se emite o entrega después de aprobado.';
  end if;
  if old.approval_status = 'aprobado' and new.data is distinct from old.data then
    -- Cambio sustancial después de aprobar: se anula la aprobación
    new.approval_status := 'borrador';
    new.status := 'draft';
    new.revision_no := old.revision_no + 1;
    new.revision_started_at := clock_timestamp();
    perform set_config('mdesr.internal', 'on', true);
    insert into public.approval_records (subject_type, assessment_id, document_id, subject_revision_no, action, comments,
      actor_roles, authority_basis, methodology_version_label)
    values ('document', old.assessment_id, old.id, old.revision_no, 'invalidar',
      'Cambio de contenido después de aprobado: la aprobación queda sin efecto.',
      (select coalesce(array_agg(role::text), '{}') from public.user_roles where user_id = auth.uid()),
      'sistema',
      coalesce((select m.label from public.assessments a join public.methodology_versions m on m.id = a.methodology_version_id
                where a.id = old.assessment_id), 'desconocida'));
    perform set_config('mdesr.internal', 'off', true);
  elsif old.approval_status not in ('borrador','devuelto') and new.data is distinct from old.data then
    raise exception 'El entregable está "%": para cambiarlo hay que reabrirlo.', old.approval_status;
  end if;
  return new;
end $$;
drop trigger if exists mdesr_guard_document on public.documents;
create trigger mdesr_guard_document before insert or update on public.documents
  for each row execute function public.mdesr_guard_document();

-- ── E5 · políticas de documents ──────────────────────────────────────────
-- ⚠ Volver a pegar este bloque después de cada ejecución de 02-tablas-y-permisos.sql,
-- que borra todas las políticas de documents y de clients.
-- RESTRICTIVAS: se suman (con AND) a las políticas actuales por módulo. Para los
-- documentos fuera de M-DESR (project_id nulo) no cambian nada.
drop policy if exists "mdesr entregables leer" on public.documents;
create policy "mdesr entregables leer" on public.documents as restrictive for select to authenticated
  using (project_id is null or public.mdesr_can_read(project_id));
drop policy if exists "mdesr entregables alta" on public.documents;
create policy "mdesr entregables alta" on public.documents as restrictive for insert to authenticated
  with check (project_id is null or 'elaborador' = any(public.mdesr_functions(project_id)) or public.has_role(auth.uid(), 'admin'));
drop policy if exists "mdesr entregables editar" on public.documents;
create policy "mdesr entregables editar" on public.documents as restrictive for update to authenticated
  using (project_id is null or (('elaborador' = any(public.mdesr_functions(project_id)) or public.has_role(auth.uid(), 'admin'))
                                 and approval_status in ('borrador')))
  with check (project_id is null or 'elaborador' = any(public.mdesr_functions(project_id)) or public.has_role(auth.uid(), 'admin'));
drop policy if exists "mdesr entregables borrar" on public.documents;
create policy "mdesr entregables borrar" on public.documents as restrictive for delete to authenticated
  using (project_id is null or approval_status = 'borrador');
-- D-16: el Consultor solo ve documentos de sus proyectos.
-- D-19: el Ejecutivo solo ve documentos asignados: de sus proyectos, de clientes
-- a su cargo (clients.owner_id) o creados por él (documents.owner_id).
-- El admin, sin cambio. Quien tenga además otro rol sin estas limitaciones,
-- las sigue teniendo por estos dos roles.
drop policy if exists "mdesr documentos consultor" on public.documents;
create policy "mdesr documentos consultor" on public.documents as restrictive for all to authenticated
  using (not public.has_role(auth.uid(), 'consultant') or public.has_role(auth.uid(), 'admin')
         or (project_id is not null and public.mdesr_is_member(project_id)))
  with check (not public.has_role(auth.uid(), 'consultant') or public.has_role(auth.uid(), 'admin')
         or (project_id is not null and public.mdesr_is_member(project_id)));
drop policy if exists "mdesr documentos ejecutivo" on public.documents;
create policy "mdesr documentos ejecutivo" on public.documents as restrictive for select to authenticated
  using (not public.has_role(auth.uid(), 'executive') or public.has_role(auth.uid(), 'admin')
         or (project_id is not null and public.mdesr_is_member(project_id))
         or owner_id = auth.uid()
         or exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()));
-- D-16: el Consultor solo ve los clientes de sus proyectos.
drop policy if exists "mdesr clientes consultor" on public.clients;
create policy "mdesr clientes consultor" on public.clients as restrictive for select to authenticated
  using (not public.has_role(auth.uid(), 'consultant') or public.has_role(auth.uid(), 'admin')
         or exists (select 1 from public.projects p where p.client_id = clients.id and public.mdesr_is_member(p.id)));
-- Permisiva adicional: los miembros ven los entregables de su proyecto aunque su
-- rol no tenga el módulo Documentos en access_rules (el Consultor empieza sin él).
drop policy if exists "mdesr entregables miembros" on public.documents;
create policy "mdesr entregables miembros" on public.documents for select to authenticated
  using (project_id is not null and public.mdesr_can_read(project_id));
drop policy if exists "mdesr entregables elaborador" on public.documents;
create policy "mdesr entregables elaborador" on public.documents for insert to authenticated
  with check (project_id is not null and 'elaborador' = any(public.mdesr_functions(project_id)));
drop policy if exists "mdesr entregables elaborador editar" on public.documents;
create policy "mdesr entregables elaborador editar" on public.documents for update to authenticated
  using (project_id is not null and 'elaborador' = any(public.mdesr_functions(project_id)))
  with check (project_id is not null and 'elaborador' = any(public.mdesr_functions(project_id)));

insert into storage.buckets (id, name, public) values ('mdesr-entregables', 'mdesr-entregables', false)
on conflict (id) do nothing;
drop policy if exists "mdesr entregables pdf leer" on storage.objects;
create policy "mdesr entregables pdf leer" on storage.objects for select to authenticated
  using (bucket_id = 'mdesr-entregables'
         and public.mdesr_can_read(public.mdesr_try_uuid((storage.foldername(name))[1])));

-- ═══ E6 · Plano del inmueble ═══════════════════════════════════════════════

create table if not exists public.plan_feature_types (
  code text primary key,
  label text not null,
  geometry_kind text not null check (geometry_kind in ('punto','linea','poligono')),
  category text not null check (category in ('area','proteccion_civil','seguridad','riesgo','intervencion','referencia')),
  icon text,
  color_hex text,
  is_sensitive boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.plan_feature_types (code, label, geometry_kind, category, is_sensitive, sort_order) values
  ('perimetro','Perímetro del predio','poligono','referencia',false,10),
  ('area','Área','poligono','area',false,20),
  ('colindancia','Colindancia','poligono','referencia',false,30),
  ('acceso_peatonal','Acceso peatonal','punto','seguridad',true,40),
  ('acceso_vehicular','Acceso vehicular','punto','seguridad',true,50),
  ('control_acceso','Control de acceso','punto','seguridad',true,60),
  ('camara','Cámara (con cobertura)','punto','seguridad',true,70),
  ('punto_ciego','Punto ciego','poligono','seguridad',true,80),
  ('alarma','Alarma o sensor','punto','seguridad',true,90),
  ('iluminacion','Luminaria','punto','seguridad',false,100),
  ('extintor','Extintor','punto','proteccion_civil',false,110),
  ('hidrante','Hidrante','punto','proteccion_civil',false,120),
  ('botiquin','Botiquín','punto','proteccion_civil',false,130),
  ('salida_emergencia','Salida de emergencia','punto','proteccion_civil',false,140),
  ('ruta_evacuacion','Ruta de evacuación','linea','proteccion_civil',false,150),
  ('punto_reunion','Punto de reunión','punto','proteccion_civil',false,160),
  ('riesgo_puntual','Riesgo','punto','riesgo',false,170),
  ('zona_riesgo','Zona de riesgo','poligono','riesgo',false,180),
  ('zona_intervencion','Zona de intervención','poligono','intervencion',false,190)
on conflict (code) do nothing;

create table if not exists public.site_plans (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  version_no integer not null default 1,
  status text not null default 'borrador' check (status in ('borrador','vigente','archivado')),
  base_layer text not null default 'esri_world_imagery',
  imagery_date text,
  center_lat numeric(9,6) check (center_lat between -90 and 90),
  center_lng numeric(9,6) check (center_lng between -180 and 180),
  perimeter_geojson jsonb check (perimeter_geojson is null or perimeter_geojson ->> 'type' in ('Polygon','MultiPolygon')),
  measured_area_m2 numeric(12,2) check (measured_area_m2 >= 0),
  measured_perimeter_m numeric(12,2) check (measured_perimeter_m >= 0),
  measurement_method text not null default 'satelital_aproximada' check (measurement_method in ('satelital_aproximada','levantamiento_campo','plano_cliente')),
  measurement_note text not null default 'Medidas aproximadas obtenidas sobre imagen satelital. No sustituyen un levantamiento topográfico.'
    check (length(btrim(measurement_note)) > 0),
  measured_by uuid references auth.users(id),
  measured_at timestamptz,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, version_no)
);
create unique index if not exists site_plans_one_current on public.site_plans (site_id) where status = 'vigente';

create table if not exists public.plan_features (
  id uuid primary key default gen_random_uuid(),
  site_plan_id uuid not null references public.site_plans(id) on delete cascade,
  feature_type_code text not null references public.plan_feature_types(code) on delete restrict,
  geometry jsonb not null check (geometry ->> 'type' in ('Point','LineString','Polygon')),
  label text,
  area_id uuid references public.areas(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  finding_id uuid references public.findings(id) on delete set null,
  risk_scenario_id uuid references public.risk_scenarios(id) on delete set null,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  control_id uuid references public.controls(id) on delete set null,
  properties jsonb not null default '{}',
  measured_length_m numeric(12,2) check (measured_length_m >= 0),
  measured_area_m2 numeric(12,2) check (measured_area_m2 >= 0),
  origin text not null default 'consultor' check (origin in ('consultor','cliente','diagnostico_web','ia_propuesta')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (feature_type_code <> 'camara' or (
    (properties ->> 'azimuth_deg') is null or ((properties ->> 'azimuth_deg')::numeric between 0 and 359.99)))
);

alter table public.document_annexes drop constraint if exists document_annexes_site_plan_fk;
alter table public.document_annexes add constraint document_annexes_site_plan_fk
  foreign key (site_plan_id) references public.site_plans(id) on delete restrict;

-- R-21: geometría acorde al tipo; plano de diagnóstico cerrado congelado
create or replace function public.mdesr_guard_plan()
returns trigger language plpgsql security definer set search_path = public
as $$
declare r jsonb := to_jsonb(coalesce(new, old)); plan_id uuid; st text; kind text;
begin
  plan_id := case when tg_table_name = 'site_plans' then (r ->> 'id')::uuid else (r ->> 'site_plan_id')::uuid end;
  select a.status into st from public.site_plans sp join public.assessments a on a.id = sp.assessment_id where sp.id = plan_id;
  if st = 'cerrado' and coalesce(current_setting('mdesr.internal', true), '') <> 'on' then
    raise exception 'El plano pertenece a un diagnóstico cerrado: crea una versión nueva del plano.';
  end if;
  if tg_table_name = 'plan_features' and tg_op <> 'DELETE' then
    select geometry_kind into kind from public.plan_feature_types where code = new.feature_type_code;
    if (kind = 'punto' and new.geometry ->> 'type' <> 'Point')
       or (kind = 'linea' and new.geometry ->> 'type' <> 'LineString')
       or (kind = 'poligono' and new.geometry ->> 'type' <> 'Polygon') then
      raise exception 'La geometría no corresponde al tipo de símbolo %.', new.feature_type_code;
    end if;
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists mdesr_guard_plan on public.site_plans;
create trigger mdesr_guard_plan before insert or update or delete on public.site_plans
  for each row execute function public.mdesr_guard_plan();
drop trigger if exists mdesr_guard_plan on public.plan_features;
create trigger mdesr_guard_plan before insert or update or delete on public.plan_features
  for each row execute function public.mdesr_guard_plan();

-- ═══ E7 · Seguimiento ══════════════════════════════════════════════════════

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  recommendation_id uuid not null references public.recommendations(id) on delete restrict,
  treatment_id uuid references public.treatments(id) on delete set null,
  title text not null,
  description text,
  responsible_party text not null default 'cliente' check (responsible_party in ('cliente','stratec','tercero')),
  responsible_name text,
  due_date date,
  status text not null default 'pendiente' check (status in ('pendiente','en_proceso','completada','cancelada')),
  progress_pct smallint not null default 0 check (progress_pct between 0 and 100),
  completed_at timestamptz,
  verification_note text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completada' or (completed_at is not null and progress_pct = 100))
);

create table if not exists public.action_item_evidence (
  action_item_id uuid not null references public.action_items(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  primary key (action_item_id, evidence_id)
);

create table if not exists public.followup_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  review_type text not null check (review_type in ('seguimiento','revision_periodica','post_incidente','cierre')),
  review_date date not null,
  summary text not null,
  conclusions text,
  next_review_date date,
  reviewed_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.indicators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  description text, formula text, unit text,
  target_value numeric,
  direction text not null default 'mayor_mejor' check (direction in ('mayor_mejor','menor_mejor')),
  frequency text not null default 'mensual' check (frequency in ('mensual','trimestral','semestral','anual','por_evento')),
  recommendation_id uuid references public.recommendations(id) on delete set null,
  risk_scenario_id uuid references public.risk_scenarios(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

create table if not exists public.indicator_measurements (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references public.indicators(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  value numeric not null,
  data_source text,
  measured_by uuid not null references auth.users(id) default auth.uid(),
  measured_at timestamptz not null default now(),
  notes text,
  unique (indicator_id, period_start),
  check (period_end >= period_start)
);

-- ═══ Triggers comunes: candado de contenido, auditoría y updated_at ════════

-- Candado de contenido (R-09): tabla, tabla padre, FK hacia el padre
do $$
declare t record;
begin
  for t in select * from (values
      ('assessment_instruments','',''), ('responses','',''), ('pestel_factors','',''), ('findings','',''),
      ('threats','',''), ('vulnerabilities','',''), ('risk_scenarios','',''), ('controls','',''),
      ('recommendations','',''), ('risk_evaluations','',''),
      ('pestel_factor_sources','pestel_factors','pestel_factor_id'),
      ('threat_sources','threats','threat_id'),
      ('vulnerability_findings','vulnerabilities','vulnerability_id'),
      ('finding_evidence','findings','finding_id'),
      ('response_evidence','responses','response_id'),
      ('risk_scenario_vulnerabilities','risk_scenarios','risk_scenario_id'),
      ('risk_scenario_assets','risk_scenarios','risk_scenario_id'),
      ('risk_scenario_findings','risk_scenarios','risk_scenario_id'),
      ('risk_scenario_controls','risk_scenarios','risk_scenario_id'),
      ('risk_evaluation_controls','risk_evaluations','risk_evaluation_id'),
      ('control_effectiveness_reviews','controls','control_id'),
      ('treatments','risk_scenarios','risk_scenario_id'),
      ('treatment_recommendations','recommendations','recommendation_id'),
      ('recommendation_findings','recommendations','recommendation_id')
    ) as m(tbl, parent, fk)
  loop
    execute format('drop trigger if exists mdesr_guard_content on public.%I', t.tbl);
    execute format('create trigger mdesr_guard_content before insert or update or delete on public.%I
                    for each row execute function public.mdesr_guard_content(%L, %L)', t.tbl, t.parent, t.fk);
  end loop;
end $$;

-- Auditoría (R-16). Mismos argumentos para ubicar el diagnóstico.
create or replace function public.mdesr_audit()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  r_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  r_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  r jsonb := coalesce(r_new, r_old);
  a_id uuid;
  p_id uuid;
  llave text;
  cambios text[];
begin
  a_id := case when tg_table_name = 'assessments' then (r ->> 'id')::uuid
               else public.mdesr_row_assessment(r, tg_argv[0], tg_argv[1]) end;
  p_id := coalesce(case when tg_table_name = 'projects' then (r ->> 'id')::uuid end,
                   (r ->> 'project_id')::uuid,
                   public.mdesr_assessment_project(a_id));
  llave := coalesce(r ->> 'id',
                    (select string_agg(value, '|' order by key) from jsonb_each_text(r) where key like '%\_id' escape '\'),
                    md5(r::text));
  if tg_op = 'UPDATE' then
    select array_agg(k) into cambios from jsonb_object_keys(r_new) k where r_new -> k is distinct from r_old -> k;
    if cambios is null or cambios = array['updated_at'] then return new; end if;
  end if;
  insert into public.audit_log (table_name, record_id, project_id, assessment_id, operation, via_transition, old_data, new_data, changed_fields)
  values (tg_table_name, llave, p_id, a_id, tg_op,
          coalesce(current_setting('mdesr.internal', true), '') = 'on', r_old, r_new, cambios);
  return coalesce(new, old);
end $$;

do $$
declare t record;
begin
  for t in select * from (values
      ('projects','',''), ('project_members','',''), ('project_phases','',''), ('study_objects','',''),
      ('project_study_objects','',''), ('sites','',''), ('areas','',''), ('assets','',''),
      ('methodology_versions','',''),
      ('instrument_versions','',''), ('risk_scale_versions','',''),
      ('assessments','',''), ('assessment_instruments','',''), ('responses','',''), ('information_sources','',''),
      ('pestel_factors','',''), ('findings','',''), ('threats','',''), ('vulnerabilities','',''), ('evidence','',''),
      ('risk_scenarios','',''), ('controls','',''), ('recommendations','',''), ('risk_evaluations','',''),
      ('pestel_factor_sources','pestel_factors','pestel_factor_id'),
      ('threat_sources','threats','threat_id'),
      ('vulnerability_findings','vulnerabilities','vulnerability_id'),
      ('finding_evidence','findings','finding_id'),
      ('response_evidence','responses','response_id'),
      ('risk_scenario_vulnerabilities','risk_scenarios','risk_scenario_id'),
      ('risk_scenario_assets','risk_scenarios','risk_scenario_id'),
      ('risk_scenario_findings','risk_scenarios','risk_scenario_id'),
      ('risk_scenario_controls','risk_scenarios','risk_scenario_id'),
      ('risk_evaluation_controls','risk_evaluations','risk_evaluation_id'),
      ('control_effectiveness_reviews','controls','control_id'),
      ('treatments','risk_scenarios','risk_scenario_id'),
      ('treatment_recommendations','recommendations','recommendation_id'),
      ('recommendation_findings','recommendations','recommendation_id'),
      ('documents','',''), ('document_annexes','',''), ('review_comments','',''),
      ('site_plans','',''), ('plan_features','',''),
      ('action_items','',''), ('action_item_evidence','',''), ('followup_reviews','',''),
      ('indicators','',''), ('indicator_measurements','','')
    ) as m(tbl, parent, fk)
  loop
    execute format('drop trigger if exists mdesr_audit on public.%I', t.tbl);
    execute format('create trigger mdesr_audit after insert or update or delete on public.%I
                    for each row execute function public.mdesr_audit(%L, %L)', t.tbl, t.parent, t.fk);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['projects','project_phases','study_objects','sites','areas','assets','assessments',
                           'responses','pestel_factors','findings','threats','vulnerabilities','risk_scenarios',
                           'controls','treatments','recommendations','site_plans','plan_features','action_items','indicators']
  loop
    execute format('drop trigger if exists mdesr_touch on public.%I', t);
    execute format('create trigger mdesr_touch before update on public.%I
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ═══ RLS (sección 10) ══════════════════════════════════════════════════════

-- Contenido del diagnóstico: leer miembros; escribir quien puede preparar en borrador.
-- (El candado de estado lo hace además mdesr_guard_content.)
do $$
declare t record; p record;
begin
  for t in select * from (values
      ('assessment_instruments','assessment_id', true),
      ('responses','assessment_id', true),
      ('pestel_factors','assessment_id', true),
      ('findings','assessment_id', true),
      ('threats','assessment_id', true),
      ('vulnerabilities','assessment_id', true),
      ('risk_scenarios','assessment_id', true),
      ('controls','assessment_id', true),
      ('recommendations','assessment_id', true),
      ('risk_evaluations','assessment_id', false),
      ('pestel_factor_sources','public.mdesr_parent_assessment(''pestel_factors'', pestel_factor_id)', true),
      ('threat_sources','public.mdesr_parent_assessment(''threats'', threat_id)', true),
      ('vulnerability_findings','public.mdesr_parent_assessment(''vulnerabilities'', vulnerability_id)', true),
      ('finding_evidence','public.mdesr_parent_assessment(''findings'', finding_id)', true),
      ('response_evidence','public.mdesr_parent_assessment(''responses'', response_id)', true),
      ('risk_scenario_vulnerabilities','public.mdesr_parent_assessment(''risk_scenarios'', risk_scenario_id)', true),
      ('risk_scenario_assets','public.mdesr_parent_assessment(''risk_scenarios'', risk_scenario_id)', true),
      ('risk_scenario_findings','public.mdesr_parent_assessment(''risk_scenarios'', risk_scenario_id)', true),
      ('risk_scenario_controls','public.mdesr_parent_assessment(''risk_scenarios'', risk_scenario_id)', true),
      ('risk_evaluation_controls','public.mdesr_parent_assessment(''risk_evaluations'', risk_evaluation_id)', false),
      ('control_effectiveness_reviews','public.mdesr_parent_assessment(''controls'', control_id)', false),
      ('treatments','public.mdesr_parent_assessment(''risk_scenarios'', risk_scenario_id)', true),
      ('treatment_recommendations','public.mdesr_parent_assessment(''recommendations'', recommendation_id)', true),
      ('recommendation_findings','public.mdesr_parent_assessment(''recommendations'', recommendation_id)', true)
    ) as m(tbl, expr, editable)
  loop
    execute format('alter table public.%I enable row level security', t.tbl);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t.tbl and policyname like 'mdesr %' loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t.tbl);
    end loop;
    execute format('create policy "mdesr leer" on public.%I for select to authenticated
                    using (public.mdesr_can_read(public.mdesr_assessment_project(%s)))', t.tbl, t.expr);
    execute format('create policy "mdesr alta" on public.%I for insert to authenticated
                    with check (public.mdesr_can_prepare(%s))', t.tbl, t.expr);
    if t.editable then
      execute format('create policy "mdesr editar" on public.%I for update to authenticated
                      using (public.mdesr_can_prepare(%s)) with check (public.mdesr_can_prepare(%s))', t.tbl, t.expr, t.expr);
      execute format('create policy "mdesr borrar" on public.%I for delete to authenticated
                      using (public.mdesr_can_prepare(%s))', t.tbl, t.expr);
    end if;
    execute format('grant select, insert, update, delete on public.%I to authenticated', t.tbl);
    execute format('grant all on public.%I to service_role', t.tbl);
  end loop;
end $$;

-- Biblioteca: leer cualquier usuario con rol; escribir quien administra instrumentos
do $$
declare t text; p record;
begin
  foreach t in array array['methodology_versions','normative_references','instruments','instrument_versions',
                           'instrument_sections','criteria','criterion_references','questions','question_equivalences',
                           'risk_scales','risk_scale_versions','risk_scale_levels','risk_level_bands','escalation_rules',
                           'threat_catalog','plan_feature_types']
  loop
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t and policyname like 'mdesr %' loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
    execute format('create policy "mdesr leer" on public.%I for select to authenticated
                    using (public.has_any_role(auth.uid()))', t);
    execute format('create policy "mdesr administrar" on public.%I for all to authenticated
                    using (public.mdesr_has_faculty(''mdesr.manage_instruments''))
                    with check (public.mdesr_has_faculty(''mdesr.manage_instruments''))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- Tablas de nivel proyecto y gobierno: políticas una por una
do $$
declare t text; p record;
begin
  foreach t in array array['projects','project_members','project_phases',
                           'study_objects','project_study_objects','sites','areas','assets','project_log_entries',
                           'audit_log','assessments','information_sources','evidence','approval_records',
                           'review_comments','document_annexes','site_plans','plan_features','action_items',
                           'action_item_evidence','followup_reviews','indicators','indicator_measurements']
  loop
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t and policyname like 'mdesr %' loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- Proyectos (D-03: el admin ve la ficha y el equipo; no el contenido técnico)
create policy "mdesr leer" on public.projects for select to authenticated
  using (public.mdesr_can_read(id) or public.has_role(auth.uid(), 'admin'));
create policy "mdesr alta" on public.projects for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'consultant'));
create policy "mdesr editar" on public.projects for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or 'consultor_validador' = any(public.mdesr_functions(id)))
  with check (public.has_role(auth.uid(), 'admin') or 'consultor_validador' = any(public.mdesr_functions(id)));

create policy "mdesr leer" on public.project_members for select to authenticated
  using (public.mdesr_can_read(project_id) or public.has_role(auth.uid(), 'admin'));
create policy "mdesr asignar" on public.project_members for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin')
              or (project_function in ('revisor','consultor_validador')
                  and public.mdesr_has_faculty('mdesr.assign_reviewer')
                  and 'consultor_validador' = any(public.mdesr_functions(project_id))));
create policy "mdesr dar de baja" on public.project_members for update to authenticated
  using (public.has_role(auth.uid(), 'admin')
         or (project_function in ('revisor','consultor_validador')
             and public.mdesr_has_faculty('mdesr.assign_reviewer')
             and 'consultor_validador' = any(public.mdesr_functions(project_id))))
  with check (true);

create policy "mdesr leer" on public.project_phases for select to authenticated using (public.mdesr_can_read(project_id));
create policy "mdesr editar" on public.project_phases for update to authenticated
  using (public.mdesr_functions(project_id) && array['elaborador','consultor_validador'])
  with check (public.mdesr_functions(project_id) && array['elaborador','consultor_validador']);

create policy "mdesr leer" on public.study_objects for select to authenticated using (public.mdesr_can_read_object(id));
create policy "mdesr alta" on public.study_objects for insert to authenticated
  with check (public.mdesr_has_faculty('mdesr.prepare'));
create policy "mdesr editar" on public.study_objects for update to authenticated
  using (public.mdesr_can_edit_object(id)) with check (public.mdesr_can_edit_object(id));

create policy "mdesr leer" on public.project_study_objects for select to authenticated using (public.mdesr_can_read(project_id));
create policy "mdesr ligar" on public.project_study_objects for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.mdesr_functions(project_id) && array['elaborador','consultor_validador']);

create policy "mdesr leer" on public.sites for select to authenticated using (public.mdesr_can_read_object(study_object_id));
create policy "mdesr escribir" on public.sites for all to authenticated
  using (public.mdesr_can_edit_object(study_object_id)) with check (public.mdesr_can_edit_object(study_object_id));
create policy "mdesr leer" on public.areas for select to authenticated
  using (public.mdesr_can_read_object((select study_object_id from public.sites s where s.id = site_id)));
create policy "mdesr escribir" on public.areas for all to authenticated
  using (public.mdesr_can_edit_object((select study_object_id from public.sites s where s.id = site_id)))
  with check (public.mdesr_can_edit_object((select study_object_id from public.sites s where s.id = site_id)));
create policy "mdesr leer" on public.assets for select to authenticated using (public.mdesr_can_read_object(study_object_id));
create policy "mdesr escribir" on public.assets for all to authenticated
  using (public.mdesr_can_edit_object(study_object_id)) with check (public.mdesr_can_edit_object(study_object_id));

create policy "mdesr leer" on public.project_log_entries for select to authenticated using (public.mdesr_can_read(project_id));
create policy "mdesr alta" on public.project_log_entries for insert to authenticated
  with check (public.mdesr_can_read(project_id) and author_id = auth.uid());

create policy "mdesr leer" on public.audit_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or (project_id is not null and public.mdesr_can_read(project_id)));
-- Sin políticas de escritura: solo los triggers (security definer) escriben en audit_log.

create policy "mdesr leer" on public.assessments for select to authenticated
  using (public.mdesr_can_read(project_id));
create policy "mdesr alta" on public.assessments for insert to authenticated
  with check (public.mdesr_has_faculty('mdesr.prepare')
              and public.mdesr_functions(project_id) && array['elaborador','consultor_validador']);
create policy "mdesr editar" on public.assessments for update to authenticated
  using (public.mdesr_can_prepare(id)) with check (public.mdesr_can_prepare(id));

create policy "mdesr leer" on public.information_sources for select to authenticated
  using (project_id is null and public.has_any_role(auth.uid()) or public.mdesr_can_read(project_id));
create policy "mdesr alta" on public.information_sources for insert to authenticated
  with check (public.mdesr_has_faculty('mdesr.prepare') and (project_id is null or public.mdesr_can_read(project_id)));

create policy "mdesr leer" on public.evidence for select to authenticated using (public.mdesr_can_read(project_id));
create policy "mdesr alta" on public.evidence for insert to authenticated
  with check (public.mdesr_has_faculty('mdesr.prepare') and public.mdesr_can_read(project_id)
              and (assessment_id is null or public.mdesr_can_prepare(assessment_id)));
create policy "mdesr retirar" on public.evidence for update to authenticated
  using (public.mdesr_has_faculty('mdesr.prepare') and public.mdesr_can_read(project_id))
  with check (public.mdesr_has_faculty('mdesr.prepare') and public.mdesr_can_read(project_id));

create policy "mdesr leer" on public.approval_records for select to authenticated
  using (public.mdesr_can_read(coalesce(public.mdesr_assessment_project(assessment_id),
                                         (select d.project_id from public.documents d where d.id = document_id))));
-- Sin políticas de escritura: solo mdesr_transition_subject y los triggers.

create policy "mdesr leer" on public.review_comments for select to authenticated
  using (public.mdesr_can_read(coalesce(public.mdesr_assessment_project(assessment_id),
                                         (select d.project_id from public.documents d where d.id = document_id))));
create policy "mdesr comentar" on public.review_comments for insert to authenticated
  with check (author_id = auth.uid() and public.mdesr_has_faculty('mdesr.comment')
              and public.mdesr_can_read(coalesce(public.mdesr_assessment_project(assessment_id),
                                                  (select d.project_id from public.documents d where d.id = document_id))));
create policy "mdesr atender" on public.review_comments for update to authenticated
  using (public.mdesr_can_read(coalesce(public.mdesr_assessment_project(assessment_id),
                                         (select d.project_id from public.documents d where d.id = document_id))))
  with check (true);

create policy "mdesr leer" on public.document_annexes for select to authenticated
  using (public.mdesr_can_read((select d.project_id from public.documents d where d.id = document_id)));
create policy "mdesr escribir" on public.document_annexes for all to authenticated
  using ('elaborador' = any(public.mdesr_functions((select d.project_id from public.documents d where d.id = document_id))))
  with check ('elaborador' = any(public.mdesr_functions((select d.project_id from public.documents d where d.id = document_id))));

create policy "mdesr leer" on public.site_plans for select to authenticated using (public.mdesr_can_read_object(
  (select s.study_object_id from public.sites s where s.id = site_id)));
create policy "mdesr escribir" on public.site_plans for all to authenticated
  using (public.mdesr_can_edit_object((select s.study_object_id from public.sites s where s.id = site_id)))
  with check (public.mdesr_can_edit_object((select s.study_object_id from public.sites s where s.id = site_id)));
create policy "mdesr leer" on public.plan_features for select to authenticated using (public.mdesr_can_read_object(
  (select s.study_object_id from public.site_plans sp join public.sites s on s.id = sp.site_id where sp.id = site_plan_id)));
create policy "mdesr escribir" on public.plan_features for all to authenticated
  using (public.mdesr_can_edit_object((select s.study_object_id from public.site_plans sp join public.sites s on s.id = sp.site_id where sp.id = site_plan_id)))
  with check (public.mdesr_can_edit_object((select s.study_object_id from public.site_plans sp join public.sites s on s.id = sp.site_id where sp.id = site_plan_id)));

do $$
declare t text;
begin
  foreach t in array array['action_items','followup_reviews','indicators'] loop
    execute format('create policy "mdesr leer" on public.%I for select to authenticated using (public.mdesr_can_read(project_id))', t);
    execute format('create policy "mdesr escribir" on public.%I for all to authenticated
                    using (public.mdesr_has_faculty(''mdesr.prepare'') and public.mdesr_can_read(project_id))
                    with check (public.mdesr_has_faculty(''mdesr.prepare'') and public.mdesr_can_read(project_id))', t);
  end loop;
end $$;
create policy "mdesr leer" on public.action_item_evidence for select to authenticated
  using (public.mdesr_can_read((select a.project_id from public.action_items a where a.id = action_item_id)));
create policy "mdesr escribir" on public.action_item_evidence for insert to authenticated
  with check (public.mdesr_has_faculty('mdesr.prepare')
              and public.mdesr_can_read((select a.project_id from public.action_items a where a.id = action_item_id)));
create policy "mdesr leer" on public.indicator_measurements for select to authenticated
  using (public.mdesr_can_read((select i.project_id from public.indicators i where i.id = indicator_id)));
create policy "mdesr escribir" on public.indicator_measurements for insert to authenticated
  with check (public.mdesr_has_faculty('mdesr.prepare')
              and public.mdesr_can_read((select i.project_id from public.indicators i where i.id = indicator_id)));

-- ── Reasignación de proyectos y clientes (facultad mdesr.reassign) ─────────
-- Mueve una función de proyecto de una persona a otra, o el cliente (y sus
-- proyectos activos) a otro responsable. Deja la baja, el alta y el motivo en
-- audit_log y en la bitácora del proyecto.
create or replace function public.mdesr_reassign_member(
  _project uuid, _from uuid, _to uuid, _function text, _reason text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_capability(auth.uid(), 'mdesr.reassign') then
    raise exception 'Se requiere la facultad mdesr.reassign.';
  end if;
  if coalesce(length(btrim(_reason)), 0) < 10 then
    raise exception 'Escribe el motivo de la reasignación.';
  end if;
  update public.project_members set removed_at = now(), removed_by = auth.uid()
   where project_id = _project and user_id = _from and project_function = _function and removed_at is null;
  if not found then raise exception 'Esa persona no tiene esa función en el proyecto.'; end if;
  insert into public.project_members (project_id, user_id, project_function, notes)
  values (_project, _to, _function, 'Reasignación: ' || _reason);
  insert into public.project_log_entries (project_id, entry_type, summary, details)
  values (_project, 'decision', 'Reasignación de ' || _function, _reason);
end $$;

create or replace function public.mdesr_reassign_client(_client uuid, _to uuid, _reason text)
returns void language plpgsql security definer set search_path = public
as $$
declare anterior uuid;
begin
  if not public.has_capability(auth.uid(), 'mdesr.reassign') then
    raise exception 'Se requiere la facultad mdesr.reassign.';
  end if;
  if coalesce(length(btrim(_reason)), 0) < 10 then
    raise exception 'Escribe el motivo de la reasignación.';
  end if;
  select owner_id into anterior from public.clients where id = _client for update;
  update public.clients set owner_id = _to where id = _client;
  update public.projects set owner_id = _to where client_id = _client and status in ('propuesta','activo','suspendido');
  insert into public.audit_log (table_name, record_id, operation, old_data, new_data, changed_fields)
  values ('clients', _client::text, 'UPDATE', jsonb_build_object('owner_id', anterior),
          jsonb_build_object('owner_id', _to, 'motivo', _reason), array['owner_id']);
end $$;

-- ── Permisos de ejecución de funciones ─────────────────────────────────────
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'mdesr\_%' escape '\'
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
revoke all on public.mdesr_project_overview from anon, public;
grant select on public.mdesr_project_overview to authenticated;

notify pgrst, 'reload schema';

-- ── Revertir (no se ejecuta; borra TODO lo de M-DESR, incluidos sus datos) ──
-- Solo en la base de pruebas. En orden inverso: E7 → E1, luego:
--   drop policy … on public.documents (las 7 "mdesr entregables …");
--   alter table public.documents drop column if exists project_id, … (11 columnas);
--   delete from storage.buckets where id in ('mdesr-evidencias','mdesr-entregables');
--   delete from public.access_rules where role = 'consultant';
-- El valor 'consultant' de app_role no se puede quitar de un enum sin recrearlo.
