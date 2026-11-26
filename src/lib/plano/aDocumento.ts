// Del plano al documento: textos y hallazgos que "Traer del plano" lleva al editor de Documentos.
// Funciones puras (se prueban sin navegador).

import type { Finding, Severity } from "@/lib/documentTemplates";
import { area, lados, perimetro, LEYENDA_MEDIDAS, ORIENTACION_ETIQUETA, type LngLat } from "./geo";
import { poligonoEspacio, superficie } from "./croquis";
import { METODO_ETIQUETA, TIPO_COLINDANCIA_ETIQUETA, type Inmueble } from "./inmuebles";
import { defSimbolo } from "./simbolos";
import { contenidoDocumento, type TipoDocumentoPlano } from "./planoPdf";

/** Plantillas de Documentos que van a Protección Civil: el plano entra sin lo sensible. */
const PARA_AUTORIDAD = new Set(["revision-programa-interno", "programa-interno", "pipc-morelos"]);
export const tipoPlanoPara = (plantillaId: string): TipoDocumentoPlano => (PARA_AUTORIDAD.has(plantillaId) || plantillaId.startsWith("pipc") ? "programa_interno" : "diagnostico");

/** "extintor" → "extintores"; "salida de emergencia" → "salidas de emergencia". */
export function plural(etiqueta: string, n: number): string {
  if (n === 1) return etiqueta;
  const [primera, ...resto] = etiqueta.split(" ");
  const p = /[aeiouáéó]$/i.test(primera) ? `${primera}s` : /z$/i.test(primera) ? `${primera.slice(0, -1)}ces` : `${primera.replace(/([áéíóú])(n)$/, (_, v: string, n: string) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u" })[v as "á"] + n)}es`;
  return [p, ...resto].join(" ");
}

const num = (n: number) => n.toLocaleString("es-MX", { maximumFractionDigits: 1 });

/** Ubicación en una línea para la ficha del documento. */
export function ubicacionDesdePlano(inm: Inmueble): string {
  const c = inm.ubicacion ? ` (${inm.ubicacion.lat.toFixed(6)}, ${inm.ubicacion.lng.toFixed(6)})` : "";
  return `${inm.municipio ? `${inm.municipio}, Morelos` : "Morelos"}${c}`;
}

/** Texto para "Descripción del inmueble y su entorno". */
export function descripcionDesdePlano(inm: Inmueble, plantillaId: string): string {
  const { elementos, niveles } = contenidoDocumento(inm, tipoPlanoPara(plantillaId));
  const anillo: LngLat[] = inm.perimetro.map((v) => [v.lng, v.lat]);
  const p: string[] = [];
  if (anillo.length >= 3) {
    p.push(
      `El predio tiene una superficie aproximada de ${num(area(anillo))} m² y un perímetro aproximado de ${num(perimetro(anillo))} m (${METODO_ETIQUETA[inm.metodo].toLowerCase()}).`,
    );
    const cols = lados(anillo).map((l) => {
      const c = inm.colindancias[l.indice] ?? {};
      const con = c.tipo ? TIPO_COLINDANCIA_ETIQUETA[c.tipo].toLowerCase() : "colindancia por precisar";
      return `- Al ${ORIENTACION_ETIQUETA[c.orientacion ?? l.orientacion].toLowerCase()}: ${con}, ${num(l.largo)} m${c.descripcion ? `; ${c.descripcion}` : ""}.`;
    });
    p.push(`Colindancias:\n${cols.join("\n")}`);
  }
  const construidos = niveles.filter((n) => n.espacios.length);
  if (construidos.length) {
    const total = construidos.reduce((s, n) => s + n.espacios.reduce((t, e) => t + superficie(poligonoEspacio(n, e)), 0), 0);
    p.push(
      `El inmueble cuenta con ${construidos.length === 1 ? "un nivel levantado" : `${construidos.length} niveles levantados`} en croquis (${construidos.map((n) => n.nombre).join(", ")}), con una superficie construida aproximada de ${num(total)} m² a ejes de muro.`,
    );
  }
  const cuenta = new Map<string, number>();
  for (const e of [...elementos, ...niveles.flatMap((n) => n.simbolos)]) {
    if (e.situacion === "propuesto") continue;
    const k = defSimbolo(e.tipo).etiqueta.toLowerCase();
    cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
  }
  if (cuenta.size) {
    p.push(`Durante la inspección se registraron: ${[...cuenta].map(([k, n]) => `${n} ${plural(k, n)}`).join(", ")}. El detalle de cada elemento, con su estado y ubicación, está en el anexo de plano y levantamiento.`);
  }
  p.push(LEYENDA_MEDIDAS);
  return p.join("\n\n");
}

const SEVERIDAD: Record<string, Severity> = { baja: "baja", media: "media", alta: "alta", critica: "critica" };

/** Hallazgos del plano como hallazgos del documento (id "plano-…" para no duplicarlos al volver a traer). */
export function hallazgosDesdePlano(inm: Inmueble, plantillaId: string): Finding[] {
  const { elementos, niveles, hallazgos } = contenidoDocumento(inm, tipoPlanoPara(plantillaId));
  const donde = (id?: string) => {
    const e = elementos.find((x) => x.id === id);
    if (e) return `Exterior · ${defSimbolo(e.tipo).etiqueta} ${elementos.indexOf(e) + 1}`;
    for (const n of niveles) {
      const s = n.simbolos.find((x) => x.id === id);
      if (s) return `${n.nombre} · ${defSimbolo(s.tipo).etiqueta} C${n.simbolos.indexOf(s) + 1}`;
    }
    return "Exterior";
  };
  return hallazgos.map((h) => ({
    id: `plano-${h.id}`,
    area: donde(h.elementoId),
    description: [h.titulo, h.descripcion].filter(Boolean).join(". "),
    severity: h.severidad ? SEVERIDAD[h.severidad] : "media",
  }));
}

/** Reemplaza los hallazgos traídos antes del plano y conserva los escritos a mano. */
export const fusionarHallazgos = (actuales: Finding[], delPlano: Finding[]): Finding[] => [
  ...actuales.filter((f) => !f.id.startsWith("plano-")),
  ...delPlano,
];
