// Datos del prototipo del módulo Inmuebles y plano.
//
// PROTOTIPO: todo se guarda solo en este navegador (localStorage) y con inmuebles ficticios.
// Nada se escribe en la base de producción. Las tablas definitivas (sites, site_plans,
// plan_features, building_levels, floor_plan_elements) van en el script 12 (Documento 04 §6).

import { destino, type LngLat, type Orientacion } from "./geo";
import { agregarMuro, cambiarEspacio, nivelVacio, nuevoId, type Croquis, type Nivel, type P } from "./croquis";
import type { FotoRef } from "./fotos";
import { ejemploTemixco, elementosTecnologiaBodega, ID_EJEMPLO_TEMIXCO } from "./ejemplos";
import { registrarPersonalizados, tipoSimbolo, type DatosCamara, type DatosElemento, type SimboloPersonal, type TipoSimbolo } from "./simbolos";

export const ESTADOS = ["prospecto", "en_curso", "entregado", "suspendido"] as const;
export type EstadoProyecto = (typeof ESTADOS)[number];

export const ESTADO_INFO: Record<EstadoProyecto, { etiqueta: string; color: string }> = {
  prospecto: { etiqueta: "Prospecto", color: "#B7791F" },
  en_curso: { etiqueta: "En curso", color: "#1D4ED8" },
  entregado: { etiqueta: "Entregado", color: "#287A59" },
  suspendido: { etiqueta: "Suspendido", color: "#667085" },
};

export const TIPOS_COLINDANCIA = ["calle", "casa_habitacion", "comercio", "baldio", "industria", "escuela", "area_verde", "otro"] as const;
export type TipoColindancia = (typeof TIPOS_COLINDANCIA)[number];
export const TIPO_COLINDANCIA_ETIQUETA: Record<TipoColindancia, string> = {
  calle: "Calle", casa_habitacion: "Casa habitación", comercio: "Comercio", baldio: "Baldío",
  industria: "Industria", escuela: "Escuela", area_verde: "Área verde", otro: "Otro",
};

/** Origen de la medida (site_plans.measurement_method). */
export type MetodoMedicion = "gps_campo" | "levantamiento_campo" | "plano_cliente";
export const METODO_ETIQUETA: Record<MetodoMedicion, string> = {
  gps_campo: "Recorrido GPS en campo",
  levantamiento_campo: "Vértices colocados en campo",
  plano_cliente: "Plano del cliente",
};

export interface VerticePredio {
  lng: number;
  lat: number;
  /** Precisión que reportó el GPS, en metros (solo si el vértice salió del GPS). */
  precision?: number;
  origen: "gps" | "manual";
}

export interface Colindancia {
  orientacion?: Orientacion; // vacío = la calculada por el sistema
  tipo?: TipoColindancia;
  descripcion?: string;
}

export interface ElementoMapa extends DatosElemento {
  id: string;
  tipo: TipoSimbolo;
  lng: number;
  lat: number;
  camara?: DatosCamara;
}

export const SEVERIDADES = ["baja", "media", "alta", "critica"] as const;
export type Severidad = (typeof SEVERIDADES)[number];
export const SEVERIDAD_INFO: Record<Severidad, { etiqueta: string; color: string }> = {
  baja: { etiqueta: "Baja", color: "#287A59" },
  media: { etiqueta: "Media", color: "#B7791F" },
  alta: { etiqueta: "Alta", color: "#C2410C" },
  critica: { etiqueta: "Crítica", color: "#B42318" },
};

/**
 * Hallazgo capturado en campo (Documento 04 F-09 y §13 D-P7): rápido (foto, título y ubicación);
 * se completa después en cualquier equipo. Queda "propuesta" hasta que el elaborador lo revisa.
 */
export interface Hallazgo {
  id: string;
  titulo: string;
  fecha: string;
  /** Elemento del mapa o del croquis al que se liga (puede haber varios hallazgos por elemento). */
  elementoId?: string;
  lng?: number;
  lat?: number;
  fotos: FotoRef[];
  estado: "propuesta" | "revisado";
  severidad?: Severidad;
  descripcion?: string;
}

