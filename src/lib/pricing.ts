// Clasificación del cliente y precio sugerido para cotizaciones.
//
// Los criterios de abajo son una clasificación INTERNA de STRATEC para
// tarificar; no sustituyen la clasificación oficial de riesgo de la autoridad.
// Ajusta puntos y umbrales aquí. Los precios NO viven en el código (el código
// del sitio es público): se capturan en el dashboard, tabla service_rates.

// ─── Tres dimensiones independientes ──────────────────────────────────────
// · Riesgo: exposición del inmueble. Sirve para priorizar y elegir medidas;
//   NO cambia el precio.
// · Complejidad: esfuerzo profesional que exige UN inmueble (el mayor). Elige
//   la tarifa: básica, intermedia o avanzada.
// · Alcance: cuántos inmuebles o sedes. Suma un % por inmueble adicional, una
//   sola vez (lo común, como el informe y las reuniones, no se repite).

export type RiskLevel = "bajo" | "medio" | "alto" | "critico";
export const RISK_LEVELS: RiskLevel[] = ["bajo", "medio", "alto", "critico"];
export const RISK_LABEL: Record<RiskLevel, string> = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto", critico: "Riesgo crítico" };

export type Complexity = "basica" | "intermedia" | "avanzada";
export const COMPLEXITIES: Complexity[] = ["basica", "intermedia", "avanzada"];
export const COMPLEXITY_LABEL: Record<Complexity, string> = { basica: "Complejidad básica", intermedia: "Complejidad intermedia", avanzada: "Complejidad avanzada" };

export type Scope = "un_inmueble" | "varios_inmuebles" | "varias_sedes" | "integral";
export const SCOPES: Scope[] = ["un_inmueble", "varios_inmuebles", "varias_sedes", "integral"];
export const SCOPE_LABEL: Record<Scope, string> = {
  un_inmueble: "Un inmueble",
  varios_inmuebles: "Varios inmuebles (misma localidad)",
  varias_sedes: "Varias sedes (distintas localidades)",
  integral: "Proyecto integral",
};

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
  /** Superficie construida del inmueble mayor, m² */
  area: number;
  /** Personas simultáneas en el inmueble mayor: trabajadores + visitantes */
  people: number;
  /** Niveles del edificio más alto */
  floors: number;
  hazmat: HazmatId;
  /** Número de inmuebles a cubrir */
  sites: number;
  /** Alcance comercial */
  scope: Scope;
  /** Complejidad fijada por el consultor; null = la sugerida por el sistema */
  complexity: Complexity | null;
}

export const DEFAULT_PROFILE: ClientProfile = {
  morelos: true, giro: "oficinas", area: 0, people: 0, floors: 1, hazmat: "ninguno", sites: 1, scope: "un_inmueble", complexity: null,
};

/** [límite superior, puntos]: el primer límite que no se rebasa da los puntos. */
const AREA_STEPS: [number, number][] = [[500, 0], [1500, 1], [5000, 2], [Infinity, 3]];
const PEOPLE_STEPS: [number, number][] = [[50, 0], [250, 1], [1000, 2], [Infinity, 3]];
const FLOOR_STEPS: [number, number][] = [[2, 0], [5, 1], [Infinity, 2]];
/** Riesgo: 0-2 bajo, 3-5 medio, 6-9 alto, 10 o más crítico. */
const RISK_CUTS = { medio: 3, alto: 6, critico: 10 };
/** Complejidad: 0-2 básica, 3-5 intermedia, 6 o más avanzada. */
const COMPLEXITY_CUTS = { intermedia: 3, avanzada: 6 };
/** Materiales peligrosos: más trabajo de análisis (complejidad), además del riesgo. */
const HAZMAT_EFFORT: Record<HazmatId, number> = { ninguno: 0, menor: 1, significativo: 2 };

