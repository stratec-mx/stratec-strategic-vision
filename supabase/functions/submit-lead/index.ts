import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const SITE = "https://www.stratecsecurity.com";

// ── Aviso de Telegram ──────────────────────────────────────────────────────
// Función pura: arma el texto (HTML de Telegram) y los botones del aviso.
// Los botones son enlaces: no necesitan servidor que reciba respuestas.

/** Datos del diagnóstico que manda /diagnostico (campo opcional "diagnostico"). */
export interface LeadDiagnostico {
  puntaje?: string;
  nivel?: string;
  quiereContacto?: boolean;
  giro?: string;
  personas?: string;
  superficie?: string;
  estado?: string;
  areas?: string[];
  servicios?: string[];
  marcadores?: number;
}

export interface LeadAviso {
  name: string;
  email: string;
  organization: string;
  role?: string | null;
  telefono?: string | null;
  servicio?: string | null;
  message?: string | null;
  diagnostico?: LeadDiagnostico | null;
}

type Boton = { text: string; url: string };

const esc = (v: unknown, max = 500) =>
  String(v ?? "").substring(0, max).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Teléfono en formato internacional para wa.me (México por defecto). */
export function waNumber(tel: unknown): string | null {
  let d = String(tel ?? "").replace(/\D/g, "");
  if (d.length === 10) d = "52" + d;
  else if (d.length === 13 && d.startsWith("521")) d = "52" + d.slice(3);
  return d.length >= 11 && d.length <= 15 ? d : null;
}

