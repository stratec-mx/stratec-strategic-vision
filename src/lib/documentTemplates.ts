// Plantillas de documentos entregables de STRATEC.
// Cada plantilla define los bloques (apartados) del documento y su orden.
// El editor del dashboard y el generador de PDF leen esta misma definición.

export type Severity = "baja" | "media" | "alta" | "critica";
export type Priority = "alta" | "media" | "baja";
export type Term = "inmediato" | "corto" | "mediano" | "largo";
export type Verdict = "favorable" | "condicionado" | "no_favorable";

export interface Finding {
  id: string;
  area: string;
  description: string;
  severity: Severity;
}

export interface Risk {
  id: string;
  name: string;
  cause: string;
  consequence: string;
  probability: number; // 1-5
  impact: number; // 1-5
  controls: string;
  treatment: string;
}

export interface Action {
  id: string;
  action: string;
  priority: Priority;
  term: Term;
  responsible: string;
}

export interface DocumentMeta {
  /** Título personalizado que aparece en la portada (opcional) */
  title?: string;
  location?: string;
  visitDate?: string; // YYYY-MM-DD
  issueDate?: string; // YYYY-MM-DD
  consultant?: string;
  recipient?: string;
}

export interface DocumentData {
  meta: DocumentMeta;
  sections: Record<string, string>;
  findings: Finding[];
  risks: Risk[];
  actions: Action[];
  verdict?: Verdict;
}

export type Block =
  | { type: "text"; key: string; title: string; hint: string; defaultText?: string }
  | { type: "findings"; title: string; hint: string }
  | { type: "risks"; title: string; hint: string }
  | { type: "heatmap"; title: string }
  | { type: "actions"; title: string; hint: string }
  | { type: "verdict"; title: string; hint: string };

export interface DocumentTemplate {
  id: string;
  /** Código del servicio del catálogo (quoteCatalog) */
  serviceCode: string;
  /** Prefijo del folio, p. ej. DIAG → DIAG-2026-001 */
  folioPrefix: string;
  name: string;
  description: string;
  blocks: Block[];
}

// ─── Textos base reutilizables (editables en cada documento) ───────────────

const METODOLOGIA_ISO31000 =
  "El presente trabajo se desarrolló conforme al proceso de gestión del riesgo de la norma ISO 31000:2018, que comprende el establecimiento del contexto, la identificación, el análisis y la valoración de los riesgos, así como la definición de su tratamiento.\n\n" +
  "El levantamiento de información se realizó mediante inspección física de las instalaciones, entrevistas con personal clave y revisión documental. Cada riesgo se analizó en función de su probabilidad de ocurrencia y del impacto que tendría sobre las personas, los bienes y la continuidad de las operaciones, en una escala de 1 a 5. El nivel de riesgo resulta del producto de ambos factores y se clasifica como Bajo (1–4), Medio (5–9), Alto (10–15) o Crítico (16–25).";

const CONCLUSIONES_HINT = "Síntesis del estado general, riesgos prioritarios y próximos pasos recomendados.";
const RESUMEN_HINT = "Una página como máximo: objetivo, principales hallazgos, nivel de riesgo general y recomendaciones clave.";

