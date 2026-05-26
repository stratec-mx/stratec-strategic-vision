import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const regions = [
  {
    state: "Morelos",
    slug: "morelos",
    cities: ["Cuernavaca", "Jiutepec", "Cuautla"],
    description: "Cobertura directa en la región central con operaciones en Cuernavaca y corredor industrial CIVAC.",
    priority: "primary"
  },
  {
    state: "Ciudad de México",
    slug: "cdmx",
    description: "Consultoría de seguridad institucional para gobierno federal, corporativos y organismos de la capital.",
    priority: "primary"
  },
  {
    state: "Estado de México",
    slug: "estado-de-mexico",
    cities: ["Toluca", "Naucalpan", "Ecatepec"],
    description: "Cobertura estratégica en la región metropolitana y zona industrial conurbada.",
    priority: "primary"
  },
  {
    state: "Puebla",
    slug: "puebla",
    cities: ["Puebla", "Cholula"],
    description: "Consultoría especializada en seguridad para sector manufacturero y educativo.",
    priority: "primary"
  },
  {
    state: "Guerrero",
    slug: "guerrero",
    cities: ["Chilpancingo", "Acapulco"],
    description: "Gestión integral de seguridad institucional en contexto de riesgos complejos.",
    priority: "primary"
  },
  {
    state: "Jalisco",
    slug: "jalisco-guadalajara",
    cities: ["Guadalajara"],
    description: "Cobertura con desplazamiento — consultoría de seguridad para corporativos de occidente.",
    priority: "secondary"
  }
];

export default function CoverageIndex() {
  return (
    <div className="min-h-screen bg-navy-deep">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container-wide">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <h1 className="text-5xl md:text-6xl font-light leading-tight text-smoke mb-6">
              Cobertura geográfica
            </h1>
            <p className="text-lg text-smoke/70 max-w-2xl font-light">
              STRATEC opera en seis estados de México con operaciones directas y cobertura de desplazamiento.
              Consultoría de seguridad institucional adaptada al perfil de riesgo regional.
            </p>
          </motion.div>

          {/* Regions Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {regions.map((region, idx) => (
              <motion.div
                key={region.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`border transition-all hover:border-olive group ${
                  region.priority === "primary"
                    ? "border-olive/40 bg-navy/40"
                    : "border-smoke/10 bg-navy-deep/40"
                }`}
              >
                <div className="p-8">
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-2xl font-light text-smoke">{region.state}</h2>
                    {region.priority === "secondary" && (
                      <span className="text-[10px] uppercase tracking-widest text-olive/60">
                        Desplazamiento
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-smoke/70 mb-6 font-light leading-relaxed">
                    {region.description}
                  </p>

                  {region.cities && (
                    <div className="mb-6">
                      <div className="text-xs uppercase tracking-widest text-smoke/50 mb-3">
                        Ciudades
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {region.cities.map((city) => (
                          <span
                            key={city}
                            className="px-3 py-1 bg-navy border border-olive/20 text-xs text-smoke/80 rounded"
                          >
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/cobertura/${region.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-olive hover:text-olive/80 transition-colors group-hover:translate-x-1 transition-transform"
                  >
                    Explorar cobertura
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20 border border-olive/30 bg-navy/40 p-12 text-center"
          >
            <h3 className="text-2xl font-light text-smoke mb-4">¿Consultoría en otra región?</h3>
            <p className="text-smoke/70 mb-8 max-w-2xl mx-auto font-light">
              Evaluamos cobertura estratégica en otras regiones. Contacta con nuestro equipo para analizar alcance y desplazamiento.
            </p>
            <a
              href="/#contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-olive text-navy-deep hover:bg-olive/90 transition-colors uppercase text-xs tracking-wider font-semibold"
            >
              Solicitar propuesta
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