/** +52 777 123 4567 para números de México; el resto, tal cual. */
function telLegible(tel: unknown): string {
  const d = waNumber(tel);
  if (d && d.length === 12 && d.startsWith("52")) return `+52 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return String(tel ?? "").trim();
}

/** Nombre real o vacío si el formulario mandó el texto de relleno. */
function nombreReal(name: string): string {
  const n = String(name ?? "").trim();
  return !n || n.startsWith("Sin nombre") ? "" : n;
}

/** Quita líneas internas (perfil para el cotizador) del texto que se muestra. */
function limpiarMensaje(m: unknown): string {
  return String(m ?? "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("[perfil]"))
    .join("\n")
    .trim();
}

const lineas = (pares: [string, unknown][]) =>
  pares.filter(([, v]) => v != null && String(v).trim() !== "" && v !== "No indicada").map(([k, v]) => `${k}: ${esc(v)}`).join("\n");

export function buildLeadAviso(lead: LeadAviso, leadId: string | null, hora: string): { text: string; buttons: Boton[][] } {
  const d = lead.diagnostico ?? null;
  const nombre = nombreReal(lead.name);
  const saludo = nombre ? `Hola ${nombre.split(" ")[0]}` : "Hola";
  const wa = waNumber(lead.telefono);
  const bloques: string[] = [];

  // Encabezado
  if (d) {
    bloques.push(
      `🔔 <b>Nuevo diagnóstico web</b>\n` +
        (d.quiereContacto ? `⭐ <b>Pidió que lo contacte un asesor</b>` : `ℹ️ Solo descargó su diagnóstico; no pidió contacto`),
    );
  } else {
    bloques.push(`🔔 <b>Nuevo contacto desde el sitio</b>`);
  }

  // Contacto
  bloques.push(
    `👤 <b>Contacto</b>\n` +
      lineas([
        ["Nombre", nombre || "No lo indicó"],
        ["Empresa", lead.organization],
        [d ? "Giro" : "Cargo", d ? d.giro : lead.role],
        ["Teléfono", lead.telefono ? telLegible(lead.telefono) : ""],
        ["Correo", lead.email],
      ]),
  );

  if (d) {
    bloques.push(
      `📊 <b>Resultado: ${esc(d.puntaje)}/10 · ${esc(d.nivel)}</b>\n` +
        lineas([
          ["Personas", d.personas],
          ["Superficie", d.superficie],
          ["Estado", d.estado],
          ["Marcó su predio en el mapa", d.marcadores ? `${d.marcadores} punto${d.marcadores === 1 ? "" : "s"}` : ""],
        ]),
    );
    const areas = (d.areas ?? []).slice(0, 10);
    bloques.push(
      areas.length
        ? `⚠️ <b>Puntos por atender (${areas.length})</b>\n` + areas.map((a) => `• ${esc(a, 120)}`).join("\n")
        : `✅ <b>Sin puntos por atender</b>`,
    );
    const servicios = (d.servicios ?? []).slice(0, 8);
    if (servicios.length) bloques.push(`🧭 <b>Servicios sugeridos</b>\n` + servicios.map((s) => `• ${esc(s, 120)}`).join("\n"));
  } else {
    if (lead.servicio) bloques.push(`📋 <b>Servicio de interés</b>\n${esc(lead.servicio, 150)}`);
    const msg = limpiarMensaje(lead.message);
    if (msg) bloques.push(`💬 <b>Mensaje</b>\n${esc(msg, 1200)}`);
  }

  // Siguiente paso sugerido
  const paso = d
    ? d.quiereContacto
      ? "Escríbele hoy: pidió que lo contacten."
      : "No pidió contacto. Si le escribes, que sea un mensaje breve de seguimiento."
    : "Respóndele hoy por el medio que dejó.";
  bloques.push(`🕐 ${esc(hora)}\n\n👉 <b>Siguiente paso:</b> ${paso}`);

  // Botones
  const waTexto = d
    ? `${saludo}, te escribe STRATEC Security. Vimos tu diagnóstico de seguridad (${d.puntaje ?? ""}/10). ¿Te parece si platicamos unos minutos para revisar los puntos a atender?`
    : `${saludo}, te escribe STRATEC Security. Recibimos tu mensaje en stratecsecurity.com${lead.servicio ? ` sobre ${lead.servicio}` : ""}. ¿Cuándo te viene bien que platiquemos?`;
  const asunto = d ? "Tu diagnóstico de seguridad · STRATEC" : "Tu mensaje a STRATEC Security";
  const fila1: Boton[] = [];
  if (wa) fila1.push({ text: "💬 WhatsApp al cliente", url: `https://wa.me/${wa}?text=${encodeURIComponent(waTexto)}` });
  if (lead.email) {
    fila1.push({
      text: "✉️ Responder por correo",
      url: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(asunto)}`,
    });
  }
  const fila2: Boton[] = [];
  if (d && leadId) fila2.push({ text: "🧾 Cotizar con su perfil", url: `${SITE}/app/quotes?lead=${leadId}` });
  fila2.push({ text: "📂 Ver en el panel", url: `${SITE}/app/leads` });
  // Reenviar a quien atiende ventas: abre la lista de chats de Telegram con un resumen
  const resumen = [
    d ? `Lead de diagnóstico web (${d.puntaje ?? "?"}/10, ${d.nivel ?? ""})` : "Lead del sitio web",
    nombre || null,
    lead.organization && lead.organization !== "No indicada" ? lead.organization : null,
    lead.telefono ? telLegible(lead.telefono) : null,
    d?.quiereContacto ? "Pidió que lo contacten." : null,
  ].filter(Boolean).join(" · ");
  const fila3: Boton[] = [
    { text: "👥 Pasar a un asesor de ventas", url: `https://t.me/share/url?url=${encodeURIComponent(`${SITE}/app/leads`)}&text=${encodeURIComponent(resumen)}` },
  ];

  return { text: bloques.join("\n\n").substring(0, 4000), buttons: [fila1, fila2, fila3].filter((f) => f.length) };
}

// ── Función ────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // — 1. Parse & validate input ————————————————————————
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { name, email, organization, role, message, honeypot, telefono, servicio, diagnostico } = body;

    // Honeypot check (secondary server-side defence)
    if (honeypot) {
      // Bot – silently return 200 so it thinks it succeeded
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!name || !email || !organization || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 422,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // — Email format validation ————————————————————————
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return new Response(JSON.stringify({ error: "Formato de email invalido" }), {
        status: 422,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // — 2. Supabase client with service-role key (bypasses RLS) ————————————
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // — 3. Server-side IP rate limiting ————————————————————————
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { count, error: countErr } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip", clientIp)
      .eq("action", "submit_lead")
      .gte("created_at", windowStart);

    if (countErr) {
      console.error("[submit-lead] rate limits count error:", countErr.message);
      // Fail open – do not block the user for a DB error
    } else if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({
          error: "Ha alcanzado el limite de solicitudes. Por favor espere 15 minutos antes de intentarlo de nuevo.",
        }),
        {
          status: 429,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Record this attempt (la columna se llama "action"; ver migración rate_limits)
    const { error: rlInsertErr } = await supabase.from("rate_limits").insert({
      ip: clientIp,
      action: "submit_lead",
    });
    if (rlInsertErr) console.error("[submit-lead] rate limits insert error:", rlInsertErr.message);

    // — 4. Insert the lead ————————————————————————
    const { data: inserted, error: insertErr } = await supabase
      .from("leads")
      .insert({
        full_name: String(name).substring(0, 100),
        email: String(email).substring(0, 255),
        organization: String(organization).substring(0, 150),
        role_title: role ? String(role).substring(0, 120) : null,
        phone: telefono ? String(telefono).substring(0, 40) : null,
        notes: (servicio ? `Servicio: ${String(servicio).substring(0, 150)}\n\n` : "") + String(message).substring(0, 1000),
        source: "web",
        status: "new",
        owner_id: null,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[submit-lead] insert error:", insertErr.message);
      return new Response(
        JSON.stringify({ error: "No se pudo procesar la solicitud. Intente de nuevo." }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // — 5. Notificación Telegram ————————————————————————
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (botToken && chatId) {
      const hora = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium", timeStyle: "short" });
      const aviso = buildLeadAviso(
        {
          name: String(name),
          email: String(email),
          organization: String(organization),
          role: role ?? null,
          telefono: telefono ?? null,
          servicio: servicio ?? null,
          message: message ?? null,
          diagnostico: diagnostico && typeof diagnostico === "object" ? (diagnostico as LeadDiagnostico) : null,
        },
        (inserted as { id?: string } | null)?.id ?? null,
        hora,
      );
      // Se espera la respuesta (máx. 5 s): el runtime puede cortar promesas
      // pendientes en cuanto la función responde.
      try {
        const tg = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: aviso.text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: { inline_keyboard: aviso.buttons },
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (!tg.ok) console.warn("[submit-lead] Telegram respondió", tg.status, (await tg.text()).substring(0, 200));
      } catch (e) {
        console.warn("[submit-lead] Telegram notify failed:", (e as Error).message);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[submit-lead] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
