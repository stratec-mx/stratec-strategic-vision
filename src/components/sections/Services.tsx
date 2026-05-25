import { motion } from "framer-motion";
import {
  Eye, ShieldCheck, Building2, Cpu, Compass, Activity, Lock, LineChart,
} from "lucide-react";

const services = [
  { icon: Eye, title: "Inteligencia preventiva", desc: "Anticipación de riesgos mediante análisis predictivo y monitoreo institucional continuo." },
  { icon: ShieldCheck, title: "Gestión integral de riesgos", desc: "Marcos de evaluación, control y mitigación adaptados a entornos críticos." },
  { icon: Building2, title: "Consultoría en seguridad institucional", desc: "Diseño de arquitecturas de seguridad para organismos públicos y corporativos." },
  { icon: Cpu, title: "Integración tecnológica", desc: "Implementación de plataformas de monitoreo, control de acceso y analítica avanzada." },
  { icon: Compass, title: "Estrategia corporativa", desc: "Asesoría ejecutiva en decisiones de alta complejidad y posicionamiento institucional." },
  { icon: Activity, title: "Continuidad operativa", desc: "Planes de resiliencia y recuperación ante incidentes y disrupciones críticas." },
  { icon: Lock, title: "Protección de infraestructura crítica", desc: "Salvaguarda de activos físicos, digitales y humanos de alto valor estratégico." },
  { icon: LineChart, title: "Análisis y diagnóstico", desc: "Auditorías integrales con reportes ejecutivos accionables y de nivel C-suite." },
];

export const Services = () => {
  return (
    <section id="services" className="py-32 bg-background relative">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="container-wide relative">
        <div className="grid lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-6">— Servicios estratégicos</div>
            <h2 className="font-display text-4xl md:text-5xl font-light text-navy leading-tight text-balance">
              Diagnósticos profundos, implementación de soluciones y acompañamiento integral en seguridad.
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-4">
            <p className="text-steel text-lg font-light leading-relaxed">
              Cada práctica combina inteligencia, tecnología y disciplina operativa para
              entregar resultados medibles y sostenibles en el tiempo.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="group bg-background p-10 hover:bg-navy transition-colors duration-500 cursor-pointer relative overflow-hidden"
            >
              <s.icon className="h-7 w-7 text-olive transition-transform duration-500 group-hover:scale-110" strokeWidth={1.25} />
              <h3 className="mt-8 text-lg font-medium text-navy group-hover:text-smoke transition-colors duration-500">
                {s.title}
              </h3>
              <p className="mt-3 text-sm text-steel group-hover:text-smoke/70 leading-relaxed transition-colors duration-500">
                {s.desc}
              </p>
              <div className="mt-8 text-xs uppercase tracking-widest text-olive opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                Conocer más →
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