// ─── Plantillas ─────────────────────────────────────────────────────────────

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "diagnostico-seguridad",
    serviceCode: "STR-01",
    folioPrefix: "DIAG",
    name: "Diagnóstico de Seguridad",
    description: "Evaluación integral del estado de seguridad de un inmueble u organización, con hallazgos, riesgos y recomendaciones.",
    blocks: [
      { type: "text", key: "resumen", title: "Resumen ejecutivo", hint: RESUMEN_HINT },
      { type: "text", key: "antecedentes", title: "Antecedentes y objetivo", hint: "Quién solicitó el diagnóstico, por qué y qué se busca obtener." },
      { type: "text", key: "metodologia", title: "Alcance y metodología", hint: "Áreas, instalaciones y periodo evaluados; cómo se levantó la información.", defaultText: METODOLOGIA_ISO31000 },
      { type: "text", key: "descripcion", title: "Descripción del inmueble y su entorno", hint: "Ubicación, uso, superficie, accesos, colindancias, horarios, población y contexto delictivo de la zona." },
      { type: "findings", title: "Hallazgos", hint: "Situaciones observadas que representan una vulnerabilidad o un incumplimiento." },
      { type: "risks", title: "Evaluación de riesgos", hint: "Riesgos derivados de los hallazgos, con su probabilidad e impacto." },
      { type: "heatmap", title: "Mapa de calor" },
      { type: "actions", title: "Recomendaciones", hint: "Medidas concretas, priorizadas y con plazo." },
      { type: "text", key: "conclusiones", title: "Conclusiones", hint: CONCLUSIONES_HINT },
    ],
  },
  {
    id: "analisis-riesgo",
    serviceCode: "STR-01.1",
    folioPrefix: "ARG",
    name: "Estudio y Análisis de Riesgo",
    description: "Identificación, análisis y valoración de riesgos conforme a ISO 31000, con mapa de calor y plan de tratamiento.",
    blocks: [
      { type: "text", key: "resumen", title: "Resumen ejecutivo", hint: RESUMEN_HINT },
      { type: "text", key: "objetivo", title: "Objetivo y alcance", hint: "Qué se analiza, para qué decisión y qué queda fuera del alcance." },
      { type: "text", key: "metodologia", title: "Metodología", hint: "Proceso y escalas utilizadas.", defaultText: METODOLOGIA_ISO31000 },
      { type: "text", key: "contexto", title: "Establecimiento del contexto", hint: "Contexto externo (entorno social, delictivo, político, económico, natural) e interno (organización, procesos, activos críticos)." },
      { type: "risks", title: "Identificación, análisis y valoración de riesgos", hint: "Un renglón por riesgo: causa, consecuencia, probabilidad, impacto y controles existentes." },
      { type: "heatmap", title: "Mapa de calor" },
      { type: "actions", title: "Plan de tratamiento", hint: "Acciones para evitar, reducir, transferir o aceptar cada riesgo." },
      { type: "text", key: "conclusiones", title: "Conclusiones", hint: CONCLUSIONES_HINT },
    ],
  },
  {
    id: "auditoria-seguridad",
    serviceCode: "STR-01.2",
    folioPrefix: "AUD",
    name: "Informe de Auditoría de Seguridad",
    description: "Verificación del cumplimiento de políticas, procedimientos y normas de seguridad, con no conformidades y acciones correctivas.",
    blocks: [
      { type: "text", key: "resumen", title: "Resumen ejecutivo", hint: RESUMEN_HINT },
      { type: "text", key: "objetivo", title: "Objetivo y alcance de la auditoría", hint: "Áreas, procesos y periodo auditados." },
      { type: "text", key: "criterios", title: "Criterios de auditoría", hint: "Normas, políticas internas, procedimientos y requisitos contra los que se evaluó." },
      { type: "findings", title: "Hallazgos y no conformidades", hint: "Cada desviación respecto a los criterios, con su severidad." },
      { type: "actions", title: "Acciones correctivas", hint: "Corrección propuesta para cada no conformidad, con responsable y plazo." },
      { type: "text", key: "conclusiones", title: "Conclusiones", hint: CONCLUSIONES_HINT },
    ],
  },
  {
    id: "dictamen-seguridad",
    serviceCode: "STR-01.3",
    folioPrefix: "DICT",
    name: "Dictamen de Seguridad",
    description: "Evaluación técnica de un inmueble o instalación con su determinación técnica: condiciones adecuadas, con observaciones o no adecuadas. No sustituye la resolución de la autoridad.",
    blocks: [
      { type: "text", key: "objeto", title: "Objeto del dictamen", hint: "Qué se dictamina y a solicitud de quién." },
      { type: "text", key: "fundamento", title: "Fundamento y criterios", hint: "Normatividad, estándares y criterios técnicos aplicados." },
      { type: "text", key: "descripcion", title: "Descripción del inmueble o instalación", hint: "Ubicación, uso, características constructivas y de operación relevantes." },
      { type: "findings", title: "Observaciones", hint: "Condiciones verificadas durante la inspección." },
      { type: "verdict", title: "Determinación técnica", hint: "Conclusión técnica de STRATEC sobre las condiciones evaluadas. La resolución corresponde a la autoridad competente." },
      { type: "text", key: "condiciones", title: "Condiciones y recomendaciones", hint: "Condiciones que deben cumplirse (si es condicionado) y recomendaciones adicionales." },
    ],
  },
  {
    id: "plan-continuidad",
    serviceCode: "STR-02.2",
    folioPrefix: "BCP",
    name: "Plan de Continuidad de Operaciones",
    description: "Procesos críticos, escenarios de riesgo, estrategias de recuperación y procedimiento de activación.",
    blocks: [
      { type: "text", key: "resumen", title: "Resumen ejecutivo", hint: RESUMEN_HINT },
      { type: "text", key: "alcance", title: "Objetivo y alcance", hint: "Sedes, procesos y escenarios cubiertos por el plan." },
      { type: "text", key: "procesos", title: "Procesos críticos y tiempos de recuperación", hint: "Procesos esenciales, tiempo máximo tolerable de interrupción y recursos mínimos." },
      { type: "risks", title: "Escenarios de riesgo", hint: "Eventos que pueden interrumpir la operación." },
      { type: "heatmap", title: "Mapa de calor" },
      { type: "text", key: "estrategias", title: "Estrategias de continuidad", hint: "Alternativas de operación y recuperación por proceso." },
      { type: "text", key: "roles", title: "Roles y responsabilidades", hint: "Comité de crisis, líderes de recuperación y suplentes." },
      { type: "text", key: "activacion", title: "Activación y comunicación", hint: "Criterios de activación, cadena de llamadas y comunicación con partes interesadas." },
      { type: "actions", title: "Plan de implementación", hint: "Acciones para dejar el plan operativo: equipamiento, capacitación, pruebas." },
    ],
  },
  {
    id: "informe-tecnico",
    serviceCode: "STR-99",
    folioPrefix: "INF",
    name: "Informe técnico",
    description: "Formato libre para cualquier otro entregable: antecedentes, desarrollo, hallazgos y recomendaciones.",
    blocks: [
      { type: "text", key: "resumen", title: "Resumen ejecutivo", hint: RESUMEN_HINT },
      { type: "text", key: "antecedentes", title: "Antecedentes", hint: "Contexto y motivo del informe." },
      { type: "text", key: "desarrollo", title: "Desarrollo", hint: "Contenido principal del trabajo realizado." },
      { type: "findings", title: "Hallazgos", hint: "Observaciones relevantes." },
      { type: "actions", title: "Recomendaciones", hint: "Medidas propuestas." },
      { type: "text", key: "conclusiones", title: "Conclusiones", hint: CONCLUSIONES_HINT },
    ],
  },
  {
    id: "revision-programa-interno",
    serviceCode: "STR-02.3",
    folioPrefix: "REV",
    name: "Reporte de Revisión de Programa Interno",
    description: "Revisión documental del Programa Interno de Protección Civil: faltantes, inconsistencias, vencimientos y recomendaciones.",
    blocks: [
      { type: "text", key: "resumen", title: "Resumen ejecutivo", hint: "Estado general del programa y las correcciones más urgentes." },
      {
        type: "text",
        key: "alcance",
        title: "Alcance de la revisión",
        hint: "Documentos recibidos, versión y fecha del programa revisado.",
        defaultText:
          "La revisión se realizó de forma documental sobre la información proporcionada por el cliente. Comprende el Programa Interno de Protección Civil y sus anexos: Unidad Interna de Protección Civil, análisis de riesgos, procedimientos de emergencia, planos, programa de capacitación y registro de simulacros.",
      },
      { type: "findings", title: "Observaciones", hint: "Un renglón por faltante, inconsistencia o documento vencido, con su gravedad." },
      { type: "actions", title: "Recomendaciones", hint: "Corrección propuesta, prioridad y plazo." },
      { type: "text", key: "conclusiones", title: "Conclusiones", hint: CONCLUSIONES_HINT },
    ],
  },
  {
    id: "protocolo-seguridad",
    serviceCode: "STR-01.4",
    folioPrefix: "PROT",
    name: "Protocolo de Seguridad",
    description: "Protocolo de actuación a la medida: extorsión, fraude, amenazas, incidentes o violencia laboral.",
    blocks: [
      { type: "text", key: "objetivo", title: "Objetivo", hint: "Qué situación atiende el protocolo y qué busca proteger." },
      { type: "text", key: "alcance", title: "Alcance", hint: "Instalaciones, áreas y personal a quienes aplica." },
      { type: "text", key: "definiciones", title: "Definiciones", hint: "Términos clave para que todo el personal los entienda igual." },
      { type: "text", key: "responsables", title: "Responsables y funciones", hint: "Quién coordina, quién decide y quién ejecuta cada paso." },
      { type: "text", key: "procedimiento", title: "Procedimiento de actuación", hint: "Pasos numerados: cómo reconocer la situación, qué hacer y qué no hacer." },
      { type: "text", key: "comunicacion", title: "Comunicación y escalamiento", hint: "A quién avisar, en qué orden y por qué medio." },
      { type: "text", key: "registro", title: "Registro y seguimiento", hint: "Qué se documenta después del incidente y cómo se revisa el protocolo." },
      { type: "actions", title: "Recomendaciones de implementación", hint: "Difusión, capacitación y fechas de revisión." },
    ],
  },
];

