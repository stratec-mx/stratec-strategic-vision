// google-insights: datos de Search Console y Google Analytics 4 para el panel.
// Solo administradores. Lectura únicamente (scopes *.readonly).
//
// Secrets de Supabase (Edge Functions → Secrets):
//   GOOGLE_SA_KEY    JSON completo de la llave de la cuenta de servicio
//   GSC_SITE_URL     propiedad de Search Console, p. ej. "sc-domain:stratecsecurity.com"
//                    o "https://www.stratecsecurity.com/"
//   GA4_PROPERTY_ID  ID numérico de la propiedad de GA4 (no el G-XXXXXXX)
// Si falta alguno, la parte correspondiente responde { ok: false, motivo: "sin_configurar" }.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  EVENTOS_CLAVE, b64url, fechaGa, filas, leerCuenta, metrica, oportunidades, pemADer, periodoValido, rangos,
  tabla, totalesGa, type CuentaServicio, type Rango, type ReporteGa,
} from "./logica.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SCOPES = "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly";

// ─── Token de Google (cuenta de servicio, JWT firmado con RS256) ────────────
let tokenCache: { valor: string; vence: number } | null = null;

async function tokenGoogle(sa: CuentaServicio): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.vence > ahora + 60) return tokenCache.valor;
  const sinFirma = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: sa.client_email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", iat: ahora, exp: ahora + 3600,
  }))}`;
  const llave = await crypto.subtle.importKey("pkcs8", pemADer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const firma = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", llave, new TextEncoder().encode(sinFirma)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${sinFirma}.${b64url(firma)}` }),
  });
  if (!r.ok) throw new FalloGoogle("token", r.status);
  const j = await r.json();
  tokenCache = { valor: j.access_token, vence: ahora + Number(j.expires_in ?? 3600) };
  return tokenCache.valor;
}

class FalloGoogle extends Error {
  constructor(public donde: string, public status: number) { super(`${donde} ${status}`); }
}

async function postGoogle(url: string, token: string, body: unknown, donde: string) {
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) {
    console.error(`[google-insights] ${donde}:`, r.status, (await r.text()).slice(0, 300));
    throw new FalloGoogle(donde, r.status);
  }
  return r.json();
}

const falla = (e: unknown) => {
  const s = e instanceof FalloGoogle ? e.status : 0;
  return { ok: false, motivo: s === 401 || s === 403 ? "sin_acceso" : s === 404 ? "no_encontrada" : "error" };
};

