-- Documentos entregables (diagnóstico, análisis de riesgo, dictamen, etc.)
-- generados desde el dashboard. El contenido de cada documento vive en `data`
-- (jsonb) y su estructura la define la plantilla (`template`).

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

alter table public.documents enable row level security;

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

create index if not exists documents_created_idx on public.documents (created_at desc);
create index if not exists documents_client_idx on public.documents (client_id);

-- Mismas reglas que el resto del CRM (ver 20260522053839):
-- leer: cualquier usuario con rol; crear/editar: admin, analyst, operations; borrar: admin.
drop policy if exists "crm read" on public.documents;
drop policy if exists "crm insert" on public.documents;
drop policy if exists "crm update" on public.documents;
drop policy if exists "crm delete" on public.documents;

create policy "crm read" on public.documents for select to authenticated
  using (public.has_any_role(auth.uid()));

create policy "crm insert" on public.documents for insert to authenticated
  with check (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'analyst')
    or public.has_role(auth.uid(), 'operations')
  );

create policy "crm update" on public.documents for update to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'analyst')
    or public.has_role(auth.uid(), 'operations')
  );

create policy "crm delete" on public.documents for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
