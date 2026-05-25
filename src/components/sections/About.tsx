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
            Acompañamos organizaciones complejas en decisiones críticas y situaciones de máximo riesgo.
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

          {/* Video institucional placeholder */}
          <div className="mt-12">
            <div
              style={{
                aspectRatio: "16/9",
                background: "linear-gradient(135deg, #0B1F3A, #111D33)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(123,127,66,0.2)",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "rgba(123,127,66,0.85)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#F7F7F5">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
              </div>
            </div>
            <p className="text-center text-[11px] text-steel/50 mt-3 tracking-[0.15em] uppercase">
              Video institucional — Próximamente
            </p>
          </div>

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
