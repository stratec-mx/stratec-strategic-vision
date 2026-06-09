// ─── STRATEC · Datos centralizados de servicios ────────────────────────────
// NOTA: Las imágenes de Unsplash son placeholders universales.
// Reemplaza cada heroImage con fotografía propia de contexto mexicano
// colocando los archivos en /public/images/servicios/ y referenciando
// la ruta relativa, ej: "/images/servicios/consultoria-seguridad.jpg"

export interface ServiceBlock {
  h2: string;
  p: string;
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
}

export const SERVICIOS_INDEX: Pick<ServiceData, "numero" | "titulo" | "descripcionCorta" | "href" | "heroImage" | "gancho">[] = [
  {
    numero: "01",
    titulo: "Consultoría en Seguridad",
    descripcionCorta: "Diagnósticos, auditorías y estrategias de protección institucional.",
    href: "/servicios/consultoria-seguridad",
    heroImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "Toda organización enfrenta riesgos. La diferencia está en identificarlos antes de que se conviertan en pérdidas operativas, patrimoniales o reputacionales. Construimos diagnósticos precisos y estrategias de protección alineadas a tu operación.",
  },
  {
    numero: "02",
    titulo: "Protección Civil y Gestión Integral de Riesgos",
    descripcionCorta: "Programas internos, brigadas, simulacros y planes de continuidad.",
    href: "/servicios/proteccion-civil",
    heroImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "Una emergencia no avisa. La diferencia entre una crisis y una contingencia manejada es la preparación previa. Diseñamos tu programa, formamos tus brigadas y garantizamos la continuidad operativa.",
  },
  {
    numero: "03",
    titulo: "Capacitación Especializada",
    descripcionCorta: "Formación operativa en seguridad, riesgos y protección civil.",
    href: "/servicios/capacitacion",
    heroImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "La seguridad depende de quienes la ejecutan. Formamos a tu personal con los protocolos, herramientas y criterios necesarios para actuar con eficacia frente a los riesgos reales de su entorno.",
  },
  {
    numero: "04",
    titulo: "Integración Tecnológica para la Seguridad",
    descripcionCorta: "Videovigilancia, monitoreo vehicular, control de accesos y proyectos integrales.",
    href: "/servicios/integracion-tecnologica",
    heroImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "No compras cámaras ni GPS: compras visibilidad, control operativo y capacidad de respuesta. Diseñamos arquitecturas tecnológicas integradas que trabajan al servicio de tu estrategia de seguridad.",
  },
  {
    numero: "05",
    titulo: "Consultoría para Gobierno e Instituciones",
    descripcionCorta: "Diagnósticos institucionales, planeación estratégica y seguridad urbana.",
    href: "/servicios/consultoria-gobierno",
    heroImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1920&q=80",
    gancho:
      "La seguridad institucional requiere análisis técnico, planeación rigurosa y capacidad operativa sostenida. Acompañamos a dependencias y organismos en el fortalecimiento de sus modelos de seguridad con soluciones objetivas y auditables.",
  },
];

