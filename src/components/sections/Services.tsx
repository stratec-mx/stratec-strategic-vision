import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const formats = [
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
    ]
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
    ]
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
    ]
  },
];

export const Services = () => {
  return (
    <section id="services" className="py-32 bg-navy-deep relative">
      <div className="absolute inset-0 grid-bg-light opacity-30 pointer-events-none" />
      <div className="container-wide relative">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="eyebrow mb-6">— Formatos de intervención</div>
              <h2 className="font-display text-5xl md:text-6xl font-light text-smoke leading-tight text-balance">
                Tres enfoques adaptados a tu etapa institucional
              </h2>
            </motion.div>
          </div>
          <div className="lg:col-span-5 lg:pt-4">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-smoke/70 text-lg font-light leading-relaxed mb-6"
            >
              No publicamos tarifas. Cada propuesta se construye sobre el alcance específico, el perfil de riesgo institucional y la profundidad de la intervención requerida.
            </motion.p>
          </div>
        </div>

        {/* Formats Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {formats.map((format, idx) => (
            <motion.div
              key={format.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group border border-olive/30 bg-navy/60 hover:bg-navy/80 transition-all duration-300"
            >
              <div className="p-8 flex flex-col h-full">
                {/* Title and Subtitle */}
                <div className="mb-6">
                  <h3 className="text-2xl font-light text-smoke mb-2">
                    {format.title}
                  </h3>
                  <p className="text-sm uppercase tracking-widest text-olive">
                    {format.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-smoke/70 font-light leading-relaxed mb-6">
                  {format.description}
                </p>

                {/* Recommended */}
                <div className="bg-olive/10 border border-olive/20 p-4 mb-6 rounded">
                  <p className="text-xs text-olive/90 font-light">
                    <span className="font-semibold">Recomendado:</span> {format.recommended}
                  </p>
                </div>

                {/* Deliverables */}
                <div className="mb-8 flex-grow">
                  <div className="text-xs uppercase tracking-widest text-smoke/50 mb-4">
                    Entregables clave
                  </div>
                  <ul className="space-y-2">
                    {format.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-smoke/70">
                        <CheckCircle2 size={16} className="text-olive mt-0.5 shrink-0" />
                        <span className="font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <motion.a
                  href="#contact"
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-olive hover:text-smoke transition-colors group-hover:translate-x-1 transition-transform"
                  whileHover={{ x: 4 }}
                >
                  Solicitar propuesta dirigida
                  <ArrowRight size={16} />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 border border-olive/20 bg-navy/40 p-8 md:p-10"
        >
          <h3 className="text-xl font-light text-smoke mb-4">
            Metodología transversal en todos los formatos
          </h3>
          <p className="text-smoke/70 font-light leading-relaxed">
            Independientemente del formato elegido, cada intervención se sustenta en análisis de inteligencia, diagnóstico profundo de vulnerabilidades, cumplimiento normativo mexicano e internacional, y diseño de arquitecturas de seguridad ajustadas al contexto específico de cada institución. Entregables auditables, reportes ejecutivos de nivel C-suite, y transferencia de capacidades son estándares en todas nuestras intervenciones.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
