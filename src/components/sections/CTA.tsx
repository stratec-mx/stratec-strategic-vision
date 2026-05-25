import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

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
          <motion.div
            className="text-xs uppercase tracking-[0.4em] text-olive mb-8"
            whileHover={{ letterSpacing: "0.5em", color: "#9CA956" }}
            transition={{ duration: 0.3 }}
          >
            — Construyamos juntos
          </motion.div>
          <motion.h2
            className="font-display text-4xl md:text-6xl lg:text-7xl font-light leading-[1.1] text-balance"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Construimos entornos más seguros mediante
            <motion.span
              className="text-olive block"
              whileHover={{ letterSpacing: "0.02em", scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              inteligencia estratégica.
            </motion.span>
          </motion.h2>
          <motion.p
            className="mt-10 text-lg text-smoke/60 max-w-2xl font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            whileHover={{ color: "#F7F7F5" }}
          >
            Iniciemos con un diagnóstico estratégico confidencial. Nuestro equipo
            evalúa el contexto de su organización y propone un marco de actuación
            adaptado a sus objetivos institucionales.
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" className="rounded-none bg-olive hover:bg-olive/90 text-smoke tracking-wider text-xs uppercase h-14 px-8 group hover:shadow-lg hover:shadow-olive/30 transition-all duration-300">
                <a
                  href="mailto:contacto@stratecsecurity.com"
                  onClick={() => {
                    if (typeof (window as any).gtag !== "undefined") (window as any).gtag("event", "click_email", { event_category: "contact", event_label: "email_cta" });
                  }}
                  className="flex items-center"
                >
                  <motion.div whileHover={{ rotate: 20, scale: 1.2 }} transition={{ duration: 0.2 }}>
                    <Mail className="mr-2 h-4 w-4" />
                  </motion.div>
                  contacto@stratecsecurity.com
                </a>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild variant="outline" size="lg" className="rounded-none border-smoke/20 bg-transparent text-smoke hover:bg-smoke/10 hover:text-smoke hover:border-smoke/40 tracking-wider text-xs uppercase h-14 px-8 hover:shadow-lg hover:shadow-smoke/10 transition-all duration-300 group">
                <motion.a href="#contact-form" whileHover={{ letterSpacing: "0.05em" }}>
                  Completar formulario
                  <motion.span
                    className="inline-block ml-2"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    →
                  </motion.span>
                </motion.a>
              </Button>
            </motion.div>
          </motion.div>

          <ContactForm />
        </motion.div>
      </div>
    </section>
  );
};
