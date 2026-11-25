import type { FotoRef } from "./fotos";

// Catálogo de símbolos del prototipo, compartido por el mapa exterior y el croquis interior
// (Documento 04 §5, F-05 y C-06). Los códigos son los de plan_feature_types (Documento 04 §13, D-P5).

export const TIPOS_SIMBOLO = [
  // Protección civil
  "extintor", "botiquin", "hidrante", "salida_emergencia", "alarma_emergencia", "punto_reunion", "iluminacion",
  // Accesos
  "acceso_peatonal", "acceso_vehicular", "control_acceso", "torniquete", "pluma_vehicular", "caseta_vigilancia",
  // Seguridad y tecnología
  "camara", "sensor_intrusion", "boton_panico", "cerca_electrica",
  // Riesgos
  "punto_ciego", "riesgo_puntual",
] as const;
type TipoFijo = (typeof TIPOS_SIMBOLO)[number];
/** Tipos del catálogo, más los que el usuario crea ("personal:<id>"). */
export type TipoSimbolo = TipoFijo | `personal:${string}`;

export const CATEGORIAS = ["proteccion_civil", "acceso", "seguridad", "riesgo", "personalizado"] as const;
export type Categoria = (typeof CATEGORIAS)[number];
export const CATEGORIA_ETIQUETA: Record<Categoria, string> = {
  proteccion_civil: "Protección civil",
  acceso: "Accesos",
  seguridad: "Seguridad y tecnología",
  riesgo: "Riesgos",
  personalizado: "Mis elementos",
};

export interface DefSimbolo {
  tipo: TipoSimbolo;
  etiqueta: string;
  /** Letra o signo corto que va dentro del ícono. */
  glifo: string;
  color: string;
  categoria: Categoria;
  /** Información sensible (Documento 04, regla 5 y D-P5): no la ve el observador comercial ni sale en el Programa Interno. */
  sensible?: boolean;
}

const D = (tipo: TipoFijo, etiqueta: string, glifo: string, color: string, categoria: Categoria, sensible = false): DefSimbolo => ({
  tipo, etiqueta, glifo, color, categoria, ...(sensible ? { sensible } : {}),
});

const ROJO = "#C62828";
const VERDE = "#1B7F3B";
const AZUL = "#1D4ED8";
const MORADO = "#5B21B6";
const AMBAR = "#B45309";

/** Catálogo (códigos de plan_feature_types, Documento 02 C-11 y Documento 04 §13). Se le suman los personalizados. */
export const SIMBOLOS: Record<string, DefSimbolo> = {
  extintor: D("extintor", "Extintor", "E", ROJO, "proteccion_civil"),
  botiquin: D("botiquin", "Botiquín", "+", VERDE, "proteccion_civil"),
  hidrante: D("hidrante", "Hidrante", "H", ROJO, "proteccion_civil"),
  salida_emergencia: D("salida_emergencia", "Salida de emergencia", "S", VERDE, "proteccion_civil"),
  alarma_emergencia: D("alarma_emergencia", "Alarma de emergencia", "A", ROJO, "proteccion_civil"),
  punto_reunion: D("punto_reunion", "Punto de reunión", "PR", VERDE, "proteccion_civil"),
  iluminacion: D("iluminacion", "Luminaria", "L", "#A16207", "proteccion_civil"),
  acceso_peatonal: D("acceso_peatonal", "Acceso peatonal", "AP", MORADO, "acceso", true),
  acceso_vehicular: D("acceso_vehicular", "Acceso vehicular", "AV", MORADO, "acceso", true),
  control_acceso: D("control_acceso", "Control de acceso (lector)", "CA", MORADO, "acceso", true),
  torniquete: D("torniquete", "Torniquete", "T", MORADO, "acceso", true),
  pluma_vehicular: D("pluma_vehicular", "Pluma o barrera vehicular", "PB", MORADO, "acceso", true),
  caseta_vigilancia: D("caseta_vigilancia", "Caseta de vigilancia", "CV", MORADO, "acceso", true),
  camara: D("camara", "Cámara", "C", AZUL, "seguridad", true),
  sensor_intrusion: D("sensor_intrusion", "Sensor de intrusión", "SI", AZUL, "seguridad", true),
  boton_panico: D("boton_panico", "Botón de pánico", "BP", AZUL, "seguridad", true),
  cerca_electrica: D("cerca_electrica", "Cerca eléctrica", "CE", AZUL, "seguridad", true),
  punto_ciego: D("punto_ciego", "Punto ciego", "PC", AMBAR, "riesgo", true),
  riesgo_puntual: D("riesgo_puntual", "Riesgo", "!", AMBAR, "riesgo"),
};

