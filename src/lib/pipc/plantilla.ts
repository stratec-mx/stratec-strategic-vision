// Plantilla del Programa Interno de Protección Civil de Morelos (docs/m-desr/plantillas/pipc-morelos-v1.md).
// Una sola plantilla para riesgo ordinario y alto: se conservan todos los apartados en el orden de la guía de la
// CEPCM y cada uno se puede marcar "No aplica" con su motivo (§1.1). La variante institucional agrega
// apartados opcionales (§7). Solo se toma la estructura y el número de las normas citadas, nunca su texto.

import type { DocumentData, DocumentTemplate } from "@/lib/documentTemplates";

export const PIPC_TEMPLATE_ID = "pipc-morelos";

/** Sí: siempre · cond: solo si aplica · ni: no aplica a establecimientos de nuevo ingreso. */
export type Obligatoriedad = "si" | "cond" | "ni";

/** Qué toma del inmueble capturado en Inmuebles y plano cada apartado con lámina. */
export type VistaPlano =
  | "georreferencia"
  | "colindancias"
  | "areas"
  | "riesgos_internos"
  | "riesgos_externos"
  | "equipos_inventario"
  | "equipos_localizacion"
  | "senalizacion"
  | "senalizacion_localizacion";

/** Contenido que se genera solo al armar el PDF. */
export type Generado = "clasificacion" | "fundamento" | "anexos" | "bibliografia";

interface ApartadoBase {
  /** Clave en `sections` (texto del apartado). */
  key: string;
  /** Código de la guía (I, I.2, II.7.1.1…). Sin punto = capítulo. */
  code: string;
  title: string;
  hint: string;
  /** Tipo de contenido de la guía (R, D, T, P, E, A, M, G), p. ej. "R + A". Vacío = solo encabezado. */
  contenido: string;
  oblig: Obligatoriedad;
  /** Cuándo aplica un apartado condicional. */
  condicion?: string;
  /** Normas que cita la guía (solo el número). */
  norma?: string;
  /** Solo en la variante institucional (§7). */
  soloInstitucional?: boolean;
  /** Restricción de competencia (§4): alerta interna, nunca sale en el documento. */
  restriccion?: string;
  generado?: Generado;
}

export type PipcBlock =
  | ({ type: "apartado"; defaultText?: string } & ApartadoBase)
  | ({ type: "plano"; vista: VistaPlano } & ApartadoBase);

export type Clasificacion = "ordinario" | "alto";
export type Variante = "cepcm" | "institucional";
/** Respuesta a una pregunta del expediente: sin contestar, sí o no. */
export type SiNo = "si" | "no" | undefined;

export interface CondicionesPipc {
  nuevoIngreso?: SiNo;
  apoderado?: SiNo;
  sqp?: SiNo;
  gasLP?: SiNo;
  gasNatural?: SiNo;
  combustibles?: SiNo;
  recipientesPresion?: SiNo;
  electricidadEstatica?: SiNo;
}

/** Datos propios del Programa Interno que se guardan con el documento. */
export interface PipcData {
  ejercicio: string;
  clasificacion?: Clasificacion;
  variante: Variante;
  /** Municipio ante el que se presenta (riesgo ordinario). */
  municipio?: string;
  /** Código del apartado → motivo de "No aplica". */
  noAplica: Record<string, string>;
  condiciones: CondicionesPipc;
  /** Variante institucional: número mínimo de simulacros al año (§7). */
  simulacrosMinimos?: number;
}

export const pipcInicial = (hoy = new Date()): PipcData => ({
  ejercicio: String(hoy.getFullYear()),
  variante: "cepcm",
  noAplica: {},
  condiciones: {},
});

export function normalizePipc(raw: unknown): PipcData {
  const base = pipcInicial();
  const d = (raw ?? {}) as Partial<PipcData>;
  return {
    ...base,
    ...d,
    noAplica: { ...(d.noAplica ?? {}) },
    condiciones: { ...(d.condiciones ?? {}) },
  };
}

export const CLASIFICACION_ETIQUETA: Record<Clasificacion, string> = { ordinario: "Riesgo ordinario", alto: "Riesgo alto" };
export const VARIANTE_ETIQUETA: Record<Variante, string> = {
  cepcm: "Guía de la CEPCM",
  institucional: "Institucional o educativa",
};
export const OBLIG_ETIQUETA: Record<Obligatoriedad, string> = {
  si: "Obligatorio",
  cond: "Condicional",
  ni: "No aplica a nuevo ingreso",
};
export const CONTENIDO_ETIQUETA: Record<string, string> = {
  R: "Redacción",
  D: "Dato",
  T: "Tabla",
  P: "Plano",
  E: "Fotografía",
  A: "Anexo",
  M: "M-DESR",
  G: "Generado",
};