export interface RutaMapa {
  id: string;
  coords: LngLat[];
}

export interface Inmueble {
  id: string;
  nombre: string;
  municipio: string;
  estado: EstadoProyecto;
  /** Cliente existente de la tabla clients (solo lectura). */
  clienteId?: string;
  clienteNombre?: string;
  ubicacion?: { lng: number; lat: number; precision?: number; fecha: string };
  perimetro: VerticePredio[];
  metodo: MetodoMedicion;
  colindancias: Colindancia[];
  elementos: ElementoMapa[];
  rutas: RutaMapa[];
  croquis: Croquis;
  hallazgos?: Hallazgo[];
  actualizado: string;
}

export interface Datos {
  version: 1;
  inmuebles: Inmueble[];
  /** Elementos que creó el usuario. */
  catalogo?: SimboloPersonal[];
  /** Ya se agregó una vez el ejemplo del ayuntamiento (si el usuario lo borra, no vuelve). */
  ejemploTemixco?: boolean;
}

const CLAVE = "stratec.plano.prototipo.v1";

// ───────────────────────── Inmuebles ficticios ─────────────────────────

const ahora = () => new Date().toISOString();

function rect(o: LngLat, ancho: number, fondo: number, giro = 0): VerticePredio[] {
  const a = o;
  const b = destino(a, ancho, 90 + giro);
  const c = destino(b, fondo, giro);
  const d = destino(a, fondo, giro);
  return [a, b, c, d].map(([lng, lat]) => ({ lng, lat, origen: "manual" as const }));
}

function croquisDemo(): Croquis {
  // Planta baja de una bodega ficticia de 24 × 14 m con oficinas al frente.
  let pb: Nivel = nivelVacio("Planta baja", 0, 4);
  const pts: P[] = [{ x: 3, y: 3 }, { x: 27, y: 3 }, { x: 27, y: 17 }, { x: 3, y: 17 }];
  for (let i = 0; i < 4; i++) pb = agregarMuro(pb, pts[i], pts[(i + 1) % 4]);
  pb = agregarMuro(pb, { x: 3, y: 8 }, { x: 15, y: 8 });
  pb = agregarMuro(pb, { x: 15, y: 3 }, { x: 15, y: 8 });
  pb = agregarMuro(pb, { x: 9, y: 3 }, { x: 9, y: 8 });
  const nombres: [number, string, Nivel["espacios"][number]["tipo"]][] = [];
  for (const e of pb.espacios) {
    const vs = e.vertices.map((id) => pb.vertices.find((v) => v.id === id)!);
    const xs = vs.map((v) => v.x);
    const max = Math.max(...xs);
    const min = Math.min(...xs);
    if (max <= 9.01) nombres.push([0, "Recepción", "lobby"]);
    else if (max <= 15.01 && min >= 8.99) nombres.push([0, "Oficina administrativa", "oficina"]);
    else nombres.push([0, "Nave de almacén", "bodega"]);
  }
  pb.espacios.forEach((e, i) => (pb = cambiarEspacio(pb, e.id, { nombre: nombres[i][1], tipo: nombres[i][2] })));
  return { niveles: [pb] };
}

