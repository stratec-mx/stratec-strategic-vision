// Clasificación del cliente y precio sugerido para cotizaciones.
//
// Los criterios de abajo son una clasificación INTERNA de STRATEC para
// tarificar; no sustituyen la clasificación oficial de riesgo de la autoridad.
// Ajusta puntos y umbrales aquí. Los precios NO viven en el código (el código
// del sitio es público): se capturan en el dashboard, tabla service_rates.

export type Level = "bajo" | "medio" | "alto";
export const LEVELS: Level[] = ["bajo", "medio", "alto"];
export const RISK_LABEL: Record<Level, string> = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto" };
export const SIZE_LABEL: Record<Level, string> = { bajo: "Organización pequeña", medio: "Organización mediana", alto: "Organización grande" };

export const GIROS = [
  { id: "oficinas", label: "Oficinas y servicios", points: 0 },
  { id: "comercio", label: "Comercio y restaurantes", points: 1 },
  { id: "gobierno", label: "Gobierno e instituciones", points: 1 },
  { id: "educacion", label: "Escuelas y guarderías", points: 2 },
  { id: "salud", label: "Salud y asistencia social", points: 2 },
  { id: "industria", label: "Industria y almacenes", points: 3 },
  { id: "peligroso", label: "Gasolineras, gas o químicos", points: 6 },
] as const;
export type GiroId = (typeof GIROS)[number]["id"];

export const HAZMAT = [
  { id: "ninguno", label: "No maneja", points: 0 },
  { id: "menor", label: "Cantidades menores", points: 2 },
  { id: "significativo", label: "Almacena o procesa", points: 6 },
] as const;
export type HazmatId = (typeof HAZMAT)[number]["id"];

export interface ClientProfile {
  /** Estado donde está el inmueble */
  morelos: boolean;
  giro: GiroId;
  /** Superficie construida total, m² */
  area: number;
  /** Personas simultáneas: trabajadores + visitantes */
  people: number;
  /** Niveles del edificio más alto */
  floors: number;
  hazmat: HazmatId;
  /** Número de inmuebles a cubrir */
  sites: number;
}

export const DEFAULT_PROFILE: ClientProfile = { morelos: true, giro: "oficinas", area: 0, people: 0, floors: 1, hazmat: "ninguno", sites: 1 };

/** [límite superior, puntos]: el primer límite que no se rebasa da los puntos. */
const AREA_STEPS: [number, number][] = [[500, 0], [1500, 1], [5000, 2], [Infinity, 3]];
const PEOPLE_STEPS: [number, number][] = [[50, 0], [250, 1], [1000, 2], [Infinity, 3]];
const FLOOR_STEPS: [number, number][] = [[2, 0], [5, 1], [Infinity, 2]];
/** Puntos de riesgo: hasta 2 = bajo, de 3 a 5 = medio, 6 o más = alto. */
const RISK_CUTS = { medio: 3, alto: 6 };

const step = (v: number, steps: [number, number][]) => steps.find(([max]) => (v || 0) <= max)?.[1] ?? 0;

export interface Classification {
  risk: Level;
  riskPoints: number;
  size: Level;
  factors: string[];
}

export function classify(p: ClientProfile): Classification {
  const giro = GIROS.find((g) => g.id === p.giro) ?? GIROS[0];
  const hazmat = HAZMAT.find((h) => h.id === p.hazmat) ?? HAZMAT[0];
  const parts: [string, number][] = [
    [giro.label, giro.points],
    [`${(p.area || 0).toLocaleString("es-MX")} m²`, step(p.area, AREA_STEPS)],
    [`${p.people || 0} personas`, step(p.people, PEOPLE_STEPS)],
    [`${p.floors || 1} niveles`, step(p.floors, FLOOR_STEPS)],
    [`Materiales peligrosos: ${hazmat.label.toLowerCase()}`, hazmat.points],
  ];
  const riskPoints = parts.reduce((s, [, pts]) => s + pts, 0);
  const risk: Level = riskPoints >= RISK_CUTS.alto ? "alto" : riskPoints >= RISK_CUTS.medio ? "medio" : "bajo";

  const people = p.people || 0;
  const size: Level = people > 250 || p.sites > 3 ? "alto" : people > 50 || p.sites > 1 ? "medio" : "bajo";

  return { risk, riskPoints, size, factors: parts.filter(([, pts]) => pts > 0).map(([l, pts]) => `${l} (+${pts})`) };
}

// ─── Qué nivel aplica a cada servicio ─────────────────────────────────────
// Protección civil y dictamen se tarifican por riesgo; lo demás, por tamaño.
const RISK_BASED = new Set(["STR-02", "STR-02.1", "STR-02.3", "STR-02.5", "STR-01.3"]);
export const basisOf = (code: string): "riesgo" | "tamaño" => (RISK_BASED.has(code) ? "riesgo" : "tamaño");
export const levelFor = (code: string, c: Classification): Level => (basisOf(code) === "riesgo" ? c.risk : c.size);
export const levelLabel = (code: string, l: Level) => (basisOf(code) === "riesgo" ? RISK_LABEL[l] : SIZE_LABEL[l]);

