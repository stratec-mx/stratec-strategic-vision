// Páginas que se generan como HTML estático al compilar (scripts/prerender.mjs).
// Así los buscadores reciben título, canónica y contenido propios de cada URL
// sin depender de JavaScript. React reemplaza este HTML al cargar.
import { getSEOConfig } from "@/config/seo";
import { coverageData, morelosFeatured } from "@/data/coverageData";
import { SERVICES_DATA, SERVICIOS_INDEX } from "@/data/servicesData";
import { REMOTE_GROUPS, remoteServices } from "@/data/remoteServices";
import { AREAS_TEXT, INCLUDES, FAQ, FAQ_CASA, FAQ_EVENTO } from "@/data/diagnosticoLanding";
import { DIAGNOSTICOS } from "@/data/diagnosticoPreguntas";
import { BREADCRUMB_SCHEMA, FAQ_SCHEMA, SERVICE_SCHEMA, SITE_URL } from "@/lib/seo";

export interface PrerenderRoute {
  path: string;
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage?: string;
  body: string;
  /** Datos estructurados propios de la página (se insertan en <head>). */
  jsonLd?: object[];
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
<h2>Genera y descarga tu diagnóstico PDF gratuito</h2>
${p("Un diagnóstico básico de seguridad para tu empresa o institución, sin costo: 10 preguntas, tu nivel de vulnerabilidad, las áreas a atender y un plan de acción en PDF.")}
<p>${a("/diagnostico", "Generar mi diagnóstico GRATIS")}</p>
<h2>Metodología</h2>
${ul(["Diagnóstico", "Análisis", "Estrategia", "Integración", "Implementación", "Seguimiento"].map(esc))}
<h2>Sectores</h2>
${ul(["Gobierno", "Industria", "Corporativos", "Construcción", "Educación", "Infraestructura", "Energía", "Logística"].map(esc))}
<h2>Cobertura</h2>${STATE_LINKS}`,
  );
}

/** Service, migas de pan y, si la página tiene preguntas, FAQPage: lo mismo que React agrega al cargar. */
function serviceJsonLd(s: (typeof SERVICES_DATA)[string], description: string): object[] {
  const url = `${SITE_URL}${s.href}`;
  const crumbs = [
    { name: "Inicio", url: SITE_URL },
    { name: "Servicios", url: `${SITE_URL}/servicios` },
    ...(s.parentBreadcrumb && s.parentHref ? [{ name: s.parentBreadcrumb, url: `${SITE_URL}${s.parentHref}` }] : []),
    { name: s.breadcrumb, url },
  ];
  return [
    SERVICE_SCHEMA({ name: s.h1, description, image: s.heroImage, url }),
    BREADCRUMB_SCHEMA(crumbs),
    ...(s.faqs?.length ? [FAQ_SCHEMA(s.faqs.map((f) => ({ question: f.q, answer: f.a })))] : []),
  ];
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
    const guide = (s.guide ?? [])
      .map((g) => {
        const items = g.items?.length ? g.items.map((i) => `<li>${esc(i)}</li>`).join("") : "";
        const list = items ? (g.ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`) : "";
        return `<h2>${esc(g.h2)}</h2>${p(g.p)}${list}`;
      })
      .join("");
    const faqs = s.faqs?.length
      ? `<h2>Preguntas frecuentes</h2>${s.faqs.map((f) => `<h3>${esc(f.q)}</h3>${p(f.a)}`).join("")}`
      : "";
    const related = s.related?.length ? `<h2>Servicios relacionados</h2>${ul(s.related.map((l) => a(l.href, l.label)))}` : "";
    const r = route(
      s.href,
      `<h1>${esc(s.h1)}</h1>${p(s.lead)}${p(s.intro)}${rag}${guide}${blocks}${deliverables}${list}${p(s.modalidades)}${p(s.nota)}${faqs}${related}<p>${a("/diagnostico", s.cta)}</p>`,
    );
    return { ...r, jsonLd: serviceJsonLd(s, r.description) };
  });
}

/** En Morelos se enlazan los servicios presenciales con el nombre del lugar. */
const featured = (slug: string, place: string) =>
  slug === "morelos" ? `<h2>Servicios más solicitados en ${esc(place)}</h2>${ul(morelosFeatured(place).map((l) => a(l.href, l.label)))}` : "";

