import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NetworkBackground } from "@/components/NetworkBackground";
import { SERVICIOS_INDEX } from "@/data/servicesData";

// ─── Datos de formatos de intervención (antes solo en homepage) ──────────────
const FORMATS = [
  {
    title: "Diagnóstico Estratégico",
    subtitle: "Evaluación integral de alcance cerrado",
    description:
      "Auditoría inicial con alcance acotado. Evaluación integral del estado de seguridad institucional, normativo y operativo. Identificación de brechas críticas, matriz de riesgos clasificada y hoja de ruta priorizada.",
    recommended:
      "Recomendado para instituciones que requieren una lectura objetiva del estado actual antes de tomar decisiones de inversión o reorganización.",
    deliverables: [
      "Reporte ejecutivo institucional",
      "Matriz de riesgos clasificada por impacto y probabilidad",
      "Plan de mitigación priorizado",
    ],
  },
  {
    title: "Programa de Implementación",
    subtitle: "Instrumentación multi-fase del diagnóstico",
    description:
      "Ejecución estructurada de las intervenciones identificadas en el diagnóstico. Acompañamiento técnico y operativo en la instrumentación de protocolos, normatividad aplicable y arquitectura tecnológica. Alcance escalonado con entregables auditables por fase.",
    recommended:
      "Recomendado para instituciones que han completado un diagnóstico y requieren capacidad operativa para llevarlo a ejecución.",
    deliverables: [
      "Protocolos operativos documentados",
      "Implementación de normatividad aplicable",
      "Arquitectura tecnológica integrada",
      "Plan de transferencia y autonomía operativa",
    ],
  },
  {
    title: "Gestión Institucional Continua",
    subtitle: "Relación estratégica sostenida",
    description:
      "Coordinación normativa, gestión documental, soporte ante contingencias y evolución continua del modelo de seguridad. Función equivalente a una dirección de seguridad institucional externalizada, ajustada a la escala del cliente.",
    recommended:
      "Recomendado para instituciones que requieren capacidad institucional permanente sin la estructura interna de un área dedicada.",
    deliverables: [
      "Coordinación normativa permanente",
      "Gestión documental e institucional",
      "Soporte operativo ante contingencias",
      "Reportes ejecutivos periódicos",
      "Evolución continua del modelo de seguridad",
    ],
  },
];

const first = SERVICIOS_INDEX.slice(0, 3);
const last  = SERVICIOS_INDEX.slice(3);