/** Profundidad del código: "II" = 0 (capítulo), "II.7" = 1, "II.7.1" = 2… */
export const profundidad = (code: string) => (code.match(/\./g) ?? []).length;
export const esCapitulo = (b: { code: string }) => profundidad(b.code) === 0;
/** Letras de contenido del apartado ("R + A" → ["R", "A"]). */
export const letras = (contenido: string) => contenido.split(/[^A-Z]+/).filter((l) => CONTENIDO_ETIQUETA[l]);
/** Solo se anexa (no lleva redacción propia). */
export const soloAnexo = (b: { contenido: string }) => {
  const l = letras(b.contenido);
  return l.length > 0 && l.every((x) => x === "A");
};

/** Ante quién se presenta: la CEPCM (riesgo alto) o el municipio (riesgo ordinario). */
export function autoridad(p: PipcData): string {
  if (p.clasificacion === "alto") return "Coordinación Estatal de Protección Civil de Morelos";
  if (p.clasificacion === "ordinario") return p.municipio?.trim() ? `Protección Civil del municipio de ${p.municipio.trim()}` : "Protección Civil municipal";
  return "";
}

export const BASE_LEGAL = ["Ley Estatal de Protección Civil de Morelos", "Reglamento de la Ley Estatal de Protección Civil de Morelos"];

// ─── Estructura (§2 y §3) ──────────────────────────────────────────────────

const key = (code: string) => `pipc_${code.replace(/[^\dA-Za-z]+/g, "_")}`;

type Opc = Partial<Pick<ApartadoBase, "condicion" | "norma" | "soloInstitucional" | "restriccion" | "generado">> & { defaultText?: string };

const A = (code: string, title: string, contenido: string, oblig: Obligatoriedad, hint: string, o: Opc = {}): PipcBlock => ({
  type: "apartado", key: key(code), code, title, contenido, oblig, hint, ...o,
});
const P = (code: string, title: string, contenido: string, vista: VistaPlano, hint: string, o: Opc = {}): PipcBlock => ({
  type: "plano", key: key(code), code, title, contenido, oblig: "si", vista, hint, ...o,
});
const CAP = (code: string, title: string, hint = ""): PipcBlock => A(code, title, "", "si", hint);

/** Esqueleto de tabla: columnas separadas por "|" (el PDF las dibuja como tabla). */
const T = (...cols: string[]) => cols.join(" | ");

const TERCERO = "Lo emite un tercero (unidad de verificación, perito u otro profesionista con registro). STRATEC no lo elabora: solo se anexa y, si falta, se recomienda obtenerlo.";
const ASESOR = "Requiere un asesor con registro vigente ante la CEPCM. El titular anexa el registro a mano.";
const CONSULTOR = "Texto base que redacta y valida el Consultor (se comparte con Protocolos, STR-01.4).";

