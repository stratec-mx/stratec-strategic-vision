// SEO Configuration and utilities

export const SITE_NAME = "STRATEC";
export const SITE_URL = "https://www.stratecsecurity.com";
export const SITE_DOMAIN = "www.stratecsecurity.com";

// ── Datos del consultor/autor — actualizar con nombre real y LinkedIn ────────
// E-E-A-T: señal de autoría para Google y agentes de IA (YMYL)
export const SITE_CONSULTANT = {
  name: "Juan Carlos González",
  title: "Coordinador General · STRATEC",
  bio: "12 años de trayectoria en seguridad institucional, implementación de Programas Internos de Protección Civil, auditorías de seguridad y gestión de riesgos para organizaciones públicas y privadas en México.",
  linkedin: "https://www.linkedin.com/company/stratec",
  methodologies: [
    { label: "ISO 31000:2018", desc: "Gestión del Riesgo" },
    { label: "ISO 22301",       desc: "Continuidad de Negocio" },
    { label: "LGPC",            desc: "Ley General de Protección Civil" },
    { label: "NOM-002-STPS",    desc: "Prevención y Protección contra Incendios" },
    { label: "NOM-030-STPS",    desc: "Servicios Preventivos de Seguridad y Salud" },
  ],
};

// ── Schema.org Person — para la señal de autoría E-E-A-T ─────────────────────
export const PERSON_SCHEMA = (consultant: typeof SITE_CONSULTANT) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": consultant.name,
  "jobTitle": consultant.title,
  "description": consultant.bio,
  "url": consultant.linkedin,
  "sameAs": [consultant.linkedin],
  "worksFor": {
    "@type": "Organization",
    "name": "STRATEC",
    "url": SITE_URL,
  },
  "knowsAbout": consultant.methodologies.map((m) => `${m.label} — ${m.desc}`),
});

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "STRATEC",
  "alternateName": "STRATEC Security & Consulting",
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "description": "Consultoría estratégica en seguridad institucional, nearshoring y protección civil en México",
  "sameAs": [
    "https://www.linkedin.com/company/stratec",
    "https://www.facebook.com/stratec",
    "https://www.instagram.com/stratec"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contacto@stratecsecurity.com",
    "contactType": "Customer Service",
    "areaServed": "MX",
    "availableLanguage": ["es", "en"]
  },
  "foundingDate": "2010",
  "foundingLocation": "Morelos, México",
  "areaServed": [
    "Morelos",
    "Cuernavaca",
    "Monterrey",
    "Querétaro",
    "Guadalajara",
    "CDMX"
  ],
  "serviceArea": {
    "@type": "Country",
    "name": "México"
  },
  "knowsAbout": [
    "Seguridad Institucional",
    "Consultoría de Riesgos",
    "Protección Civil",
    "Nearshoring",
    "Seguridad Industrial",
    "Normatividad STPS",
    "Gestión Documental"
  ]
};

export const LOCAL_BUSINESS_SCHEMA = (location: {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": `STRATEC - ${location.name}`,
  "image": `${SITE_URL}/logo.png`,
  "description": `Consultoría en seguridad institucional y protección civil en ${location.city}`,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": location.address,
    "addressLocality": location.city,
    "postalCode": location.postalCode,
    "addressCountry": "MX"
  },
  "telephone": location.phone,
  "url": SITE_URL,
  "priceRange": "$$$",
  "areaServed": location.city,
  "serviceType": [
    "Auditoría de Seguridad",
    "Consultoría Estratégica",
    "Protección Civil",
    "Gestión de Riesgos"
  ]
});

export const FAQ_SCHEMA = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const BREADCRUMB_SCHEMA = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const SERVICE_SCHEMA = (service: {
  name: string;
  description: string;
  image: string;
  url: string;
  keywords?: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": service.name,
  "description": service.description,
  "image": service.image,
  "url": service.url,
  "provider": {
    "@type": "Organization",
    "name": "STRATEC",
    "url": SITE_URL,
    "foundingLocation": "Morelos, México",
    "areaServed": ["Morelos", "Estado de Morelos", "Cuernavaca", "México"]
  },
  "areaServed": [
    { "@type": "AdministrativeArea", "name": "Estado de Morelos" },
    { "@type": "AdministrativeArea", "name": "Municipios de Morelos" },
    { "@type": "Country", "name": "México" }
  ],
  "serviceType": service.name,
  "offers": {
    "@type": "Offer",
    "priceCurrency": "MXN",
    "availability": "https://schema.org/InStock"
  }
});