const step = (v: number, steps: [number, number][]) => steps.find(([max]) => (v || 0) <= max)?.[1] ?? 0;
const factorsOf = (parts: [string, number][]) => parts.filter(([, pts]) => pts > 0).map(([l, pts]) => `${l} (+${pts})`);

export interface Classification {
  risk: RiskLevel;
  riskPoints: number;
  riskFactors: string[];
  /** La que aplica al precio (la del consultor si la fijó) */
  complexity: Complexity;
  complexitySuggested: Complexity;
  complexityPoints: number;
  complexityFactors: string[];
  /** Alcance efectivo (con 1 inmueble es "un inmueble", salvo proyecto integral) */
  scope: Scope;
  sites: number;
}

export function classify(p: ClientProfile): Classification {
  const giro = GIROS.find((g) => g.id === p.giro) ?? GIROS[0];
  const hazmat = HAZMAT.find((h) => h.id === p.hazmat) ?? HAZMAT[0];
  const peoplePts = step(p.people, PEOPLE_STEPS);
  const floorPts = step(p.floors, FLOOR_STEPS);

  const riskParts: [string, number][] = [
    [giro.label, giro.points],
    [`Materiales peligrosos: ${hazmat.label.toLowerCase()}`, hazmat.points],
    [`${p.people || 0} personas`, peoplePts],
    [`${p.floors || 1} niveles`, floorPts],
  ];
  const riskPoints = riskParts.reduce((s, [, pts]) => s + pts, 0);
  const risk: RiskLevel =
    riskPoints >= RISK_CUTS.critico ? "critico" : riskPoints >= RISK_CUTS.alto ? "alto" : riskPoints >= RISK_CUTS.medio ? "medio" : "bajo";

  const complexityParts: [string, number][] = [
    [`${(p.area || 0).toLocaleString("es-MX")} m²`, step(p.area, AREA_STEPS)],
    [`${p.floors || 1} niveles`, floorPts],
    [`${p.people || 0} personas`, peoplePts],
    [`Materiales peligrosos: ${hazmat.label.toLowerCase()}`, HAZMAT_EFFORT[hazmat.id]],
  ];
  const complexityPoints = complexityParts.reduce((s, [, pts]) => s + pts, 0);
  const complexitySuggested: Complexity =
    complexityPoints >= COMPLEXITY_CUTS.avanzada ? "avanzada" : complexityPoints >= COMPLEXITY_CUTS.intermedia ? "intermedia" : "basica";

  const sites = Math.max(1, Math.round(p.sites || 1));
  const asked = p.scope ?? "un_inmueble";
  const scope: Scope = asked === "integral" ? "integral" : sites === 1 ? "un_inmueble" : asked === "un_inmueble" ? "varios_inmuebles" : asked;

  return {
    risk, riskPoints, riskFactors: factorsOf(riskParts),
    complexity: p.complexity ?? complexitySuggested, complexitySuggested, complexityPoints, complexityFactors: factorsOf(complexityParts),
    scope, sites,
  };
}

// ─── Tarifas (tabla service_rates) ─────────────────────────────────────────
// Las columnas price_low / price_medium / price_high son las tarifas de
// complejidad básica / intermedia / avanzada (antes: nivel bajo/medio/alto).
export interface ServiceRate {
  code: string;
  price_low: number | null;
  price_medium: number | null;
  price_high: number | null;
  /** % que se suma por cada inmueble adicional */
  extra_site_pct: number | null;
}

const priceOf = (r: ServiceRate, c: Complexity) => Number(c === "basica" ? r.price_low : c === "intermedia" ? r.price_medium : r.price_high) || 0;

export interface Suggestion {
  price: number;
  /** Tarifa del primer inmueble */
  base: number;
  extraSites: number;
  extraPct: number;
  complexity: Complexity;
  detail: string;
}