const DESCONOCIDO: Omit<DefSimbolo, "tipo"> = { etiqueta: "Elemento", glifo: "?", color: "#667085", categoria: "personalizado" };

/** Definición de un tipo, aunque sea un personalizado que ya no existe. */
export const defSimbolo = (tipo: string): DefSimbolo => SIMBOLOS[tipo] ?? { ...DESCONOCIDO, tipo: tipo as TipoSimbolo };

/** Elementos que crea el usuario (se guardan con sus datos). */
export interface SimboloPersonal {
  id: string;
  etiqueta: string;
  glifo: string;
  color: string;
  sensible: boolean;
}

/** Suma al catálogo los elementos personalizados (reemplaza los anteriores). */
export function registrarPersonalizados(lista: SimboloPersonal[]) {
  for (const k of Object.keys(SIMBOLOS)) if (k.startsWith("personal:")) delete SIMBOLOS[k];
  for (const p of lista) {
    const tipo = `personal:${p.id}` as TipoSimbolo;
    SIMBOLOS[tipo] = { tipo, etiqueta: p.etiqueta, glifo: p.glifo.slice(0, 2).toUpperCase() || "?", color: p.color, categoria: "personalizado", ...(p.sensible ? { sensible: true } : {}) };
  }
}

/** Todos los tipos que se pueden colocar, en el orden del catálogo. */
export const tiposDisponibles = (): TipoSimbolo[] => [...TIPOS_SIMBOLO, ...(Object.keys(SIMBOLOS).filter((k) => k.startsWith("personal:")) as TipoSimbolo[])];

/** Códigos anteriores del prototipo (antes de D-P5), para leer lo ya capturado en el navegador. */
const CODIGOS_ANTERIORES: Record<string, TipoSimbolo> = { salida: "salida_emergencia", alarma: "alarma_emergencia" };

/** Normaliza un código de símbolo; devuelve null si no se reconoce. */
export function tipoSimbolo(codigo: string): TipoSimbolo | null {
  if ((TIPOS_SIMBOLO as readonly string[]).includes(codigo)) return codigo as TipoSimbolo;
  if (codigo.startsWith("personal:")) return codigo as TipoSimbolo;
  return CODIGOS_ANTERIORES[codigo] ?? null;
}

/** Diagnóstico frente a propuesta: lo que ya existe, lo que STRATEC propone y lo que conviene retirar. */
export const SITUACIONES = ["existente", "propuesto", "retirar"] as const;
export type Situacion = (typeof SITUACIONES)[number];
export const SITUACION_ETIQUETA: Record<Situacion, string> = { existente: "Existente", propuesto: "Propuesto", retirar: "Retirar" };

export interface DatosCamara {
  /** Rumbo del centro del cono, en grados (0 = arriba/norte, sentido horario). */
  direccion: number;
  /** Apertura total del cono, en grados. */
  angulo: number;
  /** Alcance en metros. */
  alcance: number;
}

export const CAMARA_INICIAL: DatosCamara = { direccion: 0, angulo: 90, alcance: 15 };

/** Color de las rutas de evacuación (verde de señalización). */
export const COLOR_RUTA = "#1B7F3B";

// ───────────────────────── Fichas (D-P6) ─────────────────────────

/** Estado de un toque, igual para todos los elementos (plan_features.properties.condition). */
export const CONDICIONES = ["bueno", "regular", "malo", "no_funciona"] as const;
export type Condicion = (typeof CONDICIONES)[number];
export const CONDICION_INFO: Record<Condicion, { etiqueta: string; color: string }> = {
  bueno: { etiqueta: "Bueno", color: "#287A59" },
  regular: { etiqueta: "Regular", color: "#B7791F" },
  malo: { etiqueta: "Malo", color: "#C2410C" },
  no_funciona: { etiqueta: "No funciona", color: "#B42318" },
};

export type Campo =
  | { clave: string; etiqueta: string; tipo: "opcion"; opciones: string[] }
  | { clave: string; etiqueta: string; tipo: "numero"; unidad: string }
  | { clave: string; etiqueta: string; tipo: "fecha" }
  | { clave: string; etiqueta: string; tipo: "sino" };

