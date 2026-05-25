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
    title: "STRATEC Security — Consultoría en Seguridad Institucional, Auditorías e Inteligencia Estratégica | México",
    description: "Consultoría especializada en auditorías de seguridad institucional, análisis de riesgos, protocolos de seguridad, inteligencia preventiva y tecnología de videovigilancia para gobiernos, corporativos e industria en México.",
    keywords: [
      "auditoría de seguridad",
      "consultoría seguridad institucional",
      "análisis de riesgos",
      "protocolos seguridad",
      "inteligencia preventiva",
      "videovigilancia IA",
      "México",
      "seguridad corporativa",
      "análisis de riesgo"
    ],
    ogImage: defaultImage,
    canonicalUrl: `${baseUrl}/`
  },
  "/privacidad": {
    title: "Política de Privacidad | STRATEC Security",
    description: "Política de privacidad y protección de datos de STRATEC Security. Conoce cómo protegemos tu información.",
    keywords: ["privacidad", "protección de datos", "política de privacidad"],
    canonicalUrl: `${baseUrl}/privacidad`
  },
  "/terminos": {
    title: "Términos y Condiciones | STRATEC Security",
    description: "Términos y condiciones de uso de los servicios y plataforma de STRATEC Security.",
    keywords: ["términos", "condiciones", "términos de servicio"],
    canonicalUrl: `${baseUrl}/terminos`
  },
  "/servicios": {
    title: "Servicios de Consultoría en Seguridad | STRATEC Security",
    description: "Conoce nuestros servicios de auditoría de seguridad, análisis de riesgos, capacitación y asesoría estratégica.",
    keywords: [
      "servicios consultoría",
      "auditoría seguridad",
      "análisis de riesgos",
      "capacitación seguridad"
    ],
    canonicalUrl: `${baseUrl}/servicios`
  },
  "/sobre-nosotros": {
    title: "Sobre STRATEC Security — Expertise en Seguridad Institucional",
    description: "Conoce la historia, experiencia y trayectoria de STRATEC Security en consultoría de seguridad institucional.",
    keywords: [
      "sobre nosotros",
      "equipo STRATEC",
      "experiencia seguridad",
      "historia STRATEC"
    ],
    canonicalUrl: `${baseUrl}/sobre-nosotros`
  },
  "/contacto": {
    title: "Contacto | STRATEC Security — Solicita tu Diagnóstico",
    description: "Contacta a STRATEC Security para solicitar un diagnóstico estratégico y conocer cómo podemos ayudarte.",
    keywords: ["contacto", "solicitar diagnóstico", "asesoría"],
    canonicalUrl: `${baseUrl}/contacto`
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
