/**
 * STRATEC · Telegram Bot — Generador de posts con IA
 * ─────────────────────────────────────────────────────
 * Flujo /genera [tema]:
 *   → imagen (DALL-E 3 → Fal.ai Flux.1 Pro → Leonardo, en cascada) + caption (Claude)
 *   → preview en Telegram con botones
 *   → ✅ Publicar ahora / 📅 Programar → Facebook + LinkedIn
 *   → 🔄 Regenerar → nueva imagen + caption
 *
 * Flujo foto desde teléfono:
 *   → Envía imagen como FOTO o como ARCHIVO al bot (se publica sin modificar)
 *   → caption opcional = tema ("seguridad industrial Morelos")
 *   → Claude Vision analiza la imagen y genera captions
 *   → ✅ Publicar ahora / 📅 Programar → Facebook + LinkedIn
 *   → 🔄 Nueva caption → misma imagen, texto nuevo
 *
 * Estado persistente (en el repo):
 *   public/social-posts/.telegram-offset       — último update_id procesado
 *   public/social-posts/pending/UUID.json      — metadata + captions del post
 *   public/social-posts/pending/UUID.png       — imagen final (no en el JSON)
 *   public/social-posts/pending/UUID-raw.png   — imagen original sin overlay
 *
 * Variables de entorno (GitHub Secrets):
 *   TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, FAL_API_KEY, LEONARDO_API_KEY,
 *   ANTHROPIC_API_KEY, FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID,
 *   LINKEDIN_ACCESS_TOKEN (secret: Token_Likedin), LINKEDIN_ORG_ID
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, "..");
const PENDING_DIR = join(ROOT, "public", "social-posts", "pending");
const OFFSET_FILE = join(ROOT, "public", "social-posts", ".telegram-offset");

const {
  TELEGRAM_BOT_TOKEN,
  OPENAI_API_KEY,
  FAL_API_KEY,
  LEONARDO_API_KEY,
  ANTHROPIC_API_KEY,
  FACEBOOK_PAGE_ACCESS_TOKEN,
  FACEBOOK_PAGE_ID,
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORG_ID,
  LINKEDIN_PERSON_URN,
} = process.env;

const TG = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// mapa chatId → pendingId del preview activo (para modificación por chat)
const activePending = new Map();

// fetch con timeout explícito — evita que cuelgue indefinidamente
async function fetchConTimeout(url, opts, timeoutMs = 120_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Estado ────────────────────────────────────────────────────────────────────

function getOffset() {
  if (!existsSync(OFFSET_FILE)) return 0;
  return parseInt(readFileSync(OFFSET_FILE, "utf8").trim()) || 0;
}

function saveOffset(offset) {
  writeFileSync(OFFSET_FILE, String(offset));
}

function savePending(data) {
  if (!existsSync(PENDING_DIR)) mkdirSync(PENDING_DIR, { recursive: true });
  const id   = randomUUID();
  const meta = { ...data };

  // Store images as separate PNG files — keeps JSON tiny and git push fast
  if (data.imageBase64) {
    writeFileSync(join(PENDING_DIR, `${id}.png`), Buffer.from(data.imageBase64, "base64"));
    delete meta.imageBase64;
  }
  if (data.rawImageBase64) {
    writeFileSync(join(PENDING_DIR, `${id}-raw.png`), Buffer.from(data.rawImageBase64, "base64"));
    delete meta.rawImageBase64;
  }

  writeFileSync(join(PENDING_DIR, `${id}.json`), JSON.stringify(meta));
  return id;
}

function readPending(id) {
  const file = join(PENDING_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  const meta = JSON.parse(readFileSync(file, "utf8"));

  const imgFile = join(PENDING_DIR, `${id}.png`);
  const rawFile = join(PENDING_DIR, `${id}-raw.png`);
  if (existsSync(imgFile)) meta.imageBase64    = readFileSync(imgFile).toString("base64");
  if (existsSync(rawFile)) meta.rawImageBase64 = readFileSync(rawFile).toString("base64");

  return meta;
}

function updatePendingImage(id, imageBuffer) {
  writeFileSync(join(PENDING_DIR, `${id}.png`), imageBuffer);
}

function deletePending(id) {
  for (const suffix of [".json", ".png", "-raw.png"]) {
    const f = join(PENDING_DIR, `${id}${suffix}`);
    if (existsSync(f)) unlinkSync(f);
  }
}

function updatePendingMeta(id, updates) {
  const file = join(PENDING_DIR, `${id}.json`);
  if (!existsSync(file)) return;
  const meta = JSON.parse(readFileSync(file, "utf8"));
  writeFileSync(file, JSON.stringify({ ...meta, ...updates }));
}

// ── Telegram helpers ──────────────────────────────────────────────────────────

async function tg(method, body = {}) {
  const res = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) console.warn(`Telegram ${method} error:`, data.description);
  return data;
}

const sendMessage = (chatId, text, extra = {}) =>
  tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });

async function sendPhotoBuffer(chatId, imageBuffer, caption, keyboard) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("reply_markup", JSON.stringify({ inline_keyboard: keyboard }));
  form.append("photo", new Blob([imageBuffer], { type: "image/png" }), "stratec-post.png");
  const res = await fetch(`${TG}/sendPhoto`, { method: "POST", body: form });
  return res.json();
}

async function sendMediaGroup(chatId, buffers, firstCaption) {
  const media = buffers.map((_, i) => ({
    type: "photo",
    media: `attach://slide${i}`,
    ...(i === 0 ? { caption: firstCaption, parse_mode: "HTML" } : {}),
  }));
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("media", JSON.stringify(media));
  buffers.forEach((buf, i) =>
    form.append(`slide${i}`, new Blob([buf], { type: "image/png" }), `slide${i}.png`)
  );
  const res = await fetch(`${TG}/sendMediaGroup`, { method: "POST", body: form });
  return res.json();
}

const editCaption = (chatId, messageId, caption) =>
  tg("editMessageCaption", {
    chat_id: chatId, message_id: messageId, caption, parse_mode: "HTML",
    reply_markup: { inline_keyboard: [] },
  });

const answerCb = (id, text = "") =>
  tg("answerCallbackQuery", { callback_query_id: id, text });

const getUpdates = (offset) =>
  tg("getUpdates", { offset, timeout: 5, limit: 3, allowed_updates: ["message", "callback_query"] });

// ── Infografía corporativa con Sharp + SVG ────────────────────────────────────

function xmlEsc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function svgTextLines(text, maxChars, x, startY, lh, sz, fill, weight) {
  const words = String(text || "").split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (t.length <= maxChars) { cur = t; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return {
    svg: lines.map((l, i) =>
      `<text x="${x}" y="${startY + i * lh}" font-family="Liberation Sans,Arial,sans-serif" ` +
      `font-size="${sz}" fill="${fill}" font-weight="${weight || "normal"}">${xmlEsc(l)}</text>`
    ).join("\n"),
    count: lines.length,
  };
}

function buildSVGOverlay(categoria, titular, subtitulo, puntos, W, H) {
  const lp = 68;   // left padding
  const BH = 178;  // bottom bar height
  let y    = 86;
  let c    = "";

  const catTxt = String(categoria || "SEGURIDAD INSTITUCIONAL").toUpperCase();
  const catW   = Math.min(480, catTxt.length * 9.5 + 44);

  // 0. Left edge gold accent stripe (full height above bottom bar)
  c += `\n<rect x="0" y="0" width="6" height="${H - BH}" fill="#c9a227" opacity="0.80"/>`;

  // 1. Category badge — outlined pill with fill
  c += `
<rect x="${lp}" y="${y}" width="${catW}" height="38" rx="5" fill="#c9a22718" stroke="#c9a22770" stroke-width="1.5"/>
<text x="${lp + 16}" y="${y + 25}" font-family="Liberation Sans,Arial,sans-serif" font-size="12" fill="#c9a227" font-weight="bold" letter-spacing="2.5">${xmlEsc(catTxt)}</text>`;
  y += 70;

  // 2. Headline — 66px bold, wrap at 17 chars
  const tit = svgTextLines(titular || "SEGURIDAD QUE FUNCIONA", 17, lp, y, 78, 66, "white", "bold");
  c += `\n${tit.svg}`;
  y += tit.count * 78 + 20;

  // 3. Gold accent divider — wider
  c += `\n<rect x="${lp}" y="${y}" width="120" height="4" rx="2" fill="#c9a227"/>`;
  y += 38;

  // 4. Subtitle — 24px gold, wrap at 40 chars
  if (subtitulo) {
    const sub = svgTextLines(subtitulo, 40, lp, y, 34, 24, "#c9a227", "normal");
    c += `\n${sub.svg}`;
    y += sub.count * 34 + 36;
  } else {
    y += 18;
  }

  // 5. Numbered bullet boxes — 01/02/03 gold squares with white text
  const pts     = Array.isArray(puntos) ? puntos.slice(0, 3) : [];
  const boxSize = 48;
  const textX   = lp + boxSize + 22;
  for (let i = 0; i < pts.length; i++) {
    const num  = String(i + 1).padStart(2, "0");
    const boxY = y;
    c += `
<rect x="${lp}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="6" fill="#c9a227"/>
<text x="${lp + boxSize / 2}" y="${boxY + 32}" font-family="Liberation Sans,Arial,sans-serif" font-size="20" fill="#060d15" font-weight="bold" text-anchor="middle">${num}</text>`;
    const bLines = svgTextLines(String(pts[i]), 36, textX, boxY + 20, 26, 20, "white", "normal");
    c += `\n${bLines.svg}`;
    y += Math.max(boxSize, bLines.count * 26) + 18;
  }

  // 6. CTA separator + text
  y += 18;
  c += `\n<rect x="${lp}" y="${y}" width="520" height="1" fill="#c9a22755"/>`;
  y += 26;
  c += `\n<text x="${lp}" y="${y}" font-family="Liberation Sans,Arial,sans-serif" font-size="14" fill="#c9a22795" letter-spacing="0.5">Diagnóstico sin costo · stratecsecurity.com</text>`;

  // 7. Service tags — richer with fill + border
  const tagY   = H - BH - 90;
  const tagW   = 285;
  const tagH   = 50;
  const tagGap = 14;
  const tags   = ["ANÁLISIS DE RIESGOS", "ESTRATEGIAS A MEDIDA", "COBERTURA NACIONAL"];
  for (let i = 0; i < 3; i++) {
    const tx = lp + i * (tagW + tagGap);
    if (tx + tagW > W - 30) break;
    c += `
<rect x="${tx}" y="${tagY}" width="${tagW}" height="${tagH}" rx="6" fill="#c9a22720" stroke="#c9a22785" stroke-width="1.5"/>
<text x="${tx + tagW / 2}" y="${tagY + 32}" font-family="Liberation Sans,Arial,sans-serif" font-size="13" fill="#c9a227" font-weight="bold" text-anchor="middle" letter-spacing="1.5">${tags[i]}</text>`;
  }

  // 8. Bottom STRATEC bar
  const mid = Math.round(W / 2);
  c += `
<rect x="0" y="${H - BH}" width="${W}" height="${BH}" fill="#060d15" opacity="0.97"/>
<rect x="0" y="${H - BH}" width="${W}" height="4" fill="#c9a227"/>
<rect x="${mid}" y="${H - BH + 24}" width="1" height="${BH - 48}" fill="#c9a22750"/>
<text x="${lp}" y="${H - 88}" font-family="Liberation Sans,Arial,sans-serif" font-size="40" fill="white" font-weight="bold">STRATEC</text>
<text x="${lp}" y="${H - 50}" font-family="Liberation Sans,Arial,sans-serif" font-size="13" fill="#c9a227" letter-spacing="3">CONSULTORÍA EN SEGURIDAD</text>
<text x="${mid + 44}" y="${H - 86}" font-family="Liberation Sans,Arial,sans-serif" font-size="22" fill="white" font-weight="bold">stratecsecurity.com</text>
<text x="${mid + 44}" y="${H - 50}" font-family="Liberation Sans,Arial,sans-serif" font-size="13" fill="#c9a22799">Análisis · Estrategia · Soluciones</text>`;

  // Gradient: dense dark on left (text zone), opens right (geometric texture visible)
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="panelFade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
    <stop offset="0"    stop-color="#07101d" stop-opacity="0.97"/>
    <stop offset="0.62" stop-color="#07101d" stop-opacity="0.93"/>
    <stop offset="0.80" stop-color="#07101d" stop-opacity="0.30"/>
    <stop offset="1"    stop-color="#07101d" stop-opacity="0.04"/>
  </linearGradient>
</defs>
<rect x="0" y="0" width="${W}" height="${H - BH}" fill="url(#panelFade)"/>
${c}
</svg>`;
}

async function buildInfografia(photoBuffer, captionData) {
  const W = 1080, H = 1080;

  // Fondo geométrico — el gradiente SVG oscurece la zona del texto
  const photo = await sharp(photoBuffer)
    .resize(W, H, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.62 })
    .png().toBuffer();

  const overlay = Buffer.from(buildSVGOverlay(
    captionData.categoria, captionData.titular,
    captionData.subtitulo, captionData.puntos,
    W, H
  ));

  return sharp(photo)
    .composite([{ input: overlay, left: 0, top: 0 }])
    .png().toBuffer();
}

// ── Carrusel — Helpers SVG ────────────────────────────────────────────────────

function svgCenteredLines(text, maxChars, cx, startY, lh, sz, fill, weight) {
  const words = String(text || "").split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (t.length <= maxChars) { cur = t; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return {
    svg: lines.map((l, i) =>
      `<text x="${cx}" y="${startY + i * lh}" font-family="Liberation Sans,Arial,sans-serif" ` +
      `font-size="${sz}" fill="${fill}" font-weight="${weight || "normal"}" text-anchor="middle">${xmlEsc(l)}</text>`
    ).join("\n"),
    count: lines.length,
  };
}

function _barraStratec(lp, mid, W, H, BH) {
  return `
<rect x="0" y="${H - BH}" width="${W}" height="${BH}" fill="#060d15" opacity="0.98"/>
<rect x="0" y="${H - BH}" width="${W}" height="3" fill="#c9a227"/>
<rect x="${mid}" y="${H - BH + 22}" width="1" height="${BH - 44}" fill="#c9a22750"/>
<text x="${lp}" y="${H - 82}" font-family="Liberation Sans,Arial,sans-serif" font-size="40" fill="white" font-weight="bold">STRATEC</text>
<text x="${lp}" y="${H - 46}" font-family="Liberation Sans,Arial,sans-serif" font-size="13" fill="#c9a227" letter-spacing="3">CONSULTORÍA EN SEGURIDAD</text>
<text x="${mid + 44}" y="${H - 80}" font-family="Liberation Sans,Arial,sans-serif" font-size="22" fill="white" font-weight="bold">stratecsecurity.com</text>
<text x="${mid + 44}" y="${H - 48}" font-family="Liberation Sans,Arial,sans-serif" font-size="13" fill="#c9a22799">Análisis · Estrategia · Soluciones</text>`;
}

function buildSVGSlidePortada(categoria, portada, slideTotal, W, H) {
  const BH = 160, lp = 70, mid = Math.round(W / 2);
  const catTxt = String(categoria || "SEGURIDAD INSTITUCIONAL").toUpperCase();
  let c = "";

  c += `<text x="${W - 48}" y="52" font-family="Liberation Sans,Arial,sans-serif" font-size="16" fill="#c9a22799" text-anchor="end">1 / ${slideTotal}</text>`;

  c += `
<rect x="${lp}" y="78" width="320" height="36" rx="4" fill="#c9a22718"/>
<rect x="${lp}" y="78" width="4" height="36" rx="2" fill="#c9a227"/>
<text x="${lp + 18}" y="102" font-family="Liberation Sans,Arial,sans-serif" font-size="11" fill="#c9a227" font-weight="bold" letter-spacing="2">${xmlEsc(catTxt)}</text>`;

  const tit = svgTextLines(portada.titular || "", 20, lp, 310, 76, 66, "white", "bold");
  c += `\n${tit.svg}`;
  let y = 310 + tit.count * 76 + 28;

  c += `\n<rect x="${lp}" y="${y}" width="100" height="4" rx="2" fill="#c9a227"/>`;
  y += 38;

  if (portada.subtitulo) {
    const sub = svgTextLines(portada.subtitulo, 40, lp, y, 38, 26, "#c9a227", "normal");
    c += `\n${sub.svg}`;
    y += sub.count * 38 + 36;
  }

  c += `\n<text x="${lp}" y="${H - BH - 32}" font-family="Liberation Sans,Arial,sans-serif" font-size="14" fill="#c9a22780">→ Desliza para ver más</text>`;

  c += _barraStratec(lp, mid, W, H, BH);

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
    <stop offset="0"    stop-color="#07101d" stop-opacity="0.96"/>
    <stop offset="0.65" stop-color="#07101d" stop-opacity="0.85"/>
    <stop offset="1"    stop-color="#07101d" stop-opacity="0.30"/>
  </linearGradient>
</defs>
<rect x="0" y="0" width="${W}" height="${H - BH}" fill="url(#g)"/>
${c}
</svg>`;
}

function buildSVGSlidePunto(numero, titular, cuerpo, slideNum, slideTotal, W, H) {
  const BH = 160, lp = 70, mid = Math.round(W / 2);
  let c = "";

  c += `<text x="${W - 48}" y="52" font-family="Liberation Sans,Arial,sans-serif" font-size="16" fill="#c9a22799" text-anchor="end">${slideNum} / ${slideTotal}</text>`;

  // Número grande decorativo (fondo) + primer plano
  c += `<text x="${lp - 10}" y="260" font-family="Liberation Sans,Arial,sans-serif" font-size="220" fill="#c9a22712" font-weight="bold">${xmlEsc(numero)}</text>`;
  c += `<text x="${lp}" y="210" font-family="Liberation Sans,Arial,sans-serif" font-size="106" fill="#c9a227" font-weight="bold">${xmlEsc(numero)}</text>`;

  c += `<rect x="${lp}" y="238" width="${W - lp * 2}" height="2" fill="#c9a22730"/>`;

  // Barra dorada vertical + título
  const titY = 306;
  c += `<rect x="${lp}" y="${titY - 12}" width="5" height="80" rx="2" fill="#c9a227"/>`;

  const tit = svgTextLines(titular || "", 26, lp + 22, titY, 54, 44, "white", "bold");
  c += `\n${tit.svg}`;
  let y = titY + tit.count * 54 + 40;

  // Cuerpo
  const body = svgTextLines(cuerpo || "", 46, lp, y, 38, 25, "#d0d0d0", "normal");
  c += `\n${body.svg}`;

  c += _barraStratec(lp, mid, W, H, BH);

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="${W}" height="${H - BH}" fill="#07101d" opacity="0.90"/>
${c}
</svg>`;
}

function buildSVGSlideCTA(cta, slideTotal, W, H) {
  const BH = 160, lp = 70, mid = Math.round(W / 2);
  let c = "";

  c += `<text x="${W - 48}" y="52" font-family="Liberation Sans,Arial,sans-serif" font-size="16" fill="#c9a22799" text-anchor="end">${slideTotal} / ${slideTotal}</text>`;

  // Anillos decorativos concéntricos
  c += `<circle cx="${mid}" cy="310" r="170" fill="none" stroke="#c9a22718" stroke-width="1"/>`;
  c += `<circle cx="${mid}" cy="310" r="125" fill="none" stroke="#c9a22730" stroke-width="1.5"/>`;
  c += `<circle cx="${mid}" cy="310" r="82"  fill="#c9a22710" stroke="#c9a22748" stroke-width="2"/>`;
  c += `<text x="${mid}" y="297" font-family="Liberation Sans,Arial,sans-serif" font-size="30" fill="white" font-weight="bold" text-anchor="middle">STRATEC</text>`;
  c += `<text x="${mid}" y="330" font-family="Liberation Sans,Arial,sans-serif" font-size="12" fill="#c9a227" letter-spacing="2" text-anchor="middle">SEGURIDAD</text>`;

  // Título CTA centrado
  const tit = svgCenteredLines(cta.titular || "SOLICITA TU DIAGNÓSTICO", 22, mid, 490, 64, 52, "white", "bold");
  c += `\n${tit.svg}`;
  let y = 490 + tit.count * 64 + 28;

  c += `\n<rect x="${mid - 70}" y="${y}" width="140" height="4" rx="2" fill="#c9a227"/>`;
  y += 36;

  if (cta.cuerpo) {
    const body = svgCenteredLines(cta.cuerpo, 38, mid, y, 36, 24, "#d0d0d0", "normal");
    c += `\n${body.svg}`;
    y += body.count * 36 + 28;
  }

  c += `\n<text x="${mid}" y="${y}" font-family="Liberation Sans,Arial,sans-serif" font-size="28" fill="#c9a227" font-weight="bold" text-anchor="middle">stratecsecurity.com</text>`;

  c += _barraStratec(lp, mid, W, H, BH);

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="${W}" height="${H - BH}" fill="#07101d" opacity="0.94"/>
${c}
</svg>`;
}

async function buildCarruselSlides(rawPhoto, data) {
  const W = 1080, H = 1080, TOTAL = 5;

  const photo = await sharp(rawPhoto)
    .resize(W, H, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.42 })
    .png().toBuffer();

  const svgs = [
    buildSVGSlidePortada(data.categoria, data.portada, TOTAL, W, H),
    buildSVGSlidePunto(data.puntos[0].numero, data.puntos[0].titular, data.puntos[0].cuerpo, 2, TOTAL, W, H),
    buildSVGSlidePunto(data.puntos[1].numero, data.puntos[1].titular, data.puntos[1].cuerpo, 3, TOTAL, W, H),
    buildSVGSlidePunto(data.puntos[2].numero, data.puntos[2].titular, data.puntos[2].cuerpo, 4, TOTAL, W, H),
    buildSVGSlideCTA(data.cta, TOTAL, W, H),
  ];

  return Promise.all(svgs.map(svg =>
    sharp(photo)
      .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
      .png().toBuffer()
  ));
}

// ── Carrusel — Pending storage ─────────────────────────────────────────────────

function saveCarruselPending(meta, slideBuffers) {
  if (!existsSync(PENDING_DIR)) mkdirSync(PENDING_DIR, { recursive: true });
  const id = randomUUID();
  writeFileSync(join(PENDING_DIR, `carrusel-${id}.json`), JSON.stringify({ ...meta, slideCount: slideBuffers.length }));
  slideBuffers.forEach((buf, i) => writeFileSync(join(PENDING_DIR, `carrusel-${id}-${i}.png`), buf));
  return id;
}

function readCarruselPending(id) {
  const file = join(PENDING_DIR, `carrusel-${id}.json`);
  if (!existsSync(file)) return null;
  const meta = JSON.parse(readFileSync(file, "utf8"));
  const slides = [];
  for (let i = 0; i < meta.slideCount; i++) {
    const f = join(PENDING_DIR, `carrusel-${id}-${i}.png`);
    if (existsSync(f)) slides.push(readFileSync(f));
  }
  return { ...meta, slides };
}

function deleteCarruselPending(id) {
  const metaFile = join(PENDING_DIR, `carrusel-${id}.json`);
  const count = existsSync(metaFile)
    ? (JSON.parse(readFileSync(metaFile, "utf8")).slideCount || 5)
    : 5;
  if (existsSync(metaFile)) unlinkSync(metaFile);
  for (let i = 0; i < count; i++) {
    const f = join(PENDING_DIR, `carrusel-${id}-${i}.png`);
    if (existsSync(f)) unlinkSync(f);
  }
}

// ── Descargar foto desde Telegram ─────────────────────────────────────────────

async function descargarFotoTelegram(fileId) {
  const r = await tg("getFile", { file_id: fileId });
  if (!r.ok) throw new Error(`getFile error: ${r.description}`);
  const res = await fetch(
    `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${r.result.file_path}`
  );
  if (!res.ok) throw new Error(`Descarga de imagen fallida: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── OpenAI Image Generation via Responses API (GPT-4o + image_generation tool) ─

// Prompt para infografía completa — diseño tipo ChatGPT con todo el contenido real
function _buildInfograficaPrompt(tema, cap) {
  const categoria = String(cap.categoria || "SEGURIDAD INSTITUCIONAL").toUpperCase();
  const titular   = String(cap.titular   || tema).toUpperCase();
  const subtitulo = String(cap.subtitulo || "");
  const puntos    = Array.isArray(cap.puntos) ? cap.puntos.slice(0, 3) : [];

  // Prompt conciso y descriptivo — gpt-image-1 responde mejor a descripciones
  // visuales que a especificaciones de layout técnico
  const bulletLines = puntos.map(p => `• ${p}`).join("  ");
  return (
    `Professional corporate social media infographic for STRATEC, a security consulting firm in Mexico. ` +
    `FLAT GRAPHIC DESIGN — not a photograph. Dark navy blue background (#07101d) with warm gold accents (#c9a227). ` +
    `Left-aligned layout. ` +

    `Top: small gold category label "${categoria}" with gold left border. ` +
    `Large ultra-bold white title "${titular}". ` +
    `Short gold horizontal divider line. ` +
    (subtitulo ? `Gold subtitle text "${subtitulo}". ` : ``) +
    `Three bullet points with gold circle icons: ${bulletLines}. ` +
    `Small gray text "Diagnóstico sin costo · stratecsecurity.com". ` +
    `Three outlined service tag boxes in gold: [ANÁLISIS DE RIESGOS] [ESTRATEGIAS A MEDIDA] [COBERTURA NACIONAL]. ` +

    `Bottom: dark full-width bar with gold top border. Left: "STRATEC" bold white large + "CONSULTORÍA EN SEGURIDAD" small gold. ` +
    `Thin vertical gold divider. Right: "stratecsecurity.com" bold white + "Análisis · Estrategia · Soluciones" small gold. ` +

    `Subtle faint geometric grid pattern in background. Clean whitespace. Institutional, authoritative style. ` +
    `NO photographs of people. Render ALL text exactly as written.`
  );
}

// Prompt de fallback — fondo geométrico abstracto oscuro (mejor base para overlay SVG)
function _buildFotoFondoPrompt(_tema) {
  const patterns = [
    "dark hexagonal mesh, faint gold circuit-board traces on deep navy, subtle glowing node points",
    "diagonal geometric stripes in dark charcoal and navy, abstract angular shield shapes in muted gold",
    "large faint overlapping hexagons and triangles on near-black background, faint warm gold outlines",
    "abstract concentric polygon rings on very dark navy blue, fine dot grid, metallic gold highlights",
    "dark navy background with subtle isometric grid, faint diagonal light rays, deep charcoal tones",
  ];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  return (
    `Abstract geometric corporate background for a professional infographic. ` +
    `${pattern}. ` +
    `Color palette: very dark navy (#07101d), deep charcoal (#0c1624), faint warm gold (#c9a22715) accents. ` +
    `Fully abstract — NO people, NO faces, NO text, NO logos, NO recognizable objects, NO photography. ` +
    `Dark, minimalist, institutional. Ultra-sharp 4K.`
  );
}

// captionData: si se pasa, GPT-4o genera el diseño completo (no necesita overlay SVG)
async function _dalleGenerar(tema, captionData = null) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY no configurada");

  // Con captionData → prompt de infografía completa; sin él → prompt de foto de fondo
  const prompt = captionData
    ? _buildInfograficaPrompt(tema, captionData)
    : _buildFotoFondoPrompt(tema);

  // Responses API — GPT-4o genera el diseño completo (mismo motor que ChatGPT)
  // Solo si captionData viene completo (tenemos el contenido real del post)
  if (captionData) {
    try {
      const res = await fetchConTimeout("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          input: prompt,
          tools: [{ type: "image_generation", quality: "high", size: "1024x1024", output_format: "png" }],
        }),
      }, 110_000);
      if (res.ok) {
        const data = await res.json();
        const imgItem = data.output?.find(o => o.type === "image_generation_call");
        if (imgItem?.result) {
          console.log("Imagen generada con GPT-4o Responses API ✓ (diseño completo)");
          return { buffer: Buffer.from(imgItem.result, "base64"), responseId: data.id, isCompleteDesign: true };
        }
        console.warn("Responses API OK pero sin imagen en output → gpt-image-1");
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(`Responses API (${res.status}): ${err.error?.message || ""}. Usando gpt-image-1.`);
      }
    } catch (e) {
      console.warn(`Responses API error (${e.name === "AbortError" ? "timeout 110s" : e.message}) → gpt-image-1`);
    }
  }

  // gpt-image-1 con prompt de infografía completa (buen fallback, también genera diseño)
  const gptImgPrompt = captionData ? prompt : _buildFotoFondoPrompt(tema);
  try {
    const res = await fetchConTimeout("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt: gptImgPrompt, n: 1, size: "1024x1024", quality: "high" }),
    }, 90_000);
    if (res.ok) {
      const { data } = await res.json();
      if (data?.[0]?.b64_json) {
        const isDesign = captionData != null;
        console.log(`Imagen generada con gpt-image-1 ✓ (${isDesign ? "diseño completo" : "foto de fondo"})`);
        return { buffer: Buffer.from(data[0].b64_json, "base64"), responseId: null, isCompleteDesign: isDesign };
      }
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn(`gpt-image-1 (${res.status}): ${err.error?.message || ""}. Usando DALL-E 3.`);
    }
  } catch (e) {
    console.warn(`gpt-image-1 error (${e.name === "AbortError" ? "timeout 90s" : e.message}) → DALL-E 3`);
  }

  // Fallback final: DALL-E 3 hd con foto de fondo + overlay SVG
  const fallbackPrompt = _buildFotoFondoPrompt(tema);
  const res2 = await fetchConTimeout("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "dall-e-3", prompt: fallbackPrompt, n: 1, size: "1024x1024", quality: "hd" }),
  }, 60_000);
  if (!res2.ok) {
    const body = await res2.json().catch(() => ({}));
    throw new Error(`DALL-E: ${body.error?.message || res2.status}`);
  }
  const { data: data2 } = await res2.json();
  console.log("Imagen generada con DALL-E 3 hd ✓ (foto de fondo + overlay SVG)");
  return { buffer: Buffer.from(await (await fetch(data2[0].url)).arrayBuffer()), responseId: null, isCompleteDesign: false };
}

// Continúa una conversación de imagen con GPT-4o usando el responseId previo
async function _modificarImagen(responseId, instruccion) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY no configurada");
  const res = await fetchConTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      previous_response_id: responseId,
      input: instruccion,
      tools: [{ type: "image_generation", quality: "high", size: "1024x1024", output_format: "png" }],
    }),
  }, 110_000);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Responses API modificación: ${err.error?.message || res.status}`);
  }
  const data = await res.json();
  const imgItem = data.output?.find(o => o.type === "image_generation_call");
  if (!imgItem?.result) throw new Error("GPT-4o no generó imagen en la respuesta de modificación");
  return { buffer: Buffer.from(imgItem.result, "base64"), responseId: data.id };
}

// ── Fal.ai — Flux.1 Pro (respaldo principal si no hay OpenAI) ────────────────

async function _falGenerar(tema) {
  const scenes = [
    "security operations center with surveillance monitors, professional staff at workstations",
    "professional security consultant in a modern Mexican corporate office reviewing safety protocols",
    "emergency response team in high-visibility vests conducting a safety inspection at an industrial facility",
    "corporate boardroom meeting focused on institutional security strategy and risk management",
    "modern IP security camera installation on a commercial building exterior, Mexico City skyline",
  ];
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  const prompt =
    `Professional corporate photograph: ${scene}. ` +
    `Subject: ${tema}. ` +
    `Style: clean, modern, high-quality business photography, natural lighting, sharp focus, Mexico setting. ` +
    `No text overlays, no watermarks, no abstract elements, no violence, photorealistic.`;

  // Submit request
  const submitRes = await fetch("https://queue.fal.run/fal-ai/flux-pro/v1.1", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 25,
      num_images: 1,
      enable_safety_checker: false,
    }),
  });
  if (!submitRes.ok) throw new Error(`Fal.ai submit ${submitRes.status}: ${await submitRes.text()}`);
  const { request_id, status_url } = await submitRes.json();
  if (!request_id) throw new Error("Fal.ai: sin request_id en respuesta");

  // Poll for result
  const pollUrl = status_url || `https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${request_id}/status`;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(pollUrl, {
      headers: { Authorization: `Key ${FAL_API_KEY}` },
    });
    const status = await statusRes.json();
    if (status.status === "COMPLETED" || status.images?.length > 0) {
      const resultUrl =
        status.images?.[0]?.url ||
        `https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${request_id}`;
      // If images already in status, use directly; otherwise fetch result
      if (status.images?.[0]?.url) {
        return Buffer.from(await (await fetch(status.images[0].url)).arrayBuffer());
      }
      const resultRes = await fetch(resultUrl, {
        headers: { Authorization: `Key ${FAL_API_KEY}` },
      });
      const result = await resultRes.json();
      if (result.images?.[0]?.url) {
        return Buffer.from(await (await fetch(result.images[0].url)).arrayBuffer());
      }
    }
    if (status.status === "FAILED") throw new Error(`Fal.ai: generación fallida — ${status.error || "error desconocido"}`);
  }
  throw new Error("Fal.ai: timeout 90s");
}

// ── Leonardo (respaldo final) ─────────────────────────────────────────────────

async function _leonardoGenerar(tema) {
  const prompt =
    `Professional corporate photography, security consulting firm, Mexico, ` +
    `theme: ${tema}, modern office or industrial setting, photorealistic, 4K, no text`;
  const negative =
    `abstract, mandala, ornament, pattern, violent, weapon, blood, ` +
    `cartoon, anime, painting, sketch, low quality, blurry, watermark`;

  const res = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${LEONARDO_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt, negative_prompt: negative,
      modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",
      width: 1024, height: 576, num_images: 1, guidance_scale: 7,
    }),
  });
  if (!res.ok) throw new Error(`Leonardo ${res.status}: ${await res.text()}`);
  const { sdGenerationJob } = await res.json();
  const genId = sdGenerationJob?.generationId;
  if (!genId) throw new Error("Leonardo: sin generationId en respuesta");

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`,
      { headers: { Authorization: `Bearer ${LEONARDO_API_KEY}` } }
    );
    const { generations_by_pk } = await poll.json();
    const imgs = generations_by_pk?.generated_images;
    if (imgs?.length > 0) return Buffer.from(await (await fetch(imgs[0].url)).arrayBuffer());
  }
  throw new Error("Leonardo: timeout 60s");
}

// captionData: si se pasa, GPT-4o genera el diseño completo (isCompleteDesign=true → no overlay SVG)
async function generarImagen(tema, captionData = null) {
  if (OPENAI_API_KEY) {
    try {
      console.log("Generando imagen con GPT-4o...");
      const result = await _dalleGenerar(tema, captionData);
      console.log("GPT-4o: imagen generada OK");
      return result;
    } catch (e) {
      console.warn(`OpenAI falló (${e.message}), intentando Fal.ai...`);
    }
  }
  if (FAL_API_KEY) {
    try {
      console.log("Generando imagen con Fal.ai (Flux.1 Pro)...");
      const buffer = await _falGenerar(tema);
      console.log("Fal.ai: imagen generada OK");
      return { buffer, responseId: null, isCompleteDesign: false };
    } catch (e) {
      console.warn(`Fal.ai falló (${e.message}), intentando Leonardo...`);
    }
  }
  if (LEONARDO_API_KEY) {
    console.log("Generando imagen con Leonardo...");
    const buffer = await _leonardoGenerar(tema);
    return { buffer, responseId: null, isCompleteDesign: false };
  }
  throw new Error("Sin API de imágenes configurada (OPENAI_API_KEY, FAL_API_KEY o LEONARDO_API_KEY)");
}

// ── Claude (Anthropic) — helper ───────────────────────────────────────────────

async function llamarClaude(messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1600,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data  = await res.json();
  const text  = data.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude: JSON no encontrado en respuesta");
  return JSON.parse(match[0]);
}

function promptCaptions(tema, contextoExtra = "") {
  return (
    `Eres el equipo de comunicación institucional de STRATEC, firma de consultoría en seguridad institucional con sede en Morelos, México.\n\n` +

    `CONTEXTO DE STRATEC:\n` +
    `- Opera desde Morelos con cobertura en CDMX, Estado de México, Puebla, Guerrero y Jalisco\n` +
    `- Clientes: gobierno, corporativos, instituciones educativas, desarrollos inmobiliarios, infraestructura crítica, zonas industriales (CIVAC, parques de nearshoring)\n` +
    `- Servicios: Consultoría en Seguridad · Protección Civil y Gestión Integral de Riesgos · Capacitación Especializada · Integración Tecnológica · Consultoría para Gobierno e Instituciones\n\n` +

    `REGLAS INQUEBRANTABLES (incumplirlas invalida el contenido):\n` +
    `- Tono: institucional, técnico, directo. NUNCA informal ni coloquial\n` +
    `- No mencionar precios, tarifas ni rangos de costo\n` +
    `- No mencionar el nombre del operador ni del equipo\n` +
    `- No publicar opiniones políticas ni contenido partidista\n` +
    `- No prometer resultados cuantificados ("reducimos el crimen 40%", "ahorrará X pesos")\n` +
    `- No usar fotos de stock genéricas como referencia visual (gente señalando pantallas, guardias posando)\n` +
    `- Máximo 1-2 emojis en total, no decorativos\n` +
    `- Prohibido abrir con "En el mundo actual", "Es fundamental que", "Hoy más que nunca"\n` +
    `- Prohibido capitalizar sobre noticias de crimen o inseguridad de forma reactiva\n\n` +

    `PILARES DE CONTENIDO — determina cuál aplica mejor al tema y úsalo como marco:\n` +
    `1. Educación técnica (40%): explica un concepto de seguridad que el lector aprende, sin vender directamente. El lector asocia STRATEC con conocimiento real.\n` +
    `2. Problema → Solución (25%): presenta un problema real que el prospecto reconoce, cierra con la capacidad de STRATEC para resolverlo. No es venta directa — es demostración de competencia.\n` +
    `3. Normativa y regulación (15%): NOM-035-STPS, protección civil municipal, verificaciones STPS, ISO 31000, obligaciones del empleador. Genera urgencia legítima sin alarmismo.\n` +
    `4. Sector específico (10%): dirige el contenido a un sector concreto (gobierno, educación, industria/CIVAC, inmobiliario, salud). El prospecto se identifica directamente.\n` +
    `5. Dato duro (5%): cifra impactante + contexto breve + capacidad de STRATEC para resolver. Funciona bien como texto sobre imagen.\n` +
    `6. Capacidad tecnológica (5%): videovigilancia, control de accesos, GPS vehicular, sistemas integrados. Nunca suena a "vendemos cámaras" — suena a arquitectura estratégica.\n` +
    `7. Marca y posicionamiento (rotativo): identidad de STRATEC como firma institucional. No vende un servicio específico — vende confianza y diferenciación.\n\n` +

    (contextoExtra ? `CONTEXTO ADICIONAL:\n${contextoExtra}\n\n` : ``) +
    `Tema del post: "${tema}"\n\n` +

    `LINKEDIN — 180 a 220 palabras:\n` +
    `- Audiencia: directores de seguridad, gerentes de operaciones, directores de RRHH, funcionarios públicos, tomadores de decisión corporativa\n` +
    `- Objetivo: posicionar a STRATEC como referente técnico en seguridad institucional, generar confianza y leads B2B calificados\n` +
    `- Abre con una observación real, una situación que el lector haya vivido, o un dato concreto. NO con pregunta retórica casual\n` +
    `- Desarrolla el insight con autoridad técnica. Párrafos cortos, sin listas de viñetas corporativas vacías\n` +
    `- Incorpora datos reales, referencias normativas (NOM, ISO, STPS) o ejemplos de campo cuando apliquen\n` +
    `- Cierra con: "Solicitar diagnóstico sin costo: stratecsecurity.com"\n` +
    `- 4-5 hashtags técnicos y de nicho. Combinar de: #SeguridadInstitucional #GestiónDeRiesgos #ProtecciónCivil #CumplimientoNormativo #AnálisisDeRiesgos #SeguridadCorporativa #NOM035 #Nearshoring #STRATEC más 1-2 específicos del tema\n\n` +

    `FACEBOOK — 80 a 110 palabras:\n` +
    `- Audiencia: PyMEs locales, directivos de escuelas, empresarios de Morelos y CDMX, administradores de condominios y plantas, funcionarios municipales\n` +
    `- Objetivo: visibilidad regional, generar consultas directas por WhatsApp o Messenger\n` +
    `- Puede abrir con pregunta directa o dato que genere reconocimiento inmediato\n` +
    `- Tono directo y profesional — nunca informal ni coloquial\n` +
    `- 1 emoji máximo, solo si suma; nunca decorativo\n` +
    `- Cierra con: "→ stratecsecurity.com" o "→ stratecsecurity.com/contacto"\n` +
    `- 3-4 hashtags: mezcla geográficos y sectoriales según el tema. Combinar de: #STRATEC #Cuernavaca #Morelos #Jiutepec #CIVAC #CDMX #Puebla #ProtecciónCivil #SeguridadEmpresarial #SeguridadIndustrial #GobiernoLocal\n\n` +

    `TITULAR Y SUBTITULO (texto que va impreso sobre la infografía — tono distinto al copy de red social):\n` +
    `- Estilo: titular de publicación técnica especializada o reporte institucional\n` +
    `- PROHIBIDO segunda persona ("tú", "tu empresa", "¿sabes si...?", "¿estás listo?")\n` +
    `- PROHIBIDO preguntas retóricas informales ("¿TU PLAN FUNCIONA O SOLO EXISTE?")\n` +
    `- Usar afirmaciones declarativas, datos o términos del sector: NOM, PIPC, protocolo, brigada, continuidad operativa, cumplimiento normativo, gestión de riesgos\n` +
    `- Correcto: "BRIGADAS DE EMERGENCIA: LA DIFERENCIA ENTRE CAOS Y CONTROL" / "PROTECCIÓN CIVIL: DEL PAPEL A LA PRÁCTICA" / "CUMPLIMIENTO NORMATIVO, SIN ATAJOS"\n` +
    `- Incorrecto: "¿TU EMPRESA ESTÁ LISTA?" / "¿SABÍAS QUE PUEDES PERDER TODO?" / "¡ACTÚA HOY!"\n\n` +

    `Responde ÚNICAMENTE con JSON válido con exactamente estos 6 campos:\n` +
    `{"linkedin":"...","facebook":"...","titular":"TITULAR EN MAYÚSCULAS, AFIRMACIÓN DECLARATIVA O DATO, SIN SEGUNDA PERSONA (máx 52 chars)","subtitulo":"frase técnica o cifra clave, sin segunda persona (máx 42 chars)","puntos":["dato o capacidad concreta 1","dato o capacidad concreta 2","dato o capacidad concreta 3"],"categoria":"CATEGORÍA EN MAYÚSCULAS (ej: PROTECCIÓN CIVIL, ANÁLISIS DE RIESGOS, CAPACITACIÓN, NORMATIVA NOM, INTEGRACIÓN TECNOLÓGICA, CONSULTORÍA DE GOBIERNO)"}`
  );
}

// ── Prompt carrusel ───────────────────────────────────────────────────────────

function promptCarrusel(tema) {
  return (
    `Eres el equipo de comunicación institucional de STRATEC, firma de consultoría en seguridad institucional en México (Morelos, CDMX, Puebla, Jalisco).\n\n` +
    `Crea el contenido para un CARRUSEL de 5 slides sobre el tema: "${tema}"\n\n` +
    `ESTRUCTURA:\n` +
    `- Slide 1 PORTADA: titular impactante + subtítulo que enganche al lector para deslizar\n` +
    `- Slides 2-4 PUNTOS CLAVE: un punto por slide, numerados 01/02/03, con título corto y cuerpo explicativo\n` +
    `- Slide 5 CTA: cierre con llamada a la acción hacia stratecsecurity.com\n\n` +
    `CAPTION FACEBOOK (80-110 palabras): texto que acompañe la publicación del carrusel\n\n` +
    `REGLAS ESTRICTAS:\n` +
    `- Tono institucional, técnico, directo — nunca informal\n` +
    `- Titulares en MAYÚSCULAS, declarativos, sin segunda persona ("tú", "tu empresa")\n` +
    `- Correcto: "BRIGADAS: DEL PAPEL A LA PRÁCTICA" / Incorrecto: "¿TUS BRIGADAS FUNCIONAN?"\n` +
    `- Máx 40 chars en titulares de portada, CTA y puntos\n` +
    `- Cuerpo de puntos: máx 130 chars, concreto, sin perogrulladas\n` +
    `- No mencionar precios ni resultados cuantificados inventados\n\n` +
    `Responde ÚNICAMENTE con JSON válido:\n` +
    `{"facebook":"...","categoria":"CATEGORÍA EN MAYÚSCULAS","portada":{"titular":"TITULAR MÁX 40 CHARS","subtitulo":"frase corta máx 50 chars"},"puntos":[{"numero":"01","titular":"TÍTULO MÁX 35 CHARS","cuerpo":"texto máx 130 chars"},{"numero":"02","titular":"...","cuerpo":"..."},{"numero":"03","titular":"...","cuerpo":"..."}],"cta":{"titular":"CIERRE MÁX 40 CHARS","cuerpo":"frase de cierre máx 80 chars"}}`
  );
}

async function generarCarruselContent(tema) {
  return llamarClaude([{ role: "user", content: promptCarrusel(tema) }]);
}

// ── Captions por texto (tema) ─────────────────────────────────────────────────

async function generarCaptions(tema) {
  return llamarClaude([{ role: "user", content: promptCaptions(tema) }]);
}

// ── Claude Vision — captions desde imagen ────────────────────────────────────

async function generarCaptionsDesdeImagen(imageBuffer, temaHint = "") {
  const base64    = imageBuffer.toString("base64");
  const isPng     = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50;
  const mediaType = isPng ? "image/png" : "image/jpeg";
  const contexto  = temaHint
    ? `El usuario indica que el tema es: "${temaHint}". Úsalo como guía principal.`
    : `Analiza la imagen y determina el tema de seguridad más relevante para STRATEC.`;

  return llamarClaude([{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      { type: "text",  text: promptCaptions(temaHint || "imagen STRATEC", contexto) },
    ],
  }]);
}

// ── Facebook ──────────────────────────────────────────────────────────────────

// Intercambia el System User Token por el Page Access Token de la página.
// El System User Token de Business Manager no puede publicar directamente —
// necesita el token específico de la página.
async function obtenerPageToken() {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}?fields=access_token&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
  );
  const data = await res.json();
  if (data.access_token) {
    console.log("Facebook: page token obtenido correctamente");
    return data.access_token;
  }
  console.warn("Facebook: no se pudo obtener page token:", data.error?.message);
  return FACEBOOK_PAGE_ACCESS_TOKEN;
}

async function publicarFacebookBuffer(imageBuffer, caption) {
  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
    console.warn("Facebook: token o page_id no configurados");
    return false;
  }
  const pageToken = await obtenerPageToken();
  const form = new FormData();
  form.append("source", new Blob([imageBuffer], { type: "image/png" }), "stratec-post.png");
  form.append("message", caption);
  form.append("access_token", pageToken);
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/photos`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Facebook: ${data.error?.message || JSON.stringify(data)}`);
  }
  console.log(`Facebook: publicado OK, id=${data.id}`);
  return true;
}

// ── Facebook Carrusel (multi-photo post) ─────────────────────────────────────

async function publicarFacebookCarrusel(slideBuffers, caption) {
  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
    console.warn("Facebook: token o page_id no configurados");
    return false;
  }
  const pageToken = await obtenerPageToken();

  // Paso 1: subir cada slide como foto no publicada
  const photoIds = [];
  for (let i = 0; i < slideBuffers.length; i++) {
    const form = new FormData();
    form.append("source", new Blob([slideBuffers[i]], { type: "image/png" }), `slide-${i}.png`);
    form.append("published", "false");
    form.append("access_token", pageToken);
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/photos`,
      { method: "POST", body: form }
    );
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(`Facebook [slide ${i}]: ${data.error?.message || JSON.stringify(data)}`);
    photoIds.push(data.id);
    console.log(`Facebook carrusel: slide ${i + 1}/${slideBuffers.length} subido (id=${data.id})`);
  }

  // Paso 2: crear el post del carrusel con todas las fotos adjuntas
  const postRes = await fetch(`https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: caption,
      attached_media: photoIds.map(id => ({ media_fbid: id })),
      access_token: pageToken,
    }),
  });
  const postData = await postRes.json();
  if (!postRes.ok || postData.error) {
    throw new Error(`Facebook [feed carrusel]: ${postData.error?.message || JSON.stringify(postData)}`);
  }
  console.log(`Facebook carrusel publicado OK, post_id=${postData.id}`);
  return true;
}

// ── LinkedIn (UGC Posts API v2 — compatible con w_member_social) ──────────────

async function publicarLinkedIn(imageBuffer, caption) {
  if (!LINKEDIN_ACCESS_TOKEN) return false;

  const authHeaders = {
    Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };
  const commentary = String(caption || "").slice(0, 3000);

  // Paso 0: obtener person URN — 3 métodos en orden
  let personUrn = LINKEDIN_PERSON_URN || null; // env var directo (más confiable)

  if (!personUrn) {
    // Método A: /v2/userinfo (OpenID Connect — scope: openid+profile)
    const uiRes = await fetchConTimeout(
      "https://api.linkedin.com/v2/userinfo",
      { headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}` } },
      15_000
    ).catch(() => null);
    if (uiRes?.ok) {
      const ui = await uiRes.json().catch(() => ({}));
      if (ui.sub) personUrn = `urn:li:person:${ui.sub}`;
    }
  }

  if (!personUrn) {
    // Método B: /v2/me con LinkedIn-Version header (scope: r_liteprofile)
    const meRes = await fetchConTimeout(
      "https://api.linkedin.com/v2/me",
      { headers: { ...authHeaders, "LinkedIn-Version": "202501" } },
      15_000
    ).catch(() => null);
    if (meRes?.ok) {
      const me = await meRes.json().catch(() => ({}));
      if (me.id) personUrn = `urn:li:person:${me.id}`;
    }
  }

  if (!personUrn) {
    throw new Error(
      "LinkedIn: no se pudo obtener el URN de persona. " +
      "Agrega el secret LINKEDIN_PERSON_URN en GitHub con tu URN " +
      "(formato: urn:li:person:XXXXXXXX). " +
      "Encuéntralo en: https://www.linkedin.com/developers/tools/oauth/token-inspector"
    );
  }

  const authorUrn = LINKEDIN_ORG_ID ? `urn:li:organization:${LINKEDIN_ORG_ID}` : personUrn;

  // Paso 1: registrar subida (Assets API v2, owner = quien publicará)
  const regRes = await fetchConTimeout(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: authorUrn,
          serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
        },
      }),
    },
    30_000
  );
  if (!regRes.ok) {
    const txt = await regRes.text().catch(() => regRes.status);
    throw new Error(`LinkedIn [register ${regRes.status}]: ${String(txt).slice(0, 250)}`);
  }
  const regData   = await regRes.json();
  const uploadUrl = regData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const assetUrn  = regData.value?.asset;
  if (!uploadUrl || !assetUrn)
    throw new Error(`LinkedIn [register]: respuesta inesperada — ${JSON.stringify(regData).slice(0, 200)}`);

  // Paso 2: subir imagen binaria
  const upRes = await fetchConTimeout(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`, "Content-Type": "image/png" },
    body: imageBuffer,
  }, 60_000);
  if (!upRes.ok) {
    const txt = await upRes.text().catch(() => upRes.status);
    throw new Error(`LinkedIn [upload ${upRes.status}]: ${String(txt).slice(0, 250)}`);
  }

  // Paso 3: publicar con UGC Posts API (soporta tanto persona como org)
  const _ugcPost = (author) => fetchConTimeout(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: commentary },
            shareMediaCategory: "IMAGE",
            media: [{
              status: "READY",
              description: { text: "STRATEC Consultoría en Seguridad" },
              media: assetUrn,
              title: { text: "STRATEC" },
            }],
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    },
    30_000
  );

  let postRes = await _ugcPost(authorUrn);

  // Si falla 403 en /author (sin permiso org) → reintentar como perfil personal
  if (!postRes.ok && postRes.status === 403 && LINKEDIN_ORG_ID) {
    const errTxt = await postRes.text().catch(() => "");
    if (errTxt.includes("/author") || errTxt.includes("ACCESS_DENIED")) {
      console.warn("LinkedIn: sin permiso para publicar como organización, reintentando como perfil personal...");
      postRes = await _ugcPost(personUrn);
    } else {
      throw new Error(`LinkedIn [post 403]: ${errTxt.slice(0, 300)}`);
    }
  }

  if (!postRes.ok) {
    const txt = await postRes.text().catch(() => postRes.status);
    throw new Error(`LinkedIn [post ${postRes.status}]: ${String(txt).slice(0, 300)}`);
  }
  const tipo = authorUrn.includes("organization") ? "organización" : "perfil personal";
  console.log(`LinkedIn: publicado OK como ${tipo}`);
  return true;
}

// ── Programación de posts ─────────────────────────────────────────────────────

// Devuelve los próximos 4 horarios óptimos para México (UTC-6)
function proximosHorariosOptimos() {
  const OFFSET_MS  = -6 * 3600 * 1000; // UTC-6 México Central
  const SLOTS_MX   = [9, 12, 18];       // 9am, 12pm, 6pm días hábiles
  const now        = Date.now();
  const MIN_AHEAD  = 5 * 60 * 1000;     // al menos 5 min en el futuro
  const dias       = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const result     = [];

  for (let dayDelta = 0; dayDelta <= 4 && result.length < 4; dayDelta++) {
    const base = new Date(now + dayDelta * 86400000);
    // Fecha en México
    const mxBase = new Date(base.getTime() + OFFSET_MS);
    const mxDow  = mxBase.getUTCDay(); // 0=Dom … 6=Sáb

    // Fines de semana: un solo slot a las 10am
    const horasDelDia = (mxDow === 0 || mxDow === 6) ? [10] : SLOTS_MX;

    for (const h of horasDelDia) {
      // Construir el instante exacto en UTC
      const slotMx  = new Date(Date.UTC(
        mxBase.getUTCFullYear(), mxBase.getUTCMonth(), mxBase.getUTCDate(),
        h, 0, 0, 0
      ));
      const slotUtc = new Date(slotMx.getTime() - OFFSET_MS);

      if (slotUtc.getTime() < now + MIN_AHEAD) continue;

      const hLabel = h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      const dateStr = `${mxBase.getUTCDate()}/${mxBase.getUTCMonth() + 1}`;
      result.push({ label: `${dias[mxDow]} ${dateStr} ${hLabel}`, iso: slotUtc.toISOString() });
      if (result.length >= 4) break;
    }
  }
  return result;
}

async function procesarProgramar(chatId, pendingId, callbackId) {
  await answerCb(callbackId, "Eligiendo horario...");
  const slots = proximosHorariosOptimos();
  if (!slots.length) {
    await sendMessage(chatId, "❌ No se encontraron horarios disponibles.");
    return;
  }
  const keyboard = slots.map(s => [
    { text: `🕐 ${s.label}`, callback_data: `scheds:${pendingId}:${new Date(s.iso).getTime()}` },
  ]);
  keyboard.push([{ text: "❌ Cancelar", callback_data: `pub:${pendingId}` }]);
  await sendMessage(chatId,
    "📅 <b>Elige el horario de publicación</b>\n(Hora México — máxima afluencia en redes)",
    { reply_markup: { inline_keyboard: keyboard } }
  );
}

async function procesarAgendarSlot(chatId, pendingId, tsMs, callbackId) {
  await answerCb(callbackId, "Programando...");
  const pending = readPending(pendingId);
  if (!pending) {
    await sendMessage(chatId, "❌ Post no encontrado. Genera uno nuevo.");
    return;
  }
  pending.scheduledAt = new Date(Number(tsMs)).toISOString();
  writeFileSync(join(PENDING_DIR, `${pendingId}.json`), JSON.stringify(pending));

  const OFFSET_MS = -6 * 3600 * 1000;
  const mxDate    = new Date(Number(tsMs) + OFFSET_MS);
  const dias      = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const h         = mxDate.getUTCHours();
  const hLabel    = h < 12 ? `${h}:00am` : h === 12 ? "12:00pm" : `${h-12}:00pm`;
  await sendMessage(chatId,
    `✅ <b>Post programado</b>\n\n` +
    `📅 ${dias[mxDate.getUTCDay()]} ${mxDate.getUTCDate()}/${mxDate.getUTCMonth()+1} a las ${hLabel} (hora México)\n\n` +
    `El bot publicará automáticamente en Facebook y LinkedIn a esa hora.`
  );
}

// Revisa posts pendientes con scheduledAt y los publica si ya llegó la hora
async function publicarPendientesAgendados() {
  if (!existsSync(PENDING_DIR)) return;
  const files = readdirSync(PENDING_DIR).filter(f => f.endsWith(".json"));
  const now   = Date.now();

  for (const file of files) {
    try {
      // Solo chequear scheduledAt sin cargar la imagen todavía
      const peek = JSON.parse(readFileSync(join(PENDING_DIR, file), "utf8"));
      if (!peek.scheduledAt) continue;
      if (new Date(peek.scheduledAt).getTime() > now) continue;

      const pendingId   = file.replace(".json", "");
      const meta         = readPending(pendingId); // reconstruye imageBase64 desde el .png separado
      if (!meta?.imageBase64) { deletePending(pendingId); continue; }
      const imageBuffer = Buffer.from(meta.imageBase64, "base64");
      console.log(`Publicando post agendado: ${pendingId} (${meta.tema})`);

      const [fb, li] = await Promise.allSettled([
        publicarFacebookBuffer(imageBuffer, meta.facebook),
        publicarLinkedIn(imageBuffer, meta.linkedin),
      ]);
      deletePending(pendingId);

      const redes = [];
      if (fb.status === "fulfilled" && fb.value) redes.push("Facebook ✅");
      else redes.push(`Facebook ❌`);
      if (li.status === "fulfilled" && li.value) redes.push("LinkedIn ✅");
      else if (!LINKEDIN_ACCESS_TOKEN) redes.push("LinkedIn ⏭️");
      else redes.push(`LinkedIn ❌ ${li.reason?.message || ""}`);

      // Notificar al chat original si hay chatId guardado
      if (meta.chatId) {
        await sendMessage(meta.chatId,
          `🚀 <b>Post publicado automáticamente</b>\n\n${redes.join("\n")}\nTema: ${meta.tema}`
        );
      }
    } catch (err) {
      console.error("Error publicando agendado:", err.message);
    }
  }
}

// ── Flujo: foto subida por el usuario ────────────────────────────────────────

async function procesarFoto(chatId, fileId, temaHint) {
  const actionTick = setInterval(
    () => tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {}),
    4000
  );
  tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {});

  try {
    const rawBuffer  = await descargarFotoTelegram(fileId);
    const captions   = await generarCaptionsDesdeImagen(rawBuffer, temaHint);
    clearInterval(actionTick);

    const tema = temaHint || "imagen personalizada STRATEC";
    const pendingId = savePending({
      imageBase64:    rawBuffer.toString("base64"),
      rawImageBase64: rawBuffer.toString("base64"),
      linkedin:       captions.linkedin,
      facebook:       captions.facebook,
      tema,
    });

    const preview =
      `📋 <b>Preview${temaHint ? ` — ${temaHint}` : ""}</b>\n\n` +
      `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
      `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...`;

    await sendPhotoBuffer(chatId, rawBuffer, preview, [
      [
        { text: "✅ Publicar ahora",  callback_data: `pub:${pendingId}` },
        { text: "📅 Programar",       callback_data: `sched:${pendingId}` },
      ],
      [
        { text: "🔄 Nueva caption",  callback_data: `recap:${pendingId}` },
      ],
    ]);
  } catch (err) {
    clearInterval(actionTick);
    throw err;
  }
}

// ── Flujo: generar imagen con IA ──────────────────────────────────────────────

async function procesarComando(chatId, tema) {
  const actionTick = setInterval(
    () => tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {}),
    4000
  );
  tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {});

  try {
    // Secuencial: primero captions para pasar el contenido real al generador de imagen
    const captions = await generarCaptions(tema);
    const imgResult = await generarImagen(tema, captions);
    const { buffer: rawPhoto, responseId, isCompleteDesign } = imgResult;

    // Si GPT-4o generó el diseño completo, usarlo directo; si no, aplicar overlay SVG
    const imageBuffer = isCompleteDesign
      ? rawPhoto
      : await buildInfografia(rawPhoto, captions);
    clearInterval(actionTick);

    const pendingId = savePending({
      imageBase64:    imageBuffer.toString("base64"),
      rawImageBase64: rawPhoto.toString("base64"),
      linkedin:       captions.linkedin,
      facebook:       captions.facebook,
      titular:        captions.titular,
      subtitulo:      captions.subtitulo,
      puntos:         captions.puntos,
      categoria:      captions.categoria,
      tema,
      chatId,
      responseId,
    });

    activePending.set(chatId, pendingId);

    const preview =
      `📋 <b>Preview — ${tema}</b>\n\n` +
      `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
      `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...\n\n` +
      `<i>💬 Escribe para modificar la imagen (ej: "hazla más oscura", "cambia el fondo")</i>`;

    await sendPhotoBuffer(chatId, imageBuffer, preview, [
      [
        { text: "✅ Publicar ahora", callback_data: `pub:${pendingId}` },
        { text: "📅 Programar",      callback_data: `sched:${pendingId}` },
      ],
      [
        { text: "🔄 Regenerar todo", callback_data: `reg:${pendingId}` },
      ],
    ]);
  } catch (err) {
    clearInterval(actionTick);
    throw err;
  }
}

// ── Modificación de imagen por chat (conversación con GPT-4o) ─────────────────

async function procesarModificacionImagen(chatId, pendingId, instruccion) {
  const pending = readPending(pendingId);
  if (!pending) {
    activePending.delete(chatId);
    await sendMessage(chatId, "❌ Post no encontrado. Genera uno nuevo con /genera");
    return;
  }

  const actionTick = setInterval(
    () => tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {}),
    4000
  );
  tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {});

  try {
    let rawBuffer, newResponseId;

    let isCompleteDesign = false;

    if (pending.responseId && OPENAI_API_KEY) {
      // Continúa la conversación: GPT-4o recuerda la imagen anterior
      const result = await _modificarImagen(pending.responseId, instruccion);
      rawBuffer = result.buffer;
      newResponseId = result.responseId;
      isCompleteDesign = true; // la modificación conserva el diseño completo
    } else {
      // Sin contexto previo — regenera con el contenido completo del post
      const capts = {
        titular: pending.titular, subtitulo: pending.subtitulo,
        puntos: pending.puntos, categoria: pending.categoria,
      };
      const result = await generarImagen(`${pending.tema}. ${instruccion}`, capts);
      rawBuffer = result.buffer;
      newResponseId = result.responseId;
      isCompleteDesign = result.isCompleteDesign;
    }

    clearInterval(actionTick);

    // Si la imagen ya es un diseño completo, usarla directo; si no, aplicar overlay SVG
    const captions = {
      linkedin: pending.linkedin, facebook: pending.facebook,
      titular: pending.titular, subtitulo: pending.subtitulo,
      puntos: pending.puntos, categoria: pending.categoria,
    };
    const imageBuffer = isCompleteDesign
      ? rawBuffer
      : await buildInfografia(rawBuffer, captions);

    updatePendingImage(pendingId, imageBuffer);
    writeFileSync(join(PENDING_DIR, `${pendingId}-raw.png`), rawBuffer);
    updatePendingMeta(pendingId, { responseId: newResponseId });

    const preview =
      `✏️ <b>Imagen modificada</b>\n\n` +
      `<b>Facebook:</b>\n${pending.facebook.substring(0, 350)}\n\n` +
      `<b>LinkedIn (inicio):</b>\n${pending.linkedin.substring(0, 200)}...\n\n` +
      `<i>💬 Escribe para seguir modificando</i>`;

    await sendPhotoBuffer(chatId, imageBuffer, preview, [
      [
        { text: "✅ Publicar ahora", callback_data: `pub:${pendingId}` },
        { text: "📅 Programar",      callback_data: `sched:${pendingId}` },
      ],
      [
        { text: "🔄 Regenerar todo", callback_data: `reg:${pendingId}` },
      ],
    ]);

  } catch (err) {
    clearInterval(actionTick);
    throw err;
  }
}

// ── Callbacks inline ──────────────────────────────────────────────────────────

async function procesarAprobacion(chatId, messageId, pendingId, callbackId) {
  await answerCb(callbackId, "Publicando...");
  const pending = readPending(pendingId);
  if (!pending) {
    await sendMessage(chatId, "❌ Post no encontrado. Genera uno nuevo con /genera");
    return;
  }

  activePending.delete(chatId);
  const imageBuffer = Buffer.from(pending.imageBase64, "base64");
  const [fb, li]    = await Promise.allSettled([
    publicarFacebookBuffer(imageBuffer, pending.facebook),
    publicarLinkedIn(imageBuffer, pending.linkedin),
  ]);
  deletePending(pendingId);

  const redes = [];
  if (fb.status === "fulfilled" && fb.value === true) redes.push("Facebook ✅");
  else if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) redes.push("Facebook ⏭️ (sin token)");
  else redes.push(`Facebook ❌ ${fb.reason?.message || fb.value || ""}`);
  if (li.status === "fulfilled" && li.value === true) redes.push("LinkedIn ✅");
  else if (!LINKEDIN_ACCESS_TOKEN) redes.push("LinkedIn ⏭️ (token pendiente)");
  else redes.push(`LinkedIn ❌ ${li.reason?.message || ""}`);

  await editCaption(chatId, messageId,
    `🚀 <b>Publicación completada</b>\n\n${redes.join("\n")}\n\nTema: ${pending.tema}`
  );
}

async function procesarRegeneracion(chatId, pendingId, callbackId) {
  await answerCb(callbackId, "Regenerando...");
  const pending = readPending(pendingId);
  const tema    = pending?.tema || "contenido de seguridad STRATEC";
  activePending.delete(chatId);
  deletePending(pendingId);
  await procesarComando(chatId, tema);
}

// Misma imagen del usuario, nuevo caption vía Gemini Vision
async function procesarRecaptionado(chatId, pendingId, callbackId) {
  await answerCb(callbackId, "Generando nueva caption...");
  const pending = readPending(pendingId);
  if (!pending) {
    await sendMessage(chatId, "❌ Post no encontrado. Vuelve a enviar la imagen.");
    return;
  }

  const rawBuffer = Buffer.from(pending.rawImageBase64 || pending.imageBase64, "base64");
  const captions  = await generarCaptionsDesdeImagen(rawBuffer, pending.tema);

  updatePendingImage(pendingId, rawBuffer);
  const metaFile = join(PENDING_DIR, `${pendingId}.json`);
  const meta     = JSON.parse(readFileSync(metaFile, "utf8"));
  meta.linkedin  = captions.linkedin;
  meta.facebook  = captions.facebook;
  writeFileSync(metaFile, JSON.stringify(meta));

  const preview =
    `📋 <b>Nueva caption</b>\n\n` +
    `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
    `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...`;

  await sendPhotoBuffer(chatId, rawBuffer, preview, [
    [
      { text: "✅ Publicar ahora",  callback_data: `pub:${pendingId}` },
      { text: "📅 Programar",       callback_data: `sched:${pendingId}` },
    ],
    [
      { text: "🔄 Nueva caption",  callback_data: `recap:${pendingId}` },
    ],
  ]);
}

// ── Carrusel — Flujo principal ────────────────────────────────────────────────

async function procesarCarrusel(chatId, tema) {
  const actionTick = setInterval(
    () => tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {}),
    4000
  );
  tg("sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {});

  try {
    // Imagen de fondo + contenido en paralelo
    const [imgResult, content] = await Promise.all([
      generarImagen(tema),
      generarCarruselContent(tema),
    ]);
    const slides = await buildCarruselSlides(imgResult.buffer, content);
    clearInterval(actionTick);

    const carruselId = saveCarruselPending({ tema, facebook: content.facebook, chatId }, slides);
    activePending.delete(chatId);

    const previewCaption =
      `🎠 <b>Carrusel — ${tema}</b>\n\n` +
      `<b>Facebook:</b>\n${content.facebook.substring(0, 300)}\n\n` +
      `<i>5 slides listos para publicar</i>`;

    await sendMediaGroup(chatId, slides, previewCaption);

    // sendMediaGroup no admite inline_keyboard — botones en mensaje aparte
    await sendMessage(chatId, "¿Publicar el carrusel en Facebook?", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Publicar en Facebook", callback_data: `carr_pub:${carruselId}` }],
          [{ text: "🔄 Regenerar carrusel",   callback_data: `carr_reg:${carruselId}` }],
        ],
      },
    });

  } catch (err) {
    clearInterval(actionTick);
    throw err;
  }
}

async function procesarPublicarCarrusel(chatId, carruselId, callbackId) {
  await answerCb(callbackId, "Publicando carrusel...");
  const pending = readCarruselPending(carruselId);
  if (!pending) {
    await sendMessage(chatId, "❌ Carrusel no encontrado. Genera uno nuevo con /carrusel");
    return;
  }
  try {
    await publicarFacebookCarrusel(pending.slides, pending.facebook);
    deleteCarruselPending(carruselId);
    await sendMessage(chatId, `🚀 <b>Carrusel publicado en Facebook</b>\n\nTema: ${pending.tema}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error al publicar: ${err.message}`);
  }
}

async function procesarRegenerarCarrusel(chatId, carruselId, callbackId) {
  await answerCb(callbackId, "Regenerando carrusel...");
  const pending = readCarruselPending(carruselId);
  const tema = pending?.tema || "contenido de seguridad STRATEC";
  deleteCarruselPending(carruselId);
  await procesarCarrusel(chatId, tema);
}

// ── Menú de temas ─────────────────────────────────────────────────────────────

const SERVICIOS_MENU = [
  {
    btn: "🛡  Consultoría en Seguridad",
    tema: "Consultoría en Seguridad Institucional: diagnóstico de riesgos, protocolos y gestión operativa",
  },
  {
    btn: "🏛  Protección Civil",
    tema: "Protección Civil y Gestión Integral de Riesgos: PIPC, brigadas de emergencia y cumplimiento normativo",
  },
  {
    btn: "📋  Capacitación Especializada",
    tema: "Capacitación Especializada en seguridad institucional, brigadas y gestión de emergencias",
  },
  {
    btn: "📡  Integración Tecnológica",
    tema: "Integración Tecnológica para la Seguridad: videovigilancia, control de accesos y sistemas integrados",
  },
  {
    btn: "🏙  Consultoría para Gobierno",
    tema: "Consultoría en Seguridad para Gobierno e Instituciones Públicas: mapeo delictivo y entornos seguros",
  },
];

// Llama a Claude para generar 7 temas actuales y en tendencia
async function generarTemasTendencia() {
  const hoy = new Date().toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City", year: "numeric", month: "long", day: "numeric",
  });
  const data = await llamarClaude([{
    role: "user",
    content:
      `Hoy es ${hoy}. Eres estratega de contenido para STRATEC, consultoría en seguridad institucional en México (Morelos, CDMX, Puebla, Guerrero, Jalisco).\n\n` +
      `Servicios: Consultoría en Seguridad · Protección Civil · Capacitación · Integración Tecnológica · Consultoría para Gobierno.\n\n` +
      `Genera 7 temas de contenido ACTUALES Y EN TENDENCIA para publicar en redes sociales esta semana. Considera:\n` +
      `- Contexto 2025: expansión del nearshoring en México, aumento de verificaciones STPS, temporada de riesgos (calor, lluvias, sismos), normativa actualizada\n` +
      `- Lo que está discutiendo la audiencia ahora: directores de seguridad, directivos corporativos, funcionarios de protección civil, responsables de operaciones\n` +
      `- Mix de los 7 pilares: educación técnica, problema→solución, normativa, sector específico, dato duro, tecnología, marca\n` +
      `- Temas concretos y específicos, no genéricos. Con ángulo de STRATEC\n` +
      `- Máximo 55 caracteres por tema\n` +
      `- Tono institucional, sin sensacionalismo ni alarmismo\n\n` +
      `Responde ÚNICAMENTE con este JSON exacto:\n` +
      `{"temas":["tema1","tema2","tema3","tema4","tema5","tema6","tema7"]}`,
  }]);
  return Array.isArray(data.temas) ? data.temas.slice(0, 7) : [];
}

// Limpia archivos de tendencias con más de 6 horas para no acumular basura en git
function limpiarTendenciasExpiradas() {
  if (!existsSync(PENDING_DIR)) return;
  const corte = Date.now() - 6 * 3600 * 1000;
  readdirSync(PENDING_DIR)
    .filter(f => f.startsWith("trending-") && f.endsWith(".json"))
    .forEach(f => {
      try {
        const { createdAt } = JSON.parse(readFileSync(join(PENDING_DIR, f), "utf8"));
        if (new Date(createdAt).getTime() < corte) unlinkSync(join(PENDING_DIR, f));
      } catch { unlinkSync(join(PENDING_DIR, f)); }
    });
}

async function mostrarMenuTemas(chatId) {
  const keyboard = SERVICIOS_MENU.map((s, i) => [
    { text: s.btn, callback_data: `svc:${i}` },
  ]);
  keyboard.push([{ text: "🔥  Temas en tendencia (7 nuevos con IA)", callback_data: "tendencia"    }]);
  keyboard.push([{ text: "🎠  Generar carrusel (5 slides)",          callback_data: "carr_menu"    }]);
  keyboard.push([{ text: "✏️  Tema personalizado",                   callback_data: "tema_custom"  }]);

  await sendMessage(chatId,
    "📌 <b>¿Sobre qué publicamos hoy?</b>\n\n" +
    "<b>Servicios STRATEC — elige uno para generar un post:</b>",
    { reply_markup: { inline_keyboard: keyboard } }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Publicar posts programados cuya hora ya llegó
  await publicarPendientesAgendados();

  let offset = getOffset();

  // Si el offset guardado es irreal (p.ej. de una parada de emergencia),
  // consultamos a Telegram cuál es el último update real y nos ajustamos.
  if (offset > 500_000_000) {
    const drain = await tg("getUpdates", { offset: -1, limit: 1, timeout: 0 });
    if (drain.ok && drain.result?.length) {
      const lastId = drain.result[drain.result.length - 1].update_id;
      offset = lastId + 1;
    } else {
      // Sin updates pendientes: resetear a 0 para que Telegram empiece a servir
      // los próximos mensajes normalmente.
      offset = 0;
    }
    saveOffset(offset);
    console.log(`Offset irreal corregido → ${offset}`);
    await tg("getUpdates", { offset, limit: 1, timeout: 0 });
  }

  console.log(`Polling desde offset ${offset}...`);

  const updates = await getUpdates(offset);
  if (!updates.ok || !updates.result?.length) {
    console.log("Sin nuevos mensajes.");
    return;
  }

  let nextOffset = offset;

  for (const update of updates.result) {
    nextOffset = Math.max(nextOffset, update.update_id + 1);

    try {
      // ── Botones inline ────────────────────────────────────────────────────
      if (update.callback_query) {
        const { id, data, message } = update.callback_query;
        const chatId    = message.chat.id;
        const messageId = message.message_id;
        if (data.startsWith("pub:"))             await procesarAprobacion(chatId, messageId, data.slice(4), id);
        else if (data.startsWith("reg:"))         await procesarRegeneracion(chatId, data.slice(4), id);
        else if (data.startsWith("recap:"))       await procesarRecaptionado(chatId, data.slice(6), id);
        else if (data.startsWith("sched:"))       await procesarProgramar(chatId, data.slice(6), id);
        else if (data.startsWith("carr_pub:"))    await procesarPublicarCarrusel(chatId, data.slice(9), id);
        else if (data.startsWith("carr_reg:"))    await procesarRegenerarCarrusel(chatId, data.slice(9), id);
        else if (data === "carr_menu") {
          await answerCb(id, "");
          await sendMessage(chatId,
            "🎠 <b>Generar carrusel</b>\n\nEscribe el tema con el comando:\n" +
            "<code>/carrusel protección civil empresas Morelos</code>\n\n" +
            "O envía el tema directamente:\n" +
            "<code>/carrusel capacitación brigadas de emergencia</code>"
          );
        }
        else if (data.startsWith("scheds:")) {
          const [pid, ts] = data.slice(7).split(":");
          await procesarAgendarSlot(chatId, pid, ts, id);
        }
        else if (data.startsWith("svc:")) {
          const svc = SERVICIOS_MENU[parseInt(data.slice(4))];
          if (svc) {
            await answerCb(id, "Generando post…");
            await procesarComando(chatId, svc.tema);
          } else {
            await answerCb(id, "Servicio no encontrado");
          }
        }
        else if (data === "tendencia") {
          await answerCb(id, "Analizando tendencias…");
          await tg("sendChatAction", { chat_id: chatId, action: "typing" });
          let temas;
          try {
            temas = await generarTemasTendencia();
          } catch (e) {
            await sendMessage(chatId, "❌ Error generando temas. Intenta de nuevo con /genera");
            continue;
          }
          if (!temas.length) {
            await sendMessage(chatId, "❌ Sin resultados. Intenta de nuevo.");
            continue;
          }
          // Guardar en pending para que persistan al siguiente run del bot
          const sid = randomUUID();
          limpiarTendenciasExpiradas();
          writeFileSync(
            join(PENDING_DIR, `trending-${sid}.json`),
            JSON.stringify({ temas, createdAt: new Date().toISOString() })
          );
          const kb = temas.map((t, i) => [{
            text: t.length > 48 ? t.slice(0, 46) + "…" : t,
            callback_data: `trnd:${sid}:${i}`,
          }]);
          kb.push([
            { text: "🔄  Nuevos temas",    callback_data: "tendencia"   },
            { text: "⬅️  Servicios",       callback_data: "menu_inicio" },
          ]);
          await sendMessage(chatId,
            "🔥 <b>Temas en tendencia esta semana:</b>\n<i>Generados por IA según el contexto actual</i>",
            { reply_markup: { inline_keyboard: kb } }
          );
        }
        else if (data.startsWith("trnd:")) {
          const parts = data.slice(5).split(":");
          const sid = parts[0], idx = parseInt(parts[1]);
          const tFile = join(PENDING_DIR, `trending-${sid}.json`);
          if (!existsSync(tFile)) {
            await answerCb(id, "Sesión expirada — genera nuevos temas");
            await mostrarMenuTemas(chatId);
            continue;
          }
          const { temas } = JSON.parse(readFileSync(tFile, "utf8"));
          const tema = temas[idx];
          if (tema) {
            await answerCb(id, "Generando post…");
            await procesarComando(chatId, tema);
          } else {
            await answerCb(id, "Tema no encontrado");
          }
        }
        else if (data === "menu_inicio") {
          await answerCb(id, "");
          await mostrarMenuTemas(chatId);
        }
        else if (data === "tema_custom") {
          await answerCb(id, "");
          await sendMessage(chatId,
            "Escribe el tema con el comando:\n" +
            "<code>/genera capacitación brigadas emergencia Cuernavaca</code>\n\n" +
            "O envía una foto con el tema en el caption."
          );
        }
        continue;
      }

      const msg = update.message;
      if (!msg) continue;
      const chatId = msg.chat.id;

      // ── Foto enviada como imagen comprimida ──────────────────────────────
      if (msg.photo?.length > 0) {
        const fileId    = msg.photo[msg.photo.length - 1].file_id;
        const temaHint  = msg.caption?.trim() || "";
        await procesarFoto(chatId, fileId, temaHint);
        continue;
      }

      // ── Foto enviada como documento (sin comprimir, máxima calidad) ──────
      if (msg.document?.mime_type?.startsWith("image/")) {
        const temaHint = msg.caption?.trim() || "";
        await procesarFoto(chatId, msg.document.file_id, temaHint);
        continue;
      }

      // ── Mensajes de texto ────────────────────────────────────────────────
      if (!msg.text) continue;
      const text = msg.text.trim();

      // Texto libre con preview activo → modificación de imagen vía GPT-4o
      const activePid = activePending.get(chatId);
      if (activePid && !text.startsWith("/")) {
        await procesarModificacionImagen(chatId, activePid, text);

      } else if (/^\/(carrusel|carousel)\s+/i.test(text)) {
        const tema = text.replace(/^\/(carrusel|carousel)(@\w+)?\s+/i, "").trim();
        await procesarCarrusel(chatId, tema);

      } else if (/^\/(carrusel|carousel)(@\w+)?$/i.test(text)) {
        await sendMessage(chatId,
          "🎠 Escribe el tema del carrusel:\n" +
          "<code>/carrusel protección civil empresas Morelos</code>"
        );

      } else if (/^\/(genera|post)\s+/i.test(text)) {
        const tema = text.replace(/^\/(genera|post)(@\w+)?\s+/i, "").trim();
        await procesarComando(chatId, tema);

      } else if (/^\/(genera|post)(@\w+)?$/i.test(text)) {
        await mostrarMenuTemas(chatId);

      } else if (/^\/(start|ayuda|help)/i.test(text)) {
        await sendMessage(chatId,
          "🤖 <b>STRATEC Bot de Publicaciones</b>\n\n" +
          "<b>Opción 1 — Generar imagen con IA:</b>\n" +
          "/genera [tema] — Crea imagen con Leonardo.ai + caption\n\n" +
          "<b>Opción 2 — Publicar tu propia foto:</b>\n" +
          "Envía una foto o imagen directamente al chat.\n" +
          "Escribe el tema en el caption (opcional).\n" +
          "Para máxima calidad: envía como <b>Archivo</b>, no como foto.\n\n" +
          "<b>Ejemplos /genera:</b>\n" +
          "<code>/genera auditoría de seguridad industrial Morelos</code>\n" +
          "<code>/genera capacitación brigadas emergencia</code>\n" +
          "<code>/genera programa interno de protección civil PIPC</code>\n" +
          "<code>/genera videovigilancia CCTV empresas Cuernavaca</code>"
        );
      }

    } catch (err) {
      console.error(`Error en update ${update.update_id}:`, err.message);
      try {
        const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
        if (chatId) {
          const msg = err.message.includes("Leonardo")
            ? "⏳ La generación de imagen tardó demasiado. Intenta de nuevo con /genera"
            : err.message.includes("Claude") || err.message.includes("JSON")
            ? "⏳ Error generando el texto. Intenta de nuevo en un momento."
            : `❌ ${err.message}`;
          await sendMessage(chatId, msg);
        }
      } catch (_) {}
    }
  }

  saveOffset(nextOffset);
  console.log(`Procesados: ${updates.result.length} updates. Nuevo offset: ${nextOffset}`);
}

main().catch((err) => {
  // Salida 0 para que GitHub Actions ejecute siempre el paso de guardar estado
  console.error("Error fatal:", err.message);
});
