/**
 * STRATEC · Publicador automático de redes sociales
 * ──────────────────────────────────────────────────
 * Flujo:
 *   1. Lee la primera imagen de public/social-posts/queue/
 *   2. Genera caption LinkedIn + Facebook con Claude Vision
 *   3. Publica en ambas redes vía API
 *   4. Mueve la imagen a public/social-posts/posted/YYYY-MM-DD-nombre.ext
 *
 * Variables de entorno requeridas (configurar en GitHub Secrets):
 *   ANTHROPIC_API_KEY          — API key de Anthropic
 *   LINKEDIN_ACCESS_TOKEN      — Token de acceso empresa LinkedIn
 *   LINKEDIN_ORG_ID            — ID numérico de la página empresa (sin "urn:li:organization:")
 *   FACEBOOK_PAGE_ACCESS_TOKEN — Token de la página de Facebook
 *   FACEBOOK_PAGE_ID           — ID numérico de la página de Facebook
 */

import { readFileSync, readdirSync, renameSync, mkdirSync, existsSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const QUEUE_DIR = join(ROOT, "public", "social-posts", "queue");
const POSTED_DIR= join(ROOT, "public", "social-posts", "posted");

const {
  ANTHROPIC_API_KEY,
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORG_ID,
  FACEBOOK_PAGE_ACCESS_TOKEN,
  FACEBOOK_PAGE_ID,
} = process.env;

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// ── Utilidades ──────────────────────────────────────────────────────────────

function getMimeType(ext) {
  return ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
}

function getNextImage() {
  if (!existsSync(QUEUE_DIR)) return null;
  const files = readdirSync(QUEUE_DIR)
    .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
    .sort(); // orden alfabético → procesa el más antiguo primero
  return files.length > 0 ? files[0] : null;
}

// ── Claude Vision — genera captions ─────────────────────────────────────────

async function generarCaptions(imageBuffer, mimeType) {
  const base64 = imageBuffer.toString("base64");

  const prompt = `Eres el community manager de STRATEC, firma de consultoría en seguridad
institucional, protección civil y gestión de riesgos con sede en Morelos, México.
Nuestros clientes son Directores de Seguridad, CEOs y responsables de Protección Civil
en empresas e instituciones públicas y privadas.

Analiza esta imagen y redacta DOS publicaciones en español mexicano, profesional y directo.

LINKEDIN (160-200 palabras):
- Tono: ejecutivo B2B, sin emojis excesivos (máximo 2)
- Estructura: gancho inicial → insight de seguridad relacionado con la imagen → beneficio concreto → CTA
- CTA final: "Agenda una consulta sin costo en stratecsecurity.com"
- 5 hashtags profesionales al final: #SeguridadInstitucional #ProteccionCivil #GestionDeRiesgos + 2 más relevantes

FACEBOOK (90-120 palabras):
- Tono: directo, más cercano, puede tener 2-3 emojis estratégicos
- Estructura: pregunta o dato de impacto → propuesta de valor → CTA
- CTA final: "Más información en stratecsecurity.com 🔗"
- 4 hashtags al final

RESPONDE ÚNICAMENTE con este JSON válido, sin texto adicional:
{
  "linkedin": "texto completo para LinkedIn aquí",
  "facebook": "texto completo para Facebook aquí"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data  = await res.json();
  const text  = data.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No se pudo parsear el JSON de captions:\n" + text);

  return JSON.parse(match[0]);
}

// ── LinkedIn ─────────────────────────────────────────────────────────────────
// Flujo: 1) registrar upload → 2) subir binario → 3) crear UGC post

async function publicarLinkedIn(imageBuffer, mimeType, caption) {
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_ORG_ID) {
    console.warn("⚠️  LinkedIn: credenciales no configuradas, omitiendo.");
    return;
  }

  const orgUrn = `urn:li:organization:${LINKEDIN_ORG_ID}`;
  const headers = {
    Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };

  // 1 — Registrar upload
  const regRes = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: orgUrn,
          serviceRelationships: [
            { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
          ],
        },
      }),
    }
  );
  if (!regRes.ok) throw new Error(`LinkedIn register: ${regRes.status} ${await regRes.text()}`);
  const regData   = await regRes.json();
  const uploadUrl = regData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const assetId   = regData.value.asset;

  // 2 — Subir imagen
  const upRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`, "Content-Type": mimeType },
    body: imageBuffer,
  });
  if (!upRes.ok) throw new Error(`LinkedIn upload: ${upRes.status}`);

  // 3 — Crear post
  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers,
    body: JSON.stringify({
      author: orgUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              description: { text: "STRATEC · Consultoría en Seguridad Institucional" },
              media: assetId,
              title: { text: "STRATEC" },
            },
          ],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!postRes.ok) throw new Error(`LinkedIn post: ${postRes.status} ${await postRes.text()}`);

  console.log("✅ LinkedIn: publicado correctamente");
}

// ── Facebook ─────────────────────────────────────────────────────────────────

async function publicarFacebook(imageBuffer, caption) {
  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
    console.warn("⚠️  Facebook: credenciales no configuradas, omitiendo.");
    return;
  }

  const form = new FormData();
  form.append("source", new Blob([imageBuffer]), "image.jpg");
  form.append("message", caption);
  form.append("access_token", FACEBOOK_PAGE_ACCESS_TOKEN);

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/photos`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error(`Facebook: ${res.status} ${await res.text()}`);

  console.log("✅ Facebook: publicado correctamente");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Buscando imagen en la cola...");

  const filename = getNextImage();
  if (!filename) {
    console.log("ℹ️  Cola vacía. Agrega imágenes a public/social-posts/queue/");
    process.exit(0);
  }

  console.log(`📸 Procesando: ${filename}`);
  const imagePath  = join(QUEUE_DIR, filename);
  const imageBuffer= readFileSync(imagePath);
  const mimeType   = getMimeType(extname(filename).toLowerCase());

  // Generar captions con Claude Vision
  console.log("🤖 Generando captions con Claude Vision...");
  const captions = await generarCaptions(imageBuffer, mimeType);

  console.log("\n── LinkedIn ──────────────────────────────────────────");
  console.log(captions.linkedin);
  console.log("\n── Facebook ──────────────────────────────────────────");
  console.log(captions.facebook);
  console.log("──────────────────────────────────────────────────────\n");

  // Publicar
  await publicarLinkedIn(imageBuffer, mimeType, captions.linkedin);
  await publicarFacebook(imageBuffer, captions.facebook);

  // Archivar imagen
  if (!existsSync(POSTED_DIR)) mkdirSync(POSTED_DIR, { recursive: true });
  const fecha = new Date().toISOString().slice(0, 10);
  renameSync(imagePath, join(POSTED_DIR, `${fecha}-${filename}`));
  console.log(`📁 Imagen archivada: posted/${fecha}-${filename}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
