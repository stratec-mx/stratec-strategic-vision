import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { SERVICIOS_INDEX } from "@/data/servicesData";

/* ── Tarjeta expandible para homepage ───────────────────────────────────── */
function HomeServiceCard({
  s,
  index,
}: {
  s: (typeof SERVICIOS_INDEX)[number];
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="bg-[#1A1A24]"
    >
      <div
        className={`border transition-all duration-300 relative overflow-hidden
          ${open
            ? "border-[rgba(196,160,74,0.45)] bg-[#232330]"
            : "border-[rgba(196,160,74,0.1)] hover:border-[rgba(196,160,74,0.3)] hover:bg-[#1e1e2d]"
          }`}
      >
        {/* Cabecera clicable */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left flex items-start gap-5 p-6 group"
        >
          <span
            className="font-serif font-light text-3xl leading-none text-[#C4A04A] shrink-0 mt-0.5 select-none"
            style={{ opacity: 0.25 }}
          >
            {s.numero}
          </span>

          <div className="min-w-0 flex-1">
            <p
              className={`font-serif font-light text-[1.1rem] leading-snug mb-1.5 transition-colors duration-300
                ${open ? "text-[#C4A04A]/85" : "text-smoke group-hover:text-[#C4A04A]/75"}`}
            >
              {s.titulo}
            </p>
            <p className="font-condensed font-light text-[0.85rem] text-smoke/45 leading-relaxed">
              {s.descripcionCorta}
            </p>
          </div>

          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className={`inline-flex mt-1 shrink-0 transition-colors duration-300
              ${open ? "text-[#C4A04A]" : "text-smoke/25 group-hover:text-[#C4A04A]/50"}`}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        {/* Panel expandible */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="exp"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              {/* Gancho + CTA */}
              <div className="px-6 pt-4 pb-7">
                <p className="font-condensed font-light text-[0.88rem] text-smoke/65 leading-[1.85] mb-5 italic border-l-2 border-[rgba(196,160,74,0.3)] pl-3.5">
                  {s.gancho}
                </p>
                <Link
                  to={s.href}
                  className="inline-flex items-center gap-2 font-condensed text-[0.72rem] uppercase tracking-[0.2em]
                             text-[#C4A04A] border border-[rgba(196,160,74,0.4)] px-6 py-2.5
                             hover:bg-[rgba(196,160,74,0.1)] hover:border-[#C4A04A] transition-all duration-300"
                >
                  Ver servicio completo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`absolute bottom-0 left-0 h-0.5 bg-[#C4A04A]/35 transition-all duration-500
            ${open ? "w-full" : "w-0"}`}
        />
      </div>
    </motion.div>
  );
}

export const Services = () => {
  return (
    <section id="services" className="py-32 bg-navy-deep relative overflow-hidden">
      <div className="absolute inset-0 grid-bg-light opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#C4A04A]/4 blur-3xl pointer-events-none" />

      <div className="container-wide relative">

        {/* ── Encabezado ── */}
        <div className="grid lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-[#C4A04A]/60" />
                <span className="font-condensed text-[0.72rem] uppercase tracking-[0.35em] text-[#C4A04A]/70">
                  Capacidades institucionales
                </span>
              </div>
              <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl text-smoke leading-tight">
                Áreas de especialización
              </h2>
            </motion.div>
          </div>
          <div className="lg:col-span-5 lg:pt-4">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-condensed font-light text-smoke/60 text-lg leading-relaxed"
            >
              Consultoría, capacitación, integración tecnológica y gestión de riesgos
              para organizaciones públicas y privadas que operan en entornos de alta
              exigencia.
            </motion.p>
          </div>
        </div>

        {/* ── Lista de servicios expandibles ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(196,160,74,0.08)] mb-16">
          {SERVICIOS_INDEX.map((s, i) => (
            <HomeServiceCard key={s.href} s={s} index={i} />
          ))}
        </div>

        {/* ── CTA hacia la página completa ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between
                     gap-6 border border-[rgba(196,160,74,0.15)] bg-[#1A1A24]/60 p-8 md:p-10"
        >
          <div>
            <p className="font-serif font-light text-xl text-smoke mb-1">
              Cada propuesta se diseña a medida
            </p>
            <p className="font-condensed font-light text-sm text-smoke/50">
              No publicamos tarifas. El alcance, la profundidad y los entregables
              se definen con base en el perfil institucional de cada cliente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/servicios"
              className="inline-flex items-center gap-2 font-condensed text-[0.78rem] uppercase tracking-[0.2em]
                         text-[#C4A04A] border border-[rgba(196,160,74,0.4)] px-7 py-3
                         hover:bg-[rgba(196,160,74,0.08)] hover:border-[#C4A04A] transition-all duration-300 whitespace-nowrap"
            >
              Ver todos los servicios
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 font-condensed text-[0.78rem] uppercase tracking-[0.2em]
                         text-[#0A0A0F] bg-[#C4A04A] px-7 py-3
                         hover:bg-[#C4A04A]/90 transition-all duration-300 font-medium whitespace-nowrap"
            >
              Solicitar diagnóstico
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
