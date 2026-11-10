-- STRATEC · Revisión del estado actual de la base de datos. SOLO LECTURA:
-- no crea, modifica ni borra nada, y no muestra datos personales (solo conteos).
-- Ejecútalo antes de 01, 02 y 03, y comparte el resultado con quien revise.
-- En el resultado, el tipo "02 cambiaría" resume lo que 02 haría con los roles.

select 'tabla' as tipo, t.name as objeto,
       case when to_regclass('public.' || t.name) is null then 'NO EXISTE' else 'existe' end as estado,
       (select relrowsecurity::text from pg_class where oid = to_regclass('public.' || t.name)) as detalle
from (values ('profiles'), ('user_roles'), ('access_rules'), ('leads'), ('clients'), ('deals'),
             ('activities'), ('appointments'), ('quotes'), ('documents'), ('rate_limits'),
             ('service_rates'), ('lead_contacts'), ('client_contacts')) as t(name)

union all
select 'tipo', t.typname, string_agg(e.enumlabel, ', ' order by e.enumsortorder), null
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
group by t.typname

union all
select 'función', p.oid::regprocedure::text, 'existe',
       case when p.prosecdef then 'security definer' else 'security invoker' end
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('can_access', 'has_role', 'has_any_role', 'touch_updated_at', 'handle_new_user', 'service_rates_stamp')

-- Todas las políticas que 02 y 03 reemplazarían
union all
select 'política', tablename || ' · ' || policyname, cmd,
       coalesce('USING ' || qual, '') || coalesce('  CHECK ' || with_check, '')
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'user_roles', 'access_rules', 'leads', 'clients', 'deals', 'activities',
                    'appointments', 'quotes', 'documents', 'service_rates')

union all
select 'columna', 'quotes.' || column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'quotes'

union all
select 'roles', 'cuentas en auth.users', count(*)::text, null
from auth.users

union all
select 'roles', 'asignaciones con rol ' || role::text, count(*)::text, null
from public.user_roles
group by role

union all
select '02 cambiaría', 'asignaciones repetidas que borraría', coalesce(sum(c - 1), 0)::text,
       'mismo usuario y mismo rol más de una vez; queda una de cada una'
from (select count(*) as c from public.user_roles group by user_id, role having count(*) > 1) d

union all
select '02 cambiaría', 'cuentas que recibirían admin',
       case when exists (select 1 from public.user_roles where role::text = 'admin') then '0'
            else (select count(*) from auth.users)::text end,
       'solo ocurre si hoy no hay ningún admin'

order by 1, 2;