export interface SeoMetadata {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product" | "profile";
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
}

export const DEFAULT_SEO: SeoMetadata = {
  title: "STRATEC | Consultoría Estratégica en Seguridad Institucional",
  description: "Consultoría premium en seguridad institucional, nearshoring, protección civil y normatividad STPS. Soluciones enterprise para industria y gobiernos en México.",
  image: `${SITE_URL}/og-image.png`,
  type: "website",
  keywords: [
    "consultoría seguridad",
    "seguridad institucional",
    "nearshoring",
    "protección civil",
    "STPS",
    "gestión documental",
    "inteligencia preventiva",
    "seguridad industrial"
  ]
};

export const SERVICE_PAGES_SEO = {
  auditoria: {
    title: "Auditoría de Seguridad Institucional | STRATEC",
    description: "Auditorías completas de seguridad para instituciones, empresas e industria. Análisis de vulnerabilidades, protocolos y soluciones estratégicas.",
    keywords: ["auditoría seguridad", "análisis de riesgos", "protocolos seguridad"]
  },
  "proteccion-civil": {
    title: "Protección Civil y Gestión de Emergencias | STRATEC",
    description: "Soluciones integrales de protección civil, planes de emergencia, coordinación de eventos y respuesta a contingencias.",
    keywords: ["protección civil", "gestión emergencias", "planes contingencia"]
  },
  "gestion-documental": {
    title: "Gestión Documental Normativa | STRATEC",
    description: "Sistemas de gestión documental conforme a NOM-035, ISO 31000 y regulaciones STPS. Cumplimiento normativo institucional.",
    keywords: ["gestión documental", "NOM-035", "cumplimiento normativo"]
  },
  "nom-035": {
    title: "Evaluación NOM-035 | Riesgos Psicosociales | STRATEC",
    description: "Evaluaciones y auditorías NOM-035 de factores de riesgo psicosocial. Diagnóstico y acciones de mitigación certificadas.",
    keywords: ["NOM-035", "factores psicosociales", "evaluación riesgos"]
  },
  "seguridad-eventos": {
    title: "Seguridad y Coordinación de Eventos | STRATEC",
    description: "Coordinación integral de seguridad para eventos corporativos, institucionales y de alto nivel. Personal operativo certificado.",
    keywords: ["seguridad eventos", "coordinación operativa", "personal seguridad"]
  },
  "control-acceso": {
    title: "Control de Acceso Biométrico Inteligente | STRATEC",
    description: "Sistemas de control de acceso biométrico avanzado. Integración con IA para seguridad física de instalaciones.",
    keywords: ["control acceso", "biometría", "seguridad física"]
  },
  "videovigilancia-ia": {
    title: "Videovigilancia con IA | Monitoreo Inteligente | STRATEC",
    description: "Sistemas de videovigilancia con inteligencia artificial. Detección automática de amenazas y monitoreo en tiempo real.",
    keywords: ["videovigilancia", "IA", "monitoreo inteligente"]
  }
};

export const BLOG_CATEGORIES_SEO = {
  "nom-035": {
    title: "NOM-035: Guía Completa de Cumplimiento | STRATEC",
    description: "Todo lo que necesitas saber sobre NOM-035. Evaluaciones, factores psicosociales, implementación de medidas preventivas."
  },
  nearshoring: {
    title: "Nearshoring y Seguridad Institucional | STRATEC",
    description: "Estrategias de nearshoring seguro. Consultoría para operaciones en México con máxima seguridad y cumplimiento normativo."
  },
  "proteccion-civil": {
    title: "Protección Civil y Gestión de Riesgos | STRATEC",
    description: "Artículos sobre protección civil, planes de emergencia, respuesta a contingencias y gestión de crisis."
  },
  "seguridad-industrial": {
    title: "Seguridad Industrial e Institucional | STRATEC",
    description: "Normatividad STPS, protocolos de seguridad industrial, análisis de riesgos y mejores prácticas enterprise."
  }
};
