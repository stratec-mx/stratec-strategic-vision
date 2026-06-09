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

export interface ServiceData {
  slug: string;
  numero: string;
  titulo: string;
  descripcionCorta: string;
  href: string;
  heroImage: string;
  breadcrumb: string;
  h1: string;
  lead: string;
  intro?: string;
  blocks: ServiceBlock[];
  modalidades?: string;
  nota?: string;
  cta: string;
  gancho: string;
  seo?: ServiceSeo;
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
};
