// Documento del plano (Documento 04 §7, F-13) con el mismo diseño que la propuesta económica (quotePdf.ts):
// encabezado azul marino con franja dorada, títulos de sección, tablas y pie con contacto y número de página.
// Lámina exterior sobre OpenStreetMap; nunca Google ni Esri. Las fotos con personas o placas no se incluyen.
// En el Programa Interno se omite todo lo sensible (D-P4).

import {
  loadJsPdf, loadImageDataUrl, formatLongDate, slug, STRATEC_CONTACT, drawJustified,
  NAVY_DEEP, NAVY, GOLD, STEEL, INK, MUTED, ZEBRA, RULE, CREAM,
} from "@/lib/quotePdf";
import { area, lados, perimetro, LEYENDA_MEDIDAS, ORIENTACION_ETIQUETA, type LngLat } from "./geo";
import { poligonoEspacio, superficie, TIPO_ESPACIO_ETIQUETA, type Nivel } from "./croquis";
import { METODO_ETIQUETA, SEVERIDAD_INFO, TIPO_COLINDANCIA_ETIQUETA, type Hallazgo, type Inmueble } from "./inmuebles";
import { CONDICION_INFO, defSimbolo, FICHAS, SITUACION_ETIQUETA, type DatosElemento, type TipoSimbolo } from "./simbolos";
import { leerFoto, type FotoRef } from "./fotos";
import { aJpeg, laminaExterior, svgADataUrl, svgCroquis, type Imagen } from "./laminas";

type RGB = [number, number, number];

export type TipoDocumentoPlano = "diagnostico" | "programa_interno";
export const TIPO_DOCUMENTO_ETIQUETA: Record<TipoDocumentoPlano, string> = {
  diagnostico: "Diagnóstico y estudio de riesgos",
  programa_interno: "Programa Interno de Protección Civil",
};

export interface PlanoPdfInput {
  inm: Inmueble;
  tipo: TipoDocumentoPlano;
  elaboro?: string;
  reviso?: string;
}

const hoyIso = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

/** Resumen de la ficha en una línea ("Agente: CO₂ · Capacidad: 6 kg …"). */
export function resumenFicha(tipo: TipoSimbolo, d: DatosElemento): string {
  const partes: string[] = [];
  for (const c of FICHAS[tipo] ?? []) {
    const v = d.ficha?.[c.clave];
    if (v === undefined || v === "") continue;
    if (c.tipo === "sino") partes.push(`${c.etiqueta}: ${v ? "sí" : "no"}`);
    else if (c.tipo === "numero") partes.push(`${c.etiqueta}: ${v} ${c.unidad}`);
    else if (c.tipo === "fecha" && typeof v === "string") {
      const [a, m, dd] = v.split("-");
      partes.push(`${c.etiqueta}: ${dd}/${m}/${a}`);
    } else partes.push(`${c.etiqueta}: ${v}`);
  }
  return partes.join(" · ");
}

/** Qué entra en el documento según su tipo: en el Programa Interno no va nada sensible. */
export function contenidoDocumento(inm: Inmueble, tipo: TipoDocumentoPlano) {
  const ver = (t: string) => tipo === "diagnostico" || !defSimbolo(t).sensible;
  const elementos = inm.elementos.filter((e) => ver(e.tipo));
  const niveles: Nivel[] = inm.croquis.niveles.map((n) => ({ ...n, simbolos: n.simbolos.filter((s) => ver(s.tipo)) }));
  const ids = new Set([...elementos.map((e) => e.id), ...niveles.flatMap((n) => n.simbolos.map((s) => s.id))]);
  const todosIds = new Set([...inm.elementos.map((e) => e.id), ...inm.croquis.niveles.flatMap((n) => n.simbolos.map((s) => s.id))]);
  // Hallazgos: los ligados a un elemento que no entra (sensible) tampoco entran.
  const hallazgos = (inm.hallazgos ?? []).filter((h) => !h.elementoId || !todosIds.has(h.elementoId) || ids.has(h.elementoId));
  return { elementos, niveles, hallazgos };
}