function coverageRoutes() {
  const index = route("/cobertura", `<h1>Cobertura geográfica</h1>${p("Consultoría de seguridad institucional en México.")}${STATE_LINKS}`);
  const rest = Object.entries(coverageData).flatMap(([slug, st]) => {
    const cities = Object.entries(st.cities ?? {});
    const stateRoute = route(
      `/cobertura/${slug}`,
      `<h1>Consultoría de Seguridad Institucional en ${esc(st.state)}</h1>${p(st.defaultContext)}${featured(slug, st.state)}${st.defaultSectors?.length ? `<h2>Sectores</h2>${ul(st.defaultSectors.map(esc))}` : ""}${
        cities.length ? `<h2>Ciudades</h2>${ul(cities.map(([c, v]) => a(`/cobertura/${slug}/${c}`, v.name)))}` : ""
      }<h2>Servicios</h2>${SERVICE_LINKS}${REMOTE}`,
    );
    const cityRoutes = cities.map(([c, v]) =>
      route(
        `/cobertura/${slug}/${c}`,
        `<h1>Consultoría de Seguridad Institucional en ${esc(v.name)}</h1>${p(v.context)}${featured(slug, v.name)}<h2>Sectores</h2>${ul(v.sectors.map(esc))}<h2>Servicios</h2>${SERVICE_LINKS}${REMOTE}`,
      ),
    );
    return [stateRoute, ...cityRoutes];
  });
  return [index, ...rest];
}

const OTROS_DIAGNOSTICOS = `<h2>Otros diagnósticos gratuitos</h2>${ul(Object.values(DIAGNOSTICOS).map((d) => a(d.ruta, `Diagnóstico para ${d.etiqueta.toLowerCase()}`)))}`;

/** Diagnóstico de casa o de evento: su propia página con sus preguntas. */
function diagnosticoRoute(tipo: "casa" | "evento", faq: { q: string; a: string }[]): PrerenderRoute {
  const d = DIAGNOSTICOS[tipo];
  const l = d.landing;
  const previas = d.perfil.campos.filter((c) => c.antes);
  return route(
    d.ruta,
    `<h1>${esc(l.titulo)}</h1>${p(l.pregunta)}${p(l.intro)}
<h2>${esc(l.areasTitulo)}</h2>${l.areas.map((x) => `<h3>${esc(x.title)}</h3>${p(x.text)}`).join("")}
${previas.length ? `<h2>Antes de empezar</h2>${ul(previas.map((c) => esc(c.label)))}` : ""}
<h2>Resultado</h2>${p(l.resultado)}${p(l.alcance)}
<h2>Qué incluye tu PDF</h2>${ul(INCLUDES.map(esc))}
<h2>Preguntas frecuentes</h2>${faq.map((x) => `<h3>${esc(x.q)}</h3>${p(x.a)}`).join("")}${OTROS_DIAGNOSTICOS}`,
  );
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
      `<h1>Genera y descarga tu diagnóstico de seguridad en PDF, GRATIS</h1>${p("Responde 10 preguntas sobre tu empresa o institución y obtén tu nivel de vulnerabilidad, las áreas a atender y un plan de acción priorizado. Basado en la metodología ISO 31000 de gestión de riesgos. Sin costo, unos 3 minutos.")}
<h2>Qué evalúa</h2>${AREAS_TEXT.map((x) => `<h3>${esc(x.title)}</h3>${p(x.text)}`).join("")}
<h2>Cómo funciona</h2>${ul(["Responde 10 preguntas y algunos datos generales de tu organización.", "Deja un correo y un teléfono para recibir el resultado.", "Ve tu resultado y descarga el PDF."].map(esc))}
<h2>Qué incluye tu PDF</h2>${ul(INCLUDES.map(esc))}
<h2>Preguntas frecuentes</h2>${FAQ.map((x) => `<h3>${esc(x.q)}</h3>${p(x.a)}`).join("")}${OTROS_DIAGNOSTICOS}`,
    ),
    diagnosticoRoute("casa", FAQ_CASA),
    diagnosticoRoute("evento", FAQ_EVENTO),
    route(
      "/schedule",
      `<h1>Agende un diagnóstico estratégico confidencial.</h1>${p("Una sesión privada de 30 minutos para evaluar el contexto institucional de su organización y proponer un marco de actuación alineado a sus objetivos.")}`,
    ),
    ...["/privacidad", "/terminos", "/confidentiality"].map((path) => route(path, `<h1>${esc(heading(path))}</h1>${p(getSEOConfig(path).description)}`)),
  ];
}
