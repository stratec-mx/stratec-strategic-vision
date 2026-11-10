-- STRATEC · Revisión del estado actual de la base de datos. SOLO LECTURA:
-- no crea, modifica ni borra nada, y no muestra datos personales.
-- Ejecútalo antes de 02 y 03, y comparte el resultado con quien revise.

select 'tabla' as tipo, t.name as objeto,
       case when to_regclass('public.' || t.name) is null then 'NO EXISTE' else 'existe' end as estado,
       (select relrowsecurity::text from pg_class where oid = to_regclass('public.' || t.name)) as rls_activo
from (values ('profiles'), ('user_roles'), ('access_rules'), ('leads'), ('clients'), ('deals'),
             ('activities'), ('appointments'), ('quotes'), ('documents'), ('rate_limits'),
             ('service_rates'), ('lead_contacts'), ('client_contacts')) as t(name)

union all
select 'función', p.oid::regprocedure::text, 'existe',
       case when p.prosecdef then 'security definer' else 'security invoker' end
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('can_access', 'has_role', 'has_any_role', 'touch_updated_at', 'service_rates_stamp')

union all
select 'política', tablename || ' · ' || policyname, cmd,
       coalesce('USING ' || qual, '') || coalesce('  CHECK ' || with_check, '')
from pg_policies
where schemaname = 'public' and tablename in ('quotes', 'service_rates', 'leads', 'clients', 'documents', 'access_rules', 'user_roles')

union all
select 'columna', 'quotes.' || column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'quotes'

union all
select 'usuarios', 'con rol admin', count(*)::text, null
from public.user_roles where role::text = 'admin'

order by 1, 2;
