// Catálogo de símbolos del prototipo, compartido por el mapa exterior y el croquis interior
// (Documento 04 §5, F-05 y C-06). En producción sale de plan_feature_types (C-11).

export const TIPOS_SIMBOLO = ["extintor", "salida", "punto_reunion", "botiquin", "alarma", "camara"] as const;
export type TipoSimbolo = (typeof TIPOS_SIMBOLO)[number];

export interface DefSimbolo {
  tipo: TipoSimbolo;
  etiqueta: string;
  /** Letra o signo corto que va dentro del ícono. */
  glifo: string;
  color: string;
  /** Información sensible (Documento 04, regla 5): solo la ven los miembros del proyecto. */
  sensible?: boolean;
}

export const SIMBOLOS: Record<TipoSimbolo, DefSimbolo> = {
  extintor: { tipo: "extintor", etiqueta: "Extintor", glifo: "E", color: "#C62828" },
  salida: { tipo: "salida", etiqueta: "Salida de emergencia", glifo: "S", color: "#1B7F3B" },
  punto_reunion: { tipo: "punto_reunion", etiqueta: "Punto de reunión", glifo: "PR", color: "#1B7F3B" },
  botiquin: { tipo: "botiquin", etiqueta: "Botiquín", glifo: "+", color: "#1B7F3B" },
  alarma: { tipo: "alarma", etiqueta: "Alarma", glifo: "A", color: "#C62828" },
  camara: { tipo: "camara", etiqueta: "Cámara", glifo: "C", color: "#1D4ED8", sensible: true },
};

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
