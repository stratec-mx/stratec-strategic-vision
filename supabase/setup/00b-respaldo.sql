-- STRATEC · Respaldo antes de ejecutar 02 y 03.
-- Copia los roles, las reglas de acceso, los perfiles y la definición de todas
-- las políticas a un esquema privado llamado "respaldo". La API del sitio no
-- expone ese esquema y los usuarios del sitio no tienen acceso a él.
-- No modifica ni borra nada de las tablas originales.
-- Cada ejecución crea copias nuevas con fecha y hora en el nombre.
--
-- Alternativa sin escribir en la base: en el SQL Editor ejecuta
--   select * from public.user_roles;   y   select * from pg_policies where schemaname = 'public';
-- y descarga cada resultado con "Export → CSV".

create schema if not exists respaldo;
revoke all on schema respaldo from public, anon, authenticated;

do $$
declare
  sufijo constant text := to_char(now(), 'YYYYMMDD_HH24MI');
  t text;
begin
  foreach t in array array['user_roles', 'access_rules', 'profiles'] loop
    if to_regclass('public.' || t) is not null then
      execute format('create table respaldo.%I as table public.%I', t || '_' || sufijo, t);
    end if;
  end loop;
  execute format(
    'create table respaldo.%I as
       select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
       from pg_policies where schemaname = ''public''',
    'politicas_' || sufijo);
end $$;

-- Copias creadas y número de filas de cada una
select c.relname as copia,
       (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from respaldo.%I', c.relname), false, true, '')))[1]::text::int as filas
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'respaldo' and c.relkind = 'r'
order by c.relname desc;

-- Restaurar los roles (solo si hiciera falta; cambia AAAAMMDD_HHMM por el sufijo):
-- delete from public.user_roles;
-- insert into public.user_roles select * from respaldo.user_roles_AAAAMMDD_HHMM;
