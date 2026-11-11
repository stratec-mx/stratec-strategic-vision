// STRATEC · Agente del chat del sitio (stratecsecurity.com).
// Recibe la conversación (solo texto) y responde con Claude. Si el visitante
// deja sus datos y acepta que lo contacten, el agente usa la herramienta
// registrar_contacto: se guarda el lead en el CRM y llega un aviso a Telegram.
//
// Secrets en Supabase (Edge Functions → Secrets):
//   ANTHROPIC_API_KEY   (obligatorio)
//   CHAT_MODEL          (opcional; por defecto claude-opus-5-5)
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (los mismos que usa submit-lead)
// "Verify JWT" desactivado: el chat es público; tiene límite por IP.
//
// prompt.ts se genera con: node scripts/build-chat-prompt.mjs (no se sube a GitHub).

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SYSTEM_PROMPT } from "./prompt.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SITE = "https://www.stratecsecurity.com";

const MODEL = Deno.env.get("CHAT_MODEL") || "claude-opus-5-5";
// Respaldo del servidor si el modelo declina por seguridad (no existe para Haiku)
const CON_FALLBACK = /^claude-(opus|sonnet|fable)-/.test(MODEL);

// Límites por IP
const MSG_MAX = 40; // mensajes por hora
const LEAD_MAX = 3; // contactos registrados por hora
const HORA_MS = 60 * 60 * 1000;
// Límites de la conversación que manda el navegador
const HIST_MAX = 30;
const CHARS_MSG = 1500;
const VUELTAS_HERRAMIENTA = 3;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" });
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

const HERRAMIENTAS: Anthropic.Tool[] = [
  {
    name: "registrar_contacto",
    description:
      "Registra al visitante para que un consultor de STRATEC lo contacte. Úsala solo cuando el visitante dio su nombre, un teléfono o un correo, y aceptó expresamente ser contactado. Deja en cadena vacía lo que no haya dicho.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        nombre: { type: "string", description: "Nombre del visitante" },
        telefono: { type: "string", description: "Teléfono tal como lo escribió, o cadena vacía" },
        correo: { type: "string", description: "Correo electrónico, o cadena vacía" },
        empresa: { type: "string", description: "Empresa o institución, o cadena vacía" },
        ciudad: { type: "string", description: "Ciudad o municipio y estado, o cadena vacía" },
        necesidad: { type: "string", description: "Qué necesita, en una o dos frases" },
        urgencia: { type: "string", description: "Fecha límite o urgencia, o cadena vacía" },
        medio_preferido: { type: "string", enum: ["whatsapp", "llamada", "correo", "sin preferencia"] },
        horario_preferido: { type: "string", description: "Día u horario preferido, o cadena vacía" },
        acepta_contacto: { type: "boolean", description: "true solo si el visitante aceptó expresamente ser contactado" },
      },
      required: [
        "nombre", "telefono", "correo", "empresa", "ciudad", "necesidad",
        "urgencia", "medio_preferido", "horario_preferido", "acepta_contacto",
      ],
    },
  },
];

type Contacto = {
  nombre: string; telefono: string; correo: string; empresa: string; ciudad: string;
  necesidad: string; urgencia: string; medio_preferido: string; horario_preferido: string; acepta_contacto: boolean;
};

// ── Utilidades ──────────────────────────────────────────────────────────────
const esc = (v: unknown, max = 400) =>
  String(v ?? "").substring(0, max).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function waNumber(tel: string): string | null {
  let d = tel.replace(/\D/g, "");
  if (d.length === 10) d = "52" + d;
  else if (d.length === 13 && d.startsWith("521")) d = "52" + d.slice(3);
  return d.length >= 11 && d.length <= 15 ? d : null;
}

