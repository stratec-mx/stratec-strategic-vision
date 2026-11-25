// Croquis interior por niveles (Documento 04 §5.2).
//
// Cada nivel es un grafo de muros: los vértices son las esquinas y los muros unen dos vértices.
// Los espacios NO se dibujan a mano: son las caras cerradas del grafo. Cuando los muros cierran
// un recinto, aparece un espacio; si se mueve un muro, cambian los espacios que lo comparten; un
// muro interior divide un espacio y borrar un muro une los dos (conserva el nombre del mayor).
//
// Coordenadas locales en metros: x hacia la derecha, y hacia abajo (como en pantalla).
// Todas las funciones son puras: reciben un nivel y devuelven uno nuevo.

import type { DatosCamara, DatosElemento, TipoSimbolo } from "./simbolos";

export interface P {
  x: number;
  y: number;
}

export interface Vertice extends P {
  id: string;
}

export interface Muro {
  id: string;
  a: string;
  b: string;
  /** Grosor en metros (15 cm de inicio). */
  grosor: number;
  /**
   * Línea divisoria sin muro (pasillos, zonas, cajones de estacionamiento): divide y une
   * espacios igual que un muro, pero no tiene grosor físico ni admite puertas o ventanas.
   */
  virtual?: boolean;
}

export type TipoAbertura = "puerta" | "ventana";

/** Variantes de puerta. Los datos viejos sin subtipo son puertas abatibles. */
export const SUBTIPOS_PUERTA = ["abatible", "doble", "corrediza", "porton_corredizo", "porton_abatible", "cortina"] as const;
export type SubtipoPuerta = (typeof SUBTIPOS_PUERTA)[number];

/** Clase de abertura para el selector: una variante de puerta o una ventana. */
export type ClaseAbertura = SubtipoPuerta | "ventana";
export const CLASES_ABERTURA: readonly ClaseAbertura[] = [...SUBTIPOS_PUERTA, "ventana"];

export const ETIQUETA_ABERTURA: Record<ClaseAbertura, string> = {
  abatible: "Puerta abatible",
  doble: "Puerta de doble hoja",
  corrediza: "Puerta corrediza",
  porton_corredizo: "Portón corredizo",
  porton_abatible: "Portón abatible",
  cortina: "Cortina metálica",
  ventana: "Ventana",
};

/** Ancho típico al colocarla, en metros. */
export const ANCHO_ABERTURA: Record<ClaseAbertura, number> = {
  abatible: 0.9, doble: 1.6, corrediza: 0.9, porton_corredizo: 4, porton_abatible: 4, cortina: 3, ventana: 1.2,
};

export interface Abertura {
  id: string;
  muro: string;
  /** Posición del centro a lo largo del muro: 0 = vértice a, 1 = vértice b. */
  t: number;
  /** Ancho en metros. */
  ancho: number;
  tipo: TipoAbertura;
  /** Solo puertas: variante. Sin dato = abatible. */
  subtipo?: SubtipoPuerta;
  /**
   * Puertas: de qué extremo sale la bisagra (en las corredizas, hacia dónde corre la hoja)
   * y hacia qué lado del muro abre.
   */
  bisagra?: "inicio" | "fin";
  lado?: 1 | -1;
}

export const TIPOS_ESPACIO = [
  "oficina", "departamento", "estacionamiento", "cajon_estacionamiento", "lobby", "bodega", "sanitarios",
  "cuarto_maquinas", "area_publico", "pasillo", "circulacion", "cocina", "otro",
] as const;
export type TipoEspacio = (typeof TIPOS_ESPACIO)[number];

export const TIPO_ESPACIO_ETIQUETA: Record<TipoEspacio, string> = {
  oficina: "Oficina", departamento: "Departamento", estacionamiento: "Estacionamiento",
  cajon_estacionamiento: "Cajón de estacionamiento", lobby: "Lobby",
  bodega: "Bodega", sanitarios: "Sanitarios", cuarto_maquinas: "Cuarto de máquinas", area_publico: "Área de público",
  pasillo: "Pasillo", circulacion: "Circulación (vestíbulo, paso)", cocina: "Cocina", otro: "Otro",
};

export interface Espacio {
  id: string;
  nombre: string;
  tipo: TipoEspacio;
  /** Vértices de la cara, en orden. */
  vertices: string[];
  /** Recién detectado: falta que el usuario le ponga nombre y tipo. */
  pendiente?: boolean;
}

export const TIPOS_ESCALERA = ["recta", "l", "u", "caracol", "rampa", "elevador"] as const;
export type TipoEscalera = (typeof TIPOS_ESCALERA)[number];

export const ETIQUETA_ESCALERA: Record<TipoEscalera, string> = {
  recta: "Escalera recta", l: "Escalera en L", u: "Escalera en U", caracol: "Escalera de caracol", rampa: "Rampa", elevador: "Elevador",
};

export interface Escalera {
  id: string;
  /** Centro del rectángulo. */
  x: number;
  y: number;
  ancho: number;
  largo: number;
  /** Giro en grados, sentido horario (0 = la flecha apunta hacia arriba). */
  giro: number;
  sentido: "sube" | "baja";
  /** Sin dato = recta (datos guardados antes de que hubiera tipos). */
  tipo?: TipoEscalera;
  /** Caracol: diámetro en metros. */
  diametro?: number;
  /** Rampa: pendiente en porcentaje. */
  pendiente?: number;
  /** En L, en U y caracol: dibujada al revés (gira hacia el otro lado). */
  espejo?: boolean;
  /** Nivel al que llega. */
  nivelDestino?: string;
  /** Escalera gemela en el nivel destino. */
  enlace?: string;
}

export interface SimboloCroquis extends DatosElemento {
  id: string;
  tipo: TipoSimbolo;
  x: number;
  y: number;
  camara?: DatosCamara;
}

export interface RutaCroquis {
  id: string;
  puntos: P[];
}

export interface Amarre {
  /** Desplazamiento del croquis respecto al predio, en metros. */
  x: number;
  y: number;
  /** Giro en grados, sentido horario. */
  giro: number;
}

export interface Nivel {
  id: string;
  nombre: string;
  /** Nivel de piso en metros respecto a la planta baja. */
  nivelPiso: number;
  /** Altura de entrepiso en metros. */
  altura: number;
  vertices: Vertice[];
  muros: Muro[];
  aberturas: Abertura[];
  espacios: Espacio[];
  escaleras: Escalera[];
  simbolos: SimboloCroquis[];
  rutas: RutaCroquis[];
  amarre: Amarre;
}

export interface Croquis {
  niveles: Nivel[];
}

/** Tolerancia geométrica: 1 cm. */
export const EPS = 0.01;
export const GROSOR_INICIAL = 0.15;
/** Grosor de cálculo de una línea divisoria (no tiene grosor físico). */
export const GROSOR_VIRTUAL = 0.02;
export const ANCHO_PUERTA = ANCHO_ABERTURA.abatible;
export const ANCHO_VENTANA = ANCHO_ABERTURA.ventana;
const AREA_MINIMA = 0.05;