const BLOQUES: PipcBlock[] = [
  // ── I. Datos generales ──
  CAP("I", "Datos generales"),
  A("I.1", "Presentación", "R", "si", "Objetivos, tipo de instalación, reseña y antecedentes de emergencias. Máximo una página."),
  A("I.2", "Datos generales y número de registro de protección civil (NRPC)", "D", "si", "Escribe el NRPC si el establecimiento ya lo tiene."),
  A("I.2.1", "Nombre o razón social", "D", "si", "Si se deja vacío, se usa el nombre del cliente."),
  A("I.2.2", "Nombre comercial", "D", "si", "Nombre con el que se conoce el establecimiento."),
  A("I.2.3", "Giro o actividad", "D", "si", "Actividad principal del establecimiento."),
  A("I.2.4", "Domicilio", "D", "si", "Si se deja vacío, se usa la ubicación de los datos generales."),
  A("I.2.5", "Teléfonos", "D", "si", "Teléfonos del establecimiento (dato protegido)."),
  A("I.2.6", "Contacto en caso de emergencia", "D", "si", "Sale del directorio de la UIPC (II.2.1)."),
  A("I.2.7", "Total de personal", "T", "si", "Personal administrativo, operativo y flotante. En la variante institucional, censo por tipo de población (fijos y externos).", {
    defaultText: [T("Tipo de personal", "Número de personas"), T("Administrativo", ""), T("Operativo", ""), T("Flotante", "")].join("\n"),
  }),
  A("I.2.8", "Aforo máximo", "D", "si", "Sale del cálculo de aforo (II.5.2)."),
  A("I.2.9", "Horario de funcionamiento", "D", "si", "Días y horas de operación."),
  A("I.2.10", "Turnos laborales", "T", "si", "Un renglón por turno.", { defaultText: [T("Turno", "Horario", "Personas"), T("Matutino", "", "")].join("\n") }),
  A("I.2.11", "Correo para oír y recibir notificaciones", "D", "si", "Correo que el establecimiento designa para notificaciones."),
  A("I.2.12", "Responsable de la UIPC", "D", "si", "Sale de la Unidad Interna (II.1)."),
  A("I.2.13", "Escrito bajo protesta de decir verdad", "R + A", "si", "Firmado por el representante legal y dirigido a la CEPCM. Texto base con datos + escaneo firmado.", { norma: "Ley Estatal de Protección Civil y su Reglamento" }),
  A("I.2.14", "Identificación oficial del representante legal", "A", "si", "Anverso y reverso, a color."),
  A("I.2.15", "Comprobante de domicilio del establecimiento", "A", "si", "Licencia de funcionamiento o recibo de luz, a color."),
  A("I.3", "Poder notarial y carta poder", "A", "cond", "Con identificaciones del otorgante, el apoderado y dos testigos.", { condicion: "si firma un apoderado" }),
  A("I.4", "Aprobado del Programa Interno del ejercicio anterior", "A", "ni", "Archivo del cliente."),
  A("I.5", "Visto bueno del ejercicio anterior", "A", "ni", "Archivo del cliente."),
  A("I.6", "Carta de corresponsabilidad", "A", "si", "Firmada por el asesor registrado y el representante legal.", { restriccion: ASESOR }),
  A("I.7", "Registro vigente del asesor que elabora el Programa Interno", "A", "si", "Lo anexa el titular.", { restriccion: ASESOR }),
  P("I.8", "Georreferenciación del establecimiento", "P", "georreferencia", "Coordenadas y lámina exterior sobre OpenStreetMap, desde Inmuebles y plano."),
  P("I.9", "Colindancias", "T + P", "colindancias", "Norte, sur, oriente y poniente: cuadro de colindancias del predio capturado en Inmuebles y plano."),
  P("I.10", "Áreas del establecimiento con memoria fotográfica", "T + E", "areas", "Espacios del croquis por nivel y fotografías de los elementos (sin personas ni placas)."),

  // ── II. Subprograma de prevención ──
  CAP("II", "Plan operativo · Subprograma de prevención"),
  A("II.1", "Unidad Interna de Protección Civil (UIPC)", "T", "si", "Integrantes de la UIPC (dato personal).", {
    defaultText: [T("Cargo en la UIPC", "Nombre", "Puesto en el establecimiento"), T("Responsable", "", ""), T("Suplente", "", "")].join("\n"),
  }),
  A("II.1.1", "Acta constitutiva de la UIPC", "R + A", "si", "Texto base con integrantes + escaneo firmado."),
  A("II.1.2", "Organigrama", "G", "si", "Integrantes y brigadas en orden jerárquico. Un renglón por cargo; usa sangría con «- » para los niveles."),
  A("II.1.3", "Actas de sesiones de la UIPC del ejercicio anterior", "A", "ni", "Al menos una, firmada."),
  A("II.1.4", "Resoluciones de los simulacros del ejercicio anterior", "A", "ni", "Archivo del cliente."),
  A("II.2.1", "Directorio interno de la UIPC", "T", "si", "Números de cada integrante (dato personal).", {
    defaultText: [T("Nombre", "Cargo", "Teléfono"), T("", "", "")].join("\n"),
  }),
  A("II.2.2", "Directorio externo de cuerpos de emergencia", "T", "si", "Cuerpos de emergencia del municipio.", {
    defaultText: [T("Institución", "Teléfono", "Dirección"), T("Emergencias", "911", "")].join("\n"),
  }),
  A("II.3", "Funciones de cada brigada", "R", "si", CONSULTOR),
  A("II.3.1", "Brigada de evacuación", "T + R", "si", "Integrantes y funciones. " + CONSULTOR),
  A("II.3.2", "Brigada de prevención y combate de incendios", "T + R", "si", "Integrantes y funciones. " + CONSULTOR),
  A("II.3.3", "Brigada de primeros auxilios", "T + R", "si", "Integrantes y funciones. " + CONSULTOR),
  A("II.3.4", "Brigada de búsqueda y rescate", "T + R", "si", "Integrantes y funciones. " + CONSULTOR),
  A("II.3.5", "Brigada de comunicación", "T + R", "si", "Integrantes y funciones. " + CONSULTOR),
  A("II.3.6", "Otra brigada", "T + R", "cond", "Integrantes y funciones.", { condicion: "si el establecimiento la requiere" }),
  A("II.4", "Programa de actividades de la UIPC", "T", "si", "Calendario anual.", {
    defaultText: [T("Actividad", "Mes", "Responsable"), T("", "", "")].join("\n"),
  }),
  A("II.5", "Clasificación del riesgo", "", "si", ""),
  A("II.5.1", "Grado de riesgo de incendio", "T", "si", "Cálculo con el inventario de materiales y la superficie. Lo revisa y confirma quien elabora.", { norma: "NOM-002-STPS-2010" }),
  A("II.5.2", "Aforo de personas", "T", "si", "Ficha + áreas.", { defaultText: [T("Área", "Superficie (m²)", "Aforo"), T("", "", "")].join("\n") }),
  A("II.5.3", "Actividades altamente riesgosas (AAR)", "T", "si", "Inventario de materiales y procesos."),
  A("II.5.4", "Conclusión: clasificación del establecimiento", "G + R", "si", "La clasificación (ordinario o alto) se elige en los datos del Programa Interno y se imprime aquí.", { norma: "NOM-002-STPS-2010", generado: "clasificacion" }),
  A("II.6", "Listado de sustancias químicas peligrosas (SQP)", "T", "cond", "Inventario de sustancias.", {
    condicion: "si las hay",
    norma: "NOM-018-STPS-2015; NOM-005-STPS-1998",
    defaultText: [T("Sustancia", "Cantidad", "Área de almacenamiento"), T("", "", "")].join("\n"),
  }),
  A("II.6.1", "Actividades o áreas donde se usan SQP", "T + P", "cond", "Inventario + áreas + plano.", { condicion: "si hay SQP" }),
  A("II.7", "Análisis de riesgos", "M", "si", "Síntesis del diagnóstico M-DESR del proyecto."),
  A("II.7.1", "Riesgos internos", "M + T", "si", "Amenazas, escenarios y hallazgos de las áreas internas."),
  P("II.7.1.1", "Localización de riesgos internos", "P", "riesgos_internos", "Croquis con los riesgos marcados y los hallazgos del levantamiento (sin elementos sensibles)."),
  A("II.7.1.2", "Equipos o sistemas para prevenir, mitigar o eliminar riesgos", "M + T", "si", "Controles y su eficacia."),
  A("II.7.2", "Riesgos externos", "M + T", "si", "Amenazas del entorno, PESTEL y colindancias."),
  P("II.7.2.1", "Localización de riesgos externos", "P", "riesgos_externos", "Lámina exterior con el entorno, las colindancias y los riesgos marcados."),
  A("II.8", "Equipos contra emergencias", "", "si", ""),
  P("II.8.1", "Inventario de equipos contra emergencias", "T", "equipos_inventario", "Extintores, hidrantes, botiquines y alarmas del plano, con los datos de su ficha."),
  P("II.8.2", "Localización de equipos contra emergencias", "P", "equipos_localizacion", "Lámina exterior y croquis por nivel con los equipos."),
  P("II.9", "Señalización", "T + E", "senalizacion", "Salidas de emergencia, puntos de reunión y luminarias del plano, con fotografías.", { norma: "NOM-003-SEGOB-2011; NOM-026-STPS-2008; NOM-018-STPS-2015" }),
  P("II.9.1", "Localización de la señalización de emergencia", "P", "senalizacion_localizacion", "Salidas, rutas de evacuación y punto de reunión en la lámina exterior y en el croquis.", { norma: "NOM-003-SEGOB-2011" }),
  A("II.10", "Programa de mantenimiento del ejercicio", "T", "si", "Calendario y acciones de M-DESR.", {
    defaultText: [T("Equipo o instalación", "Actividad", "Mes", "Responsable"), T("", "", "", "")].join("\n"),
  }),
  A("II.11", "Electricidad estática: condiciones de seguridad", "T + E", "cond", "Inspección.", { condicion: "según el giro", norma: "NOM-022-STPS-2015" }),
  A("II.12", "Dictámenes", "", "si", ""),
  A("II.12.1", "Dictamen de seguridad estructural", "A", "si", "Documento de tercero. Confirmar con la CEPCM si es obligatorio.", { restriccion: TERCERO }),
  A("II.12.2", "Dictamen de verificación de instalaciones eléctricas", "A", "si", "Documento de tercero. Confirmar con la CEPCM si es obligatorio. Verificar la versión vigente de la NOM-001-SEDE.", { norma: "NOM-001-SEDE", restriccion: TERCERO }),
  A("II.12.3", "Dictamen de aprovechamiento de gas L.P.", "A", "cond", "Documento de tercero.", { condicion: "si hay gas L.P.", norma: "NOM-004-SEDG-2004", restriccion: TERCERO }),
  A("II.12.4", "Evaluación de espesores por pulso-eco", "A", "cond", "Documento de tercero.", { condicion: "si hay tanques o recipientes que la requieran", restriccion: TERCERO }),
  A("II.12.5", "Estaciones de gas L.P. para carburación", "A", "cond", "Documento de tercero.", { condicion: "según el giro", norma: "NOM-003-SEDG-2004", restriccion: TERCERO }),
  A("II.12.6", "Plantas de distribución de gas L.P.", "A", "cond", "Documento de tercero.", { condicion: "según el giro", norma: "NOM-001-SESH-2014; NOM-018-ASEA-2023", restriccion: TERCERO }),
  A("II.12.7", "Estaciones de servicio de diésel y gasolinas", "A", "cond", "Documento de tercero.", { condicion: "según el giro", norma: "NOM-005-ASEA-2016; NOM-020-STPS-2011; NOM-154-SCFI-2005", restriccion: TERCERO }),
  A("II.12.8", "Recipientes sujetos a presión", "A", "cond", "Documento de tercero.", { condicion: "si los hay", restriccion: TERCERO }),
  A("II.12.9", "Extintores: servicio de mantenimiento y recarga", "A", "si", "Documento de tercero. Confirmar con la CEPCM si es obligatorio.", { restriccion: TERCERO }),
  A("II.12.10", "Aprovechamiento de gas natural", "A", "cond", "Documento de tercero.", { condicion: "si hay gas natural", norma: "NOM-002-SECRE-2010", restriccion: TERCERO }),
  A("II.13", "Otros dictámenes", "A", "cond", "Carburación de motores, sistemas fijos contra incendio, terminales y bodegas de gas L.P., transporte y ductos.", {
    condicion: "según el giro",
    norma: "NOM-003-ASEA-2016; NOM-005-SESH-2010; NOM-007-SESH-2010; NOM-010-ASEA-2016; NOM-011-ASEA-2019",
    restriccion: TERCERO,
  }),
  A("II.14", "Capacitación", "", "si", ""),
  A("II.14.1", "Programa anual de capacitación", "T", "si", "Calendario; se liga con el servicio STR-03.1.", {
    defaultText: [T("Curso", "Brigada", "Mes", "Duración"), T("", "", "", "")].join("\n"),
  }),
  A("II.14.2", "Constancias de capacitación del ejercicio anterior", "A", "ni", "Archivo del cliente o de STRATEC."),
  A("II.14.3", "Registro del capacitador ante la CEPCM", "A", "si", "Registro de quien imparte la capacitación.", { restriccion: "Requiere el registro vigente del capacitador ante la CEPCM." }),
  A("II.14.4", "Evidencia fotográfica de la capacitación del ejercicio anterior", "E", "ni", "Fotografías sin datos personales visibles."),
  A("II.15", "Difusión y concientización", "R + E", "si", CONSULTOR),
  A("II.16", "Programa anual de simulacros", "T + R", "si", "Escenario, guion y cronología. En la variante institucional, número mínimo de simulacros e hipótesis de cada uno.", {
    norma: "Ley Estatal de Protección Civil (simulacros)",
    defaultText: [T("Simulacro", "Hipótesis o escenario", "Mes"), T("1", "", "")].join("\n"),
  }),

  // ── III. Subprograma de auxilio ──
  CAP("III", "Subprograma de auxilio"),
  A("III.1", "Procedimientos de emergencia", "R", "si", CONSULTOR),
  A("III.1.1", "Para personas con discapacidad", "R", "si", CONSULTOR, { norma: "NOM-008-SEGOB-2015" }),
  A("III.1.2", "Sismo", "R", "si", CONSULTOR),
  A("III.1.3", "Incendio", "R", "si", CONSULTOR),
  A("III.1.4", "Fugas o derrames de sustancias químicas", "R", "cond", CONSULTOR, { condicion: "si hay SQP" }),
  A("III.1.5", "Amenaza de bomba", "R", "si", CONSULTOR),
  A("III.1.6", "Otros procedimientos", "R", "cond", "Según los escenarios de riesgo de M-DESR.", { condicion: "según los escenarios de riesgo" }),
  A("III.1.6.1", "Emergencia médica", "R", "cond", CONSULTOR, { condicion: "clientes institucionales o educativos", soloInstitucional: true }),
  A("III.1.6.2", "Incendio forestal o de pastizal", "R", "cond", CONSULTOR, { condicion: "clientes institucionales o educativos", soloInstitucional: true }),
  A("III.1.6.3", "Atención de siniestros con la póliza de seguro", "R", "cond", CONSULTOR, { condicion: "clientes institucionales o educativos", soloInstitucional: true }),

  // ── IV. Subprograma de recuperación ──
  CAP("IV", "Subprograma de recuperación"),
  A("IV.1", "Plan de evaluación de daños", "R", "si", CONSULTOR),
  A("IV.1.1", "Inspección visual", "R + T", "si", "Texto base + lista de verificación."),
  A("IV.1.2", "Inspección física", "R + T", "si", "Texto base + lista de verificación."),
  A("IV.1.3", "Inspección técnica", "R + T", "si", "Texto base + lista de verificación."),
  A("IV.2", "Plan de vuelta a la normalidad", "R", "si", CONSULTOR),
  A("IV.2.1", "Acciones para restablecer la UIPC", "R", "si", CONSULTOR),
  A("IV.2.2", "Vuelta a la normalidad", "R", "si", CONSULTOR),

  // ── V. Plan de contingencias ──
  CAP("V", "Plan de contingencias"),
  A("V.1", "Evaluación inicial de riesgo de cada puesto de trabajo", "T", "si", "Puestos de trabajo y sus riesgos.", {
    defaultText: [T("Puesto", "Personas", "Riesgos identificados"), T("", "", "")].join("\n"),
  }),
  A("V.2", "Valoración del riesgo", "M", "si", "Matriz 5×5 de M-DESR: captura los riesgos en la tabla siguiente."),
  A("V.3", "Medidas y acciones de autoprotección", "M + R", "si", "Recomendaciones y tratamientos de M-DESR."),
  A("V.4", "Procedimientos de seguridad para trabajos peligrosos", "R", "cond", "Biblioteca de procedimientos.", { condicion: "según el giro" }),
  A("V.5", "Difusión y socialización", "R + E", "si", CONSULTOR),

  // ── VI. Plan de continuidad de operaciones ──
  CAP("VI", "Plan de continuidad de operaciones", "Misma estructura que el Plan de Continuidad (STR-02.2)."),
  A("VI.1", "Fundamento legal", "G", "si", "Se imprime la base legal del Programa Interno; agrega aquí otras referencias si hacen falta.", { generado: "fundamento" }),
  A("VI.2", "Propósito: metas y tiempos de recuperación", "R", "si", "Metas del plan y tiempos de recuperación."),
  A("VI.3", "Funciones críticas o esenciales", "T", "si", "Con tiempo tolerable de interrupción y de recuperación.", {
    defaultText: [T("Función crítica", "Tiempo tolerable de interrupción", "Tiempo de recuperación"), T("", "", "")].join("\n"),
  }),
  A("VI.4", "Sedes alternas", "T", "si", "Sedes donde se puede operar.", { defaultText: [T("Sede alterna", "Domicilio", "Capacidad"), T("", "", "")].join("\n") }),
  A("VI.5", "Líneas de sucesión o cadenas de mando", "T", "si", "Quién sustituye a quién.", { defaultText: [T("Cargo", "Titular", "Primer suplente", "Segundo suplente"), T("", "", "", "")].join("\n") }),
  A("VI.6", "Recursos humanos", "T + R", "si", "Personal indispensable para operar."),
  A("VI.7", "Dependencias e interdependencias", "T", "si", "Proveedores, servicios y áreas de los que depende la operación."),
  A("VI.8", "Requerimientos mínimos", "T", "si", "Recursos mínimos para operar.", { defaultText: [T("Recurso", "Cantidad mínima", "Ubicación"), T("", "", "")].join("\n") }),
  A("VI.9", "Interoperabilidad de las comunicaciones", "R", "si", "Medios de comunicación alternos."),
  A("VI.10", "Protección y respaldo de la información", "T", "si", "Información crítica y su respaldo.", { defaultText: [T("Información", "Medio de respaldo", "Frecuencia", "Responsable"), T("", "", "", "")].join("\n") }),
  A("VI.11", "Activación del plan", "R", "si", "Criterios y procedimiento de activación."),

  // ── VII a IX. Cierre ──
  A("VII", "Guía de anexos", "G", "si", "Se genera sola: lista los apartados que se anexan, en el orden del archivo de anexos, sin los marcados «No aplica».", { generado: "anexos" }),
  A("VIII", "Conclusiones y recomendaciones del asesor", "M + R", "si", "Acciones preventivas y correctivas, incluido el cumplimiento normativo. Las acciones van en la tabla siguiente."),
  A("IX", "Bibliografía", "G", "si", "Se genera sola con la base legal y las normas citadas en los apartados que aplican. Agrega aquí otras fuentes, una por renglón.", { generado: "bibliografia" }),
];

