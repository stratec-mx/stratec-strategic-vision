// Catálogo de símbolos del prototipo, compartido por el mapa exterior y el croquis interior
// (Documento 04 §5, F-05 y C-06). Los códigos son los de plan_feature_types (Documento 04 §13, D-P5).

export const TIPOS_SIMBOLO = [
  "extintor", "botiquin", "hidrante", "salida_emergencia", "alarma_emergencia", "punto_reunion",
  "camara", "sensor_intrusion", "control_acceso",
] as const;
export type TipoSimbolo = (typeof TIPOS_SIMBOLO)[number];

export interface DefSimbolo {
  tipo: TipoSimbolo;
  etiqueta: string;
  /** Letra o signo corto que va dentro del ícono. */
  glifo: string;
  color: string;
  /** Información sensible (Documento 04, regla 5 y D-P5): no la ve el observador comercial ni sale en el Programa Interno. */
  sensible?: boolean;
}

export const SIMBOLOS: Record<TipoSimbolo, DefSimbolo> = {
  extintor: { tipo: "extintor", etiqueta: "Extintor", glifo: "E", color: "#C62828" },
  botiquin: { tipo: "botiquin", etiqueta: "Botiquín", glifo: "+", color: "#1B7F3B" },
  hidrante: { tipo: "hidrante", etiqueta: "Hidrante", glifo: "H", color: "#C62828" },
  salida_emergencia: { tipo: "salida_emergencia", etiqueta: "Salida de emergencia", glifo: "S", color: "#1B7F3B" },
  alarma_emergencia: { tipo: "alarma_emergencia", etiqueta: "Alarma de emergencia", glifo: "A", color: "#C62828" },
  punto_reunion: { tipo: "punto_reunion", etiqueta: "Punto de reunión", glifo: "PR", color: "#1B7F3B" },
  camara: { tipo: "camara", etiqueta: "Cámara", glifo: "C", color: "#1D4ED8", sensible: true },
  sensor_intrusion: { tipo: "sensor_intrusion", etiqueta: "Sensor de intrusión", glifo: "SI", color: "#5B21B6", sensible: true },
  control_acceso: { tipo: "control_acceso", etiqueta: "Control de acceso", glifo: "CA", color: "#5B21B6", sensible: true },
};

/** Códigos anteriores del prototipo (antes de D-P5), para leer lo ya capturado en el navegador. */
const CODIGOS_ANTERIORES: Record<string, TipoSimbolo> = { salida: "salida_emergencia", alarma: "alarma_emergencia" };

/** Normaliza un código de símbolo; devuelve null si no se reconoce. */
export function tipoSimbolo(codigo: string): TipoSimbolo | null {
  if ((TIPOS_SIMBOLO as readonly string[]).includes(codigo)) return codigo as TipoSimbolo;
  return CODIGOS_ANTERIORES[codigo] ?? null;
}

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
export const FICHAS: Partial<Record<TipoSimbolo, Campo[]>> = {
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
  alarma_emergencia: [
    { clave: "tipo", etiqueta: "Tipo", tipo: "opcion", opciones: ["Sonora", "Visual", "Sonora y visual"] },
    { clave: "activacion", etiqueta: "Activación", tipo: "opcion", opciones: ["Manual", "Automática"] },
    { clave: "fecha_prueba", etiqueta: "Última prueba", tipo: "fecha" },
  ],
};

export type Ficha = Record<string, string | number | boolean | undefined>;

/** Datos comunes de un elemento colocado en el mapa o en el croquis. */
export interface DatosElemento {
  condicion?: Condicion;
  ficha?: Ficha;
  nota?: string;
}

const MESES_RECARGA = 12;

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