// ─── Search Console ─────────────────────────────────────────────────────────
async function searchConsole(token: string, sitio: string, dias: number) {
  const { actual, anterior } = rangos(new Date(), dias, 3);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(sitio)}/searchAnalytics/query`;
  const q = (r: Rango, dimensions: string[], rowLimit = 10) =>
    postGoogle(url, token, { startDate: r.inicio, endDate: r.fin, dimensions, rowLimit }, "search-console");
  const [tot, totAnt, diario, consultas, paginas, dispositivos] = await Promise.all([
    q(actual, []), q(anterior, []), q(actual, ["date"], 100), q(actual, ["query"], 250), q(actual, ["page"], 10), q(actual, ["device"], 5),
  ]);
  return {
    ok: true,
    rango: actual,
    totales: { actual: metrica(tot.rows?.[0]), anterior: metrica(totAnt.rows?.[0]) },
    diario: filas(diario.rows, 100).map((f) => ({ fecha: f.clave, clics: f.clics, impresiones: f.impresiones })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    consultas: filas(consultas.rows, 15),
    oportunidades: oportunidades(consultas.rows),
    paginas: filas(paginas.rows, 10),
    dispositivos: filas(dispositivos.rows, 5),
  };
}

// ─── Google Analytics 4 ─────────────────────────────────────────────────────
async function analytics(token: string, propiedad: string, dias: number) {
  const { actual, anterior } = rangos(new Date(), dias, 1);
  const cur = [{ startDate: actual.inicio, endDate: actual.fin }];
  const reporte = (dimension: string, metricas: string[], limit = 10, extra: Record<string, unknown> = {}) => ({
    dateRanges: cur,
    dimensions: [{ name: dimension }],
    metrics: metricas.map((name) => ({ name })),
    orderBys: [{ metric: { metricName: metricas[0] }, desc: true }],
    limit,
    ...extra,
  });
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propiedad)}:batchRunReports`;
  const [a, b] = await Promise.all([
    postGoogle(url, token, {
      requests: [
        {
          dateRanges: [{ ...cur[0], name: "actual" }, { startDate: anterior.inicio, endDate: anterior.fin, name: "anterior" }],
          metrics: ["activeUsers", "newUsers", "sessions", "engagementRate", "averageSessionDuration"].map((name) => ({ name })),
        },
        reporte("sessionDefaultChannelGroup", ["sessions", "activeUsers"]),
        reporte("city", ["activeUsers"]),
        reporte("landingPage", ["sessions", "engagementRate"]),
        reporte("eventName", ["eventCount"], 20, {
          dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: EVENTOS_CLAVE } } },
        }),
      ],
    }, "analytics"),
    postGoogle(url, token, {
      requests: [
        reporte("deviceCategory", ["activeUsers"], 5),
        { dateRanges: cur, dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 100 },
        reporte("sessionSource", ["sessions"], 10),
      ],
    }, "analytics"),
  ]);
  const ra: ReporteGa[] = a.reports ?? [];
  const rb: ReporteGa[] = b.reports ?? [];
  return {
    ok: true,
    rango: actual,
    totales: totalesGa(ra[0]),
    canales: tabla(ra[1]).map((f) => ({ nombre: f.nombre, sesiones: f.valores[0], usuarios: f.valores[1] })),
    ciudades: tabla(ra[2]).map((f) => ({ nombre: f.nombre, usuarios: f.valores[0] })),
    entradas: tabla(ra[3]).map((f) => ({ pagina: f.nombre, sesiones: f.valores[0], interaccion: Math.round(f.valores[1] * 1000) / 10 })),
    acciones: tabla(ra[4]).map((f) => ({ evento: f.nombre, total: f.valores[0] })),
    dispositivos: tabla(rb[0]).map((f) => ({ nombre: f.nombre, usuarios: f.valores[0] })),
    diario: tabla(rb[1]).map((f) => ({ fecha: fechaGa(f.nombre), usuarios: f.valores[0], sesiones: f.valores[1] })),
    fuentes: tabla(rb[2]).map((f) => ({ nombre: f.nombre, sesiones: f.valores[0] })),
  };
}

// Respuestas recientes por periodo (la instancia puede reciclarse; es solo un ahorro)
const cache = new Map<number, { hasta: number; datos: unknown }>();
const VIGENCIA_MS = 30 * 60_000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Solo POST" });

  // Solo administradores
  const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: quien } = jwt ? await db.auth.getUser(jwt) : { data: null };
  if (!quien?.user) return json(401, { error: "Sesión requerida" });
  const { data: admin } = await db.from("user_roles").select("role").eq("user_id", quien.user.id).eq("role", "admin").maybeSingle();
  if (!admin) return json(403, { error: "Solo administradores" });

  const body = await req.json().catch(() => ({}));
  const dias = periodoValido(body?.dias);
  const refrescar = body?.refrescar === true;
  const enCache = cache.get(dias);
  if (!refrescar && enCache && enCache.hasta > Date.now()) return json(200, enCache.datos);

  const cuenta = leerCuenta(Deno.env.get("GOOGLE_SA_KEY"));
  const sitio = (Deno.env.get("GSC_SITE_URL") ?? "").trim();
  const propiedad = (Deno.env.get("GA4_PROPERTY_ID") ?? "").trim().replace(/^properties\//, "");
  const sinConfig = { ok: false, motivo: "sin_configurar" };

  let token: string | null = null;
  let errorToken: unknown = null;
  if (cuenta && (sitio || /^\d+$/.test(propiedad))) {
    try { token = await tokenGoogle(cuenta); } catch (e) { errorToken = e; console.error("[google-insights] token:", (e as Error).message); }
  }

  const [gsc, ga4] = await Promise.all([
    !cuenta || !sitio ? sinConfig : !token ? falla(errorToken) : searchConsole(token, sitio, dias).catch(falla),
    !cuenta || !/^\d+$/.test(propiedad) ? sinConfig : !token ? falla(errorToken) : analytics(token, propiedad, dias).catch(falla),
  ]);
  const datos = { dias, generado: new Date().toISOString(), cuenta: cuenta?.client_email ?? null, gsc, ga4 };
  if ((gsc as { ok: boolean }).ok || (ga4 as { ok: boolean }).ok) cache.set(dias, { hasta: Date.now() + VIGENCIA_MS, datos });
  return json(200, datos);
});