// ─── Tarifas (tabla service_rates) ─────────────────────────────────────────
export interface ServiceRate {
  code: string;
  price_low: number | null;
  price_medium: number | null;
  price_high: number | null;
  /** % que se suma por cada inmueble adicional */
  extra_site_pct: number | null;
}

const priceOf = (r: ServiceRate, l: Level) => Number(l === "bajo" ? r.price_low : l === "medio" ? r.price_medium : r.price_high) || 0;

export interface Suggestion {
  price: number;
  level: Level;
  detail: string;
}

/** Precio sugerido para un servicio, o null si no hay tarifa capturada para ese nivel. */
export function suggestPrice(code: string, rates: Record<string, ServiceRate>, c: Classification, sites: number): Suggestion | null {
  const r = rates[code];
  if (!r) return null;
  const level = levelFor(code, c);
  const base = priceOf(r, level);
  if (!base) return null;
  const extra = Math.max(0, (sites || 1) - 1);
  const pct = Number(r.extra_site_pct ?? 0);
  const price = Math.round(base * (1 + (extra * pct) / 100));
  const detail = extra > 0 ? `${levelLabel(code, level)} · ${extra} inmueble${extra > 1 ? "s" : ""} adicional${extra > 1 ? "es" : ""} (+${pct}% c/u)` : levelLabel(code, level);
  return { price, level, detail };
}

// ─── Alertas internas (solo se ven en el dashboard, nunca en el PDF) ──────
const PRESENCIAL = new Set(["STR-01.2", "STR-01.3", "STR-03.1", "STR-04.1", "STR-04.2"]);

export function internalAlerts(codes: string[], p: ClientProfile): string[] {
  if (p.morelos) return [];
  const out: string[] = [];
  if (codes.includes("STR-02.1") || codes.includes("STR-02.5"))
    out.push("Programa Interno fuera de Morelos: confirma si el estado exige registro local o carta de corresponsabilidad antes de ofertarlo completo.");
  if (codes.some((c) => PRESENCIAL.has(c)))
    out.push("Hay servicios presenciales fuera de Morelos: considera traslado y viáticos en el precio.");
  return out;
}

// ─── Alcances que se agregan a "Alcance y observaciones" de la cotización ──
// Van en la propuesta (documento contractual), no en la página web.
export const QUOTE_SCOPE: Record<string, string> = {
  "STR-02.3": "La revisión es documental y preventiva; no sustituye la inspección ni la resolución de la autoridad.",
  "STR-02.1": "Salvo que se indique, no incluye dictámenes especializados (eléctrico, estructural o de gas) ni derechos de trámite.",
  "STR-02.5": "La actualización parte del Programa Interno vigente del cliente. Salvo que se indique, no incluye dictámenes especializados ni derechos de trámite.",
  "STR-02.4":
    "Atención de lunes a viernes de 9:00 a 18:00 h: una reunión virtual mensual de hasta 60 minutos y hasta 2 horas mensuales de asesoría y revisión documental. No incluye atención de emergencias, disponibilidad permanente, visitas presenciales, dictámenes ni elaboración de documentos completos, que se cotizan por separado.",
  "STR-01.4": "Los protocolos orientan la actuación del personal; no sustituyen la denuncia ante la autoridad ni la asesoría legal.",
  "STR-01.5":
    "La aplicación de los cuestionarios se realiza en medios digitales. Los resultados son confidenciales y se entregan de forma agregada; el servicio no incluye atención clínica ni psicológica individual.",
};

// ─── Perfil capturado en el diagnóstico público ───────────────────────────
// El diagnóstico guarda el perfil en las notas del lead con este marcador para
// que la cotización se arme ya clasificada. Formato: [perfil] k=v; k=v
const PROFILE_TAG = "[perfil]";

export interface LeadProfile {
  profile: Partial<ClientProfile>;
  codes: string[];
}

export function encodeLeadProfile(p: Partial<ClientProfile>, codes: string[]): string {
  const kv: string[] = [];
  if (p.giro) kv.push(`giro=${p.giro}`);
  if (p.people) kv.push(`personas=${p.people}`);
  if (p.area) kv.push(`m2=${p.area}`);
  if (p.morelos !== undefined) kv.push(`morelos=${p.morelos ? "si" : "no"}`);
  if (codes.length) kv.push(`servicios=${codes.join(",")}`);
  return `${PROFILE_TAG} ${kv.join("; ")}`;
}

export function parseLeadProfile(notes: string | null | undefined): LeadProfile | null {
  const line = (notes ?? "").split("\n").find((l) => l.trim().startsWith(PROFILE_TAG));
  if (!line) return null;
  const kv = Object.fromEntries(
    line.trim().slice(PROFILE_TAG.length).split(";").map((s) => s.split("=").map((x) => x.trim()) as [string, string]).filter(([k, v]) => k && v),
  );
  const profile: Partial<ClientProfile> = {};
  if (GIROS.some((g) => g.id === kv.giro)) profile.giro = kv.giro as GiroId;
  if (Number(kv.personas) > 0) profile.people = Number(kv.personas);
  if (Number(kv.m2) > 0) profile.area = Number(kv.m2);
  if (kv.morelos) profile.morelos = kv.morelos === "si";
  const codes = (kv.servicios ?? "").split(",").map((c) => c.trim()).filter((c) => /^STR-\d{2}(\.\d)?$/.test(c));
  return { profile, codes };
}
