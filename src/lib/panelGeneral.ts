// Cálculos del Panel general. Todo sale de filas reales de la base de datos;
// aquí no hay cifras fijas. Las fechas se agrupan con el día de Ciudad de México.
import { findService } from "@/lib/quoteCatalog";
import { parseLeadProfile } from "@/lib/pricing";

export const ZONA = "America/Mexico_City";
const DIA_MS = 86_400_000;
/** Una cotización enviada sin cambios en más de estos días se marca "sin respuesta". */
export const DIAS_SIN_RESPUESTA = 5;

/** Día calendario en Ciudad de México, "AAAA-MM-DD". */
export const diaMx = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: ZONA });
export const horaMx = (d: Date | string) =>
  new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA });
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** "02 nov" (igual en todos los navegadores). */
export const fechaCortaMx = (d: Date | string) => {
  const [, m, dd] = diaMx(d).split("-");
  return `${dd} ${MESES[Number(m) - 1]}`;
};
const manana = (now: Date) => diaMx(new Date(now.getTime() + DIA_MS));
const ayer = (now: Date) => diaMx(new Date(now.getTime() - DIA_MS));

// ── Prospectos ──────────────────────────────────────────────

export type LeadFila = {
  id: string;
  full_name: string;
  organization?: string | null;
  source: string;
  status: string;
  notes?: string | null;
  created_at: string;
};

/** Prospectos de los últimos 30 días y cuántos siguen sin primer contacto (estado "new"). */
export function resumenProspectos(leads: Pick<LeadFila, "status" | "created_at">[], now = new Date()) {
  const desde = now.getTime() - 30 * DIA_MS;
  const recientes = leads.filter((l) => new Date(l.created_at).getTime() >= desde);
  return { nuevos: recientes.length, sinContacto: recientes.filter((l) => l.status === "new").length };
}

const ORIGEN: Record<string, string> = {
  web: "Sitio web", referral: "Referido", event: "Evento", outbound: "Prospección",
  partner: "Aliado", other: "Otro", whatsapp: "WhatsApp",
};

/** De dónde llegó el prospecto. Las notas que dejan el bot, el chat y el diagnóstico lo precisan. */
export function origenLead(l: Pick<LeadFila, "source" | "notes">): string {
  const n = l.notes ?? "";
  if (l.source === "whatsapp" || n.includes("[whatsapp]")) return "WhatsApp";
  if (n.startsWith("Chat del sitio")) return "Chat del sitio";
  if (n.includes("[perfil]") || n.includes("Diagnóstico básico")) return "Diagnóstico en línea";
  return ORIGEN[l.source] ?? l.source;
}

/** Qué servicio le interesa, según lo que dejó escrito el formulario, el chat, el bot o el diagnóstico. */
export function interesLead(l: Pick<LeadFila, "notes">): string {
  const n = l.notes ?? "";
  const linea = (etiqueta: string) =>
    n.split("\n").find((x) => x.trim().startsWith(`${etiqueta}:`))?.trim().slice(etiqueta.length + 1).trim();
  const servicio = linea("Servicio");
  if (servicio) return servicio;
  const codigos = parseLeadProfile(n)?.codes ?? [];
  const titulo = codigos.map((c) => findService(c)?.title).find(Boolean);
  if (titulo) return codigos.length > 1 ? `${titulo} y ${codigos.length - 1} más` : titulo;
  return linea("Necesidad") || "Sin especificar";
}

/** "Hace 20 min", "Hace 3 h", "Ayer" o la fecha corta. */
export function haceCuanto(fecha: string, now = new Date()): string {
  const d = new Date(fecha);
  const min = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  if (diaMx(d) === diaMx(now)) return `Hace ${Math.floor(min / 60)} h`;
  if (diaMx(d) === ayer(now)) return "Ayer";
  return fechaCortaMx(d);
}

// ── Cotizaciones ────────────────────────────────────────────

export type CotizacionFila = { id: string; number: string; status: string; created_at: string; updated_at: string };

export const ESTADOS_COTIZACION = ["draft", "sent", "accepted", "rejected", "expired"] as const;

/** Enviada y sin cambios en más de DIAS_SIN_RESPUESTA días. */
export const sinRespuesta = (q: Pick<CotizacionFila, "status" | "updated_at">, now = new Date()) =>
  q.status === "sent" && now.getTime() - new Date(q.updated_at).getTime() > DIAS_SIN_RESPUESTA * DIA_MS;