export const findTemplate = (id: string) => {
  const real = TEMPLATE_ALIASES[id] ?? id;
  return DOCUMENT_TEMPLATES.find((t) => t.id === real);
};

// ─── Escalas y etiquetas ────────────────────────────────────────────────────

export const SEVERITY_LABEL: Record<Severity, string> = { baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica" };
export const PRIORITY_LABEL: Record<Priority, string> = { alta: "Alta", media: "Media", baja: "Baja" };
export const TERM_LABEL: Record<Term, string> = {
  inmediato: "Inmediato (hasta 1 mes)",
  corto: "Corto (1–3 meses)",
  mediano: "Mediano (3–6 meses)",
  largo: "Largo (más de 6 meses)",
};
// Las claves se conservan por compatibilidad con documentos guardados; los
// textos evitan el lenguaje de resolución, que solo emite la autoridad.
export const VERDICT_LABEL: Record<Verdict, string> = {
  favorable: "Condiciones adecuadas",
  condicionado: "Adecuadas con observaciones",
  no_favorable: "Condiciones no adecuadas",
};

/** Ids anteriores de plantillas, para abrir documentos creados antes del cambio. */
const TEMPLATE_ALIASES: Record<string, string> = { "determinacion-seguridad": "dictamen-seguridad" };
export const PROBABILITY_LABEL = ["", "Rara", "Improbable", "Posible", "Probable", "Casi segura"];
export const IMPACT_LABEL = ["", "Insignificante", "Menor", "Moderado", "Mayor", "Catastrófico"];

export type RiskLevel = "bajo" | "medio" | "alto" | "critico";
export const riskScore = (r: Pick<Risk, "probability" | "impact">) => (r.probability || 0) * (r.impact || 0);
export const riskLevel = (score: number): RiskLevel =>
  score >= 16 ? "critico" : score >= 10 ? "alto" : score >= 5 ? "medio" : "bajo";
export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = { bajo: "Bajo", medio: "Medio", alto: "Alto", critico: "Crítico" };

/** Colores de nivel (RGB) compartidos por el editor y el PDF. */
export const LEVEL_RGB: Record<RiskLevel, [number, number, number]> = {
  bajo: [76, 140, 92],
  medio: [214, 170, 58],
  alto: [214, 116, 44],
  critico: [168, 36, 46],
};
export const SEVERITY_TO_LEVEL: Record<Severity, RiskLevel> = { baja: "bajo", media: "medio", alta: "alto", critica: "critico" };

// ─── Datos iniciales ────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

export const newFinding = (): Finding => ({ id: uid(), area: "", description: "", severity: "media" });
export const newRisk = (): Risk => ({ id: uid(), name: "", cause: "", consequence: "", probability: 3, impact: 3, controls: "", treatment: "" });
export const newAction = (): Action => ({ id: uid(), action: "", priority: "media", term: "corto", responsible: "" });

export function emptyDocumentData(t: DocumentTemplate): DocumentData {
  const sections: Record<string, string> = {};
  for (const b of t.blocks) if (b.type === "text") sections[b.key] = b.defaultText ?? "";
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    meta: { issueDate: iso, consultant: "", location: "", recipient: "" },
    sections,
    findings: [],
    risks: [],
    actions: [],
    verdict: t.blocks.some((b) => b.type === "verdict") ? "condicionado" : undefined,
  };
}

/** Completa datos guardados con los campos que falten (documentos viejos o plantillas actualizadas). */
export function normalizeDocumentData(t: DocumentTemplate, raw: unknown): DocumentData {
  const base = emptyDocumentData(t);
  const d = (raw ?? {}) as Partial<DocumentData>;
  return {
    meta: { ...base.meta, ...(d.meta ?? {}) },
    sections: { ...base.sections, ...(d.sections ?? {}) },
    findings: Array.isArray(d.findings) ? d.findings : [],
    risks: Array.isArray(d.risks) ? d.risks : [],
    actions: Array.isArray(d.actions) ? d.actions : [],
    verdict: d.verdict ?? base.verdict,
  };
}
