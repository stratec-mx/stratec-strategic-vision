import { motion } from "framer-motion";
import { Shield, Users, Cpu } from "lucide-react";

const supports = [
  {
    icon: Shield,
    label: "Miembro activo de foros de seguridad institucional",
  },
  {
    icon: Users,
    label: "Colaborador con organismos de prevención en Morelos",
  },
  {
    icon: Cpu,
    label: "Red de proveedores tecnológicos certificados",
  },
];

export const InstitutionalSupport = () => {
  return (
    <section className="py-20 bg-navy-deep">
      <div className="container-wide">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.4em] text-olive/70 mb-4">
            Respaldo institucional
          </div>
          <p className="text-sm text-smoke/30 max-w-md mx-auto font-light">
            Operamos con soporte de redes institucionales, organismos de prevención y proveedores tecnológicos de primer nivel.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {supports.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col items-center gap-4 py-8 px-6 border border-smoke/5 hover:border-olive/20 transition-colors duration-500"
            >
              <item.icon
                className="h-7 w-7 text-smoke/20 group-hover:text-olive transition-colors"
                strokeWidth={1}
              />
              <p className="text-xs text-smoke/40 text-center tracking-wide leading-relaxed">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
