// Qué toma cada apartado del Programa Interno del inmueble capturado en Inmuebles y plano.
// Parte SIEMPRE de contenidoDocumento(inm, "programa_interno"): en el Programa Interno no va nada
// sensible (D-P4 del Documento 04). Las fotos con personas o placas tampoco se incluyen.

import { contenidoDocumento, resumenFicha } from "@/lib/plano/planoPdf";
import { cargar, type ElementoMapa, type Hallazgo, type Inmueble } from "@/lib/plano/inmuebles";
import type { Nivel } from "@/lib/plano/croquis";
import type { FotoRef } from "@/lib/plano/fotos";
import { avisosElemento, CONDICION_INFO, defSimbolo, SITUACION_ETIQUETA, type DatosElemento, type TipoSimbolo } from "@/lib/plano/simbolos";
import type { VistaPlano } from "./plantilla";

export const TIPOS_EQUIPOS: string[] = ["extintor", "hidrante", "botiquin", "alarma_emergencia"];
export const TIPOS_SENALIZACION: string[] = ["salida_emergencia", "punto_reunion", "iluminacion"];
export const TIPOS_RIESGO: string[] = ["riesgo_puntual"];

export type ContenidoPipc = ReturnType<typeof contenidoDocumento>;

/** Contenido del inmueble que puede salir en el Programa Interno (sin elementos sensibles). */
export const contenidoPipc = (inm: Inmueble): ContenidoPipc => contenidoDocumento(inm, "programa_interno");

/** Inmuebles guardados en este navegador (prototipo: aún no existe el script 12). */
export function inmueblesDelNavegador(): Inmueble[] {
  try {
    return cargar().inmuebles;
  } catch {
    return [];
  }
}

export const buscarInmueble = (id: string | undefined): Inmueble | undefined => (id ? inmueblesDelNavegador().find((i) => i.id === id) : undefined);

/** Elementos del exterior y de cada nivel limitados a ciertos tipos (la numeración sigue este orden). */
export function filtrarTipos(c: ContenidoPipc, tipos: string[]): { exterior: ElementoMapa[]; niveles: Nivel[] } {
  return {
    exterior: c.elementos.filter((e) => tipos.includes(e.tipo)),
    niveles: c.niveles.map((n) => ({ ...n, simbolos: n.simbolos.filter((s) => tipos.includes(s.tipo)) })),
  };
}

export interface FilaInventario {
  ref: string;
  ubicacion: string;
  elemento: string;
  situacion: string;
  estado: string;
  datos: string;
  /** Recarga vencida, mal estado o salida obstruida. */
  alerta: boolean;
}

type ConDatos = DatosElemento & { tipo: TipoSimbolo };

const fila = (ref: string, ubicacion: string, e: ConDatos, hoy: Date): FilaInventario => {
  const avisos = avisosElemento(e.tipo, e, hoy);
  return {
    ref,
    ubicacion,
    elemento: defSimbolo(e.tipo).etiqueta,
    situacion: SITUACION_ETIQUETA[e.situacion ?? "existente"],
    estado: e.condicion ? CONDICION_INFO[e.condicion].etiqueta : "",
    datos: [resumenFicha(e.tipo, e), e.nota, ...avisos.filter((a) => !a.startsWith("Estado:"))].filter(Boolean).join(" · "),
    alerta: avisos.length > 0,
  };
};

/** Inventario con la misma numeración que las láminas: 1, 2… en el exterior; C1, C2… en cada nivel. */
export function inventario(c: ContenidoPipc, tipos: string[], hoy = new Date()): FilaInventario[] {
  const f = filtrarTipos(c, tipos);
  return [
    ...f.exterior.map((e, i) => fila(String(i + 1), "Exterior", e, hoy)),
    ...f.niveles.flatMap((n) => n.simbolos.map((s, i) => fila(`C${i + 1}`, n.nombre, s, hoy))),
  ];
}

