import { motion } from "framer-motion";
import { Landmark, Factory, Briefcase, HardHat, GraduationCap, Network, Zap, Truck } from "lucide-react";

const sectors = [
  { icon: Landmark, name: "Gobierno" },
  { icon: Factory, name: "Industria" },
  { icon: Briefcase, name: "Corporativos" },
  { icon: HardHat, name: "Construcción" },
  { icon: GraduationCap, name: "Educación" },
  { icon: Network, name: "Infraestructura" },
  { icon: Zap, name: "Energía" },
  { icon: Truck, name: "Logística" },
];

export const Sectors = () => {
  return (
    <section id="sectors" className="py-32 bg-gradient-fade">
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="eyebrow mb-6">— Soluciones especializadas</div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-navy leading-tight text-balance">
            Cada sector requiere enfoques diferenciados. Protegemos gobiernos, industrias, corporativos e instituciones educativas.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border max-w-5xl mx-auto">
          {sectors.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-smoke aspect-square flex flex-col items-center justify-center gap-4 group hover:bg-navy hover:shadow-lg hover:shadow-navy/20 transition-all duration-500 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                whileHover={{ rotate: 12, scale: 1.3 }}
                transition={{ duration: 0.3 }}
                className="h-8 w-8"
              >
                <s.icon className="h-full w-full text-steel group-hover:text-olive transition-colors duration-500" strokeWidth={1.2} />
              </motion.div>
              <motion.span
                className="text-sm tracking-widest uppercase text-navy group-hover:text-smoke transition-colors duration-500"
                whileHover={{ letterSpacing: "0.1em" }}
              >
                {s.name}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
