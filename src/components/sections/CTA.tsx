import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTA = () => {
  return (
    <section id="contact" className="py-32 bg-navy-deep text-smoke relative overflow-hidden">
      <div className="absolute inset-0 grid-bg-light opacity-30" />
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-olive/10 blur-3xl" />
      <div className="container-wide relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="text-xs uppercase tracking-[0.4em] text-olive mb-8">— Construyamos juntos</div>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-light leading-[1.1] text-balance">
            Construimos entornos más seguros mediante
            <span className="text-olive"> inteligencia estratégica.</span>
          </h2>
          <p className="mt-10 text-lg text-smoke/60 max-w-2xl font-light leading-relaxed">
            Iniciemos con un diagnóstico estratégico confidencial. Nuestro equipo
            evalúa el contexto de su organización y propone un marco de actuación
            adaptado a sus objetivos institucionales.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="rounded-none bg-olive hover:bg-olive/90 text-smoke tracking-wider text-xs uppercase h-14 px-8 group">
              <a href="mailto:contacto@stratec.mx">
                Solicitar diagnóstico estratégico
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-none border-smoke/20 bg-transparent text-smoke hover:bg-smoke/10 hover:text-smoke tracking-wider text-xs uppercase h-14 px-8">
              <a href="/schedule">Agendar conversación</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
