// PDF del diagnóstico básico gratuito (/diagnostico).
// Se importa de forma diferida desde la página: jsPDF se descarga solo al
// generar el archivo.
import {
  loadJsPdf,
  loadImageDataUrl,
  saveBlob,
  slug,
  formatLongDate,
  drawJustified,
  STRATEC_CONTACT,
  NAVY_DEEP,
  NAVY,
  GOLD,
  STEEL,
  INK,
  MUTED,
  ZEBRA,
  RULE,
  CREAM,
} from "@/lib/quotePdf";

type RGB = [number, number, number];

export interface DiagnosticoPdfData {
  date: Date;
  name?: string;
  org?: string;
  giro?: string;
  estado?: string;
  score: string;
  levelLabel: string;
  levelBody: string;
  levelColor: string;
  failed: { short: string; riesgo: string; service: string }[];
  passed: string[];
  services: { short: string; url: string }[];
}

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export async function downloadDiagnosticoPdf(d: DiagnosticoPdfData): Promise<void> {
  const jsPDF = await loadJsPdf();
  const mark = await loadImageDataUrl("/brand/stratec-mark-white.png");
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  const BOTTOM = H - 70;
  const levelRgb = hexToRgb(d.levelColor);

  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const font = (style: "normal" | "bold" | "italic", size: number, family: "helvetica" | "times" = "helvetica") => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  const textRight = (t: string, x: number, y: number, cs = 0) =>
    doc.text(t, x - (doc.getTextWidth(t) + cs * Math.max(0, t.length - 1)), y, cs ? { charSpace: cs } : undefined);

  let y = 0;
  const header = (first: boolean) => {
    const h = first ? 112 : 38;
    fill(NAVY_DEEP);
    doc.rect(0, 0, W, h, "F");
    fill(GOLD);
    doc.rect(0, h, W, first ? 2.5 : 1.5, "F");
    if (first) {
      if (mark) doc.addImage(mark, "PNG", M, 34, 44, 42);
      font("normal", 18);
      color([255, 255, 255]);
      doc.text("STRATEC", M + 56, 54, { charSpace: 3 });
      font("normal", 7);
      color(GOLD);
      doc.text("SECURITY", M + 57, 66, { charSpace: 2.6 });
      font("bold", 7.5);
      textRight("DIAGNÓSTICO BÁSICO DE SEGURIDAD", W - M, 48, 1.6);
      font("normal", 17, "times");
      color([255, 255, 255]);
      textRight("Autoevaluación gratuita", W - M, 72);
      font("normal", 8);
      color(MUTED);
      textRight(`Generado el ${formatLongDate(d.date)}`, W - M, 90);
    } else {
      if (mark) doc.addImage(mark, "PNG", M, 10, 19, 18);
      font("normal", 10);
      color([255, 255, 255]);
      doc.text("STRATEC", M + 26, 23, { charSpace: 2 });
      font("normal", 7.5);
      color(MUTED);
      textRight("DIAGNÓSTICO BÁSICO DE SEGURIDAD", W - M, 23, 1);
    }
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      header(false);
      y = 66;
    }
  };
  const section = (t: string) => {
    ensure(46);
    fill(GOLD);
    doc.rect(M, y - 6, 5, 5, "F");
    font("bold", 8);
    color(NAVY);
    doc.text(t.toUpperCase(), M + 11, y - 1, { charSpace: 1.6 });
    y += 16;
  };
  const paragraph = (t: string, size = 9, lh = 13, c: RGB = INK, indent = 0) => {
    font("normal", size);
    const lines: string[] = doc.splitTextToSize(t, CW - indent);
    lines.forEach((l, i) => {
      ensure(lh);
      font("normal", size);
      color(c);
      drawJustified(doc, l, M + indent, y, CW - indent, i < lines.length - 1);
      y += lh;
    });
  };

  header(true);
  y = 146;

  // ── Datos ──
  const who = [d.org, d.name].filter(Boolean).join(" · ");
  const meta = [d.giro, d.estado].filter(Boolean).join(" · ");
  font("bold", 6.8);
  color(STEEL);
  doc.text("PREPARADO PARA", M, y, { charSpace: 1.6 });
  y += 17;
  font("bold", 14, "times");
  color(NAVY);
  doc.text((doc.splitTextToSize(who || "Organización participante", CW) as string[]).slice(0, 2), M, y);
  y += who.length > 70 ? 32 : 16;
  if (meta) {
    font("normal", 9);
    color(STEEL);
    doc.text(meta, M, y);
    y += 14;
  }
  y += 14;

  // ── Resultado ──
  const boxH = 92;
  fill(CREAM);
  doc.rect(M, y, CW, boxH, "F");
  fill(levelRgb);
  doc.rect(M, y, 4, boxH, "F");
  font("bold", 34, "times");
  color(levelRgb);
  doc.text(d.score, M + 22, y + 50);
  const sw = doc.getTextWidth(d.score);
  font("normal", 13);
  color(STEEL);
  doc.text("/10", M + 26 + sw, y + 50);
  font("bold", 7);
  color(STEEL);
  doc.text("PUNTAJE DE PREPARACIÓN", M + 22, y + 70, { charSpace: 1.2 });
  const bx = M + 150;
  font("bold", 13);
  color(levelRgb);
  doc.text(d.levelLabel, bx, y + 28);
  font("normal", 8.6);
  color(INK);
  const body: string[] = doc.splitTextToSize(d.levelBody, CW - (bx - M) - 16);
  doc.text(body.slice(0, 4), bx, y + 44, { lineHeightFactor: 1.4 });
  y += boxH + 30;

  // ── Áreas con vulnerabilidad ──
  if (d.failed.length) {
    section(`Áreas a atender (${d.failed.length})`);
    d.failed.forEach((f, i) => {
      font("normal", 8.4);
      const lines: string[] = doc.splitTextToSize(f.riesgo, CW - 150);
      const rowH = 18 + lines.length * 11 + 8;
      ensure(rowH);
      if (i % 2 === 0) {
        fill(ZEBRA);
        doc.rect(M, y - 4, CW, rowH, "F");
      }
      font("bold", 9.2);
      color(NAVY);
      doc.text(f.short, M + 10, y + 10);
      font("normal", 8.4);
      color(STEEL);
      doc.text(lines, M + 10, y + 24, { lineHeightFactor: 1.3 });
      font("bold", 7.2);
      color(GOLD);
      textRight(f.service.toUpperCase(), W - M - 10, y + 10, 0.6);
      y += rowH;
    });
    y += 16;
  }

  // ── Áreas en orden ──
  if (d.passed.length) {
    section(`Áreas en orden (${d.passed.length})`);
    d.passed.forEach((p) => {
      ensure(14);
      fill([46, 125, 50]);
      doc.circle(M + 13, y - 3, 2, "F");
      font("normal", 9);
      color(INK);
      doc.text(p, M + 22, y);
      y += 14;
    });
    y += 14;
  }

  // ── Plan de acción ──
  section("Plan de acción sugerido");
  // Las preguntas van en orden de prioridad: las primeras áreas fallidas son las más urgentes
  // Minúscula inicial salvo siglas ("CCTV y control…")
  const names = d.failed.map((f) => (/^[A-ZÁÉÍÓÚ][a-záéíóúñ]/.test(f.short) ? f.short.charAt(0).toLowerCase() + f.short.slice(1) : f.short));
  const joinEs = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}` : xs[0]);
  const steps = d.failed.length
    ? [
        `Atiende primero: ${joinEs(names.slice(0, 3))}.`,
        ...(names.length > 3 ? [`Después: ${joinEs(names.slice(3))}.`] : []),
        "Asigna un responsable y una fecha a cada acción, y verifica que se cumpla.",
        "Documenta lo realizado y revísalo al menos una vez al año o cuando cambie el inmueble o el personal.",
      ]
    : [
        "Mantén al día procedimientos, equipos y capacitación, y revisa tus condiciones de seguridad al menos una vez al año.",
        "Una auditoría periódica ayuda a detectar riesgos que una autoevaluación no alcanza a ver.",
      ];
  steps.forEach((s, i) => {
    font("normal", 8.8);
    const lines: string[] = doc.splitTextToSize(s, CW - 18);
    ensure(lines.length * 12 + 4);
    font("bold", 8.8);
    color(GOLD);
    doc.text(`${i + 1}.`, M, y);
    font("normal", 8.8);
    color(INK);
    lines.forEach((l, li) => drawJustified(doc, l, M + 18, y + li * 12, CW - 18, li < lines.length - 1));
    y += lines.length * 12 + 5;
  });
  y += 14;

  // ── Servicios recomendados ──
  if (d.services.length) {
    section("Servicios que pueden ayudarte");
    d.services.forEach((s) => {
      ensure(15);
      font("bold", 9);
      color(NAVY);
      doc.text(s.short, M + 10, y);
      const w = doc.getTextWidth(s.short);
      font("normal", 8.4);
      color(STEEL);
      doc.textWithLink(`  ·  stratecsecurity.com${s.url}`, M + 10 + w, y, { url: `https://www.stratecsecurity.com${s.url}` });
      y += 15;
    });
    y += 14;
  }

  // ── Alcance del diagnóstico ──
  font("normal", 7.8);
  const scope =
    "Alcance. Este es un diagnóstico básico generado automáticamente a partir de tus respuestas. Sirve como punto de partida: no sustituye una evaluación en sitio ni la revisión de la autoridad competente. Para un análisis completo de tu organización, agenda una evaluación con STRATEC.";
  const scopeLines: string[] = doc.splitTextToSize(scope, CW - 26);
  const sh = scopeLines.length * 10.5 + 22;
  ensure(sh + 60);
  fill(CREAM);
  doc.rect(M, y, CW, sh, "F");
  fill(GOLD);
  doc.rect(M, y, 2.5, sh, "F");
  font("normal", 7.8);
  color(STEEL);
  scopeLines.forEach((l, i) => drawJustified(doc, l, M + 14, y + 15 + i * 10.5, CW - 26, i < scopeLines.length - 1));
  y += sh + 22;

  font("bold", 9.5);
  color(NAVY);
  doc.text("¿Quieres el siguiente paso?", M, y);
  y += 14;
  paragraph(`Escríbenos a ${STRATEC_CONTACT.email}, por WhatsApp al ${STRATEC_CONTACT.phone} o agenda en ${STRATEC_CONTACT.web}/schedule.`, 8.8, 12.5);

  // ── Pie ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    fill(GOLD);
    doc.rect(M, H - 46, CW, 0.8, "F");
    font("normal", 6.8);
    color(STEEL);
    doc.text(`${STRATEC_CONTACT.legalName}  ·  ${STRATEC_CONTACT.email}  ·  ${STRATEC_CONTACT.phone}  ·  ${STRATEC_CONTACT.web}`, M, H - 32);
    textRight(`Página ${p} de ${pages}`, W - M, H - 32);
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  }

  doc.setProperties({
    title: "Diagnóstico básico de seguridad — STRATEC",
    subject: "Diagnóstico básico de seguridad",
    author: "STRATEC Security",
    creator: "stratecsecurity.com",
  });
  const iso = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, "0")}-${String(d.date.getDate()).padStart(2, "0")}`;
  const fileName = ["Diagnostico_STRATEC", slug(d.org || d.name || "") || "basico", iso].join("_") + ".pdf";
  saveBlob(doc.output("blob"), fileName);
}
