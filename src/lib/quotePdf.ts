// Generador de la propuesta económica formal (PDF) de STRATEC.
// jsPDF se carga desde CDN al momento de generar (igual que Leaflet en el mapa),
// así no agrega peso al bundle del sitio público.

const JSPDF_URL = "https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js";

declare global {
  interface Window {
    jspdf?: { jsPDF: any };
  }
}

let jspdfPromise: Promise<any> | null = null;

export function loadJsPdf(): Promise<any> {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jspdfPromise) return jspdfPromise;
  jspdfPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSPDF_URL;
    script.async = true;
    script.onload = () =>
      window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error("jsPDF no disponible"));
    script.onerror = () => {
      jspdfPromise = null;
      script.remove();
      reject(new Error("No se pudo cargar el generador de PDF. Revisa tu conexión."));
    };
    document.body.appendChild(script);
  });
  return jspdfPromise;
}

export async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Datos ──────────────────────────────────────────────────────────────────

export interface QuotePdfItem {
  code: string;
  title: string;
  description?: string;
  qty: number;
  unit_price: number;
}

export interface QuotePdfData {
  number: string;
  issuedAt: Date;
  /** YYYY-MM-DD */
  validUntil?: string | null;
  currency: string;
  taxRate: number;
  client: { name: string; contact?: string | null; email?: string | null; phone?: string | null };
  items: QuotePdfItem[];
  notes?: string | null;
}

export const STRATEC_CONTACT = {
  legalName: "STRATEC Security",
  tagline: "Consultoría Estratégica de Seguridad",
  email: "contacto@stratecsecurity.com",
  phone: "+52 220 648 8688",
  web: "www.stratecsecurity.com",
  privacyUrl: "www.stratecsecurity.com/privacidad",
};

// ─── Utilidades de formato ─────────────────────────────────────────────────

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export const parseLocalDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const formatLongDate = (d: Date) => `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;

const CURRENCY_INFO: Record<string, { name: string; plural: string; suffix: string; symbol: string }> = {
  MXN: { name: "Pesos mexicanos", plural: "PESOS", suffix: "M.N.", symbol: "$" },
  USD: { name: "Dólares estadounidenses", plural: "DÓLARES", suffix: "USD", symbol: "US$" },
  EUR: { name: "Euros", plural: "EUROS", suffix: "EUR", symbol: "€" },
};

export const formatMoney = (n: number, currency: string) =>
  `${CURRENCY_INFO[currency]?.symbol ?? ""}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const UNITS = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const TEENS = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
const TWENTIES = ["VEINTE", "VEINTIÚN", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
const TENS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const HUNDREDS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function under1000(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = HUNDREDS[h];
  let rest = "";
  if (r < 10) rest = UNITS[r];
  else if (r < 20) rest = TEENS[r - 10];
  else if (r < 30) rest = TWENTIES[r - 20];
  else rest = TENS[Math.floor(r / 10)] + (r % 10 ? ` Y ${UNITS[r % 10]}` : "");
  return [out, rest].filter(Boolean).join(" ");
}

export function numberToSpanishWords(n: number): string {
  n = Math.floor(n);
  if (n === 0) return "CERO";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? "UN MILLÓN" : `${numberToSpanishWords(millions)} MILLONES`);
  if (thousands) parts.push(thousands === 1 ? "MIL" : `${under1000(thousands)} MIL`);
  if (rest) parts.push(under1000(rest));
  return parts.join(" ");
}

export function amountInWords(total: number, currency: string): string {
  const info = CURRENCY_INFO[currency] ?? { plural: currency, suffix: currency };
  const rounded = Math.round(total * 100) / 100;
  const int = Math.floor(rounded);
  const cents = Math.round((rounded - int) * 100);
  const millionsExact = int >= 1_000_000 && int % 1_000_000 === 0;
  return `(${numberToSpanishWords(int)}${millionsExact ? " DE" : ""} ${info.plural} ${String(cents).padStart(2, "0")}/100 ${info.suffix})`;
}

export const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");

export const quoteFileName = (d: Pick<QuotePdfData, "number" | "client" | "issuedAt">) => {
  const iso = `${d.issuedAt.getFullYear()}-${String(d.issuedAt.getMonth() + 1).padStart(2, "0")}-${String(d.issuedAt.getDate()).padStart(2, "0")}`;
  return ["Propuesta_STRATEC", slug(d.number) || "SIN-FOLIO", slug(d.client.name) || "Cliente", iso].join("_") + ".pdf";
};

