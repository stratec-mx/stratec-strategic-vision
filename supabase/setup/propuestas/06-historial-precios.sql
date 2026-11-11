-- STRATEC · PROPUESTA (NO EJECUTAR TODAVÍA) · Historial de precios que no se puede borrar
--
-- Estado: borrador para el revisor. Va después de 02 y 03 y de su dictamen.
--
-- Por qué: hoy el registro de precio (sugerido, final, diferencia, motivo,
-- quién y cuándo) se guarda dentro de cada concepto de la cotización
-- (columna quotes.items, sin cambiar tablas). Sirve para el registro y las
-- alertas, pero lo escribe el navegador y quien pueda editar la cotización
-- podría alterarlo. Esta tabla lo copia en la base con un trigger: el autor y
-- la hora los pone el servidor y nadie puede modificar ni borrar las filas.
--
-- Solo agrega: una tabla nueva y un trigger. No modifica cotizaciones ni datos
-- existentes. Las cotizaciones anteriores quedan como "Sin registro".

create table if not exists public.quote_price_log (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  evento text not null check (evento in ('alta', 'cambio')),
  subtotal numeric(14,2) not null,
  total numeric(14,2) not null,
  items jsonb not null,              -- conceptos con su registro de precio
  requiere_revision boolean not null default false,
  hecho_por uuid default auth.uid(), -- lo pone el servidor, no el navegador
  hecho_en timestamptz not null default now()
);

alter table public.quote_price_log enable row level security;

-- Leer: quien puede ver cotizaciones. Escribir: solo el trigger (sin políticas
-- de insert/update/delete, nadie puede escribir ni borrar desde la API).
drop policy if exists "price log read" on public.quote_price_log;
create policy "price log read" on public.quote_price_log for select to authenticated
  using (public.can_access('quotes', 'read'));

create or replace function public.log_quote_price() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE'
     and new.items is not distinct from old.items
     and new.subtotal is not distinct from old.subtotal
     and new.total is not distinct from old.total then
    return new; -- cambiar estado u horas reales no es un cambio de precio
  end if;
  insert into public.quote_price_log (quote_id, evento, subtotal, total, items, requiere_revision)
  values (
    new.id,
    case when tg_op = 'INSERT' then 'alta' else 'cambio' end,
    new.subtotal, new.total, new.items,
    exists (select 1 from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) i
            where coalesce((i -> 'pricing' ->> 'out_of_range')::boolean, false))
  );
  return new;
end $$;

drop trigger if exists quote_price_log_trg on public.quotes;
create trigger quote_price_log_trg after insert or update on public.quotes
  for each row execute function public.log_quote_price();

-- Reversión:
-- drop trigger if exists quote_price_log_trg on public.quotes;
-- drop function if exists public.log_quote_price();
-- drop table if exists public.quote_price_log;