/** Bloques del PIPC más las tablas de M-DESR que reutiliza (matriz de riesgos, mapa de calor y acciones). */
const conTablas = (): DocumentTemplate["blocks"] => {
  const out: DocumentTemplate["blocks"] = [];
  for (const b of BLOQUES) {
    out.push(b);
    if (b.code === "V.2") {
      out.push({ type: "risks", code: "V.2", title: "Matriz de riesgos", hint: "Un renglón por riesgo: causa, consecuencia, probabilidad, impacto y controles." });
      out.push({ type: "heatmap", code: "V.2", title: "Mapa de calor" });
    }
    if (b.code === "VIII") out.push({ type: "actions", code: "VIII", title: "Acciones preventivas y correctivas", hint: "Medidas concretas, priorizadas y con plazo." });
  }
  return out;
};

export const PIPC_MORELOS: DocumentTemplate = {
  id: PIPC_TEMPLATE_ID,
  serviceCode: "STR-02.1",
  folioPrefix: "PIPC",
  name: "Programa Interno de Protección Civil",
  description: "Formato de la CEPCM de Morelos (riesgo ordinario y alto): apartados I a IX, «No aplica» con motivo, variante institucional y láminas del plano.",
  blocks: conTablas(),
};

/** Apartados del PIPC (sin las tablas de M-DESR). */
export const apartadosPipc = (blocks: DocumentTemplate["blocks"]) =>
  blocks.filter((b): b is PipcBlock => b.type === "apartado" || b.type === "plano");

