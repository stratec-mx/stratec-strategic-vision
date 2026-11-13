-- Propuesta 07: agrega "whatsapp" como origen de lead.
-- Sin esto, la función whatsapp-lead guarda los leads del bot con origen "other"
-- y la marca [whatsapp] en las notas; con esto, quedan con origen "whatsapp".
-- Es aditivo: no cambia ni borra datos. Si ya existe, no hace nada.
--
-- IMPORTANTE: se ejecuta en DOS pasos separados en el SQL Editor.
-- Postgres no permite usar un valor de enum recién agregado dentro de la misma
-- transacción, y el SQL Editor corre todo el texto como una sola transacción:
-- si pegas los dos pasos juntos, falla y no cambia nada.

-- PASO 1 (ejecútalo solo):
alter type public.lead_source add value if not exists 'whatsapp';

-- PASO 2 (ejecútalo aparte, después del paso 1): debe aparecer 'whatsapp' en la lista.
-- select unnest(enum_range(null::public.lead_source)) as origen;
