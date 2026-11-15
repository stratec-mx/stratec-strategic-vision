// Lógica pura de google-insights (sin Deno ni red) para poder probarla aparte.

export type Rango = { inicio: string; fin: string };

/** Fecha AAAA-MM-DD en la zona de Cuernavaca, desplazada `dias` hacia atrás. */
export function fechaMx(base: Date, diasAtras: number): string {
  const d = new Date(base.getTime() - diasAtras * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

/**
 * Periodo actual y el anterior del mismo largo.
 * `retraso`: días que tarda la fuente en tener datos completos
 * (Search Console ~3, Analytics 1).
 */
export function rangos(hoy: Date, dias: number, retraso: number): { actual: Rango; anterior: Rango } {
  return {
    actual: { inicio: fechaMx(hoy, retraso + dias - 1), fin: fechaMx(hoy, retraso) },
    anterior: { inicio: fechaMx(hoy, retraso + 2 * dias - 1), fin: fechaMx(hoy, retraso + dias) },
  };
}

export const PERIODOS = [7, 28, 90] as const;
export const periodoValido = (v: unknown): number => (PERIODOS as readonly number[]).includes(Number(v)) ? Number(v) : 28;

// ─── Search Console ─────────────────────────────────────────────────────────

type FilaGsc = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
export type Metrica = { clics: number; impresiones: number; ctr: number; posicion: number };
export type Consulta = Metrica & { clave: string };

const r2 = (n: number) => Math.round(n * 100) / 100;

export function metrica(f: FilaGsc | undefined): Metrica {
  return {
    clics: f?.clicks ?? 0,
    impresiones: f?.impressions ?? 0,
    ctr: r2((f?.ctr ?? 0) * 100),
    posicion: r2(f?.position ?? 0),
  };
}

export function filas(rows: FilaGsc[] | undefined, limite: number): Consulta[] {
  return (rows ?? []).slice(0, limite).map((r) => ({ clave: r.keys?.[0] ?? "", ...metrica(r) }));
}

/**
 * Búsquedas donde el sitio aparece seguido pero casi no le dan clic:
 * buenas candidatas para mejorar el título y la descripción de la página.
 */
export function oportunidades(rows: FilaGsc[] | undefined, limite = 8): Consulta[] {
  return filas(rows, 1000)
    .filter((c) => c.impresiones >= 10 && c.ctr < 3 && c.posicion >= 3 && c.posicion <= 25)
    .sort((a, b) => b.impresiones - a.impresiones)
    .slice(0, limite);
}

// ─── Google Analytics 4 ─────────────────────────────────────────────────────

type ValorGa = { value?: string };
type FilaGa = { dimensionValues?: ValorGa[]; metricValues?: ValorGa[] };
export type ReporteGa = { rows?: FilaGa[] };

const num = (v: ValorGa | undefined) => Number(v?.value ?? 0) || 0;

/** Filas de un reporte con una dimensión: [{ nombre, valores[] }]. */
export function tabla(rep: ReporteGa | undefined): { nombre: string; valores: number[] }[] {
  return (rep?.rows ?? []).map((r) => ({ nombre: r.dimensionValues?.[0]?.value ?? "", valores: (r.metricValues ?? []).map(num) }));
}

export type TotalesGa = { usuarios: number; nuevos: number; sesiones: number; interaccion: number; duracion: number };

/** Totales de un reporte con dos periodos llamados "actual" y "anterior". */
export function totalesGa(rep: ReporteGa | undefined): { actual: TotalesGa; anterior: TotalesGa } {
  const vacio: TotalesGa = { usuarios: 0, nuevos: 0, sesiones: 0, interaccion: 0, duracion: 0 };
  const out = { actual: { ...vacio }, anterior: { ...vacio } };
  for (const r of rep?.rows ?? []) {
    const cual = r.dimensionValues?.[0]?.value === "anterior" ? "anterior" : "actual";
    const m = r.metricValues ?? [];
    out[cual] = {
      usuarios: num(m[0]),
      nuevos: num(m[1]),
      sesiones: num(m[2]),
      interaccion: r2(num(m[3]) * 100),
      duracion: Math.round(num(m[4])),
    };
  }
  return out;
}

/** Fecha de GA4 (AAAAMMDD) a AAAA-MM-DD. */
export const fechaGa = (v: string) => (/^\d{8}$/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}` : v);

/** Eventos del sitio que valen como acciones de un visitante interesado. */
export const EVENTOS_CLAVE = [
  "generate_lead", "form_submit", "click_whatsapp", "click_email", "chat_open", "chat_lead",
  "diagnostico_resultado", "diagnostico_pdf", "cta_click",
];

// ─── Llave de la cuenta de servicio ─────────────────────────────────────────

export type CuentaServicio = { client_email: string; private_key: string };

/** Lee el JSON de la cuenta de servicio; null si no sirve. */
export function leerCuenta(raw: string | undefined): CuentaServicio | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (typeof j?.client_email === "string" && typeof j?.private_key === "string" && j.private_key.includes("PRIVATE KEY")) {
      return { client_email: j.client_email, private_key: j.private_key };
    }
  } catch { /* JSON inválido */ }
  return null;
}

/** PEM (PKCS#8) a bytes DER para crypto.subtle.importKey. */
export function pemADer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\\n/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64url(data: string | Uint8Array): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