const fotosVisibles = (fotos: FotoRef[] | undefined) => (fotos ?? []).filter((f) => !f.personas);

async function cargarFoto(f: FotoRef): Promise<Imagen | null> {
  if (f.url) return aJpeg(f.url, 900);
  const b = await leerFoto(f.id).catch(() => undefined);
  return b ? aJpeg(b, 900) : null;
}

export const planoFileName = (inm: Inmueble, tipo: TipoDocumentoPlano, fecha: Date) =>
  ["Plano_STRATEC", tipo === "diagnostico" ? "Diagnostico" : "Programa-Interno", slug(inm.nombre) || "Inmueble", hoyIso(fecha)].join("_") + ".pdf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsPDF se carga desde CDN y no trae tipos (igual que en quotePdf.ts).
async function buildPlanoPdf(input: PlanoPdfInput): Promise<{ doc: any; fileName: string }> {
  const { inm, tipo } = input;
  const ahora = new Date();
  const folio = `PL-${(slug(inm.nombre).replace(/-/g, "").slice(0, 8) || "INM").toUpperCase()}-${hoyIso(ahora)}`;
  const { elementos, niveles, hallazgos } = contenidoDocumento(inm, tipo);

  const [jsPDF, mark] = await Promise.all([loadJsPdf(), loadImageDataUrl("/brand/stratec-mark-white.png")]);
  const exterior = inm.perimetro.length >= 3 || elementos.length ? await laminaExterior(inm, elementos).catch(() => null) : null;

  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  // La fuente estándar del PDF no trae "≈" ni subíndices: se cambian por texto equivalente.
  const limpio = (t: unknown): unknown =>
    typeof t === "string" ? t.replace(/≈\s?/g, "aprox. ").replace(/₂/g, "2").replace(/→/g, "->") : Array.isArray(t) ? t.map(limpio) : t;
  const textoOriginal = doc.text.bind(doc);
  doc.text = (t: unknown, ...resto: unknown[]) => textoOriginal(limpio(t), ...resto);
  const partirOriginal = doc.splitTextToSize.bind(doc);
  doc.splitTextToSize = (t: unknown, ...resto: unknown[]) => partirOriginal(limpio(t), ...resto);
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  const BOTTOM = H - 72;

  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const draw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (family: "helvetica" | "times", style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  const spacedWidth = (t: string, cs: number) => doc.getTextWidth(t) + cs * Math.max(0, t.length - 1);
  const textRight = (t: string, x: number, y: number, cs = 0) => doc.text(t, x - spacedWidth(t, cs), y, cs ? { charSpace: cs } : undefined);

  let y = 0;
  const continuationHeader = () => {
    fill(NAVY_DEEP);
    doc.rect(0, 0, W, 38, "F");
    fill(GOLD);
    doc.rect(0, 38, W, 1.5, "F");
    if (mark) doc.addImage(mark, "PNG", M, 10, 19, 18);
    font("helvetica", "normal", 10);
    color([255, 255, 255]);
    doc.text("STRATEC", M + 26, 23, { charSpace: 2 });
    font("helvetica", "normal", 7.5);
    color(MUTED);
    textRight(`PLANO Y LEVANTAMIENTO · ${folio}`, W - M, 23, 1);
  };
  const nuevaHoja = () => {
    doc.addPage();
    continuationHeader();
    y = 64;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) nuevaHoja();
  };
  const sectionTitle = (title: string) => {
    ensure(40);
    fill(GOLD);
    doc.rect(M, y - 6, 5, 5, "F");
    font("helvetica", "bold", 8);
    color(NAVY);
    doc.text(title.toUpperCase(), M + 11, y - 1, { charSpace: 1.6 });
    y += 14;
  };
  const paragraph = (text: string, size = 9, lh = 13, c: RGB = INK) => {
    font("helvetica", "normal", size);
    const lines: { t: string; last: boolean }[] = text.split("\n").flatMap((para) => {
      const w: string[] = doc.splitTextToSize(para, CW);
      return w.map((t, i) => ({ t, last: i === w.length - 1 }));
    });
    for (const { t, last } of lines) {
      ensure(lh);
      font("helvetica", "normal", size);
      color(c);
      drawJustified(doc, t, M, y, CW, !last);
      y += lh;
    }
  };
  /** Tabla con encabezado azul marino y renglones alternados, como la propuesta económica. */
  const tabla = (cols: { t: string; w: number }[], filas: string[][], colores?: (RGB | null)[][]) => {
    const total = cols.reduce((s, c) => s + c.w, 0);
    const ws = cols.map((c) => (c.w / total) * CW);
    const encabezado = () => {
      fill(NAVY);
      doc.rect(M, y, CW, 18, "F");
      font("helvetica", "bold", 7);
      color([255, 255, 255]);
      let x = M + 6;
      cols.forEach((c, i) => {
        doc.text(c.t.toUpperCase(), x, y + 12, { charSpace: 0.8 });
        x += ws[i];
      });
      y += 18;
    };
    ensure(40);
    encabezado();
    filas.forEach((f, r) => {
      font("helvetica", "normal", 8);
      const celdas = f.map((t, i) => doc.splitTextToSize(t || "—", ws[i] - 10) as string[]);
      const alto = Math.max(...celdas.map((l) => l.length)) * 10.5 + 9;
      if (y + alto > BOTTOM) {
        nuevaHoja();
        encabezado();
      }
      if (r % 2 === 1) {
        fill(ZEBRA);
        doc.rect(M, y, CW, alto, "F");
      }
      let x = M + 6;
      celdas.forEach((l, i) => {
        const c = colores?.[r]?.[i];
        font("helvetica", i === 0 ? "bold" : "normal", 8);
        color(c ?? INK);
        doc.text(l, x, y + 12);
        x += ws[i];
      });
      draw(RULE);
      doc.setLineWidth(0.5);
      doc.line(M, y + alto, M + CW, y + alto);
      y += alto;
    });
    y += 16;
  };
  const kv = (pares: [string, string][]) => {
    pares.forEach(([k, v]) => {
      ensure(15);
      font("helvetica", "bold", 8);
      color(STEEL);
      doc.text(k, M, y);
      font("helvetica", "normal", 9);
      color(INK);
      const l: string[] = doc.splitTextToSize(v, CW - 150);
      doc.text(l, M + 150, y);
      y += Math.max(15, l.length * 12);
    });
    y += 8;
  };
  const medida = (img: Imagen, altoMax: number) => {
    let w = CW;
    let h = (img.alto / img.ancho) * w;
    if (h > altoMax) {
      h = altoMax;
      w = (img.ancho / img.alto) * h;
    }
    return { w, h };
  };
  /** Título de sección con su imagen: si no caben juntos, los dos pasan a la hoja siguiente. */
  const tituloConImagen = (titulo: string, img: Imagen | null, altoMax: number) => {
    if (img) ensure(medida(img, altoMax).h + 30);
    sectionTitle(titulo);
  };
  /** Imagen a lo ancho, con borde fino; devuelve la caja donde quedó. */
  const imagen = (img: Imagen, altoMax = BOTTOM - 64 - 30) => {
    const { w, h } = medida(img, altoMax);
    ensure(h + 8);
    const x = M + (CW - w) / 2;
    doc.addImage(img.dataUrl, "JPEG", x, y, w, h);
    draw(RULE);
    doc.setLineWidth(0.7);
    doc.rect(x, y, w, h);
    const caja = { x, y, w, h };
    y += h + 8;
    return caja;
  };
  const leyenda = (t: string) => {
    font("helvetica", "italic", 7);
    color(STEEL);
    const l: string[] = doc.splitTextToSize(t, CW);
    ensure(l.length * 9 + 6);
    doc.text(l, M, y);
    y += l.length * 9 + 10;
  };

  // ── Portada (igual que la propuesta económica) ──
  fill(NAVY_DEEP);
  doc.rect(0, 0, W, 120, "F");
  fill(GOLD);
  doc.rect(0, 120, W, 2.5, "F");
  if (mark) doc.addImage(mark, "PNG", M, 36, 46, 44);
  font("helvetica", "normal", 19);
  color([255, 255, 255]);
  doc.text("STRATEC", M + 58, 56, { charSpace: 3.2 });
  font("helvetica", "normal", 7);
  color(GOLD);
  doc.text("SECURITY", M + 59, 68, { charSpace: 2.6 });
  font("helvetica", "normal", 7.5);
  color(MUTED);
  doc.text(STRATEC_CONTACT.tagline, M + 59, 82);
  font("helvetica", "bold", 7.5);
  color(GOLD);
  textRight("PLANO Y LEVANTAMIENTO", W - M, 50, 2);
  font("times", "normal", 19);
  color([255, 255, 255]);
  textRight(folio, W - M, 76);
  font("helvetica", "normal", 8);
  color(MUTED);
  textRight(`Emitido el ${formatLongDate(ahora)}`, W - M, 94);

  y = 156;
  const colR = M + 330;
  font("helvetica", "bold", 6.8);
  color(STEEL);
  doc.text("INMUEBLE", M, y, { charSpace: 1.6 });
  doc.text("PARA EL DOCUMENTO", colR, y, { charSpace: 1.6 });
  font("times", "bold", 15);
  color(NAVY);
  const nom: string[] = doc.splitTextToSize(inm.nombre, 310);
  doc.text(nom, M, y + 18);
  let yl = y + 18 + nom.length * 17;
  font("helvetica", "normal", 9);
  color(INK);
  doc.text([inm.municipio || "Municipio por registrar", inm.clienteNombre ? `Cliente: ${inm.clienteNombre}` : ""].filter(Boolean), M, yl);
  yl += 26;
  font("times", "bold", 12);
  color(NAVY);
  const td: string[] = doc.splitTextToSize(TIPO_DOCUMENTO_ETIQUETA[tipo], W - M - colR);
  doc.text(td, colR, y + 18);
  font("helvetica", "normal", 8);
  color(STEEL);
  doc.text(
    doc.splitTextToSize(tipo === "diagnostico" ? "Incluye elementos de seguridad (información confidencial del cliente)." : "Sin elementos de seguridad sensibles (D-P4).", W - M - colR),
    colR,
    y + 22 + td.length * 14,
  );
  y = Math.max(yl, y + 70) + 14;

  // ── Datos del predio ──
  const anillo: LngLat[] = inm.perimetro.map((v) => [v.lng, v.lat]);
  const gps = inm.perimetro.filter((v) => v.origen === "gps" && v.precision !== undefined);
  sectionTitle("Datos del predio");
  kv([
    ["Ubicación", inm.ubicacion ? `${inm.ubicacion.lat.toFixed(6)}, ${inm.ubicacion.lng.toFixed(6)}` : "Sin registrar"],
    ["Origen de las medidas", METODO_ETIQUETA[inm.metodo]],
    ...(anillo.length >= 3
      ? ([
          ["Superficie del predio", `≈ ${area(anillo).toLocaleString("es-MX", { maximumFractionDigits: 1 })} m²`],
          ["Perímetro", `≈ ${perimetro(anillo).toLocaleString("es-MX", { maximumFractionDigits: 1 })} m`],
          ["Vértices", String(anillo.length)],
        ] as [string, string][])
      : []),
    ...(gps.length ? ([["Precisión GPS", `± ${Math.round(gps.reduce((s, v) => s + (v.precision ?? 0), 0) / gps.length)} m en promedio`]] as [string, string][]) : []),
  ]);

  // ── Lámina exterior ──
  if (exterior) {
    tituloConImagen("Lámina 1 · Exterior: predio, colindancias y elementos", exterior, BOTTOM - 64 - 30);
    const caja = imagen(exterior);
    // Rosa de los vientos (norte arriba).
    const nx = caja.x + caja.w - 30;
    const ny = caja.y + 34;
    fill([255, 255, 255]);
    doc.circle(nx, ny, 18, "F");
    fill(NAVY);
    doc.triangle(nx, ny - 15, nx - 6, ny + 4, nx + 6, ny + 4, "F");
    font("helvetica", "bold", 8);
    color(NAVY);
    doc.text("N", nx - 2.6, ny + 13);
    // Escala gráfica.
    const mPorPt = (exterior.metrosPorPx * exterior.ancho) / caja.w;
    const opciones = [5, 10, 20, 25, 50, 100, 200, 500];
    const metros = opciones.find((m) => m / mPorPt >= 60) ?? 500;
    const largo = metros / mPorPt;
    const ex = caja.x + 12;
    const ey = caja.y + caja.h - 16;
    fill([255, 255, 255]);
    doc.rect(ex - 6, ey - 14, largo + 50, 22, "F");
    fill(NAVY);
    doc.rect(ex, ey - 3, largo / 2, 4, "F");
    draw(NAVY);
    doc.setLineWidth(0.8);
    doc.rect(ex, ey - 3, largo, 4);
    font("helvetica", "normal", 7);
    color(NAVY);
    doc.text(`0`, ex - 2, ey - 6);
    doc.text(`${metros} m`, ex + largo - 6, ey - 6);
    leyenda(`Escala gráfica aproximada (1:${Math.round(mPorPt * 2834.6).toLocaleString("es-MX")} en esta hoja). Números = elementos del inventario; L1, L2… = lados del predio. Borde dorado = propuesto; borde rojo = retirar. Cartografía base: © colaboradores de OpenStreetMap.`);
  }

  // ── Colindancias ──
  if (anillo.length >= 3) {
    sectionTitle("Cuadro de colindancias");
    tabla(
      [{ t: "Lado", w: 1 }, { t: "Orientación", w: 2 }, { t: "Colinda con", w: 2.2 }, { t: "Largo", w: 1.4 }, { t: "Descripción", w: 4 }],
      lados(anillo).map((l) => {
        const c = inm.colindancias[l.indice] ?? {};
        return [`L${l.indice + 1}`, ORIENTACION_ETIQUETA[c.orientacion ?? l.orientacion], c.tipo ? TIPO_COLINDANCIA_ETIQUETA[c.tipo] : "", `≈ ${l.largo.toFixed(1)} m`, c.descripcion ?? ""];
      }),
    );
  }

  // ── Inventario ──
  const filasInv = (lista: { id: string; tipo: TipoSimbolo; nota?: string; condicion?: DatosElemento["condicion"]; situacion?: DatosElemento["situacion"]; ficha?: DatosElemento["ficha"] }[], prefijo: string) =>
    lista.map((e, i) => [
      `${prefijo}${i + 1}`,
      defSimbolo(e.tipo).etiqueta,
      SITUACION_ETIQUETA[e.situacion ?? "existente"],
      e.condicion ? CONDICION_INFO[e.condicion].etiqueta : "",
      [resumenFicha(e.tipo, e), e.nota].filter(Boolean).join(" · "),
    ]);
  const coloresInv = (lista: { condicion?: DatosElemento["condicion"] }[]) =>
    lista.map((e) => [null, null, null, e.condicion === "malo" || e.condicion === "no_funciona" ? ([180, 35, 24] as RGB) : null, null]);
  const colsInv = [{ t: "#", w: 0.7 }, { t: "Elemento", w: 2.4 }, { t: "Situación", w: 1.4 }, { t: "Estado", w: 1.3 }, { t: "Datos y observaciones", w: 5 }];
  if (elementos.length) {
    sectionTitle("Inventario de elementos · Exterior");
    tabla(colsInv, filasInv(elementos, ""), coloresInv(elementos));
  }

  // ── Croquis por nivel ──
  let lamina = exterior ? 2 : 1;
  for (const n of niveles) {
    if (!n.muros.length && !n.simbolos.length) continue;
    const { svg } = svgCroquis(n, true);
    const img = await aJpeg(svgADataUrl(svg), 1600);
    tituloConImagen(`Lámina ${lamina++} · Croquis ${n.nombre} (nivel de piso ${n.nivelPiso >= 0 ? "+" : ""}${n.nivelPiso.toFixed(2)} m)`, img, 420);
    if (img) imagen(img, 420);
    leyenda("Croquis sin escala, con medidas aproximadas a ejes de muro. C1, C2… = elementos del inventario del nivel; línea verde = ruta de evacuación.");
    if (n.espacios.length) {
      tabla(
        [{ t: "Espacio", w: 4 }, { t: "Tipo", w: 3 }, { t: "Superficie", w: 2 }],
        n.espacios.map((e) => [e.nombre, TIPO_ESPACIO_ETIQUETA[e.tipo] ?? e.tipo, `≈ ${superficie(poligonoEspacio(n, e)).toFixed(1)} m²`]),
      );
    }
    if (n.simbolos.length) {
      tabla(colsInv, filasInv(n.simbolos, "C"), coloresInv(n.simbolos));
    }
  }

  // ── Hallazgos ──
  if (hallazgos.length) {
    sectionTitle("Hallazgos");
    const etiquetaElemento = (h: Hallazgo) => {
      const e = elementos.find((x) => x.id === h.elementoId);
      if (e) return `${defSimbolo(e.tipo).etiqueta} ${elementos.indexOf(e) + 1}`;
      for (const n of niveles) {
        const s = n.simbolos.find((x) => x.id === h.elementoId);
        if (s) return `${defSimbolo(s.tipo).etiqueta} C${n.simbolos.indexOf(s) + 1} (${n.nombre})`;
      }
      return "";
    };
    for (const h of hallazgos) {
      ensure(60);
      fill(CREAM);
      const sev = h.severidad ? SEVERIDAD_INFO[h.severidad] : null;
      doc.rect(M, y - 10, CW, 22, "F");
      if (sev) {
        const c = sev.color.match(/\w\w/g)!.map((x) => parseInt(x, 16)) as RGB;
        fill(c);
        doc.rect(M, y - 10, 3, 22, "F");
      }
      font("helvetica", "bold", 9.5);
      color(NAVY);
      doc.text(h.titulo || "Hallazgo sin título", M + 10, y + 4);
      font("helvetica", "normal", 7.5);
      color(STEEL);
      textRight([sev ? `Severidad ${sev.etiqueta.toLowerCase()}` : "", h.estado === "propuesta" ? "pendiente de revisión" : "revisado"].filter(Boolean).join(" · "), W - M - 8, y + 4);
      y += 22;
      const el = etiquetaElemento(h);
      if (el) {
        font("helvetica", "normal", 8);
        color(STEEL);
        doc.text(`Elemento: ${el}`, M + 10, y);
        y += 12;
      }
      if (h.descripcion) paragraph(h.descripcion, 8.5, 12);
      const fotos = fotosVisibles(h.fotos);
      if (fotos.length) {
        const imgs = (await Promise.all(fotos.slice(0, 6).map(cargarFoto))).filter((x): x is Imagen => !!x);
        const ancho = (CW - 16) / 3;
        for (let i = 0; i < imgs.length; i += 3) {
          const fila = imgs.slice(i, i + 3);
          const alto = Math.max(...fila.map((f) => (f.alto / f.ancho) * ancho));
          ensure(alto + 10);
          fila.forEach((f, k) => doc.addImage(f.dataUrl, "JPEG", M + k * (ancho + 8), y, ancho, (f.alto / f.ancho) * ancho));
          y += alto + 10;
        }
      }
      y += 8;
    }
  }

  // ── Memoria fotográfica de los elementos ──
  const conFotos = [
    ...elementos.map((e, i) => ({ etiqueta: `${i + 1}. ${defSimbolo(e.tipo).etiqueta}`, fotos: fotosVisibles(e.fotos) })),
    ...niveles.flatMap((n) => n.simbolos.map((s, i) => ({ etiqueta: `C${i + 1}. ${defSimbolo(s.tipo).etiqueta} (${n.nombre})`, fotos: fotosVisibles(s.fotos) }))),
  ].filter((x) => x.fotos.length);
  if (conFotos.length) {
    sectionTitle("Memoria fotográfica");
    const ancho = (CW - 16) / 3;
    const piezas: { etiqueta: string; img: Imagen }[] = [];
    for (const c of conFotos) for (const f of c.fotos.slice(0, 3)) {
      const img = await cargarFoto(f);
      if (img) piezas.push({ etiqueta: c.etiqueta, img });
    }
    for (let i = 0; i < piezas.length; i += 3) {
      const fila = piezas.slice(i, i + 3);
      const alto = Math.max(...fila.map((p) => (p.img.alto / p.img.ancho) * ancho));
      ensure(alto + 24);
      fila.forEach((p, k) => {
        doc.addImage(p.img.dataUrl, "JPEG", M + k * (ancho + 8), y, ancho, (p.img.alto / p.img.ancho) * ancho);
        font("helvetica", "normal", 7.5);
        color(STEEL);
        doc.text(doc.splitTextToSize(p.etiqueta, ancho)[0], M + k * (ancho + 8), y + alto + 10);
      });
      y += alto + 22;
    }
  }

  // ── Leyenda de medidas, fuentes y cajetín ──
  ensure(150);
  y += 6;
  fill(CREAM);
  const textoLegal = `${LEYENDA_MEDIDAS} Cartografía base: © colaboradores de OpenStreetMap. Origen de las medidas: ${METODO_ETIQUETA[inm.metodo].toLowerCase()}.${tipo === "diagnostico" ? " Contiene información de seguridad confidencial: uso exclusivo del cliente." : ""}`;
  font("helvetica", "normal", 7.6);
  const ll: string[] = doc.splitTextToSize(textoLegal, CW - 26);
  const lh = ll.length * 10 + 18;
  doc.rect(M, y, CW, lh, "F");
  fill(GOLD);
  doc.rect(M, y, 2.5, lh, "F");
  color(STEEL);
  ll.forEach((l, i) => drawJustified(doc, l, M + 14, y + 15 + i * 10, CW - 26, i < ll.length - 1));
  y += lh + 40;
  sectionTitle("Elaboró y revisó");
  y += 30;
  const sw = (CW - 40) / 2;
  draw(NAVY);
  doc.setLineWidth(0.7);
  doc.line(M, y, M + sw, y);
  doc.line(M + sw + 40, y, W - M, y);
  font("helvetica", "bold", 8);
  color(NAVY);
  doc.text(input.elaboro ? `Elaboró: ${input.elaboro}` : "Elaboró", M, y + 13);
  doc.text(input.reviso ? `Revisó: ${input.reviso}` : "Revisó", M + sw + 40, y + 13);
  font("helvetica", "normal", 7.5);
  color(STEEL);
  doc.text("Nombre, cargo y firma", M, y + 24);
  doc.text("Nombre, cargo y firma", M + sw + 40, y + 24);

  // ── Pie de página en todas las hojas (igual que la propuesta) ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    fill(GOLD);
    doc.rect(M, H - 46, CW, 0.8, "F");
    font("helvetica", "normal", 6.8);
    color(STEEL);
    doc.text(`${STRATEC_CONTACT.legalName}  ·  ${STRATEC_CONTACT.email}  ·  ${STRATEC_CONTACT.phone}  ·  ${STRATEC_CONTACT.web}`, M, H - 32);
    textRight(`${folio}  ·  Página ${p} de ${pages}`, W - M, H - 32);
    font("helvetica", "italic", 6.3);
    doc.text("Documento confidencial", M, H - 22);
  }

  const fileName = planoFileName(inm, tipo, ahora);
  doc.setProperties({ title: `Plano y levantamiento — ${inm.nombre}`, subject: TIPO_DOCUMENTO_ETIQUETA[tipo], author: "STRATEC Security", creator: "STRATEC Dashboard" });
  return { doc, fileName };
}

/** Genera el documento y devuelve una URL temporal para verlo en el panel (mismo visor que la propuesta). */
export async function previewPlanoPdf(input: PlanoPdfInput): Promise<{ url: string; fileName: string; blob: Blob }> {
  const { doc, fileName } = await buildPlanoPdf(input);
  const blob: Blob = doc.output("blob");
  return { url: URL.createObjectURL(blob), fileName, blob };
}
