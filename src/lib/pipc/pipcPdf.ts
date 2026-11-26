// PDF del Programa Interno de Protección Civil de Morelos, con el mismo diseño que los demás documentos
// (documentPdf.ts): portada azul marino, encabezado con franja dorada, tablas y pie con folio y página.
// Decisiones del titular (§8): se entrega impreso, en el orden de la guía y con la guía de anexos para armar
// la carpeta. Cada capítulo empieza en hoja nueva. El índice muestra "---" en los apartados que no aplican.
// Las láminas salen de Inmuebles y plano sin elementos sensibles (D-P4) y sin fotos con personas.

import {
  loadJsPdf, loadImageDataUrl, formatLongDate, parseLocalDate, STRATEC_CONTACT, drawJustified,
  NAVY_DEEP, NAVY, GOLD, STEEL, INK, MUTED, ZEBRA, RULE, CREAM,
} from "@/lib/quotePdf";
import {
  type DocumentTemplate, type RiskLevel,
  PRIORITY_LABEL, TERM_LABEL, RISK_LEVEL_LABEL, LEVEL_RGB, PROBABILITY_LABEL, IMPACT_LABEL, riskScore, riskLevel,
} from "@/lib/documentTemplates";
import type { DocumentPdfInput } from "@/lib/documentPdf";
import { area, lados, perimetro, LEYENDA_MEDIDAS, ORIENTACION_ETIQUETA, type LngLat } from "@/lib/plano/geo";
import { poligonoEspacio, superficie, TIPO_ESPACIO_ETIQUETA, type Nivel } from "@/lib/plano/croquis";
import { METODO_ETIQUETA, puntoInmueble, SEVERIDAD_INFO, TIPO_COLINDANCIA_ETIQUETA, type ElementoMapa, type Hallazgo, type Inmueble } from "@/lib/plano/inmuebles";
import { defSimbolo } from "@/lib/plano/simbolos";
import { leerFoto, type FotoRef } from "@/lib/plano/fotos";
import { aJpeg, laminaExterior, svgADataUrl, svgCroquis, type Imagen, type LaminaExterior } from "@/lib/plano/laminas";
import {
  autoridad, bibliografia, BASE_LEGAL, CLASIFICACION_ETIQUETA, guiaAnexos, letras, normalizePipc, profundidad, soloAnexo,
  textoClasificacion, visibleEnVariante, type PipcBlock, type VistaPlano,
} from "./plantilla";
import {
  buscarInmueble, contenidoPipc, filtrarTipos, fotosDeElementos, fotosPublicables, hallazgosPorAmbito, inventario,
  TIPOS_EQUIPOS, TIPOS_RIESGO, TIPOS_SENALIZACION, type ContenidoPipc,
} from "./planoPipc";

type RGB = [number, number, number];
type Block = DocumentTemplate["blocks"][number];

const ROJO: RGB = [180, 35, 24];
/** Vistas que empiezan con una lámina (imagen alta). */
const CON_LAMINA = new Set<VistaPlano>(["areas", "riesgos_internos", "riesgos_externos", "equipos_localizacion", "senalizacion_localizacion"]);

/** Bloque del índice: apartados del PIPC y tablas de M-DESR que abren apartado propio. */
const codigoDe = (b: Block): string | undefined => ("code" in b ? b.code : undefined);

