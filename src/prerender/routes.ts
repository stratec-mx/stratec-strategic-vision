// Páginas que se generan como HTML estático al compilar (scripts/prerender.mjs).
// Así los buscadores reciben título, canónica y contenido propios de cada URL
// sin depender de JavaScript. React reemplaza este HTML al cargar.
import { getSEOConfig } from "@/config/seo";
import { coverageData } from "@/data/coverageData";
import { SERVICES_DATA, SERVICIOS_INDEX } from "@/data/servicesData";
import { REMOTE_GROUPS, remoteServices } from "@/data/remoteServices";

export interface PrerenderRoute {
  path: string;
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage?: string;
  body: string;
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const p = (t?: string) => (t ? `<p>${esc(t)}</p>` : "");
const a = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
const ul = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>` : "");

const NAV = ul([
  a("/", "Inicio"),
  a("/servicios", "Servicios"),
  a("/cobertura", "Cobertura"),
  a("/diagnostico", "Diagnóstico gratuito"),
  a("/schedule", "Agendar"),
  a("/privacidad", "Aviso de privacidad"),
]);

const SERVICE_LINKS = ul(SERVICIOS_INDEX.map((s) => `${a(s.href, s.titulo)}: ${esc(s.descripcionCorta)}`));

const REMOTE = `<h2>Servicios a distancia</h2>${REMOTE_GROUPS.map(
  (g) => `<h3>${esc(g.need)}</h3>${p(g.text)}${ul(remoteServices(g).map((s) => `${a(s.href, s.titulo)}: ${esc(s.descripcionCorta)}`))}`,
).join("")}`;

const STATE_LINKS = ul(Object.entries(coverageData).map(([slug, st]) => a(`/cobertura/${slug}`, st.state)));

function route(path: string, content: string): PrerenderRoute {
  const seo = getSEOConfig(path);
  return {
    path,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.join(", "),
    canonical: seo.canonicalUrl ?? `https://www.stratecsecurity.com${path}`,
    ogImage: seo.ogImage,
    body: `${content}<nav aria-label="Secciones">${NAV}</nav>`,
  };
}

function homeRoute() {
  return route(
    "/",
    `<h1>Consultoría en Seguridad Institucional e Inteligencia Estratégica</h1>
${p("Asesoramos a gobiernos, corporativos e instituciones en la anticipación, prevención y gestión integral de riesgos.")}
${p("STRATEC integra inteligencia estratégica, gestión de riesgos y tecnología institucional para acompañar a organizaciones complejas en la toma de decisiones críticas.")}
<h2>Áreas de especialización</h2>${SERVICE_LINKS}
<h2>Diagnóstico de vulnerabilidad gratuito</h2>
${p("Evalúa qué tan vulnerable es tu inmueble en 3 minutos con 10 preguntas basadas en ISO 31000.")}
${p("")}<p>${a("/diagnostico", "Hacer el diagnóstico gratuito")}</p>
<h2>Metodología</h2>
${ul(["Diagnóstico", "Análisis", "Estrategia", "Integración", "Implementación", "Seguimiento"].map(esc))}
<h2>Sectores</h2>
${ul(["Gobierno", "Industria", "Corporativos", "Construcción", "Educación", "Infraestructura", "Energía", "Logística"].map(esc))}
<h2>Cobertura</h2>${STATE_LINKS}`,
  );
}

function serviceRoutes() {
  return Object.values(SERVICES_DATA).map((s) => {
    const blocks = s.blocks.map((b) => `<h2>${esc(b.h2)}</h2>${p(b.p)}`).join("");
    const deliverables = s.deliverables?.length
      ? `<h2>Fases y entregables</h2>${ul(s.deliverables.map((d) => `<strong>${esc(d.fase)}:</strong> ${esc(d.entregable)}. ${esc(d.queResuelve)}.`))}`
      : "";
    const list = s.deliverablesList?.length
      ? `<h2>${esc(s.deliverablesListTitle ?? "Entregables")}</h2>${ul(s.deliverablesList.map(esc))}`
      : "";
    const rag = s.ragSnippet ? `<h2>${esc(s.ragSnippet.h2)}</h2>${p(s.ragSnippet.p)}` : "";
    return route(
      s.href,
      `<h1>${esc(s.h1)}</h1>${p(s.lead)}${p(s.intro)}${blocks}${deliverables}${list}${rag}${p(s.modalidades)}${p(s.nota)}<p>${a("/diagnostico", s.cta)}</p>`,
    );
  });
}

function coverageRoutes() {
  const index = route("/cobertura", `<h1>Cobertura geográfica</h1>${p("Consultoría de seguridad institucional en México.")}${STATE_LINKS}`);
  const rest = Object.entries(coverageData).flatMap(([slug, st]) => {
    const cities = Object.entries(st.cities ?? {});
    const stateRoute = route(
      `/cobertura/${slug}`,
      `<h1>Consultoría de Seguridad Institucional en ${esc(st.state)}</h1>${p(st.defaultContext)}${st.defaultSectors?.length ? `<h2>Sectores</h2>${ul(st.defaultSectors.map(esc))}` : ""}${
        cities.length ? `<h2>Ciudades</h2>${ul(cities.map(([c, v]) => a(`/cobertura/${slug}/${c}`, v.name)))}` : ""
      }<h2>Servicios</h2>${SERVICE_LINKS}${REMOTE}`,
    );
    const cityRoutes = cities.map(([c, v]) =>
      route(
        `/cobertura/${slug}/${c}`,
        `<h1>Consultoría de Seguridad Institucional en ${esc(v.name)}</h1>${p(v.context)}<h2>Sectores</h2>${ul(v.sectors.map(esc))}<h2>Servicios</h2>${SERVICE_LINKS}${REMOTE}`,
      ),
    );
    return [stateRoute, ...cityRoutes];
  });
  return [index, ...rest];
}

export function buildRoutes(): PrerenderRoute[] {
  const heading = (path: string) => getSEOConfig(path).title.split(" | ")[0];
  return [
    homeRoute(),
    route(
      "/servicios",
      `<h1>Servicios</h1>${p("STRATEC desarrolla soluciones de consultoría, capacitación, integración tecnológica y gestión de riesgos orientadas a fortalecer las capacidades de seguridad de organizaciones públicas y privadas.")}${SERVICE_LINKS}${REMOTE}`,
    ),
    ...serviceRoutes(),
    ...coverageRoutes(),
    route(
      "/diagnostico",
      `<h1>Identifica qué tan vulnerable te encuentras</h1>${p("Evaluación guiada basada en la metodología ISO 31000 de gestión de riesgos. Responde 10 preguntas y obtén tu nivel de vulnerabilidad con un plan de acción priorizado. Toma unos 3 minutos.")}`,
    ),
    route(
      "/schedule",
      `<h1>Agende un diagnóstico estratégico confidencial.</h1>${p("Una sesión privada de 30 minutos para evaluar el contexto institucional de su organización y proponer un marco de actuación alineado a sus objetivos.")}`,
    ),
    ...["/privacidad", "/terminos", "/confidentiality"].map((path) => route(path, `<h1>${esc(heading(path))}</h1>${p(getSEOConfig(path).description)}`)),
  ];
}