/** ¿Se muestra el bloque en esta variante? */
export const visibleEnVariante = (b: { soloInstitucional?: boolean }, p: PipcData) => !b.soloInstitucional || p.variante === "institucional";

// ─── Sugerencias de "No aplica" (§1.1) ─────────────────────────────────────

const MOTIVOS: { cond: keyof CondicionesPipc; valor: "si" | "no"; codigos: string[]; motivo: string }[] = [
  { cond: "apoderado", valor: "no", codigos: ["I.3"], motivo: "El Programa Interno lo firma directamente el representante legal." },
  { cond: "sqp", valor: "no", codigos: ["II.6", "II.6.1", "III.1.4"], motivo: "El establecimiento no maneja sustancias químicas peligrosas." },
  { cond: "gasLP", valor: "no", codigos: ["II.12.3"], motivo: "El establecimiento no cuenta con instalación de gas L.P." },
  { cond: "gasNatural", valor: "no", codigos: ["II.12.10"], motivo: "El establecimiento no cuenta con instalación de gas natural." },
  { cond: "combustibles", valor: "no", codigos: ["II.12.5", "II.12.6", "II.12.7", "II.13"], motivo: "El giro del establecimiento no corresponde a estaciones, plantas, terminales ni transporte de combustibles." },
  { cond: "recipientesPresion", valor: "no", codigos: ["II.12.4", "II.12.8"], motivo: "El establecimiento no cuenta con recipientes sujetos a presión ni tanques que requieran esta evaluación." },
  { cond: "electricidadEstatica", valor: "no", codigos: ["II.11"], motivo: "Por su giro, el establecimiento no presenta condiciones de riesgo por electricidad estática." },
];

