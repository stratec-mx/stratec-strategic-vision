// Sugerencias iniciales del chat según la página donde abre el visitante.
const CONTACTO = "Quiero que me contacte un consultor";

const POR_PAGINA: { ruta: RegExp; sugerencias: string[] }[] = [
  {
    ruta: /^\/servicios\/(proteccion-civil|programa-interno-proteccion-civil|revision-programa-interno)/,
    sugerencias: [
      "¿Qué incluye el Programa Interno de Protección Civil?",
      "Tengo una inspección de Protección Civil próxima",
      "Ya tengo programa y necesito actualizarlo",
      CONTACTO,
    ],
  },
  {
    ruta: /^\/servicios\/capacitacion/,
    sugerencias: [
      "Quiero capacitar a mis brigadas",
      "¿La capacitación puede ser en mis instalaciones?",
      "¿Cuántas personas pueden participar?",
      CONTACTO,
    ],
  },
  {
    ruta: /^\/servicios\/(integracion-tecnologica|videovigilancia-cctv|gps-monitoreo-vehicular)/,
    sugerencias: [
      "Quiero revisar mis cámaras de seguridad",
      "Necesito controlar quién entra a mi empresa",
      "Monitoreo GPS para mi flotilla",
      CONTACTO,
    ],
  },
  {
    ruta: /^\/servicios\/nom-035-violencia-laboral/,
    sugerencias: [
      "¿Cómo se aplican los cuestionarios de la NOM-035?",
      "Necesito un protocolo contra la violencia laboral",
      CONTACTO,
    ],
  },
  {
    ruta: /^\/servicios\/protocolos-seguridad/,
    sugerencias: [
      "Quiero un protocolo contra la extorsión",
      "¿Qué hago si recibo una llamada de extorsión?",
      CONTACTO,
    ],
  },
  {
    ruta: /^\/servicios\/consultoria-gobierno/,
    sugerencias: [
      "Somos una dependencia de gobierno",
      "¿Atienden municipios y licitaciones?",
      CONTACTO,
    ],
  },
  {
    ruta: /^\/servicios\/(estudio-analisis-riesgo|auditoria-seguridad|dictamen-seguridad|consultoria-seguridad|plan-continuidad-operaciones|acompanamiento-mensual)/,
    sugerencias: [
      "Quiero saber qué riesgos tiene mi empresa",
      "¿En qué se diferencia un análisis de una auditoría?",
      "Tengo una inspección próxima",
      CONTACTO,
    ],
  },
];

const GENERALES = [
  "Necesito mi Programa Interno de Protección Civil",
  "Quiero capacitar a mis brigadas",
  "Tengo una inspección próxima",
  CONTACTO,
];

export const sugerenciasPara = (pathname: string) =>
  POR_PAGINA.find((p) => p.ruta.test(pathname))?.sugerencias ?? GENERALES;
