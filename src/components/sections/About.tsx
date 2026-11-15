import { useState } from "react";
import { motion } from "framer-motion";
import { track } from "@/lib/analytics";

export const About = () => {
  const [playing, setPlaying] = useState(false);
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

          {/* Video institucional: se descarga hasta que el visitante pulsa reproducir */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative overflow-hidden border border-olive/20 bg-navy-deep" style={{ aspectRatio: "16 / 9" }}>
              {playing ? (
                <video
                  className="absolute inset-0 h-full w-full"
                  poster="/videos/institucional-poster.jpg"
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  aria-label="Video institucional de STRATEC Security"
                >
                  <source src="/videos/institucional.webm" type="video/webm" />
                  <source src="/videos/institucional.mp4" type="video/mp4" />
                </video>
              ) : (
                <button
                  type="button"
                  onClick={() => { setPlaying(true); track.ctaClick("video_institucional"); }}
                  aria-label="Reproducir el video institucional de STRATEC (39 segundos, con sonido)"
                  className="group absolute inset-0 h-full w-full"
                >
                  <img
                    src="/videos/institucional-poster.jpg"
                    alt="Plano de un negocio con rutas de evacuación, extintores y punto de reunión"
                    width={1280}
                    height={720}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-navy-deep/25 transition-colors group-hover:bg-navy-deep/10" aria-hidden />
                  <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#C4A04A] shadow-lg transition-transform group-hover:scale-110" aria-hidden>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#0B1F3A"><polygon points="8,5 19,12 8,19" /></svg>
                  </span>
                </button>
              )}
            </div>
            <p className="text-center text-[11px] text-steel/70 mt-3 tracking-[0.15em] uppercase">
              Video institucional · 39 segundos
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