export const PREGUNTAS_CONDICION: { cond: keyof CondicionesPipc; pregunta: string }[] = [
  { cond: "nuevoIngreso", pregunta: "¿Es de nuevo ingreso?" },
  { cond: "apoderado", pregunta: "¿Firma un apoderado?" },
  { cond: "sqp", pregunta: "¿Maneja sustancias químicas peligrosas?" },
  { cond: "gasLP", pregunta: "¿Tiene instalación de gas L.P.?" },
  { cond: "gasNatural", pregunta: "¿Tiene instalación de gas natural?" },
  { cond: "combustibles", pregunta: "¿Su giro es de combustibles (estación, planta, terminal o transporte)?" },
  { cond: "recipientesPresion", pregunta: "¿Tiene recipientes sujetos a presión?" },
  { cond: "electricidadEstatica", pregunta: "¿Su giro presenta riesgo por electricidad estática?" },
];

/**
 * Lo que el panel sugiere marcar "No aplica" según lo contestado. Solo con respuestas explícitas;
 * no incluye lo que ya está marcado. El Consultor confirma.
 */
export function sugerenciasNoAplica(p: PipcData, blocks: DocumentTemplate["blocks"]): Record<string, string> {
  const ap = apartadosPipc(blocks);
  const out: Record<string, string> = {};
  if (p.condiciones.nuevoIngreso === "si") for (const b of ap) if (b.oblig === "ni") out[b.code] = "Establecimiento de nuevo ingreso.";
  for (const m of MOTIVOS) if (p.condiciones[m.cond] === m.valor) for (const c of m.codigos) out[c] = m.motivo;
  for (const c of Object.keys(out)) if (c in p.noAplica || !ap.some((b) => b.code === c)) delete out[c];
  return out;
}

