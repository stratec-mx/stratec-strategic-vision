// Tipos, etiquetas y lecturas en lenguaje simple de los datos de Google
// (Search Console + Analytics) que entrega la función google-insights.

export type Metrica = { clics: number; impresiones: number; ctr: number; posicion: number };
export type Consulta = Metrica & { clave: string };
export type TotalesGa = { usuarios: number; nuevos: number; sesiones: number; interaccion: number; duracion: number };
type Rango = { inicio: string; fin: string };
export type Falla = { ok: false; motivo: "sin_configurar" | "sin_acceso" | "no_encontrada" | "error" };
/** Motivo de falla de una fuente, o null si respondió bien. */
export const motivoDe = (x: { ok: boolean }) => (x.ok ? null : (x as Falla).motivo);

export type DatosGsc =
  | Falla
  | {
      ok: true;
      rango: Rango;
      totales: { actual: Metrica; anterior: Metrica };
      diario: { fecha: string; clics: number; impresiones: number }[];
      consultas: Consulta[];
      oportunidades: Consulta[];
      paginas: Consulta[];
      dispositivos: Consulta[];
    };

export type DatosGa =
  | Falla
  | {
      ok: true;
      rango: Rango;
      totales: { actual: TotalesGa; anterior: TotalesGa };
      canales: { nombre: string; sesiones: number; usuarios: number }[];
      ciudades: { nombre: string; usuarios: number }[];
      entradas: { pagina: string; sesiones: number; interaccion: number }[];
      acciones: { evento: string; total: number }[];
      dispositivos: { nombre: string; usuarios: number }[];
      diario: { fecha: string; usuarios: number; sesiones: number }[];
      fuentes: { nombre: string; sesiones: number }[];
    };

export type DatosGoogle = { dias: number; generado: string; cuenta: string | null; gsc: DatosGsc; ga4: DatosGa };

export const CANAL: Record<string, string> = {
  "Organic Search": "Búsqueda en Google (orgánica)",
  Direct: "Directo (escribieron la dirección o enlace guardado)",
  Referral: "Otros sitios que te enlazan",
  "Organic Social": "Redes sociales",
  "Paid Search": "Anuncios en buscadores",
  "Paid Social": "Anuncios en redes",
  Email: "Correo",
  "Organic Maps": "Google Maps",
  "Organic Video": "Video",
  Display: "Anuncios gráficos",
  "Cross-network": "Campañas de varias redes",
  Unassigned: "Sin identificar",
};

export const EVENTO: Record<string, string> = {
  generate_lead: "Dejaron sus datos (lead)",
  form_submit: "Enviaron un formulario",
  click_whatsapp: "Clic en WhatsApp",
  click_email: "Clic en correo",
  chat_open: "Abrieron el chat",
  chat_lead: "Leads desde el chat",
  diagnostico_resultado: "Terminaron el diagnóstico",
  diagnostico_pdf: "Descargaron el PDF del diagnóstico",
  cta_click: "Clic en botones de acción",
};

export const DISPOSITIVO: Record<string, string> = {
  mobile: "Teléfono", MOBILE: "Teléfono",
  desktop: "Computadora", DESKTOP: "Computadora",
  tablet: "Tableta", TABLET: "Tableta",
};

export const MOTIVO: Record<Falla["motivo"], string> = {
  sin_configurar: "Falta conectar esta fuente.",
  sin_acceso: "La cuenta de servicio no tiene acceso: agrégala como usuario en esta herramienta.",
  no_encontrada: "No se encontró la propiedad: revisa el dato configurado en Supabase.",
  error: "Google no respondió. Intenta actualizar en unos minutos.",
};

/** "/servicios/x?utm=..." → "/servicios/x"; "/" → "Inicio". URL completa → ruta. */
export function rutaCorta(v: string): string {
  let p = v;
  try { if (/^https?:\/\//.test(v)) p = new URL(v).pathname; } catch { /* se deja igual */ }
  p = p.split("?")[0] || "/";
  return p === "/" ? "Inicio" : p;
}

/** Variación porcentual redondeada; null si no hay base para comparar. */
export function variacion(actual: number, anterior: number): number | null {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export const segundos = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s` : `${Math.round(s)} s`);

const pct = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0);

/** Lecturas en lenguaje simple para entender al público. */
export function lecturas(d: DatosGoogle): string[] {
  const out: string[] = [];
  if (d.gsc.ok) {
    const { actual, anterior } = d.gsc.totales;
    const v = variacion(actual.clics, anterior.clics);
    if (actual.impresiones) {
      out.push(
        `Apareciste ${actual.impresiones.toLocaleString("es-MX")} veces en Google y te dieron ${actual.clics.toLocaleString("es-MX")} clics` +
          (v != null ? ` (${v >= 0 ? "+" : ""}${v}% vs. el periodo anterior).` : "."),
      );
    }
    const top = d.gsc.consultas[0];
    if (top) out.push(`La búsqueda que más visitas te trae es «${top.clave}».`);
    const op = d.gsc.oportunidades[0];
    if (op) out.push(`«${op.clave}» te muestra ${op.impresiones} veces pero casi no recibe clics: mejorar el título de esa página puede traer más visitas.`);
  }
  if (d.ga4.ok) {
    const disp = d.ga4.dispositivos;
    const totalDisp = disp.reduce((s, x) => s + x.usuarios, 0);
    const movil = disp.find((x) => x.nombre === "mobile");
    if (movil && totalDisp) out.push(`El ${pct(movil.usuarios, totalDisp)}% de tus visitantes entra desde el teléfono.`);
    const canal = d.ga4.canales[0];
    const totalSes = d.ga4.canales.reduce((s, x) => s + x.sesiones, 0);
    if (canal && totalSes) out.push(`La mayoría llega por: ${CANAL[canal.nombre] ?? canal.nombre} (${pct(canal.sesiones, totalSes)}% de las visitas).`);
    const ciudad = d.ga4.ciudades.find((c) => c.nombre && c.nombre !== "(not set)");
    if (ciudad) out.push(`La ciudad con más visitantes es ${ciudad.nombre}.`);
    const leads = d.ga4.acciones.filter((a) => ["generate_lead", "chat_lead"].includes(a.evento)).reduce((s, a) => s + a.total, 0);
    const wa = d.ga4.acciones.find((a) => a.evento === "click_whatsapp")?.total ?? 0;
    if (leads || wa) out.push(`En el periodo: ${leads} dejaron sus datos y ${wa} dieron clic en WhatsApp.`);
  }
  return out;
}
