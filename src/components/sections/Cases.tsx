import { motion } from "framer-motion";

const cases = [
  {
    sector: "Educación",
    title: "Campus universitario multisede",
    desc: "Diseño e implementación de un modelo integral de seguridad para una red de campus con más de 40,000 alumnos.",
    metric: "−62% incidentes",
  },
  {
    sector: "Corporativo",
    title: "Corporativo multinacional",
    desc: "Marco unificado de continuidad operativa y protección de ejecutivos en cinco regiones geográficas.",
    metric: "5 regiones",
  },
  {
    sector: "Inmobiliario",
    title: "Desarrollo inmobiliario premium",
    desc: "Arquitectura tecnológica y operativa de seguridad para un desarrollo de uso mixto de alto valor patrimonial.",
    metric: "180,000 m²",
  },
  {
    sector: "Industria",
    title: "Planta industrial estratégica",
    desc: "Inteligencia preventiva y monitoreo continuo sobre operaciones críticas 24/7.",
    metric: "99.98% uptime",
  },
  {
    sector: "Infraestructura",
    title: "Infraestructura crítica nacional",
    desc: "Programa de protección integral con coordinación interinstitucional y gobierno de datos sensibles.",
    metric: "8 instituciones",
  },
];

export const Cases = () => {
  return (
    <section id="cases" className="py-32 bg-background">
      <div className="container-wide">
        <div className="grid lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-6">
            <div className="eyebrow mb-6">— Casos de aplicación</div>
            <h2 className="font-display text-4xl md:text-5xl font-light text-navy leading-tight text-balance">
              Resultados que sostienen instituciones complejas.
            </h2>
          </div>
        </div>

        <div className="space-y-px bg-border">
          {cases.map((c, i) => (
            <motion.article
              key={c.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="grid md:grid-cols-12 gap-6 bg-background p-8 lg:p-10 group hover:bg-navy transition-colors duration-500 cursor-pointer"
            >
              <div className="md:col-span-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-olive font-mono-ibm">{c.sector}</div>
                <div className="mt-2 font-mono-ibm text-xs text-steel group-hover:text-smoke/50 transition-colors">
                  Caso · {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              <div className="md:col-span-7">
                <h3 className="text-2xl font-light text-navy group-hover:text-smoke transition-colors">{c.title}</h3>
                <p className="mt-3 text-steel group-hover:text-smoke/70 transition-colors leading-relaxed font-light">{c.desc}</p>
              </div>
              <div className="md:col-span-3 md:text-right flex md:justify-end items-start">
                <div className="text-3xl font-light text-navy group-hover:text-olive transition-colors">{c.metric}</div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
