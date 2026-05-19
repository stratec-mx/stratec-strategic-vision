-- Roles enum and table
create type public.app_role as enum ('admin', 'executive', 'analyst');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.has_any_role(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- User roles policies
create policy "Users can view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Auto profile + default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'executive');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Leads
create type public.lead_status as enum ('new','contacted','qualified','unqualified','converted');
create type public.lead_source as enum ('web','referral','event','outbound','partner','other');

create table public.leads (
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
alter table public.leads enable row level security;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();

-- Clients
create table public.clients (
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
alter table public.clients enable row level security;
create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();

-- Deals / Pipeline
create type public.deal_stage as enum ('prospeccion','diagnostico','propuesta','negociacion','cierre','perdido');

create table public.deals (
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
alter table public.deals enable row level security;
create trigger deals_touch before update on public.deals for each row execute function public.touch_updated_at();

-- Activities timeline
create type public.activity_type as enum ('note','call','email','meeting','whatsapp','task','stage_change');

create table public.activities (
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
alter table public.activities enable row level security;

-- Quotes
create type public.quote_status as enum ('draft','sent','accepted','rejected','expired');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  status public.quote_status not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  currency text not null default 'USD',
  valid_until date,
  items jsonb not null default '[]'::jsonb,
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quotes enable row level security;
create trigger quotes_touch before update on public.quotes for each row execute function public.touch_updated_at();

-- Appointments
create table public.appointments (
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
alter table public.appointments enable row level security;

-- Generic CRM RLS: any authenticated user with a role may read; executives+admins write; admins delete
do $$
declare t text;
begin
  for t in select unnest(array['leads','clients','deals','activities','quotes','appointments']) loop
    execute format($p$
      create policy "crm read" on public.%I for select using (public.has_any_role(auth.uid()));
      create policy "crm insert" on public.%I for insert with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'executive'));
      create policy "crm update" on public.%I for update using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'executive'));
      create policy "crm delete" on public.%I for delete using (public.has_role(auth.uid(),'admin'));
    $p$, t, t, t, t);
  end loop;
end $$;

-- Indexes
create index on public.leads (status, created_at desc);
create index on public.deals (stage, position);
create index on public.activities (deal_id, created_at desc);
create index on public.appointments (starts_at);