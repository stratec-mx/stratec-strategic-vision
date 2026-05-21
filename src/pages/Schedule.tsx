import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, CalendarCheck, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Nombre requerido").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  organization: z.string().trim().min(2, "Organización requerida").max(150),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Describa brevemente el contexto").max(1000),
});

// URL pública del Google Workspace Appointment Schedule de STRATEC.
// IMPORTANTE (backend/email service):
// Todas las notificaciones de citas y contacto deben enviarse al correo institucional:
//   → contacto@stratecsecurity.com
// Configurar en Google Calendar (Appointment Schedule) y en el servicio de correo
// transaccional (Resend / SMTP) como destinatario principal de avisos.
const GOOGLE_BOOKING_URL = "https://calendar.app.google/uaWvE7ij7Z23Fpbp8";

const Schedule = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);


  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Revise los campos", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    // Inserta el lead en Supabase. RLS pública: source='web' y owner_id null.
    // IMPORTANTE: las notificaciones por correo deben enviarse a contacto@stratecsecurity.com
    // (configurar en el backend / servicio de email transaccional con un trigger o edge function).
    const { error } = await supabase.from("leads").insert({
      full_name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization,
      role_title: parsed.data.role || null,
      notes: parsed.data.message,
      source: "web",
      status: "new",
      owner_id: null,
    });
    setLoading(false);
    if (error) {
      console.error("[Schedule.insert]", error?.code ?? "error");
      toast({
        title: "No se pudo enviar la solicitud",
        description: "Intente nuevamente en unos minutos o escriba a contacto@stratecsecurity.com.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Solicitud enviada correctamente",
      description:
        "Su solicitud fue enviada a contacto@stratecsecurity.com. Un consultor senior de STRATEC se pondrá en contacto en menos de 24 horas hábiles.",
    });
    form.reset();
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
              Una sesión privada de 30 minutos con un consultor senior de STRATEC. Evaluamos
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
                {/* Google Appointment Schedule no permite ser embebido (X-Frame-Options: DENY).
                    Se abre en una nueva pestaña para garantizar la reserva. */}
                <div className="p-10 flex flex-col items-center text-center gap-6">
                  <div className="h-14 w-14 rounded-full bg-olive/10 flex items-center justify-center">
                    <CalendarCheck className="h-7 w-7 text-olive" />
                  </div>
                  <div className="max-w-md">
                    <div className="font-display text-2xl text-navy leading-snug">
                      Reserve directamente en la agenda institucional
                    </div>
                    <p className="mt-3 text-sm text-steel leading-relaxed">
                      Sincronizado con Google Workspace de STRATEC. Recibirá la confirmación
                      y el enlace de la sesión en su correo institucional.
                    </p>
                  </div>
                  <Button asChild className="rounded-none bg-navy hover:bg-navy-deep text-smoke tracking-wider text-xs uppercase h-12 px-8 group">
                    <a href={GOOGLE_BOOKING_URL} target="_blank" rel="noopener noreferrer">
                      Abrir agenda y reservar
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                  <p className="text-[11px] text-steel/70">
                    Confirmaciones enviadas a contacto@stratecsecurity.com
                  </p>
                </div>
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
