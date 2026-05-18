import { motion } from "framer-motion";
import { Lock, Crosshair, Zap, Network, Layers, Globe2 } from "lucide-react";

const items = [
  { icon: Lock, title: "Confidencialidad", desc: "Protocolos estrictos de manejo de información sensible y cumplimiento institucional." },
  { icon: Crosshair, title: "Precisión analítica", desc: "Metodologías validadas, métricas claras y entregables ejecutivos accionables." },
  { icon: Zap, title: "Respuesta estratégica", desc: "Capacidad operativa para escalar y desplegar soluciones en tiempo crítico." },
  { icon: Network, title: "Integración tecnológica", desc: "Compatibilidad con ecosistemas existentes y plataformas de control unificadas." },
  { icon: Layers, title: "Escalabilidad", desc: "Arquitecturas modulares diseñadas para crecer con la organización." },
  { icon: Globe2, title: "Cobertura institucional", desc: "Presencia y coordinación sobre múltiples sectores y geografías." },
];

export const Advantages = () => {
  return (
    <section className="py-32 bg-gradient-fade">
      <div className="container-wide">
        <div className="max-w-2xl mb-20">
          <div className="eyebrow mb-6">— Ventajas competitivas</div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-navy leading-tight text-balance">
            Lo que distingue a una firma de inteligencia estratégica.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="bg-smoke border border-border p-8 hover-lift"
            >
              <div className="flex items-center justify-between mb-8">
                <it.icon className="h-6 w-6 text-olive" strokeWidth={1.25} />
                <span className="font-mono-ibm text-[10px] text-steel tracking-widest">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-medium text-navy">{it.title}</h3>
              <p className="mt-3 text-sm text-steel leading-relaxed">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
