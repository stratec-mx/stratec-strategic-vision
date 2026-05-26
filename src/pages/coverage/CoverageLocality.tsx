import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useParams, Link } from "react-router-dom";

// Configuración de localidades por estado
const coverageData: Record<
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

export default function CoverageLocality() {
  const params = useParams<{ state: string; city?: string }>();
  const state = params.state?.replace(/-/g, "-");
  const city = params.city?.replace(/-/g, "-");

  const stateData = coverageData[state || ""];
  let locality = null;
  let contextText = stateData?.defaultContext || "";
  let sectors = stateData?.defaultSectors || [];

  if (city && stateData?.cities && stateData.cities[city]) {
    locality = stateData.cities[city];
    contextText = locality.context;
    sectors = locality.sectors;
  }

  const pageTitle = locality
    ? `Consultoría de Seguridad Institucional en ${locality.name}`
    : `Consultoría de Seguridad Institucional en ${stateData?.state}`;

  const breadcrumb = locality
    ? `${stateData?.state} > ${locality.name}`
    : stateData?.state;

  return (
    <div className="min-h-screen bg-navy-deep">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container-wide">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Link to="/cobertura" className="text-xs uppercase tracking-widest text-olive/60 hover:text-olive">
              ← Volver a cobertura
            </Link>
          </motion.div>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-light leading-tight text-smoke mb-6">
              {pageTitle}
            </h1>
            <p className="text-lg text-smoke/70 max-w-2xl font-light">
              STRATEC opera en {locality ? `${locality.name}, ${stateData?.state}` : stateData?.state} con cobertura directa a gobierno, corporativos,
              instituciones educativas e industria especializada. Auditorías, gestión normativa y
              arquitectura de seguridad institucional ajustada al perfil de riesgo regional.
            </p>
          </motion.div>

          {/* Context Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16 border border-olive/30 bg-navy/40 p-8 lg:p-12"
          >
            <h2 className="text-2xl font-light text-smoke mb-6">
              Perfil de riesgo institucional en la región
            </h2>
            <p className="text-smoke/70 leading-relaxed font-light">{contextText}</p>
          </motion.section>

          {/* Sectors */}
          {sectors.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-16"
            >
              <h3 className="text-xl font-light text-smoke mb-8">Sectores atendidos</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectors.map((sector) => (
                  <div key={sector} className="border border-olive/20 bg-navy/40 p-6">
                    <p className="text-smoke font-light">{sector}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Services Overview */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <h3 className="text-xl font-light text-smoke mb-8">Formatos de intervención</h3>
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Diagnóstico Estratégico",
                  desc: "Evaluación integral acotada de estado actual de seguridad institucional"
                },
                {
                  title: "Programa de Implementación",
                  desc: "Ejecución estructurada de intervenciones con entregables auditables"
                },
                {
                  title: "Gestión Institucional Continua",
                  desc: "Dirección de seguridad externalizada como función permanente"
                }
              ].map((format) => (
                <div key={format.title} className="border border-olive/20 bg-navy/40 p-6">
                  <h4 className="text-sm uppercase tracking-widest text-olive mb-3">
                    {format.title}
                  </h4>
                  <p className="text-sm text-smoke/70 font-light">{format.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16 border border-olive/30 bg-navy/40 p-8 lg:p-12"
          >
            <h3 className="text-2xl font-light text-smoke mb-8">
              Solicitar propuesta para {locality?.name || stateData?.state}
            </h3>
            <ContactForm />
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
