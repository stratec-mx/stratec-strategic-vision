import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const schema = z.object({
  nombre: z.string().min(2, "Ingresa tu nombre completo"),
  empresa: z.string().min(2, "Ingresa el nombre de tu organización"),
  cargo: z.string().optional(),
  email: z.string().email("Ingresa un correo corporativo válido"),
  telefono: z.string().optional(),
  servicio: z.string().min(1, "Selecciona un servicio de interés"),
  mensaje: z.string().max(500, "Máximo 500 caracteres").optional(),
  privacidad: z.literal(true, { errorMap: () => ({ message: "Debes aceptar el aviso de privacidad" }) }),
});

type FormData = z.infer<typeof schema>;

// EmailJS — reemplazar TEMPLATE_ID después de crear el template en emailjs.com
const EMAILJS_SERVICE_ID  = "service_3wysprf";
const EMAILJS_TEMPLATE_ID = "template_stratec01"; // ← actualizar con tu template real
const EMAILJS_PUBLIC_KEY  = "QrsTojpa7iz8FVM-n";

declare function gtag(...args: unknown[]): void;
declare function fbq(...args: unknown[]): void;

export const ContactForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedService = watch("servicio");

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name: data.nombre,
            from_email: data.email,
            empresa:   data.empresa,
            cargo:     data.cargo    || "—",
            telefono:  data.telefono || "—",
            servicio:  data.servicio,
            mensaje:   data.mensaje  || "—",
          },
        }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setSubmitted(true);
      if (typeof gtag !== "undefined") {
        gtag("event", "form_submit", { event_category: "lead", event_label: selectedService });
      }
      if (typeof fbq !== "undefined") {
        fbq("track", "Lead", { content_name: selectedService });
      }
    } catch {
      setError("Hubo un problema al enviar tu solicitud. Intenta de nuevo o escríbenos a contacto@stratecsecurity.com");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center" id="contact-form">
        <CheckCircle className="h-12 w-12 text-olive" strokeWidth={1.25} />
        <p className="text-xl font-light text-smoke">
          Recibimos tu solicitud.
        </p>
        <p className="text-smoke/60 max-w-md">
          Un consultor de STRATEC te contactará en menos de 24 horas.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-[#0C0D14] border border-[#1A1D30] text-smoke placeholder:text-smoke/30 px-4 py-3 text-sm focus:outline-none focus:border-[#C4A04A] transition-colors";
  const labelClass =
    "block text-[10px] uppercase tracking-[0.15em] text-smoke/50 mb-2";
  const errorClass = "mt-1 text-[11px] text-red-400";

  return (
    <form id="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-16 border border-smoke/10 bg-[#111320] p-8 lg:p-10">
      <div className="text-xs uppercase tracking-[0.25em] text-olive mb-8">— Formulario de contacto directo</div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Nombre completo *</label>
          <input {...register("nombre")} placeholder="Lic. Juan García" className={inputClass} />
          {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Empresa u organización *</label>
          <input {...register("empresa")} placeholder="Nombre de tu institución" className={inputClass} />
          {errors.empresa && <p className={errorClass}>{errors.empresa.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Correo electrónico corporativo *</label>
          <input {...register("email")} type="email" placeholder="nombre@empresa.com" className={inputClass} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input {...register("telefono")} type="tel" placeholder="+52 55 0000 0000" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Cargo</label>
          <input {...register("cargo")} placeholder="Director de Seguridad" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Servicio de interés *</label>
          <select {...register("servicio")} className={`${inputClass} appearance-none cursor-pointer`} defaultValue="">
            <option value="" disabled>Seleccionar...</option>
            <option value="Auditoría de seguridad">Auditoría de seguridad</option>
            <option value="Análisis de riesgos">Análisis de riesgos</option>
            <option value="Diseño de protocolos">Diseño de protocolos</option>
            <option value="Tecnología e integración">Tecnología e integración</option>
            <option value="Capacitación">Capacitación</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.servicio && <p className={errorClass}>{errors.servicio.message}</p>}
        </div>
      </div>

      <div className="mt-6">
        <label className={labelClass}>Mensaje breve</label>
        <textarea
          {...register("mensaje")}
          rows={3}
          placeholder="Describe brevemente tu necesidad o contexto organizacional..."
          className={`${inputClass} resize-none`}
          maxLength={500}
        />
        {errors.mensaje && <p className={errorClass}>{errors.mensaje.message}</p>}
      </div>

      <div className="mt-6 flex items-start gap-3">
        <input
          {...register("privacidad")}
          type="checkbox"
          id="privacidad"
          className="mt-0.5 h-4 w-4 accent-[#C4A04A] cursor-pointer"
        />
        <label htmlFor="privacidad" className="text-xs text-smoke/50 leading-relaxed cursor-pointer">
          Acepto el{" "}
          <a href="/privacidad" className="text-olive underline underline-offset-2 hover:text-smoke transition-colors">
            aviso de privacidad
          </a>{" "}
          y consiento el tratamiento de mis datos personales. *
        </label>
      </div>
      {errors.privacidad && <p className={`${errorClass} mt-1`}>{errors.privacidad.message}</p>}

      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3">{error}</p>
      )}

      <div className="mt-8">
        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="rounded-none bg-[#C4A04A] hover:bg-[#C4A04A]/90 text-[#060608] tracking-wider text-xs uppercase h-14 px-8 group font-semibold disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Enviar solicitud"}
          {!submitting && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </Button>
      </div>

      <p className="mt-6 text-[11px] text-smoke/30 leading-relaxed">
        Al enviar este formulario, aceptas nuestro aviso de privacidad. Tus datos serán tratados de forma confidencial y no serán compartidos con terceros sin tu consentimiento.
      </p>
    </form>
  );
};