// ─── Contenido generado ────────────────────────────────────────────────────

/** Apartados que se integran en el archivo de anexos, en el orden de la guía (VII). */
export function guiaAnexos(blocks: DocumentTemplate["blocks"], p: PipcData) {
  return apartadosPipc(blocks).filter((b) => letras(b.contenido).includes("A") && visibleEnVariante(b, p) && !(b.code in p.noAplica));
}

/** Base legal y normas citadas en los apartados que aplican, sin repetir (IX). */
export function bibliografia(blocks: DocumentTemplate["blocks"], p: PipcData): string[] {
  const vistas = new Set<string>(BASE_LEGAL);
  const out = [...BASE_LEGAL];
  for (const b of apartadosPipc(blocks)) {
    if (!b.norma || !visibleEnVariante(b, p) || b.code in p.noAplica) continue;
    for (const n of b.norma.split(";").map((x) => x.trim()).filter(Boolean)) {
      if (/^(Ley|Reglamento)/.test(n)) continue; // la base legal ya va arriba
      if (!vistas.has(n)) {
        vistas.add(n);
        out.push(n);
      }
    }
  }
  return out;
}

export function textoClasificacion(p: PipcData): string {
  if (!p.clasificacion) return "";
  const ante = autoridad(p);
  return `Con base en el grado de riesgo de incendio (II.5.1), el aforo de personas (II.5.2) y las actividades altamente riesgosas (II.5.3), el establecimiento se clasifica como de ${CLASIFICACION_ETIQUETA[p.clasificacion].toLowerCase()}${ante ? `; el Programa Interno se presenta ante ${ante}` : ""}.`;
}

/** Pendientes del documento: "No aplica" sin motivo y apartados obligatorios vacíos. */
export function pendientesPipc(template: DocumentTemplate, data: DocumentData) {
  const p = normalizePipc(data.pipc);
  const ap = apartadosPipc(template.blocks).filter((b) => b.contenido && visibleEnVariante(b, p));
  const sinMotivo = ap.filter((b) => b.code in p.noAplica && !p.noAplica[b.code].trim());
  const vacios = ap.filter(
    (b) => b.type === "apartado" && !(b.code in p.noAplica) && !b.generado && !soloAnexo(b) && b.oblig === "si" && !(data.sections[b.key] ?? "").trim(),
  );
  return { noAplica: Object.keys(p.noAplica).length, sinMotivo, vacios };
}
