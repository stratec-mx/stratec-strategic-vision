import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { coverageData } from "@/data/coverageData";

// Configuración de localidades por estado
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