/** Precio sugerido para un servicio, o null si no hay tarifa para esa complejidad. El riesgo no interviene. */
export function suggestPrice(code: string, rates: Record<string, ServiceRate>, c: Classification): Suggestion | null {
  const r = rates[code];
  if (!r) return null;
  const base = priceOf(r, c.complexity);
  if (!base) return null;
  const extraSites = c.sites - 1;
  const extraPct = Number(r.extra_site_pct ?? 0);
  const price = Math.round(base * (1 + (extraSites * extraPct) / 100));
  const detail =
    extraSites > 0
      ? `${COMPLEXITY_LABEL[c.complexity]} · ${extraSites} inmueble${extraSites > 1 ? "s" : ""} adicional${extraSites > 1 ? "es" : ""} (+${extraPct}% c/u)`
      : COMPLEXITY_LABEL[c.complexity];
  return { price, base, extraSites, extraPct, complexity: c.complexity, detail };
}

// ─── Precio final contra sugerido ──────────────────────────────────────────
/** Rango permitido sin justificación: hasta 15 % abajo o 25 % arriba del sugerido. */
export const PRICE_RANGE = { belowPct: 15, abovePct: 25 };

export function priceDeviation(final: number, suggested: number | null | undefined): { pct: number | null; outOfRange: boolean } {
  if (!suggested || suggested <= 0) return { pct: null, outOfRange: false };
  const pct = Math.round(((final - suggested) / suggested) * 1000) / 10;
  return { pct, outOfRange: pct < -PRICE_RANGE.belowPct || pct > PRICE_RANGE.abovePct };
}

/** Registro del precio que se guarda dentro de cada concepto de la cotización. */
export interface PriceTrace {
  suggested: number | null;
  basis: string;
  risk: RiskLevel;
  complexity: Complexity;
  complexity_manual: boolean;
  scope: Scope;
  sites: number;
  deviation_pct: number | null;
  out_of_range: boolean;
  reason: string;
  by: string | null;
  at: string;
}

export interface TraceSummary {
  /** Suma de los sugeridos (solo conceptos con tarifa) */
  suggested: number;
  /** Suma de los precios finales de esos mismos conceptos */
  final: number;
  deviationPct: number | null;
  review: boolean;
  by: string | null;
}

/** Resumen de una cotización guardada para el registro. null = anterior al registro de precios. */
export function quoteTraceSummary(items: unknown): TraceSummary | null {
  const list = Array.isArray(items) ? (items as { qty?: number; unit_price?: number; pricing?: PriceTrace }[]) : [];
  const traced = list.filter((i) => i && typeof i === "object" && i.pricing);
  if (!traced.length) return null;
  let suggested = 0;
  let final = 0;
  let review = false;
  for (const i of traced) {
    const t = i.pricing!;
    const qty = Number(i.qty) || 0;
    if (t.out_of_range) review = true;
    if (t.suggested == null) continue;
    suggested += qty * t.suggested;
    final += qty * (Number(i.unit_price) || 0);
  }
  const deviationPct = suggested > 0 ? Math.round(((final - suggested) / suggested) * 1000) / 10 : null;
  return { suggested, final, deviationPct, review, by: traced[0].pricing!.by };
}

// ─── Alertas internas (solo se ven en el dashboard, nunca en el PDF) ──────
const PRESENCIAL = new Set(["STR-01.2", "STR-01.3", "STR-03.1", "STR-04.1", "STR-04.2"]);

export function internalAlerts(codes: string[], p: ClientProfile): string[] {
  const out: string[] = [];
  const c = classify(p);
  if (c.scope === "varias_sedes") out.push("Varias sedes: agrega viáticos y traslados por sede como conceptos aparte.");
  if (c.scope === "integral") out.push("Proyecto integral: el sugerido es solo referencia. Arma el precio por conceptos (honorarios, terceros, viáticos).");
  if (p.complexity && p.complexity !== c.complexitySuggested)
    out.push(`Complejidad fijada a mano (el sistema sugiere ${COMPLEXITY_LABEL[c.complexitySuggested].toLowerCase()}).`);
  if (p.morelos) return out;
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
