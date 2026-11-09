// Genera un HTML propio para cada página pública después de `vite build`.
// Cada archivo lleva su título, descripción, canónica y contenido, y React lo
// reemplaza al cargar. Las rutas sin página propia (/app, /auth, etc.) usan
// app-shell.html, que es el HTML original sin contenido.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const bundle = join(root, "node_modules", ".cache", "prerender", "routes.mjs");

await build({
  entryPoints: [join(root, "src", "prerender", "routes.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundle,
  alias: { "@": join(root, "src") },
  logLevel: "error",
});
const { buildRoutes } = await import(pathToFileURL(bundle).href);
const routes = buildRoutes();

const shell = readFileSync(join(dist, "index.html"), "utf8");
writeFileSync(join(dist, "app-shell.html"), shell);

const attr = (v) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Reemplaza el valor de una etiqueta; falla si no existe para no publicar a medias. */
function setValue(html, pattern, value, name) {
  if (!pattern.test(html)) throw new Error(`[prerender] Falta la etiqueta: ${name}`);
  return html.replace(pattern, (_, before, after) => `${before}${attr(value)}${after}`);
}

const STYLE = "display:block;max-width:880px;margin:0 auto;padding:96px 24px;min-height:100vh;background:#071327;color:#e8e8e4;font-family:Inter,system-ui,sans-serif;line-height:1.6";

function render(r) {
  let html = shell;
  const title = attr(r.title);
  if (!/<title>[\s\S]*?<\/title>/.test(html)) throw new Error("[prerender] Falta <title>");
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);

  const meta = (prop, key) => new RegExp(`(<meta ${prop}="${key}"\\s+content=")[^"]*(")`);
  html = setValue(html, meta("name", "description"), r.description, "description");
  html = setValue(html, meta("name", "keywords"), r.keywords, "keywords");
  html = setValue(html, /(<link rel="canonical" href=")[^"]*(")/, r.canonical, "canonical");
  html = setValue(html, meta("property", "og:url"), r.canonical, "og:url");
  html = setValue(html, meta("property", "og:title"), r.title, "og:title");
  html = setValue(html, meta("property", "og:description"), r.description, "og:description");
  html = setValue(html, meta("name", "twitter:title"), r.title, "twitter:title");
  html = setValue(html, meta("name", "twitter:description"), r.description, "twitter:description");
  if (r.ogImage) {
    html = setValue(html, meta("property", "og:image"), r.ogImage, "og:image");
    html = setValue(html, meta("name", "twitter:image"), r.ogImage, "twitter:image");
  }
  html = html.replace(/(<link rel="alternate" hreflang="[^"]+" href=")[^"]*(")/g, (_, a, b) => `${a}${attr(r.canonical)}${b}`);

  const mount = '<div id="root"></div>';
  if (!html.includes(mount)) throw new Error("[prerender] Falta el contenedor #root");
  return html.replace(mount, () => `<div id="root"><main id="main-content" style="${STYLE}">${r.body}</main></div>`);
}

const seen = new Set();
for (const r of routes) {
  if (seen.has(r.path)) throw new Error(`[prerender] Ruta duplicada: ${r.path}`);
  seen.add(r.path);
  const dir = r.path === "/" ? dist : join(dist, ...r.path.split("/").filter(Boolean));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), render(r));
}

rmSync(dirname(bundle), { recursive: true, force: true });
console.log(`[prerender] ${routes.length} páginas generadas`);
