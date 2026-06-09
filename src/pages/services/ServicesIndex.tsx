import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SERVICIOS_INDEX } from "@/data/servicesData";

// Primeras 3 tarjetas y últimas 2 para el layout 3+2
const first = SERVICIOS_INDEX.slice(0, 3);
const last  = SERVICIOS_INDEX.slice(3);

export default function ServicesIndex() {
  return (
    <div className="min-h-screen bg-navy-deep">
      <Navbar />

      <main id="main-content">
        {/* ── Hero de página ──────────────────────────────────── */}
        <section className="pt-36 pb-20 md:pt-44 md:pb-24 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg-light opacity-20 pointer-events-none" />
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#C4A04A]/5 blur-3xl pointer-events-none" />

          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="h-px w-10 bg-[#C4A04A]/60" />
              <span className="font-condensed text-[0.72rem] uppercase tracking-[0.35em] text-[#C4A04A]/70">
                Capacidades institucionales
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.05 }}
              className="font-serif font-light text-5xl md:text-6xl lg:text-7xl text-smoke leading-[1.05] tracking-[0.02em] mb-8 max-w-3xl"
            >
              Servicios
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-condensed font-light text-lg md:text-xl text-smoke/60 leading-[1.75] max-w-2xl"
            >
              STRATEC desarrolla soluciones de consultoría, capacitación,
              integración tecnológica y gestión de riesgos orientadas a fortalecer
              las capacidades de seguridad de organizaciones públicas y privadas.
            </motion.p>
          </div>
        </section>

        {/* ── Grid de 5 servicios ─────────────────────────────── */}
        <section className="pb-24 md:pb-32">
          <div className="container-wide">
            {/* Fila 1: 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(196,160,74,0.08)]">
              {first.map((s, i) => (
                <ServiceCard key={s.href} item={s} index={i} />
              ))}
            </div>

            {/* Fila 2: 2 columnas centradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(196,160,74,0.08)] mt-px lg:max-w-[66.666%] lg:mx-auto">
              {last.map((s, i) => (
                <ServiceCard key={s.href} item={s} index={i + 3} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA de cierre ───────────────────────────────────── */}
        <section className="py-24 border-t border-[rgba(196,160,74,0.12)]">
          <div className="container-wide text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-condensed font-light text-smoke/50 text-lg leading-relaxed mb-10">
                Cada propuesta se construye sobre el alcance específico del proyecto
                y el perfil institucional del cliente.
              </p>
              <motion.a
                href="/#contact"
                className="inline-flex items-center gap-3 font-condensed font-medium text-[0.82rem] uppercase tracking-[0.22em] text-[#C4A04A] border border-[rgba(196,160,74,0.4)] px-10 py-4 hover:bg-[rgba(196,160,74,0.08)] hover:border-[#C4A04A] hover:text-smoke transition-all duration-300"
                whileHover={{ x: 2 }}
              >
                Solicitar propuesta dirigida
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ── Tarjeta de servicio ─────────────────────────────────────────────── */
function ServiceCard({
  item,
  index,
}: {
  item: (typeof SERVICIOS_INDEX)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.07 }}
      className="bg-[#1A1A24] group"
    >
      <Link
        to={item.href}
        className="block h-full p-8 md:p-10 border border-[rgba(196,160,74,0.12)]
                   hover:border-[rgba(196,160,74,0.4)] hover:bg-[#232330]
                   transition-all duration-300 relative overflow-hidden"
      >
        {/* Número decorativo */}
        <div
          className="font-serif font-light text-[4rem] leading-none text-[#C4A04A] mb-6 select-none"
          style={{ opacity: 0.18 }}
        >
          {item.numero}
        </div>

        {/* Título */}
        <h2 className="font-serif font-light text-[1.45rem] text-smoke leading-snug mb-3 group-hover:text-[#C4A04A]/90 transition-colors duration-300">
          {item.titulo}
        </h2>

        {/* Descripción */}
        <p className="font-condensed font-light text-[0.95rem] text-smoke/50 leading-relaxed mb-8">
          {item.descripcionCorta}
        </p>

        {/* Flecha → */}
        <div className="flex items-center gap-2 font-condensed text-[0.75rem] uppercase tracking-[0.2em] text-[#C4A04A]/40 group-hover:text-[#C4A04A] transition-all duration-300 group-hover:translate-x-1">
          Ver servicio
          <ArrowRight className="h-3.5 w-3.5" />
        </div>

        {/* Línea de acento en hover */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#C4A04A]/40 group-hover:w-full transition-all duration-500" />
      </Link>
    </motion.div>
  );
}
