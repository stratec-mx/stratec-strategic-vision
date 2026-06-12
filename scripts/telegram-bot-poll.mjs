/**
 * STRATEC · Telegram Bot — Generador de posts con IA
 * ─────────────────────────────────────────────────────
 * Flujo /genera [tema]:
 *   → imagen (Leonardo.ai) + caption (Gemini Flash)
 *   → preview en Telegram con botones
 *   → ✅ Publicar → Facebook + LinkedIn
 *   → 🔄 Regenerar → nueva imagen + caption
 *
 * Flujo foto desde teléfono:
 *   → Envía imagen como FOTO o como ARCHIVO al bot
 *   → caption opcional = tema ("seguridad industrial Morelos")
 *   → Gemini Vision analiza la imagen y genera captions
 *   → ✅ Publicar → Facebook + LinkedIn
 *   → 🔄 Nueva caption → misma imagen, texto nuevo
 *
 * Estado persistente (en el repo):
 *   public/social-posts/.telegram-offset   — último update_id procesado
 *   public/social-posts/pending/UUID.json  — posts pendientes de aprobación
 *
 * Variables de entorno (GitHub Secrets):
 *   TELEGRAM_BOT_TOKEN, LEONARDO_API_KEY, GEMINI_API_KEY,
 *   FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID,
 *   LINKEDIN_ACCESS_TOKEN, LINKEDIN_ORG_ID
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
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
  LEONARDO_API_KEY,
  ANTHROPIC_API_KEY,
  FACEBOOK_PAGE_ACCESS_TOKEN,
  FACEBOOK_PAGE_ID,
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORG_ID,
} = process.env;

const TG = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

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
  const lp = 64;
  const BH = 140;
  let y = 76;
  let c = "";

  // Category badge
  c += `
<rect x="${lp}" y="${y}" width="270" height="36" rx="5" fill="#c9a22720"/>
<rect x="${lp}" y="${y}" width="4" height="36" rx="2" fill="#c9a227"/>
<text x="${lp + 18}" y="${y + 24}" font-family="Liberation Sans,Arial,sans-serif" font-size="12" fill="#c9a227" font-weight="bold" letter-spacing="2">${xmlEsc(String(categoria || "SEGURIDAD INSTITUCIONAL").toUpperCase())}</text>`;
  y += 70;

  // Headline — 50px, wrap at 19 chars
  const tit = svgTextLines(titular || "SEGURIDAD QUE FUNCIONA", 19, lp, y, 60, 50, "white", "bold");
  c += `\n${tit.svg}`;
  y += tit.count * 60 + 30;

  // Gold divider
  c += `\n<rect x="${lp}" y="${y}" width="90" height="4" rx="2" fill="#c9a227"/>`;
  y += 38;

  // Subtitle
  const sub = svgTextLines(subtitulo || "", 34, lp, y, 32, 20, "#c9a227", "bold");
  c += `\n${sub.svg}`;
  y += sub.count * 32 + 44;

  // Bullet points — more spacing
  for (const p of (Array.isArray(puntos) ? puntos.slice(0, 4) : [])) {
    c += `
<rect x="${lp}" y="${y - 15}" width="10" height="10" rx="2" fill="#c9a227"/>
<text x="${lp + 22}" y="${y}" font-family="Liberation Sans,Arial,sans-serif" font-size="19" fill="white">${xmlEsc(String(p))}</text>`;
    y += 46;
  }

  // Separator + CTA
  y += 28;
  c += `\n<rect x="${lp}" y="${y}" width="420" height="1" fill="#c9a22730"/>`;
  y += 28;
  c += `\n<text x="${lp}" y="${y}" font-family="Liberation Sans,Arial,sans-serif" font-size="14" fill="#c9a22799">Diagnóstico sin costo · stratecsecurity.com</text>`;

  // Bottom bar
  const mid = Math.round(W / 2);
  c += `
<rect x="0" y="${H - BH}" width="${W}" height="${BH}" fill="#060d15" opacity="0.97"/>
<rect x="${mid - 1}" y="${H - BH + 22}" width="1" height="${BH - 44}" fill="#c9a22750"/>
<text x="${lp}" y="${H - 72}" font-family="Liberation Sans,Arial,sans-serif" font-size="28" fill="white" font-weight="bold">STRATEC</text>
<text x="${lp}" y="${H - 42}" font-family="Liberation Sans,Arial,sans-serif" font-size="13" fill="#c9a227" letter-spacing="2">CONSULTORÍA EN SEGURIDAD</text>
<text x="${mid + 40}" y="${H - 70}" font-family="Liberation Sans,Arial,sans-serif" font-size="21" fill="white" font-weight="bold">stratecsecurity.com</text>
<text x="${mid + 40}" y="${H - 44}" font-family="Liberation Sans,Arial,sans-serif" font-size="13" fill="#c9a22799">Análisis · Estrategia · Soluciones</text>`;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="520" y1="0" x2="780" y2="0">
    <stop offset="0" stop-color="#0d1b2a" stop-opacity="0.98"/>
    <stop offset="1" stop-color="#0d1b2a" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect x="0" y="0" width="560" height="${H - BH}" fill="#0d1b2a" opacity="0.98"/>
<rect x="520" y="0" width="260" height="${H - BH}" fill="url(#fade)"/>
${c}
</svg>`;
}

async function buildInfografia(photoBuffer, captionData) {
  const W = 1080, H = 1080;

  const base = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 13, g: 27, b: 42, alpha: 255 } }
  }).png().toBuffer();

  const photo = await sharp(photoBuffer)
    .resize(560, H, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.60 })
    .png().toBuffer();

  const overlay = Buffer.from(buildSVGOverlay(
    captionData.categoria, captionData.titular,
    captionData.subtitulo, captionData.puntos,
    W, H
  ));

  return sharp(base)
    .composite([
      { input: photo,   left: 520, top: 0 },
      { input: overlay, left: 0,   top: 0 },
    ])
    .png().toBuffer();
}

// ── Watermark profesional para fotos del usuario ──────────────────────────────
// Preserva la imagen original intacta; solo agrega un sello STRATEC en la esquina.

async function aplicarLogoWatermark(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  const W = meta.width  || 1080;
  const H = meta.height || 1080;

  // Barra inferior semi-transparente con marca STRATEC
  const barH   = Math.round(H * 0.07);
  const fontSize = Math.round(barH * 0.38);
  const subSize  = Math.round(barH * 0.24);
  const pad      = Math.round(barH * 0.25);
  const mid      = Math.round(W / 2);

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="${H - barH}" width="${W}" height="${barH}" fill="#060d15" opacity="0.84"/>
  <rect x="0" y="${H - barH}" width="4" height="${barH}" fill="#c9a227"/>
  <text x="${pad}" y="${H - barH + Math.round(barH * 0.58)}"
    font-family="Liberation Sans,Arial,sans-serif" font-size="${fontSize}"
    fill="white" font-weight="bold">STRATEC</text>
  <text x="${pad}" y="${H - Math.round(barH * 0.18)}"
    font-family="Liberation Sans,Arial,sans-serif" font-size="${subSize}"
    fill="#c9a227">CONSULTORÍA EN SEGURIDAD</text>
  <text x="${mid + pad}" y="${H - barH + Math.round(barH * 0.58)}"
    font-family="Liberation Sans,Arial,sans-serif" font-size="${Math.round(fontSize * 0.85)}"
    fill="white">stratecsecurity.com</text>
  <text x="${mid + pad}" y="${H - Math.round(barH * 0.18)}"
    font-family="Liberation Sans,Arial,sans-serif" font-size="${subSize}"
    fill="#c9a22799">Análisis · Estrategia · Soluciones</text>
</svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
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

// ── Leonardo.ai — generar imagen ──────────────────────────────────────────────

// ── DALL-E 3 (OpenAI) — generador principal ──────────────────────────────────

async function _dalleGenerar(tema) {
  const scenes = [
    "security operations center with surveillance monitors showing real-time footage, professional staff",
    "professional security consultant reviewing safety protocols in a modern Mexican corporate office",
    "emergency response team in high-visibility vests conducting a safety inspection at an industrial facility",
    "corporate boardroom meeting focused on institutional security and risk management planning",
    "modern IP security camera installation on a commercial building exterior in Mexico City",
  ];
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  const prompt =
    `Professional corporate photograph: ${scene}. ` +
    `Subject matter: ${tema}. ` +
    `Style: clean, modern, high-quality business photography, natural lighting, sharp focus. ` +
    `Setting: Mexico. No text overlays, no watermarks, no abstract elements, no violence.`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", quality: "standard" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`DALL-E: ${body.error?.message || res.status}`);
  }
  const { data } = await res.json();
  return Buffer.from(await (await fetch(data[0].url)).arrayBuffer());
}

// ── Leonardo (respaldo si no hay clave OpenAI) ────────────────────────────────

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

async function generarImagen(tema) {
  if (OPENAI_API_KEY) {
    try {
      console.log("Generando imagen con DALL-E 3...");
      const buf = await _dalleGenerar(tema);
      console.log("DALL-E 3: imagen generada OK");
      return buf;
    } catch (e) {
      console.warn(`DALL-E 3 falló (${e.message}), intentando Leonardo...`);
    }
  }
  if (LEONARDO_API_KEY) {
    console.log("Generando imagen con Leonardo...");
    return _leonardoGenerar(tema);
  }
  throw new Error("Sin API de imágenes configurada (OPENAI_API_KEY o LEONARDO_API_KEY)");
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
    `Eres Carlos, el director de STRATEC, consultoría en seguridad institucional ` +
    `y protección civil con sede en Morelos, México. Llevas 15 años en el sector, ` +
    `conoces a tus clientes por su nombre y hablas con ellos de frente, sin rodeos.\n\n` +
    (contextoExtra ? contextoExtra + "\n\n" : "") +
    `Tema: "${tema}"\n\n` +
    `Escribe DOS publicaciones en primera persona o voz cercana, en español mexicano natural. ` +
    `Que suenen a una persona real hablando, no a un departamento de marketing. ` +
    `El objetivo es que el lector sienta que alguien que sabe del tema le está hablando directo, ` +
    `genere confianza y quiera contactarnos — pero sin sonar a vendedor desesperado.\n\n` +
    `REGLAS de tono:\n` +
    `- Nada de frases genéricas como "En el mundo actual" o "Es fundamental que"\n` +
    `- Nada de listas de viñetas corporativas. Párrafos cortos, fluidos\n` +
    `- Usa datos reales o ejemplos concretos si aplican al tema\n` +
    `- Permite una dosis de opinión personal o experiencia de campo\n` +
    `- El CTA debe sentirse como una invitación, no un anuncio\n\n` +
    `LINKEDIN (180-220 palabras):\n` +
    `- Abre con una observación real o situación que el lector reconozca\n` +
    `- Desarrolla el insight de seguridad con autoridad pero sin arrogancia\n` +
    `- Máximo 2 emojis, bien colocados\n` +
    `- Cierra con: "Si quieres revisarlo en tu empresa, agendamos una plática sin costo: stratecsecurity.com"\n` +
    `- 4-5 hashtags al final: #SeguridadInstitucional #ProteccionCivil #GestionDeRiesgos + 2 del tema\n\n` +
    `FACEBOOK (100-130 palabras):\n` +
    `- Abre con pregunta directa o dato que golpee\n` +
    `- Tono más conversacional, como hablar con un conocido\n` +
    `- 2-3 emojis naturales (no decorativos)\n` +
    `- Cierra con: "Escríbenos o entra a stratecsecurity.com 🔗"\n` +
    `- 4 hashtags\n\n` +
    `Responde ÚNICAMENTE con JSON válido con estos 6 campos exactos:\n` +
    `{"linkedin":"...","facebook":"...","titular":"TITULAR IMPACTANTE EN MAYÚSCULAS (máx 52 chars, pregunta o afirmación directa)","subtitulo":"una frase corta en minúsculas que complementa el titular (máx 42 chars)","puntos":["acción o beneficio concreto 1","acción o beneficio concreto 2","acción o beneficio concreto 3"],"categoria":"TIPO DE CONTENIDO (ej: PROTECCIÓN CIVIL, ANÁLISIS DE RIESGOS, CAPACITACIÓN)"}`
  );
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

// ── LinkedIn ──────────────────────────────────────────────────────────────────

async function publicarLinkedIn(imageBuffer, caption) {
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_ORG_ID) return false;
  const orgUrn  = `urn:li:organization:${LINKEDIN_ORG_ID}`;
  const headers = {
    Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };
  const regRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST", headers,
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: orgUrn,
        serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
      },
    }),
  });
  if (!regRes.ok) return false;
  const { value } = await regRes.json();
  const uploadUrl = value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const assetId   = value.asset;
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`, "Content-Type": "image/png" },
    body: imageBuffer,
  });
  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST", headers,
    body: JSON.stringify({
      author: orgUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "IMAGE",
          media: [{ status: "READY", media: assetId, title: { text: "STRATEC" } }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  return postRes.ok;
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
    const [conMarca, captions] = await Promise.all([
      aplicarLogoWatermark(rawBuffer),
      generarCaptionsDesdeImagen(rawBuffer, temaHint),
    ]);
    clearInterval(actionTick);

    const tema = temaHint || "imagen personalizada STRATEC";
    const pendingId = savePending({
      imageBase64:    conMarca.toString("base64"),
      rawImageBase64: rawBuffer.toString("base64"),
      linkedin:       captions.linkedin,
      facebook:       captions.facebook,
      tema,
    });

    const preview =
      `📋 <b>Preview${temaHint ? ` — ${temaHint}` : ""}</b>\n\n` +
      `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
      `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...`;

    await sendPhotoBuffer(chatId, conMarca, preview, [
      [
        { text: "✅ Publicar ahora",  callback_data: `pub:${pendingId}` },
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
    const [rawPhoto, captions] = await Promise.all([
      generarImagen(tema),
      generarCaptions(tema),
    ]);
    const imageBuffer = await buildInfografia(rawPhoto, captions);
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
    });

    const preview =
      `📋 <b>Preview — ${tema}</b>\n\n` +
      `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
      `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...`;

    await sendPhotoBuffer(chatId, imageBuffer, preview, [
      [
        { text: "✅ Publicar ahora", callback_data: `pub:${pendingId}` },
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
  const conMarca  = await aplicarLogoWatermark(rawBuffer);

  // Update image file and caption metadata separately
  updatePendingImage(pendingId, conMarca);
  const metaFile = join(PENDING_DIR, `${pendingId}.json`);
  const meta     = JSON.parse(readFileSync(metaFile, "utf8"));
  meta.linkedin  = captions.linkedin;
  meta.facebook  = captions.facebook;
  writeFileSync(metaFile, JSON.stringify(meta));

  const preview =
    `📋 <b>Nueva caption</b>\n\n` +
    `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
    `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...`;

  await sendPhotoBuffer(chatId, conMarca, preview, [
    [
      { text: "✅ Publicar ahora", callback_data: `pub:${pendingId}` },
      { text: "🔄 Nueva caption",  callback_data: `recap:${pendingId}` },
    ],
  ]);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let offset = getOffset();

  // Si el offset guardado es irreal (p.ej. de una parada de emergencia),
  // consultamos a Telegram cuál es el último update real y nos ajustamos.
  if (offset > 500_000_000) {
    const drain = await tg("getUpdates", { offset: -1, limit: 1, timeout: 0 });
    if (drain.ok && drain.result?.length) {
      const lastId = drain.result[drain.result.length - 1].update_id;
      offset = lastId + 1;
      saveOffset(offset);
      console.log(`Offset irreal detectado. Ajustado a ${offset} (último update real: ${lastId})`);
      // Confirma el drain con Telegram
      await tg("getUpdates", { offset, limit: 1, timeout: 0 });
    } else {
      console.log("Sin mensajes pendientes en Telegram. Offset mantenido.");
      return;
    }
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
        if (data.startsWith("pub:"))   await procesarAprobacion(chatId, messageId, data.slice(4), id);
        else if (data.startsWith("reg:"))   await procesarRegeneracion(chatId, data.slice(4), id);
        else if (data.startsWith("recap:")) await procesarRecaptionado(chatId, data.slice(6), id);
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

      if (/^\/(genera|post)\s+/i.test(text)) {
        const tema = text.replace(/^\/(genera|post)(@\w+)?\s+/i, "").trim();
        await procesarComando(chatId, tema);

      } else if (/^\/(genera|post)(@\w+)?$/i.test(text)) {
        await sendMessage(chatId,
          "Escribe el tema del post. Ejemplo:\n" +
          "<code>/genera capacitación brigadas de emergencia Cuernavaca</code>\n\n" +
          "O envíame una foto directamente con el tema en el caption."
        );

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