export function datosIniciales(): Datos {
  const bodega: Inmueble = {
    id: nuevoId("i"),
    nombre: "Bodega de prueba (ficticia)",
    municipio: "Jiutepec",
    estado: "en_curso",
    clienteNombre: "Cliente ficticio",
    ubicacion: { lng: -99.1905, lat: 18.8935, fecha: ahora() },
    perimetro: rect([-99.19066, 18.89335], 30, 20, 0),
    metodo: "levantamiento_campo",
    colindancias: [{ tipo: "calle", descripcion: "Calle de acceso" }, {}, {}, {}],
    elementos: elementosTecnologiaBodega([-99.19066, 18.89335]),
    rutas: [],
    croquis: croquisDemo(),
    actualizado: ahora(),
  };
  const otro = (nombre: string, municipio: string, estado: EstadoProyecto, lng: number, lat: number): Inmueble => ({
    id: nuevoId("i"), nombre, municipio, estado, clienteNombre: "Cliente ficticio",
    ubicacion: { lng, lat, fecha: ahora() }, perimetro: [], metodo: "levantamiento_campo",
    colindancias: [], elementos: [], rutas: [], croquis: { niveles: [nivelVacio("Planta baja")] }, actualizado: ahora(),
  });
  return {
    version: 1,
    ejemploTemixco: true,
    inmuebles: [
      ejemploTemixco(),
      bodega,
      otro("Oficinas de prueba (ficticias)", "Cuernavaca", "entregado", -99.2342, 18.9214),
      otro("Escuela de prueba (ficticia)", "Cuautla", "prospecto", -98.9535, 18.8121),
      otro("Salón de eventos de prueba (ficticio)", "Temixco", "en_curso", -99.2295, 18.8547),
    ],
  };
}

export function nuevoInmueble(centro: LngLat): Inmueble {
  return {
    id: nuevoId("i"), nombre: "Inmueble nuevo", municipio: "", estado: "prospecto",
    ubicacion: { lng: centro[0], lat: centro[1], fecha: ahora() }, perimetro: [], metodo: "levantamiento_campo",
    colindancias: [], elementos: [], rutas: [], croquis: { niveles: [nivelVacio("Planta baja")] }, actualizado: ahora(),
  };
}

/** Punto que representa al inmueble en la cartera: el centro del predio o su ubicación. */
export const puntoInmueble = (inm: Inmueble): LngLat | null => {
  if (inm.perimetro.length >= 3) {
    const n = inm.perimetro.length;
    return [inm.perimetro.reduce((s, v) => s + v.lng, 0) / n, inm.perimetro.reduce((s, v) => s + v.lat, 0) / n];
  }
  return inm.ubicacion ? [inm.ubicacion.lng, inm.ubicacion.lat] : null;
};

// ───────────────────────── Guardado en el navegador ─────────────────────────

/**
 * Pone al día lo guardado por versiones anteriores del prototipo: los códigos `salida` y `alarma`
 * pasan a `salida_emergencia` y `alarma_emergencia` (D-P5); se descartan los símbolos que ya no existen.
 */
export function normalizarDatos(d: Datos): Datos {
  return {
    ...d,
    inmuebles: d.inmuebles.map((i) => ({
      ...i,
      elementos: (i.elementos ?? []).flatMap((e) => {
        const tipo = tipoSimbolo(e.tipo);
        return tipo ? [{ ...e, tipo }] : [];
      }),
      croquis: {
        ...i.croquis,
        niveles: (i.croquis?.niveles ?? []).map((n) => ({
          ...n,
          simbolos: (n.simbolos ?? []).flatMap((s) => {
            const tipo = tipoSimbolo(s.tipo);
            return tipo ? [{ ...s, tipo }] : [];
          }),
        })),
      },
    })),
  };
}

export function cargar(): Datos {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) {
      const d = JSON.parse(crudo) as Datos;
      if (d && d.version === 1 && Array.isArray(d.inmuebles)) {
        registrarPersonalizados(d.catalogo ?? []);
        const n = normalizarDatos(d);
        // El ejemplo del ayuntamiento se agrega una vez a quien ya tenía datos guardados.
        if (!n.ejemploTemixco && !n.inmuebles.some((i) => i.id === ID_EJEMPLO_TEMIXCO)) {
          return { ...n, ejemploTemixco: true, inmuebles: [ejemploTemixco(), ...n.inmuebles] };
        }
        return n;
      }
    }
  } catch {
    /* almacenamiento bloqueado o dañado: se empieza de nuevo */
  }
  return datosIniciales();
}

export function guardar(d: Datos): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function borrarTodo(): Datos {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin acceso */
  }
  return datosIniciales();
}
