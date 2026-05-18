import { motion } from "framer-motion";

const milestones = [
  { year: "2004", text: "Fundación de la firma con foco en análisis de riesgo institucional." },
  { year: "2011", text: "Integración de tecnología de inteligencia operacional." },
  { year: "2018", text: "Expansión a sectores gubernamentales y de infraestructura crítica." },
  { year: "2024", text: "Plataforma de inteligencia preventiva unificada." },
];

export const About = () => {
  return (
    <section id="about" className="py-32 bg-smoke">
      <div className="container-wide grid lg:grid-cols-12 gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5"
        >
          <div className="eyebrow mb-6">— Sobre STRATEC</div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-navy leading-tight text-balance">
            Una firma construida sobre la disciplina del análisis y la precisión institucional.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="lg:col-span-7 lg:pt-4"
        >
          <p className="text-lg text-steel font-light leading-relaxed">
            STRATEC integra inteligencia estratégica, gestión de riesgos y tecnología
            institucional para acompañar a organizaciones complejas en la toma de decisiones
            críticas. Operamos con confidencialidad absoluta, rigor analítico y una visión
            de largo plazo orientada a la continuidad operativa de nuestros clientes.
          </p>

          <div className="mt-16 grid grid-cols-2 gap-y-10 gap-x-8 border-t border-border pt-12">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-l border-olive pl-4"
              >
                <div className="text-xs font-mono-ibm tracking-widest text-olive">{m.year}</div>
                <p className="text-sm text-foreground mt-2 leading-relaxed">{m.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
