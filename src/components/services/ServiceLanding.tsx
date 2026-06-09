import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NetworkBackground } from "@/components/NetworkBackground";
import { ServiceBlock, ServiceData, RagDeliverable } from "@/data/servicesData";
import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SchemaMarkup } from "@/components/SEO/SchemaMarkup";
import { SERVICE_SCHEMA, BREADCRUMB_SCHEMA, SITE_URL, SITE_CONSULTANT, PERSON_SCHEMA } from "@/lib/seo";

interface ServiceLandingProps {
  data: ServiceData;
}

export default function ServiceLanding({ data }: ServiceLandingProps) {
  const {
    heroImage, breadcrumb, parentBreadcrumb, parentHref,
    h1, lead, intro, blocks, modalidades, nota, cta, seo, href,
    ragSnippet, deliverables, deliverablesListTitle, deliverablesList,
  } = data;

  const pageUrl = `${SITE_URL}${href}`;
  const seoTitle = seo?.title ?? `${h1} | STRATEC`;
  const seoDesc = seo?.description ?? lead.slice(0, 160);
  const seoKeywords = seo?.keywords ?? [];

  const serviceSchema = SERVICE_SCHEMA({
    name: h1,
    description: seoDesc,
    image: heroImage,
    url: pageUrl,
  });

  // Breadcrumb schema: añade nivel de categoría padre cuando existe
  const breadcrumbItems = parentBreadcrumb && parentHref
    ? [
        { name: "Inicio", url: SITE_URL },
        { name: "Servicios", url: `${SITE_URL}/servicios` },
        { name: parentBreadcrumb, url: `${SITE_URL}${parentHref}` },
        { name: breadcrumb, url: pageUrl },
      ]
    : [
        { name: "Inicio", url: SITE_URL },
        { name: "Servicios", url: `${SITE_URL}/servicios` },
        { name: breadcrumb, url: pageUrl },
      ];

  const breadcrumbSchema = BREADCRUMB_SCHEMA(breadcrumbItems);

  return (
    <div className="min-h-screen bg-navy-deep">
      <SeoHelmet
        title={seoTitle}
        description={seoDesc}
        keywords={seoKeywords}
        url={pageUrl}
        canonical={pageUrl}
        image={heroImage}
        type="website"
      />
      <SchemaMarkup schema={serviceSchema} />
      <SchemaMarkup schema={breadcrumbSchema} />
      <SchemaMarkup schema={PERSON_SCHEMA(SITE_CONSULTANT)} />
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
            <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/88 to-[#0A0A0F]/50" />
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
              className="flex items-center gap-2 font-condensed text-[0.7rem] uppercase tracking-[0.18em] text-white/35 mb-8 flex-wrap"
            >
              <Link to="/" className="hover:text-[#C4A04A] transition-colors">
                Inicio
              </Link>
              <ChevronRight className="h-3 w-3 opacity-40" />
              <Link to="/servicios" className="hover:text-[#C4A04A] transition-colors">
                Servicios
              </Link>
              {parentBreadcrumb && parentHref && (
                <>
                  <ChevronRight className="h-3 w-3 opacity-40" />
                  <Link to={parentHref} className="hover:text-[#C4A04A] transition-colors">
                    {parentBreadcrumb}
                  </Link>
                </>
              )}
              <ChevronRight className="h-3 w-3 opacity-40" />
              <span className="text-white/50">{breadcrumb}</span>
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
              className="font-serif font-light text-4xl md:text-5xl lg:text-6xl text-white leading-[1.08] tracking-[0.02em] max-w-3xl mb-6"
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
              className="font-condensed font-light text-[1.05rem] text-white/60 leading-[1.8] max-w-2xl"
            >
              {lead}
            </motion.p>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30"
          >
            <span className="font-condensed text-[0.6rem] uppercase tracking-[0.35em]">Scroll</span>
            <div className="h-10 w-px bg-white/25" />
          </motion.div>
        </section>

        {/* ══ RAG SNIPPET — Resumen Ejecutivo ════════════════════
             Texto plano visible siempre (nunca oculto), estructurado
             para extracción como Featured Snippet por Google y LLMs.
             H2 + P inmediato = patrón RAG óptimo.             ══════ */}
        {ragSnippet && (
          <section
            aria-label="Resumen ejecutivo del servicio"
            className="py-14 md:py-18 bg-[#0D0D18] border-b border-[rgba(196,160,74,0.12)]"
          >
            <div className="container-wide max-w-4xl">
              <motion.article
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="border-l-4 border-[#C4A04A]/55 pl-6 pr-4 py-6 bg-[rgba(196,160,74,0.03)]"
              >
                {/* Etiqueta visible — señal semántica para crawlers */}
                <span className="font-condensed text-[0.62rem] uppercase tracking-[0.38em] text-[#C4A04A]/45 block mb-4">
                  ── Resumen ejecutivo
                </span>

                {/* H2 conversacional — trigger de Featured Snippet */}
                <h2 className="font-serif font-light text-xl md:text-[1.55rem] text-white leading-snug mb-4 max-w-3xl">
                  {ragSnippet.h2}
                </h2>

                {/* Párrafo de respuesta directa ≤ 55 palabras — formato RAG */}
                <p
                  className="font-condensed font-light text-[0.97rem] leading-[1.9] max-w-3xl"
                  style={{ color: "rgba(230,228,224,0.72)" }}
                >
                  {ragSnippet.p}
                </p>
              </motion.article>
            </div>
          </section>
        )}

        {/* ══ TABLA DE ENTREGABLES ════════════════════════════════
             <table> nativo — los LLMs extraen tablas HTML con alta
             fidelidad. Encabezados <th> descriptivos. Sin imágenes. ══ */}
        {(deliverables || deliverablesList) && (
          <section
            aria-label="Entregables y aplicabilidad del servicio"
            className="py-14 md:py-20 bg-navy-deep border-b border-[rgba(196,160,74,0.08)]"
          >
            <div className="container-wide max-w-4xl">

              {/* Tabla de fases y entregables */}
              {deliverables && deliverables.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-px w-8 bg-[#C4A04A]/40" />
                    <span className="font-condensed text-[0.68rem] uppercase tracking-[0.3em] text-[#C4A04A]/55">
                      Entregables del servicio
                    </span>
                  </div>

                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full border-collapse min-w-[560px]">
                      <thead>
                        <tr className="border-b border-[rgba(196,160,74,0.22)]">
                          <th
                            scope="col"
                            className="text-left font-condensed text-[0.67rem] uppercase tracking-[0.22em] text-[#C4A04A]/55 pb-4 pr-6 whitespace-nowrap"
                          >
                            Fase
                          </th>
                          <th
                            scope="col"
                            className="text-left font-condensed text-[0.67rem] uppercase tracking-[0.22em] text-[#C4A04A]/55 pb-4 pr-6"
                          >
                            Entregable
                          </th>
                          <th
                            scope="col"
                            className="text-left font-condensed text-[0.67rem] uppercase tracking-[0.22em] text-[#C4A04A]/55 pb-4"
                          >
                            Qué resuelve
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliverables.map((row: RagDeliverable, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(196,160,74,0.03)] transition-colors duration-200"
                          >
                            <td className="py-4 pr-6 font-condensed text-[0.75rem] text-[#C4A04A]/65 whitespace-nowrap align-top leading-relaxed">
                              {row.fase}
                            </td>
                            <td className="py-4 pr-6 font-condensed text-[0.87rem] text-white/78 align-top leading-relaxed">
                              {row.entregable}
                            </td>
                            <td
                              className="py-4 font-condensed text-[0.84rem] align-top leading-relaxed"
                              style={{ color: "rgba(230,228,224,0.52)" }}
                            >
                              {row.queResuelve}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Lista de aplicabilidad — <ul> nativo con negritas en primeras palabras */}
              {deliverablesList && deliverablesList.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: deliverables ? 0.12 : 0 }}
                  className={deliverables ? "mt-12 pt-10 border-t border-[rgba(196,160,74,0.1)]" : ""}
                >
                  {deliverablesListTitle && (
                    <div className="flex items-center gap-3 mb-7">
                      <div className="h-px w-8 bg-[#C4A04A]/40" />
                      <span className="font-condensed text-[0.68rem] uppercase tracking-[0.3em] text-[#C4A04A]/55">
                        {deliverablesListTitle}
                      </span>
                    </div>
                  )}
                  <ul className="space-y-3.5" role="list">
                    {deliverablesList.map((item: string, i: number) => {
                      const words = item.split(" ");
                      const boldPart = words.slice(0, 3).join(" ");
                      const rest = words.slice(3).join(" ");
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-3 font-condensed text-[0.9rem]"
                          style={{ color: "rgba(230,228,224,0.62)" }}
                        >
                          <span className="text-[#C4A04A]/45 mt-0.5 shrink-0 select-none">·</span>
                          <span>
                            <strong className="text-white/85 font-medium">{boldPart}</strong>
                            {rest ? ` ${rest}` : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}

            </div>
          </section>
        )}

        {/* ── Bloques de sub-servicios ───────────────────────── */}
        <section className="py-20 md:py-28 bg-navy-deep">
          <div className="container-wide max-w-4xl">

            {/* Cabecera de sección */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="h-px w-8 bg-[#C4A04A]/40" />
              <span className="font-condensed text-[0.68rem] uppercase tracking-[0.3em] text-[#C4A04A]/55">
                Alcance del servicio
              </span>
            </motion.div>

            <div className="divide-y divide-[rgba(196,160,74,0.1)]">
              {blocks.map((block, i) => (
                <BlockItem
                  key={block.h2}
                  block={block}
                  index={i}
                  cta={cta}
                  total={blocks.length}
                />
              ))}
            </div>

            {/* Modalidades */}
            {modalidades && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mt-12 pt-8 border-t border-[rgba(196,160,74,0.15)]"
              >
                <p className="font-condensed text-sm text-white/45 tracking-[0.1em]">
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
                <p className="font-condensed italic text-[0.88rem] text-white/40 leading-relaxed">
                  {nota}
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {/* ══ BLOQUE E-E-A-T — Metodología y Autoría ═══════════════
             Señal de confianza YMYL: normas citadas en texto plano
             + autor identificable con enlace externo verificable.
             Google y los LLMs usan este bloque para evaluar E-E-A-T. ══ */}
        <section
          aria-label="Metodología y equipo consultor"
          className="py-14 md:py-20 bg-[#0D0D18] border-t border-[rgba(196,160,74,0.1)]"
        >
          <div className="container-wide max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* Título de sección */}
              <div className="flex items-center gap-3 mb-10">
                <div className="h-px w-8 bg-[#C4A04A]/40" />
                <span className="font-condensed text-[0.68rem] uppercase tracking-[0.3em] text-[#C4A04A]/55">
                  Metodología y estándares
                </span>
              </div>

              {/* Chips de normas — texto plano con alt semántico */}
              <div className="flex flex-wrap gap-3 mb-10" role="list" aria-label="Marcos normativos aplicados">
                {SITE_CONSULTANT.methodologies.map((m) => (
                  <div
                    key={m.label}
                    role="listitem"
                    className="border border-[rgba(196,160,74,0.25)] bg-[rgba(196,160,74,0.04)] px-4 py-2.5"
                    title={`${m.label} — ${m.desc}`}
                  >
                    <span className="font-condensed text-[0.72rem] font-medium text-[#C4A04A]/80 tracking-[0.12em]">
                      {m.label}
                    </span>
                    <span className="font-condensed text-[0.68rem] text-white/35 ml-2 tracking-[0.06em]">
                      {m.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bloque de autoría — señal de autoría para Google */}
              <div className="border border-[rgba(196,160,74,0.15)] bg-[rgba(196,160,74,0.02)] p-6 md:p-8">
                <p className="font-condensed text-[0.65rem] uppercase tracking-[0.35em] text-[#C4A04A]/40 mb-5">
                  Metodología avalada por
                </p>
                <div className="flex items-start gap-5">
                  {/* Avatar placeholder */}
                  <div
                    className="shrink-0 w-11 h-11 rounded-full border border-[rgba(196,160,74,0.3)] flex items-center justify-center bg-[rgba(196,160,74,0.06)]"
                    aria-hidden="true"
                  >
                    <span className="font-serif text-[#C4A04A]/60 text-lg">S</span>
                  </div>

                  <div className="min-w-0">
                    {/* Nombre del consultor — actualizar en src/lib/seo.ts → SITE_CONSULTANT.name */}
                    <p className="font-condensed font-medium text-[0.92rem] text-white/85 mb-1">
                      {SITE_CONSULTANT.name}
                    </p>
                    <p
                      className="font-condensed text-[0.82rem] leading-relaxed mb-3"
                      style={{ color: "rgba(230,228,224,0.50)" }}
                    >
                      {SITE_CONSULTANT.title}
                    </p>
                    <p
                      className="font-condensed font-light text-[0.82rem] leading-[1.75] mb-4 max-w-2xl"
                      style={{ color: "rgba(230,228,224,0.45)" }}
                    >
                      {SITE_CONSULTANT.bio}
                    </p>
                    {/* Enlace externo con rel="noopener" — señal E-E-A-T de verificabilidad */}
                    <a
                      href={SITE_CONSULTANT.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-condensed text-[0.72rem] uppercase tracking-[0.18em] text-[#C4A04A]/65 hover:text-[#C4A04A] transition-colors duration-300"
                      aria-label={`Ver perfil profesional de ${SITE_CONSULTANT.name} en LinkedIn`}
                    >
                      Ver perfil profesional
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA de cierre ──────────────────────────────────── */}
        <section className="py-20 md:py-28 border-t border-[rgba(196,160,74,0.1)] bg-navy-deep">
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
                className="inline-flex items-center gap-3 font-condensed font-medium text-[0.82rem] uppercase tracking-[0.22em] text-[#C4A04A] border border-[rgba(196,160,74,0.4)] px-10 py-4 hover:bg-[rgba(196,160,74,0.08)] hover:border-[#C4A04A] hover:text-white transition-all duration-300"
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

/* ── Bloque de sub-servicio expandible ──────────────────────────────────── */
function BlockItem({
  block,
  index,
  cta,
}: {
  block: ServiceBlock;
  index: number;
  cta: string;
  total: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      {/* ── Cabecera clicable ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left group py-8 md:py-10"
        aria-expanded={open}
      >
        <div className="grid md:grid-cols-12 gap-4 md:gap-10 items-center">
          {/* Número decorativo */}
          <div className="hidden md:block md:col-span-1">
            <span
              className="font-serif font-light text-2xl text-[#C4A04A] leading-none select-none"
              style={{ opacity: open ? 0.45 : 0.2 }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Título */}
          <div className="md:col-span-10">
            <div className="flex items-start gap-3">
              {/* Número en móvil */}
              <span
                className="md:hidden font-serif font-light text-xl text-[#C4A04A] leading-none select-none shrink-0 mt-1"
                style={{ opacity: open ? 0.45 : 0.2 }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2
                className={`font-serif font-light text-xl md:text-[1.65rem] leading-snug transition-colors duration-300
                  ${open
                    ? "text-[#C4A04A]/85"
                    : "text-white group-hover:text-[#C4A04A]/75"
                  }`}
              >
                {block.h2}
              </h2>
            </div>
          </div>

          {/* Chevron */}
          <div className="hidden md:flex md:col-span-1 justify-center">
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className={`inline-flex transition-colors duration-300 ${open ? "text-[#C4A04A]" : "text-white/20 group-hover:text-[#C4A04A]/50"}`}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </div>
        </div>
      </button>

      {/* ── Panel expandible ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-12 gap-6 md:gap-10 pb-10">
              {/* Espaciador (columna del número) */}
              <div className="hidden md:block md:col-span-1" />

              {/* Descripción + CTA — ocupa el espacio completo */}
              <div className="md:col-span-11">
                <p
                  className="font-condensed font-light text-[1rem] leading-[1.85] mb-7"
                  style={{ color: "rgba(230, 228, 224, 0.72)" }}
                >
                  {block.p}
                </p>
                <a
                  href="/#contact"
                  className="inline-flex items-center gap-2 font-condensed text-[0.72rem] uppercase tracking-[0.2em]
                             text-[#C4A04A] border border-[rgba(196,160,74,0.4)] px-6 py-2.5
                             hover:bg-[rgba(196,160,74,0.1)] hover:border-[#C4A04A] transition-all duration-300"
                >
                  {cta}
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
