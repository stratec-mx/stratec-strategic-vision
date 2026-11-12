// whatsapp-lead: el bot de WhatsApp (Railway) avisa aquí cuando detecta un
// prospecto, y el lead aparece en /app/leads. No manda Telegram: eso ya lo hace el bot.
//
// Autenticación: header X-Agente-Secret igual al secret WHATSAPP_LEAD_SECRET,
// comparado en tiempo constante. Sin sesión de usuario (verify_jwt = false).
// Sin duplicados: si ya hay un lead del bot con ese teléfono o esa conversación,
// se actualiza y el aviso nuevo se agrega arriba en sus notas.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MARCA, bloqueNotas, iguales, unirNotas, validar } from "./logica.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Fila = { id: string; full_name: string | null; organization: string | null; notes: string | null };

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Solo POST" });

  const secreto = Deno.env.get("WHATSAPP_LEAD_SECRET") ?? "";
  if (secreto.length < 32) {
    console.error("[whatsapp-lead] falta WHATSAPP_LEAD_SECRET (mínimo 32 caracteres)");
    return json(503, { error: "Función sin configurar" });
  }
  if (!(await iguales(req.headers.get("x-agente-secret") ?? "", secreto))) return json(401, { error: "No autorizado" });

  const raw = await req.text();
  if (raw.length > 20_000) return json(413, { error: "Cuerpo demasiado grande" });
  let body: unknown = null;
  try { body = JSON.parse(raw); } catch { /* validar() responde 422 */ }
  const v = validar(body);
  if (!v.ok) return json(422, { error: v.error });
  const l = v.lead;

  const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const hora = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium", timeStyle: "short" });
  const bloque = bloqueNotas(l, hora);

  // Lead previo del bot: primero por teléfono, luego por conversación.
  let previo: Fila | null = null;
  if (l.telefono) {
    const { data } = await db.from("leads").select("id, full_name, organization, notes")
      .eq("phone", l.telefono).like("notes", `%${MARCA}%`).order("created_at", { ascending: false }).limit(1);
    previo = (data?.[0] as Fila | undefined) ?? null;
  }
  if (!previo && l.conversation_id) {
    const { data } = await db.from("leads").select("id, full_name, organization, notes")
      .like("notes", `%Conversación: ${l.conversation_id}%`).order("created_at", { ascending: false }).limit(1);
    previo = (data?.[0] as Fila | undefined) ?? null;
  }

  if (previo) {
    const cambios: Record<string, unknown> = { notes: unirNotas(previo.notes, bloque) };
    if (l.nombre && (!previo.full_name || previo.full_name.startsWith("WhatsApp "))) cambios.full_name = l.nombre;
    if (l.empresa && !previo.organization) cambios.organization = l.empresa;
    if (l.telefono) cambios.phone = l.telefono;
    const { error } = await db.from("leads").update(cambios).eq("id", previo.id);
    if (error) {
      console.error("[whatsapp-lead] update:", error.message);
      return json(500, { error: "No se pudo actualizar el lead" });
    }
    return json(200, { ok: true, accion: "actualizado", lead_id: previo.id });
  }

  const nuevo = {
    full_name: l.nombre || `WhatsApp ${l.telefono ? "…" + l.telefono.slice(-4) : l.conversation_id.slice(0, 12)}`,
    phone: l.telefono || null,
    organization: l.empresa || null,
    notes: bloque,
    status: "new",
    owner_id: null,
  };
  // Origen "whatsapp" si la base ya lo tiene (propuesta 07); si no, "other".
  let ins = await db.from("leads").insert({ ...nuevo, source: "whatsapp" }).select("id").single();
  if (ins.error && /22P02|enum|lead_source/i.test(`${ins.error.code} ${ins.error.message}`)) {
    ins = await db.from("leads").insert({ ...nuevo, source: "other" }).select("id").single();
  }
  if (ins.error) {
    console.error("[whatsapp-lead] insert:", ins.error.message);
    return json(500, { error: "No se pudo crear el lead" });
  }
  return json(201, { ok: true, accion: "creado", lead_id: (ins.data as { id: string }).id });
});