export const SERVICES_DATA: Record<string, ServiceData> = {
  "consultoria-seguridad": {
    slug: "consultoria-seguridad",
    numero: "01",
    titulo: "Consultoría en Seguridad",
    descripcionCorta: "Diagnósticos, auditorías y estrategias de protección institucional.",
    href: "/servicios/consultoria-seguridad",
    heroImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Consultoría en Seguridad",
    h1: "Consultoría en Seguridad",
    lead: "Toda organización enfrenta riesgos. La diferencia radica en conocerlos antes de que se conviertan en pérdidas, interrupciones operativas o afectaciones patrimoniales. STRATEC desarrolla diagnósticos, auditorías y estrategias de protección que permiten a empresas, instituciones y organizaciones fortalecer sus capacidades de seguridad mediante soluciones objetivas, medibles y alineadas a su operación.",
    blocks: [
      {
        h2: "Diagnóstico Integral de Seguridad",
        p: "Evaluación estructurada de las condiciones de seguridad física, operativa y organizacional de una instalación, negocio o institución. El resultado es una visión clara de los riesgos existentes, las vulnerabilidades identificadas y las acciones prioritarias para reducir la exposición.",
      },
      {
        h2: "Auditoría de Seguridad",
        p: "Revisión técnica de procedimientos, infraestructura, controles internos y medidas de protección implementadas. Permite verificar el cumplimiento de protocolos, identificar desviaciones operativas y fortalecer los mecanismos de control.",
      },
      {
        h2: "Análisis de Riesgos y Vulnerabilidades",
        p: "Identificación de amenazas internas y externas que puedan afectar personas, activos, operaciones o información. Se desarrolla una matriz de riesgos que facilita la toma de decisiones y la priorización de recursos.",
      },
      {
        h2: "Prevención de Pérdidas",
        p: "Diseño de medidas orientadas a reducir robos, fraudes, mermas, accesos no autorizados y otras situaciones que impactan la continuidad operativa.",
      },
      {
        h2: "Protocolos Institucionales",
        p: "Desarrollo de procedimientos de actuación ante incidentes, emergencias y situaciones críticas, adaptados al entorno y necesidades específicas de cada organización.",
      },
    ],
    gancho:
      "Toda organización enfrenta riesgos. La diferencia está en identificarlos antes de que se conviertan en pérdidas operativas, patrimoniales o reputacionales. Construimos diagnósticos precisos y estrategias de protección alineadas a tu operación.",
    cta: "Solicitar diagnóstico especializado",
  },

  "proteccion-civil": {
    slug: "proteccion-civil",
    numero: "02",
    titulo: "Protección Civil y Gestión Integral de Riesgos",
    descripcionCorta: "Programas internos, brigadas, simulacros y planes de continuidad.",
    href: "/servicios/proteccion-civil",
    heroImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Protección Civil y Gestión Integral de Riesgos",
    h1: "Protección Civil y Gestión Integral de Riesgos",
    lead: "La preparación es la herramienta más efectiva para reducir el impacto de una emergencia. STRATEC acompaña a organizaciones públicas y privadas en la identificación de riesgos, cumplimiento normativo y fortalecimiento de capacidades de respuesta.",
    blocks: [
      {
        h2: "Programas Internos de Protección Civil",
        p: "Diseño e integración de programas conforme a la normatividad aplicable, incorporando análisis de riesgos, organización interna y procedimientos de actuación.",
      },
      {
        h2: "Análisis de Riesgos",
        p: "Identificación de amenazas naturales, tecnológicas y humanas que puedan afectar la operación de una instalación o actividad.",
      },
      {
        h2: "Brigadas de Emergencia",
        p: "Integración, capacitación y fortalecimiento de brigadas responsables de la atención inicial ante situaciones de emergencia.",
      },
      {
        h2: "Simulacros",
        p: "Planeación, ejecución y evaluación de ejercicios prácticos orientados a medir la capacidad de respuesta institucional.",
      },
      {
        h2: "Planes de Emergencia y Continuidad Operativa",
        p: "Desarrollo de estrategias que permitan mantener la operación o recuperar funciones críticas ante eventos disruptivos.",
      },
    ],
    gancho:
      "Una emergencia no avisa. La diferencia entre una crisis y una contingencia manejada es la preparación previa. Diseñamos tu programa, formamos tus brigadas y garantizamos la continuidad operativa.",
    cta: "Solicitar propuesta especializada",
  },

  capacitacion: {
    slug: "capacitacion",
    numero: "03",
    titulo: "Capacitación Especializada",
    descripcionCorta: "Formación operativa en seguridad, riesgos y protección civil.",
    href: "/servicios/capacitacion",
    heroImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Capacitación Especializada",
    h1: "Capacitación Especializada",
    lead: "La seguridad depende de las personas que la ejecutan. STRATEC desarrolla programas de formación orientados a fortalecer competencias, mejorar la capacidad de respuesta y generar una cultura preventiva dentro de organizaciones públicas y privadas.",
    blocks: [
      {
        h2: "Seguridad Institucional y Protocolos",
        p: "Diseño e implementación de Procedimientos Operativos Estandarizados (SOP), protocolos internos y mecanismos de actuación ante incidentes.",
      },
      {
        h2: "Gestión Integral de Riesgos",
        p: "Metodologías para identificar, evaluar y gestionar riesgos en entornos institucionales y empresariales.",
      },
      {
        h2: "Protección Civil y Emergencias",
        p: "Capacitación para brigadas, responsables de seguridad y personal operativo.",
      },
      {
        h2: "Prevención de Fraudes e Ingeniería Social",
        p: "Programas orientados a reducir riesgos asociados a phishing, vishing, fraude corporativo y manipulación de información.",
      },
      {
        h2: "Atención a Personas en Situación de Vulnerabilidad",
        p: "Capacitación en protocolos de primer contacto, atención inicial y actuación institucional.",
      },
    ],
    modalidades: "Presencial · Virtual · In Company",
    gancho:
      "La seguridad depende de quienes la ejecutan. Formamos a tu personal con los protocolos, herramientas y criterios necesarios para actuar con eficacia frente a los riesgos reales de su entorno.",
    cta: "Solicitar programa de capacitación",
  },

  "integracion-tecnologica": {
    slug: "integracion-tecnologica",
    numero: "04",
    titulo: "Integración Tecnológica para la Seguridad",
    descripcionCorta: "Videovigilancia, monitoreo vehicular, control de accesos y proyectos integrales.",
    href: "/servicios/integracion-tecnologica",
    heroImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Integración Tecnológica para la Seguridad",
    h1: "Integración Tecnológica para la Seguridad",
    lead: "La tecnología genera valor cuando se integra a una estrategia de seguridad. STRATEC diseña soluciones tecnológicas orientadas a mejorar la supervisión, fortalecer el control operativo y proporcionar información útil para la toma de decisiones.",
    intro: "Porque el cliente no compra cámaras ni GPS. Compra visibilidad, control, supervisión, evidencia y capacidad de respuesta.",
    blocks: [
      {
        h2: "Sistemas de Videovigilancia",
        p: "Diseño e implementación de soluciones de monitoreo mediante cámaras de seguridad para hogares, comercios, empresas e instituciones. Incluye evaluación de cobertura, configuración y optimización de recursos tecnológicos.",
      },
      {
        h2: "Monitoreo Vehicular Inteligente",
        p: "Implementación de sistemas de localización satelital que permiten supervisar rutas, activos móviles y unidades operativas en tiempo real. Las soluciones incorporan herramientas de geolocalización, alertamiento, análisis de recorridos y control de flotas.",
      },
      {
        h2: "Videotelemática y Cámaras Vehiculares",
        p: "Integración de cámaras embarcadas para registrar eventos durante la operación de vehículos corporativos, comerciales o institucionales. Permite generar evidencia, fortalecer la supervisión operativa y mejorar la gestión de incidentes.",
      },
      {
        h2: "Control de Accesos",
        p: "Implementación de sistemas destinados a regular y registrar el ingreso de personas, vehículos y proveedores.",
      },
      {
        h2: "Sistemas de Alarma y Detección",
        p: "Soluciones orientadas a la detección temprana de eventos de riesgo y fortalecimiento de la capacidad de respuesta.",
      },
      {
        h2: "Proyectos Integrales de Seguridad",
        p: "Diseño de arquitecturas tecnológicas que integran videovigilancia, monitoreo vehicular, control de accesos y sistemas de protección en una solución coordinada.",
      },
    ],
    gancho:
      "No compras cámaras ni GPS: compras visibilidad, control operativo y capacidad de respuesta. Diseñamos arquitecturas tecnológicas integradas que trabajan al servicio de tu estrategia de seguridad.",
    cta: "Solicitar evaluación tecnológica",
  },

  "consultoria-gobierno": {
    slug: "consultoria-gobierno",
    numero: "05",
    titulo: "Consultoría para Gobierno e Instituciones",
    descripcionCorta: "Diagnósticos institucionales, planeación estratégica y seguridad urbana.",
    href: "/servicios/consultoria-gobierno",
    heroImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1920&q=80",
    breadcrumb: "Consultoría para Gobierno e Instituciones",
    h1: "Consultoría para Gobierno e Instituciones",
    lead: "La seguridad institucional requiere análisis técnico, planeación estratégica y mecanismos de gestión que permitan fortalecer capacidades y optimizar recursos. STRATEC desarrolla soluciones dirigidas a dependencias públicas, organismos autónomos, instituciones educativas y organizaciones que requieren instrumentos especializados para la toma de decisiones.",
    blocks: [
      {
        h2: "Diagnósticos Institucionales",
        p: "Evaluación de capacidades operativas, procedimientos y estructuras organizacionales relacionadas con la seguridad.",
      },
      {
        h2: "Planeación Estratégica",
        p: "Diseño de programas, proyectos e instrumentos orientados al fortalecimiento institucional.",
      },
      {
        h2: "Seguridad Urbana y Entornos Seguros",
        p: "Análisis de espacios, infraestructura y dinámicas de riesgo para la generación de entornos más seguros y funcionales.",
      },
      {
        h2: "Prevención y Gestión de Riesgos",
        p: "Desarrollo de estrategias preventivas orientadas a reducir vulnerabilidades y fortalecer capacidades de respuesta.",
      },
      {
        h2: "Estudios Especializados",
        p: "Elaboración de análisis técnicos, reportes ejecutivos, diagnósticos sectoriales y documentos estratégicos para la toma de decisiones.",
      },
    ],
    nota: "STRATEC opera con el sector público bajo acuerdos de confidencialidad institucional. Los detalles de cada intervención se presentan exclusivamente en propuesta dirigida.",
    gancho:
      "La seguridad institucional requiere análisis técnico, planeación rigurosa y capacidad operativa sostenida. Acompañamos a dependencias y organismos en el fortalecimiento de sus modelos de seguridad con soluciones objetivas y auditables.",
    cta: "Solicitar propuesta dirigida",
  },
};
