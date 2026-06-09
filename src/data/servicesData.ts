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

export interface ServiceData {
  slug: string;
  numero: string;
  titulo: string;
  descripcionCorta: string;
  href: string;
  heroImage: string;
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
}

// ─── Índice de servicios (usado en homepage + /servicios) ──────────────────
export const SERVICIOS_INDEX: Pick<ServiceData, "numero" | "titulo" | "descripcionCorta" | "href" | "heroImage" | "gancho">[] = [
  {
    numero: "01",
    titulo: "Consultoría en Seguridad",
    descripcionCorta: "Diagnósticos, auditorías y estrategias de protección institucional.",
    href: "/servicios/consultoria-seguridad",
    heroImage: "https://images.unsplash.com/photo-1771931322109-180bb1b35bf8?auto=format&fit=crop&w=1920&q=80",
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

// ─── Datos completos por servicio ─────────────────────────────────────────
export const SERVICES_DATA: Record<string, ServiceData> = {

  // ── 01 · Consultoría en Seguridad ────────────────────────────────────────
  "consultoria-seguridad": {
    slug: "consultoria-seguridad",
    numero: "01",
    titulo: "Consultoría en Seguridad",
    descripcionCorta: "Diagnósticos, auditorías y estrategias de protección institucional.",
    href: "/servicios/consultoria-seguridad",
    heroImage: "https://images.unsplash.com/photo-1771931322109-180bb1b35bf8?auto=format&fit=crop&w=1920&q=80",
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
      title: "Consultoría en Seguridad Institucional | STRATEC",
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
      title: "Programa Interno de Protección Civil para Municipios de Morelos | STRATEC",
      description:
        "Diseño e implementación de Programas Internos de Protección Civil (PIPC) para empresas, instituciones y municipios del Estado de Morelos. Brigadas de emergencia, simulacros y planes de continuidad operativa.",
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
    gancho:
      "La seguridad depende de quienes la ejecutan. Formamos a tu personal con los protocolos, herramientas y criterios necesarios para actuar con eficacia frente a los riesgos reales de su entorno.",
    cta: "Solicitar programa de capacitación",
    seo: {
      title: "Capacitación Policial y en Seguridad Institucional | Programas de Prevención | STRATEC",
      description:
        "Programas especializados de capacitación policial, formación en protección civil y programas de prevención social del delito para corporaciones, instituciones y municipios en México.",
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
    nota: "STRATEC opera con el sector público bajo acuerdos de confidencialidad institucional. Los detalles de cada intervención se presentan exclusivamente en propuesta dirigida.",
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
    h1: "Programa Interno de Protección Civil",
    lead: "El Programa Interno de Protección Civil (PIPC) es el instrumento normativo que toda empresa, institución o dependencia está obligada a implementar. STRATEC diseña, integra y documenta el PIPC de tu organización conforme a la Ley General de Protección Civil y la normatividad del Estado de Morelos, garantizando cumplimiento legal y operatividad real ante emergencias.",
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
        h2: "Registro ante Autoridades y Cumplimiento Normativo",
        p: "Gestión del proceso de registro del PIPC ante la Coordinación Estatal de Protección Civil de Morelos u otras autoridades competentes. Nos aseguramos de que la documentación cumpla con todos los requisitos formales y técnicos exigidos.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
    ],
    gancho:
      "Sin un PIPC registrado, tu organización opera fuera de la ley y expuesta a sanciones. Lo diseñamos, lo documentamos y te acompañamos en el registro ante las autoridades competentes.",
    cta: "Solicitar diseño de PIPC",
    ragSnippet: {
      h2: "¿Su empresa en Morelos opera sin PIPC registrado? Es una infracción activa, no un trámite pendiente.",
      p: "El Programa Interno de Protección Civil (PIPC) es el instrumento legal obligatorio para toda empresa o institución en México. STRATEC lo diseña, documenta y gestiona su registro ante la Coordinación Estatal de Protección Civil de Morelos, garantizando cumplimiento normativo completo en un proceso de 4 a 8 semanas.",
    },
    deliverables: [
      { fase: "1 · Diagnóstico",    entregable: "Informe de riesgos del inmueble (amenazas internas y externas)",         queResuelve: "Identifica qué pone en riesgo a su personal e instalaciones" },
      { fase: "2 · Estructura",     entregable: "Organigrama de la Unidad Interna de Protección Civil (UIPC)",            queResuelve: "Define quién hace qué antes, durante y después de una emergencia" },
      { fase: "3 · Procedimientos", entregable: "Protocolos por tipo de evento: sismo, incendio, derrames, amenaza",      queResuelve: "Elimina la improvisación cuando el tiempo no da margen de error" },
      { fase: "4 · Señalización",   entregable: "Planos de evacuación actualizados + revisión de señalética NOM",         queResuelve: "Cumple los requisitos visuales exigidos en inspecciones oficiales" },
      { fase: "5 · Registro",       entregable: "Trámite ante la Coordinación Estatal de Protección Civil Morelos",       queResuelve: "Convierte el programa en documento legal vigente y verificable" },
      { fase: "6 · Cierre",         entregable: "Informe de entrega + constancias individuales del proceso",              queResuelve: "Evidencia documental ante autoridades, clientes y auditores" },
    ],
    deliverablesListTitle: "¿Para qué tipo de organización aplica el PIPC?",
    deliverablesList: [
      "Empresas industriales, comerciales o de servicios con más de 15 empleados",
      "Instituciones educativas: colegios, universidades y centros de capacitación",
      "Clínicas, hospitales y centros médicos privados",
      "Dependencias municipales y organismos públicos del Estado de Morelos",
      "Desarrollos inmobiliarios, centros comerciales y edificios de oficinas",
      "Empresas en proceso de licitación pública que requieren acreditar cumplimiento normativo",
    ],
    seo: {
      title: "Programa Interno de Protección Civil en Morelos | PIPC Empresas | STRATEC",
      description:
        "Diseño e implementación del Programa Interno de Protección Civil (PIPC) para empresas, instituciones y municipios en el Estado de Morelos. Cumplimiento normativo, diagnóstico de riesgos y registro ante autoridades.",
      keywords: [
        "Programa Interno de Protección Civil",
        "PIPC",
        "Programa Interno de Protección Civil Morelos",
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
    h1: "Capacitación de Brigadas de Emergencia",
    lead: "Las brigadas de emergencia son el primer eslabón de respuesta dentro de cualquier organización. STRATEC forma y certifica a los integrantes de tus brigadas con entrenamiento práctico, protocolos actualizados y evaluaciones reales, para que actúen con eficacia cuando una emergencia no da tiempo de improvisar.",
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
    seo: {
      title: "Capacitación de Brigadas de Emergencia | Evacuación y Primeros Auxilios | STRATEC",
      description:
        "Formación práctica para brigadas de evacuación, primeros auxilios, contra incendios y búsqueda y rescate. Programas in company con constancias y simulacros para empresas e instituciones en México.",
      keywords: [
        "capacitación brigadas de emergencia",
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
      title: "Estudio y Análisis de Riesgo Institucional | Vulnerabilidades y Amenazas | STRATEC",
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
    h1: "Sistemas de Videovigilancia CCTV",
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
    seo: {
      title: "Instalación de Videovigilancia CCTV para Empresas | Cámaras de Seguridad | STRATEC",
      description:
        "Diseño, suministro e instalación de sistemas de videovigilancia CCTV para empresas, comercios e instituciones en México. Evaluación de cobertura, equipo profesional y capacitación incluida.",
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
      title: "Auditoría de Seguridad Institucional | Revisión de Controles y Protocolos | STRATEC",
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

  // ── S8 · Dictamen de Seguridad ────────────────────────────────────────────
  "dictamen-seguridad": {
    slug: "dictamen-seguridad",
    numero: "01.3",
    titulo: "Dictamen de Seguridad",
    descripcionCorta: "Evaluación técnica y emisión de dictámenes de seguridad institucional.",
    href: "/servicios/dictamen-seguridad",
    heroImage: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Dictamen de Seguridad",
    parentBreadcrumb: "Consultoría en Seguridad",
    parentHref: "/servicios/consultoria-seguridad",
    h1: "Dictamen de Seguridad",
    lead: "El Dictamen de Seguridad es un documento técnico que establece el estado que guarda la seguridad de una instalación, proceso o actividad con base en la normatividad aplicable y criterios profesionales. STRATEC emite dictámenes objetivos, documentados y firmados por especialistas, para uso institucional, trámites ante autoridades o procesos de due diligence.",
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
        h2: "Emisión del Dictamen",
        p: "Elaboración del documento formal que incluye: datos del objeto dictaminado, metodología aplicada, hallazgos ordenados por área y nivel de criticidad, conclusión técnica y firma del profesional responsable. El dictamen puede emitirse con o sin opinión sobre el nivel de riesgo global.",
        blockImage: "https://images.unsplash.com/photo-1601546993085-fdfb6c5f76a9?auto=format&fit=crop&w=900&q=80",
      },
      {
        h2: "Seguimiento de Recomendaciones",
        p: "Una vez emitido el dictamen, STRATEC puede acompañar a la organización en la implementación de las recomendaciones y emitir un dictamen complementario que acredite el cumplimiento de las observaciones originales, útil para trámites ante autoridades o auditorías internas.",
        blockImage: "https://images.unsplash.com/photo-1652739758426-56a564265f9e?auto=format&fit=crop&w=900&q=80",
      },
    ],
    nota: "Los dictámenes emitidos por STRATEC están firmados por especialistas con trayectoria verificable en seguridad institucional y protección civil. No emitimos dictámenes favorables que no estén sustentados en la evidencia técnica recopilada.",
    gancho:
      "Un dictamen de seguridad bien fundamentado es un activo: respalda decisiones, acredita condiciones ante autoridades y reduce la responsabilidad legal de la organización.",
    cta: "Solicitar dictamen de seguridad",
    ragSnippet: {
      h2: "¿Necesita acreditar las condiciones de seguridad de sus instalaciones ante una autoridad o en un proceso de due diligence?",
      p: "El Dictamen de Seguridad es el documento técnico que establece el estado que guarda la seguridad de una instalación con base en la normatividad aplicable. STRATEC emite dictámenes con inspección presencial, evaluación normativa y firma de especialista. Válido ante autoridades y procesos de debida diligencia corporativa.",
    },
    deliverables: [
      { fase: "Fase 1 · Inspección",  entregable: "Visita técnica con registro fotográfico y levantamiento de datos in situ",  queResuelve: "Estado real de las condiciones, no solo revisión de documentos" },
      { fase: "Fase 2 · Normativa",   entregable: "Contraste con NOM aplicables, LGPC y reglamentos estatales y municipales",  queResuelve: "Identifica cumplimientos, incumplimientos y vacíos normativos" },
      { fase: "Fase 3 · Análisis",    entregable: "Evaluación técnica de controles y capacidad de respuesta institucional",    queResuelve: "Criterio profesional más allá del checklist normativo estándar" },
      { fase: "Fase 4 · Dictamen",    entregable: "Documento formal con hallazgos, conclusión técnica y firma de especialista", queResuelve: "Instrumento legal válido ante autoridades y due diligence corporativo" },
      { fase: "Fase 5 · Seguimiento", entregable: "Acompañamiento en correcciones + dictamen complementario de cumplimiento",  queResuelve: "Evidencia de cierre para auditorías subsecuentes o renovaciones" },
    ],
    seo: {
      title: "Dictamen de Seguridad Institucional | Evaluación Técnica Normativa | STRATEC",
      description:
        "Emisión de Dictámenes de Seguridad para empresas e instituciones: inspección técnica, evaluación normativa, análisis de condiciones y documento formal firmado por especialistas.",
      keywords: [
        "dictamen de seguridad",
        "dictamen de protección civil",
        "dictamen técnico de seguridad",
        "dictamen de seguridad institucional",
        "dictamen normativo seguridad",
        "evaluación técnica de seguridad",
        "dictamen seguridad empresa",
        "dictamen seguridad México",
        "dictamen seguridad Morelos",
        "documento técnico de seguridad",
        "perito en seguridad institucional",
        "dictamen instalaciones seguridad",
      ],
    },
  },
};