/** Párrafo con renglones separados por "|": se dibuja como tabla (el primer renglón es el encabezado). */
export function parseTabla(parrafo: string): string[][] | null {
  const lineas = parrafo.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lineas.length || !lineas.every((l) => l.includes("|"))) return null;
  return lineas.map((l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
}

async function cargarFoto(f: FotoRef): Promise<Imagen | null> {
  if (f.url) return aJpeg(f.url, 900);
  const b = await leerFoto(f.id).catch(() => undefined);
  return b ? aJpeg(b, 900) : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsPDF se carga desde CDN y no trae tipos (igual que en quotePdf.ts).
export async function buildPipcPdf(input: DocumentPdfInput, fileName: string): Promise<{ doc: any; fileName: string }> {
  const { template, folio, data, client } = input;
  const pipc = normalizePipc(data.pipc);
  // El inmueble se elige en "Inmueble del plano" de los datos generales (el mismo campo que usan las demás plantillas).
  const inm: Inmueble | undefined = buscarInmueble(data.meta.inmuebleId);
  const contenido: ContenidoPipc | null = inm ? contenidoPipc(inm) : null;

  const [jsPDF, mark] = await Promise.all([loadJsPdf(), loadImageDataUrl("/brand/stratec-mark-white.png")]);
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  // La fuente estándar del PDF no trae "≈", "→" ni subíndices: se cambian por texto equivalente.
  const limpio = (t: unknown): unknown =>
    typeof t === "string" ? t.replace(/≈\s?/g, "aprox. ").replace(/₂/g, "2").replace(/→/g, "->").replace(/≥/g, ">=").replace(/≤/g, "<=") : Array.isArray(t) ? t.map(limpio) : t;
  const textoOriginal = doc.text.bind(doc);
  doc.text = (t: unknown, ...resto: unknown[]) => textoOriginal(limpio(t), ...resto);
  const partirOriginal = doc.splitTextToSize.bind(doc);
  doc.splitTextToSize = (t: unknown, ...resto: unknown[]) => partirOriginal(limpio(t), ...resto);

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54;
  const CW = W - M * 2;
  const BOTTOM = H - 74;
  const TOP = 70;
  const issue = data.meta.issueDate ? parseLocalDate(data.meta.issueDate) : new Date();
  const docTitle = data.meta.title?.trim() || template.name;
  const razonSocial = (data.sections.pipc_I_2_1 ?? "").trim() || client.name;
  const ante = autoridad(pipc);

  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const draw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (family: "helvetica" | "times", style: "normal" | "bold" | "italic" | "bolditalic", size: number) => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  const spacedWidth = (t: string, cs: number) => doc.getTextWidth(t) + cs * Math.max(0, t.length - 1);
  const textRight = (t: string, x: number, y: number, cs = 0) => doc.text(t, x - spacedWidth(t, cs), y, cs ? { charSpace: cs } : undefined);
  const textCenter = (t: string, cx: number, y: number, cs = 0) => doc.text(t, cx - spacedWidth(t, cs) / 2, y, cs ? { charSpace: cs } : undefined);
  const paginaActual = (): number => doc.getNumberOfPages();

  let y = 0;

  // ── Portada (mismo diseño que los demás documentos) ──
  fill(NAVY_DEEP);
  doc.rect(0, 0, W, H, "F");
  fill(GOLD);
  doc.rect(0, 0, 6, H, "F");
  if (mark) doc.addImage(mark, "PNG", M, 64, 52, 50);
  font("helvetica", "normal", 20);
  color([255, 255, 255]);
  doc.text("STRATEC", M + 66, 88, { charSpace: 3.4 });
  font("helvetica", "normal", 7.5);
  color(GOLD);
  doc.text("SECURITY", M + 67, 101, { charSpace: 2.8 });

  y = 270;
  font("helvetica", "bold", 8.5);
  color(GOLD);
  doc.text(`EJERCICIO ${pipc.ejercicio}`.toUpperCase(), M, y, { charSpace: 2.4 });
  y += 14;
  fill(GOLD);
  doc.rect(M, y, 46, 1.5, "F");
  y += 40;
  font("times", "normal", 32);
  color([255, 255, 255]);
  const titleLines: string[] = doc.splitTextToSize(docTitle, CW - 20);
  doc.text(titleLines, M, y, { lineHeightFactor: 1.15 });
  y += titleLines.length * 36 + 18;
  font("times", "italic", 15);
  color(MUTED);
  const clientLines: string[] = doc.splitTextToSize(razonSocial, CW - 20);
  doc.text(clientLines, M, y);
  y += clientLines.length * 18;
  const domicilio = (data.sections.pipc_I_2_4 ?? "").trim() || data.meta.location || "";
  if (domicilio) {
    font("helvetica", "normal", 9.5);
    color(MUTED);
    doc.text(doc.splitTextToSize(domicilio, CW - 20), M, y + 6);
    y += 20;
  }
  if (pipc.clasificacion) {
    y += 22;
    const etiqueta = CLASIFICACION_ETIQUETA[pipc.clasificacion].toUpperCase();
    font("helvetica", "bold", 8);
    const pw = spacedWidth(etiqueta, 1.6) + 24;
    fill(pipc.clasificacion === "alto" ? LEVEL_RGB.alto : LEVEL_RGB.bajo);
    doc.rect(M, y - 13, pw, 20, "F");
    color([255, 255, 255]);
    doc.text(etiqueta, M + 12, y + 0.5, { charSpace: 1.6 });
  }

  const fy = H - 190;
  draw([60, 72, 96]);
  doc.setLineWidth(0.6);
  doc.line(M, fy, W - M, fy);
  const coverCells: [string, string][] = [
    ["FOLIO", folio],
    ["EMISIÓN", formatLongDate(issue)],
    ...(ante ? ([["SE PRESENTA ANTE", ante]] as [string, string][]) : []),
    ["ELABORÓ", data.meta.consultant || STRATEC_CONTACT.legalName],
  ];
  const cw = CW / coverCells.length;
  coverCells.forEach(([label, value], i) => {
    const x = M + i * cw;
    font("helvetica", "bold", 6.6);
    color(GOLD);
    doc.text(label, x, fy + 24, { charSpace: 1.6 });
    font("helvetica", "normal", 9.2);
    color([255, 255, 255]);
    doc.text(doc.splitTextToSize(value || "—", cw - 14), x, fy + 40);
  });
  font("helvetica", "bold", 6.8);
  color(GOLD);
  doc.text("PROGRAMA INTERNO DE PROTECCIÓN CIVIL", M, H - 74, { charSpace: 2 });
  font("helvetica", "normal", 7);
  color(MUTED);
  doc.text(doc.splitTextToSize(`Elaborado para ${razonSocial} conforme al formato de la Coordinación Estatal de Protección Civil de Morelos.`, CW), M, H - 61);
  doc.text(`${STRATEC_CONTACT.email}  ·  ${STRATEC_CONTACT.phone}  ·  ${STRATEC_CONTACT.web}`, M, H - 40);

  // ── Páginas interiores ──
  const header = () => {
    fill(NAVY_DEEP);
    doc.rect(0, 0, W, 38, "F");
    fill(GOLD);
    doc.rect(0, 38, W, 1.5, "F");
    if (mark) doc.addImage(mark, "PNG", M, 10, 19, 18);
    font("helvetica", "normal", 10);
    color([255, 255, 255]);
    doc.text("STRATEC", M + 26, 23, { charSpace: 2 });
    font("helvetica", "normal", 7.2);
    color(MUTED);
    textRight(`${template.name.toUpperCase()} · ${folio}`, W - M, 23, 0.8);
  };
  const newPage = () => {
    doc.addPage();
    header();
    y = TOP;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) newPage();
  };

  // ── Bloques que se imprimen ──
  const bloques: Block[] = template.blocks.filter((b) => {
    if (b.type === "apartado" || b.type === "plano") return visibleEnVariante(b, pipc);
    if (b.type === "heatmap") return data.risks.length > 0;
    return b.type === "risks" || b.type === "actions";
  });
  const esContinuacion = (b: Block, i: number) => {
    const c = codigoDe(b);
    return b.type !== "apartado" && b.type !== "plano" && !!c && i > 0 && codigoDe(bloques[i - 1]) === c;
  };
  const enIndice = bloques.filter((b, i) => (b.type === "apartado" || b.type === "plano") && !esContinuacion(b, i)) as PipcBlock[];

  // ── Índice: se reservan sus hojas y se llena al final con el número de página ──
  const IDX_LH = 13;
  const altoEntrada = (b: PipcBlock) => (profundidad(b.code) === 0 ? IDX_LH + 10 : IDX_LH);
  let hojasIndice = 1;
  {
    let yy = TOP + 28;
    for (const b of enIndice) {
      if (yy + altoEntrada(b) > BOTTOM) {
        hojasIndice++;
        yy = TOP;
      }
      yy += altoEntrada(b);
    }
  }
  const primeraHojaIndice = paginaActual() + 1;
  for (let i = 0; i < hojasIndice; i++) newPage();
  const paginaDe: Record<string, number> = {};

  // ── Utilidades de contenido ──
  const tituloCapitulo = (code: string, title: string) => {
    newPage();
    y = TOP + 18;
    font("times", "normal", 34);
    color(GOLD);
    doc.text(code, M, y + 14);
    const cx = M + Math.max(48, spacedWidth(code, 0) + 18);
    font("times", "normal", 22);
    color(NAVY);
    const tl: string[] = doc.splitTextToSize(title, W - M - cx);
    doc.text(tl, cx, y + 12);
    y += 12 + (tl.length - 1) * 24 + 14;
    fill(GOLD);
    doc.rect(cx, y, 46, 1.5, "F");
    y += 26;
  };

  const tituloApartado = (code: string, title: string, depth: number, minContent = 40) => {
    if (depth === 1) {
      ensure(56 + minContent);
      y += 14;
      font("times", "normal", 15);
      color(GOLD);
      doc.text(code, M, y);
      const cx = M + Math.max(46, spacedWidth(code, 0) + 12);
      font("times", "normal", 15);
      color(NAVY);
      const tl: string[] = doc.splitTextToSize(title, W - M - cx);
      doc.text(tl, cx, y);
      y += (tl.length - 1) * 17 + 8;
      fill(GOLD);
      doc.rect(cx, y, 30, 1.1, "F");
      y += 16;
    } else {
      ensure(36 + minContent);
      y += 8;
      font("helvetica", "bold", depth === 2 ? 9.6 : 8.8);
      color(GOLD);
      doc.text(code, M, y);
      const cx = M + Math.max(54, spacedWidth(code, 0) + 10);
      color(NAVY);
      const tl: string[] = doc.splitTextToSize(title, W - M - cx);
      doc.text(tl, cx, y);
      y += (tl.length - 1) * 12 + 14;
    }
  };

  const nota = (t: string, c: RGB = STEEL, style: "italic" | "normal" | "bold" = "italic", size = 8) => {
    font("helvetica", style, size);
    const l: string[] = doc.splitTextToSize(t, CW);
    ensure(l.length * (size + 2) + 4);
    font("helvetica", style, size);
    color(c);
    l.forEach((line, i) => doc.text(line, M, y + i * (size + 2)));
    y += l.length * (size + 2) + 6;
  };

  interface Col<T> {
    header: string;
    width: number;
    align?: "left" | "right" | "center";
    text: (row: T, i: number) => string;
    sub?: (row: T) => string;
    bold?: boolean;
    pill?: (row: T) => { label: string; rgb: RGB } | null;
    rgb?: (row: T) => RGB | null;
  }

  function table<T>(cols: Col<T>[], rows: T[]) {
    const pad = 7;
    const drawHeader = () => {
      fill(NAVY);
      doc.rect(M, y, CW, 20, "F");
      font("helvetica", "bold", 6.6);
      color([255, 255, 255]);
      let x = M;
      cols.forEach((c) => {
        const t = c.header.toUpperCase();
        if (c.align === "right") textRight(t, x + c.width - pad, y + 13, 0.9);
        else if (c.align === "center") textCenter(t, x + c.width / 2, y + 13, 0.9);
        else doc.text(doc.splitTextToSize(t, c.width - pad * 2)[0] ?? "", x + pad, y + 13, { charSpace: 0.9 });
        x += c.width;
      });
      y += 20;
    };
    ensure(60);
    drawHeader();
    rows.forEach((row, i) => {
      const cellLines = cols.map((c) => {
        font("helvetica", c.bold ? "bold" : "normal", 8.4);
        const main: string[] = c.pill ? [] : doc.splitTextToSize(c.text(row, i) || "—", c.width - pad * 2);
        font("helvetica", "normal", 7.6);
        const sub: string[] = c.sub && c.sub(row) ? doc.splitTextToSize(c.sub(row), c.width - pad * 2) : [];
        return { main, sub };
      });
      const rowH = Math.max(26, ...cellLines.map((l) => l.main.length * 11 + l.sub.length * 10 + 14));
      if (y + rowH > BOTTOM) {
        newPage();
        drawHeader();
      }
      if (i % 2 === 1) {
        fill(ZEBRA);
        doc.rect(M, y, CW, rowH, "F");
      }
      let x = M;
      cols.forEach((c, ci) => {
        const top = y + 15;
        const pill = c.pill?.(row);
        if (pill) {
          font("helvetica", "bold", 6.8);
          const pw = Math.min(c.width - pad * 2, doc.getTextWidth(pill.label.toUpperCase()) + 0.6 * pill.label.length + 12);
          const px = c.align === "center" ? x + (c.width - pw) / 2 : x + pad;
          fill(pill.rgb);
          doc.rect(px, top - 9, pw, 13, "F");
          color([255, 255, 255]);
          textCenter(pill.label.toUpperCase(), px + pw / 2, top, 0.6);
        } else {
          const { main, sub } = cellLines[ci];
          font("helvetica", c.bold ? "bold" : "normal", 8.4);
          color(c.rgb?.(row) ?? (c.bold ? NAVY : INK));
          main.forEach((l, li) => {
            const ly = top + li * 11;
            if (c.align === "right") textRight(l, x + c.width - pad, ly);
            else if (c.align === "center") textCenter(l, x + c.width / 2, ly);
            else doc.text(l, x + pad, ly);
          });
          if (sub.length) {
            font("helvetica", "normal", 7.6);
            color(STEEL);
            sub.forEach((l, li) => doc.text(l, x + pad, top + main.length * 11 + li * 10));
          }
        }
        x += c.width;
      });
      y += rowH;
      draw(RULE);
      doc.setLineWidth(0.5);
      doc.line(M, y, W - M, y);
    });
    y += 14;
  }

  /** Tabla simple de texto con anchos proporcionales. */
  const tablaTexto = (encabezados: string[], filas: string[][], pesos?: number[], alerta?: (fila: string[], col: number) => boolean) => {
    const n = encabezados.length;
    const p = pesos ?? encabezados.map((h, i) => Math.min(6, Math.max(1.4, ...[h, ...filas.map((f) => f[i] ?? "")].map((t) => t.length / 8))));
    const total = p.reduce((s, x) => s + x, 0);
    const cols: Col<string[]>[] = encabezados.map((h, i) => ({
      header: h,
      width: (p[i] / total) * CW,
      text: (f) => f[i] ?? "",
      bold: i === 0 && n > 1,
      rgb: alerta ? (f) => (alerta(f, i) ? ROJO : null) : undefined,
    }));
    table(cols, filas.length ? filas : [encabezados.map(() => "")]);
  };

  const richText = (text: string) => {
    const paragraphs = text.replace(/\r/g, "").split(/\n{2,}/);
    paragraphs.forEach((para, pi) => {
      const t = parseTabla(para);
      if (t) {
        const [enc, ...filas] = t;
        const n = Math.max(enc.length, ...filas.map((f) => f.length));
        const norm = (f: string[]) => Array.from({ length: n }, (_, i) => f[i] ?? "");
        tablaTexto(norm(enc), filas.map(norm));
        return;
      }
      para.split("\n").forEach((raw) => {
        const bullet = /^\s*[-•*]\s+/.test(raw);
        const content = raw.replace(/^\s*[-•*]\s+/, "");
        font("helvetica", "normal", 9.4);
        const indent = bullet ? 14 : 0;
        const wrapped: string[] = doc.splitTextToSize(content, CW - indent);
        wrapped.forEach((l, li) => {
          ensure(13.5);
          font("helvetica", "normal", 9.4);
          color(INK);
          if (bullet && li === 0) {
            fill(GOLD);
            doc.rect(M + 3, y - 4, 3, 3, "F");
          }
          drawJustified(doc, l, M + indent, y, CW - indent, li < wrapped.length - 1);
          y += 13.5;
        });
      });
      if (pi < paragraphs.length - 1) y += 6;
    });
    y += 6;
  };

  const lista = (items: string[]) => richText(items.map((t) => `- ${t}`).join("\n"));

  // ── Láminas y fotos del plano ──
  const medida = (img: Imagen, altoMax: number) => {
    let w = CW;
    let h = (img.alto / img.ancho) * w;
    if (h > altoMax) {
      h = altoMax;
      w = (img.ancho / img.alto) * h;
    }
    return { w, h };
  };
  const imagen = (img: Imagen, altoMax: number, pie?: string) => {
    const { w, h } = medida(img, altoMax);
    ensure(h + (pie ? 30 : 12));
    if (pie) {
      font("helvetica", "bold", 7.2);
      color(NAVY);
      doc.text(pie.toUpperCase(), M, y, { charSpace: 1.2 });
      y += 8;
    }
    const x = M + (CW - w) / 2;
    doc.addImage(img.dataUrl, "JPEG", x, y, w, h);
    draw(RULE);
    doc.setLineWidth(0.7);
    doc.rect(x, y, w, h);
    const caja = { x, y, w, h };
    y += h + 8;
    return caja;
  };

  let numLamina = 1;
  let osmUsado = false;
  let exteriorFalla = false;
  const cacheExterior = new Map<string, LaminaExterior | null>();
  const obtenerExterior = async (clave: string, elementos: ElementoMapa[]): Promise<LaminaExterior | null> => {
    if (!inm || exteriorFalla) return null;
    if (cacheExterior.has(clave)) return cacheExterior.get(clave) ?? null;
    if (inm.perimetro.length < 3 && !elementos.length && !inm.ubicacion) return null;
    const img = await laminaExterior(inm, elementos).catch(() => null);
    if (!img) exteriorFalla = true; // sin red o sin mapa base: no se intenta de nuevo
    cacheExterior.set(clave, img);
    return img;
  };

  const dibujarExterior = (img: LaminaExterior, titulo: string) => {
    const caja = imagen(img, 380, `Lámina ${numLamina++} · ${titulo}`);
    osmUsado = true;
    // Rosa de los vientos (norte arriba).
    const nx = caja.x + caja.w - 26;
    const ny = caja.y + 30;
    fill([255, 255, 255]);
    doc.circle(nx, ny, 16, "F");
    fill(NAVY);
    doc.triangle(nx, ny - 13, nx - 5, ny + 3, nx + 5, ny + 3, "F");
    font("helvetica", "bold", 7.5);
    color(NAVY);
    doc.text("N", nx - 2.4, ny + 12);
    // Escala gráfica aproximada.
    const mPorPt = (img.metrosPorPx * img.ancho) / caja.w;
    const metros = [5, 10, 20, 25, 50, 100, 200, 500].find((m) => m / mPorPt >= 50) ?? 500;
    const largo = metros / mPorPt;
    const ex = caja.x + 12;
    const ey = caja.y + caja.h - 14;
    fill([255, 255, 255]);
    doc.rect(ex - 6, ey - 14, largo + 48, 21, "F");
    fill(NAVY);
    doc.rect(ex, ey - 3, largo / 2, 4, "F");
    draw(NAVY);
    doc.setLineWidth(0.8);
    doc.rect(ex, ey - 3, largo, 4);
    font("helvetica", "normal", 6.8);
    color(NAVY);
    doc.text("0", ex - 2, ey - 6);
    doc.text(`${metros} m`, ex + largo - 6, ey - 6);
  };

  const dibujarCroquis = async (n: Nivel, titulo: string) => {
    if (!n.muros.length && !n.simbolos.length) return false;
    const { svg } = svgCroquis(n, false);
    const img = await aJpeg(svgADataUrl(svg), 1600);
    if (!img) return false;
    imagen(img, 330, `Lámina ${numLamina++} · ${titulo} · ${n.nombre}`);
    return true;
  };

  const rejillaFotos = async (items: { etiqueta: string; foto: FotoRef }[], max = 12) => {
    const piezas: { etiqueta: string; img: Imagen }[] = [];
    for (const it of items.slice(0, max)) {
      const img = await cargarFoto(it.foto);
      if (img) piezas.push({ etiqueta: it.etiqueta, img });
    }
    const ancho = (CW - 16) / 3;
    for (let i = 0; i < piezas.length; i += 3) {
      const fila = piezas.slice(i, i + 3);
      const alto = Math.min(150, Math.max(...fila.map((p) => (p.img.alto / p.img.ancho) * ancho)));
      ensure(alto + 24);
      fila.forEach((p, k) => {
        const h = Math.min(alto, (p.img.alto / p.img.ancho) * ancho);
        const w = (p.img.ancho / p.img.alto) * h;
        doc.addImage(p.img.dataUrl, "JPEG", M + k * (ancho + 8), y, w, h);
        font("helvetica", "normal", 7.2);
        color(STEEL);
        doc.text(doc.splitTextToSize(p.etiqueta, ancho)[0], M + k * (ancho + 8), y + alto + 10);
      });
      y += alto + 22;
    }
  };

  const tablaInventario = (tipos: string[], ambito?: "exterior" | "interior") => {
    if (!contenido) return 0;
    const filas = inventario(contenido, tipos).filter((f) => !ambito || (ambito === "exterior") === (f.ubicacion === "Exterior"));
    if (!filas.length) return 0;
    table<(typeof filas)[number]>(
      [
        { header: "#", width: 32, text: (f) => f.ref, bold: true },
        { header: "Ubicación", width: 78, text: (f) => f.ubicacion },
        { header: "Elemento", width: 92, text: (f) => f.elemento, bold: true },
        { header: "Situación", width: 62, text: (f) => f.situacion },
        { header: "Estado", width: 58, text: (f) => f.estado, rgb: (f) => (f.alerta ? ROJO : null) },
        { header: "Datos y observaciones", width: CW - 32 - 78 - 92 - 62 - 58, text: (f) => f.datos },
      ],
      filas,
    );
    return filas.length;
  };

  const tablaHallazgos = async (hs: Hallazgo[]) => {
    if (!hs.length) return;
    table<Hallazgo>(
      [
        { header: "#", width: 30, text: (_h, i) => String(i + 1).padStart(2, "0") },
        { header: "Hallazgo", width: 160, text: (h) => h.titulo || "Hallazgo sin título", bold: true },
        { header: "Descripción", width: CW - 30 - 160 - 78, text: (h) => h.descripcion ?? "" },
        {
          header: "Severidad",
          width: 78,
          align: "center",
          text: () => "",
          pill: (h) => {
            if (!h.severidad) return null;
            const c = SEVERIDAD_INFO[h.severidad].color.match(/\w\w/g)!.map((x) => parseInt(x, 16)) as RGB;
            return { label: SEVERIDAD_INFO[h.severidad].etiqueta, rgb: c };
          },
        },
      ],
      hs,
    );
    await rejillaFotos(hs.flatMap((h, i) => fotosPublicables(h.fotos).slice(0, 3).map((foto) => ({ etiqueta: `${String(i + 1).padStart(2, "0")}. ${h.titulo}`, foto }))), 9);
  };

  const tablaColindancias = () => {
    if (!inm || inm.perimetro.length < 3) return false;
    const anillo: LngLat[] = inm.perimetro.map((v) => [v.lng, v.lat]);
    tablaTexto(
      ["Lado", "Orientación", "Colinda con", "Largo", "Descripción"],
      lados(anillo).map((l) => {
        const c = inm.colindancias[l.indice] ?? {};
        return [`L${l.indice + 1}`, ORIENTACION_ETIQUETA[c.orientacion ?? l.orientacion], c.tipo ? TIPO_COLINDANCIA_ETIQUETA[c.tipo] : "", `≈ ${l.largo.toFixed(1)} m`, c.descripcion ?? ""];
      }),
      [0.8, 1.6, 1.8, 1.2, 4],
    );
    return true;
  };

  const croquisFiltrado = async (tipos: string[] | null, titulo: string, incluirSinSimbolos = false) => {
    if (!contenido) return 0;
    const niveles = tipos ? filtrarTipos(contenido, tipos).niveles : contenido.niveles;
    let k = 0;
    for (const n of niveles) {
      if (!incluirSinSimbolos && !n.simbolos.length && !n.rutas.length) continue;
      if (await dibujarCroquis(n, titulo)) k++;
    }
    return k;
  };

  /** Imprime lo que el apartado toma del plano. Devuelve true si imprimió medidas o láminas. */
  const vistaPlano = async (vista: VistaPlano): Promise<boolean> => {
    if (!inm || !contenido) {
      nota("Por integrar: elige el inmueble del plano en los datos generales del documento.");
      return false;
    }
    const c = contenido;
    switch (vista) {
      case "georreferencia": {
        const anillo: LngLat[] = inm.perimetro.map((v) => [v.lng, v.lat]);
        const p = inm.ubicacion ? [inm.ubicacion.lng, inm.ubicacion.lat] : puntoInmueble(inm);
        tablaTexto(
          ["Dato", "Valor"],
          [
            ["Coordenadas (latitud, longitud)", p ? `${p[1].toFixed(6)}, ${p[0].toFixed(6)}` : "Sin registrar"],
            ...(inm.municipio ? [["Municipio", inm.municipio]] : []),
            ...(anillo.length >= 3
              ? [
                  ["Superficie del predio", `≈ ${area(anillo).toLocaleString("es-MX", { maximumFractionDigits: 1 })} m²`],
                  ["Perímetro", `≈ ${perimetro(anillo).toLocaleString("es-MX", { maximumFractionDigits: 1 })} m`],
                ]
              : []),
            ["Origen de las medidas", METODO_ETIQUETA[inm.metodo]],
          ],
          [2, 4],
        );
        const img = await obtenerExterior("todo", c.elementos);
        if (img) dibujarExterior(img, "Ubicación del predio y su entorno");
        return true;
      }
      case "colindancias": {
        if (!tablaColindancias()) {
          nota("Por integrar: falta trazar el predio en Inmuebles y plano.");
          return false;
        }
        nota("L1, L2… corresponden a los lados del predio marcados en la lámina exterior.");
        return true;
      }
      case "areas": {
        let hubo = false;
        for (const n of c.niveles) {
          if (!n.muros.length && !n.simbolos.length && !n.espacios.length) continue;
          hubo = (await dibujarCroquis(n, "Croquis")) || hubo;
          if (n.espacios.length) {
            tablaTexto(
              ["Espacio", "Tipo", "Superficie"],
              n.espacios.map((e) => [e.nombre, TIPO_ESPACIO_ETIQUETA[e.tipo] ?? e.tipo, `≈ ${superficie(poligonoEspacio(n, e)).toFixed(1)} m²`]),
              [4, 3, 2],
            );
            hubo = true;
          }
        }
        const fotos = fotosDeElementos(c);
        if (fotos.length) {
          nota("Memoria fotográfica", NAVY, "bold", 8);
          await rejillaFotos(fotos, 12);
        }
        if (!hubo && !fotos.length) nota("Por integrar: el inmueble no tiene croquis ni fotografías.");
        return hubo;
      }
      case "riesgos_internos": {
        const k = await croquisFiltrado(TIPOS_RIESGO, "Riesgos internos");
        const n = tablaInventario(TIPOS_RIESGO, "interior");
        const { internos } = hallazgosPorAmbito(c);
        if (internos.length) {
          nota("Hallazgos del levantamiento", NAVY, "bold", 8);
          await tablaHallazgos(internos);
        }
        if (!k && !n && !internos.length) nota("Sin riesgos internos marcados en el croquis.");
        return k > 0;
      }
      case "riesgos_externos": {
        const ext = filtrarTipos(c, TIPOS_RIESGO).exterior;
        const img = await obtenerExterior("riesgos", ext);
        if (img) dibujarExterior(img, "Entorno y riesgos externos");
        tablaInventario(TIPOS_RIESGO, "exterior");
        if (tablaColindancias()) nota("Colindancias del predio: L1, L2… en la lámina exterior.");
        const { externos } = hallazgosPorAmbito(c);
        if (externos.length) {
          nota("Hallazgos del levantamiento", NAVY, "bold", 8);
          await tablaHallazgos(externos);
        }
        return !!img || inm.perimetro.length >= 3;
      }
      case "equipos_inventario": {
        const n = tablaInventario(TIPOS_EQUIPOS);
        if (!n) nota("Sin equipos contra emergencias capturados en el plano.");
        else nota("Números (1, 2…) = exterior; C1, C2… = croquis de cada nivel, igual que en las láminas de II.8.2. Estado en rojo: requiere atención.");
        return false;
      }
      case "equipos_localizacion": {
        const ext = filtrarTipos(c, TIPOS_EQUIPOS).exterior;
        const img = ext.length ? await obtenerExterior("equipos", ext) : null;
        if (img) dibujarExterior(img, "Equipos contra emergencias en el exterior");
        const k = await croquisFiltrado(TIPOS_EQUIPOS, "Equipos contra emergencias");
        if (!img && !k) nota("Sin equipos contra emergencias ubicados en el plano.");
        return !!img || k > 0;
      }
      case "senalizacion": {
        const n = tablaInventario(TIPOS_SENALIZACION);
        if (!n) nota("Sin señalización capturada en el plano.");
        const fotos = fotosDeElementos(c, TIPOS_SENALIZACION);
        if (fotos.length) await rejillaFotos(fotos, 9);
        return false;
      }
      case "senalizacion_localizacion": {
        const ext = filtrarTipos(c, TIPOS_SENALIZACION).exterior;
        const img = ext.length || inm.rutas.length ? await obtenerExterior("senalizacion", ext) : null;
        if (img) dibujarExterior(img, "Salidas, rutas de evacuación y punto de reunión");
        const k = await croquisFiltrado(TIPOS_SENALIZACION, "Señalización y rutas de evacuación");
        if (!img && !k) nota("Sin señalización ni rutas de evacuación ubicadas en el plano.");
        else nota("Línea verde = ruta de evacuación; PR = punto de reunión; S = salida de emergencia.");
        return !!img || k > 0;
      }
    }
  };

  const levelPill = (lvl: RiskLevel) => ({ label: RISK_LEVEL_LABEL[lvl], rgb: LEVEL_RGB[lvl] });
  const riskId = (i: number) => `R-${String(i + 1).padStart(2, "0")}`;

  const heatmap = () => {
    const cellS = 42;
    const gridW = cellS * 5;
    const labelW = 92;
    const totalH = cellS * 5 + 60;
    ensure(totalH + 30);
    const gx = M + labelW;
    const gy = y + 8;
    for (let p = 5; p >= 1; p--) {
      for (let im = 1; im <= 5; im++) {
        const cx = gx + (im - 1) * cellS;
        const cy = gy + (5 - p) * cellS;
        const rgb = LEVEL_RGB[riskLevel(p * im)];
        const ids = data.risks.map((r, i) => ({ r, i })).filter(({ r }) => r.probability === p && r.impact === im).map(({ i }) => riskId(i));
        const soft: RGB = [0, 1, 2].map((k) => Math.round(rgb[k] + (255 - rgb[k]) * 0.72)) as RGB;
        fill(ids.length ? rgb : soft);
        doc.rect(cx, cy, cellS, cellS, "F");
        draw([255, 255, 255]);
        doc.setLineWidth(1.5);
        doc.rect(cx, cy, cellS, cellS, "S");
        color([255, 255, 255]);
        if (ids.length) {
          font("helvetica", "bold", 6.8);
          const shown = ids.slice(0, 3);
          shown.forEach((id, k) => textCenter(id, cx + cellS / 2, cy + cellS / 2 - (shown.length - 1) * 4.5 + k * 9 + 2.5));
          if (ids.length > 3) textCenter(`+${ids.length - 3}`, cx + cellS / 2, cy + cellS - 5);
        } else {
          font("helvetica", "normal", 6.5);
          textCenter(String(p * im), cx + cellS / 2, cy + cellS / 2 + 2.5);
        }
      }
      font("helvetica", "normal", 7);
      color(INK);
      textRight(`${p} · ${PROBABILITY_LABEL[p]}`, gx - 8, gy + (5 - p) * cellS + cellS / 2 + 2.5);
    }
    for (let im = 1; im <= 5; im++) {
      font("helvetica", "normal", 6.6);
      color(INK);
      (doc.splitTextToSize(`${im} · ${IMPACT_LABEL[im]}`, cellS - 2) as string[]).forEach((l, k) => textCenter(l, gx + (im - 0.5) * cellS, gy + gridW + 12 + k * 8));
    }
    font("helvetica", "bold", 6.8);
    color(STEEL);
    textCenter("IMPACTO", gx + gridW / 2, gy + gridW + 38, 1.6);
    doc.text("PROBABILIDAD", M, gy - 2, { charSpace: 1.6 });
    const lx = gx + gridW + 28;
    let ly = gy + 12;
    doc.text("NIVEL DE RIESGO", lx, ly, { charSpace: 1.4 });
    ly += 16;
    (["critico", "alto", "medio", "bajo"] as RiskLevel[]).forEach((lvl) => {
      fill(LEVEL_RGB[lvl]);
      doc.rect(lx, ly - 8, 11, 11, "F");
      font("helvetica", "normal", 8.4);
      color(INK);
      doc.text(RISK_LEVEL_LABEL[lvl], lx + 18, ly + 1);
      font("helvetica", "bold", 8.4);
      color(NAVY);
      textRight(String(data.risks.filter((r) => riskLevel(riskScore(r)) === lvl).length), W - M, ly + 1);
      ly += 18;
    });
    y = gy + totalH;
  };

  // ── Apartados ──
  for (let i = 0; i < bloques.length; i++) {
    const b = bloques[i];
    if (b.type === "risks") {
      if (!esContinuacion(b, i)) tituloApartado(b.code ?? "", b.title, 1, 60);
      else nota(b.title.toUpperCase(), NAVY, "bold", 7.6);
      if (data.risks.length) {
        table(
          [
            { header: "ID", width: 38, text: (_r, k) => riskId(k), bold: true },
            { header: "Riesgo", width: 168, text: (r) => r.name, bold: true, sub: (r) => [r.cause && `Causa: ${r.cause}`, r.consequence && `Consecuencia: ${r.consequence}`].filter(Boolean).join("\n") },
            { header: "P", width: 24, align: "center", text: (r) => String(r.probability) },
            { header: "I", width: 24, align: "center", text: (r) => String(r.impact) },
            { header: "Nivel", width: 70, align: "center", text: () => "", pill: (r) => levelPill(riskLevel(riskScore(r))) },
            { header: "Controles / tratamiento", width: CW - 38 - 168 - 24 - 24 - 70, text: (r) => r.treatment || r.controls, sub: (r) => (r.treatment && r.controls ? `Controles actuales: ${r.controls}` : "") },
          ],
          data.risks,
        );
      } else nota("Por capturar.");
      continue;
    }
    if (b.type === "heatmap") {
      nota(b.title.toUpperCase(), NAVY, "bold", 7.6);
      heatmap();
      continue;
    }
    if (b.type === "actions") {
      if (!data.actions.length) continue;
      nota(b.title.toUpperCase(), NAVY, "bold", 7.6);
      table(
        [
          { header: "#", width: 30, text: (_r, k) => String(k + 1).padStart(2, "0") },
          { header: "Acción", width: CW - 30 - 66 - 110 - 98, text: (r) => r.action, bold: true },
          {
            header: "Prioridad",
            width: 66,
            align: "center",
            text: () => "",
            pill: (r) => ({ label: PRIORITY_LABEL[r.priority], rgb: LEVEL_RGB[r.priority === "alta" ? "critico" : r.priority === "media" ? "medio" : "bajo"] }),
          },
          { header: "Plazo", width: 110, text: (r) => TERM_LABEL[r.term] },
          { header: "Responsable", width: 98, text: (r) => r.responsible },
        ],
        data.actions,
      );
      continue;
    }
    if (b.type !== "apartado" && b.type !== "plano") continue;

    const depth = profundidad(b.code);
    if (depth === 0) tituloCapitulo(b.code, b.title);
    // Un apartado con lámina no deja su título solo al pie de la hoja: pide espacio para la imagen.
    else tituloApartado(b.code, b.title, depth, b.type === "plano" ? (CON_LAMINA.has(b.vista) ? 340 : 120) : 30);
    paginaDe[b.code] = paginaActual();
    if (!b.contenido) continue; // solo encabezado

    const motivo = pipc.noAplica[b.code];
    if (motivo !== undefined) {
      nota(`No aplica.${motivo.trim() ? ` ${motivo.trim()}` : ""}`, STEEL, "italic", 9);
      continue;
    }
    if (b.norma) nota(`Referencia: ${b.norma}`, STEEL, "italic", 7.4);

    // Contenido generado
    if (b.generado === "clasificacion") {
      const t = textoClasificacion(pipc);
      if (t) richText(t);
      else nota("Por capturar: elige la clasificación en los datos del Programa Interno.");
    } else if (b.generado === "fundamento") {
      lista(BASE_LEGAL);
    } else if (b.generado === "anexos") {
      const anexos = guiaAnexos(template.blocks, pipc);
      nota("Los anexos se integran en la carpeta en este mismo orden.", STEEL, "italic", 8);
      tablaTexto(["Anexo", "Apartado", "Documento"], anexos.map((a, k) => [String(k + 1), a.code, a.title]), [0.8, 1, 6]);
    } else if (b.generado === "bibliografia") {
      lista(bibliografia(template.blocks, pipc));
    }

    // Texto capturado (con los datos que ya trae el expediente)
    let texto = (data.sections[b.key] ?? "").trim();
    if (!texto && b.code === "I.2.1") texto = client.name;
    if (!texto && b.code === "I.2.4") texto = data.meta.location ?? "";
    if (b.code === "II.16" && pipc.variante === "institucional" && pipc.simulacrosMinimos) {
      richText(`Número mínimo de simulacros en el ejercicio: ${pipc.simulacrosMinimos}.`);
    }
    if (texto) richText(texto);

    if (b.type === "plano") {
      const medidas = await vistaPlano(b.vista);
      if (medidas) nota(`${LEYENDA_MEDIDAS} Croquis sin escala.${osmUsado ? " Cartografía base: © colaboradores de OpenStreetMap." : ""}`, STEEL, "italic", 7);
      continue;
    }
    const l = letras(b.contenido);
    if (soloAnexo(b)) nota("Documento anexo: se integra en la carpeta de anexos (ver VII. Guía de anexos).");
    else if (!texto && !b.generado) nota("Por capturar.");
    else if (l.includes("A")) nota("Se anexa el documento firmado (ver VII. Guía de anexos).");
  }

  // ── Cierre: uso del documento, privacidad y firmas ──
  const legal = [
    `Uso del documento. Este Programa Interno se elaboró para ${razonSocial} y para su presentación ante la autoridad de protección civil competente. Su reproducción con otros fines requiere autorización por escrito de ${STRATEC_CONTACT.legalName}.`,
    `Alcance. El contenido refleja las condiciones observadas y la información proporcionada por el establecimiento a la fecha de emisión. Las medidas de las láminas son aproximadas y no sustituyen un levantamiento topográfico.`,
    `Aviso de privacidad. Los datos personales del Programa Interno se tratan conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al contrato de servicio. Consulte el aviso integral en ${STRATEC_CONTACT.privacyUrl} o escriba a ${STRATEC_CONTACT.email}.`,
  ];
  font("helvetica", "normal", 7.6);
  const legalW = CW - 28;
  const legalLines = legal.map((t) => doc.splitTextToSize(t, legalW) as string[]);
  const legalH = legalLines.reduce((s, l) => s + l.length * 10 + 6, 0) + 16;
  y += 14;
  ensure(legalH + 120);
  fill(CREAM);
  doc.rect(M, y, CW, legalH, "F");
  fill(GOLD);
  doc.rect(M, y, 2.5, legalH, "F");
  let ly = y + 16;
  legalLines.forEach((lines) => {
    lines.forEach((line, i) => {
      const justify = i < lines.length - 1;
      if (i === 0) {
        const [head, ...tail] = line.split(".");
        font("helvetica", "bold", 7.6);
        color(NAVY);
        doc.text(`${head}.`, M + 14, ly);
        const hw = doc.getTextWidth(`${head}. `);
        font("helvetica", "normal", 7.6);
        color(STEEL);
        drawJustified(doc, tail.join(".").trimStart(), M + 14 + hw, ly, legalW - hw, justify);
      } else {
        font("helvetica", "normal", 7.6);
        color(STEEL);
        drawJustified(doc, line, M + 14, ly, legalW, justify);
      }
      ly += 10;
    });
    ly += 6;
  });
  y += legalH + 60;
  const sw = (CW - 40) / 2;
  draw(NAVY);
  doc.setLineWidth(0.7);
  doc.line(M, y, M + sw, y);
  doc.line(M + sw + 40, y, W - M, y);
  font("helvetica", "bold", 8);
  color(NAVY);
  doc.text(data.meta.consultant || "Asesor que elabora", M, y + 13);
  doc.text((data.meta.recipient || client.contact || "Representante legal").slice(0, 60), M + sw + 40, y + 13);
  font("helvetica", "normal", 7.5);
  color(STEEL);
  doc.text(`Asesor · ${STRATEC_CONTACT.legalName}`, M, y + 24);
  doc.text(`Representante legal · ${razonSocial}`.slice(0, 70), M + sw + 40, y + 24);

  // ── Índice (se llena al final con el número de página; "---" si no aplica) ──
  {
    let hoja = primeraHojaIndice;
    doc.setPage(hoja);
    let yy = TOP;
    font("helvetica", "bold", 8);
    color(NAVY);
    doc.text("ÍNDICE", M, yy, { charSpace: 2 });
    yy += 28;
    for (const b of enIndice) {
      if (yy + altoEntrada(b) > BOTTOM) {
        hoja++;
        doc.setPage(hoja);
        yy = TOP;
      }
      const depth = profundidad(b.code);
      const na = b.code in pipc.noAplica;
      const pag = na ? "---" : paginaDe[b.code] ? String(paginaDe[b.code] - 1) : "";
      if (depth === 0) yy += 10;
      const x = M + Math.min(depth, 3) * 12;
      font(depth === 0 ? "times" : "helvetica", depth === 0 ? "bold" : "normal", depth === 0 ? 11 : 8.4);
      color(depth === 0 ? GOLD : STEEL);
      doc.text(b.code, x, yy);
      const tx = x + (depth === 0 ? 34 : 44);
      color(na ? STEEL : depth === 0 ? NAVY : INK);
      const maxW = W - M - 40 - tx;
      let t = b.title;
      if (doc.getTextWidth(t) > maxW) {
        while (t.length > 3 && doc.getTextWidth(`${t}…`) > maxW) t = t.slice(0, -1);
        t = `${t.trimEnd()}…`;
      }
      doc.text(t, tx, yy);
      font("helvetica", "normal", 8.4);
      color(na ? STEEL : NAVY);
      textRight(pag, W - M, yy);
      draw(RULE);
      doc.setLineWidth(0.3);
      doc.line(tx, yy + 4, W - M, yy + 4);
      yy += IDX_LH;
    }
  }

  // ── Pie de página (excepto portada) ──
  const pages = doc.getNumberOfPages();
  for (let p = 2; p <= pages; p++) {
    doc.setPage(p);
    fill(GOLD);
    doc.rect(M, H - 46, CW, 0.8, "F");
    font("helvetica", "normal", 6.8);
    color(STEEL);
    doc.text(`${STRATEC_CONTACT.legalName}  ·  ${STRATEC_CONTACT.web}  ·  Programa Interno de Protección Civil ${pipc.ejercicio}`, M, H - 32);
    textRight(`${folio}  ·  Página ${p - 1} de ${pages - 1}`, W - M, H - 32);
  }

  doc.setProperties({ title: `${docTitle} — ${razonSocial}`, subject: template.name, author: STRATEC_CONTACT.legalName, creator: "STRATEC Dashboard" });
  return { doc, fileName };
}
