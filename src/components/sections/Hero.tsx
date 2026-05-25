import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero-stratec.jpg";
import { NetworkBackground } from "@/components/NetworkBackground";

export const Hero = () => {
  return (
    <section className="relative flex items-center bg-navy-deep overflow-hidden pt-20" style={{ minHeight: '100dvh' }}>
      <div className="absolute inset-0">
        <img src={hero} alt="Equipo ejecutivo analizando infraestructura crítica" className="w-full h-full object-cover opacity-40" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-navy-deep/40" />
        <NetworkBackground />
        <div className="absolute inset-0 grid-bg-light opacity-50" />
      </div>

      <div className="relative container-wide grid lg:grid-cols-12 gap-12 items-center py-24">
        <div className="lg:col-span-8 text-smoke">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="h-px w-12 bg-olive" />
            <span className="text-xs uppercase tracking-[0.4em] text-olive font-medium">
              Inteligencia Estratégica & Seguridad Especializada
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-light leading-[1.05] text-balance"
          >
            Consultoría en Seguridad Institucional
            <span className="block font-normal text-smoke"> e Inteligencia Estratégica.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="mt-8 text-lg md:text-xl text-smoke/70 max-w-2xl font-light leading-relaxed"
          >
            Asesoramos a gobiernos, corporativos e instituciones en la anticipación,
            prevención y gestión integral de riesgos mediante análisis estratégico
            y tecnología institucional.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row gap-4"
          >
            <Button asChild size="lg" className="rounded-none bg-smoke text-navy hover:bg-smoke/90 tracking-wider text-xs uppercase h-14 px-8 group">
              <a href="#contact">
                Solicitar diagnóstico estratégico
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-none border-smoke/30 bg-transparent text-smoke hover:bg-smoke/10 hover:text-smoke tracking-wider text-xs uppercase h-14 px-8">
              <a href="#services">Conocer capacidades</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-2xl border-t border-smoke/10 pt-8"
          >
            {[
              { v: "12+", l: "Años de experiencia en seguridad" },
              { v: "50+", l: "Proyectos ejecutados" },
              { v: "100%", l: "Confidencialidad garantizada" },
            ].map((m) => (
              <div key={m.l}>
                <div className="text-3xl font-light text-smoke">{m.v}</div>
                <div className="text-xs uppercase tracking-widest text-smoke/50 mt-2">{m.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-smoke/40"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <div className="h-12 w-px bg-smoke/30" />
      </motion.div>
    </section>
  );
};