/**
 * Dibuja un renglón justificado: reparte el espacio sobrante entre palabras
 * para que llegue al margen derecho. La última línea de un párrafo (justify =
 * false) y los renglones que quedarían con huecos muy grandes se alinean a la
 * izquierda, como en un documento formal. Usa la fuente activa del documento.
 */
export function drawJustified(doc: any, line: string, x: number, y: number, width: number, justify: boolean) {
  const words = line.trim().split(/\s+/);
  if (!justify || words.length < 2) {
    doc.text(line.trim(), x, y);
    return;
  }
  const wordsWidth = words.reduce((s, w) => s + doc.getTextWidth(w), 0);
  const gap = (width - wordsWidth) / (words.length - 1);
  // Solo se amplía el espacio: si el renglón ya está justo (o excede el ancho),
  // se dibuja con su espaciado normal para que las palabras nunca se encimen.
  const space = doc.getTextWidth(" ");
  if (gap < space || gap > space * 4) {
    doc.text(line.trim(), x, y);
    return;
  }
  let cx = x;
  for (const w of words) {
    doc.text(w, cx, y);
    cx += doc.getTextWidth(w) + gap;
  }
}

// ─── Paleta STRATEC (RGB) ───────────────────────────────────────────────────
export const NAVY_DEEP: [number, number, number] = [7, 19, 39];
export const NAVY: [number, number, number] = [11, 30, 60];
export const GOLD: [number, number, number] = [196, 160, 74];
export const STEEL: [number, number, number] = [94, 100, 110];
export const INK: [number, number, number] = [38, 44, 56];
export const MUTED: [number, number, number] = [196, 202, 214];
export const ZEBRA: [number, number, number] = [247, 247, 244];
export const RULE: [number, number, number] = [222, 222, 216];
export const CREAM: [number, number, number] = [248, 245, 237];

// ─── Generación ─────────────────────────────────────────────────────────────

