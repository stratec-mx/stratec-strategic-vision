// Generador de documentos entregables (diagnóstico, análisis de riesgo, etc.)
// con la identidad de STRATEC. Usa la misma carga de jsPDF y paleta que la
// propuesta económica (quotePdf.ts).
import {
  loadJsPdf, loadImageDataUrl, formatLongDate, parseLocalDate, slug, STRATEC_CONTACT, drawJustified,
  NAVY_DEEP, NAVY, GOLD, STEEL, INK, MUTED, ZEBRA, RULE, CREAM,
} from "@/lib/quotePdf";
import {
  type DocumentData, type DocumentTemplate, type RiskLevel,
  SEVERITY_LABEL, PRIORITY_LABEL, TERM_LABEL, VERDICT_LABEL, RISK_LEVEL_LABEL, LEVEL_RGB, SEVERITY_TO_LEVEL,
  PROBABILITY_LABEL, IMPACT_LABEL, riskScore, riskLevel,
} from "@/lib/documentTemplates";

type RGB = [number, number, number];

export interface DocumentPdfInput {
  template: DocumentTemplate;
  folio: string;
  data: DocumentData;
  client: { name: string; contact?: string | null };
}

export const documentFileName = (i: Pick<DocumentPdfInput, "template" | "folio" | "client">) =>
  [slug(i.template.name), slug(i.folio) || "SIN-FOLIO", slug(i.client.name) || "Cliente"].join("_") + ".pdf";

const VERDICT_RGB: Record<string, RGB> = {
  favorable: LEVEL_RGB.bajo,
  condicionado: LEVEL_RGB.medio,
  no_favorable: LEVEL_RGB.critico,
};

