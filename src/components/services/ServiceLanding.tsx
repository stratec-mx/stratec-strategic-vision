import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServiceData } from "@/data/servicesData";

interface ServiceLandingProps {
  data: ServiceData;
}

export default function ServiceLanding({ data }: ServiceLandingProps) {
  const { breadcrumb, h1, lead, intro, blocks, modalidades, nota, cta } = data;

  return (
    <div className="min-h-screen bg-navy-deep">
      <Navbar />

      <main id="main-content">
        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <div className="pt-28 pb-0">
          <div className="container-wide">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 font-condensed text-[0.72rem] uppercase tracking-[0.15em] text-smoke/40"
            >
              <Link to="/" className="hover:text-[#C4A04A] transition-colors">
                Inicio
              </Link>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <Link to="/servicios" className="hover:text-[#C4A04A] transition-colors">
                Servicios
              </Link>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <span className="text-smoke/60">{breadcrumb}</span>
            </nav>
          </div>
        </div>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="pt-12 pb-16 md:pt-16 md:pb-20">
          <div className="container-wide max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="h-px w-10 bg-[#C4A04A]/60" />
              <span className="font-condensed text-[0.72rem] uppercase tracking-[0.35em] text-[#C4A04A]/70">
                Servicios · STRATEC
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-serif font-light text-4xl md:text-5xl lg:text-6xl text-smoke leading-[1.1] tracking-[0.02em] mb-6"
            >
              {h1}
            </motion.h1>

            {intro && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="font-serif italic text-xl text-[#C4A04A]/80 mb-6 leading-relaxed"
              >
                {intro}
              </motion.p>
            )}

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-condensed font-light text-lg text-smoke/65 leading-[1.75] max-w-3xl"
            >
              {lead}
            </motion.p>
          </div>
        </section>

        {/* ── Divisor ────────────────────────────────────────── */}
        <div className="container-wide max-w-4xl">
          <div className="h-px bg-[rgba(196,160,74,0.15)]" />
        </div>

        {/* ── Bloques de sub-servicios ───────────────────────── */}
        <section className="py-16 md:py-20">
          <div className="container-wide max-w-4xl">
            <div className="space-y-0">
              {blocks.map((block, i) => (
                <motion.div
                  key={block.h2}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.05 }}
                  className="py-10 border-b border-[rgba(196,160,74,0.12)] last:border-b-0 group"
                >
                  <div className="grid md:grid-cols-12 gap-6 md:gap-10">
                    {/* Número */}
                    <div className="md:col-span-1 flex md:block items-baseline gap-3">
                      <span className="font-serif font-light text-2xl text-[#C4A04A]/25 leading-none select-none">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    {/* Contenido */}
                    <div className="md:col-span-11">
                      <h2 className="font-serif font-light text-2xl md:text-[1.65rem] text-smoke leading-snug mb-4 group-hover:text-[#C4A04A]/90 transition-colors duration-300">
                        {block.h2}
                      </h2>
                      <p className="font-condensed font-light text-[1rem] text-smoke/60 leading-[1.8]">
                        {block.p}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Modalidades */}
            {modalidades && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mt-10 pt-8 border-t border-[rgba(196,160,74,0.15)]"
              >
                <p className="font-condensed text-sm text-smoke/50 tracking-[0.12em]">
                  <span className="text-[#C4A04A] uppercase font-medium tracking-[0.18em]">
                    Modalidades:
                  </span>{" "}
                  {modalidades}
                </p>
              </motion.div>
            )}

            {/* Nota institucional */}
            {nota && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mt-10 pl-5 border-l-2 border-[rgba(196,160,74,0.3)]"
              >
                <p className="font-condensed italic text-[0.9rem] text-smoke/40 leading-relaxed">
                  {nota}
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── CTA de cierre ──────────────────────────────────── */}
        <section className="py-20 md:py-28 border-t border-[rgba(196,160,74,0.12)]">
          <div className="container-wide text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-condensed text-[0.72rem] uppercase tracking-[0.35em] text-[#C4A04A]/60 mb-6">
                — Cada propuesta se construye sobre el alcance específico del proyecto
              </p>
              <motion.a
                href="/#contact"
                className="inline-flex items-center gap-3 font-condensed font-medium text-[0.82rem] uppercase tracking-[0.22em] text-[#C4A04A] border border-[rgba(196,160,74,0.4)] px-10 py-4 hover:bg-[rgba(196,160,74,0.08)] hover:border-[#C4A04A] hover:text-smoke transition-all duration-300"
                whileHover={{ x: 2 }}
              >
                {cta}
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
