// Contenido de las páginas de cobertura por estado y ciudad.
export const coverageData: Record<
  string,
  {
    state: string;
    cities?: Record<
      string,
      {
        name: string;
        context: string;
        sectors: string[];
      }
    >;
    defaultContext?: string;
    defaultSectors?: string[];
  }
> = {
  morelos: {
    state: "Morelos",
    cities: {
      cuernavaca: {
        name: "Cuernavaca",
        context:
          "Capital estatal con presencia de gobierno, corporativos de servicios, instituciones educativas de alto nivel y desarrolladores inmobiliarios. El corredor industrial CIVAC representa el centro manufacturero de la región, con énfasis en electrónica, plásticos y componentes automotrices. Contexto de seguridad con desafíos de infiltración criminal en algunas áreas operacionales.",
        sectors: [
          "Gobierno Estatal y Municipal",
          "Corporativos de Servicios",
          "Universidades e Institutos",
          "Desarrollo Inmobiliario",
          "Comercio y Turismo"
        ]
      },
      jiutepec: {
        name: "Jiutepec",
        context:
          "Hub industrial y tecnológico del CIVAC. Concentración de plantas de manufactura, ensamble y logística. Instituciones educativas especializadas en ingeniería. Vulnerabilidad operativa derivada de infraestructura de alto valor, movimiento de carga estratégica y personal técnico clave. Demanda creciente de protección de propiedad intelectual y cadena de suministro.",
        sectors: [
          "Manufactura",
          "Electrodomésticos y Electrónica",
          "Autopartes",
          "Logística Industrial",
          "Educación Técnica"
        ]
      },
      cuautla: {
        name: "Cuautla",
        context:
          "Zona de transición agroindustrial hacia industrial. Crecimiento de manufactura pequeña y mediana. Presencia municipal con desafíos de gobernanza. Demanda emergente en seguridad de instalaciones y gestión de riesgos laborales conforme se industrializa la región.",
        sectors: [
          "Gobierno Municipal",
          "Pequeña Manufactura",
          "Agroindustria",
          "Comercio Local"
        ]
      }
    }
  },
  cdmx: {
    state: "Ciudad de México",
    defaultContext:
      "Capital federal con presencia concentrada de gobierno federal, corporativos multinacionales, instituciones educativas de clase mundial, organismos internacionales y sectores financieros y tecnológicos. Ambiente de seguridad complejo con demandas específicas de protección de funcionarios públicos, datos sensibles clasificados, infraestructura crítica y reputación corporativa. Centro de operaciones para muchas de nuestras intervenciones a nivel nacional.",
    defaultSectors: [
      "Gobierno Federal",
      "Corporativos Multinacionales",
      "Sector Financiero",
      "Universidades e Institutos de Investigación",
      "Organismos Internacionales",
      "Tecnología y Telecomunicaciones",
      "Medios de Comunicación"
    ]
  },
  "estado-de-mexico": {
    state: "Estado de México",
    cities: {
      toluca: {
        name: "Toluca",
        context:
          "Capital estatal con gobiernatura, legislativo y administración pública. Presencia de corporativos industriales de mediano y gran escala. Demanda de auditorías de seguridad institucional en administración pública y protección de instalaciones de valor estratégico.",
        sectors: ["Gobierno Estatal", "Manufactura", "Servicios Corporativos"]
      },
      naucalpan: {
        name: "Naucalpan",
        context:
          "Municipio conurbado de alto valor en la zona metropolitana. Concentración de corporativos, parques industriales, hospitales de clase alta. Demanda en protección de activos, seguridad ejecutiva y análisis de riesgos operacionales.",
        sectors: ["Corporativos", "Industria", "Salud Privada", "Servicios Financieros"]
      },
      ecatepec: {
        name: "Ecatepec",
        context:
          "Municipio de transición urbano-industrial con dinámicas de riesgo complejas. Presencia de pequeña y mediana industria, comercio, instituciones educativas. Consultoría en contextos de presión regulatoria y cumplimiento normativo.",
        sectors: ["Pequeña Manufactura", "Comercio", "Educación", "Logística"]
      }
    }
  },
  puebla: {
    state: "Puebla",
    cities: {
      puebla: {
        name: "Puebla",
        context:
          "Centro histórico y administrativo con universidad top-3 nacional, gobierno estatal, corporativos de manufactura especializada. Demanda en seguridad de patrimonio institucional, protección de estudiantes, análisis de riesgos en contextos de confluencia urbana compleja.",
        sectors: ["Gobierno Estatal", "Educación Superior", "Manufactura", "Comercio Cultural"]
      },
      cholula: {
        name: "Cholula",
        context:
          "Zona de presencia universitaria muy fuerte con múltiples instituciones educativas de alcance nacional. Economía sustentada en educación, turismo cultural y comercio estudiantil. Desafíos en seguridad de menores, protección de datos académicos, gestión de riesgos psicosociales.",
        sectors: ["Educación", "Turismo", "Comercio Especializado"]
      }
    }
  },
  guerrero: {
    state: "Guerrero",
    cities: {
      chilpancingo: {
        name: "Chilpancingo",
        context:
          "Capital estatal con gobierno, instituciones educativas y presencia empresarial limitada. Contexto de seguridad complejo con amenazas multidimensionales. Demanda en inteligencia preventiva, gestión institucional de crisis y análisis de vulnerabilidades críticas en infraestructura estatal.",
        sectors: ["Gobierno Estatal", "Educación", "Servicios Básicos"]
      },
      acapulco: {
        name: "Acapulco",
        context:
          "Destino turístico con presencia hotelera, resorts de lujo, infraestructura portuaria y gobierno municipal. Ambiente de seguridad muy dinámico con amenazas a infraestructura turística, ejecutivos y operaciones de comercio. Especialización en protección de complejos turísticos, análisis de riesgos geopolíticos y respuesta ante crisis.",
        sectors: ["Turismo y Hotelería", "Transporte Marítimo", "Comercio de Lujo"]
      }
    }
  },
  "jalisco-guadalajara": {
    state: "Jalisco",
    cities: {
      guadalajara: {
        name: "Guadalajara",
        context:
          "Centro económico de occidente con presencia de corporativos multinacionales, tecnología, educación y gobierno estatal. Cobertura mediante desplazamiento — análisis y consultoría sin presencia operativa permanente. Especialización en evaluación de seguridad corporativa multinacional y análisis de riesgos institucionales.",
        sectors: [
          "Corporativos Multinacionales",
          "Tecnología",
          "Educación Superior",
          "Gobierno"
        ]
      }
    }
  }
};
