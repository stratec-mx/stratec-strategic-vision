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

const baseUrl = "https://www.stratecsecurity.com";
const defaultImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/3948a78b-768d-4148-942e-e912d324102d";

export const seoConfig: Record<string, PageSEO> = {
  "/": {
    title: "STRATEC Security | Consultoría Estratégica de Seguridad Institucional",
    description: "STRATEC Security — consultoría estratégica de seguridad institucional en México. Auditorías de seguridad, análisis de riesgos, inteligencia institucional, protección civil, capacitación y cumplimiento normativo para gobierno, corporativos, universidades e industria.",
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
      // Servicios principales
      "consultoría estratégica de seguridad",
      "consultoría de seguridad México",
      "consultoría de seguridad institucional",
      "estrategia de seguridad institucional",
      "auditoría de seguridad institucional",
      "auditoría de seguridad", "auditoria de seguridad",
      "auditoría corporativa", "auditoria corporativa",
      "análisis de riesgos", "analisis de riesgos",
      "gestión de riesgos", "gestion de riesgos",
      "inteligencia institucional", "inteligencia de riesgos",
      "consultoría de inteligencia",
      "protección civil", "proteccion civil",
      "protección civil empresarial",
      "cumplimiento normativo",
      "capacitación en seguridad", "capacitacion en seguridad",
      "diagnóstico de seguridad", "diagnostico de seguridad",
      "diagnóstico institucional de seguridad",
      "gestión de crisis", "gestion de crisis",
      "plan de continuidad de negocio",
      // Gestoría (variantes)
      "gestoría de seguridad", "gestoria de seguridad", "gestoria seguridad",
      "gestor de seguridad", "gestores de seguridad",
      "gestor de riesgos", "gestores de riesgos",
      "gestión de seguridad institucional",
      // Asesoría
      "asesoría de seguridad", "asesoria de seguridad",
      "consultor de seguridad México",
      "empresa de seguridad institucional",
      "firma consultora seguridad",
      "perito en seguridad",
      "experto en seguridad institucional",
      "servicios de seguridad México",
      // Sectores
      "seguridad institucional México",
      "seguridad corporativa México",
      "seguridad para universidades", "seguridad universitaria",
      "seguridad escolar", "seguridad hospitalaria",
      "seguridad para gobierno",
      "seguridad industrial México", "seguridad industrial",
      "seguridad privada institucional",
      // Geografía
      "consultoría de seguridad Morelos",
      "consultoría de seguridad Cuernavaca",
      "consultor de seguridad Morelos",
      "consultor de seguridad Cuernavaca",
    ],
    ogImage: defaultImage,
    ogType: "website",
    canonicalUrl: `${baseUrl}/`
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

/**
 * Get SEO configuration for a specific path
 * Falls back to home page config if path not found
 */
export const getSEOConfig = (path: string): PageSEO => {
  return seoConfig[path] || seoConfig["/"];
};

/**
 * Utility function to update document meta tags
 */
export const updateMetaTags = (seo: PageSEO) => {
  // Title
  if (typeof document !== "undefined") {
    document.title = seo.title;

    // Meta Description
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute("content", seo.description);
    }

    // Keywords
    const keywordsTag = document.querySelector('meta[name="keywords"]');
    if (keywordsTag) {
      keywordsTag.setAttribute("content", seo.keywords.join(", "));
    }

    // Canonical URL
    const canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag && seo.canonicalUrl) {
      canonicalTag.setAttribute("href", seo.canonicalUrl);
    }

    // OG Tags
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute("content", seo.title);
    }

    const ogDescTag = document.querySelector('meta[property="og:description"]');
    if (ogDescTag) {
      ogDescTag.setAttribute("content", seo.description);
    }

    const ogImageTag = document.querySelector('meta[property="og:image"]');
    if (ogImageTag && seo.ogImage) {
      ogImageTag.setAttribute("content", seo.ogImage);
    }

    const ogUrlTag = document.querySelector('meta[property="og:url"]');
    if (ogUrlTag && seo.canonicalUrl) {
      ogUrlTag.setAttribute("content", seo.canonicalUrl);
    }
  }
};