/** Hallazgos del interior (ligados al croquis o sin ubicación) y del exterior (ligados al mapa o con coordenadas). */
export function hallazgosPorAmbito(c: ContenidoPipc): { internos: Hallazgo[]; externos: Hallazgo[] } {
  const exterior = new Set(c.elementos.map((e) => e.id));
  const internos: Hallazgo[] = [];
  const externos: Hallazgo[] = [];
  for (const h of c.hallazgos) {
    const esExterior = h.elementoId ? exterior.has(h.elementoId) : h.lng !== undefined && h.lat !== undefined;
    (esExterior ? externos : internos).push(h);
  }
  return { internos, externos };
}

/** Fotos que pueden salir en el documento: nunca las que tienen personas o placas. */
export const fotosPublicables = (fotos: FotoRef[] | undefined) => (fotos ?? []).filter((f) => !f.personas);

/** Fotos de una lista de elementos, con su etiqueta. */
export function fotosDeElementos(c: ContenidoPipc, tipos?: string[]): { etiqueta: string; foto: FotoRef }[] {
  const f = tipos ? filtrarTipos(c, tipos) : { exterior: c.elementos, niveles: c.niveles };
  return [
    ...f.exterior.flatMap((e, i) => fotosPublicables(e.fotos).slice(0, 3).map((foto) => ({ etiqueta: `${i + 1}. ${defSimbolo(e.tipo).etiqueta}`, foto }))),
    ...f.niveles.flatMap((n) => n.simbolos.flatMap((s, i) => fotosPublicables(s.fotos).slice(0, 3).map((foto) => ({ etiqueta: `C${i + 1}. ${defSimbolo(s.tipo).etiqueta} (${n.nombre})`, foto })))),
  ];
}

/** Resumen corto para el editor: qué va a imprimir el apartado con lámina. */
export function resumenVista(inm: Inmueble, vista: VistaPlano): string {
  const c = contenidoPipc(inm);
  const niveles = c.niveles.filter((n) => n.muros.length || n.simbolos.length).length;
  const cuenta = (tipos: string[]) => inventario(c, tipos).length;
  const { internos, externos } = hallazgosPorAmbito(c);
  const n = (k: number, uno: string, varios: string) => `${k} ${k === 1 ? uno : varios}`;
  switch (vista) {
    case "georreferencia":
      return inm.ubicacion || inm.perimetro.length ? `Coordenadas y lámina exterior · ${n(inm.perimetro.length, "vértice", "vértices")} del predio` : "El inmueble no tiene ubicación ni predio.";
    case "colindancias":
      return inm.perimetro.length >= 3 ? n(inm.perimetro.length, "lado", "lados") + " del predio" : "Falta trazar el predio (mínimo 3 vértices).";
    case "areas":
      return `${n(niveles, "nivel", "niveles")} con croquis · ${n(c.niveles.reduce((s, x) => s + x.espacios.length, 0), "espacio", "espacios")} · ${n(fotosDeElementos(c).length, "foto", "fotos")}`;
    case "riesgos_internos":
      return `${n(filtrarTipos(c, TIPOS_RIESGO).niveles.reduce((s, x) => s + x.simbolos.length, 0), "riesgo", "riesgos")} en el croquis · ${n(internos.length, "hallazgo", "hallazgos")}`;
    case "riesgos_externos":
      return `${n(filtrarTipos(c, TIPOS_RIESGO).exterior.length, "riesgo", "riesgos")} en el exterior · ${n(externos.length, "hallazgo", "hallazgos")}`;
    case "equipos_inventario":
    case "equipos_localizacion":
      return n(cuenta(TIPOS_EQUIPOS), "equipo", "equipos") + " (extintores, hidrantes, botiquines y alarmas)";
    case "senalizacion":
    case "senalizacion_localizacion":
      return `${n(cuenta(TIPOS_SENALIZACION), "elemento", "elementos")} de señalización · ${n(inm.rutas.length + c.niveles.reduce((s, x) => s + x.rutas.length, 0), "ruta", "rutas")} de evacuación`;
  }
}
