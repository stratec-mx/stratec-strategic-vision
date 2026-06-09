import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NetworkBackground } from "@/components/NetworkBackground";
import { ServiceData } from "@/data/servicesData";

interface ServiceLandingProps {
  data: ServiceData;
}

export default function ServiceLanding({ data }: ServiceLandingProps) {
  const { heroImage, breadcrumb, h1, lead, intro, blocks, modalidades, nota, cta } = data;

  return (
    <div className="min-h-screen bg-navy-deep">
      <Navbar />

      <main id="main-content">

        {/* ── Hero con imagen + NetworkBackground ─────────────── */}
        <section className="relative flex items-end overflow-hidden" style={{ minHeight: "72vh" }}>

          {/* Capa de fondo */}
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={h1}
              className="w-full h-full object-cover"
              style={{ opacity: 0.35 }}
              loading="eager"
              decoding="async"
            />
            {/* Gradiente de izquierda a derecha (igual que Hero principal) */}
            <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/88 to-navy-deep/50" />
            {/* Gradiente vertical inferior para mezclar con el contenido */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent" />
            {/* Animación de red — idéntica a la página de inicio */}
            <NetworkBackground density={0.85} />
            {/* Grid sutil */}
            <div className="absolute inset-0 grid-bg-light opacity-25" />
          </div>

          {/* Contenido del hero */}
          <div className="relative container-wide pb-16 pt-40 lg:pt-48">

            {/* Breadcrumb */}
            <motion.nav
              aria-label="Breadcrumb"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-2 font-condensed text-[0.7rem] uppercase tracking-[0.18em] text-smoke/35 mb-8"
            >
              <Link to="/" className="hover:text-[#C4A04A] transition-colors">
                Inicio
              </Link>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <Link to="/servicios" className="hover:text-[#C4A04A] transition-colors">
                Servicios
              </Link>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <span className="text-smoke/50">{breadcrumb}</span>
            </motion.nav>

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="h-px w-10 bg-[#C4A04A]/70" />
              <span className="font-condensed text-[0.72rem] uppercase tracking-[0.35em] text-[#C4A04A]/80">
                Servicios · STRATEC
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.1 }}
              className="font-serif font-light text-4xl md:text-5xl lg:text-6xl text-smoke leading-[1.08] tracking-[0.02em] max-w-3xl mb-6"
            >
              {h1}
            </motion.h1>

            {/* Intro (cursiva dorada — solo para Integración Tecnológica) */}
            {intro && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-serif italic text-lg text-[#C4A04A]/75 mb-5 max-w-2xl leading-relaxed"
              >
                {intro}
              </motion.p>
            )}

            {/* Lead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="font-condensed font-light text-[1.05rem] text-smoke/60 leading-[1.8] max-w-2xl"
            >
              {lead}
            </motion.p>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-smoke/30"
          >
            <span className="font-condensed text-[0.6rem] uppercase tracking-[0.35em]">Scroll</span>
            <div className="h-10 w-px bg-smoke/25" />
          </motion.div>
        </section>

        {/* ── Bloques de sub-servicios ───────────────────────── */}
        <section className="py-20 md:py-28">
          <div className="container-wide max-w-4xl">
            <div className="space-y-0">
              {blocks.map((block, i) => (
                <motion.div
                  key={block.h2}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.06 }}
                  className="py-10 border-b border-[rgba(196,160,74,0.12)] last:border-b-0 group"
                >
                  <div className="grid md:grid-cols-12 gap-6 md:gap-10">
                    {/* Número decorativo */}
                    <div className="md:col-span-1">
                      <span className="font-serif font-light text-2xl text-[#C4A04A] leading-none select-none"
                            style={{ opacity: 0.2 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    {/* Contenido */}
                    <div className="md:col-span-11">
                      <h2 className="font-serif font-light text-2xl md:text-[1.65rem] text-smoke leading-snug mb-4 group-hover:text-[#C4A04A]/85 transition-colors duration-300">
                        {block.h2}
                      </h2>
                      <p className="font-condensed font-light text-[1rem] text-smoke/58 leading-[1.8]">
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
                <p className="font-condensed text-sm text-smoke/45 tracking-[0.1em]">
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
                className="mt-10 pl-5 border-l-2 border-[rgba(196,160,74,0.28)]"
              >
                <p className="font-condensed italic text-[0.88rem] text-smoke/38 leading-relaxed">
                  {nota}
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── CTA de cierre ──────────────────────────────────── */}
        <section className="py-20 md:py-28 border-t border-[rgba(196,160,74,0.1)]">
          <div className="container-wide text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-condensed text-[0.7rem] uppercase tracking-[0.35em] text-[#C4A04A]/50 mb-8">
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
