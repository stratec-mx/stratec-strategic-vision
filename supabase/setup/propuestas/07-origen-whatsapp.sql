-- Propuesta 07 (NO ejecutada): agrega "whatsapp" como origen de lead.
-- Sin esto, la función whatsapp-lead guarda los leads del bot con origen "other"
-- y la marca [whatsapp] en las notas; con esto, quedan con origen "whatsapp".
-- Es aditivo: no cambia ni borra datos. Se ejecuta una sola vez en el SQL Editor.
alter type public.lead_source add value if not exists 'whatsapp';

-- Comprobación: debe aparecer 'whatsapp' en la lista.
select unnest(enum_range(null::public.lead_source)) as origen;