/** Datos fijos por tipo: lo que el Programa Interno inventaría (II.8.1). Los demás tipos solo llevan estado y nota. */
export const FICHAS: Partial<Record<string, Campo[]>> = {
  extintor: [
    { clave: "agente", etiqueta: "Agente", tipo: "opcion", opciones: ["PQS (polvo químico seco)", "CO₂", "Agua", "Espuma AFFF", "Tipo K", "Otro"] },
    { clave: "capacidad_kg", etiqueta: "Capacidad", tipo: "numero", unidad: "kg" },
    { clave: "fecha_recarga", etiqueta: "Última recarga", tipo: "fecha" },
  ],
  botiquin: [
    { clave: "tipo", etiqueta: "Tipo", tipo: "opcion", opciones: ["Fijo", "Portátil"] },
    { clave: "completo", etiqueta: "Contenido completo", tipo: "sino" },
    { clave: "fecha_revision", etiqueta: "Última revisión", tipo: "fecha" },
  ],
  hidrante: [
    { clave: "tipo", etiqueta: "Tipo", tipo: "opcion", opciones: ["Gabinete interior", "Toma exterior", "Toma siamesa"] },
    { clave: "fecha_prueba", etiqueta: "Última prueba", tipo: "fecha" },
  ],
  salida_emergencia: [
    { clave: "ancho_m", etiqueta: "Ancho libre", tipo: "numero", unidad: "m" },
    { clave: "senalizada", etiqueta: "Señalizada", tipo: "sino" },
    { clave: "libre", etiqueta: "Libre de obstáculos", tipo: "sino" },
  ],
  camara: [
    { clave: "tipo_camara", etiqueta: "Tipo de cámara", tipo: "opcion", opciones: ["Bullet", "Domo", "Ojo de pez (360°)", "PTZ (motorizada)", "Turret", "Caja (box)"] },
    { clave: "megapixeles", etiqueta: "Resolución", tipo: "opcion", opciones: ["1 MP", "2 MP (1080p)", "4 MP", "5 MP", "8 MP (4K)", "12 MP"] },
    { clave: "lente", etiqueta: "Lente", tipo: "opcion", opciones: ["Fija", "Varifocal"] },
    { clave: "vision_nocturna", etiqueta: "Visión nocturna (IR)", tipo: "sino" },
    { clave: "alcance_ir_m", etiqueta: "Alcance IR", tipo: "numero", unidad: "m" },
    { clave: "alcance_identificacion_m", etiqueta: "Alcance de identificación", tipo: "numero", unidad: "m" },
    { clave: "alcance_reconocimiento_m", etiqueta: "Alcance de reconocimiento", tipo: "numero", unidad: "m" },
    { clave: "ia", etiqueta: "Analítica con IA", tipo: "sino" },
    { clave: "lpr", etiqueta: "Lector de matrículas (LPR)", tipo: "sino" },
    { clave: "reconocimiento_facial", etiqueta: "Reconocimiento facial", tipo: "sino" },
  ],
  alarma_emergencia: [
    { clave: "tipo", etiqueta: "Tipo", tipo: "opcion", opciones: ["Sonora", "Visual", "Sonora y visual"] },
    { clave: "activacion", etiqueta: "Activación", tipo: "opcion", opciones: ["Manual", "Automática"] },
    { clave: "fecha_prueba", etiqueta: "Última prueba", tipo: "fecha" },
  ],
};

export type Ficha = Record<string, string | number | boolean | undefined>;

/** Datos comunes de un elemento colocado en el mapa o en el croquis. */
export interface DatosElemento {
  fotos?: FotoRef[];
  /** Sin valor = existente. */
  situacion?: Situacion;
  condicion?: Condicion;
  ficha?: Ficha;
  nota?: string;
}

const MESES_RECARGA = 12;

/** Una cámara de ojo de pez ve alrededor: su cono se abre a 360°. */
export const OJO_DE_PEZ = "Ojo de pez (360°)";

/** Avisos de la ficha: recarga del extintor vencida (más de 12 meses) o elemento en mal estado. */
export function avisosElemento(tipo: TipoSimbolo, d: DatosElemento, hoy: Date): string[] {
  const avisos: string[] = [];
  if (d.condicion === "malo" || d.condicion === "no_funciona") avisos.push(`Estado: ${CONDICION_INFO[d.condicion].etiqueta.toLowerCase()}`);
  const recarga = tipo === "extintor" ? d.ficha?.fecha_recarga : undefined;
  if (typeof recarga === "string" && /^\d{4}-\d{2}-\d{2}$/.test(recarga)) {
    const [a, m, dia] = recarga.split("-").map(Number);
    const vence = new Date(a, m - 1 + MESES_RECARGA, dia);
    if (vence < hoy) avisos.push("Recarga vencida");
  }
  if (tipo === "salida_emergencia" && d.ficha?.libre === false) avisos.push("Salida obstruida");
  return avisos;
}