export function resumenCotizaciones(quotes: CotizacionFila[], now = new Date()) {
  const mes = diaMx(now).slice(0, 7);
  const delMes = quotes.filter((q) => diaMx(q.created_at).slice(0, 7) === mes);
  const porEstado = Object.fromEntries(ESTADOS_COTIZACION.map((s) => [s, 0])) as Record<(typeof ESTADOS_COTIZACION)[number], number>;
  for (const q of delMes) if (q.status in porEstado) porEstado[q.status as keyof typeof porEstado]++;
  const enviadas = quotes.filter((q) => q.status === "sent");
  return {
    porResponder: enviadas.length,
    sinRespuesta: enviadas.filter((q) => sinRespuesta(q, now)).length,
    mesTotal: delMes.length,
    porEstado,
  };
}

// ── Agenda ──────────────────────────────────────────────────

export type CitaFila = {
  id: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  attendee_name?: string | null;
  organization?: string | null;
  location?: string | null;
};

export type CitaAgenda = CitaFila & { dia: "hoy" | "manana"; hora: string };

/** Citas de hoy y mañana, en orden. */
export function agendaHoyManana(citas: CitaFila[], now = new Date()): CitaAgenda[] {
  const hoy = diaMx(now);
  const man = manana(now);
  return citas
    .map((c) => ({ c, d: diaMx(c.starts_at) }))
    .filter(({ d }) => d === hoy || d === man)
    .sort((a, b) => a.c.starts_at.localeCompare(b.c.starts_at))
    .map(({ c, d }) => ({ ...c, dia: d === hoy ? "hoy" : "manana", hora: horaMx(c.starts_at) }));
}

/** Indicador de citas: cuántas hay hoy y cuál es la próxima (de hoy en adelante). */
export function resumenCitas(citas: CitaFila[], now = new Date()) {
  const hoy = diaMx(now);
  const deHoy = citas.filter((c) => diaMx(c.starts_at) === hoy);
  const proxima = citas
    .filter((c) => new Date(c.starts_at).getTime() >= now.getTime())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  let nota = "Sin citas próximas";
  if (proxima) {
    const d = diaMx(proxima.starts_at);
    const cuando = d === hoy ? "hoy" : d === manana(now) ? "mañana" : fechaCortaMx(proxima.starts_at);
    nota = `Próxima: ${cuando} ${horaMx(proxima.starts_at)}`;
  }
  return { hoy: deHoy.length, nota };
}

// ── Avisos (campana) ────────────────────────────────────────

export type Aviso = { id: string; tipo: "lead" | "cotizacion" | "cita"; titulo: string; detalle: string; href: string; fecha: string };

/** Avisos calculados de los datos: prospecto sin contactar, cotización sin respuesta y cita de hoy. */
export function calcularAvisos(
  {
    leadsNuevos = [],
    cotizaciones = [],
    citas = [],
  }: {
    leadsNuevos?: Pick<LeadFila, "id" | "full_name" | "organization" | "created_at">[];
    cotizaciones?: Pick<CotizacionFila, "id" | "number" | "status" | "updated_at">[];
    citas?: Pick<CitaFila, "id" | "title" | "starts_at">[];
  },
  now = new Date(),
): Aviso[] {
  const hoy = diaMx(now);
  const avisos: Aviso[] = [
    ...citas
      .filter((c) => diaMx(c.starts_at) === hoy)
      .map((c) => ({
        id: `cita:${c.id}`, tipo: "cita" as const, titulo: `Cita hoy a las ${horaMx(c.starts_at)}`,
        detalle: c.title, href: "/app/agenda", fecha: c.starts_at,
      })),
    ...cotizaciones
      .filter((q) => sinRespuesta(q, now))
      .map((q) => ({
        id: `cot:${q.id}`, tipo: "cotizacion" as const, titulo: `Cotización ${q.number} sin respuesta`,
        detalle: `Enviada; sin cambios desde ${fechaCortaMx(q.updated_at)}`, href: "/app/quotes", fecha: q.updated_at,
      })),
    ...leadsNuevos.map((l) => ({
      id: `lead:${l.id}`, tipo: "lead" as const, titulo: "Prospecto sin contactar",
      detalle: l.organization && l.organization !== l.full_name ? `${l.full_name} · ${l.organization}` : l.full_name, href: "/app/leads", fecha: l.created_at,
    })),
  ];
  return avisos;
}

// ── Exportar ────────────────────────────────────────────────

const celda = (v: string | number) => {
  const s = String(v);
  // Evita que una hoja de cálculo interprete el texto como fórmula.
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
};

/** CSV del resumen (Sección, Concepto, Valor, Detalle). Con BOM para que Excel respete los acentos. */
export function resumenCsv(filas: { seccion: string; concepto: string; valor: string | number; detalle?: string }[]): string {
  const lineas = [["Sección", "Concepto", "Valor", "Detalle"], ...filas.map((f) => [f.seccion, f.concepto, f.valor, f.detalle ?? ""])];
  return "﻿" + lineas.map((l) => l.map(celda).join(",")).join("\r\n");
}
