import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, CalendarCheck, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Nombre requerido").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  organization: z.string().trim().min(2, "Organización requerida").max(150),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Describa brevemente el contexto").max(1000),
});

const CALENDLY_URL = "https://calendly.com/stratec-consultoria";

const Schedule = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Revise los campos", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Solicitud recibida", description: "Nuestro equipo se pondrá en contacto en menos de 24h hábiles." });
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="eyebrow mb-6">— Conversación ejecutiva</div>
            <h1 className="font-display text-4xl md:text-6xl font-light text-navy leading-[1.05] text-balance">
              Agende un <span className="text-olive">diagnóstico estratégico</span> confidencial.
            </h1>
            <p className="mt-8 text-lg text-steel max-w-2xl font-light leading-relaxed">
              Una sesión privada de 45 minutos con un consultor senior de STRATEC. Evaluamos
              el contexto institucional de su organización y proponemos un marco de actuación
              alineado a sus objetivos estratégicos.
            </p>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-steel">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-olive" /> Acuerdo de confidencialidad institucional</div>
              <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-olive" /> Información cifrada extremo a extremo</div>
              <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-olive" /> Disponibilidad LATAM</div>
            </div>
          </motion.div>

          <div className="mt-20 grid lg:grid-cols-12 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7"
            >
              <div className="border border-border bg-card shadow-[var(--shadow-card)]">
                <div className="border-b border-border px-8 py-6">
                  <div className="text-xs uppercase tracking-[0.3em] text-olive">01 — Calendario</div>
                  <div className="mt-2 font-display text-2xl text-navy">Seleccione un horario</div>
                </div>
                <div
                  className="calendly-inline-widget"
                  data-url={`${CALENDLY_URL}?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=7b7f42`}
                  style={{ minWidth: "320px", height: "720px" }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="border border-border bg-card shadow-[var(--shadow-card)] p-8">
                <div className="text-xs uppercase tracking-[0.3em] text-olive">02 — Contexto institucional</div>
                <div className="mt-2 font-display text-2xl text-navy mb-8">Cuéntenos sobre su organización</div>
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-wider text-steel">Nombre completo</Label>
                    <Input id="name" name="name" required maxLength={100} className="rounded-none border-border h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-steel">Correo institucional</Label>
                    <Input id="email" name="email" type="email" required maxLength={255} className="rounded-none border-border h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organization" className="text-xs uppercase tracking-wider text-steel">Organización</Label>
                      <Input id="organization" name="organization" required maxLength={150} className="rounded-none border-border h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-xs uppercase tracking-wider text-steel">Cargo</Label>
                      <Input id="role" name="role" maxLength={120} className="rounded-none border-border h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs uppercase tracking-wider text-steel">Contexto del requerimiento</Label>
                    <Textarea id="message" name="message" required maxLength={1000} rows={5} className="rounded-none border-border resize-none" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke tracking-wider text-xs uppercase h-12 group">
                    {loading ? "Enviando..." : "Enviar solicitud confidencial"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <p className="text-[11px] text-steel/70 leading-relaxed">
                    Al enviar acepta nuestro <a href="/privacy" className="text-navy underline underline-offset-2">Aviso de Privacidad</a> y los
                    términos de <a href="/confidentiality" className="text-navy underline underline-offset-2">Confidencialidad Institucional</a>.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Schedule;