async function buildDocumentPdf(input: DocumentPdfInput): Promise<{ doc: any; fileName: string }> {
  const { template, folio, data, client } = input;
  const jsPDF = await loadJsPdf();
  const mark = await loadImageDataUrl("/brand/stratec-mark-white.png");

  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54;
  const CW = W - M * 2;
  const BOTTOM = H - 74;
  const clientRef = client.name.trim().replace(/\.+$/, "");
  const issue = data.meta.issueDate ? parseLocalDate(data.meta.issueDate) : new Date();
  const docTitle = data.meta.title?.trim() || template.name;

  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const draw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (family: "helvetica" | "times", style: "normal" | "bold" | "italic", size: number) => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  const spacedWidth = (t: string, cs: number) => doc.getTextWidth(t) + cs * Math.max(0, t.length - 1);
  const textRight = (t: string, x: number, y: number, cs = 0) => doc.text(t, x - spacedWidth(t, cs), y, cs ? { charSpace: cs } : undefined);
  const textCenter = (t: string, cx: number, y: number, cs = 0) => doc.text(t, cx - spacedWidth(t, cs) / 2, y, cs ? { charSpace: cs } : undefined);

  let y = 0;

  // ── Portada ──────────────────────────────────────────────────────────────
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

  y = 300;
  font("helvetica", "bold", 8.5);
  color(GOLD);
  doc.text(template.name.toUpperCase(), M, y, { charSpace: 2.4 });
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
  const clientLines: string[] = doc.splitTextToSize(client.name, CW - 20);
  doc.text(clientLines, M, y);
  y += clientLines.length * 18;
  if (data.meta.location) {
    font("helvetica", "normal", 9.5);
    color(MUTED);
    const loc: string[] = doc.splitTextToSize(data.meta.location, CW - 20);
    doc.text(loc, M, y + 6);
  }

  // Ficha inferior
  const fy = H - 190;
  draw([60, 72, 96]);
  doc.setLineWidth(0.6);
  doc.line(M, fy, W - M, fy);
  const coverCells: [string, string][] = [
    ["FOLIO", folio],
    ...(data.meta.visitDate ? ([["INSPECCIÓN", formatLongDate(parseLocalDate(data.meta.visitDate))]] as [string, string][]) : []),
    ["EMISIÓN", formatLongDate(issue)],
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
  doc.text("DOCUMENTO CONFIDENCIAL", M, H - 74, { charSpace: 2 });
  font("helvetica", "normal", 7);
  color(MUTED);
  doc.text(doc.splitTextToSize(`Para uso exclusivo de ${clientRef}. Prohibida su reproducción o distribución sin autorización por escrito de ${STRATEC_CONTACT.legalName}.`, CW), M, H - 61);
  doc.text(`${STRATEC_CONTACT.email}  ·  ${STRATEC_CONTACT.phone}  ·  ${STRATEC_CONTACT.web}`, M, H - 40);

  // ── Páginas interiores ──────────────────────────────────────────────────
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
    y = 70;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) newPage();
  };

  newPage();

  // Índice: se numera cada bloque que se va a imprimir
  const printable = template.blocks.filter((b) => {
    if (b.type === "text") return (data.sections[b.key] ?? "").trim().length > 0;
    if (b.type === "findings") return data.findings.length > 0;
    if (b.type === "risks" || b.type === "heatmap") return data.risks.length > 0;
    if (b.type === "actions") return data.actions.length > 0;
    return true;
  });

  font("helvetica", "bold", 8);
  color(NAVY);
  doc.text("CONTENIDO", M, y, { charSpace: 2 });
  y += 20;
  printable.forEach((b, i) => {
    font("times", "normal", 12);
    color(GOLD);
    doc.text(String(i + 1).padStart(2, "0"), M, y);
    color(NAVY);
    doc.text(b.title, M + 30, y);
    draw(RULE);
    doc.setLineWidth(0.4);
    doc.line(M, y + 7, W - M, y + 7);
    y += 22;
  });
  y += 16;

  // Ficha del documento
  const ficha: [string, string][] = [
    ["Cliente", client.name],
    ["Atención", data.meta.recipient || client.contact || ""],
    ["Ubicación", data.meta.location || ""],
    ["Fecha de inspección", data.meta.visitDate ? formatLongDate(parseLocalDate(data.meta.visitDate)) : ""],
    ["Fecha de emisión", formatLongDate(issue)],
    ["Elaboró", data.meta.consultant || STRATEC_CONTACT.legalName],
  ].filter(([, v]) => v) as [string, string][];
  font("helvetica", "normal", 8.6);
  const fichaH = ficha.reduce((s, [, v]) => s + (doc.splitTextToSize(v, CW - 150) as string[]).length * 12 + 6, 0) + 22;
  ensure(fichaH);
  fill(CREAM);
  doc.rect(M, y, CW, fichaH, "F");
  fill(GOLD);
  doc.rect(M, y, 2.5, fichaH, "F");
  let fyy = y + 18;
  ficha.forEach(([k, v]) => {
    font("helvetica", "bold", 7);
    color(STEEL);
    doc.text(k.toUpperCase(), M + 16, fyy, { charSpace: 1.2 });
    font("helvetica", "normal", 8.6);
    color(INK);
    const lines: string[] = doc.splitTextToSize(v, CW - 150);
    doc.text(lines, M + 140, fyy);
    fyy += lines.length * 12 + 6;
  });
  y += fichaH + 10;

  // ── Utilidades de contenido ──
  const sectionTitle = (n: number, title: string, minContent = 40) => {
    ensure(70 + minContent);
    y += 18;
    font("times", "normal", 22);
    color(GOLD);
    doc.text(String(n).padStart(2, "0"), M, y);
    font("times", "normal", 17);
    color(NAVY);
    const tl: string[] = doc.splitTextToSize(title, CW - 40);
    doc.text(tl, M + 36, y - 1);
    y += (tl.length - 1) * 19 + 10;
    fill(GOLD);
    doc.rect(M + 36, y, 34, 1.2, "F");
    y += 18;
  };

  const richText = (text: string) => {
    const paragraphs = text.replace(/\r/g, "").split(/\n{2,}/);
    paragraphs.forEach((para, pi) => {
      const lines = para.split("\n");
      lines.forEach((raw) => {
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

  interface Col<T> {
    header: string;
    width: number;
    align?: "left" | "right" | "center";
    /** Texto principal y opcionalmente secundario (gris, debajo) */
    text: (row: T, i: number) => string;
    sub?: (row: T) => string;
    bold?: boolean;
    pill?: (row: T) => { label: string; rgb: RGB } | null;
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
        else doc.text(t, x + pad, y + 13, { charSpace: 0.9 });
        x += c.width;
      });
      y += 20;
    };
    ensure(60);
    drawHeader();
    rows.forEach((row, i) => {
      // medir
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
          color(c.bold ? NAVY : INK);
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

  const levelPill = (lvl: RiskLevel) => ({ label: RISK_LEVEL_LABEL[lvl], rgb: LEVEL_RGB[lvl] });
  const riskId = (i: number) => `R-${String(i + 1).padStart(2, "0")}`;

  const heatmap = () => {
    const cellS = 46;
    const gridW = cellS * 5;
    const labelW = 92;
    const totalH = cellS * 5 + 60;
    ensure(totalH + 40);
    const gx = M + labelW;
    const gy = y + 8;
    for (let p = 5; p >= 1; p--) {
      for (let im = 1; im <= 5; im++) {
        const cx = gx + (im - 1) * cellS;
        const cy = gy + (5 - p) * cellS;
        const lvl = riskLevel(p * im);
        const rgb = LEVEL_RGB[lvl];
        // tono suave para la celda, intenso si contiene riesgos
        const ids = data.risks
          .map((r, i) => ({ r, i }))
          .filter(({ r }) => r.probability === p && r.impact === im)
          .map(({ i }) => riskId(i));
        const soft: RGB = [
          Math.round(rgb[0] + (255 - rgb[0]) * 0.72),
          Math.round(rgb[1] + (255 - rgb[1]) * 0.72),
          Math.round(rgb[2] + (255 - rgb[2]) * 0.72),
        ];
        fill(ids.length ? rgb : soft);
        doc.rect(cx, cy, cellS, cellS, "F");
        draw([255, 255, 255]);
        doc.setLineWidth(1.5);
        doc.rect(cx, cy, cellS, cellS, "S");
        if (ids.length) {
          font("helvetica", "bold", 6.8);
          color([255, 255, 255]);
          const shown = ids.slice(0, 3);
          shown.forEach((id, k) => textCenter(id, cx + cellS / 2, cy + cellS / 2 - (shown.length - 1) * 4.5 + k * 9 + 2.5));
          if (ids.length > 3) textCenter(`+${ids.length - 3}`, cx + cellS / 2, cy + cellS - 5);
        } else {
          font("helvetica", "normal", 6.5);
          color([255, 255, 255]);
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
      const lbl: string[] = doc.splitTextToSize(`${im} · ${IMPACT_LABEL[im]}`, cellS - 2);
      lbl.forEach((l, k) => textCenter(l, gx + (im - 0.5) * cellS, gy + gridW + 12 + k * 8));
    }
    font("helvetica", "bold", 6.8);
    color(STEEL);
    textCenter("IMPACTO", gx + gridW / 2, gy + gridW + 38, 1.6);
    doc.text("PROBABILIDAD", M, gy - 2, { charSpace: 1.6 });

    // Leyenda + conteo por nivel
    const lx = gx + gridW + 28;
    let ly = gy + 12;
    font("helvetica", "bold", 6.8);
    color(STEEL);
    doc.text("NIVEL DE RIESGO", lx, ly, { charSpace: 1.4 });
    ly += 16;
    (["critico", "alto", "medio", "bajo"] as RiskLevel[]).forEach((lvl) => {
      const count = data.risks.filter((r) => riskLevel(riskScore(r)) === lvl).length;
      fill(LEVEL_RGB[lvl]);
      doc.rect(lx, ly - 8, 11, 11, "F");
      font("helvetica", "normal", 8.4);
      color(INK);
      doc.text(`${RISK_LEVEL_LABEL[lvl]}`, lx + 18, ly + 1);
      font("helvetica", "bold", 8.4);
      color(NAVY);
      textRight(String(count), W - M, ly + 1);
      ly += 18;
    });
    y = gy + totalH;
  };

  // ── Bloques ──
  printable.forEach((b, idx) => {
    const need = b.type === "heatmap" ? 300 : b.type === "text" ? 30 : b.type === "verdict" ? 60 : 70;
    sectionTitle(idx + 1, b.title, need);
    if (b.type === "text") {
      richText(data.sections[b.key] ?? "");
    } else if (b.type === "findings") {
      table(
        [
          { header: "#", width: 30, text: (_r, i) => String(i + 1).padStart(2, "0") },
          { header: "Área", width: 110, text: (r) => r.area, bold: true },
          { header: "Hallazgo", width: CW - 30 - 110 - 78, text: (r) => r.description },
          { header: "Severidad", width: 78, align: "center", text: () => "", pill: (r) => ({ label: SEVERITY_LABEL[r.severity], rgb: LEVEL_RGB[SEVERITY_TO_LEVEL[r.severity]] }) },
        ],
        data.findings,
      );
    } else if (b.type === "risks") {
      table(
        [
          { header: "ID", width: 38, text: (_r, i) => riskId(i), bold: true },
          {
            header: "Riesgo",
            width: 168,
            text: (r) => r.name,
            bold: true,
            sub: (r) => [r.cause && `Causa: ${r.cause}`, r.consequence && `Consecuencia: ${r.consequence}`].filter(Boolean).join("\n"),
          },
          { header: "P", width: 24, align: "center", text: (r) => String(r.probability) },
          { header: "I", width: 24, align: "center", text: (r) => String(r.impact) },
          { header: "Nivel", width: 70, align: "center", text: () => "", pill: (r) => levelPill(riskLevel(riskScore(r))) },
          {
            header: "Controles / tratamiento",
            width: CW - 38 - 168 - 24 - 24 - 70,
            text: (r) => r.treatment || r.controls,
            sub: (r) => (r.treatment && r.controls ? `Controles actuales: ${r.controls}` : ""),
          },
        ],
        data.risks,
      );
    } else if (b.type === "heatmap") {
      heatmap();
    } else if (b.type === "actions") {
      table(
        [
          { header: "#", width: 30, text: (_r, i) => String(i + 1).padStart(2, "0") },
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
    } else if (b.type === "verdict" && data.verdict) {
      ensure(70);
      const rgb = VERDICT_RGB[data.verdict];
      fill(rgb);
      doc.rect(M, y, CW, 46, "F");
      font("helvetica", "bold", 7);
      color([255, 255, 255]);
      doc.text("DETERMINACIÓN TÉCNICA", M + 18, y + 18, { charSpace: 1.8 });
      font("times", "bold", 17);
      doc.text(VERDICT_LABEL[data.verdict].toUpperCase(), M + 18, y + 36, { charSpace: 1 });
      y += 58;
      // La resolución solo la emite la autoridad: se aclara junto a la determinación
      font("helvetica", "italic", 7.8);
      color(STEEL);
      const note: string[] = doc.splitTextToSize(
        "La determinación técnica es una opinión profesional de STRATEC Security. No constituye resolución, autorización ni visto bueno; estos corresponden exclusivamente a la autoridad competente.",
        CW,
      );
      note.forEach((l, li) => drawJustified(doc, l, M, y + li * 10, CW, li < note.length - 1));
      y += note.length * 10 + 14;
    }
  });

  // ── Cierre: confidencialidad, privacidad y firmas ──
  const legal = [
    `Confidencialidad. Este documento contiene información sensible sobre la seguridad de ${client.name} y es para su uso exclusivo. Queda prohibida su reproducción, distribución o divulgación total o parcial sin autorización por escrito de ${STRATEC_CONTACT.legalName}. Se recomienda restringir su consulta al personal que lo requiera.`,
    `Alcance. Las conclusiones reflejan las condiciones observadas en la fecha de inspección y la información proporcionada por el cliente. Cambios posteriores en las instalaciones, la operación o el entorno pueden modificar el nivel de riesgo.`,
    ...(template.blocks.some((b) => b.type === "verdict")
      ? [`Naturaleza del documento. La determinación técnica contenida en este dictamen es una opinión profesional de ${STRATEC_CONTACT.legalName} basada en la evidencia recabada. No sustituye las resoluciones, autorizaciones o vistos buenos que corresponde emitir a la autoridad competente.`]
      : []),
    `Aviso de privacidad. Los datos personales recabados para la elaboración de este documento se tratan conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Consulte el aviso integral en ${STRATEC_CONTACT.privacyUrl} o escriba a ${STRATEC_CONTACT.email}.`,
  ];
  font("helvetica", "normal", 7.6);
  const legalLines = legal.map((t) => doc.splitTextToSize(t, CW - 28) as string[]);
  const legalH = legalLines.reduce((s, l) => s + l.length * 10 + 6, 0) + 16;
  y += 10;
  ensure(legalH + 120);
  fill(CREAM);
  doc.rect(M, y, CW, legalH, "F");
  fill(GOLD);
  doc.rect(M, y, 2.5, legalH, "F");
  let ly = y + 16;
  const legalW = CW - 28;
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
  doc.text(data.meta.consultant || "Consultor responsable", M, y + 13);
  doc.text((data.meta.recipient || client.contact || "Recibe").slice(0, 60), M + sw + 40, y + 13);
  font("helvetica", "normal", 7.5);
  color(STEEL);
  doc.text(`Elaboró · ${STRATEC_CONTACT.legalName}`, M, y + 24);
  doc.text(`Recibió · ${client.name}`.slice(0, 70), M + sw + 40, y + 24);

  // ── Pie de página (excepto portada) ──
  const pages = doc.getNumberOfPages();
  for (let p = 2; p <= pages; p++) {
    doc.setPage(p);
    fill(GOLD);
    doc.rect(M, H - 46, CW, 0.8, "F");
    font("helvetica", "normal", 6.8);
    color(STEEL);
    doc.text(`${STRATEC_CONTACT.legalName}  ·  ${STRATEC_CONTACT.web}  ·  Documento confidencial`, M, H - 32);
    textRight(`${folio}  ·  Página ${p - 1} de ${pages - 1}`, W - M, H - 32);
  }

  doc.setProperties({
    title: `${docTitle} — ${client.name}`,
    subject: template.name,
    author: STRATEC_CONTACT.legalName,
    creator: "STRATEC Dashboard",
  });
  return { doc, fileName: documentFileName(input) };
}

export async function previewDocumentPdf(input: DocumentPdfInput): Promise<{ url: string; fileName: string; blob: Blob }> {
  const { doc, fileName } = await buildDocumentPdf(input);
  const blob: Blob = doc.output("blob");
  return { url: URL.createObjectURL(blob), fileName, blob };
}
