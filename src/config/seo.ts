/**
 * SEO Configuration for Dynamic Meta Tags
 * This file manages all dynamic metadata for each page
 */

interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
}

import { SERVICES_DATA } from "@/data/servicesData";
import { coverageData } from "@/data/coverageData";

const baseUrl = "https://www.stratecsecurity.com";
const defaultImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/3948a78b-768d-4148-942e-e912d324102d";

const staticConfig: Record<string, PageSEO> = {
  "/": {
    title: "STRATEC Security | Consultoría en Seguridad y Protección Civil para Empresas | México",
    description: "Consultoría en seguridad, análisis de riesgos y protección civil para empresas e instituciones en Morelos, CDMX, Puebla y Guerrero. Diagnóstico de vulnerabilidad gratuito en línea.",
    keywords: [
      // Variantes de marca (con c, k, z, s, sin e, con h, mal escritas)
      "STRATEC", "Stratec", "stratec",
      "ESTRATEC", "Estratec", "estratec",
      "STRATECK", "Strateck", "strateck",
      "ESTRATECK", "Estrateck", "estrateck",
      "STRATEZ", "Stratez", "estratez",
      "STRATES", "Strates", "strates",
      "STRATECH", "Stratech", "stratech",
      "ESTRATEG", "Estrateg", "estrateg",
      "STRATC", "Stratc", "Stratecs",
      "strate c", "strate-c",
      "STRATEC Security", "Stratec Security", "estratec security", "estrateck security",
      "STRATEC Consultoría", "Stratec Consultoría", "stratec consultoria", "estratec consultoria", "estrateck consultoria",
      // Normativa mexicana — PIPC y NOMs
      "PIPC", "Programa Interno de Protección Civil", "programa interno de proteccion civil",
      "elaboración de PIPC", "elaborar PIPC", "PIPC Morelos", "PIPC CDMX", "PIPC empresa",
      "NOM-002-STPS", "NOM-030-STPS", "reglamento de protección civil",
      "cumplimiento NOM seguridad", "normatividad protección civil",
      "trámite protección civil", "certificación protección civil",
      // Gestión de seguridad (variantes)
      "gestión de seguridad", "gestion de seguridad",
      "gestión integral de seguridad", "gestion integral de seguridad",
      "gestión de seguridad corporativa", "gestión de seguridad gubernamental",
      "gestión de seguridad industrial", "gestión de seguridad institucional",
      "gestión de seguridad Morelos", "gestión de seguridad México",
      // Gestoría (variantes)
      "gestoría de seguridad", "gestoria de seguridad", "gestoria seguridad",
      "gestor de seguridad", "gestores de seguridad",
      "gestor de riesgos", "gestores de riesgos",
      // Servicios principales
      "consultoría estratégica de seguridad",
      "consultoría de seguridad México",
      "consultoría de seguridad institucional",
      "estrategia de seguridad institucional",
      "auditoría de seguridad institucional",
      "auditoría de seguridad", "auditoria de seguridad",
      "auditoría corporativa", "auditoria corporativa",
      "análisis de riesgos", "analisis de riesgos",
      "evaluación de riesgo", "evaluacion de riesgo",
      "diagnóstico de vulnerabilidad", "analisis de vulnerabilidades",
      "gestión de riesgos", "gestion de riesgos",
      "modelado de riesgos", "matriz de riesgos",
      "inteligencia institucional", "inteligencia de riesgos",
      "inteligencia preventiva", "inteligencia operacional",
      "consultoría de inteligencia", "inteligencia estratégica",
      "protección civil", "proteccion civil",
      "protección civil empresarial", "protección civil institucional",
      "plan de emergencia", "plan de evacuacion", "plan de evacuación",
      "brigadas de emergencia", "brigada de protección civil",
      "simulacros empresariales", "simulacro de evacuacion",
      "atlas de riesgo", "diagnóstico de riesgo",
      "cumplimiento normativo",
      "capacitación en seguridad", "capacitacion en seguridad",
      "diagnóstico de seguridad", "diagnostico de seguridad",
      "diagnóstico estratégico de seguridad",
      "diagnóstico institucional de seguridad",
      "gestión de crisis", "gestion de crisis",
      "plan de continuidad de negocio", "continuidad operativa",
      "arquitectura de seguridad", "política de seguridad institucional",
      "cultura de seguridad", "programa de seguridad",
      // Tecnología
      "videovigilancia inteligente", "videovigilancia IA",
      "videovigilancia institucional", "CCTV institucional",
      "biometría institucional", "control de accesos",
      "seguridad perimetral", "monitoreo 24/7",
      "centro de control de seguridad", "sala de control",
      // Asesoría / long-tail
      "asesoría de seguridad", "asesoria de seguridad",
      "consultor de seguridad México",
      "contratar consultor de seguridad",
      "empresa de seguridad institucional",
      "empresa de seguridad Morelos",
      "firma consultora seguridad",
      "perito en seguridad",
      "experto en seguridad institucional",
      "experto en protección civil",
      "asesor de seguridad institucional",
      "servicios de seguridad México",
      // Sectores
      "seguridad institucional México",
      "seguridad corporativa México",
      "seguridad para universidades", "seguridad universitaria",
      "seguridad escolar", "seguridad hospitalaria",
      "seguridad para gobierno",
      "seguridad industrial México", "seguridad industrial",
      "seguridad en construcción", "seguridad en obras",
      "seguridad energética", "seguridad sector energía",
      "seguridad logística", "seguridad en transporte",
      "infraestructura crítica", "protección de infraestructura crítica",
      "seguridad privada institucional",
      // Geografía
      "consultoría de seguridad Morelos",
      "consultoría de seguridad Cuernavaca",
      "consultor de seguridad Morelos",
      "consultor de seguridad Cuernavaca",
      "empresa de seguridad Cuernavaca",
      "protección civil Morelos", "protección civil Cuernavaca",
    ],
    ogImage: defaultImage,
    ogType: "website",
    canonicalUrl: `${baseUrl}/`
  },
  "/servicios": {
    title: "Servicios de Consultoría en Seguridad y Protección Civil | STRATEC",
    description: "Consultoría, capacitación, integración tecnológica y gestión de riesgos para fortalecer la seguridad de empresas e instituciones públicas y privadas en México.",
    keywords: ["servicios de consultoría en seguridad", "protección civil para empresas", "análisis de riesgos"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/servicios`
  },
  "/diagnostico": {
    title: "Diagnóstico de Seguridad Gratuito en PDF para Empresas | ISO 31000 | STRATEC",
    description: "Genera y descarga gratis un diagnóstico básico de seguridad en PDF: 10 preguntas basadas en ISO 31000, nivel de vulnerabilidad, áreas a atender y plan de acción. Toma 3 minutos.",
    keywords: ["diagnóstico de vulnerabilidad", "diagnóstico de seguridad gratis", "diagnóstico de seguridad PDF", "evaluación de riesgos ISO 31000"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/diagnostico`
  },
  "/schedule": {
    title: "Agenda un Diagnóstico Estratégico Confidencial | STRATEC",
    description: "Sesión privada de 30 minutos con un consultor de STRATEC para evaluar el contexto de tu organización y proponer un marco de actuación.",
    keywords: ["agendar consultoría de seguridad", "diagnóstico estratégico"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/schedule`
  },
  "/cobertura": {
    title: "Cobertura Geográfica | STRATEC Security",
    description: "Cobertura de consultoría de seguridad institucional en México. Morelos, CDMX, Estado de México, Puebla, Guerrero y Jalisco.",
    keywords: ["cobertura", "seguridad institucional México", "consultoría por estado"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura`
  },
  "/cobertura/morelos": {
    title: "Consultoría de Seguridad Institucional en Morelos | STRATEC",
    description: "STRATEC ofrece auditorías de seguridad, gestión institucional y consultoría estratégica en Morelos. Servicio dirigido a gobierno, corporativos, universidades e industria.",
    keywords: ["consultoría seguridad Morelos", "auditoría seguridad Morelos", "seguridad institucional Morelos"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura/morelos`
  },
  "/cobertura/morelos/cuernavaca": {
    title: "Consultoría de Seguridad Institucional en Cuernavaca | STRATEC",
    description: "STRATEC ofrece auditorías de seguridad, gestión institucional y consultoría estratégica en Cuernavaca, Morelos. Servicio para gobierno, corporativos, universidades e industria.",
    keywords: ["consultoría seguridad Cuernavaca", "auditoría seguridad Cuernavaca", "seguridad institucional Cuernavaca"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura/morelos/cuernavaca`
  },
  "/cobertura/cdmx": {
    title: "Consultoría de Seguridad Institucional en CDMX | STRATEC",
    description: "Consultoría de seguridad institucional en Ciudad de México. Auditorías, análisis de riesgos y gestión normativa para gobierno federal, corporativos y organismos de la capital.",
    keywords: ["consultoría seguridad CDMX", "auditoría seguridad Ciudad de México", "seguridad corporativa CDMX"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura/cdmx`
  },
  "/cobertura/estado-de-mexico": {
    title: "Consultoría de Seguridad Institucional en Estado de México | STRATEC",
    description: "Consultoría de seguridad en Estado de México. Cobertura estratégica en zona metropolitana y región industrial.",
    keywords: ["consultoría seguridad Estado de México", "seguridad Toluca", "consultoría seguridad metropolitana"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura/estado-de-mexico`
  },
  "/cobertura/puebla": {
    title: "Consultoría de Seguridad Institucional en Puebla | STRATEC",
    description: "Consultoría especializada en seguridad para sector manufacturero y educativo en Puebla.",
    keywords: ["consultoría seguridad Puebla", "seguridad industrial Puebla"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura/puebla`
  },
  "/cobertura/guerrero": {
    title: "Consultoría de Seguridad Institucional en Guerrero | STRATEC",
    description: "Gestión integral de seguridad institucional en Guerrero. Análisis y consultoría en contextos de riesgos complejos.",
    keywords: ["consultoría seguridad Guerrero"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura/guerrero`
  },
  "/cobertura/jalisco-guadalajara": {
    title: "Consultoría de Seguridad Institucional en Guadalajara | STRATEC",
    description: "Cobertura con desplazamiento. Consultoría de seguridad para corporativos multinacionales en Guadalajara.",
    keywords: ["consultoría seguridad Guadalajara"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/cobertura/jalisco-guadalajara`
  },
  "/privacidad": {
    title: "Aviso de Privacidad | STRATEC Security",
    description: "Aviso de privacidad y protección de datos personales de STRATEC Security conforme a LFPDPPP.",
    keywords: ["privacidad", "protección de datos", "aviso de privacidad"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/privacidad`
  },
  "/terminos": {
    title: "Términos y Condiciones | STRATEC Security",
    description: "Términos y condiciones de uso de servicios y plataforma de STRATEC Security.",
    keywords: ["términos", "condiciones", "términos de servicio"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/terminos`
  },
  "/confidentiality": {
    title: "Confidencialidad | STRATEC Security",
    description: "Política de confidencialidad y protección de información institucional.",
    keywords: ["confidencialidad", "protección información"],
    ogType: "website",
    canonicalUrl: `${baseUrl}/confidentiality`
  }
};

/** Metadatos de las páginas de servicio, definidos junto a su contenido. */
const serviceConfig: Record<string, PageSEO> = Object.fromEntries(
  Object.values(SERVICES_DATA)
    .filter((svc) => svc.seo)
    .map((svc) => [
      svc.href,
      {
        title: svc.seo!.title,
        description: svc.seo!.description,
        keywords: svc.seo!.keywords,
        ogImage: svc.heroImage,
        ogType: "website",
        canonicalUrl: `${baseUrl}${svc.href}`,
      },
    ]),
);

/** Metadatos de cada estado y ciudad de cobertura sin entrada propia arriba. */
const coverageConfig: Record<string, PageSEO> = Object.fromEntries(
  Object.entries(coverageData).flatMap(([slug, st]) => {
    const statePath = `/cobertura/${slug}`;
    const stateEntry: [string, PageSEO] = [
      statePath,
      {
        title: `Consultoría de Seguridad en ${st.state} | STRATEC`,
        description: `Consultoría en seguridad, análisis de riesgos y protección civil para empresas e instituciones en ${st.state}.`,
        keywords: [`consultoría seguridad ${st.state}`, `protección civil ${st.state}`],
        ogType: "website",
        canonicalUrl: `${baseUrl}${statePath}`,
      },
    ];
    const cities = Object.entries(st.cities ?? {}).map(([citySlug, c]): [string, PageSEO] => [
      `${statePath}/${citySlug}`,
      {
        title: `Consultoría de Seguridad en ${c.name}, ${st.state} | STRATEC`,
        description: `Consultoría en seguridad, análisis de riesgos y protección civil para empresas e instituciones en ${c.name}, ${st.state}.`,
        keywords: [`consultoría seguridad ${c.name}`, `protección civil ${c.name}`],
        ogType: "website",
        canonicalUrl: `${baseUrl}${statePath}/${citySlug}`,
      },
    ]);
    return [stateEntry, ...cities];
  }),
);

export const seoConfig: Record<string, PageSEO> = { ...coverageConfig, ...serviceConfig, ...staticConfig };

const normalizePath = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

/**
 * Metadatos de una ruta. Una ruta sin entrada conserva los textos generales,
 * pero siempre con su propia URL canónica: nunca la de la página de inicio.
 */
export const getSEOConfig = (path: string): PageSEO => {
  const clean = normalizePath(path);
  return seoConfig[clean] ?? { ...seoConfig["/"], canonicalUrl: `${baseUrl}${clean}` };
};

const setAttr = (selector: string, attr: string, value: string) => {
  document.querySelectorAll(selector).forEach((el) => el.setAttribute(attr, value));
};

/**
 * Actualiza los metadatos al navegar dentro del sitio. Es el único responsable
 * de título, descripción y canónica; SeoHelmet ya no los duplica.
 */
export const updateMetaTags = (seo: PageSEO) => {
  if (typeof document === "undefined") return;
  const url = seo.canonicalUrl ?? baseUrl;
  const image = seo.ogImage ?? defaultImage;

  document.title = seo.title;
  setAttr('meta[name="description"]', "content", seo.description);
  setAttr('meta[name="keywords"]', "content", seo.keywords.join(", "));
  setAttr('link[rel="canonical"]', "href", url);
  setAttr('link[rel="alternate"][hreflang]', "href", url);
  setAttr('meta[property="og:url"]', "content", url);
  setAttr('meta[property="og:title"]', "content", seo.title);
  setAttr('meta[property="og:description"]', "content", seo.description);
  setAttr('meta[property="og:image"]', "content", image);
  setAttr('meta[name="twitter:title"]', "content", seo.title);
  setAttr('meta[name="twitter:description"]', "content", seo.description);
  setAttr('meta[name="twitter:image"]', "content", image);
};
