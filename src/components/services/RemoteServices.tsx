import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { REMOTE_GROUPS, remoteServices } from "@/data/remoteServices";

/** Servicios a distancia agrupados en Cumplir · Prevenir · Responder. */
export const RemoteServices = ({ intro }: { intro?: string }) => (
  <section className="py-20 md:py-24">
    <div className="mb-12 max-w-3xl">
      <div className="text-xs uppercase tracking-[0.3em] text-olive mb-4">Servicios a distancia</div>
      <h2 className="font-display font-light text-3xl md:text-4xl text-smoke leading-tight">
        Anticiparse es la mejor forma de proteger.
      </h2>
      <p className="mt-5 text-smoke/65 font-light leading-relaxed">
        {intro ?? "Atendemos a organizaciones de todo el país por videollamada, con entregables digitales y seguimiento puntual."}
      </p>
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      {REMOTE_GROUPS.map((g, gi) => (
        <motion.div
          key={g.need}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: gi * 0.08 }}
          className="border border-olive/25 bg-navy/40 p-7 flex flex-col"
        >
          <div className="font-display text-2xl font-light text-olive">{g.need}</div>
          <p className="text-sm text-smoke/55 font-light mt-1 mb-6">{g.text}</p>
          <ul className="space-y-5 flex-1">
            {remoteServices(g).map((s) => (
              <li key={s.slug}>
                <Link to={s.href} className="group block">
                  <span className="flex items-center gap-2 text-smoke group-hover:text-olive transition-colors">
                    {s.titulo}
                    <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <span className="block text-sm text-smoke/55 font-light mt-1 leading-relaxed">{s.descripcionCorta}</span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  </section>
);
