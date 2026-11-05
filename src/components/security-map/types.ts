// Tipos y configuración del mapa de seguridad compartido.
// Se usa tanto en el diagnóstico público (el cliente marca vulnerabilidades)
// como en la inspección interna (levantamiento técnico del predio).

export type MarkerKind =
  | "vulnerabilidad"
  | "acceso"
  | "punto_ciego"
  | "camara"
  | "perimetro"
  | "critico";

export interface SecurityMarker {
  id: string;
  lat: number;
  lng: number;
  kind: MarkerKind;
  note?: string;
}

export interface MarkerKindConfig {
  kind: MarkerKind;
  label: string;
  /** Color hex del pin. */
  color: string;
  /** Descripción breve para el cliente. */
  hint?: string;
}

// Paleta por defecto — pensada para que un cliente no técnico la entienda.
export const DEFAULT_MARKER_KINDS: MarkerKindConfig[] = [
  { kind: "vulnerabilidad", label: "Vulnerabilidad", color: "#DC2626", hint: "Punto débil o expuesto" },
  { kind: "acceso",         label: "Acceso / entrada", color: "#C4A04A", hint: "Puertas, portones, ventanas" },
  { kind: "punto_ciego",    label: "Punto ciego",      color: "#EA580C", hint: "Zona sin visibilidad o mal iluminada" },
  { kind: "critico",        label: "Zona crítica",     color: "#7F1D1D", hint: "Lo más importante a proteger" },
];

// Paleta para la inspección técnica interna (levantamiento de equipo).
export const INSPECTION_MARKER_KINDS: MarkerKindConfig[] = [
  { kind: "camara",         label: "Cámara",           color: "#2563EB", hint: "Punto de videovigilancia propuesto" },
  { kind: "acceso",         label: "Control de acceso",color: "#C4A04A", hint: "Lector, cerradura, barrera" },
  { kind: "punto_ciego",    label: "Punto ciego",      color: "#EA580C", hint: "Requiere cobertura" },
  { kind: "vulnerabilidad", label: "Vulnerabilidad",   color: "#DC2626", hint: "Riesgo detectado" },
  { kind: "critico",        label: "Zona crítica",     color: "#7F1D1D", hint: "Activo prioritario" },
  { kind: "perimetro",      label: "Perímetro",        color: "#64748B", hint: "Límite del predio" },
];

export const kindColor = (kinds: MarkerKindConfig[], k: MarkerKind) =>
  kinds.find((c) => c.kind === k)?.color ?? "#DC2626";

export const kindLabel = (kinds: MarkerKindConfig[], k: MarkerKind) =>
  kinds.find((c) => c.kind === k)?.label ?? k;
