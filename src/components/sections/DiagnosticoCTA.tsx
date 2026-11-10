import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, FileDown, CheckCircle2 } from "lucide-react";
import { track } from "@/lib/analytics";

const POINTS = ["10 preguntas, unos 3 minutos", "Tu nivel de vulnerabilidad y las áreas a atender", "Plan de acción y servicios recomendados"];

/** Bloque central de la página de inicio que lleva al diagnóstico gratuito en PDF. */
export const DiagnosticoCTA = () => (
  <section id="diagnostico" className="py-20 md:py-24 bg-background">
    <div className="container-wide">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-4xl mx-auto bg-navy-deep text-smoke border border-[#C4A04A]/60 overflow-hidden"
      >
        <div className="absolute inset-0 grid-bg-light opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#C4A04A]" />
        <div className="relative px-6 py-12 md:px-14 md:py-16 text-center">
          <div className="inline-flex flex-wrap justify-center gap-2 mb-6">
            {["Básico", "Gratis", "PDF descargable"].map((t) => (
              <span key={t} className="text-[10px] uppercase tracking-[0.25em] px-3 py-1 border border-[#C4A04A]/50 text-[#C4A04A]">
                {t}
              </span>
            ))}
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-light leading-tight text-balance uppercase tracking-wide">
            Genera y descarga tu diagnóstico PDF <span className="text-[#C4A04A]">gratuito</span>
          </h2>
          <p className="mt-6 text-smoke/75 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Un diagnóstico básico de seguridad para tu empresa o institución, sin costo. Responde el cuestionario y
            obtén un reporte en PDF con tu resultado.
          </p>
          <ul className="mt-8 grid sm:grid-cols-3 gap-3 text-left max-w-3xl mx-auto">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-2 items-start text-sm text-smoke/85">
                <CheckCircle2 className="h-4 w-4 text-[#C4A04A] mt-0.5 shrink-0" /> {p}
              </li>
            ))}
          </ul>
          <Link
            to="/diagnostico"
            onClick={() => track.ctaClick("home_diagnostico_pdf")}
            className="mt-10 inline-flex items-center justify-center gap-3 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold uppercase tracking-wider text-sm px-8 h-14 w-full sm:w-auto transition-colors"
          >
            <FileDown className="h-5 w-5" /> Generar mi diagnóstico gratis <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-smoke/50">
            Para ver y descargar tu PDF te pediremos un correo y un teléfono de contacto.
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);
