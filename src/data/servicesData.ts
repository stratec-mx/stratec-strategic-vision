// ─── STRATEC · Datos centralizados de servicios ────────────────────────────
// NOTA: Las imágenes de Unsplash son placeholders verificados (CDN gratuito).
// Para el mejor resultado, reemplaza con fotografía propia de contexto mexicano:
// coloca los archivos en /public/images/servicios/ y usa rutas relativas,
// ej: "/images/servicios/consultoria-seguridad.jpg"

export interface ServiceBlock {
  h2: string;
  p: string;
  blockImage: string; // imagen específica del sub-servicio (verificada en Unsplash)
}

export interface ServiceSeo {
  title: string;
  description: string;
  keywords: string[];
}

// ── GEO / RAG — Snippet de respuesta estructurado para motores de IA ─────────
export interface RagSnippet {
  /** Pregunta o frase conversacional — se renderiza como <h2> */
  h2: string;
  /** Párrafo de respuesta corta ≤ 55 palabras — inmediatamente bajo el H2 */
  p: string;
}

/** Fila de la tabla de entregables (se renderiza en <table> nativo para RAG) */
export interface RagDeliverable {
  fase: string;
  entregable: string;
  queResuelve: string;
}

/** Sección de contenido ampliado, siempre visible: qué es, a quién aplica, pasos, tiempos. */
export interface ServiceGuideSection {
  h2: string;
  p?: string;
  items?: string[];
  /** Lista numerada (pasos) en lugar de viñetas. */
  ordered?: boolean;
}

/** Pregunta frecuente: se muestra en la página y se publica como FAQPage. */
export interface ServiceFaq {
  q: string;
  a: string;
}

/** Enlace interno a un servicio, diagnóstico o página de cobertura relacionada. */
export interface ServiceLink {
  href: string;
  label: string;
}

export interface ServiceData {
  slug: string;
  numero: string;
  titulo: string;
  descripcionCorta: string;
  href: string;
  heroImage: string;
  /** Emblema o ilustración que reemplaza la foto del hero (se muestra completo, sin recortar). */
  heroEmblem?: string;
  breadcrumb: string;
  parentBreadcrumb?: string;
  parentHref?: string;
  h1: string;
  lead: string;
  intro?: string;
  blocks: ServiceBlock[];
  modalidades?: string;
  nota?: string;
  cta: string;
  gancho: string;
  seo?: ServiceSeo;
  // GEO / RAG / E-E-A-T
  ragSnippet?: RagSnippet;
  deliverables?: RagDeliverable[];
  deliverablesListTitle?: string;
  deliverablesList?: string[];
  guide?: ServiceGuideSection[];
  faqs?: ServiceFaq[];
  related?: ServiceLink[];
}

// ─── Índice de servicios (usado en homepage + /servicios) ──────────────────
export const SERVICIOS_INDEX: Pick<ServiceData, "numero" | "titulo" | "descripcionCorta" | "href" | "heroImage" | "gancho">[] = [
  {
    numero: "01",
    titulo: "Consultoría en Seguridad",
    descripcionCorta: "Diagnósticos, auditorías y estrategias de protección institucional.",
    href: "/servicios/consultoria-seguridad",
    heroImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "Toda organización enfrenta riesgos. La diferencia está en identificarlos antes de que se conviertan en pérdidas operativas, patrimoniales o reputacionales. Construimos diagnósticos precisos y estrategias de protección alineadas a tu operación.",
  },
  {
    numero: "02",
    titulo: "Protección Civil y Gestión Integral de Riesgos",
    descripcionCorta: "Programas internos, brigadas, simulacros y planes de continuidad.",
    href: "/servicios/proteccion-civil",
    heroImage: "https://images.unsplash.com/photo-1532883130016-f3d311140ba8?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "Una emergencia no avisa. La diferencia entre una crisis y una contingencia manejada es la preparación previa. Diseñamos tu programa, formamos tus brigadas y garantizamos la continuidad operativa.",
  },
  {
    numero: "03",
    titulo: "Capacitación Especializada",
    descripcionCorta: "Formación operativa en seguridad, riesgos y protección civil.",
    href: "/servicios/capacitacion",
    heroImage: "https://images.unsplash.com/photo-1566245024852-04fbf7842ce9?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "La seguridad depende de quienes la ejecutan. Formamos a tu personal con los protocolos, herramientas y criterios necesarios para actuar con eficacia frente a los riesgos reales de su entorno.",
  },
  {
    numero: "04",
    titulo: "Integración Tecnológica para la Seguridad",
    descripcionCorta: "Videovigilancia, monitoreo vehicular, control de accesos y proyectos integrales.",
    href: "/servicios/integracion-tecnologica",
    heroImage: "https://images.unsplash.com/photo-1589935447067-5531094415d1?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "No compras cámaras ni GPS: compras visibilidad, control operativo y capacidad de respuesta. Diseñamos arquitecturas tecnológicas integradas que trabajan al servicio de tu estrategia de seguridad.",
  },
  {
    numero: "05",
    titulo: "Consultoría para Gobierno e Instituciones",
    descripcionCorta: "Diagnósticos institucionales, planeación estratégica y seguridad urbana.",
    href: "/servicios/consultoria-gobierno",
    heroImage: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "La seguridad institucional requiere análisis técnico, planeación rigurosa y capacidad operativa sostenida. Acompañamos a dependencias y organismos en el fortalecimiento de sus modelos de seguridad con soluciones objetivas y auditables.",
  },
];

// Constancia que se entrega al concluir una capacitación. Es una constancia, no
// una certificación; la redacción es la misma en todas las páginas de capacitación.
const NOTA_CONSTANCIA_DC3 =
  "Al concluir, se entrega la constancia de competencias o de habilidades laborales DC-3 de la STPS.";

