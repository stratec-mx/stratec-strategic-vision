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
  const id = randomUUID();
  writeFileSync(join(PENDING_DIR, `${id}.json`), JSON.stringify(data));
  return id;
}

function readPending(id) {
  const file = join(PENDING_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

function deletePending(id) {
  const file = join(PENDING_DIR, `${id}.json`);
  if (existsSync(file)) unlinkSync(file);
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
  tg("getUpdates", { offset, timeout: 5, allowed_updates: ["message", "callback_query"] });

// ── Logo overlay con Sharp ────────────────────────────────────────────────────

async function aplicarLogo(imageBuffer) {
  const logoPath = join(ROOT, "public", "stratec-logo.png");
  if (!existsSync(logoPath)) {
    console.warn("Logo no encontrado, se omite overlay.");
    return imageBuffer;
  }
  const base = sharp(imageBuffer);
  const { width, height } = await base.metadata();
  const logoWidth  = Math.round(width * 0.18);
  const logoBuffer = await sharp(logoPath).resize(logoWidth).png().toBuffer();
  const logoMeta   = await sharp(logoBuffer).metadata();
  const margin     = Math.round(width * 0.03);
  const left       = width  - logoMeta.width  - margin;
  const top        = height - logoMeta.height - margin;
  return base
    .composite([{ input: logoBuffer, left, top, blend: "over" }])
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

async function generarImagen(tema) {
  const prompt =
    `Corporate photography for Mexican security consulting firm STRATEC. ` +
    `Theme: ${tema}. ` +
    `Style: modern office building exterior, professional security equipment, ` +
    `control room with monitors, corporate meeting room, industrial facility, ` +
    `or emergency response team in action. ` +
    `Color palette: deep navy blue and gold accents. ` +
    `Photorealistic, high resolution, professional business photography. ` +
    `No text, no watermarks, no logos.`;

  const negative =
    `abstract art, mandala, ornamental, decorative pattern, aztec, mayan, ` +
    `circular pattern, kaleidoscope, fractal, surreal, fantasy, cartoon, ` +
    `anime, illustration, painting, sketch, low quality, blurry`;

  const res = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${LEONARDO_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negative_prompt: negative,
      modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",
      width: 1024, height: 1024, num_images: 1, guidance_scale: 12,
      photoReal: true, photoRealVersion: "v2",
      alchemy: true,
    }),
  });

  if (!res.ok) throw new Error(`Leonardo ${res.status}: ${await res.text()}`);
  const { sdGenerationJob } = await res.json();
  const genId = sdGenerationJob.generationId;

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`,
      { headers: { Authorization: `Bearer ${LEONARDO_API_KEY}` } }
    );
    const { generations_by_pk } = await poll.json();
    const imgs = generations_by_pk?.generated_images;
    if (imgs?.length > 0) {
      const rawBuffer = Buffer.from(await (await fetch(imgs[0].url)).arrayBuffer());
      return aplicarLogo(rawBuffer);
    }
  }
  throw new Error("Leonardo: timeout generando imagen (60s)");
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
      max_tokens: 1200,
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
    `Eres el community manager de STRATEC, consultoría en seguridad institucional ` +
    `y protección civil con sede en Morelos, México. ` +
    `Clientes objetivo: Directores de Seguridad, CEOs, responsables de Protección Civil.\n\n` +
    (contextoExtra ? contextoExtra + "\n\n" : "") +
    `Tema del post: "${tema}"\n\n` +
    `Redacta DOS publicaciones en español mexicano, profesional y directo.\n\n` +
    `LINKEDIN (160-200 palabras):\n` +
    `- Tono ejecutivo B2B, máximo 2 emojis\n` +
    `- Gancho → insight de seguridad → beneficio → CTA\n` +
    `- CTA: "Agenda una consulta sin costo en stratecsecurity.com"\n` +
    `- Hashtags: #SeguridadInstitucional #ProteccionCivil #GestionDeRiesgos + 2 relevantes\n\n` +
    `FACEBOOK (90-120 palabras):\n` +
    `- Tono directo, 2-3 emojis\n` +
    `- Pregunta o dato → propuesta → CTA\n` +
    `- CTA: "Más información en stratecsecurity.com 🔗"\n` +
    `- 4 hashtags\n\n` +
    `Responde ÚNICAMENTE con JSON válido: {"linkedin":"...","facebook":"..."}`
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

async function publicarFacebookBuffer(imageBuffer, caption) {
  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) return false;
  const form = new FormData();
  form.append("source", new Blob([imageBuffer], { type: "image/png" }), "stratec-post.png");
  form.append("message", caption);
  form.append("access_token", FACEBOOK_PAGE_ACCESS_TOKEN);
  const res = await fetch(`https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/photos`, {
    method: "POST", body: form,
  });
  if (!res.ok) throw new Error(`Facebook: ${await res.text()}`);
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
  await sendMessage(chatId,
    `📸 Imagen recibida. Analizando con IA...\n⏳ Generando captions en ~15 segundos...`
  );

  const rawBuffer = await descargarFotoTelegram(fileId);
  const withLogo  = await aplicarLogo(rawBuffer);
  const captions  = await generarCaptionsDesdeImagen(rawBuffer, temaHint);
  const tema      = temaHint || "imagen personalizada STRATEC";

  const pendingId = savePending({
    imageBase64:     withLogo.toString("base64"),
    fotoOrigBase64:  rawBuffer.toString("base64"),
    linkedin:        captions.linkedin,
    facebook:        captions.facebook,
    tema,
  });

  const preview =
    `📋 <b>Preview${temaHint ? ` — ${temaHint}` : ""}</b>\n\n` +
    `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
    `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...`;

  await sendPhotoBuffer(chatId, withLogo, preview, [
    [
      { text: "✅ Publicar ahora",  callback_data: `pub:${pendingId}` },
      { text: "🔄 Nueva caption",  callback_data: `recap:${pendingId}` },
    ],
  ]);
}

// ── Flujo: generar imagen con IA ──────────────────────────────────────────────

async function procesarComando(chatId, tema) {
  await sendMessage(chatId,
    `🎨 Generando post sobre: <b>${tema}</b>\n\n⏳ Imagen + texto en ~30 segundos...`
  );

  const [imageBuffer, captions] = await Promise.all([
    generarImagen(tema),
    generarCaptions(tema),
  ]);

  const pendingId = savePending({
    imageBase64: imageBuffer.toString("base64"),
    linkedin:    captions.linkedin,
    facebook:    captions.facebook,
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
  if (fb.status === "fulfilled") redes.push("Facebook ✅");
  else redes.push(`Facebook ❌ ${fb.reason?.message || ""}`);
  if (li.value === true) redes.push("LinkedIn ✅");
  else if (!LINKEDIN_ACCESS_TOKEN) redes.push("LinkedIn ⏭️ (token pendiente)");
  else redes.push("LinkedIn ❌");

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

  const rawBuffer = Buffer.from(pending.fotoOrigBase64 || pending.imageBase64, "base64");
  const captions  = await generarCaptionsDesdeImagen(rawBuffer, pending.tema);

  // Actualizar pending con la nueva caption
  pending.linkedin = captions.linkedin;
  pending.facebook = captions.facebook;
  writeFileSync(join(PENDING_DIR, `${pendingId}.json`), JSON.stringify(pending));

  const imageBuffer = Buffer.from(pending.imageBase64, "base64");
  const preview =
    `📋 <b>Nueva caption</b>\n\n` +
    `<b>Facebook:</b>\n${captions.facebook.substring(0, 350)}\n\n` +
    `<b>LinkedIn (inicio):</b>\n${captions.linkedin.substring(0, 200)}...`;

  await sendPhotoBuffer(chatId, imageBuffer, preview, [
    [
      { text: "✅ Publicar ahora", callback_data: `pub:${pendingId}` },
      { text: "🔄 Nueva caption",  callback_data: `recap:${pendingId}` },
    ],
  ]);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const offset = getOffset();
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
        if (chatId) await sendMessage(chatId, `❌ Error: ${err.message}`);
      } catch (_) {}
    }
  }

  saveOffset(nextOffset);
  console.log(`Procesados: ${updates.result.length} updates. Nuevo offset: ${nextOffset}`);
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