/** Construye el documento jsPDF de la propuesta (sin descargarlo). */
async function buildQuotePdf(data: QuotePdfData): Promise<{ doc: any; fileName: string }> {
  const jsPDF = await loadJsPdf();
  const mark = await loadImageDataUrl("/brand/stratec-mark-white.png");

  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const W = doc.internal.pageSize.getWidth(); // 612
  const H = doc.internal.pageSize.getHeight(); // 792
  const M = 48;
  const CW = W - M * 2;
  const BOTTOM = H - 72;

  // Nombre del cliente sin punto final, para no duplicar puntos en las frases ("C.V..")
  const clientRef = data.client.name.trim().replace(/\.+$/, "");
  const subtotal = data.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const tax = subtotal * (data.taxRate / 100);
  const total = subtotal + tax;
  const validDate = data.validUntil ? parseLocalDate(data.validUntil) : null;
  const validDays = validDate
    ? Math.round((validDate.getTime() - new Date(data.issuedAt.getFullYear(), data.issuedAt.getMonth(), data.issuedAt.getDate()).getTime()) / 86_400_000)
    : null;

  const color = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const draw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (family: "helvetica" | "times", style: "normal" | "bold" | "italic" | "bolditalic", size: number) => {
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
    textRight(`PROPUESTA ECONÓMICA · ${data.number}`, W - M, 23, 1);
  };

  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      continuationHeader();
      y = 64;
    }
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

  const paragraph = (text: string, size = 9, lh = 13, c: [number, number, number] = INK, indent = 0) => {
    font("helvetica", "normal", size);
    // Cada salto de línea escrito por el usuario es un párrafo propio
    const lines: { t: string; last: boolean }[] = text.split("\n").flatMap((para) => {
      const w: string[] = doc.splitTextToSize(para, CW - indent);
      return w.map((t, i) => ({ t, last: i === w.length - 1 }));
    });
    for (const { t: line, last } of lines) {
      ensure(lh);
      font("helvetica", "normal", size);
      color(c);
      drawJustified(doc, line, M + indent, y, CW - indent, !last);
      y += lh;
    }
  };

  // ── Encabezado de portada ──
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
  textRight("PROPUESTA ECONÓMICA", W - M, 50, 2);
  font("times", "normal", 21);
  color([255, 255, 255]);
  textRight(data.number, W - M, 76);
  font("helvetica", "normal", 8);
  color(MUTED);
  textRight(`Emitida el ${formatLongDate(data.issuedAt)}`, W - M, 94);

  // ── Datos del cliente y vigencia ──
  y = 156;
  const colR = M + 340;
  font("helvetica", "bold", 6.8);
  color(STEEL);
  doc.text("PREPARADA PARA", M, y, { charSpace: 1.6 });
  doc.text("VIGENCIA DE LA PROPUESTA", colR, y, { charSpace: 1.6 });

  let yl = y + 18;
  font("times", "bold", 15);
  color(NAVY);
  const clientLines: string[] = doc.splitTextToSize(data.client.name, 320);
  doc.text(clientLines, M, yl);
  yl += clientLines.length * 17;
  font("helvetica", "normal", 9);
  color(INK);
  if (data.client.contact) {
    doc.text(`At'n: ${data.client.contact}`, M, yl);
    yl += 13;
  }
  const contactLine = [data.client.email, data.client.phone].filter(Boolean).join("  ·  ");
  if (contactLine) {
    color(STEEL);
    doc.text(contactLine, M, yl);
    yl += 13;
  }

  let yr = y + 18;
  font("helvetica", "bold", 10.5);
  color(NAVY);
  doc.text(validDate ? formatLongDate(validDate) : "30 días naturales", colR, yr);
  yr += 13;
  font("helvetica", "normal", 8);
  color(STEEL);
  doc.text(validDays && validDays > 0 ? `${validDays} días naturales a partir de su emisión` : "a partir de su fecha de emisión", colR, yr);
  yr += 20;
  font("helvetica", "bold", 6.8);
  doc.text("MONEDA", colR, yr, { charSpace: 1.6 });
  yr += 13;
  font("helvetica", "normal", 9);
  color(INK);
  doc.text(`${data.currency} — ${CURRENCY_INFO[data.currency]?.name ?? data.currency}`, colR, yr);
  yr += 13;

  y = Math.max(yl, yr) + 14;
  draw(RULE);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 22;

  paragraph(
    `Agradecemos la oportunidad de presentar esta propuesta a ${clientRef}. A continuación se detallan los servicios, alcances e inversión correspondientes, conforme a las necesidades identificadas con su organización.`,
    9.2,
    13.5,
  );
  y += 12;

  // ── Tabla de conceptos ──
  const cols = { code: 64, concept: 252, qty: 44, unit: 78, amount: 78 };
  const x = {
    code: M,
    concept: M + cols.code,
    qty: M + cols.code + cols.concept,
    unit: M + cols.code + cols.concept + cols.qty,
    amount: M + cols.code + cols.concept + cols.qty + cols.unit,
  };
  const tableHeader = () => {
    fill(NAVY);
    doc.rect(M, y, CW, 22, "F");
    font("helvetica", "bold", 6.8);
    color([255, 255, 255]);
    const ty = y + 14;
    doc.text("CÓDIGO", x.code + 8, ty, { charSpace: 1.2 });
    doc.text("CONCEPTO", x.concept + 8, ty, { charSpace: 1.2 });
    textRight("CANT.", x.qty + cols.qty - 8, ty, 1.2);
    textRight("P. UNITARIO", x.unit + cols.unit - 8, ty, 1.2);
    textRight("IMPORTE", x.amount + cols.amount - 8, ty, 1.2);
    y += 22;
  };

  sectionTitle("Conceptos e inversión");
  ensure(60);
  tableHeader();

  data.items.forEach((it, idx) => {
    font("helvetica", "bold", 9);
    const titleLines: string[] = doc.splitTextToSize(it.title || "Concepto", cols.concept - 16);
    font("helvetica", "normal", 8);
    const descLines: string[] = it.description ? doc.splitTextToSize(it.description, cols.concept - 16) : [];
    const rowH = 10 + titleLines.length * 11.5 + descLines.length * 10.5 + 9;

    if (y + rowH > BOTTOM) {
      doc.addPage();
      continuationHeader();
      y = 64;
      tableHeader();
    }
    if (idx % 2 === 1) {
      fill(ZEBRA);
      doc.rect(M, y, CW, rowH, "F");
    }
    const top = y + 15;
    font("helvetica", "bold", 8);
    color(GOLD);
    doc.text(it.code || "—", x.code + 8, top);

    font("helvetica", "bold", 9);
    color(NAVY);
    doc.text(titleLines, x.concept + 8, top, { lineHeightFactor: 1.28 });
    let dy = top + titleLines.length * 11.5;
    if (descLines.length) {
      font("helvetica", "normal", 8);
      color(STEEL);
      doc.text(descLines, x.concept + 8, dy, { lineHeightFactor: 1.31 });
    }

    font("helvetica", "normal", 9);
    color(INK);
    textRight(String(it.qty), x.qty + cols.qty - 8, top);
    textRight(formatMoney(it.unit_price, data.currency), x.unit + cols.unit - 8, top);
    font("helvetica", "bold", 9);
    color(NAVY);
    textRight(formatMoney(it.qty * it.unit_price, data.currency), x.amount + cols.amount - 8, top);

    y += rowH;
    draw(RULE);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
  });

  // ── Totales ──
  y += 14;
  ensure(96);
  const tw = 236;
  const tx = W - M - tw;
  font("helvetica", "normal", 9);
  color(STEEL);
  doc.text("Subtotal", tx + 10, y + 4);
  color(INK);
  textRight(formatMoney(subtotal, data.currency), W - M - 10, y + 4);
  y += 17;
  color(STEEL);
  doc.text(`IVA (${Number(data.taxRate.toFixed(2))}%)`, tx + 10, y + 4);
  color(INK);
  textRight(formatMoney(tax, data.currency), W - M - 10, y + 4);
  y += 12;
  fill(NAVY_DEEP);
  doc.rect(tx, y, tw, 30, "F");
  fill(GOLD);
  doc.rect(tx, y, 3, 30, "F");
  font("helvetica", "bold", 7.5);
  color(GOLD);
  doc.text("TOTAL", tx + 14, y + 19, { charSpace: 2 });
  font("times", "bold", 14);
  color([255, 255, 255]);
  textRight(`${formatMoney(total, data.currency)} ${data.currency}`, W - M - 10, y + 20);
  y += 44;
  font("helvetica", "italic", 7.8);
  color(STEEL);
  const words: string[] = doc.splitTextToSize(`Importe con letra: ${amountInWords(total, data.currency)}`, CW);
  for (const l of words) {
    ensure(11);
    font("helvetica", "italic", 7.8);
    color(STEEL);
    textRight(l, W - M, y);
    y += 11;
  }
  y += 18;

  // ── Observaciones ──
  if (data.notes && data.notes.trim()) {
    sectionTitle("Alcance y observaciones");
    paragraph(data.notes.trim(), 8.8, 12.5);
    y += 14;
  }

  // ── Condiciones comerciales ──
  sectionTitle("Condiciones comerciales");
  const vigencia = validDate
    ? `La presente propuesta tiene vigencia hasta el ${formatLongDate(validDate)}. Transcurrido ese plazo, precios, alcances y disponibilidad quedan sujetos a revisión.`
    : "La presente propuesta tiene una vigencia de 30 días naturales a partir de su fecha de emisión. Transcurrido ese plazo, precios, alcances y disponibilidad quedan sujetos a revisión.";
  const conditions = [
    vigencia,
    `Los importes se expresan en ${CURRENCY_INFO[data.currency]?.name.toLowerCase() ?? data.currency}${data.taxRate > 0 ? " e incluyen el IVA desglosado" : "; no incluyen impuestos"}.`,
    "El alcance se limita a los conceptos descritos en este documento. Cualquier servicio adicional o modificación de alcance se cotizará por separado.",
    "Las fechas de inicio y el calendario de trabajo se confirman a la aceptación por escrito de esta propuesta y, en su caso, a la recepción del anticipo acordado.",
    "La forma de pago, viáticos fuera de la zona metropolitana y demás condiciones particulares serán las indicadas en las observaciones o en el contrato de prestación de servicios.",
  ];
  conditions.forEach((c, i) => {
    font("helvetica", "normal", 8.4);
    const lines: string[] = doc.splitTextToSize(c, CW - 16);
    ensure(lines.length * 11.5 + 4);
    font("helvetica", "bold", 8.4);
    color(GOLD);
    doc.text(`${i + 1}.`, M, y);
    font("helvetica", "normal", 8.4);
    color(INK);
    lines.forEach((l, li) => drawJustified(doc, l, M + 16, y + li * 11.5, CW - 16, li < lines.length - 1));
    y += lines.length * 11.5 + 4;
  });
  y += 14;

  // ── Confidencialidad y aviso de privacidad ──
  const legal = [
    {
      t: "Confidencialidad.",
      b: `Este documento y su contenido (metodología, precios y hallazgos) son confidenciales y para uso exclusivo de ${clientRef}. Queda prohibida su reproducción, distribución o divulgación total o parcial a terceros sin autorización por escrito de STRATEC Security.`,
    },
    {
      t: "Aviso de privacidad.",
      b: `Los datos personales proporcionados para la elaboración de esta propuesta son tratados por STRATEC Security conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, únicamente para fines de contacto, cotización y prestación de los servicios. Puede consultar el aviso de privacidad integral y ejercer sus derechos ARCO en ${STRATEC_CONTACT.privacyUrl} o escribiendo a ${STRATEC_CONTACT.email}.`,
    },
  ];
  font("helvetica", "normal", 7.6);
  const legalLines = legal.map((l) => doc.splitTextToSize(`${l.t} ${l.b}`, CW - 26) as string[]);
  const legalH = legalLines.reduce((s, l) => s + l.length * 10, 0) + 18 + 6;
  ensure(legalH);
  fill(CREAM);
  doc.rect(M, y, CW, legalH, "F");
  fill(GOLD);
  doc.rect(M, y, 2.5, legalH, "F");
  let ly = y + 15;
  const legalW = CW - 26;
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
  y += legalH + 30;

  // ── Aceptación ──
  ensure(90);
  sectionTitle("Aceptación");
  y += 36;
  const sw = (CW - 40) / 2;
  draw(NAVY);
  doc.setLineWidth(0.7);
  doc.line(M, y, M + sw, y);
  doc.line(M + sw + 40, y, W - M, y);
  font("helvetica", "bold", 8);
  color(NAVY);
  doc.text("Por STRATEC Security", M, y + 13);
  doc.text(`Por ${data.client.name}`.slice(0, 60), M + sw + 40, y + 13);
  font("helvetica", "normal", 7.5);
  color(STEEL);
  doc.text("Nombre, cargo y firma", M, y + 24);
  doc.text("Nombre, cargo, firma y fecha de aceptación", M + sw + 40, y + 24);

  // ── Pie de página en todas las hojas ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    fill(GOLD);
    doc.rect(M, H - 46, CW, 0.8, "F");
    font("helvetica", "normal", 6.8);
    color(STEEL);
    doc.text(`${STRATEC_CONTACT.legalName}  ·  ${STRATEC_CONTACT.email}  ·  ${STRATEC_CONTACT.phone}  ·  ${STRATEC_CONTACT.web}`, M, H - 32);
    textRight(`${data.number}  ·  Página ${p} de ${pages}`, W - M, H - 32);
    font("helvetica", "italic", 6.3);
    doc.text("Documento confidencial", M, H - 22);
  }

  const fileName = quoteFileName(data);
  doc.setProperties({
    title: `Propuesta económica ${data.number} — ${data.client.name}`,
    subject: "Propuesta económica STRATEC Security",
    author: "STRATEC Security",
    creator: "STRATEC Dashboard",
  });
  return { doc, fileName };
}

/** Descarga la propuesta como archivo PDF. Devuelve el nombre de archivo. */
export async function downloadQuotePdf(data: QuotePdfData): Promise<string> {
  const { doc, fileName } = await buildQuotePdf(data);
  doc.save(fileName);
  return fileName;
}

/** Genera la propuesta y devuelve una URL temporal (blob) para previsualizarla. */
export async function previewQuotePdf(data: QuotePdfData): Promise<{ url: string; fileName: string; blob: Blob }> {
  const { doc, fileName } = await buildQuotePdf(data);
  const blob: Blob = doc.output("blob");
  return { url: URL.createObjectURL(blob), fileName, blob };
}

/** Descarga un PDF ya generado (desde la vista previa) sin volver a construirlo. */
export function saveBlob(blob: Blob, fileName: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