// ─── Página principal ────────────────────────────────────────────────────────
export default function ServicesIndex() {
  return (
    <div className="min-h-screen bg-navy-deep">
      <Navbar />

      <main id="main-content">

        {/* ══════════════════════════════════════════════════════
            Hero — imagen + NetworkBackground
        ══════════════════════════════════════════════════════ */}
        <section className="relative flex items-end overflow-hidden" style={{ minHeight: "72vh" }}>

          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1920&q=80"
              alt="STRATEC — Consultoría Estratégica de Seguridad"
              className="w-full h-full object-cover"
              style={{ opacity: 0.3 }}
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/88 to-navy-deep/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent" />
            <NetworkBackground density={0.9} />
            <div className="absolute inset-0 grid-bg-light opacity-25" />
          </div>

          <div className="relative container-wide pb-20 pt-44 lg:pt-52">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4 mb-7"
            >
              <div className="h-px w-10 bg-[#C4A04A]/70" />
              <span className="font-condensed text-[0.72rem] uppercase tracking-[0.35em] text-[#C4A04A]/80">
                Capacidades institucionales
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.08 }}
              className="font-serif font-light text-5xl md:text-6xl lg:text-7xl text-smoke leading-[1.05] tracking-[0.02em] mb-7 max-w-3xl"
            >
              Servicios
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="font-condensed font-light text-lg md:text-xl text-smoke/60 leading-[1.75] max-w-2xl"
            >
              STRATEC desarrolla soluciones de consultoría, capacitación,
              integración tecnológica y gestión de riesgos orientadas a fortalecer
              las capacidades de seguridad de organizaciones públicas y privadas.
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

        {/* ══════════════════════════════════════════════════════
            Sección 1 — Áreas de servicio (5 categorías)
        ══════════════════════════════════════════════════════ */}
        <section className="py-24 md:py-32">
          <div className="container-wide">

            {/* Encabezado de sección */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-14"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#C4A04A]/50" />
                <span className="font-condensed text-[0.7rem] uppercase tracking-[0.3em] text-[#C4A04A]/60">
                  Áreas de especialización
                </span>
              </div>
              <h2 className="font-serif font-light text-3xl md:text-4xl text-smoke leading-tight max-w-xl">
                Cinco áreas para fortalecer la seguridad institucional
              </h2>
            </motion.div>

            {/* Grid 3+2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(196,160,74,0.08)]">
              {first.map((s, i) => (
                <ServiceCard key={s.href} item={s} index={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(196,160,74,0.08)] mt-px lg:max-w-[66.666%] lg:mx-auto">
              {last.map((s, i) => (
                <ServiceCard key={s.href} item={s} index={i + 3} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            Divisor
        ══════════════════════════════════════════════════════ */}
        <div className="container-wide">
          <div className="h-px bg-[rgba(196,160,74,0.12)]" />
        </div>

        {/* ══════════════════════════════════════════════════════
            Sección 2 — Formatos de intervención (antes solo en homepage)
        ══════════════════════════════════════════════════════ */}
        <section className="py-24 md:py-32 relative">
          <div className="absolute inset-0 grid-bg-light opacity-20 pointer-events-none" />
          <div className="container-wide relative">

            {/* Encabezado */}
            <div className="grid lg:grid-cols-12 gap-12 mb-16">
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px w-8 bg-[#C4A04A]/50" />
                    <span className="font-condensed text-[0.7rem] uppercase tracking-[0.3em] text-[#C4A04A]/60">
                      Formatos de intervención
                    </span>
                  </div>
                  <h2 className="font-serif font-light text-3xl md:text-4xl lg:text-5xl text-smoke leading-tight">
                    Tres enfoques adaptados<br />a tu etapa institucional
                  </h2>
                </motion.div>
              </div>
              <div className="lg:col-span-5 lg:pt-3">
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-condensed font-light text-smoke/60 text-lg leading-relaxed"
                >
                  No publicamos tarifas. Cada propuesta se construye sobre el alcance
                  específico, el perfil de riesgo institucional y la profundidad de
                  la intervención requerida.
                </motion.p>
              </div>
            </div>

            {/* 3 tarjetas de formato */}
            <div className="grid lg:grid-cols-3 gap-6">
              {FORMATS.map((format, idx) => (
                <motion.div
                  key={format.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="group border border-[rgba(196,160,74,0.25)] bg-[#1A1A24] hover:bg-[#232330] transition-all duration-300"
                >
                  <div className="p-8 flex flex-col h-full">
                    <div className="mb-6">
                      <h3 className="font-serif font-light text-2xl text-smoke mb-2">
                        {format.title}
                      </h3>
                      <p className="font-condensed text-[0.72rem] uppercase tracking-[0.2em] text-[#C4A04A]/70">
                        {format.subtitle}
                      </p>
                    </div>

                    <p className="font-condensed font-light text-sm text-smoke/65 leading-relaxed mb-6">
                      {format.description}
                    </p>

                    <div className="bg-[rgba(196,160,74,0.06)] border border-[rgba(196,160,74,0.15)] p-4 mb-6">
                      <p className="font-condensed text-xs text-[#C4A04A]/75 font-light leading-relaxed">
                        <span className="font-medium">Recomendado:</span>{" "}
                        {format.recommended}
                      </p>
                    </div>

                    <div className="mb-8 flex-grow">
                      <div className="font-condensed text-[0.68rem] uppercase tracking-[0.2em] text-smoke/40 mb-4">
                        Entregables clave
                      </div>
                      <ul className="space-y-2.5">
                        {format.deliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-smoke/65 font-condensed font-light">
                            <CheckCircle2 size={14} className="text-[#C4A04A]/70 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <motion.a
                      href="/#contact"
                      className="inline-flex items-center gap-2 font-condensed text-[0.75rem] uppercase tracking-[0.18em] text-[#C4A04A]/50 hover:text-[#C4A04A] transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      Solicitar propuesta dirigida
                      <ArrowRight size={14} />
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Metodología */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-12 border border-[rgba(196,160,74,0.15)] bg-[#1A1A24]/60 p-8 md:p-10"
            >
              <h3 className="font-serif font-light text-xl text-smoke mb-4">
                Metodología transversal en todos los formatos
              </h3>
              <p className="font-condensed font-light text-smoke/60 leading-relaxed text-[0.95rem]">
                Independientemente del formato elegido, cada intervención se sustenta
                en análisis de inteligencia, diagnóstico profundo de vulnerabilidades,
                cumplimiento normativo mexicano e internacional, y diseño de
                arquitecturas de seguridad ajustadas al contexto específico de cada
                institución. Entregables auditables, reportes ejecutivos de nivel
                C-suite, y transferencia de capacidades son estándares en todas
                nuestras intervenciones.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CTA final
        ══════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-28 border-t border-[rgba(196,160,74,0.1)]">
          <div className="container-wide text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-condensed font-light text-smoke/45 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
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

/* ── Tarjeta de servicio ─────────────────────────────────────────────────── */
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
        <div
          className="font-serif font-light text-[4rem] leading-none text-[#C4A04A] mb-6 select-none"
          style={{ opacity: 0.18 }}
        >
          {item.numero}
        </div>

        <h2 className="font-serif font-light text-[1.45rem] text-smoke leading-snug mb-3 group-hover:text-[#C4A04A]/90 transition-colors duration-300">
          {item.titulo}
        </h2>

        <p className="font-condensed font-light text-[0.95rem] text-smoke/50 leading-relaxed mb-8">
          {item.descripcionCorta}
        </p>

        <div className="flex items-center gap-2 font-condensed text-[0.75rem] uppercase tracking-[0.2em] text-[#C4A04A]/40 group-hover:text-[#C4A04A] transition-all duration-300 group-hover:translate-x-1">
          Ver servicio
          <ArrowRight className="h-3.5 w-3.5" />
        </div>

        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#C4A04A]/40 group-hover:w-full transition-all duration-500" />
      </Link>
    </motion.div>
  );
}
