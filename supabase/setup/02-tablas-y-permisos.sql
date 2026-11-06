-- ═══════════════════════════════════════════════════════════════════════════
-- STRATEC · Configuración de base de datos · PASO 2 de 2: tablas y permisos
-- Requiere haber ejecutado antes 01-tipos.sql (en otra consulta).
-- Es seguro ejecutarlo más de una vez: no borra datos existentes.
--
-- Equivale a todas las migraciones de supabase/migrations/ en su estado
-- final, y además corrige la política recursiva de user_roles
-- ("infinite recursion detected in policy for relation user_roles").
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Perfiles y roles ───────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

-- Se eliminan TODAS las políticas anteriores de user_roles y profiles (incluida
-- la que causaba la recursión). Debe ir antes de convertir la columna role,
-- porque Postgres no permite cambiar el tipo de una columna usada en una política.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'user_roles' loop
    execute format('drop policy if exists %I on public.user_roles', p.policyname);
  end loop;
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy if exists %I on public.profiles', p.policyname);
  end loop;
end $$;

-- Si user_roles ya existía con la columna role como texto, se convierte al enum
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_roles' and column_name = 'role' and udt_name <> 'app_role'
  ) then
    alter table public.user_roles alter column role type public.app_role using role::text::public.app_role;
  end if;
end $$;

-- El rol 'executive' se reemplazó por 'operations' (sin duplicar si ya tenía ambos)
delete from public.user_roles a using public.user_roles b
  where a.user_id = b.user_id and a.role = 'executive' and b.role = 'operations';
update public.user_roles set role = 'operations' where role = 'executive';
-- Duplicados exactos (si la tabla anterior no tenía restricción única)
delete from public.user_roles a using public.user_roles b
  where a.ctid > b.ctid and a.user_id = b.user_id and a.role = b.role;
create unique index if not exists user_roles_user_role_key on public.user_roles (user_id, role);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- ── Funciones auxiliares ───────────────────────────────────────────────────
-- SECURITY DEFINER: consultan user_roles sin pasar por sus políticas, lo que
-- evita la recursión infinita.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.has_any_role(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id) $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  -- No se asigna rol automáticamente: un admin lo asigna en el dashboard
  -- (Configuración → Usuarios y permisos). Sin rol, el usuario no ve el CRM.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles para los usuarios que ya existían antes de este script
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', email) from auth.users
on conflict (id) do nothing;

-- Las políticas RLS se evalúan con los permisos del usuario que consulta,
-- así que "authenticated" necesita poder ejecutar has_role / has_any_role.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.has_any_role(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.has_any_role(uuid) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Políticas de perfiles y roles

create policy "Users can view own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- ── Tablas del CRM ─────────────────────────────────────────────────────────
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  organization text,
  role_title text,
  source public.lead_source not null default 'web',
  status public.lead_status not null default 'new',
  score int not null default 0,
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  contact_name text,
  contact_email text,
  contact_phone text,
  country text,
  status text not null default 'active',
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  stage public.deal_stage not null default 'prospeccion',
  value_amount numeric(14,2) not null default 0,
  currency text not null default 'USD',
  probability int not null default 20,
  expected_close date,
  owner_id uuid references auth.users(id) on delete set null,
  position int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type public.activity_type not null default 'note',
  subject text not null,
  body text,
  lead_id uuid references public.leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  status public.quote_status not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  currency text not null default 'MXN',
  valid_until date,
  items jsonb not null default '[]'::jsonb,
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  attendee_name text,
  attendee_email text,
  organization text,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  location text,
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  template text not null,
  title text not null,
  client_id uuid references public.clients(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'review', 'final', 'delivered')),
  data jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Registro de límites por IP para la función submit-lead (solo service_role)
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  action text not null default 'submit_lead',
  created_at timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
create index if not exists idx_rate_limits_ip_action_created on public.rate_limits (ip, action, created_at desc);

-- Triggers de updated_at
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
drop trigger if exists clients_touch on public.clients;
create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();
drop trigger if exists deals_touch on public.deals;
create trigger deals_touch before update on public.deals for each row execute function public.touch_updated_at();
drop trigger if exists quotes_touch on public.quotes;
create trigger quotes_touch before update on public.quotes for each row execute function public.touch_updated_at();
drop trigger if exists documents_touch on public.documents;
create trigger documents_touch before update on public.documents for each row execute function public.touch_updated_at();

-- Índices
create index if not exists leads_status_created_idx on public.leads (status, created_at desc);
create index if not exists deals_stage_position_idx on public.deals (stage, position);
create index if not exists activities_deal_created_idx on public.activities (deal_id, created_at desc);
create index if not exists appointments_starts_idx on public.appointments (starts_at);
create index if not exists documents_created_idx on public.documents (created_at desc);
create index if not exists documents_client_idx on public.documents (client_id);

-- ── Permisos (RLS) del CRM ─────────────────────────────────────────────────
-- leer: cualquier usuario con rol · crear/editar: admin, analyst, operations · borrar: admin
do $$
declare t text; p record;
begin
  for t in select unnest(array['leads','clients','deals','activities','quotes','appointments','documents']) loop
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
    execute format($f$
      create policy "crm read" on public.%1$I for select to authenticated
        using (public.has_any_role(auth.uid()));
      create policy "crm insert" on public.%1$I for insert to authenticated
        with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'analyst') or public.has_role(auth.uid(),'operations'));
      create policy "crm update" on public.%1$I for update to authenticated
        using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'analyst') or public.has_role(auth.uid(),'operations'));
      create policy "crm delete" on public.%1$I for delete to authenticated
        using (public.has_role(auth.uid(),'admin'));
    $f$, t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

grant select, insert, update, delete on public.profiles, public.user_roles to authenticated;
grant all on public.profiles, public.user_roles, public.rate_limits to service_role;

-- ── Primer administrador (solo en una base sin ningún admin) ───────────────
-- En una instalación nueva, todos los usuarios existentes reciben admin para
-- poder entrar. Si ya hay al menos un admin, no cambia nada: volver a correr
-- este script nunca vuelve a dar admin a todos.
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users
where not exists (select 1 from public.user_roles where role = 'admin')
on conflict (user_id, role) do nothing;

-- Verificación: usuarios con su rol
select u.email, r.role from public.user_roles r join auth.users u on u.id = r.user_id order by u.email;
