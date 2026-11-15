-- Propuesta 08 (NO ejecutada): agrega el rol "Asesor" (advisor) para las
-- personas nuevas que se den de alta en el panel.
--
-- Requisito: haber ejecutado antes 02-tablas-y-permisos.sql (crea access_rules).
-- Es aditivo: no cambia roles ya asignados ni borra datos.
--
-- IMPORTANTE: se ejecuta en DOS pasos separados en el SQL Editor.
-- Postgres no permite usar un valor de enum recién agregado dentro de la misma
-- transacción, y el SQL Editor corre todo el texto como una sola transacción.

-- PASO 1 (ejecútalo solo):
alter type public.app_role add value if not exists 'advisor';

-- PASO 2 (ejecútalo aparte, después del paso 1). Permisos iniciales del Asesor,
-- iguales a Operaciones: trabaja leads, clientes, pipeline y agenda; ve la
-- analítica; NO ve cotizaciones, documentos ni datos de contacto.
-- Se pueden cambiar después en el panel: Usuarios → matriz de accesos.
-- "on conflict do nothing": volver a correrlo no pisa cambios hechos en el panel.
--
-- insert into public.access_rules (role, resource, can_read, can_write) values
--   ('advisor','leads',true,true), ('advisor','clients',true,true), ('advisor','contactos',false,false),
--   ('advisor','pipeline',true,true), ('advisor','agenda',true,true), ('advisor','quotes',false,false),
--   ('advisor','documents',false,false), ('advisor','analytics',true,false)
-- on conflict (role, resource) do nothing;
--
-- Comprobación: deben salir 8 filas del rol advisor.
-- select resource, can_read, can_write from public.access_rules where role = 'advisor' order by resource;
