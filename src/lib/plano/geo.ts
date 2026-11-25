// Cálculos geográficos del módulo Inmuebles y plano (Documento 04 de M-DESR).
// Todo en WGS84 (longitud, latitud). Las medidas son aproximadas: en producción
// las calcula PostGIS; aquí sirven para el prototipo y para mostrar en pantalla.

export type LngLat = [number, number];

const R = 6378137; // radio ecuatorial WGS84, el mismo que usa Turf para el área
const rad = (g: number) => (g * Math.PI) / 180;
const grados = (r: number) => (r * 180) / Math.PI;

/** Distancia en metros entre dos puntos (haversine). */
export function distancia(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Área en m² de un anillo (sin repetir el primer punto al final). Fórmula esférica de Turf. */
export function area(anillo: LngLat[]): number {
  const n = anillo.length;
  if (n < 3) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = anillo[i];
    const p2 = anillo[(i + 1) % n];
    const p3 = anillo[(i + 2) % n];
    total += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
  }
  return Math.abs((total * R * R) / 2);
}

/** Perímetro en metros de un anillo cerrado. */
export function perimetro(anillo: LngLat[]): number {
  if (anillo.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < anillo.length; i++) total += distancia(anillo[i], anillo[(i + 1) % anillo.length]);
  return anillo.length === 2 ? total / 2 : total;
}

/** Largo en metros de una línea abierta (por ejemplo, una ruta de evacuación). */
export function largoLinea(linea: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < linea.length; i++) total += distancia(linea[i - 1], linea[i]);
  return total;
}

/** Rumbo inicial de a hacia b, en grados (0 = norte, 90 = oriente). */
export function rumbo(a: LngLat, b: LngLat): number {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return (grados(Math.atan2(y, x)) + 360) % 360;
}

/** Punto a cierta distancia (m) y rumbo (grados) desde un origen. */
export function destino(origen: LngLat, metros: number, rumboGrados: number): LngLat {
  const d = metros / 6371008.8;
  const th = rad(rumboGrados);
  const la1 = rad(origen[1]);
  const lo1 = rad(origen[0]);
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(th));
  const lo2 = lo1 + Math.atan2(Math.sin(th) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return [grados(lo2), grados(la2)];
}

/**
 * Cono de visión de una cámara como polígono cerrado (GeoJSON).
 * direccion: rumbo del centro del cono; angulo: apertura total; alcance en metros.
 */
export function cono(centro: LngLat, direccion: number, angulo: number, alcance: number, pasos = 24): LngLat[] {
  const abre = Math.max(1, Math.min(360, angulo));
  const puntos: LngLat[] = abre >= 360 ? [] : [centro];
  const inicio = direccion - abre / 2;
  for (let i = 0; i <= pasos; i++) puntos.push(destino(centro, alcance, inicio + (abre * i) / pasos));
  puntos.push(puntos[0]);
  return puntos;
}

export const ORIENTACIONES = ["norte", "noreste", "oriente", "sureste", "sur", "suroeste", "poniente", "noroeste"] as const;
export type Orientacion = (typeof ORIENTACIONES)[number];

export const ORIENTACION_ETIQUETA: Record<Orientacion, string> = {
  norte: "Norte", noreste: "Noreste", oriente: "Oriente", sureste: "Sureste",
  sur: "Sur", suroeste: "Suroeste", poniente: "Poniente", noroeste: "Noroeste",
};

export const ORIENTACION_CORTA: Record<Orientacion, string> = {
  norte: "N", noreste: "NE", oriente: "O", sureste: "SE", sur: "S", suroeste: "SO", poniente: "P", noroeste: "NO",
};

/** Convierte un rumbo a una de las 8 orientaciones. */
export function orientacionDeRumbo(r: number): Orientacion {
  const i = Math.round((((r % 360) + 360) % 360) / 45) % 8;
  return ORIENTACIONES[i];
}

/** Área con signo en el plano lng/lat: positiva si el anillo va contra las manecillas del reloj. */
function areaConSigno(anillo: LngLat[]): number {
  let s = 0;
  for (let i = 0; i < anillo.length; i++) {
    const [x1, y1] = anillo[i];
    const [x2, y2] = anillo[(i + 1) % anillo.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

export interface Lado {
  indice: number;
  desde: LngLat;
  hasta: LngLat;
  largo: number;
  medio: LngLat;
  /** Rumbo hacia afuera del predio (perpendicular al lado). */
  rumboExterior: number;
  orientacion: Orientacion;
}

/** Lados del predio con su largo y la orientación hacia la que da cada uno (su colindancia). */
export function lados(anillo: LngLat[]): Lado[] {
  if (anillo.length < 3) return [];
  const antihorario = areaConSigno(anillo) > 0;
  return anillo.map((desde, i) => {
    const hasta = anillo[(i + 1) % anillo.length];
    const r = rumbo(desde, hasta);
    // Recorrido antihorario: el interior queda a la izquierda y el exterior a la derecha (+90°).
    const rumboExterior = (r + (antihorario ? 90 : 270)) % 360;
    return {
      indice: i,
      desde,
      hasta,
      largo: distancia(desde, hasta),
      medio: [(desde[0] + hasta[0]) / 2, (desde[1] + hasta[1]) / 2],
      rumboExterior,
      orientacion: orientacionDeRumbo(rumboExterior),
    };
  });
}

/** Proyección local en metros alrededor de un origen: x hacia el oriente, y hacia el sur (como en pantalla). */
export function aLocal(origen: LngLat, p: LngLat): { x: number; y: number } {
  const kx = (Math.PI / 180) * 6371008.8 * Math.cos(rad(origen[1]));
  const ky = (Math.PI / 180) * 6371008.8;
  return { x: (p[0] - origen[0]) * kx, y: -(p[1] - origen[1]) * ky };
}

export function deLocal(origen: LngLat, p: { x: number; y: number }): LngLat {
  const kx = (Math.PI / 180) * 6371008.8 * Math.cos(rad(origen[1]));
  const ky = (Math.PI / 180) * 6371008.8;
  return [origen[0] + p.x / kx, origen[1] - p.y / ky];
}

/**
 * Lee coordenadas pegadas por el usuario: "18.9186, -99.2342", "18.9186 -99.2342"
 * o un enlace de mapas con "@18.9186,-99.2342" o "q=18.9186,-99.2342".
 * Devuelve [lng, lat] o null si no reconoce coordenadas válidas.
 */
export function leerCoordenadas(texto: string): LngLat | null {
  const t = texto.trim();
  const enlace = t.match(/[@=](-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/);
  const simple = t.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  const m = enlace ?? simple;
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}

/** Formatea metros y m² para pantalla, siempre con "≈" porque son aproximados. */
export const fmtM = (m: number) => `≈ ${m.toLocaleString("es-MX", { maximumFractionDigits: m < 100 ? 1 : 0 })} m`;
export const fmtM2 = (m2: number) => `≈ ${m2.toLocaleString("es-MX", { maximumFractionDigits: m2 < 100 ? 1 : 0 })} m²`;

export const LEYENDA_MEDIDAS = "Medidas aproximadas obtenidas en campo; no sustituyen un levantamiento topográfico.";