// ─── Datos completos por servicio ─────────────────────────────────────────
export const SERVICES_DATA: Record<string, ServiceData> = {

  // ── 01 · Consultoría en Seguridad ────────────────────────────────────────
  "consultoria-seguridad": {
    slug: "consultoria-seguridad",
    numero: "01",
    titulo: "Consultoría en Seguridad",
    descripcionCorta: "Diagnósticos, auditorías y estrategias de protección institucional.",
    href: "/servicios/consultoria-seguridad",
    heroImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Consultoría en Seguridad",
    h1: "Consultoría en Seguridad",
    lead: "Toda organización enfrenta riesgos. La diferencia radica en conocerlos antes de que se conviertan en pérdidas, interrupciones operativas o afectaciones patrimoniales. STRATEC desarrolla diagnósticos, auditorías y estrategias de protección que permiten a empresas, instituciones y organizaciones fortalecer sus capacidades de seguridad mediante soluciones objetivas, medibles y alineadas a su operación.",
    blocks: [
      {
        h2: "Diagnóstico Integral de Seguridad",
        p: "Evaluación estructurada de las condiciones de seguridad física, operativa y organizacional de una instalación, negocio o institución. El resultado es una visión clara de los riesgos existentes, las vulnerabilidades identificadas y las acciones prioritarias para reducir la exposición.",
        blockImage: "https://images.unsplash.com/photo-1771931321956-406056adbed3?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Auditoría de Seguridad",
        p: "Revisión técnica de procedimientos, infraestructura, controles internos y medidas de protección implementadas. Permite verificar el cumplimiento de protocolos, identificar desviaciones operativas y fortalecer los mecanismos de control.",
        blockImage: "https://images.unsplash.com/photo-1710181717510-8e3896937fbd?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Análisis de Riesgos y Vulnerabilidades",
        p: "Identificación de amenazas internas y externas que puedan afectar personas, activos, operaciones o información. Se desarrolla una matriz de riesgos que facilita la toma de decisiones y la priorización de recursos.",
        blockImage: "https://images.unsplash.com/photo-1643962577583-a4c880a109ae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Prevención de Pérdidas",
        p: "Diseño de medidas orientadas a reducir robos, fraudes, mermas, accesos no autorizados y otras situaciones que impactan la continuidad operativa.",
        blockImage: "https://images.unsplash.com/photo-1589935447067-5531094415d1?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Protocolos Institucionales",
        p: "Desarrollo de procedimientos de actuación ante incidentes, emergencias y situaciones críticas, adaptados al entorno y necesidades específicas de cada organización.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "Toda organización enfrenta riesgos. La diferencia está en identificarlos antes de que se conviertan en pérdidas operativas, patrimoniales o reputacionales. Construimos diagnósticos precisos y estrategias de protección alineadas a tu operación.",
    cta: "Solicitar diagnóstico especializado",
    seo: {
      title: "Consultoría en Seguridad para Empresas e Instituciones | STRATEC",
      description:
        "Diagnósticos de seguridad, auditorías de vulnerabilidades y estrategias de protección a medida para empresas e instituciones en México. Soluciones profesionales con enfoque ejecutivo.",
      keywords: [
        "consultoría en seguridad",
        "diagnóstico de seguridad institucional",
        "auditoría de seguridad",
        "análisis de riesgos y vulnerabilidades",
        "prevención de pérdidas",
        "protocolos de seguridad",
        "seguridad institucional México",
        "consultoría seguridad empresas",
        "gestión de riesgos corporativos",
      ],
    },
  },

  // ── 02 · Protección Civil y Gestión Integral de Riesgos ──────────────────
  "proteccion-civil": {
    slug: "proteccion-civil",
    heroEmblem: "/images/emblema-proteccion-civil.webp",
    numero: "02",
    titulo: "Protección Civil y Gestión Integral de Riesgos",
    descripcionCorta: "Programas internos, brigadas, simulacros y planes de continuidad.",
    href: "/servicios/proteccion-civil",
    heroImage: "https://images.unsplash.com/photo-1532883130016-f3d311140ba8?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Protección Civil y Gestión Integral de Riesgos",
    h1: "Protección Civil y Gestión Integral de Riesgos",
    lead: "La preparación es la herramienta más efectiva para reducir el impacto de una emergencia. STRATEC acompaña a organizaciones públicas y privadas en la identificación de riesgos, cumplimiento normativo y fortalecimiento de capacidades de respuesta.",
    blocks: [
      {
        h2: "Programas Internos de Protección Civil",
        p: "Diseño e integración de programas conforme a la normatividad aplicable, incorporando análisis de riesgos, organización interna y procedimientos de actuación.",
        blockImage: "https://images.unsplash.com/photo-1624638764471-cffef5035746?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Análisis de Riesgos",
        p: "Identificación de amenazas naturales, tecnológicas y humanas que puedan afectar la operación de una instalación o actividad.",
        blockImage: "https://images.unsplash.com/photo-1618607779902-5e491bf83477?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Brigadas de Emergencia",
        p: "Integración, capacitación y fortalecimiento de brigadas responsables de la atención inicial ante situaciones de emergencia.",
        blockImage: "https://images.unsplash.com/photo-1573871906629-f5c700caf507?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Simulacros",
        p: "Planeación, ejecución y evaluación de ejercicios prácticos orientados a medir la capacidad de respuesta institucional.",
        blockImage: "https://images.unsplash.com/photo-1758404958502-44f156617bae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Planes de Emergencia y Continuidad Operativa",
        p: "Desarrollo de estrategias que permitan mantener la operación o recuperar funciones críticas ante eventos disruptivos.",
        blockImage: "https://images.unsplash.com/photo-1722227089176-a981d2544b5f?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "Una emergencia no avisa. La diferencia entre una crisis y una contingencia manejada es la preparación previa. Diseñamos tu programa, formamos tus brigadas y garantizamos la continuidad operativa.",
    cta: "Solicitar propuesta especializada",
    seo: {
      title: "Protección Civil para Empresas en Morelos | STRATEC",
      description: "Protección civil para empresas e instituciones en Morelos: Programas Internos de Protección Civil (PIPC), brigadas de emergencia, simulacros y planes de continuidad operativa.",
      keywords: [
        "Programa Interno de Protección Civil",
        "PIPC",
        "protección civil Morelos",
        "protección civil municipios Estado de Morelos",
        "programa protección civil empresa",
        "brigadas de emergencia",
        "simulacros de evacuación",
        "gestión integral de riesgos",
        "plan de emergencia institucional",
        "protección civil Cuernavaca",
        "protección civil municipios Morelos",
        "continuidad operativa",
      ],
    },
  },

  // ── 03 · Capacitación Especializada ──────────────────────────────────────
  capacitacion: {
    slug: "capacitacion",
    numero: "03",
    titulo: "Capacitación Especializada",
    descripcionCorta: "Formación operativa en seguridad, riesgos y protección civil.",
    href: "/servicios/capacitacion",
    heroImage: "https://images.unsplash.com/photo-1566245024852-04fbf7842ce9?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Capacitación Especializada",
    h1: "Capacitación Especializada",
    lead: "La seguridad depende de las personas que la ejecutan. STRATEC desarrolla programas de formación orientados a fortalecer competencias, mejorar la capacidad de respuesta y generar una cultura preventiva dentro de organizaciones públicas y privadas.",
    blocks: [
      {
        h2: "Seguridad Institucional y Protocolos",
        p: "Diseño e implementación de Procedimientos Operativos Estandarizados (SOP), protocolos internos y mecanismos de actuación ante incidentes.",
        blockImage: "https://images.unsplash.com/photo-1652739758426-56a564265f9e?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Gestión Integral de Riesgos",
        p: "Metodologías para identificar, evaluar y gestionar riesgos en entornos institucionales y empresariales.",
        blockImage: "https://images.unsplash.com/photo-1659273144088-202efb9b86c8?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Protección Civil y Emergencias",
        p: "Capacitación para brigadas, responsables de seguridad y personal operativo.",
        blockImage: "https://images.unsplash.com/photo-1589476993526-4b4317f5e188?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Prevención de Fraudes e Ingeniería Social",
        p: "Programas orientados a reducir riesgos asociados a phishing, vishing, fraude corporativo y manipulación de información.",
        blockImage: "https://images.unsplash.com/photo-1552622594-f27a9f6103a3?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Atención a Personas en Situación de Vulnerabilidad",
        p: "Capacitación en protocolos de primer contacto, atención inicial y actuación institucional.",
        blockImage: "https://images.unsplash.com/photo-1605071483252-41904a888644?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "Presencial · Virtual · In Company",
    nota: NOTA_CONSTANCIA_DC3,
    gancho:
      "La seguridad depende de quienes la ejecutan. Formamos a tu personal con los protocolos, herramientas y criterios necesarios para actuar con eficacia frente a los riesgos reales de su entorno.",
    cta: "Solicitar programa de capacitación",
    seo: {
      title: "Capacitación en Seguridad y Protección Civil para Empresas | STRATEC",
      description: "Capacitación en seguridad, gestión de riesgos y protección civil para empresas, instituciones y corporaciones en México. Programas a la medida de cada organización.",
      keywords: [
        "capacitación policial",
        "capacitación policía municipal",
        "programas de prevención",
        "prevención social del delito",
        "capacitación en seguridad institucional",
        "formación en protección civil",
        "capacitación brigadas de emergencia",
        "prevención de riesgos",
        "cultura de seguridad",
        "capacitación corporativa seguridad",
        "prevención social violencia México",
      ],
    },
  },

  // ── 04 · Integración Tecnológica para la Seguridad ───────────────────────
  "integracion-tecnologica": {
    slug: "integracion-tecnologica",
    numero: "04",
    titulo: "Integración Tecnológica para la Seguridad",
    descripcionCorta: "Videovigilancia, monitoreo vehicular, control de accesos y proyectos integrales.",
    href: "/servicios/integracion-tecnologica",
    heroImage: "https://images.unsplash.com/photo-1589935447067-5531094415d1?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Integración Tecnológica para la Seguridad",
    h1: "Integración Tecnológica para la Seguridad",
    lead: "La tecnología genera valor cuando se integra a una estrategia de seguridad. STRATEC diseña soluciones tecnológicas orientadas a mejorar la supervisión, fortalecer el control operativo y proporcionar información útil para la toma de decisiones.",
    intro: "Porque el cliente no compra cámaras ni GPS. Compra visibilidad, control, supervisión, evidencia y capacidad de respuesta.",
    blocks: [
      {
        h2: "Sistemas de Videovigilancia",
        p: "Diseño e implementación de soluciones de monitoreo mediante cámaras de seguridad para hogares, comercios, empresas e instituciones. Incluye evaluación de cobertura, configuración y optimización de recursos tecnológicos.",
        blockImage: "https://images.unsplash.com/photo-1528312635006-8ea0bc49ec63?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Monitoreo Vehicular Inteligente",
        p: "Implementación de sistemas de localización satelital que permiten supervisar rutas, activos móviles y unidades operativas en tiempo real. Las soluciones incorporan herramientas de geolocalización, alertamiento, análisis de recorridos y control de flotas.",
        blockImage: "https://images.unsplash.com/photo-1549109926-58f039549485?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Videotelemática y Cámaras Vehiculares",
        p: "Integración de cámaras embarcadas para registrar eventos durante la operación de vehículos corporativos, comerciales o institucionales. Permite generar evidencia, fortalecer la supervisión operativa y mejorar la gestión de incidentes.",
        blockImage: "https://images.unsplash.com/photo-1617897711385-df9c86b7dfe3?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Control de Accesos",
        p: "Implementación de sistemas destinados a regular y registrar el ingreso de personas, vehículos y proveedores.",
        blockImage: "https://images.unsplash.com/photo-1585206031650-9e9a7c87dcfe?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Sistemas de Alarma y Detección",
        p: "Soluciones orientadas a la detección temprana de eventos de riesgo y fortalecimiento de la capacidad de respuesta.",
        blockImage: "https://images.unsplash.com/photo-1618482914248-29272d021005?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Proyectos Integrales de Seguridad",
        p: "Diseño de arquitecturas tecnológicas que integran videovigilancia, monitoreo vehicular, control de accesos y sistemas de protección en una solución coordinada.",
        blockImage: "https://images.unsplash.com/photo-1530151928300-3864d0e5d178?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "No compras cámaras ni GPS: compras visibilidad, control operativo y capacidad de respuesta. Diseñamos arquitecturas tecnológicas integradas que trabajan al servicio de tu estrategia de seguridad.",
    cta: "Solicitar evaluación tecnológica",
    seo: {
      title: "Videovigilancia, Monitoreo Vehicular y Control de Accesos | STRATEC",
      description:
        "Integración de sistemas tecnológicos de seguridad: videovigilancia CCTV, monitoreo vehicular GPS, control de accesos y proyectos integrales para empresas e instituciones en México.",
      keywords: [
        "sistemas de videovigilancia",
        "videovigilancia CCTV empresas",
        "monitoreo vehicular GPS",
        "control de accesos",
        "cámaras de seguridad",
        "sistemas de alarma",
        "videotelemática",
        "integración tecnológica seguridad",
        "proyectos integrales de seguridad",
        "tecnología de seguridad institucional",
      ],
    },
  },

  // ── 05 · Consultoría para Gobierno e Instituciones ───────────────────────
  "consultoria-gobierno": {
    slug: "consultoria-gobierno",
    numero: "05",
    titulo: "Consultoría para Gobierno e Instituciones",
    descripcionCorta: "Diagnósticos institucionales, planeación estratégica y seguridad urbana.",
    href: "/servicios/consultoria-gobierno",
    heroImage: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Consultoría para Gobierno e Instituciones",
    h1: "Consultoría para Gobierno e Instituciones",
    lead: "La seguridad institucional requiere análisis técnico, planeación estratégica y mecanismos de gestión que permitan fortalecer capacidades y optimizar recursos. STRATEC desarrolla soluciones dirigidas a dependencias públicas, organismos autónomos, instituciones educativas y organizaciones que requieren instrumentos especializados para la toma de decisiones.",
    blocks: [
      {
        h2: "Diagnósticos Institucionales",
        p: "Evaluación de capacidades operativas, procedimientos y estructuras organizacionales relacionadas con la seguridad.",
        blockImage: "https://images.unsplash.com/photo-1573181759662-1c146525b21f?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Planeación Estratégica",
        p: "Diseño de programas, proyectos e instrumentos orientados al fortalecimiento institucional.",
        blockImage: "https://images.unsplash.com/photo-1616873354936-b9e21b744c54?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Seguridad Urbana y Entornos Seguros",
        p: "Análisis de espacios, infraestructura y dinámicas de riesgo para la generación de entornos más seguros y funcionales.",
        blockImage: "https://images.unsplash.com/photo-1627397159237-d2acb7f500af?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Prevención y Gestión de Riesgos",
        p: "Desarrollo de estrategias preventivas orientadas a reducir vulnerabilidades y fortalecer capacidades de respuesta.",
        blockImage: "https://images.unsplash.com/photo-1667849921481-9e13c239ee3d?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Estudios Especializados",
        p: "Elaboración de análisis técnicos, reportes ejecutivos, diagnósticos sectoriales y documentos estratégicos para la toma de decisiones.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
    ],
    nota: "Cuando la institución lo solicita, se firma un acuerdo de confidencialidad. Los detalles de cada intervención se presentan exclusivamente en propuesta dirigida.",
    gancho:
      "La seguridad institucional requiere análisis técnico, planeación rigurosa y capacidad operativa sostenida. Acompañamos a dependencias y organismos en el fortalecimiento de sus modelos de seguridad con soluciones objetivas y auditables.",
    cta: "Solicitar propuesta dirigida",
    seo: {
      title: "Consultoría en Seguridad para Municipios y Gobierno | Plan de Prevención Social | STRATEC",
      description:
        "Consultoría especializada en seguridad pública, planeación estratégica y Plan de Prevención Social para municipios del Estado de Morelos y todo México. Diagnósticos institucionales con resultados auditables.",
      keywords: [
        "consultoría seguridad municipal",
        "plan de prevención social municipios",
        "Plan de Prevención Social para Municipios",
        "seguridad pública municipal",
        "diagnóstico institucional seguridad",
        "planeación estratégica seguridad pública",
        "seguridad urbana México",
        "consultoría gobierno Morelos",
        "prevención social violencia",
        "programa prevención social delito municipios",
        "seguridad municipal Estado de Morelos",
        "modelo de seguridad institucional",
      ],
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINAS ESPECÍFICAS DE SERVICIOS (SEO individual por keyword)
  // ════════════════════════════════════════════════════════════════════════════

  // ── S1 · Programa Interno de Protección Civil ─────────────────────────────
  "programa-interno-proteccion-civil": {
    slug: "programa-interno-proteccion-civil",
    numero: "02.1",
    titulo: "Programa Interno de Protección Civil",
    descripcionCorta: "Diseño e implementación del PIPC conforme a normatividad federal y estatal.",
    href: "/servicios/programa-interno-proteccion-civil",
    heroImage: "https://images.unsplash.com/photo-1624638764471-cffef5035746?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Programa Interno de Protección Civil",
    parentBreadcrumb: "Protección Civil y Gestión de Riesgos",
    parentHref: "/servicios/proteccion-civil",
    h1: "Programa Interno de Protección Civil en Cuernavaca y Morelos",
    lead: "El Programa Interno de Protección Civil (PIPC) es el plan con el que tu empresa, escuela o institución se organiza para prevenir riesgos y actuar en una emergencia, y es un requisito de Protección Civil para muchos inmuebles. STRATEC lo elabora a la medida de tu inmueble conforme a la Ley General de Protección Civil y la normatividad del Estado de Morelos, y te acompaña a presentarlo ante la autoridad.",
    intro: "No es un documento para el cajón: es el sistema que permite a tu organización prevenir, responder y recuperarse ante cualquier evento de riesgo.",
    blocks: [
      {
        h2: "Diagnóstico de Riesgos del Inmueble",
        p: "Identificación de amenazas internas y externas que pueden afectar las instalaciones y al personal: riesgos sísmicos, hidrológicos, químicos, eléctricos, de incendio y de origen humano. El diagnóstico es la base técnica del PIPC y permite priorizar medidas con criterio, no por intuición.",
        blockImage: "https://images.unsplash.com/photo-1643962577583-a4c880a109ae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Estructura Organizacional Interna",
        p: "Definición de la Unidad Interna de Protección Civil (UIPC): responsables, suplentes, funciones y cadenas de mando. Establecemos quién hace qué antes, durante y después de una emergencia, con organigramas claros y responsabilidades documentadas.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Procedimientos de Actuación ante Emergencias",
        p: "Redacción de protocolos específicos por tipo de evento: sismo, incendio, derrames, amenaza de bomba, desastres naturales y accidentes laborales. Cada procedimiento se adapta a la realidad operativa de la organización, no a un formato genérico.",
        blockImage: "https://images.unsplash.com/photo-1573871906629-f5c700caf507?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Señalización, Rutas y Zonas de Seguridad",
        p: "Revisión y actualización de señalética, rutas de evacuación, puntos de reunión y zonas de seguridad conforme a normas NOM aplicables. Se elaboran planos de evacuación actualizados para cada área del inmueble.",
        blockImage: "https://images.unsplash.com/photo-1758404958502-44f156617bae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Presentación ante Protección Civil",
        p: "Integramos el programa con los requisitos formales y técnicos que pide la autoridad y te acompañamos en el trámite ante la Unidad Municipal o la Coordinación Estatal de Protección Civil de Morelos, según corresponda. La revisión y la aprobación son decisión de la autoridad.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "Presencial · A distancia (videollamada, planos y recorrido por video)",
    gancho:
      "Una inspección o una emergencia no son el momento de descubrir que falta tu Programa Interno. Lo elaboramos a la medida de tu inmueble y te acompañamos a presentarlo ante Protección Civil.",
    cta: "Solicitar mi Programa Interno",
    ragSnippet: {
      h2: "¿Tu empresa en Cuernavaca o Morelos necesita Programa Interno de Protección Civil?",
      p: "El Programa Interno de Protección Civil es el plan con el que un inmueble se organiza para prevenir riesgos, actuar en una emergencia y recuperarse. STRATEC lo elabora en Cuernavaca y todo Morelos: análisis de riesgos, Unidad Interna, brigadas, procedimientos, planos y acompañamiento ante Protección Civil. Como referencia, toma de 4 a 8 semanas.",
    },
    deliverables: [
      { fase: "1 · Diagnóstico",    entregable: "Informe de riesgos del inmueble (amenazas internas y externas)",         queResuelve: "Identifica qué pone en riesgo a su personal e instalaciones" },
      { fase: "2 · Estructura",     entregable: "Organigrama de la Unidad Interna de Protección Civil (UIPC)",            queResuelve: "Define quién hace qué antes, durante y después de una emergencia" },
      { fase: "3 · Procedimientos", entregable: "Protocolos por tipo de evento: sismo, incendio, derrames, amenaza",      queResuelve: "Elimina la improvisación cuando el tiempo no da margen de error" },
      { fase: "4 · Señalización",   entregable: "Planos de evacuación actualizados + revisión de señalética NOM",         queResuelve: "Cumple los requisitos visuales exigidos en inspecciones oficiales" },
      { fase: "5 · Presentación",   entregable: "Acompañamiento en el trámite ante Protección Civil (municipal o estatal)", queResuelve: "Presentas el programa completo y con los requisitos formales" },
      { fase: "6 · Cierre",         entregable: "Programa completo + calendario de capacitación y simulacros",            queResuelve: "Evidencia documental ante autoridades, clientes y auditores" },
    ],
    deliverablesListTitle: "¿Para qué tipo de organización aplica el PIPC?",
    deliverablesList: [
      "Empresas industriales, comerciales y de servicios",
      "Instituciones educativas: colegios, universidades y centros de capacitación",
      "Clínicas, hospitales y centros médicos privados",
      "Hoteles, restaurantes, salones de eventos y lugares con afluencia de público",
      "Dependencias municipales y organismos públicos del Estado de Morelos",
      "Desarrollos inmobiliarios, centros comerciales y edificios de oficinas",
      "Empresas que participan en licitaciones y deben acreditar cumplimiento en protección civil",
    ],
    guide: [
      {
        h2: "¿Qué es el Programa Interno de Protección Civil?",
        p: "Es el documento, y el plan de trabajo que lo acompaña, con el que un inmueble se organiza para prevenir accidentes, responder a una emergencia y volver a operar después. Reúne el análisis de riesgos del lugar, quién forma la Unidad Interna de Protección Civil, qué hace cada brigada, los procedimientos ante sismo o incendio, los planos de evacuación y el calendario de capacitación y simulacros. Se organiza en tres partes:",
        items: [
          "Prevención: lo que se hace todos los días para que no pase nada, como revisiones, mantenimiento, señalización y capacitación.",
          "Auxilio: qué hace cada persona durante la emergencia: dar la alerta, evacuar, dar primeros auxilios o controlar un conato de incendio.",
          "Recuperación: cómo se revisa el inmueble y se vuelve a operar después del evento.",
        ],
      },
      {
        h2: "¿Quién necesita un Programa Interno en Cuernavaca y Morelos?",
        p: "Lo necesitan, en general, los inmuebles donde trabajan o acuden personas: empresas, comercios, escuelas, clínicas, hoteles, salones de eventos, edificios de oficinas y dependencias de gobierno. Qué establecimientos están obligados, y con qué nivel de detalle, lo determinan la ley estatal de protección civil y el reglamento de cada municipio según el giro, el tamaño del inmueble, el número de personas y el nivel de riesgo. En la primera llamada revisamos tu caso y te decimos qué aplica.",
      },
      {
        h2: "Cómo elaboramos tu Programa Interno, paso a paso",
        ordered: true,
        items: [
          "Llamada inicial: conocemos tu inmueble, tu giro y los documentos que ya tienes, y te enviamos una cotización con alcance y calendario.",
          "Visita y análisis de riesgos: recorremos el inmueble para identificar riesgos internos y externos: sismo, incendio, instalaciones, inundación y entorno.",
          "Unidad Interna y brigadas: definimos responsables, suplentes y brigadas, con sus funciones antes, durante y después de una emergencia.",
          "Procedimientos y planos: redactamos los procedimientos para cada tipo de emergencia y elaboramos los planos con rutas de evacuación, salidas, equipo de emergencia y puntos de reunión.",
          "Capacitación y simulacro: preparamos a las brigadas y probamos el programa con un simulacro.",
          "Entrega y trámite: te entregamos el programa completo y te acompañamos a presentarlo ante la Unidad Municipal o la Coordinación Estatal de Protección Civil.",
        ],
      },
      {
        h2: "¿Qué recibes?",
        items: [
          "El Programa Interno completo, listo para presentarse ante Protección Civil.",
          "El análisis de riesgos del inmueble.",
          "El acta y el organigrama de la Unidad Interna de Protección Civil.",
          "Los procedimientos de actuación para cada tipo de emergencia.",
          "Los planos de evacuación y la revisión de la señalización.",
          "El programa anual de capacitación y simulacros, con formatos para registrar cada actividad.",
          "La constancia DC-3 para el personal que concluye la capacitación de brigadas.",
        ],
      },
      {
        h2: "¿Cuánto tiempo tarda?",
        p: "Depende del tamaño del inmueble, de sus riesgos y de cuánta documentación ya exista. Como referencia, integrar el programa toma de 4 a 8 semanas; el calendario exacto va en la cotización. Los tiempos de revisión y respuesta de Protección Civil los fija cada autoridad y no dependen de nosotros.",
      },
      {
        h2: "¿Por qué elaborarlo con STRATEC?",
        items: [
          "Registro como consultor en Protección Civil en el Estado de Morelos.",
          "Más de 300 personas capacitadas en seguridad y protección civil.",
          "Experiencia con instituciones de seguridad pública, prevención y procuración de justicia.",
          "Un programa hecho para tu inmueble, no un formato genérico.",
          "Al concluir la capacitación se entrega la constancia DC-3.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Qué es el Programa Interno de Protección Civil?",
        a: "Es el documento con el que un inmueble se organiza para prevenir riesgos, actuar durante una emergencia y recuperarse después. Incluye el análisis de riesgos, la Unidad Interna de Protección Civil, las brigadas, los procedimientos de emergencia, los planos de evacuación y el calendario de capacitación y simulacros.",
      },
      {
        q: "¿Mi negocio en Morelos está obligado a tener Programa Interno de Protección Civil?",
        a: "Depende del giro, del tamaño del inmueble, del número de personas y del nivel de riesgo, según la ley estatal de protección civil y el reglamento de tu municipio. Es común que se pida a empresas, escuelas, clínicas, hoteles y lugares con afluencia de público. En la primera llamada revisamos tu caso.",
      },
      {
        q: "¿Cuánto tarda elaborar el Programa Interno?",
        a: "Como referencia, de 4 a 8 semanas para integrarlo, según el tamaño del inmueble y la información disponible. La revisión de la autoridad tiene sus propios tiempos, que no dependen de nosotros.",
      },
      {
        q: "¿Qué documentos necesito para empezar?",
        a: "Los que ya tengas: datos generales de la empresa y del inmueble, planos o croquis, lista de personal por área, constancias de capacitación anteriores y registros de mantenimiento de extintores e instalaciones. Si falta algo, te decimos cómo conseguirlo.",
      },
      {
        q: "¿Ustedes presentan el programa ante Protección Civil?",
        a: "Te entregamos el programa listo para presentarse y te acompañamos en el trámite ante la Unidad Municipal o la Coordinación Estatal de Protección Civil de Morelos, según corresponda. La revisión y la aprobación son decisión de la autoridad.",
      },
      {
        q: "¿Cada cuánto se actualiza el Programa Interno?",
        a: "Conviene revisarlo cada año y siempre que cambie algo importante: el inmueble, el giro, el personal responsable o los riesgos. La vigencia y la renovación las marca la autoridad de tu municipio o del estado.",
      },
      {
        q: "Ya tengo un Programa Interno, ¿pueden revisarlo?",
        a: "Sí. Con la revisión de Programa Interno analizamos tus documentos a distancia y te entregamos un reporte con lo que falta, lo que está vencido y lo que conviene corregir antes de una inspección.",
      },
      {
        q: "¿La capacitación de brigadas incluye constancia?",
        a: "Sí. Al concluir la capacitación se entrega la constancia DC-3.",
      },
    ],
    related: [
      { href: "/servicios/capacitacion-brigadas-emergencia", label: "Capacitación de brigadas de emergencia" },
      { href: "/servicios/revision-programa-interno", label: "Revisión de tu Programa Interno" },
      { href: "/servicios/estudio-analisis-riesgo", label: "Estudio y análisis de riesgo" },
      { href: "/servicios/plan-continuidad-operaciones", label: "Plan de continuidad de operaciones" },
      { href: "/servicios/proteccion-civil-eventos-masivos", label: "Protección Civil para eventos masivos" },
      { href: "/diagnostico", label: "Diagnóstico de seguridad gratuito" },
      { href: "/cobertura/morelos/cuernavaca", label: "STRATEC en Cuernavaca" },
    ],
    seo: {
      title: "Programa Interno de Protección Civil en Cuernavaca y Morelos | STRATEC",
      description:
        "Elaboramos tu Programa Interno de Protección Civil en Cuernavaca y todo Morelos: análisis de riesgos, brigadas, planos y acompañamiento ante Protección Civil.",
      keywords: [
        "Programa Interno de Protección Civil",
        "PIPC",
        "Programa Interno de Protección Civil Morelos",
        "Programa Interno de Protección Civil Cuernavaca",
        "programa protección civil empresa Morelos",
        "protección civil municipios Morelos",
        "PIPC Estado de Morelos",
        "protección civil Cuernavaca",
        "unidad interna de protección civil",
        "registro PIPC Morelos",
        "protección civil normatividad México",
        "diseño programa protección civil",
        "cumplimiento protección civil empresa",
      ],
    },
  },

  // ── S2 · Capacitación de Brigadas de Emergencia ───────────────────────────
  "capacitacion-brigadas-emergencia": {
    slug: "capacitacion-brigadas-emergencia",
    numero: "03.1",
    titulo: "Capacitación de Brigadas de Emergencia",
    descripcionCorta: "Formación especializada para brigadas de evacuación, primeros auxilios e incendios.",
    href: "/servicios/capacitacion-brigadas-emergencia",
    heroImage: "https://images.unsplash.com/photo-1573871906629-f5c700caf507?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Capacitación de Brigadas de Emergencia",
    parentBreadcrumb: "Capacitación Especializada",
    parentHref: "/servicios/capacitacion",
    h1: "Capacitación de Brigadas de Emergencia en Cuernavaca y Morelos",
    lead: "Las brigadas de emergencia son el primer eslabón de respuesta dentro de cualquier organización. STRATEC forma y evalúa a los integrantes de tus brigadas con entrenamiento práctico, protocolos actualizados y evaluaciones reales, para que actúen con eficacia cuando una emergencia no da tiempo de improvisar.",
    blocks: [
      {
        h2: "Brigada de Evacuación",
        p: "Formación en liderazgo de evacuación, manejo de flujos de personas, atención a personal con movilidad reducida y coordinación con autoridades externas. Los brigadistas aprenden a conducir evacuaciones ordenadas incluso bajo condiciones de estrés o visibilidad reducida.",
        blockImage: "https://images.unsplash.com/photo-1758404958502-44f156617bae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Brigada de Primeros Auxilios",
        p: "Entrenamiento en evaluación inicial de víctimas, RCP básico, atención de hemorragias, quemaduras, fracturas y traslado seguro. Protocolo de activación del sistema de emergencias médicas y coordinación hasta la llegada de servicios especializados.",
        blockImage: "https://images.unsplash.com/photo-1605071483252-41904a888644?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Brigada contra Incendios",
        p: "Uso correcto de extintores portátiles, clases de fuego, técnicas de control y extinción, manejo de mangueras y equipos de protección personal básico. Identificación de conatos y activación del protocolo de evacuación ante fuego.",
        blockImage: "https://images.unsplash.com/photo-1624638764471-cffef5035746?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Brigada de Búsqueda y Rescate",
        p: "Técnicas de búsqueda en espacios confinados y áreas comprometidas, rescate básico sin equipos especializados y estabilización de víctimas. Coordinación con cuerpos de rescate profesionales para la transferencia segura de personas atrapadas o lesionadas.",
        blockImage: "https://images.unsplash.com/photo-1589476993526-4b4317f5e188?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Evaluación, Simulacros y Constancias",
        p: "Al término de cada programa se realiza un ejercicio práctico de evaluación y, cuando aplica, un simulacro interno coordinado. Se emiten constancias individuales y un informe de desempeño para la documentación del PIPC.",
        blockImage: "https://images.unsplash.com/photo-1652739758426-56a564265f9e?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "Presencial · In Company · Sesiones intensivas de 4–8 horas",
    nota: NOTA_CONSTANCIA_DC3,
    gancho:
      "Una brigada sin entrenamiento real es solo un nombre en un organigrama. Formamos a tu equipo para que sepa exactamente qué hacer, cómo hacerlo y cuándo actuar.",
    cta: "Solicitar programa de brigadas",
    ragSnippet: {
      h2: "¿Qué diferencia a una brigada que actúa con eficacia de una que improvisa? Exactamente un entrenamiento estructurado.",
      p: "Las brigadas de emergencia son el primer eslabón de respuesta ante una crisis. STRATEC forma a sus integrantes con protocolos prácticos en evacuación, primeros auxilios, combate de incendios y rescate básico. Cada programa concluye con ejercicio de evaluación, simulacro y constancias individuales.",
    },
    deliverables: [
      { fase: "Módulo 1 · Evacuación",     entregable: "Protocolo de liderazgo y conducción de flujos de personas",      queResuelve: "Evacuación ordenada con o sin visibilidad y bajo presión" },
      { fase: "Módulo 2 · Primeros Auxilios", entregable: "RCP, hemorragias, fracturas, quemaduras y traslado seguro",   queResuelve: "Atención inicial hasta llegada de servicios especializados" },
      { fase: "Módulo 3 · Incendios",      entregable: "Uso de extintores, clases de fuego y control de conatos",        queResuelve: "Extinción segura antes de que el fuego escale a emergencia mayor" },
      { fase: "Módulo 4 · Búsqueda y Rescate", entregable: "Localización y estabilización de víctimas en espacios comprometidos", queResuelve: "Transferencia segura a cuerpos de rescate profesionales" },
      { fase: "Módulo 5 · Evaluación",     entregable: "Simulacro práctico + constancias individuales del programa",     queResuelve: "Documenta competencias para el PIPC y auditorías institucionales" },
    ],
    guide: [
      {
        h2: "¿Qué son las brigadas de emergencia?",
        p: "Son grupos de colaboradores de la propia organización, con funciones asignadas, que actúan en los primeros minutos de una emergencia, antes de que lleguen bomberos, paramédicos o Protección Civil. Forman parte de la Unidad Interna de Protección Civil y del Programa Interno. Las más comunes son:",
        items: [
          "Brigada de evacuación: conduce al personal y a los visitantes por las rutas seguras hasta el punto de reunión y confirma que nadie quede dentro.",
          "Brigada de primeros auxilios: atiende a las personas lesionadas mientras llegan los servicios médicos.",
          "Brigada contra incendios: usa los extintores para controlar un conato de incendio y da la alerta.",
          "Brigada de búsqueda y rescate: localiza a personas que no llegaron al punto de reunión y apoya su traslado seguro.",
          "En inmuebles pequeños, una brigada multifuncional puede cubrir varias funciones.",
        ],
      },
      {
        h2: "¿Quién debe tomar la capacitación?",
        p: "Las personas designadas como brigadistas y sus suplentes, los jefes de piso o de área y quien coordina la Unidad Interna de Protección Civil. La capacitación sirve a empresas, fábricas, comercios, escuelas, clínicas, hoteles, edificios de oficinas y dependencias de gobierno en Cuernavaca, Jiutepec, Cuautla y el resto de Morelos. Además de preparar al personal, deja evidencia de la capacitación que piden el Programa Interno y las normas de la STPS.",
      },
      {
        h2: "Cómo es la capacitación, paso a paso",
        ordered: true,
        items: [
          "Revisamos tu inmueble, tus riesgos y cuántas personas integran cada brigada para ajustar el contenido.",
          "Impartimos la capacitación en tus instalaciones, con teoría breve y práctica: evacuación por tus propias rutas, primeros auxilios y uso de extintores.",
          "Cerramos con un ejercicio de evaluación y, cuando aplica, un simulacro coordinado.",
          "Entregamos las constancias y un informe de desempeño para integrarlo a tu Programa Interno.",
        ],
      },
      {
        h2: "¿Qué recibes?",
        items: [
          "Capacitación práctica para cada brigada, adaptada a tu inmueble.",
          "Constancia DC-3 para cada persona que concluye la capacitación.",
          "Informe de desempeño con observaciones y recomendaciones.",
          "Evidencia de capacitación lista para tu Programa Interno de Protección Civil.",
        ],
      },
      {
        h2: "¿Cuánto dura?",
        p: "Se imparte en sesiones intensivas de 4 a 8 horas, según las brigadas y los módulos que se incluyan. Se programa en la fecha que menos afecte tu operación.",
      },
      {
        h2: "Experiencia de STRATEC en capacitación",
        p: "Hemos capacitado a más de 300 personas en seguridad y protección civil, entre ellas personal de instituciones de seguridad pública y de salud, estudiantes y colaboradores de empresas privadas.",
      },
    ],
    faqs: [
      {
        q: "¿Qué brigadas debe tener mi empresa?",
        a: "Depende del tamaño del inmueble, del número de personas y de sus riesgos. Lo habitual es contar con brigadas de evacuación, primeros auxilios, combate de incendios y búsqueda y rescate; en inmuebles pequeños una brigada multifuncional puede cubrir varias funciones. Lo definimos con base en tu Programa Interno.",
      },
      {
        q: "¿Cuánto dura la capacitación de brigadas?",
        a: "Se imparte en sesiones intensivas de 4 a 8 horas, según las brigadas y los módulos que se incluyan.",
      },
      {
        q: "¿Entregan constancia DC-3?",
        a: "Sí. Al concluir la capacitación se entrega la constancia DC-3 a cada participante.",
      },
      {
        q: "¿La capacitación se da en nuestras instalaciones?",
        a: "Sí. Es presencial e in company: practicar en tus propias rutas de evacuación y con tu equipo de emergencia hace que la capacitación sea útil el día que se necesite.",
      },
      {
        q: "¿Cada cuánto conviene volver a capacitar a las brigadas?",
        a: "Conviene reforzarla al menos una vez al año y cada vez que cambian los integrantes de las brigadas, el inmueble o los riesgos. El calendario forma parte de tu Programa Interno.",
      },
      {
        q: "¿Incluye simulacro?",
        a: "Cada programa cierra con un ejercicio práctico de evaluación y, cuando aplica, un simulacro coordinado con todo el personal.",
      },
      {
        q: "¿En qué ciudades imparten la capacitación?",
        a: "En Cuernavaca, Jiutepec, Temixco, Cuautla y el resto del Estado de Morelos, en las instalaciones de tu organización.",
      },
    ],
    related: [
      { href: "/servicios/programa-interno-proteccion-civil", label: "Programa Interno de Protección Civil" },
      { href: "/servicios/revision-programa-interno", label: "Revisión de tu Programa Interno" },
      { href: "/servicios/proteccion-civil-eventos-masivos", label: "Protección Civil para eventos masivos" },
      { href: "/servicios/capacitacion", label: "Otros cursos de capacitación" },
      { href: "/diagnostico", label: "Diagnóstico de seguridad gratuito" },
    ],
    seo: {
      title: "Capacitación de Brigadas de Protección Civil en Morelos | STRATEC",
      description:
        "Curso para brigadas de evacuación, primeros auxilios, incendios y rescate en tus instalaciones en Cuernavaca y Morelos. Al concluir, constancia DC-3.",
      keywords: [
        "capacitación brigadas de emergencia",
        "curso de brigadas de protección civil",
        "capacitación brigadas Cuernavaca",
        "curso brigadistas Morelos con DC-3",
        "brigadas de evacuación",
        "brigadas de primeros auxilios",
        "brigada contra incendios",
        "formación brigadas protección civil",
        "capacitación brigadistas",
        "entrenamiento brigadas emergencia",
        "simulacros de emergencia empresa",
        "brigadas emergencia Morelos",
        "capacitación protección civil empresa",
        "brigadas institucionales México",
      ],
    },
  },

  // ── S3 · Estudio y Análisis de Riesgo ────────────────────────────────────
  "estudio-analisis-riesgo": {
    slug: "estudio-analisis-riesgo",
    numero: "01.1",
    titulo: "Estudio y Análisis de Riesgo",
    descripcionCorta: "Identificación y evaluación de amenazas, vulnerabilidades y riesgos institucionales.",
    href: "/servicios/estudio-analisis-riesgo",
    heroImage: "https://images.unsplash.com/photo-1643962577583-a4c880a109ae?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Estudio y Análisis de Riesgo",
    parentBreadcrumb: "Consultoría en Seguridad",
    parentHref: "/servicios/consultoria-seguridad",
    h1: "Estudio y Análisis de Riesgo",
    lead: "No puedes proteger lo que no conoces. El Estudio y Análisis de Riesgo es el proceso técnico que permite identificar qué amenazas enfrenta tu organización, qué tan vulnerables son tus activos e instalaciones y cuál es el impacto potencial de cada escenario. STRATEC entrega un análisis estructurado que fundamenta decisiones de inversión en seguridad con evidencia, no con suposiciones.",
    blocks: [
      {
        h2: "Identificación de Amenazas",
        p: "Levantamiento sistemático de amenazas internas y externas relevantes para la organización: robos, fraudes, sabotaje, eventos naturales, fallas tecnológicas, conflictos laborales y amenazas del entorno geográfico. Cada amenaza se clasifica por tipo, origen y frecuencia histórica.",
        blockImage: "https://images.unsplash.com/photo-1771931322109-180bb1b35bf8?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Análisis de Vulnerabilidades",
        p: "Evaluación de las debilidades existentes en las dimensiones física, tecnológica, humana y organizacional. Se identifican brechas en controles de acceso, supervisión, procedimientos y cultura de seguridad que aumentan la probabilidad de materialización de una amenaza.",
        blockImage: "https://images.unsplash.com/photo-1710181717510-8e3896937fbd?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Evaluación de Probabilidad e Impacto",
        p: "Para cada combinación amenaza-vulnerabilidad se estima la probabilidad de ocurrencia y el impacto potencial sobre personas, activos, operaciones e imagen institucional. El resultado permite distinguir entre riesgos críticos, moderados y residuales.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Matriz de Riesgos",
        p: "Construcción de una matriz de riesgos priorizada que sirve como instrumento de gestión para la dirección y el área de seguridad. Visualiza de forma clara cuáles riesgos requieren atención inmediata y cuáles pueden gestionarse a mediano plazo.",
        blockImage: "https://images.unsplash.com/photo-1659273144088-202efb9b86c8?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Plan de Medidas de Mitigación",
        p: "Con base en la matriz de riesgos, se desarrolla un plan de acciones concretas orientadas a reducir la probabilidad o el impacto de los riesgos identificados. Las medidas se clasifican por costo, plazo de implementación y nivel de reducción del riesgo.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "Un estudio de riesgo bien hecho transforma la percepción en certeza: sabes exactamente dónde invertir, qué proteger primero y qué riesgos puedes asumir con criterio.",
    cta: "Solicitar estudio de riesgo",
    ragSnippet: {
      h2: "No puede proteger lo que no conoce. El análisis de riesgo transforma percepciones en certezas medibles.",
      p: "Un Estudio y Análisis de Riesgo identifica qué amenazas enfrenta su organización, qué tan vulnerables son sus activos y cuál es el impacto potencial de cada escenario. STRATEC aplica la metodología ISO 31000:2018 para construir una matriz de riesgos que fundamenta decisiones de seguridad con evidencia técnica, no con suposiciones.",
    },
    deliverables: [
      { fase: "Fase 1 · Levantamiento",    entregable: "Informe de amenazas internas y externas clasificadas por tipo y origen",       queResuelve: "Base técnica para priorizar controles con criterio, no intuición" },
      { fase: "Fase 2 · Vulnerabilidades", entregable: "Evaluación física, tecnológica, humana y organizacional",                      queResuelve: "Identifica brechas que aumentan la probabilidad de incidente" },
      { fase: "Fase 3 · Matriz de Riesgos",entregable: "Matriz priorizada por probabilidad e impacto (metodología ISO 31000)",         queResuelve: "Instrumento de gestión para dirección y área de seguridad" },
      { fase: "Fase 4 · Mitigación",       entregable: "Plan de acciones clasificadas por costo, plazo y reducción del riesgo",        queResuelve: "Orienta la inversión en seguridad con evidencia técnica verificable" },
    ],
    seo: {
      title: "Estudio y Análisis de Riesgo para Empresas | ISO 31000 | STRATEC",
      description:
        "Estudios y análisis de riesgo para empresas e instituciones: identificación de amenazas, análisis de vulnerabilidades, matriz de riesgos y plan de mitigación. Metodología técnica con entregables ejecutivos.",
      keywords: [
        "estudio de riesgo",
        "análisis de riesgo",
        "análisis de vulnerabilidades",
        "identificación de amenazas",
        "matriz de riesgos",
        "evaluación de riesgos institucional",
        "gestión de riesgos empresa",
        "análisis de riesgo seguridad",
        "estudio de riesgo México",
        "riesgo operativo institucional",
        "análisis de vulnerabilidades empresa",
      ],
    },
  },

  // ── S4 · Videovigilancia CCTV ─────────────────────────────────────────────
  "videovigilancia-cctv": {
    slug: "videovigilancia-cctv",
    numero: "04.1",
    titulo: "Sistemas de Videovigilancia CCTV",
    descripcionCorta: "Diseño, suministro e instalación de sistemas de cámaras de seguridad para empresas e instituciones.",
    href: "/servicios/videovigilancia-cctv",
    heroImage: "https://images.unsplash.com/photo-1528312635006-8ea0bc49ec63?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Videovigilancia CCTV",
    parentBreadcrumb: "Integración Tecnológica para la Seguridad",
    parentHref: "/servicios/integracion-tecnologica",
    h1: "Cámaras de seguridad y videovigilancia CCTV para empresas en Cuernavaca y Morelos",
    lead: "Un sistema de videovigilancia mal diseñado genera puntos ciegos, evidencia inutilizable y falsa sensación de seguridad. STRATEC diseña e implementa soluciones CCTV basadas en el análisis de cobertura real, no en catálogos: el número de cámaras, su tipo y su posición se determinan por el mapa de riesgos de tu instalación.",
    intro: "Videovigilancia como herramienta estratégica: disuasión, evidencia, gestión de incidentes y supervisión operativa en un solo sistema.",
    blocks: [
      {
        h2: "Evaluación de Cobertura y Puntos Críticos",
        p: "Análisis del inmueble para identificar zonas de riesgo, puntos ciegos, áreas de acceso restringido y perímetro exterior. El resultado es un mapa de cobertura óptimo que define exactamente dónde instalar cada cámara y con qué especificaciones técnicas.",
        blockImage: "https://images.unsplash.com/photo-1589935447067-5531094415d1?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Diseño del Sistema",
        p: "Elaboración del diagrama técnico del sistema: tipo de cámaras (domo, bullet, PTZ, fisheye), resolución, visión nocturna, rango de cobertura, infraestructura de red, almacenamiento y requisitos de energía. El diseño incluye presupuesto detallado por concepto.",
        blockImage: "https://images.unsplash.com/photo-1618482914248-29272d021005?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Suministro de Equipo de Grado Profesional",
        p: "Provisión de cámaras IP y analógicas de marcas con garantía y soporte técnico en México. Grabadoras NVR/DVR, servidores de almacenamiento, switches PoE y monitores de control. Trabajamos únicamente con equipo documentado y respaldado.",
        blockImage: "https://images.unsplash.com/photo-1530151928300-3864d0e5d178?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Instalación, Configuración y Puesta en Marcha",
        p: "Instalación física, cableado estructurado o inalámbrico, configuración de grabación continua o por evento, alertas de movimiento, acceso remoto desde dispositivos móviles y pruebas de funcionamiento de cada punto del sistema.",
        blockImage: "https://images.unsplash.com/photo-1585206031650-9e9a7c87dcfe?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Capacitación y Soporte Técnico",
        p: "Capacitación al personal designado para la operación del sistema: reproducción de grabaciones, exportación de evidencia, gestión de alertas y mantenimiento básico. Se entrega manual de usuario y se brinda soporte técnico post-instalación.",
        blockImage: "https://images.unsplash.com/photo-1652739758426-56a564265f9e?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "Un sistema CCTV diseñado con criterio de seguridad —no de catálogo— cubre los puntos que importan, genera evidencia útil y opera sin puntos ciegos. Eso es lo que diseñamos.",
    cta: "Solicitar evaluación de videovigilancia",
    ragSnippet: {
      h2: "Un sistema CCTV mal diseñado no protege: genera puntos ciegos y una falsa sensación de seguridad.",
      p: "Los sistemas de videovigilancia efectivos no se seleccionan de catálogo: se diseñan desde el análisis de cobertura real de cada instalación. STRATEC evalúa puntos críticos, diseña la arquitectura del sistema, suministra equipo de grado profesional e instala y capacita al personal operativo.",
    },
    deliverables: [
      { fase: "Fase 1 · Evaluación",   entregable: "Mapa de cobertura óptimo por puntos críticos de la instalación",        queResuelve: "Define dónde instalar cada cámara con criterio técnico, no de catálogo" },
      { fase: "Fase 2 · Diseño",       entregable: "Diagrama técnico: tipo de cámara, red, almacenamiento y energía",       queResuelve: "Presupuesto exacto antes de comprometer inversión" },
      { fase: "Fase 3 · Suministro",   entregable: "Equipos de grado profesional con garantía y soporte en México",         queResuelve: "Equipo documentado con respaldo técnico verificable" },
      { fase: "Fase 4 · Instalación",  entregable: "Cableado, configuración, acceso remoto y pruebas de funcionamiento",    queResuelve: "Sistema operativo y verificado desde el primer día" },
      { fase: "Fase 5 · Capacitación", entregable: "Uso del sistema, exportación de evidencia y soporte post-instalación",  queResuelve: "El sistema se aprovecha al 100%, no se subutiliza" },
    ],
    guide: [
      {
        h2: "¿Qué es un sistema de videovigilancia CCTV?",
        p: "CCTV significa circuito cerrado de televisión: un conjunto de cámaras conectadas a una grabadora (NVR o DVR) que guarda las imágenes y permite verlas en vivo, desde un monitor o desde el celular. Bien diseñado, sirve para disuadir robos, revisar qué pasó en un incidente, contar con evidencia y supervisar la operación. Mal diseñado, deja puntos ciegos, graba imágenes que no permiten reconocer a nadie y da una falsa sensación de seguridad.",
      },
      {
        h2: "¿Para quién es?",
        p: "Para empresas, fábricas, bodegas, comercios, oficinas, escuelas, clínicas, hoteles y condominios en Cuernavaca, Jiutepec, Cuautla y el resto de Morelos que necesitan vigilar accesos, cajas, estacionamientos, almacenes, perímetros o áreas restringidas. También para quien ya tiene cámaras y no sabe si cubren lo importante o si la grabación sirve como evidencia.",
      },
      {
        h2: "Cómo diseñamos e instalamos tu sistema, paso a paso",
        ordered: true,
        items: [
          "Visita y análisis de riesgos: recorremos el inmueble para identificar accesos, puntos críticos, puntos ciegos e iluminación.",
          "Mapa de cobertura: definimos dónde va cada cámara, qué debe verse en cada imagen y qué tipo de cámara conviene.",
          "Diseño y cotización: diagrama del sistema con cámaras, grabadora, almacenamiento, red y energía, con presupuesto por concepto.",
          "Instalación y configuración: cableado, grabación continua o por movimiento, alertas y acceso desde el celular.",
          "Pruebas y entrega: revisamos cada cámara de día y de noche, capacitamos a quien operará el sistema y te entregamos el manual de uso.",
        ],
      },
      {
        h2: "¿Qué recibes?",
        items: [
          "Mapa de cobertura con la ubicación y el propósito de cada cámara.",
          "Diagrama técnico y presupuesto detallado por concepto.",
          "Equipo de grado profesional con garantía y soporte técnico en México.",
          "Sistema instalado, configurado y probado, con acceso remoto desde el celular.",
          "Capacitación para reproducir grabaciones, exportar evidencia y atender alertas.",
          "Manual de usuario y soporte técnico después de la instalación.",
        ],
      },
      {
        h2: "¿Cuánto tiempo tarda?",
        p: "Depende del número de cámaras, del cableado necesario y de las condiciones del inmueble. La visita y el diseño van primero; el calendario de instalación se acuerda en la cotización para afectar lo menos posible tu operación.",
      },
    ],
    faqs: [
      {
        q: "¿Cuántas cámaras de seguridad necesita mi negocio?",
        a: "Depende de lo que haya que proteger, no de los metros cuadrados. Primero identificamos accesos, cajas, almacenes, estacionamientos y puntos ciegos, y con ese mapa de cobertura definimos cuántas cámaras hacen falta y de qué tipo.",
      },
      {
        q: "¿Qué conviene más, cámaras IP o analógicas?",
        a: "Las cámaras IP suelen dar mejor resolución y más funciones; las analógicas pueden aprovechar cableado existente y costar menos. Lo recomendamos según lo que necesites reconocer en la imagen, la infraestructura que ya tienes y tu presupuesto.",
      },
      {
        q: "¿Puedo ver mis cámaras desde el celular?",
        a: "Sí. Configuramos el acceso remoto para que veas las cámaras en vivo y revises grabaciones desde el celular o la computadora, con usuarios y contraseñas para cada persona autorizada.",
      },
      {
        q: "¿Cuántos días se guardan las grabaciones?",
        a: "Depende de la capacidad de almacenamiento, del número de cámaras, de la resolución y de si se graba de forma continua o solo con movimiento. Dimensionamos el almacenamiento según cuántos días necesitas conservar.",
      },
      {
        q: "¿Pueden revisar o aprovechar las cámaras que ya tengo?",
        a: "Sí. Evaluamos tu sistema actual, te decimos qué cubre, qué no y qué se puede aprovechar, y proponemos solo lo que haga falta.",
      },
      {
        q: "¿Necesito aviso de privacidad si tengo cámaras?",
        a: "Las imágenes de las personas son datos personales, por lo que conviene colocar avisos visibles de videovigilancia y contar con un aviso de privacidad que explique para qué se usan las grabaciones. Te orientamos al diseñar el sistema.",
      },
      {
        q: "¿Dan soporte después de la instalación?",
        a: "Sí. Capacitamos a quien operará el sistema, entregamos el manual de uso y damos soporte técnico después de la instalación.",
      },
    ],
    related: [
      { href: "/servicios/estudio-analisis-riesgo", label: "Estudio y análisis de riesgo" },
      { href: "/servicios/protocolos-seguridad", label: "Protocolos de seguridad y prevención de extorsión" },
      { href: "/servicios/gps-monitoreo-vehicular", label: "GPS y monitoreo vehicular para flotillas" },
      { href: "/servicios/integracion-tecnologica", label: "Integración tecnológica para la seguridad" },
      { href: "/diagnostico", label: "Diagnóstico de seguridad gratuito" },
    ],
    seo: {
      title: "Cámaras de Seguridad y CCTV para Empresas en Cuernavaca | STRATEC",
      description:
        "Diseño, suministro e instalación de cámaras de seguridad CCTV para empresas, comercios y escuelas en Cuernavaca y Morelos, con acceso desde el celular y soporte.",
      keywords: [
        "videovigilancia CCTV",
        "instalación cámaras de seguridad",
        "sistemas de videovigilancia empresas",
        "cámaras de seguridad profesionales",
        "CCTV empresas México",
        "instalación CCTV",
        "sistema de monitoreo CCTV",
        "cámaras IP seguridad",
        "videovigilancia Morelos",
        "cámaras seguridad Cuernavaca",
        "instalación cámaras vigilancia",
        "circuito cerrado de televisión empresas",
      ],
    },
  },

  // ── S5 · GPS y Monitoreo Vehicular ────────────────────────────────────────
  "gps-monitoreo-vehicular": {
    slug: "gps-monitoreo-vehicular",
    numero: "04.2",
    titulo: "GPS y Monitoreo Vehicular para Flotillas",
    descripcionCorta: "Rastreo satelital en tiempo real, control de rutas y supervisión de flotillas.",
    href: "/servicios/gps-monitoreo-vehicular",
    heroImage: "https://images.unsplash.com/photo-1549109926-58f039549485?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "GPS y Monitoreo Vehicular",
    parentBreadcrumb: "Integración Tecnológica para la Seguridad",
    parentHref: "/servicios/integracion-tecnologica",
    h1: "GPS y Monitoreo Vehicular para Flotillas",
    lead: "Saber dónde están tus vehículos no es suficiente. La gestión efectiva de una flotilla requiere visibilidad en tiempo real, alertas automáticas, análisis de recorridos y evidencia ante incidentes. STRATEC implementa soluciones de monitoreo vehicular que transforman datos de localización en inteligencia operativa.",
    blocks: [
      {
        h2: "Localización en Tiempo Real",
        p: "Plataforma de rastreo GPS que permite visualizar la ubicación exacta de cada unidad en el mapa, con actualizaciones cada 30 segundos o en tiempo real según la solución implementada. Acceso desde computadora o aplicación móvil para supervisores y responsables de flotilla.",
        blockImage: "https://images.unsplash.com/photo-1617897711385-df9c86b7dfe3?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Geocercas y Control de Rutas",
        p: "Definición de zonas autorizadas y rutas predeterminadas para cada unidad o tipo de operación. El sistema genera alertas automáticas cuando un vehículo sale de la ruta asignada, ingresa a zonas restringidas o se detiene en puntos no programados.",
        blockImage: "https://images.unsplash.com/photo-1530151928300-3864d0e5d178?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Alertas y Notificaciones Automáticas",
        p: "Configuración de alertas por exceso de velocidad, ralentí prolongado, ignición fuera de horario, salida de geocerca y eventos de impacto o vibración. Las notificaciones llegan en tiempo real al responsable designado vía plataforma web, SMS o correo.",
        blockImage: "https://images.unsplash.com/photo-1618482914248-29272d021005?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Reportes Operativos y Análisis de Recorridos",
        p: "Generación de reportes diarios, semanales o a demanda: historial de recorridos, kilometraje, tiempo de operación, paradas, comportamiento al volante y cumplimiento de rutas. Información ejecutiva para la toma de decisiones y la gestión de combustible.",
        blockImage: "https://images.unsplash.com/photo-1659273144088-202efb9b86c8?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Videotelemática Embarcada",
        p: "Integración de cámaras vehiculares internas y externas vinculadas al sistema GPS. Registra eventos de conducción, accidentes e incidentes con video, audio y datos de localización simultáneos. Evidencia irrefutable para trámites de seguros y gestión de responsabilidades.",
        blockImage: "https://images.unsplash.com/photo-1589935447067-5531094415d1?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "Una flotilla sin monitoreo opera a ciegas: no sabes dónde están tus vehículos, qué hacen fuera de horario ni cómo responder ante un incidente. El monitoreo vehicular convierte visibilidad en control.",
    cta: "Solicitar demo de monitoreo vehicular",
    ragSnippet: {
      h2: "¿Sabe exactamente dónde están sus vehículos ahora mismo y qué están haciendo fuera del horario operativo?",
      p: "El monitoreo vehicular GPS transforma datos de localización en inteligencia operativa: rutas cumplidas, geocercas, alertas en tiempo real y reportes de comportamiento. STRATEC implementa soluciones de rastreo satelital que reducen costos de operación, mejoran la supervisión de flotillas y generan evidencia ante incidentes.",
    },
    deliverables: [
      { fase: "Módulo 1 · Rastreo",        entregable: "Plataforma de localización en tiempo real para toda la flotilla",         queResuelve: "Visibilidad inmediata de todas las unidades en operación" },
      { fase: "Módulo 2 · Geocercas",      entregable: "Definición de rutas autorizadas y zonas restringidas con alertas",        queResuelve: "Notificación automática ante desvíos o paradas no programadas" },
      { fase: "Módulo 3 · Alertas",        entregable: "Notificaciones por velocidad, ralentí, ignición y eventos de impacto",    queResuelve: "Supervisión pasiva sin requerir monitoreo manual constante" },
      { fase: "Módulo 4 · Reportes",       entregable: "Historial de recorridos, kilometraje y comportamiento al volante",        queResuelve: "Datos operativos para reducción de costos y gestión de combustible" },
      { fase: "Módulo 5 · Videotelemática",entregable: "Cámaras embarcadas vinculadas al GPS con registro de eventos",            queResuelve: "Evidencia visual ante accidentes, seguros y auditorías internas" },
    ],
    seo: {
      title: "GPS y Monitoreo Vehicular para Flotillas | Rastreo Satelital | STRATEC",
      description:
        "Soluciones de rastreo GPS y monitoreo vehicular para flotillas empresariales e institucionales: localización en tiempo real, geocercas, alertas automáticas, reportes y videotelemática.",
      keywords: [
        "GPS monitoreo vehicular",
        "rastreo GPS flotillas",
        "monitoreo de flotillas",
        "control de flotillas GPS",
        "rastreo satelital vehículos",
        "localización vehículos tiempo real",
        "videotelemática vehicular",
        "sistema monitoreo flotilla México",
        "GPS para empresas",
        "rastreo vehicular Morelos",
        "geocercas flotillas",
        "control GPS vehículos institucionales",
      ],
    },
  },

  // ── S6 · Auditoría de Seguridad ───────────────────────────────────────────
  "auditoria-seguridad": {
    slug: "auditoria-seguridad",
    numero: "01.2",
    titulo: "Auditoría de Seguridad Institucional",
    descripcionCorta: "Revisión técnica de procedimientos, controles e infraestructura de seguridad.",
    href: "/servicios/auditoria-seguridad",
    heroImage: "https://images.unsplash.com/photo-1710181717510-8e3896937fbd?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Auditoría de Seguridad",
    parentBreadcrumb: "Consultoría en Seguridad",
    parentHref: "/servicios/consultoria-seguridad",
    h1: "Auditoría de Seguridad Institucional",
    lead: "La auditoría de seguridad permite determinar con precisión si los controles implementados funcionan como se diseñaron, si existen brechas entre lo que dice el procedimiento y lo que ocurre en la operación real, y si los recursos invertidos en seguridad están generando el efecto esperado. STRATEC realiza auditorías técnicas con metodología estructurada, sin conflictos de interés y con entregables orientados a la acción.",
    blocks: [
      {
        h2: "Revisión de Procedimientos y Políticas",
        p: "Análisis de la documentación de seguridad existente: manuales, protocolos, procedimientos operativos y políticas institucionales. Se verifica la coherencia interna, la vigencia normativa y la alineación con las mejores prácticas del sector.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Evaluación de Infraestructura Física",
        p: "Inspección de las condiciones físicas de seguridad: accesos, perímetro, iluminación, sistemas de control de entrada, videovigilancia, almacenamiento de activos y condiciones de los equipos de protección. Se evalúa la capacidad disuasiva y la resistencia ante intrusiones.",
        blockImage: "https://images.unsplash.com/photo-1771931322109-180bb1b35bf8?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Análisis de Controles Operativos",
        p: "Evaluación de la implementación real de los controles: supervisión del personal de seguridad, registros de acceso e incidentes, cumplimiento de rondines, verificación de credenciales y respuesta a simulacros. Se detectan desviaciones entre el protocolo y la práctica.",
        blockImage: "https://images.unsplash.com/photo-1652739758426-56a564265f9e?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Identificación de Brechas y Hallazgos Críticos",
        p: "Los hallazgos se clasifican por nivel de criticidad: crítico, alto, medio o bajo. Cada hallazgo incluye descripción técnica, riesgo asociado, evidencia recopilada y recomendación específica de corrección. Sin tecnicismos innecesarios: lenguaje ejecutivo orientado a la decisión.",
        blockImage: "https://images.unsplash.com/photo-1643962577583-a4c880a109ae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Informe Ejecutivo y Plan de Mejora",
        p: "Entrega de informe ejecutivo con resumen de hallazgos, calificación general del sistema de seguridad y plan de mejora con acciones priorizadas, responsables sugeridos y plazos recomendados. El informe está diseñado para ser presentado a dirección general.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "Una auditoría de seguridad no busca encontrar culpables: busca cerrar las brechas antes de que alguien más las explote. Entregamos hallazgos con evidencia y un plan de acción concreto.",
    cta: "Solicitar auditoría de seguridad",
    ragSnippet: {
      h2: "¿Sus controles de seguridad funcionan como los diseñó, o solo existen en el manual de procedimientos?",
      p: "La Auditoría de Seguridad determina si los controles implementados generan el efecto esperado o si existen brechas entre el procedimiento escrito y la operación real. STRATEC entrega un informe ejecutivo con hallazgos clasificados por nivel de criticidad y un plan de mejora con acciones priorizadas.",
    },
    deliverables: [
      { fase: "Fase 1 · Revisión",      entregable: "Análisis de manuales, protocolos y políticas de seguridad vigentes",      queResuelve: "Coherencia normativa y vigencia de la documentación institucional" },
      { fase: "Fase 2 · Inspección",    entregable: "Evaluación de accesos, cámaras, iluminación e infraestructura física",    queResuelve: "Capacidad disuasiva real frente a los riesgos identificados" },
      { fase: "Fase 3 · Controles",     entregable: "Verificación de supervisión, rondines y cumplimiento de procedimientos",  queResuelve: "Detecta la brecha entre el protocolo escrito y la práctica real" },
      { fase: "Fase 4 · Hallazgos",     entregable: "Clasificación por criticidad: crítico, alto, medio y bajo",               queResuelve: "Base técnica para priorizar la inversión correctiva por impacto" },
      { fase: "Fase 5 · Informe",       entregable: "Reporte ejecutivo + plan de mejora con responsables y plazos",            queResuelve: "Instrumento de acción inmediata presentable a dirección general" },
    ],
    seo: {
      title: "Auditoría de Seguridad para Empresas e Instituciones | STRATEC",
      description:
        "Auditorías técnicas de seguridad para empresas e instituciones: revisión de procedimientos, evaluación de infraestructura física, análisis de controles e informe ejecutivo con plan de mejora.",
      keywords: [
        "auditoría de seguridad",
        "auditoría institucional seguridad",
        "revisión controles de seguridad",
        "auditoría protocolos seguridad",
        "evaluación seguridad empresas",
        "auditoría seguridad física",
        "informe de seguridad institucional",
        "brechas de seguridad empresa",
        "auditoría de seguridad México",
        "revisión procedimientos de seguridad",
        "auditoría seguridad Morelos",
      ],
    },
  },

  // ── S7 · Plan de Continuidad de Operaciones ───────────────────────────────
  "plan-continuidad-operaciones": {
    slug: "plan-continuidad-operaciones",
    numero: "02.2",
    titulo: "Plan de Continuidad de Operaciones",
    descripcionCorta: "Estrategias para mantener funciones críticas ante interrupciones y emergencias.",
    href: "/servicios/plan-continuidad-operaciones",
    heroImage: "https://images.unsplash.com/photo-1722227089176-a981d2544b5f?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Plan de Continuidad de Operaciones",
    parentBreadcrumb: "Protección Civil y Gestión de Riesgos",
    parentHref: "/servicios/proteccion-civil",
    h1: "Plan de Continuidad de Operaciones",
    lead: "Toda organización puede enfrentar una interrupción grave: un sismo, un incendio, una falla tecnológica crítica o una crisis de seguridad. El Plan de Continuidad de Operaciones (PCO) define cómo responder, qué funciones preservar primero y cómo recuperar la normalidad en el menor tiempo posible. STRATEC diseña planes que funcionan bajo presión, no solo sobre el papel.",
    blocks: [
      {
        h2: "Análisis de Impacto en el Negocio (BIA)",
        p: "Identificación de las funciones críticas de la organización y evaluación del impacto que tendría su interrupción en términos operativos, financieros, legales y reputacionales. El BIA determina los tiempos máximos de interrupción tolerables para cada función y los recursos mínimos requeridos para recuperarlas.",
        blockImage: "https://images.unsplash.com/photo-1659273144088-202efb9b86c8?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Estrategias de Continuidad",
        p: "Diseño de opciones para mantener o recuperar funciones críticas durante una interrupción: sitios alternos de operación, redundancia tecnológica, acuerdos con proveedores clave, movilización de personal y protocolos de comunicación interna y externa.",
        blockImage: "https://images.unsplash.com/photo-1616873354936-b9e21b744c54?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Plan de Recuperación ante Desastres",
        p: "Procedimientos específicos para restaurar sistemas, infraestructura y operaciones tras un evento disruptivo. Incluye cadenas de mando, responsables de recuperación, secuencia de restablecimiento de funciones y criterios de retorno a la normalidad.",
        blockImage: "https://images.unsplash.com/photo-1624638764471-cffef5035746?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Pruebas y Ejercicios de Continuidad",
        p: "Diseño y conducción de ejercicios prácticos para verificar la efectividad del plan: simulaciones de escritorio, pruebas parciales y ejercicios funcionales. Cada prueba genera hallazgos que se incorporan al plan para mejorarlo antes de que una emergencia real lo ponga a prueba.",
        blockImage: "https://images.unsplash.com/photo-1758404958502-44f156617bae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Mantenimiento y Actualización del Plan",
        p: "El PCO requiere mantenimiento continuo: cambios en la estructura organizacional, nuevas instalaciones o tecnologías, lecciones aprendidas de ejercicios y emergencias. Definimos un ciclo de revisión periódica para asegurar que el plan se mantenga vigente y efectivo.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
    ],
    nota: "El Plan de Continuidad de Operaciones se diseña de forma coordinada con el Programa Interno de Protección Civil y los procedimientos de seguridad existentes en la organización.",
    gancho:
      "No se trata de si ocurrirá una interrupción, sino de cuándo. Las organizaciones que sobreviven a las crisis son las que se prepararon antes de necesitarlo.",
    cta: "Solicitar diseño de Plan de Continuidad",
    ragSnippet: {
      h2: "No es si ocurrirá una interrupción grave en su organización. Es cuándo. ¿Tiene un plan probado?",
      p: "El Plan de Continuidad de Operaciones define cómo responder ante una crisis, qué funciones preservar primero y cómo recuperar la normalidad en el menor tiempo posible. STRATEC lo diseña desde el Análisis de Impacto en el Negocio (BIA) y lo valida con ejercicios prácticos antes de que una emergencia real lo active.",
    },
    deliverables: [
      { fase: "Fase 1 · BIA",          entregable: "Análisis de Impacto en el Negocio con tiempos máximos de interrupción",  queResuelve: "Identifica qué funciones proteger primero y con qué recursos mínimos" },
      { fase: "Fase 2 · Estrategias",  entregable: "Opciones de sitios alternos, redundancia tecnológica y comunicación de crisis", queResuelve: "Múltiples rutas de continuidad ante distintos escenarios de riesgo" },
      { fase: "Fase 3 · Plan",         entregable: "Procedimientos de recuperación con cadenas de mando y secuencias definidas", queResuelve: "Respuesta coordinada sin esperar instrucciones en plena crisis" },
      { fase: "Fase 4 · Pruebas",      entregable: "Ejercicios de escritorio y simulaciones funcionales con informe de resultados", queResuelve: "Valida el plan antes de que una emergencia real lo active" },
      { fase: "Fase 5 · Mantenimiento",entregable: "Ciclo de revisión periódica y actualización del documento",               queResuelve: "El plan se mantiene vigente y no se vuelve obsoleto con el tiempo" },
    ],
    seo: {
      title: "Plan de Continuidad de Operaciones | Recuperación ante Emergencias | STRATEC",
      description:
        "Diseño de Planes de Continuidad de Operaciones (PCO) para empresas e instituciones: análisis de impacto, estrategias de continuidad, recuperación ante desastres y ejercicios de prueba.",
      keywords: [
        "plan de continuidad de operaciones",
        "plan de continuidad operativa",
        "continuidad de operaciones empresa",
        "recuperación ante desastres",
        "business continuity plan México",
        "PCO empresa",
        "plan de recuperación operativa",
        "análisis de impacto en el negocio",
        "BIA empresa México",
        "continuidad operativa institucional",
        "plan emergencia empresarial",
        "plan continuidad operaciones Morelos",
      ],
    },
  },

  // ── S9 · Revisión de Programa Interno (servicio de entrada, a distancia) ──
  "revision-programa-interno": {
    slug: "revision-programa-interno",
    numero: "02.3",
    titulo: "Revisión de Programa Interno de Protección Civil",
    descripcionCorta: "Revisión documental de tu programa para saber qué falta antes de una inspección.",
    href: "/servicios/revision-programa-interno",
    heroImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Revisión de Programa Interno",
    parentBreadcrumb: "Protección Civil y Gestión de Riesgos",
    parentHref: "/servicios/proteccion-civil",
    h1: "Revisión de tu Programa Interno de Protección Civil",
    lead: "¿Tienes tu Programa Interno de Protección Civil, pero no sabes si está completo o actualizado? Revisamos tu documentación y te entregamos un reporte claro con lo que falta, lo que está vencido y lo que conviene corregir antes de una inspección.",
    intro: "Es la forma más rápida de saber dónde estás: trabajamos con los documentos que ya tienes, sin visitas y sin interrumpir tu operación.",
    blocks: [
      {
        h2: "Revisión documental completa",
        p: "Analizamos el programa y sus anexos: Unidad Interna de Protección Civil, análisis de riesgos, procedimientos de emergencia, planos, programa de capacitación y registro de simulacros.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Faltantes e inconsistencias",
        p: "Identificamos documentos ausentes, datos que ya no corresponden a tu inmueble, responsables que dejaron la organización y procedimientos que no responden a tus riesgos reales.",
        blockImage: "https://images.unsplash.com/photo-1643962577583-a4c880a109ae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Vigencias y vencimientos",
        p: "Revisamos las fechas de capacitaciones, simulacros, mantenimiento de equipos y constancias para que sepas qué está vencido y qué está por vencer.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Reporte con prioridades",
        p: "Recibes un reporte de observaciones ordenado por urgencia, con recomendaciones concretas para actualizar tu programa, y lo revisamos contigo en una videollamada.",
        blockImage: "https://images.unsplash.com/photo-1573871906629-f5c700caf507?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "A distancia · Documentos digitales y videollamada de resultados",
    gancho: "Una inspección no es el momento de descubrir que tu programa está incompleto. Revísalo antes.",
    cta: "Solicitar revisión de mi programa",
    ragSnippet: {
      h2: "¿Tu Programa Interno de Protección Civil resistiría una inspección hoy?",
      p: "La revisión de STRATEC analiza tu Programa Interno de Protección Civil y sus anexos, identifica faltantes, inconsistencias y vencimientos, y te entrega un reporte de observaciones con recomendaciones priorizadas. Se realiza a distancia con los documentos que ya tienes.",
    },
    deliverables: [
      { fase: "1 · Recepción",  entregable: "Lista de documentos a enviar",                     queResuelve: "Sabes exactamente qué compartir y en qué formato" },
      { fase: "2 · Revisión",   entregable: "Análisis del programa y sus anexos",               queResuelve: "Detecta faltantes, inconsistencias y vencimientos" },
      { fase: "3 · Reporte",    entregable: "Reporte de observaciones priorizadas",             queResuelve: "Ordena las correcciones por urgencia" },
      { fase: "4 · Resultados", entregable: "Videollamada de explicación de resultados",        queResuelve: "Resuelve dudas y define los siguientes pasos" },
    ],
    seo: {
      title: "Revisión de Programa Interno de Protección Civil | STRATEC",
      description:
        "Revisión documental de tu Programa Interno de Protección Civil: faltantes, inconsistencias y vencimientos, con reporte de observaciones antes de una inspección. Servicio a distancia.",
      keywords: [
        "revisión programa interno de protección civil",
        "revisar programa interno protección civil",
        "actualizar programa interno de protección civil",
        "programa interno protección civil inspección",
        "requisitos programa interno protección civil",
        "consultoría protección civil a distancia",
      ],
    },
  },

  // ── Protección Civil para eventos masivos (servicio integral en sitio) ──
  "proteccion-civil-eventos-masivos": {
    slug: "proteccion-civil-eventos-masivos",
    numero: "02.6",
    titulo: "Protección Civil para Eventos Masivos",
    descripcionCorta: "Servicio integral para eventos: análisis de riesgos, programa del evento y personal de staff en sitio con chalecos distintivos y radios.",
    href: "/servicios/proteccion-civil-eventos-masivos",
    heroImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Protección Civil para Eventos Masivos",
    parentBreadcrumb: "Protección Civil y Gestión de Riesgos",
    parentHref: "/servicios/proteccion-civil",
    h1: "Protección Civil para eventos masivos en Cuernavaca y Morelos",
    lead: "Conciertos, ferias, eventos deportivos, religiosos, empresariales o institucionales: planeamos la seguridad de tu evento y la operamos en sitio con personal de staff identificado, comunicación por radio y coordinación con las autoridades, desde antes de abrir puertas hasta que sale la última persona.",
    intro: "Un solo responsable para toda la parte de Protección Civil del evento: primero identificamos los riesgos, después diseñamos la estrategia y el día del evento la ejecutamos con nuestro equipo.",
    blocks: [
      {
        h2: "Análisis de riesgos y aforo del recinto",
        p: "Revisamos el lugar y el formato del evento: capacidad segura de asistentes, accesos, rutas y salidas de emergencia, escenarios, gradas, carpas e instalaciones temporales, entorno y clima. Con eso definimos qué hay que atender antes de la fecha.",
        blockImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Programa Especial de Protección Civil del evento",
        p: "Elaboramos el programa del evento con su análisis de riesgos, organización del personal, procedimientos ante incendio, sismo, aglomeraciones, riñas, mal clima o personas extraviadas, rutas de evacuación, puntos de reunión y directorio de emergencia, listo para presentarlo ante la autoridad que corresponda.",
        blockImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Personal de staff en sitio",
        p: "El día del evento nuestro personal opera en accesos, salidas, pasillos y zonas críticas, identificado con chalecos distintivos y con radios de comunicación. Guía al público, mantiene libres las rutas de evacuación, atiende incidentes y dirige una evacuación si hace falta.",
        blockImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Coordinación operativa y puesto de mando",
        p: "Instalamos un puesto de mando con comunicación por radio, damos instrucciones previas al personal del organizador y mantenemos enlace con Protección Civil, seguridad pública y servicios médicos durante todo el evento.",
        blockImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "En sitio · Planeación previa y operación el día del evento",
    nota: "Antes de cotizar puedes hacer gratis el diagnóstico inicial de seguridad para eventos masivos: en unos minutos sabrás qué aspectos de tu evento requieren atención.",
    gancho: "En un evento masivo no hay segunda oportunidad: la seguridad se planea antes y se opera en sitio.",
    cta: "Cotizar Protección Civil para mi evento",
    ragSnippet: {
      h2: "¿Quién se encarga de la Protección Civil de tu evento?",
      p: "STRATEC ofrece un servicio integral de Protección Civil para eventos masivos: análisis de riesgos y aforo del recinto, Programa Especial de Protección Civil del evento, personal de staff en sitio identificado con chalecos distintivos y radios, puesto de mando y coordinación con las autoridades durante el evento.",
    },
    deliverables: [
      { fase: "1 · Visita y análisis", entregable: "Análisis de riesgos y aforo del recinto",             queResuelve: "Sabes qué atender antes de la fecha" },
      { fase: "2 · Programa",          entregable: "Programa Especial de Protección Civil del evento",    queResuelve: "Procedimientos, rutas y organización por escrito" },
      { fase: "3 · Preparación",       entregable: "Instrucciones previas al personal del organizador",   queResuelve: "Cada persona sabe qué le toca en una emergencia" },
      { fase: "4 · Día del evento",    entregable: "Staff identificado, radios y puesto de mando",        queResuelve: "Operación y respuesta en sitio de principio a fin" },
      { fase: "5 · Cierre",            entregable: "Reporte de incidencias del evento",                   queResuelve: "Registro de lo ocurrido y mejoras para el siguiente" },
    ],
    guide: [
      {
        h2: "¿Qué es el Programa Especial de Protección Civil de un evento?",
        p: "Es el plan de seguridad de un evento en particular: cuántas personas caben de forma segura, por dónde entran y salen, qué riesgos tiene el lugar, quién hace qué en una emergencia y cómo se coordina con las autoridades. Para los eventos masivos, la autoridad de Protección Civil suele pedirlo como parte del permiso. Lo elaboramos y, además, lo operamos el día del evento.",
      },
      {
        h2: "¿Para qué eventos es?",
        p: "Para conciertos, festivales, ferias, eventos deportivos, carreras, peregrinaciones y fiestas patronales, graduaciones, congresos, exposiciones, eventos empresariales e institucionales en Cuernavaca y el resto de Morelos, en recintos cerrados o al aire libre. Cuándo un evento requiere programa especial lo define la autoridad municipal o estatal según el aforo, el tipo de evento y el lugar.",
      },
      {
        h2: "Cómo trabajamos, paso a paso",
        ordered: true,
        items: [
          "Primera llamada: conocemos la fecha, el lugar, el aforo esperado y el formato del evento.",
          "Visita al recinto: revisamos accesos, salidas de emergencia, rutas, escenarios, gradas, carpas, instalaciones temporales y entorno.",
          "Programa Especial: elaboramos el documento con análisis de riesgos, organización del personal, procedimientos de emergencia, rutas de evacuación y directorio.",
          "Preparación: damos instrucciones previas al personal del organizador y definimos posiciones, radios y puesto de mando.",
          "Día del evento: nuestro staff opera en sitio, identificado con chalecos distintivos y radios, desde antes de abrir puertas hasta que sale la última persona.",
          "Cierre: te entregamos un reporte de incidencias con recomendaciones para el siguiente evento.",
        ],
      },
      {
        h2: "¿Con cuánta anticipación conviene contratar?",
        p: "Lo antes posible. El programa debe estar listo con tiempo para presentarlo ante la autoridad, y cada autoridad fija sus propios plazos de revisión. Contratar con anticipación también permite corregir a tiempo lo que el análisis del recinto detecte.",
      },
    ],
    faqs: [
      {
        q: "¿Qué es un Programa Especial de Protección Civil?",
        a: "Es el plan de seguridad de un evento: aforo seguro, accesos y salidas, riesgos del lugar, organización del personal, procedimientos de emergencia y coordinación con las autoridades. Para eventos masivos, la autoridad de Protección Civil suele pedirlo para autorizar el evento.",
      },
      {
        q: "¿Mi evento necesita Programa Especial de Protección Civil?",
        a: "Depende del aforo, del tipo de evento y del lugar; lo define la autoridad municipal o estatal de Protección Civil. Si tienes duda, en la primera llamada revisamos tu caso y te orientamos.",
      },
      {
        q: "¿Con cuánta anticipación debo contratar?",
        a: "Lo antes posible: el programa tiene que estar listo para presentarlo ante la autoridad con tiempo, y cada autoridad fija sus propios plazos de revisión.",
      },
      {
        q: "¿Cuánto personal de staff necesita mi evento?",
        a: "Depende del aforo, del recinto, del número de accesos y salidas y de los riesgos del evento. Lo definimos en el análisis de riesgos y queda por escrito en la cotización.",
      },
      {
        q: "¿Su personal está en el evento?",
        a: "Sí. El día del evento nuestro staff opera en accesos, salidas, pasillos y zonas críticas, identificado con chalecos distintivos y con radios, coordinado desde un puesto de mando.",
      },
      {
        q: "¿Se coordinan con las autoridades y los servicios médicos?",
        a: "Sí. Durante el evento mantenemos enlace con Protección Civil, seguridad pública y los servicios médicos presentes.",
      },
      {
        q: "¿Puedo saber gratis qué necesita mi evento?",
        a: "Sí. El diagnóstico de seguridad para eventos masivos es gratuito: en unos minutos te dice qué aspectos de tu evento requieren atención.",
      },
    ],
    related: [
      { href: "/diagnostico-eventos", label: "Diagnóstico gratuito para eventos masivos" },
      { href: "/servicios/programa-interno-proteccion-civil", label: "Programa Interno de Protección Civil" },
      { href: "/servicios/capacitacion-brigadas-emergencia", label: "Capacitación de brigadas de emergencia" },
      { href: "/servicios/estudio-analisis-riesgo", label: "Estudio y análisis de riesgo" },
    ],
    seo: {
      title: "Protección Civil para Eventos Masivos en Morelos | STRATEC",
      description:
        "Programa Especial de Protección Civil y staff en sitio para conciertos, ferias y eventos en Cuernavaca y Morelos: análisis de aforo, radios y puesto de mando.",
      keywords: [
        "protección civil para eventos masivos",
        "programa especial de protección civil",
        "programa especial de protección civil Morelos",
        "protección civil eventos Cuernavaca",
        "seguridad para eventos",
        "staff de seguridad para eventos",
        "protección civil para conciertos",
        "protección civil para ferias",
      ],
    },
  },

  // ── S10 · Acompañamiento mensual (ingreso recurrente, a distancia) ──────
  "acompanamiento-mensual": {
    slug: "acompanamiento-mensual",
    numero: "02.4",
    titulo: "Acompañamiento Mensual en Seguridad y Prevención",
    descripcionCorta: "Seguimiento continuo de tu documentación, vencimientos y acciones preventivas.",
    href: "/servicios/acompanamiento-mensual",
    heroImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Acompañamiento Mensual",
    parentBreadcrumb: "Protección Civil y Gestión de Riesgos",
    parentHref: "/servicios/proteccion-civil",
    h1: "Acompañamiento mensual en seguridad y prevención",
    lead: "No tienes que esperar una inspección o una emergencia para atender la seguridad de tu organización. Te acompañamos todo el año para mantener al día tu documentación, tus vencimientos y tus acciones preventivas, sin que necesites un departamento especializado.",
    intro: "La prevención no es un trámite anual: es una agenda que alguien tiene que llevar. Nosotros la llevamos contigo.",
    blocks: [
      {
        h2: "Reunión mensual de seguimiento",
        p: "Una videollamada al mes con el responsable de tu organización para revisar avances, pendientes y prioridades.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Calendario preventivo y vencimientos",
        p: "Programamos capacitaciones, simulacros, mantenimientos y renovaciones, y te avisamos antes de cada vencimiento.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Orientación ante observaciones y riesgos",
        p: "Si recibes un requerimiento o una observación, o enfrentas una situación de riesgo, te orientamos para atenderla en tiempo y forma.",
        blockImage: "https://images.unsplash.com/photo-1573871906629-f5c700caf507?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Reporte mensual de avances",
        p: "Cada mes recibes un reporte breve con lo realizado, lo pendiente y las recomendaciones de mejora.",
        blockImage: "https://images.unsplash.com/photo-1643962577583-a4c880a109ae?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "A distancia · Videollamada y comunicación digital · Lunes a viernes de 9:00 a 18:00 h",
    gancho: "Tu agenda de seguridad al día, todos los meses, sin contratar un departamento.",
    cta: "Conocer el acompañamiento mensual",
    ragSnippet: {
      h2: "¿Quién lleva la agenda de seguridad y protección civil de tu empresa?",
      p: "El acompañamiento mensual de STRATEC mantiene al día la documentación, los vencimientos y las acciones preventivas de tu organización: una reunión mensual, calendario de actividades, orientación ante observaciones y un reporte de avances. Se presta a distancia.",
    },
    deliverablesListTitle: "¿Qué incluye cada mes?",
    deliverablesList: [
      "Una reunión virtual de seguimiento de hasta 60 minutos",
      "Hasta 2 horas de asesoría y revisión documental",
      "Calendario de actividades preventivas",
      "Seguimiento de vigencias y vencimientos",
      "Orientación ante observaciones o requerimientos",
      "Reporte mensual de avances y recomendaciones",
    ],
    seo: {
      title: "Acompañamiento Mensual en Seguridad y Protección Civil | STRATEC",
      description:
        "Asesoría mensual en seguridad y protección civil para empresas: seguimiento de documentación, vencimientos, calendario preventivo y orientación ante observaciones. Servicio a distancia.",
      keywords: [
        "asesoría mensual protección civil",
        "asesoría protección civil empresas",
        "consultor externo protección civil",
        "seguimiento programa interno protección civil",
        "asesoría seguridad empresarial",
        "iguala protección civil",
      ],
    },
  },

  // ── S11 · Protocolos de seguridad (especialidad, a distancia) ───────────
  "protocolos-seguridad": {
    slug: "protocolos-seguridad",
    numero: "01.4",
    titulo: "Protocolos de Seguridad y Prevención de Extorsión",
    descripcionCorta: "Protocolos de actuación ante extorsión, fraude, amenazas e incidentes de seguridad.",
    href: "/servicios/protocolos-seguridad",
    heroImage: "https://images.unsplash.com/photo-1616873354936-b9e21b744c54?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Protocolos de Seguridad",
    parentBreadcrumb: "Consultoría en Seguridad",
    parentHref: "/servicios/consultoria-seguridad",
    h1: "Protocolos de seguridad y prevención de extorsión para empresas",
    lead: "¿Tu equipo sabe qué hacer cuando recibe una llamada de extorsión, detecta un intento de fraude o enfrenta una amenaza? Diseñamos protocolos de actuación a la medida de tu organización para que cada colaborador sepa cómo reconocer el riesgo, a quién avisar y qué hacer.",
    intro: "La extorsión es uno de los delitos más frecuentes contra las empresas en México. Un protocolo claro reduce el margen de error en los primeros minutos, que son los que más importan.",
    blocks: [
      {
        h2: "Extorsión telefónica y amenazas",
        p: "Cómo reconocer una llamada de extorsión, qué responder y qué no, cómo verificar la situación y a quién informar dentro de la organización.",
        blockImage: "https://images.unsplash.com/photo-1573871906629-f5c700caf507?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Fraude e ingeniería social",
        p: "Medidas para que tu personal identifique solicitudes falsas de pago, suplantación de proveedores o directivos y engaños para obtener información.",
        blockImage: "https://images.unsplash.com/photo-1616873354936-b9e21b744c54?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Accesos, visitantes e incidentes",
        p: "Reglas de control de accesos, atención de personas agresivas o conflictivas y registro de incidentes de seguridad.",
        blockImage: "https://images.unsplash.com/photo-1758404958502-44f156617bae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Comunicación y coordinación en crisis",
        p: "Responsables, líneas de comunicación y pasos a seguir para coordinar la respuesta y proteger a colaboradores y directivos.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "A distancia · Entrevistas virtuales y entrega documental",
    gancho: "En una extorsión, los primeros minutos deciden. Que tu equipo no tenga que improvisarlos.",
    cta: "Solicitar protocolos para mi organización",
    ragSnippet: {
      h2: "¿Tu personal sabe qué hacer ante una llamada de extorsión?",
      p: "STRATEC diseña protocolos de actuación a la medida ante extorsión telefónica, fraude e ingeniería social, amenazas e incidentes de seguridad. Cada protocolo define cómo reconocer el riesgo, a quién informar y qué acciones seguir. Se elabora a distancia.",
    },
    deliverables: [
      { fase: "1 · Diagnóstico",     entregable: "Entrevistas y diagnóstico de necesidades",        queResuelve: "Identifica a qué riesgos está expuesto tu personal" },
      { fase: "2 · Protocolo",       entregable: "Documento de protocolo personalizado",            queResuelve: "Define qué hacer en cada situación" },
      { fase: "3 · Responsables",    entregable: "Funciones, responsables y líneas de comunicación", queResuelve: "Cada persona sabe a quién avisar" },
      { fase: "4 · Implementación",  entregable: "Recomendaciones de implementación y difusión",    queResuelve: "El protocolo se conoce y se aplica" },
    ],
    guide: [
      {
        h2: "¿Qué es un protocolo contra extorsión?",
        p: "Es un documento breve y claro que le dice a cada persona de tu organización qué hacer si recibe una llamada o un mensaje de extorsión, un intento de fraude o una amenaza: cómo reconocerlo, qué responder y qué nunca decir, a quién avisar, cómo verificar la situación y cómo denunciar. Su objetivo es que nadie tenga que improvisar en los primeros minutos, que son los que más importan.",
      },
      {
        h2: "¿Para quién es?",
        p: "Para comercios, restaurantes, oficinas, clínicas, escuelas, constructoras, transportistas y cualquier organización donde alguien contesta el teléfono, atiende al público o maneja pagos. Se elabora a distancia, así que atendemos a empresas de Cuernavaca, de Morelos y del resto de México.",
      },
      {
        h2: "Qué hacer si recibes una llamada de extorsión",
        p: "Estas recomendaciones generales sirven a cualquier persona; el protocolo de tu empresa las convierte en pasos concretos para tu equipo:",
        items: [
          "No des información: ni nombres, ni horarios, ni datos de familiares o de la empresa.",
          "No sigas instrucciones ni hagas depósitos, transferencias o recargas.",
          "Cuelga y verifica directamente con la persona que supuestamente está en riesgo.",
          "Anota el número, la hora y lo que te dijeron, y avisa al responsable de tu organización.",
          "Denuncia al 089 (denuncia anónima). Si hay un riesgo inmediato, llama al 911.",
        ],
      },
      {
        h2: "Cómo elaboramos tu protocolo, paso a paso",
        ordered: true,
        items: [
          "Entrevista por videollamada para entender cómo opera tu organización y quién contesta llamadas, mensajes y visitas.",
          "Revisión de los puntos por donde puede entrar una extorsión o un fraude: teléfonos, WhatsApp, redes sociales, recepción y solicitudes de pago.",
          "Redacción del protocolo con lo que se hace en cada situación.",
          "Definición de responsables, suplentes y líneas de comunicación.",
          "Entrega con recomendaciones para darlo a conocer y aplicarlo en tu equipo.",
        ],
      },
      {
        h2: "¿Qué recibes?",
        items: [
          "Protocolo de actuación a la medida ante extorsión, fraude, amenazas e incidentes.",
          "Responsables, suplentes y líneas de comunicación definidos por escrito.",
          "Recomendaciones para difundir el protocolo y reducir la información de la empresa que queda expuesta.",
          "Opcional: capacitación práctica para tu personal; al concluir, se entrega la constancia DC-3.",
        ],
      },
      {
        h2: "¿Cuánto tiempo tarda?",
        p: "Depende del tamaño de tu organización y del número de sedes; el calendario exacto va en la cotización. Como se trabaja a distancia, se puede empezar sin esperar visitas.",
      },
    ],
    faqs: [
      {
        q: "¿Qué hago si recibo una llamada de extorsión en mi negocio?",
        a: "No des información ni sigas instrucciones, cuelga y verifica directamente con la persona que supuestamente está en riesgo, anota el número y lo que te dijeron, avisa al responsable de tu organización y denuncia al 089. Si hay un riesgo inmediato, llama al 911.",
      },
      {
        q: "¿Qué incluye un protocolo contra extorsión?",
        a: "Cómo reconocer una llamada o mensaje de extorsión, qué responder y qué no, cómo verificar la situación, a quién avisar dentro de la organización, quién decide y cómo denunciar. Se hace a la medida de tu operación.",
      },
      {
        q: "¿También sirve contra fraudes?",
        a: "Sí. El protocolo incluye medidas para detectar solicitudes falsas de pago, a quien se hace pasar por un proveedor o un directivo y los engaños para obtener información.",
      },
      {
        q: "¿Se puede hacer a distancia?",
        a: "Sí. Las entrevistas son por videollamada y el protocolo se entrega en digital, así que atendemos a empresas de todo México.",
      },
      {
        q: "¿Incluye capacitación para el personal?",
        a: "Se puede complementar con una capacitación práctica para que el equipo aplique el protocolo bajo presión. Al concluir, se entrega la constancia DC-3.",
      },
      {
        q: "¿Sirve si ya recibimos una llamada de extorsión?",
        a: "Sí. Es el mejor momento para que no se repita: revisamos qué pasó y preparamos al equipo. Si estás recibiendo una amenaza en este momento, llama al 911.",
      },
      {
        q: "¿La información de mi empresa es confidencial?",
        a: "Sí. Lo que compartes se maneja con confidencialidad y solo se usa para elaborar tu protocolo.",
      },
    ],
    related: [
      { href: "/servicios/estudio-analisis-riesgo", label: "Estudio y análisis de riesgo" },
      { href: "/servicios/videovigilancia-cctv", label: "Cámaras de seguridad y videovigilancia" },
      { href: "/servicios/nom-035-violencia-laboral", label: "NOM-035 y protocolo de violencia laboral" },
      { href: "/servicios/consultoria-seguridad", label: "Consultoría en seguridad" },
      { href: "/diagnostico", label: "Diagnóstico de seguridad gratuito" },
    ],
    seo: {
      title: "Protocolo contra Extorsión y Fraude para Empresas | STRATEC",
      description:
        "Protocolos para que tu equipo sepa qué hacer ante una llamada de extorsión, un fraude o una amenaza: qué responder, a quién avisar y cómo denunciar. A distancia.",
      keywords: [
        "protocolo de extorsión telefónica empresa",
        "qué hacer ante una llamada de extorsión",
        "protocolo contra extorsión para negocios",
        "prevención de extorsión empresas",
        "protocolo de seguridad empresarial",
        "protocolo fraude ingeniería social",
        "protocolos de actuación seguridad",
      ],
    },
  },

  // ── S12 · NOM-035: riesgo psicosocial y violencia laboral (a distancia) ──
  "nom-035-violencia-laboral": {
    slug: "nom-035-violencia-laboral",
    numero: "01.5",
    titulo: "NOM-035: Riesgo Psicosocial y Prevención de Violencia Laboral",
    descripcionCorta: "Cuestionarios de la NOM-035, política de prevención, protocolo de violencia laboral y mecanismo de quejas.",
    href: "/servicios/nom-035-violencia-laboral",
    heroImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "NOM-035 y Violencia Laboral",
    parentBreadcrumb: "Consultoría en Seguridad",
    parentHref: "/servicios/consultoria-seguridad",
    h1: "NOM-035: riesgo psicosocial y prevención de violencia laboral",
    lead: "La NOM-035-STPS-2018 pide a los centros de trabajo identificar y prevenir los factores de riesgo psicosocial, prevenir la violencia laboral y promover un entorno organizacional favorable. Te ayudamos a cumplirla con los cuestionarios oficiales, una política clara y un protocolo que tu personal sepa aplicar.",
    intro: "No se trata de tener un documento archivado: la norma pide evaluar, actuar y dar seguimiento. Lo hacemos contigo, a distancia y con resultados que tu dirección puede usar.",
    blocks: [
      {
        h2: "Cuestionarios oficiales (guías de referencia I, II y III)",
        p: "Aplicamos en línea los cuestionarios que corresponden al tamaño de tu centro de trabajo: identificación de personas expuestas a acontecimientos traumáticos severos, factores de riesgo psicosocial y, en centros de más de 50 trabajadores, evaluación del entorno organizacional. Las respuestas son confidenciales.",
        blockImage: "https://images.unsplash.com/photo-1643962577583-a4c880a109ae?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Análisis de resultados y medidas de control",
        p: "Calificamos los cuestionarios, identificamos las áreas y factores con mayor nivel de riesgo y proponemos las acciones de prevención y control que conviene aplicar.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Política de prevención",
        p: "Redactamos la política de prevención de riesgos psicosociales, prevención de la violencia laboral y promoción de un entorno organizacional favorable, lista para aprobarse y difundirse.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Protocolo de violencia laboral y mecanismo de quejas",
        p: "Definimos cómo recibir una queja de forma segura y confidencial, quién la atiende, cómo se investiga, cómo se protege a la persona afectada y cómo se da seguimiento, incluido el acoso y el hostigamiento.",
        blockImage: "https://images.unsplash.com/photo-1573871906629-f5c700caf507?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Difusión y capacitación",
        p: "Material de difusión para el personal y sesiones virtuales para directivos, mandos medios y responsables de recibir las quejas.",
        blockImage: "https://images.unsplash.com/photo-1758404958502-44f156617bae?auto=format&fit=crop&w=900&q=80",
      },
    ],
    modalidades: "A distancia · Cuestionarios en línea, entrevistas virtuales y entrega documental",
    gancho: "Evaluar, prevenir y atender: la NOM-035 aplicada a tu organización, sin papeleo innecesario.",
    cta: "Solicitar NOM-035 para mi organización",
    ragSnippet: {
      h2: "¿Qué pide la NOM-035 a tu empresa?",
      p: "La NOM-035-STPS-2018 aplica a todos los centros de trabajo en México. Según el número de trabajadores, pide una política de prevención, identificar a quienes vivieron acontecimientos traumáticos severos, analizar los factores de riesgo psicosocial y evaluar el entorno organizacional, además de mecanismos para recibir quejas por violencia laboral. STRATEC aplica los cuestionarios en línea y elabora la política, el protocolo y las medidas de control, a distancia.",
    },
    deliverables: [
      { fase: "1 · Cuestionarios", entregable: "Aplicación en línea de las guías que correspondan",     queResuelve: "Mide el riesgo psicosocial real de tu organización" },
      { fase: "2 · Resultados",    entregable: "Informe de resultados por área y factor de riesgo",     queResuelve: "Muestra dónde actuar primero" },
      { fase: "3 · Política",      entregable: "Política de prevención y protocolo de violencia laboral", queResuelve: "Define reglas, responsables y mecanismo de quejas" },
      { fase: "4 · Acciones",      entregable: "Programa de medidas de control y difusión",             queResuelve: "Convierte el diagnóstico en acciones verificables" },
    ],
    seo: {
      title: "NOM-035: Cuestionarios, Política y Protocolo de Violencia Laboral | STRATEC",
      description:
        "Cumplimiento de la NOM-035-STPS-2018 a distancia: aplicación en línea de las guías de referencia, informe de resultados, política de prevención, protocolo de violencia laboral y mecanismo de quejas.",
      keywords: [
        "NOM-035",
        "NOM-035 cuestionarios",
        "guía de referencia II y III NOM-035",
        "política de prevención de riesgos psicosociales",
        "protocolo de violencia laboral",
        "protocolo de acoso y hostigamiento laboral",
        "riesgo psicosocial empresas",
      ],
    },
  },

  // ── S8 · Dictamen de Seguridad ────────────────────────────────────────────
  // La conclusión del dictamen se denomina "Determinación técnica": la
  // resolución, autorización o visto bueno solo los emite la autoridad.
  "dictamen-seguridad": {
    slug: "dictamen-seguridad",
    numero: "01.3",
    titulo: "Dictamen de Seguridad",
    descripcionCorta: "Evaluación técnica de instalaciones con determinación técnica de sus condiciones de seguridad.",
    href: "/servicios/dictamen-seguridad",
    heroImage: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Dictamen de Seguridad",
    parentBreadcrumb: "Consultoría en Seguridad",
    parentHref: "/servicios/consultoria-seguridad",
    h1: "Dictamen de Seguridad",
    lead: "El Dictamen de Seguridad es un documento técnico en el que STRATEC evalúa, con base en la normatividad aplicable y en criterios profesionales, las condiciones de seguridad que guarda una instalación, proceso o actividad, y las resume en una determinación técnica. Es una opinión profesional objetiva, documentada y firmada por especialistas, útil para la toma de decisiones institucionales, como soporte en trámites ante la autoridad competente o en procesos de due diligence.",
    blocks: [
      {
        h2: "Visita Técnica de Inspección",
        p: "Inspección presencial de las instalaciones objeto del dictamen: condiciones físicas, sistemas de seguridad implementados, señalización, controles de acceso, equipos de protección y estado general de la infraestructura. Se documenta con registro fotográfico y levantamiento de datos.",
        blockImage: "https://images.unsplash.com/photo-1771931322109-180bb1b35bf8?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Evaluación Normativa",
        p: "Contraste de las condiciones observadas con la normatividad aplicable: NOM, Ley General de Protección Civil, Reglamentos Estatales y Municipales, NEC y otras regulaciones relevantes según el tipo de instalación y actividad. Se identifican los cumplimientos, incumplimientos y condiciones no previstas por la norma.",
        blockImage: "https://images.unsplash.com/photo-1529747598642-d0b4e3667314?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Análisis de Condiciones de Seguridad",
        p: "Evaluación técnica de las condiciones de seguridad más allá de lo estrictamente normativo: eficacia de los controles implementados, adecuación de los procedimientos al entorno real y capacidad de respuesta ante los riesgos identificados.",
        blockImage: "https://images.unsplash.com/photo-1710181717510-8e3896937fbd?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Emisión del Dictamen y Determinación Técnica",
        p: "Elaboración del documento formal que incluye: datos de la instalación evaluada, metodología aplicada, hallazgos ordenados por área y nivel de criticidad, la determinación técnica de STRATEC y la firma del profesional responsable. La determinación técnica puede incluir o no una opinión sobre el nivel de riesgo global.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Seguimiento de Recomendaciones",
        p: "Una vez emitido el dictamen, STRATEC puede acompañar a la organización en la implementación de las recomendaciones y emitir un dictamen complementario que documente la atención de las observaciones originales, útil como soporte ante la autoridad competente o en auditorías internas.",
        blockImage: "https://images.unsplash.com/photo-1652739758426-56a564265f9e?auto=format&fit=crop&w=900&q=80",
      },
    ],
    nota: "Los dictámenes de STRATEC están firmados por especialistas con trayectoria verificable en seguridad institucional y protección civil. Su determinación técnica es una opinión profesional: no sustituye las resoluciones, autorizaciones o vistos buenos que corresponde emitir a la autoridad competente, y no emitimos determinaciones favorables que no estén sustentadas en la evidencia técnica recopilada.",
    gancho:
      "Un dictamen de seguridad bien fundamentado es un activo: respalda decisiones, documenta las condiciones reales de sus instalaciones y le permite llegar preparado ante la autoridad.",
    cta: "Solicitar dictamen de seguridad",
    ragSnippet: {
      h2: "¿Necesita documentar las condiciones de seguridad de sus instalaciones antes de un trámite o en un proceso de due diligence?",
      p: "El Dictamen de Seguridad es el documento técnico en el que STRATEC evalúa las condiciones de seguridad de una instalación con base en la normatividad aplicable y emite una determinación técnica. Incluye inspección presencial, evaluación normativa y firma de especialista. Sirve como soporte técnico ante la autoridad competente, que es quien emite la resolución, y en procesos de debida diligencia corporativa.",
    },
    deliverables: [
      { fase: "Fase 1 · Inspección",  entregable: "Visita técnica con registro fotográfico y levantamiento de datos in situ",           queResuelve: "Estado real de las condiciones, no solo revisión de documentos" },
      { fase: "Fase 2 · Normativa",   entregable: "Contraste con NOM aplicables, LGPC y reglamentos estatales y municipales",           queResuelve: "Identifica cumplimientos, incumplimientos y vacíos normativos" },
      { fase: "Fase 3 · Análisis",    entregable: "Evaluación técnica de controles y capacidad de respuesta institucional",             queResuelve: "Criterio profesional más allá del checklist normativo estándar" },
      { fase: "Fase 4 · Dictamen",    entregable: "Documento formal con hallazgos, determinación técnica y firma de especialista",      queResuelve: "Soporte técnico documentado para la autoridad competente y el due diligence" },
      { fase: "Fase 5 · Seguimiento", entregable: "Acompañamiento en correcciones + dictamen complementario",                           queResuelve: "Evidencia de cierre para auditorías subsecuentes o renovaciones" },
    ],
    seo: {
      title: "Dictamen de Seguridad Institucional | Determinación Técnica | STRATEC",
      description:
        "Dictámenes de Seguridad para empresas e instituciones: inspección técnica, evaluación normativa y determinación técnica firmada por especialistas, como soporte ante la autoridad competente.",
      keywords: [
        "dictamen de seguridad",
        "dictamen técnico de seguridad",
        "dictamen de seguridad institucional",
        "determinación técnica de seguridad",
        "evaluación técnica de seguridad",
        "dictamen seguridad empresa",
        "dictamen seguridad México",
        "dictamen seguridad Morelos",
        "documento técnico de seguridad",
        "perito en seguridad institucional",
        "preparación para verificación de protección civil",
      ],
    },
  },
};