function horaCuernavaca(): string {
  return new Date().toLocaleString("es-MX", {
    timeZone: "America/Mexico_City", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

async function excedeLimite(ip: string, accion: string, max: number): Promise<boolean> {
  const desde = new Date(Date.now() - HORA_MS).toISOString();
  const { count, error } = await supabase
    .from("rate_limits").select("*", { count: "exact", head: true })
    .eq("ip", ip).eq("action", accion).gte("created_at", desde);
  if (error) {
    console.error("[chat-agent] rate_limits:", error.message);
    return false; // si falla la consulta no se bloquea al visitante
  }
  if ((count ?? 0) >= max) return true;
  await supabase.from("rate_limits").insert({ ip, action: accion });
  return false;
}

/** Valida los datos, guarda el lead y avisa a Telegram. Devuelve el texto del tool_result. */
async function registrarContacto(c: Contacto, ip: string, conversacion: string): Promise<{ ok: boolean; texto: string }> {
  const nombre = (c.nombre || "").trim();
  const tel = (c.telefono || "").trim();
  const correo = (c.correo || "").trim();
  const telOk = tel.replace(/\D/g, "").length >= 10;
  const correoOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  if (!c.acepta_contacto) return { ok: false, texto: "Falta que el visitante acepte expresamente ser contactado." };
  if (!nombre) return { ok: false, texto: "Falta el nombre del visitante." };
  if (!telOk && !correoOk) return { ok: false, texto: "Falta un teléfono de 10 dígitos o un correo válido." };
  if (await excedeLimite(ip, "chat_lead", LEAD_MAX)) {
    return { ok: false, texto: "Ya se registraron varios contactos desde esta conexión. Pide al visitante que escriba a contacto@stratecsecurity.com." };
  }

  const notas = [
    "Chat del sitio · pidió que lo contacten",
    `Necesidad: ${c.necesidad}`,
    c.urgencia ? `Urgencia: ${c.urgencia}` : null,
    c.ciudad ? `Ciudad: ${c.ciudad}` : null,
    `Prefiere: ${c.medio_preferido}${c.horario_preferido ? ` · ${c.horario_preferido}` : ""}`,
    "",
    "Conversación:",
    conversacion,
  ].filter((l) => l !== null).join("\n").substring(0, 1900);

  const { data, error } = await supabase.from("leads").insert({
    full_name: nombre.substring(0, 100),
    // leads.email es obligatorio en el formulario; si solo dio teléfono queda vacío
    email: correoOk ? correo.substring(0, 255) : null,
    phone: telOk ? tel.substring(0, 40) : null,
    organization: (c.empresa || "No indicada").substring(0, 150),
    notes: notas,
    source: "web",
    status: "new",
  }).select("id").single();
  if (error) {
    console.error("[chat-agent] insert lead:", error.message);
    return { ok: false, texto: "No se pudo guardar el contacto por un problema técnico. Pide al visitante que escriba a contacto@stratecsecurity.com o por WhatsApp al +52 220 648 8688." };
  }

  void data;
  await avisarTelegram(c, nombre, telOk ? tel : "", correoOk ? correo : "");
  return { ok: true, texto: "Contacto registrado. Un consultor lo contactará en horario hábil." };
}

async function avisarTelegram(c: Contacto, nombre: string, tel: string, correo: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) return;
  const linea = (k: string, v: string) => (v ? `${k}: ${esc(v)}\n` : "");
  const texto =
    `💬 <b>Nuevo contacto desde el chat del sitio</b>\n⭐ <b>Pidió que lo contacten</b>\n\n` +
    `👤 <b>Contacto</b>\n` +
    linea("Nombre", nombre) + linea("Empresa", c.empresa) + linea("Ciudad", c.ciudad) +
    linea("Teléfono", tel) + linea("Correo", correo) +
    `\n📋 <b>Necesidad</b>\n${esc(c.necesidad, 600)}\n` +
    (c.urgencia ? `\n⏱️ Urgencia: ${esc(c.urgencia)}\n` : "") +
    `\n📞 Prefiere: ${esc(c.medio_preferido)}${c.horario_preferido ? ` · ${esc(c.horario_preferido)}` : ""}\n` +
    `🕐 ${esc(horaCuernavaca())}\n\n👉 <b>Siguiente paso:</b> Contáctalo por el medio que prefirió.`;

  const saludo = `Hola ${nombre.split(" ")[0]}, te escribe STRATEC Security. Nos dejaste tus datos en el chat de stratecsecurity.com. ¿Te parece si platicamos sobre lo que necesitas?`;
  const fila1: { text: string; url: string }[] = [];
  const wa = tel ? waNumber(tel) : null;
  if (wa) fila1.push({ text: "💬 WhatsApp al cliente", url: `https://wa.me/${wa}?text=${encodeURIComponent(saludo)}` });
  if (correo) fila1.push({ text: "✉️ Responder por correo", url: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(correo)}&su=${encodeURIComponent("Tu consulta a STRATEC Security")}` });
  const botones = [fila1, [{ text: "📂 Ver en el panel", url: `${SITE}/app/leads` }]].filter((f) => f.length);

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: { inline_keyboard: botones } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.warn("[chat-agent] Telegram", r.status, (await r.text()).substring(0, 200));
  } catch (e) {
    console.warn("[chat-agent] Telegram falló:", (e as Error).message);
  }
}

/** Historial del navegador → mensajes de texto válidos para la API. */
function limpiarHistorial(raw: unknown): Anthropic.MessageParam[] | null {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-HIST_MAX)
    .map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content).substring(0, CHARS_MSG) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

const textoDe = (content: Anthropic.ContentBlock[]) =>
  content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();

// ── Función ────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const body = await req.json().catch(() => null);
  const historial = limpiarHistorial(body?.messages);
  if (!historial) return json({ error: "Conversación inválida" }, 400);
  if (body?.honeypot) return json({ reply: "Gracias." });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (await excedeLimite(ip, "chat_message", MSG_MAX)) {
    return json({ reply: "Hemos recibido muchos mensajes desde su conexión. Por favor escríbanos por WhatsApp al +52 220 648 8688 o a contacto@stratecsecurity.com." });
  }

  // La hora va en un mensaje del sistema al final: el prompt grande queda fijo y en caché.
  const messages: Anthropic.MessageParam[] = [
    ...historial,
    { role: "system", content: `Fecha y hora actual en Cuernavaca: ${horaCuernavaca()}.` } as unknown as Anthropic.MessageParam,
  ];
  const conversacion = historial.slice(-8).map((m) => `${m.role === "user" ? "Visitante" : "Agente"}: ${m.content}`).join("\n");

  let registrado = false;
  try {
    for (let vuelta = 0; vuelta <= VUELTAS_HERRAMIENTA; vuelta++) {
      const params = {
        model: MODEL,
        max_tokens: 4000,
        // Chat: esfuerzo bajo (respuestas rápidas); el pensamiento no se muestra
        output_config: { effort: "low" },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
        tools: HERRAMIENTAS,
        messages,
        ...(CON_FALLBACK ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
      };
      const res = (await anthropic.beta.messages.create(params as never)) as unknown as Anthropic.Message;

      if (res.stop_reason === "refusal") {
        return json({ reply: "Prefiero que este tema lo vea directamente un consultor. Puede escribirnos por WhatsApp al +52 220 648 8688 o a contacto@stratecsecurity.com." });
      }
      if (res.stop_reason !== "tool_use") {
        return json({ reply: textoDe(res.content) || "¿Me lo puede escribir de otra forma?", registrado });
      }

      // Ejecutar las herramientas y devolver todos los resultados en un solo mensaje
      messages.push({ role: "assistant", content: res.content as unknown as Anthropic.ContentBlockParam[] });
      const resultados: Anthropic.ToolResultBlockParam[] = [];
      for (const b of res.content) {
        if (b.type !== "tool_use") continue;
        if (b.name !== "registrar_contacto" || registrado) {
          resultados.push({ type: "tool_result", tool_use_id: b.id, content: "El contacto ya fue registrado en esta conversación.", is_error: true });
          continue;
        }
        const r = await registrarContacto(b.input as Contacto, ip, conversacion);
        registrado = registrado || r.ok;
        resultados.push({ type: "tool_result", tool_use_id: b.id, content: r.texto, is_error: !r.ok });
      }
      messages.push({ role: "user", content: resultados });
    }
    return json({ reply: "Gracias. ¿Hay algo más en lo que le pueda ayudar?", registrado });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.error("[chat-agent] límite de la API de Anthropic");
    else if (err instanceof Anthropic.APIError) console.error(`[chat-agent] API ${err.status}:`, err.message);
    else console.error("[chat-agent] error:", err);
    return json({ reply: "Tengo un problema técnico en este momento. Por favor escríbanos por WhatsApp al +52 220 648 8688 o a contacto@stratecsecurity.com.", error: true });
  }
});