let serie = 0;
export const nuevoId = (prefijo: string) =>
  `${prefijo}${Date.now().toString(36)}${(serie++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ───────────────────────── Geometría básica ─────────────────────────

export const dist = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);

/** Proyección de p sobre el segmento ab: parámetro t (0..1), punto q y distancia. */
export function proyectar(p: P, a: P, b: P): { t: number; q: P; d: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  const q = { x: a.x + t * dx, y: a.y + t * dy };
  return { t, q, d: dist(p, q) };
}

/** Cruce propio de dos segmentos (no en sus extremos). */
function cruce(a: P, b: P, c: P, d: P): P | null {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  const lr = Math.hypot(r.x, r.y);
  const ls = Math.hypot(s.x, s.y);
  const et = EPS / lr;
  const eu = EPS / ls;
  if (t <= et || t >= 1 - et || u <= eu || u >= 1 - eu) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

/** Área con signo (fórmula del zapato). */
export function areaConSigno(pts: P[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p.x * q.y - q.x * p.y;
  }
  return s / 2;
}

export const superficie = (pts: P[]) => Math.abs(areaConSigno(pts));

export function dentro(p: P, pts: P[]): boolean {
  let adentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) adentro = !adentro;
  }
  return adentro;
}

/** Un punto que cae dentro del polígono, aunque sea cóncavo (por ejemplo, en forma de L). */
export function puntoInterior(pts: P[]): P {
  const a = areaConSigno(pts);
  if (Math.abs(a) > 1e-9) {
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      const f = p.x * q.y - q.x * p.y;
      cx += (p.x + q.x) * f;
      cy += (p.y + q.y) * f;
    }
    const c = { x: cx / (6 * a), y: cy / (6 * a) };
    if (dentro(c, pts)) return c;
  }
  const ys = pts.map((p) => p.y);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  let mejor: P | null = null;
  let ancho = -1;
  for (const f of [0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875]) {
    const y = y0 + (y1 - y0) * f;
    const xs: number[] = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const p = pts[i];
      const q = pts[j];
      if (p.y > y !== q.y > y) xs.push(((q.x - p.x) * (y - p.y)) / (q.y - p.y) + p.x);
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      if (xs[k + 1] - xs[k] > ancho) {
        ancho = xs[k + 1] - xs[k];
        mejor = { x: (xs[k] + xs[k + 1]) / 2, y };
      }
    }
  }
  return mejor ?? pts[0];
}

// ───────────────────────── Consultas sobre el nivel ─────────────────────────

const mapaVertices = (n: Nivel) => new Map(n.vertices.map((v) => [v.id, v]));

export function extremos(n: Nivel, m: Muro): [Vertice, Vertice] {
  const vs = mapaVertices(n);
  return [vs.get(m.a)!, vs.get(m.b)!];
}

export function largoMuro(n: Nivel, m: Muro): number {
  const [a, b] = extremos(n, m);
  return dist(a, b);
}

export function posicionAbertura(n: Nivel, ab: Abertura): P | null {
  const m = n.muros.find((w) => w.id === ab.muro);
  if (!m) return null;
  const [a, b] = extremos(n, m);
  return { x: a.x + (b.x - a.x) * ab.t, y: a.y + (b.y - a.y) * ab.t };
}

export const poligonoEspacio = (n: Nivel, e: Espacio): P[] => {
  const vs = mapaVertices(n);
  return e.vertices.map((id) => vs.get(id)).filter((v): v is Vertice => !!v);
};

export const grado = (n: Nivel, verticeId: string) => n.muros.filter((m) => m.a === verticeId || m.b === verticeId).length;

// ───────────────────────── Limpieza del grafo ─────────────────────────

/** Parte un muro en el vértice dado. Las puertas y ventanas se quedan donde estaban. */
function partirMuro(n: Nivel, muroId: string, verticeId: string): Nivel {
  const m = n.muros.find((w) => w.id === muroId)!;
  const vs = mapaVertices(n);
  const a = vs.get(m.a)!;
  const b = vs.get(m.b)!;
  const v = vs.get(verticeId)!;
  const s = dist(a, v) / dist(a, b);
  const m1: Muro = { ...m, b: verticeId };
  const m2: Muro = { ...m, id: nuevoId("m"), a: verticeId, b: m.b };
  return {
    ...n,
    muros: n.muros.flatMap((w) => (w.id === muroId ? [m1, m2] : [w])),
    aberturas: n.aberturas.map((ab) => {
      if (ab.muro !== muroId) return ab;
      return ab.t < s ? { ...ab, muro: m1.id, t: ab.t / s } : { ...ab, muro: m2.id, t: (ab.t - s) / (1 - s) };
    }),
  };
}

/**
 * Deja el grafo consistente: une vértices encimados, parte muros donde los toca un vértice
 * o donde se cruzan con otro muro, y quita muros repetidos o de largo cero.
 */
export function normalizar(nivel: Nivel): Nivel {
  let n: Nivel = { ...nivel, vertices: [...nivel.vertices], muros: [...nivel.muros], aberturas: [...nivel.aberturas] };
  for (let vuelta = 0; vuelta < 500; vuelta++) {
    let cambio = false;

    // 1. Vértices encimados.
    fuera: for (let i = 0; i < n.vertices.length; i++) {
      for (let j = i + 1; j < n.vertices.length; j++) {
        if (dist(n.vertices[i], n.vertices[j]) < EPS) {
          const queda = n.vertices[i].id;
          const sale = n.vertices[j].id;
          n = {
            ...n,
            vertices: n.vertices.filter((v) => v.id !== sale),
            muros: n.muros.map((m) => ({ ...m, a: m.a === sale ? queda : m.a, b: m.b === sale ? queda : m.b })),
          };
          cambio = true;
          break fuera;
        }
      }
    }
    if (cambio) continue;

    // 2. Un vértice que toca un muro por en medio lo parte.
    const vs = mapaVertices(n);
    fuera2: for (const m of n.muros) {
      const a = vs.get(m.a)!;
      const b = vs.get(m.b)!;
      const l = dist(a, b);
      if (l < EPS) continue;
      for (const v of n.vertices) {
        if (v.id === m.a || v.id === m.b) continue;
        const pr = proyectar(v, a, b);
        if (pr.d < EPS && pr.t * l > EPS && (1 - pr.t) * l > EPS) {
          n = partirMuro(n, m.id, v.id);
          cambio = true;
          break fuera2;
        }
      }
    }
    if (cambio) continue;

    // 3. Muros que se cruzan: se crea la esquina y se parten los dos.
    fuera3: for (let i = 0; i < n.muros.length; i++) {
      for (let j = i + 1; j < n.muros.length; j++) {
        const m1 = n.muros[i];
        const m2 = n.muros[j];
        if (m1.a === m2.a || m1.a === m2.b || m1.b === m2.a || m1.b === m2.b) continue;
        const p = cruce(vs.get(m1.a)!, vs.get(m1.b)!, vs.get(m2.a)!, vs.get(m2.b)!);
        if (p) {
          const v: Vertice = { id: nuevoId("v"), x: p.x, y: p.y };
          n = { ...n, vertices: [...n.vertices, v] };
          n = partirMuro(n, m1.id, v.id);
          n = partirMuro(n, m2.id, v.id);
          cambio = true;
          break fuera3;
        }
      }
    }
    if (!cambio) break;
  }

  // 4. Muros de largo cero o repetidos.
  const vistos = new Map<string, Muro>();
  const reasignar = new Map<string, { muro: string; invertido: boolean }>();
  const muros: Muro[] = [];
  for (const m of n.muros) {
    if (m.a === m.b) continue;
    const clave = [m.a, m.b].sort().join("|");
    const previo = vistos.get(clave);
    if (previo) {
      if (previo.virtual && !m.virtual) {
        // Una línea divisoria encima de un muro físico: se queda el muro.
        muros[muros.indexOf(previo)] = m;
        vistos.set(clave, m);
        reasignar.set(previo.id, { muro: m.id, invertido: previo.a !== m.a });
      } else {
        reasignar.set(m.id, { muro: previo.id, invertido: previo.a !== m.a });
      }
      continue;
    }
    vistos.set(clave, m);
    muros.push(m);
  }
  const ids = new Set(muros.map((m) => m.id));
  const aberturas = n.aberturas
    .map((ab) => {
      const r = reasignar.get(ab.muro);
      return r ? { ...ab, muro: r.muro, t: r.invertido ? 1 - ab.t : ab.t } : ab;
    })
    .filter((ab) => ids.has(ab.muro));
  const usados = new Set(muros.flatMap((m) => [m.a, m.b]));
  return { ...n, muros, aberturas, vertices: n.vertices.filter((v) => usados.has(v.id)) };
}

/** Une dos muros alineados que comparten uno de los vértices indicados (queda un solo muro). */
function fusionarAlineados(nivel: Nivel, candidatos: string[]): Nivel {
  let n = nivel;
  for (let vuelta = 0; vuelta < 200; vuelta++) {
    let cambio = false;
    for (const v of n.vertices.filter((x) => candidatos.includes(x.id))) {
      const ms = n.muros.filter((m) => m.a === v.id || m.b === v.id);
      if (ms.length !== 2 || ms[0].grosor !== ms[1].grosor || !!ms[0].virtual !== !!ms[1].virtual) continue;
      const vs = mapaVertices(n);
      const otro = (m: Muro) => vs.get(m.a === v.id ? m.b : m.a)!;
      const p = otro(ms[0]);
      const q = otro(ms[1]);
      if (proyectar(v, p, q).d > EPS / 2) continue;
      const nuevo: Muro = { ...ms[0], a: p.id, b: q.id };
      const largo = dist(p, q);
      const aberturas = n.aberturas.map((ab) => {
        if (ab.muro !== ms[0].id && ab.muro !== ms[1].id) return ab;
        const pos = posicionAbertura(n, ab)!;
        return { ...ab, muro: nuevo.id, t: largo === 0 ? 0.5 : dist(p, pos) / largo };
      });
      n = {
        ...n,
        vertices: n.vertices.filter((x) => x.id !== v.id),
        muros: [...n.muros.filter((m) => m.id !== ms[0].id && m.id !== ms[1].id), nuevo],
        aberturas,
      };
      cambio = true;
      break;
    }
    if (!cambio) break;
  }
  return n;
}

// ───────────────────────── Detección de espacios ─────────────────────────

export interface Cara {
  vertices: string[];
  area: number;
}

/** Caras cerradas del grafo de muros: cada una es un espacio. */
export function detectarCaras(n: Nivel): Cara[] {
  const vs = mapaVertices(n);
  const vecinos = new Map<string, { id: string; ang: number }[]>();
  for (const m of n.muros) {
    const a = vs.get(m.a);
    const b = vs.get(m.b);
    if (!a || !b) continue;
    if (!vecinos.has(a.id)) vecinos.set(a.id, []);
    if (!vecinos.has(b.id)) vecinos.set(b.id, []);
    vecinos.get(a.id)!.push({ id: b.id, ang: Math.atan2(b.y - a.y, b.x - a.x) });
    vecinos.get(b.id)!.push({ id: a.id, ang: Math.atan2(a.y - b.y, a.x - b.x) });
  }
  for (const lista of vecinos.values()) lista.sort((p, q) => p.ang - q.ang);

  const visitado = new Set<string>();
  const caras: Cara[] = [];
  for (const m of n.muros) {
    for (const [u0, v0] of [[m.a, m.b], [m.b, m.a]]) {
      if (visitado.has(`${u0}>${v0}`)) continue;
      const ciclo: string[] = [];
      let u = u0;
      let v = v0;
      for (let paso = 0; paso < 10000; paso++) {
        visitado.add(`${u}>${v}`);
        ciclo.push(u);
        const lista = vecinos.get(v)!;
        const i = lista.findIndex((x) => x.id === u);
        const w = lista[(i - 1 + lista.length) % lista.length].id;
        u = v;
        v = w;
        if (u === u0 && v === v0) break;
      }
      const area = areaConSigno(ciclo.map((id) => vs.get(id)!));
      if (area > AREA_MINIMA) caras.push({ vertices: ciclo, area });
    }
  }
  return caras;
}

const claveCara = (ids: string[]) => [...new Set(ids)].sort().join("|");

/**
 * Recalcula los espacios después de un cambio y les conserva nombre y tipo:
 * - si la cara tiene las mismas esquinas, es el mismo espacio (se movió un muro);
 * - si un espacio se dividió, el pedazo mayor conserva el nombre y el otro queda pendiente;
 * - si dos espacios se unieron, queda el nombre del mayor.
 */
export function recalcularEspacios(anterior: Nivel, nuevo: Nivel): Espacio[] {
  const caras = detectarCaras(nuevo);
  const vsNuevo = mapaVertices(nuevo);
  const previos = anterior.espacios.map((e) => {
    const pts = poligonoEspacio(anterior, e);
    return { e, pts, area: superficie(pts), interior: pts.length >= 3 ? puntoInterior(pts) : null, clave: claveCara(e.vertices) };
  });
  const resultado: (Espacio | null)[] = caras.map(() => null);
  const usados = new Set<string>();

  // 1. Mismas esquinas.
  caras.forEach((c, i) => {
    const k = claveCara(c.vertices);
    const p = previos.find((x) => x.clave === k && !usados.has(x.e.id));
    if (p) {
      resultado[i] = { ...p.e, vertices: c.vertices };
      usados.add(p.e.id);
    }
  });

  // 2. Por posición: la cara cae dentro del espacio anterior o al revés.
  const pares: { i: number; p: (typeof previos)[number]; areaCara: number }[] = [];
  caras.forEach((c, i) => {
    if (resultado[i]) return;
    const pts = c.vertices.map((id) => vsNuevo.get(id)!);
    const interior = puntoInterior(pts);
    for (const p of previos) {
      if (usados.has(p.e.id) || p.pts.length < 3) continue;
      if (dentro(interior, p.pts) || (p.interior && dentro(p.interior, pts))) pares.push({ i, p, areaCara: c.area });
    }
  });
  pares.sort((x, y) => y.p.area - x.p.area || y.areaCara - x.areaCara);
  for (const par of pares) {
    if (resultado[par.i] || usados.has(par.p.e.id)) continue;
    resultado[par.i] = { ...par.p.e, vertices: caras[par.i].vertices };
    usados.add(par.p.e.id);
  }

  // 3. Espacios nuevos: piden nombre y tipo.
  const nombres = new Set(resultado.filter(Boolean).map((e) => e!.nombre));
  let k = 1;
  return caras.map((c, i) => {
    if (resultado[i]) return resultado[i]!;
    while (nombres.has(`Espacio ${k}`)) k++;
    const nombre = `Espacio ${k}`;
    nombres.add(nombre);
    return { id: nuevoId("e"), nombre, tipo: "otro" as TipoEspacio, vertices: c.vertices, pendiente: true };
  });
}

const conEspacios = (anterior: Nivel, nuevo: Nivel): Nivel => ({ ...nuevo, espacios: recalcularEspacios(anterior, nuevo) });

// ───────────────────────── Operaciones de muros ─────────────────────────

/** Vértice en el punto p: uno existente, uno nuevo sobre un muro (que se parte) o uno suelto. */
function verticeEn(n: Nivel, p: P): [Nivel, string] {
  const cerca = n.vertices.find((v) => dist(v, p) < EPS);
  if (cerca) return [n, cerca.id];
  const v: Vertice = { id: nuevoId("v"), x: p.x, y: p.y };
  return [{ ...n, vertices: [...n.vertices, v] }, v.id];
}

/** Agrega un muro de p a q. Con `virtual`, es una línea divisoria sin muro. */
export function agregarMuro(n: Nivel, p: P, q: P, grosor = GROSOR_INICIAL, virtual = false): Nivel {
  if (dist(p, q) < EPS) return n;
  const [m1, a] = verticeEn(n, p);
  const [m2, b] = verticeEn(m1, q);
  if (a === b) return n;
  const muro: Muro = virtual ? { id: nuevoId("m"), a, b, grosor: GROSOR_VIRTUAL, virtual: true } : { id: nuevoId("m"), a, b, grosor };
  const m3 = { ...m2, muros: [...m2.muros, muro] };
  return conEspacios(n, normalizar(m3));
}

/**
 * Cambia un muro de físico a línea divisoria o al revés. Al volverse línea divisoria pierde
 * sus puertas y ventanas; al volverse físico toma el grosor indicado. Los espacios no cambian.
 */
export function cambiarTipoMuro(n: Nivel, muroId: string, virtual: boolean, grosor = GROSOR_INICIAL): Nivel {
  const muro = n.muros.find((m) => m.id === muroId);
  if (!muro || !!muro.virtual === virtual) return n;
  const nuevo: Muro = virtual
    ? { id: muro.id, a: muro.a, b: muro.b, grosor: GROSOR_VIRTUAL, virtual: true }
    : { id: muro.id, a: muro.a, b: muro.b, grosor: grosor > 0 ? grosor : GROSOR_INICIAL };
  return {
    ...n,
    muros: n.muros.map((m) => (m.id === muroId ? nuevo : m)),
    aberturas: virtual ? n.aberturas.filter((ab) => ab.muro !== muroId) : n.aberturas,
  };
}

export function moverVertice(n: Nivel, id: string, p: P): Nivel {
  const m = { ...n, vertices: n.vertices.map((v) => (v.id === id ? { ...v, x: p.x, y: p.y } : v)) };
  return conEspacios(n, normalizar(m));
}

/**
 * Mueve esquinas sin limpiar el grafo: se usa mientras se arrastra, para que un muro no se
 * parta cada vez que pasa sobre otro. Al soltar se llama a `asentar`.
 */
export function moverVerticesLibre(n: Nivel, cambios: Record<string, P>): Nivel {
  return { ...n, vertices: n.vertices.map((v) => (cambios[v.id] ? { ...v, ...cambios[v.id] } : v)) };
}

/** Limpia el grafo y recalcula los espacios (al terminar un arrastre). */
export const asentar = (n: Nivel): Nivel => conEspacios(n, normalizar(n));

/** Mueve un muro completo; los muros que llegan a sus esquinas se estiran con él. */
export function moverMuro(n: Nivel, muroId: string, dx: number, dy: number): Nivel {
  const muro = n.muros.find((m) => m.id === muroId);
  if (!muro) return n;
  const m = {
    ...n,
    vertices: n.vertices.map((v) => (v.id === muro.a || v.id === muro.b ? { ...v, x: v.x + dx, y: v.y + dy } : v)),
  };
  return conEspacios(n, normalizar(m));
}

/** Cambia el largo de un muro (editar la cota). Se mueve el extremo con menos muros conectados. */
export function fijarLargo(n: Nivel, muroId: string, largo: number): Nivel {
  const muro = n.muros.find((m) => m.id === muroId);
  if (!muro || !(largo > EPS)) return n;
  const [a, b] = extremos(n, muro);
  const actual = dist(a, b);
  if (actual < EPS) return n;
  const [fijo, movil] = grado(n, a.id) < grado(n, b.id) ? [b, a] : [a, b];
  const ux = (movil.x - fijo.x) / actual;
  const uy = (movil.y - fijo.y) / actual;
  return moverVertice(n, movil.id, { x: fijo.x + ux * largo, y: fijo.y + uy * largo });
}

export function cambiarGrosor(n: Nivel, muroId: string, grosor: number): Nivel {
  if (!(grosor > 0)) return n;
  return { ...n, muros: n.muros.map((m) => (m.id === muroId && !m.virtual ? { ...m, grosor } : m)) };
}

/** Borra un muro: sus puertas y ventanas se van con él y, si dos espacios quedan unidos, se funden. */
export function borrarMuro(n: Nivel, muroId: string): Nivel {
  const muro = n.muros.find((w) => w.id === muroId);
  if (!muro) return n;
  let m: Nivel = {
    ...n,
    muros: n.muros.filter((w) => w.id !== muroId),
    aberturas: n.aberturas.filter((ab) => ab.muro !== muroId),
  };
  const usados = new Set(m.muros.flatMap((w) => [w.a, w.b]));
  m = { ...m, vertices: m.vertices.filter((v) => usados.has(v.id)) };
  return conEspacios(n, fusionarAlineados(m, [muro.a, muro.b]));
}

// ───────────────────────── Puertas y ventanas ─────────────────────────

/** Limita la posición para que la abertura quepa completa dentro del muro. */
export function acotarT(n: Nivel, muroId: string, t: number, ancho: number): number {
  const m = n.muros.find((w) => w.id === muroId);
  if (!m) return t;
  const l = largoMuro(n, m);
  const mitad = l > 0 ? Math.min(0.5, ancho / 2 / l) : 0.5;
  return Math.max(mitad, Math.min(1 - mitad, t));
}

/** Variante de una abertura; los datos viejos ("puerta" sin subtipo) son puertas abatibles. */
export const claseAbertura = (ab: Pick<Abertura, "tipo" | "subtipo">): ClaseAbertura =>
  ab.tipo === "ventana" ? "ventana" : ab.subtipo ?? "abatible";

const esMuroFisico = (n: Nivel, muroId: string) => n.muros.some((m) => m.id === muroId && !m.virtual);

/** Ancho que cabe en el muro: el pedido, sin pasar del largo del muro (y no menos de 30 cm). */
function anchoQueCabe(n: Nivel, muroId: string, ancho: number): number {
  const m = n.muros.find((w) => w.id === muroId);
  const l = m ? largoMuro(n, m) : Infinity;
  return Math.max(Math.min(0.3, ancho), Math.min(ancho, l));
}

/**
 * Pone una puerta o ventana en un muro. `clase` acepta el tipo viejo ("puerta" = abatible) o
 * una variante. Las líneas divisorias no admiten aberturas.
 */
export function agregarAbertura(n: Nivel, muroId: string, t: number, clase: TipoAbertura | ClaseAbertura, ancho?: number): Nivel {
  if (!esMuroFisico(n, muroId)) return n;
  const c: ClaseAbertura = clase === "puerta" ? "abatible" : clase;
  // No más ancha que el muro: si no, sobresaldría de él.
  const a = anchoQueCabe(n, muroId, ancho ?? ANCHO_ABERTURA[c]);
  const ab: Abertura =
    c === "ventana"
      ? { id: nuevoId("a"), muro: muroId, t: acotarT(n, muroId, t, a), ancho: a, tipo: "ventana" }
      : { id: nuevoId("a"), muro: muroId, t: acotarT(n, muroId, t, a), ancho: a, tipo: "puerta", subtipo: c, bisagra: "inicio", lado: 1 };
  return { ...n, aberturas: [...n.aberturas, ab] };
}

export function cambiarAbertura(n: Nivel, id: string, cambios: Partial<Omit<Abertura, "id">>): Nivel {
  // No se puede pasar a una línea divisoria.
  if (cambios.muro !== undefined && !esMuroFisico(n, cambios.muro)) return n;
  return {
    ...n,
    aberturas: n.aberturas.map((ab) => {
      if (ab.id !== id) return ab;
      const x = { ...ab, ...cambios };
      if (cambios.ancho !== undefined) x.ancho = anchoQueCabe(n, x.muro, x.ancho);
      return { ...x, t: acotarT(n, x.muro, x.t, x.ancho) };
    }),
  };
}

/**
 * Cambia la variante (puerta abatible, doble, corrediza, portón, cortina o ventana). Toma el
 * ancho típico de la nueva variante, sin pasar del largo del muro.
 */
export function cambiarClaseAbertura(n: Nivel, id: string, clase: ClaseAbertura): Nivel {
  const ab = n.aberturas.find((x) => x.id === id);
  const muro = ab && n.muros.find((m) => m.id === ab.muro);
  if (!ab || !muro || claseAbertura(ab) === clase) return n;
  const ancho = Math.max(0.3, Math.min(ANCHO_ABERTURA[clase], largoMuro(n, muro)));
  const nueva: Abertura =
    clase === "ventana"
      ? { id: ab.id, muro: ab.muro, t: ab.t, ancho, tipo: "ventana" }
      : { id: ab.id, muro: ab.muro, t: ab.t, ancho, tipo: "puerta", subtipo: clase, bisagra: ab.bisagra ?? "inicio", lado: ab.lado ?? 1 };
  return {
    ...n,
    aberturas: n.aberturas.map((x) => (x.id === id ? { ...nueva, t: acotarT(n, nueva.muro, nueva.t, nueva.ancho) } : x)),
  };
}

/**
 * Arrastre de una puerta o ventana: se desliza por su propio muro mientras el puntero esté
 * cerca de él (`tol` en metros). Pasa a otro muro físico en el que quepa completa si el puntero
 * se aleja del suyo, o si ya rebasó el extremo del suyo y el otro queda más cerca (así cruza
 * la unión con el tramo siguiente de un muro partido por una línea divisoria). Si no hay otro
 * muro cerca, sigue deslizándose por el suyo.
 */
export function deslizarAbertura(n: Nivel, id: string, p: P, tol: number): Nivel {
  const ab = n.aberturas.find((x) => x.id === id);
  if (!ab) return n;
  const propio = n.muros.find((m) => m.id === ab.muro);
  const enPropio = propio ? proyectar(p, ...extremos(n, propio)) : null;
  let otro: { muro: Muro; t: number; d: number } | null = null;
  for (const m of n.muros) {
    if (m.virtual || m.id === ab.muro || largoMuro(n, m) + EPS < ab.ancho) continue;
    const pr = proyectar(p, ...extremos(n, m));
    if (pr.d < tol && (!otro || pr.d < otro.d)) otro = { muro: m, t: pr.t, d: pr.d };
  }
  const rebaso = !!enPropio && (enPropio.t <= 0 || enPropio.t >= 1);
  if (enPropio && enPropio.d <= tol && !(rebaso && otro && otro.d < enPropio.d)) return cambiarAbertura(n, id, { t: enPropio.t });
  if (otro) return cambiarAbertura(n, id, { muro: otro.muro.id, t: otro.t });
  return enPropio ? cambiarAbertura(n, id, { t: enPropio.t }) : n;
}

export const borrarAbertura = (n: Nivel, id: string): Nivel => ({ ...n, aberturas: n.aberturas.filter((ab) => ab.id !== id) });

// ───────────────────────── Espacios, símbolos y rutas ─────────────────────────

export function cambiarEspacio(n: Nivel, id: string, cambios: Partial<Pick<Espacio, "nombre" | "tipo">>): Nivel {
  return { ...n, espacios: n.espacios.map((e) => (e.id === id ? { ...e, ...cambios, pendiente: false } : e)) };
}

// ───────────────────────── Niveles y escaleras ─────────────────────────

export function nivelVacio(nombre: string, nivelPiso = 0, altura = 3): Nivel {
  return {
    id: nuevoId("n"), nombre, nivelPiso, altura, vertices: [], muros: [], aberturas: [], espacios: [],
    escaleras: [], simbolos: [], rutas: [], amarre: { x: 0, y: 0, giro: 0 },
  };
}

const cambiarNivel = (c: Croquis, id: string, f: (n: Nivel) => Nivel): Croquis => ({
  ...c,
  niveles: c.niveles.map((n) => (n.id === id ? f(n) : n)),
});

/** Agrega una escalera (y su gemela en el nivel destino). `datos.id` es opcional, para seleccionarla después. */
export function agregarEscalera(c: Croquis, nivelId: string, datos: Omit<Escalera, "id" | "enlace"> & { id?: string }): Croquis {
  const id = datos.id ?? nuevoId("s");
  const destino = datos.nivelDestino && datos.nivelDestino !== nivelId ? c.niveles.find((n) => n.id === datos.nivelDestino) : undefined;
  const gemelaId = destino ? nuevoId("s") : undefined;
  let r = cambiarNivel(c, nivelId, (n) => ({
    ...n,
    escaleras: [...n.escaleras, { ...datos, id, nivelDestino: destino?.id, enlace: gemelaId }],
  }));
  if (destino && gemelaId) {
    r = cambiarNivel(r, destino.id, (n) => ({
      ...n,
      escaleras: [
        ...n.escaleras,
        { ...datos, id: gemelaId, sentido: datos.sentido === "sube" ? "baja" : "sube", nivelDestino: nivelId, enlace: id },
      ],
    }));
  }
  return r;
}

export function borrarEscalera(c: Croquis, nivelId: string, id: string): Croquis {
  const esc = c.niveles.find((n) => n.id === nivelId)?.escaleras.find((s) => s.id === id);
  return {
    ...c,
    niveles: c.niveles.map((n) => ({
      ...n,
      escaleras: n.escaleras.filter((s) => s.id !== id && !(esc?.enlace && s.id === esc.enlace)),
    })),
  };
}

/** Datos que se copian tal cual a la escalera gemela del otro nivel (es la misma escalera física). */
const CAMPOS_GEMELA = ["x", "y", "ancho", "largo", "giro", "tipo", "diametro", "pendiente", "espejo"] as const;

/**
 * Cambia una escalera; la posición, el tamaño, el giro y el tipo se copian a su gemela del
 * otro nivel. El sentido se copia invertido (lo que aquí sube, allá baja).
 */
export function cambiarEscalera(c: Croquis, nivelId: string, id: string, cambios: Partial<Omit<Escalera, "id" | "enlace">>): Croquis {
  const nivel = c.niveles.find((n) => n.id === nivelId);
  const esc = nivel?.escaleras.find((s) => s.id === id);
  if (!esc) return c;
  if (cambios.giro !== undefined) cambios = { ...cambios, giro: normalizarGiro(cambios.giro) };
  if (cambios.nivelDestino !== undefined && cambios.nivelDestino !== esc.nivelDestino) {
    const { nivelDestino, enlace, ...resto } = { ...esc, ...cambios };
    const sinEsta = borrarEscalera(c, nivelId, id);
    return agregarEscalera(sinEsta, nivelId, { ...resto, nivelDestino: nivelDestino || undefined });
  }
  const geom = (s: Escalera): Escalera => {
    const r: Escalera = { ...s };
    for (const k of CAMPOS_GEMELA) if (cambios[k] !== undefined) Object.assign(r, { [k]: cambios[k] });
    return r;
  };
  return {
    ...c,
    niveles: c.niveles.map((n) => ({
      ...n,
      escaleras: n.escaleras.map((s) => {
        if (n.id === nivelId && s.id === id) {
          const x = { ...geom(s), ...(cambios.sentido ? { sentido: cambios.sentido } : {}) };
          return x;
        }
        if (esc.enlace && s.id === esc.enlace) {
          const x = geom(s);
          return cambios.sentido ? { ...x, sentido: cambios.sentido === "sube" ? "baja" : "sube" } : x;
        }
        return s;
      }),
    })),
  };
}

/** "Copiar este nivel": muros, espacios, aberturas, escaleras, símbolos y rutas con identificadores nuevos. */
export function replicarNivel(c: Croquis, nivelId: string, nombre?: string): Croquis {
  const i = c.niveles.findIndex((n) => n.id === nivelId);
  if (i < 0) return c;
  const o = c.niveles[i];
  const vid = new Map(o.vertices.map((v) => [v.id, nuevoId("v")]));
  const mid = new Map(o.muros.map((m) => [m.id, nuevoId("m")]));
  const copia: Nivel = {
    ...o,
    id: nuevoId("n"),
    nombre: nombre ?? `${o.nombre} (copia)`,
    nivelPiso: Math.round((o.nivelPiso + o.altura) * 100) / 100,
    vertices: o.vertices.map((v) => ({ ...v, id: vid.get(v.id)! })),
    muros: o.muros.map((m) => ({ ...m, id: mid.get(m.id)!, a: vid.get(m.a)!, b: vid.get(m.b)! })),
    aberturas: o.aberturas.map((ab) => ({ ...ab, id: nuevoId("a"), muro: mid.get(ab.muro)! })),
    espacios: o.espacios.map((e) => ({ ...e, id: nuevoId("e"), vertices: e.vertices.map((v) => vid.get(v)!) })),
    escaleras: o.escaleras.map((s) => ({ ...s, id: nuevoId("s"), enlace: undefined, nivelDestino: undefined })),
    simbolos: o.simbolos.map((s) => ({ ...s, id: nuevoId("y") })),
    rutas: o.rutas.map((r) => ({ ...r, id: nuevoId("r"), puntos: r.puntos.map((p) => ({ ...p })) })),
    amarre: { ...o.amarre },
  };
  const niveles = [...c.niveles];
  niveles.splice(i + 1, 0, copia);
  return { ...c, niveles };
}

// ───────────────────────── Forma y giro de escaleras ─────────────────────────

/** Giro entre 0 y 360 (sin incluir 360). */
export const normalizarGiro = (g: number) => {
  const r = ((g % 360) + 360) % 360;
  return Math.abs(r - 360) < 1e-9 ? 0 : r;
};

/** Ángulo (0 = arriba, sentido horario) del punto p visto desde c, en grados. */
export const anguloHacia = (c: P, p: P) => normalizarGiro((Math.atan2(p.x - c.x, -(p.y - c.y)) * 180) / Math.PI);

/** Redondea el giro a saltos de `paso` grados, o a grado entero si es libre. */
export const giroConPaso = (g: number, libre: boolean, paso = 15) => normalizarGiro(libre ? Math.round(g) : Math.round(g / paso) * paso);

/** Medidas iniciales al poner una escalera, rampa o elevador de cada tipo. */
export function escaleraInicial(tipo: TipoEscalera): Pick<Escalera, "tipo" | "ancho" | "largo"> & Partial<Pick<Escalera, "diametro" | "pendiente">> {
  switch (tipo) {
    case "l": return { tipo, ancho: 2.4, largo: 3.2 };
    case "u": return { tipo, ancho: 2.4, largo: 3.2 };
    case "caracol": return { tipo, ancho: 1.6, largo: 1.6, diametro: 1.6 };
    case "rampa": return { tipo, ancho: 1.5, largo: 6, pendiente: 8 };
    case "elevador": return { tipo, ancho: 1.8, largo: 1.8 };
    default: return { tipo: "recta", ancho: 1.2, largo: 3 };
  }
}

/** Ancho y largo que ocupa la escalera (en la de caracol, el diámetro). */
export function medidasEscalera(s: Escalera): { ancho: number; largo: number } {
  if ((s.tipo ?? "recta") === "caracol") {
    const d = s.diametro ?? Math.max(s.ancho, s.largo);
    return { ancho: d, largo: d };
  }
  return { ancho: s.ancho, largo: s.largo };
}

export interface TrazoEscalera {
  /** Polígonos cerrados: el contorno, que se rellena y sirve para tocarla. */
  contornos: P[][];
  /** Huellas y líneas interiores. */
  lineas: [P, P][];
  circulos: { c: P; r: number }[];
  /** Recorrido de la flecha; la punta va en el último punto. Vacío en el elevador. */
  flecha: P[];
}

const HUELLA = 0.28;

/**
 * Dibujo de la escalera en su marco local: centro en (0, 0), sin girar, y hacia abajo; el
 * arranque queda abajo y la flecha de "sube" apunta hacia arriba (y negativa). Si baja, la
 * flecha va al revés. Con `espejo`, la L, la U y el caracol giran hacia el otro lado.
 */
export function trazoEscalera(s: Escalera): TrazoEscalera {
  const tipo = s.tipo ?? "recta";
  const { ancho: W, largo: L } = medidasEscalera(s);
  const x0 = -W / 2;
  const x1 = W / 2;
  const y0 = -L / 2;
  const y1 = L / 2;
  const rect = (a: number, b: number, c: number, d: number): P[] => [{ x: a, y: b }, { x: c, y: b }, { x: c, y: d }, { x: a, y: d }];
  const r: TrazoEscalera = { contornos: [], lineas: [], circulos: [], flecha: [] };
  /** Huellas horizontales de y = desde hacia arriba hasta `hasta`, entre xa y xb. */
  const huellasH = (xa: number, xb: number, desde: number, hasta: number) => {
    for (let y = desde - HUELLA; y > hasta + 0.05; y -= HUELLA) r.lineas.push([{ x: xa, y }, { x: xb, y }]);
  };

  if (tipo === "l") {
    const f = Math.min(W, L) / 2; // ancho de cada tramo
    r.contornos.push([{ x: x0, y: y1 }, { x: x0 + f, y: y1 }, { x: x0 + f, y: y0 + f }, { x: x1, y: y0 + f }, { x: x1, y: y0 }, { x: x0, y: y0 }]);
    r.lineas.push([{ x: x0, y: y0 + f }, { x: x0 + f, y: y0 + f }], [{ x: x0 + f, y: y0 }, { x: x0 + f, y: y0 + f }]);
    huellasH(x0, x0 + f, y1, y0 + f);
    for (let x = x0 + f + HUELLA; x < x1 - 0.05; x += HUELLA) r.lineas.push([{ x, y: y0 }, { x, y: y0 + f }]);
    r.flecha = [{ x: x0 + f / 2, y: y1 - 0.25 }, { x: x0 + f / 2, y: y0 + f / 2 }, { x: x1 - 0.25, y: y0 + f / 2 }];
  } else if (tipo === "u") {
    const d = Math.min(W / 2, L / 2); // fondo del descanso
    r.contornos.push(rect(x0, y0, x1, y1));
    r.lineas.push([{ x: x0, y: y0 + d }, { x: x1, y: y0 + d }], [{ x: 0, y: y0 + d }, { x: 0, y: y1 }]);
    huellasH(x0, x1, y1, y0 + d);
    r.flecha = [{ x: -W / 4, y: y1 - 0.25 }, { x: -W / 4, y: y0 + d / 2 }, { x: W / 4, y: y0 + d / 2 }, { x: W / 4, y: y1 - 0.25 }];
  } else if (tipo === "caracol") {
    const R = W / 2;
    const poste = Math.min(0.12, R * 0.15);
    r.contornos.push(Array.from({ length: 36 }, (_, i) => polar({ x: 0, y: 0 }, i * 10, R)));
    r.circulos.push({ c: { x: 0, y: 0 }, r: poste });
    for (let g = 0; g < 360; g += 30) r.lineas.push([polar({ x: 0, y: 0 }, g, poste), polar({ x: 0, y: 0 }, g, R)]);
    // Arranca abajo y da casi una vuelta en sentido horario.
    r.flecha = Array.from({ length: 21 }, (_, i) => polar({ x: 0, y: 0 }, 180 + (300 * i) / 20, R * 0.62));
  } else if (tipo === "rampa") {
    r.contornos.push(rect(x0, y0, x1, y1));
    r.flecha = [{ x: 0, y: y1 - 0.25 }, { x: 0, y: y0 + 0.25 }];
  } else if (tipo === "elevador") {
    r.contornos.push(rect(x0, y0, x1, y1));
    r.lineas.push([{ x: x0, y: y0 }, { x: x1, y: y1 }], [{ x: x1, y: y0 }, { x: x0, y: y1 }]);
  } else {
    r.contornos.push(rect(x0, y0, x1, y1));
    huellasH(x0, x1, y1, y0);
    r.flecha = [{ x: 0, y: y1 - 0.25 }, { x: 0, y: y0 + 0.25 }];
  }

  if (s.sentido === "baja") r.flecha = [...r.flecha].reverse();
  if (s.espejo && (tipo === "l" || tipo === "u" || tipo === "caracol")) {
    const m = (p: P): P => ({ x: -p.x, y: p.y });
    r.contornos = r.contornos.map((c) => c.map(m));
    r.lineas = r.lineas.map(([a, b]) => [m(a), m(b)]);
    r.circulos = r.circulos.map((c) => ({ ...c, c: m(c.c) }));
    r.flecha = r.flecha.map(m);
  }
  return r;
}

/** Pasa un punto del marco local de la escalera al del nivel (gira y traslada). */
export function escaleraAMundo(s: Escalera, p: P): P {
  const g = (s.giro * Math.PI) / 180;
  return { x: s.x + p.x * Math.cos(g) - p.y * Math.sin(g), y: s.y + p.x * Math.sin(g) + p.y * Math.cos(g) };
}

/** Posición de la manija de giro: frente al extremo de llegada, a `sep` metros del borde. */
export function manijaGiro(s: Escalera, sep: number): P {
  return polar(s, s.giro, medidasEscalera(s).largo / 2 + sep);
}

// ───────────────────────── Imán ─────────────────────────

export interface OpcionesIman {
  /** Distancia de atracción en metros (depende del acercamiento). */
  tol: number;
  /** Paso de la cuadrícula en metros. */
  rejilla: number;
  /** Punto de partida del tramo: activa los ángulos de 90° y 45°. */
  origen?: P;
  angulos?: boolean;
  /** Contorno del predio (en coordenadas del croquis). */
  predio?: P[];
}

export type Guia = "vertice" | "muro" | "predio" | "prolongacion" | "rejilla" | "angulo";

export interface ResultadoIman {
  p: P;
  guia?: Guia;
  /** Línea de referencia para dibujar la prolongación. */
  linea?: [P, P];
}

/** Ajusta el punto: se pega a vértices, muros, prolongaciones, cuadrícula y contorno del predio. */
export function iman(n: Nivel, raw: P, op: OpcionesIman): ResultadoIman {
  const vs = mapaVertices(n);
  const segmentos: { a: P; b: P; guia: Guia }[] = n.muros.map((m) => ({ a: vs.get(m.a)!, b: vs.get(m.b)!, guia: "muro" as Guia }));
  const predio = op.predio ?? [];
  predio.forEach((p, i) => segmentos.push({ a: p, b: predio[(i + 1) % predio.length], guia: "predio" }));
  const puntos: { p: P; guia: Guia }[] = [
    ...n.vertices.map((p) => ({ p, guia: "vertice" as Guia })),
    ...predio.map((p) => ({ p, guia: "predio" as Guia })),
  ];

  // 1. Vértices: tienen prioridad.
  let cerca: { p: P; guia: Guia } | null = null;
  for (const v of puntos) if (dist(v.p, raw) < op.tol && (!cerca || dist(v.p, raw) < dist(cerca.p, raw))) cerca = v;
  if (cerca) return { p: { x: cerca.p.x, y: cerca.p.y }, guia: cerca.guia };

  // 2. Con punto de partida: ángulo de 45° en 45° y largo redondeado a 5 cm.
  if (op.origen && op.angulos !== false) {
    const o = op.origen;
    const ang = Math.atan2(raw.y - o.y, raw.x - o.x);
    const paso = Math.PI / 4;
    const a = Math.round(ang / paso) * paso;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    let d = (raw.x - o.x) * ux + (raw.y - o.y) * uy;
    d = Math.round(d / 0.05) * 0.05;
    let p = { x: o.x + ux * d, y: o.y + uy * d };
    // Se pega a un muro que cruza la dirección.
    for (const s of segmentos) {
      const sx = s.b.x - s.a.x;
      const sy = s.b.y - s.a.y;
      const den = ux * sy - uy * sx;
      if (Math.abs(den) < 1e-9) continue;
      const tRay = ((s.a.x - o.x) * sy - (s.a.y - o.y) * sx) / den;
      const tSeg = ((s.a.x - o.x) * uy - (s.a.y - o.y) * ux) / den;
      if (tSeg < -1e-9 || tSeg > 1 + 1e-9 || tRay <= EPS) continue;
      const q = { x: o.x + ux * tRay, y: o.y + uy * tRay };
      if (dist(q, p) < op.tol) return { p: q, guia: s.guia };
    }
    // Prolongación: alinea con la x o la y de otra esquina.
    for (const v of puntos) {
      if (Math.abs(ux) > 1e-6 && Math.abs(uy) > 1e-6) break; // solo en tramos rectos
      if (Math.abs(ux) > 1e-6 && Math.abs(p.x - v.p.x) < op.tol) {
        p = { x: v.p.x, y: p.y };
        return { p, guia: "prolongacion", linea: [v.p, p] };
      }
      if (Math.abs(uy) > 1e-6 && Math.abs(p.y - v.p.y) < op.tol) {
        p = { x: p.x, y: v.p.y };
        return { p, guia: "prolongacion", linea: [v.p, p] };
      }
    }
    return { p, guia: "angulo" };
  }

  // 3. Sin punto de partida: sobre un muro o el predio.
  let mejor: { q: P; d: number; guia: Guia } | null = null;
  for (const s of segmentos) {
    const pr = proyectar(raw, s.a, s.b);
    if (pr.d < op.tol && (!mejor || pr.d < mejor.d)) mejor = { q: pr.q, d: pr.d, guia: s.guia };
  }
  if (mejor) return { p: mejor.q, guia: mejor.guia };

  // 4. Prolongación de esquinas existentes, luego cuadrícula.
  let p = { x: Math.round(raw.x / op.rejilla) * op.rejilla, y: Math.round(raw.y / op.rejilla) * op.rejilla };
  let linea: [P, P] | undefined;
  for (const v of puntos) {
    if (Math.abs(raw.x - v.p.x) < op.tol) {
      p = { ...p, x: v.p.x };
      linea = [v.p, p];
    }
    if (Math.abs(raw.y - v.p.y) < op.tol) {
      p = { ...p, y: v.p.y };
      linea = [v.p, p];
    }
  }
  return linea ? { p, guia: "prolongacion", linea } : { p, guia: "rejilla" };
}

/** Muro más cercano a un punto (para colocar puertas y ventanas: con `soloFisicos`, sin líneas divisorias). */
export function muroCercano(n: Nivel, p: P, tol: number, op?: { soloFisicos?: boolean }): { muro: Muro; t: number; d: number } | null {
  const vs = mapaVertices(n);
  let mejor: { muro: Muro; t: number; d: number } | null = null;
  for (const m of n.muros) {
    if (op?.soloFisicos && m.virtual) continue;
    const pr = proyectar(p, vs.get(m.a)!, vs.get(m.b)!);
    if (pr.d < tol && (!mejor || pr.d < mejor.d)) mejor = { muro: m, t: pr.t, d: pr.d };
  }
  return mejor;
}

// ───────────────────────── Amarre al predio ─────────────────────────

/** Pasa un punto del marco del predio al marco del croquis (inverso del amarre). */
export function predioACroquis(p: P, am: Amarre): P {
  const g = (-am.giro * Math.PI) / 180;
  const x = p.x - am.x;
  const y = p.y - am.y;
  return { x: x * Math.cos(g) - y * Math.sin(g), y: x * Math.sin(g) + y * Math.cos(g) };
}

/** ¿Alguna esquina del nivel queda fuera del predio? (con 10 cm de holgura) */
export function seSaleDelPredio(n: Nivel, predio: P[]): boolean {
  if (predio.length < 3) return false;
  return n.vertices.some((v) => {
    if (dentro(v, predio)) return false;
    return !predio.some((p, i) => proyectar(v, p, predio[(i + 1) % predio.length]).d < 0.1);
  });
}

// ───────────────────────── Cámaras en el croquis ─────────────────────────

/** Punto a θ grados (0 = arriba, sentido horario) y r metros de c. */
export const polar = (c: P, grados: number, r: number): P => {
  const a = (grados * Math.PI) / 180;
  return { x: c.x + Math.sin(a) * r, y: c.y - Math.cos(a) * r };
};

/** Trazo SVG del cono de visión de una cámara en el croquis. */
export function conoLocal(c: P, direccion: number, angulo: number, alcance: number): string {
  const pasos = 18;
  const ini = direccion - angulo / 2;
  const pts = Array.from({ length: pasos + 1 }, (_, i) => polar(c, ini + (angulo * i) / pasos, alcance));
  return `M${c.x} ${c.y} ${pts.map((p) => `L${p.x} ${p.y}`).join(" ")} Z`;
}
