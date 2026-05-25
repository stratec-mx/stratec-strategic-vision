import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Diagnóstico", desc: "Evaluación integral de contexto, vulnerabilidades y activos críticos." },
  { n: "02", title: "Análisis", desc: "Modelado de riesgos, escenarios y matrices de impacto estratégico." },
  { n: "03", title: "Estrategia", desc: "Diseño de marcos de actuación, políticas y arquitecturas de seguridad." },
  { n: "04", title: "Integración", desc: "Coordinación operativa, tecnológica y humana sobre el ecosistema." },
  { n: "05", title: "Implementación", desc: "Despliegue controlado con métricas, gobierno y aseguramiento." },
  { n: "06", title: "Seguimiento", desc: "Inteligencia continua, auditoría y optimización permanente." },
];

export const Methodology = () => {
  return (
    <section id="methodology" className="py-32 bg-navy-deep text-smoke relative overflow-hidden">
      <div className="absolute inset-0 grid-bg-light opacity-30 pointer-events-none" />
      <div className="container-wide relative">
        <div className="grid lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-6">
            <div className="text-xs uppercase tracking-[0.25em] text-olive font-medium mb-6">— Metodología STRATEC</div>
            <h2 className="font-display text-4xl md:text-5xl font-light leading-tight text-balance">
              Metodología STRATEC de diagnóstico y protección integral.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
            <p className="text-smoke/60 text-lg font-light leading-relaxed">
              Cada engagement sigue un protocolo de seis fases que garantiza
              consistencia analítica y trazabilidad ejecutiva.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-smoke/15" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-6 lg:p-4 group hover:bg-navy/50 transition-colors duration-300 cursor-pointer"
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="hidden lg:block absolute top-12 left-0 -translate-x-1/2 w-2 h-2 rounded-full bg-olive ring-4 ring-navy-deep group-hover:ring-olive/30"
                  whileHover={{ scale: 1.3 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.div
                  className="font-mono-ibm text-xs text-olive tracking-widest"
                  whileHover={{ scale: 1.1, letterSpacing: "0.1em" }}
                  transition={{ duration: 0.2 }}
                >
                  {s.n}
                </motion.div>
                <motion.h3
                  className="mt-8 lg:mt-10 text-base font-medium text-smoke group-hover:text-olive transition-colors duration-300"
                  whileHover={{ letterSpacing: "0.02em" }}
                >
                  {s.title}
                </motion.h3>
                <motion.p
                  className="mt-3 text-xs text-smoke/55 group-hover:text-smoke/80 leading-relaxed transition-colors duration-300"
                  initial={{ opacity: 0.55 }}
                  whileHover={{ opacity: 0.9 }}
                >
                  {s.desc}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
