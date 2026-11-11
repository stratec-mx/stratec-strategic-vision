// Agrupación del histórico de leads y cotizaciones por día, mes o año.
export type Escala = "dia" | "mes" | "anio";
export interface FilaFecha { created_at: string }
export interface FilaCotizacion extends FilaFecha { total: number | string; currency: string; status: string }

export interface Periodo {
  clave: string;
  etiqueta: string;
  leads: number;
  cotizaciones: number;
  /** Monto cotizado en MXN (con IVA) */
  monto: number;
  aceptadas: number;
  montoAceptado: number;
}

const ZONA = "America/Mexico_City";
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_VISIBLES = 31;

/** AAAA-MM-DD en hora de Cuernavaca */
const fechaMx = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: ZONA });
const claveDe = (iso: string, e: Escala) => {
  const f = fechaMx(new Date(iso));
  return e === "anio" ? f.slice(0, 4) : e === "mes" ? f.slice(0, 7) : f;
};
const etiquetaDe = (clave: string, e: Escala) => {
  if (e === "anio") return clave;
  const [y, m, d] = clave.split("-");
  return e === "mes" ? `${MESES[Number(m) - 1]} ${y}` : `${Number(d)} ${MESES[Number(m) - 1]}`;
};

/** Todas las claves del periodo, sin huecos: los periodos sin actividad aparecen en cero. */
function clavesContinuas(e: Escala, primera: string | null, hoy: Date): string[] {
  const fin = fechaMx(hoy);
  if (e === "dia") {
    const out: string[] = [];
    for (let i = DIAS_VISIBLES - 1; i >= 0; i--) out.push(fechaMx(new Date(hoy.getTime() - i * 86_400_000)));
    return out;
  }
  const inicio = primera ?? fin;
  if (e === "anio") {
    const out: string[] = [];
    for (let y = Number(inicio.slice(0, 4)); y <= Number(fin.slice(0, 4)); y++) out.push(String(y));
    return out;
  }
  const out: string[] = [];
  let y = Number(inicio.slice(0, 4));
  let m = Number(inicio.slice(5, 7));
  const yf = Number(fin.slice(0, 4));
  const mf = Number(fin.slice(5, 7));
  while (y < yf || (y === yf && m <= mf)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

/** Agrupa leads y cotizaciones por periodo, en orden cronológico. Solo suma montos en MXN. */
export function agruparHistorico(leads: FilaFecha[], cotizaciones: FilaCotizacion[], e: Escala, hoy = new Date()): Periodo[] {
  const fechas = [...leads, ...cotizaciones].map((r) => fechaMx(new Date(r.created_at))).sort();
  const claves = clavesContinuas(e, fechas[0] ?? null, hoy);
  const mapa = new Map<string, Periodo>(
    claves.map((c) => [c, { clave: c, etiqueta: etiquetaDe(c, e), leads: 0, cotizaciones: 0, monto: 0, aceptadas: 0, montoAceptado: 0 }]),
  );
  for (const l of leads) {
    const p = mapa.get(claveDe(l.created_at, e));
    if (p) p.leads++;
  }
  for (const q of cotizaciones) {
    const p = mapa.get(claveDe(q.created_at, e));
    if (!p) continue;
    p.cotizaciones++;
    const mxn = q.currency === "MXN" ? Number(q.total) || 0 : 0;
    p.monto += mxn;
    if (q.status === "accepted") {
      p.aceptadas++;
      p.montoAceptado += mxn;
    }
  }
  return claves.map((c) => mapa.get(c)!);
}

