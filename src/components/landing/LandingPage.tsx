// Plantilla de las landings de captación. Todo el texto viene de
// src/data/landings.ts; esta página solo lo acomoda. Orden: problema, solución,
// beneficios, cómo funciona, formulario corto, preguntas y cierre. Sin menú.
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, FileCheck2, Loader2, MessageCircle, PhoneCall, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { type LandingData, type LandingIcon, waLink } from "@/data/landings";
import { track } from "@/lib/analytics";
import { buildLandingLead, submitLandingLead, validarLanding, type Errores, type LandingLeadForm } from "@/lib/landingLead";
import { captureUtm } from "@/lib/utm";

const ICONOS: Record<LandingIcon, LucideIcon> = {
  phone: PhoneCall,
  users: Users,
  shield: ShieldCheck,
  alert: AlertTriangle,
  file: FileCheck2,
  message: MessageCircle,
};

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const GOLD_BTN =
  "inline-flex items-center justify-center gap-2 min-h-[52px] px-6 bg-[#C4A04A] text-[#0B1F3A] font-semibold text-base hover:bg-[#d3b25e] active:bg-[#b38f3c] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C4A04A]";
const WA_BTN_DARK =
  "inline-flex items-center justify-center gap-2 min-h-[52px] px-6 border border-smoke/30 text-smoke font-medium text-base hover:bg-smoke/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]";
const WA_BTN_LIGHT =
  "inline-flex items-center justify-center gap-2 min-h-[52px] px-6 bg-[#25D366] text-[#0B1F3A] font-semibold text-base hover:bg-[#2fe174] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]";

export function LandingPage({ data }: { data: LandingData }) {
  const { search } = useLocation();
  const utm = useMemo(() => captureUtm(search), [search]);
  const [form, setForm] = useState<LandingLeadForm>({ nombre: "", empresa: "", telefono: "", honeypot: "" });
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviado, setEnviado] = useState(false);
  const graciasRef = useRef<HTMLDivElement>(null);

  const formIniciado = useRef(false);

  useEffect(() => {
    track.landingView(data.slug);
    track.metaPageView();
  }, [data.slug]);

  // lead_form_start: la primera vez que escribe en el formulario
  const iniciarFormulario = () => {
    if (formIniciado.current) return;
    formIniciado.current = true;
    track.leadFormStart(data.slug);
  };

  useEffect(() => {
    if (enviado) graciasRef.current?.focus();
  }, [enviado]);

  const clickWhatsApp = (ubicacion: string) => () => track.whatsappClick(`landing_${data.slug}_${ubicacion}`);

  const irAlFormulario = (ubicacion: string) => () => {
    track.ctaClick(`landing_${data.slug}_${ubicacion}`);
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cambiar = (campo: keyof LandingLeadForm) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    const valor = ev.target.value;
    if (campo !== "honeypot") iniciarFormulario();
    setForm((f) => ({ ...f, [campo]: valor }));
    if (errores[campo as keyof Errores]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault();
    if (enviando) return;
    const e = validarLanding(form);
    setErrores(e);
    if (Object.keys(e).length) {
      const primero = (["nombre", "empresa", "telefono"] as const).find((k) => e[k]);
      if (primero) document.getElementById(`landing-${primero}`)?.focus();
      return;
    }
    // Robot: se le muestra el agradecimiento sin registrar nada.
    if (form.honeypot) {
      setEnviado(true);
      return;
    }
    setEnviando(true);
    setErrorEnvio("");
    const ok = await submitLandingLead(buildLandingLead(data, form, utm));
    setEnviando(false);
    if (!ok) {
      setErrorEnvio("No pudimos enviar tus datos. Intenta de nuevo o escríbenos por WhatsApp.");
      return;
    }
    setEnviado(true);
    track.landingLead(data.slug, utm);
  };

  const mensajeGracias = data.whatsapp.mensajeGracias
    .replace("{nombre}", form.nombre.trim().split(/\s+/)[0] || "")
    .replace("{empresa}", form.empresa.trim());

  const inputCls = (error?: string) =>
    `w-full h-12 px-4 bg-white border text-base text-[#0B1F3A] placeholder:text-steel/60 focus:outline-none focus:ring-2 focus:ring-[#C4A04A]/40 transition-colors ${
      error ? "border-red-500 focus:border-red-500" : "border-steel/30 focus:border-[#C4A04A]"
    }`;

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#0B1F3A] font-sans">
      {/* Encabezado: solo la marca, sin menú */}
      <header className="bg-[#0B1F3A] border-b border-smoke/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Logo variant="light" size="sm" />
        </div>
      </header>

      <main id="main-content">
        {/* 1-2. Problema y solución */}
        <section className="bg-[#0B1F3A] text-smoke">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-16 sm:pb-20">
            <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[#C4A04A] font-medium">{data.hero.eyebrow}</p>
            <h1 className="mt-4 text-[1.85rem] leading-[1.15] sm:text-5xl sm:leading-[1.1] font-semibold tracking-tight max-w-4xl">
              {data.hero.titulo}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-smoke/75 max-w-2xl leading-relaxed">{data.hero.problema}</p>
            <p className="mt-6 border-l-4 border-[#C4A04A] pl-4 text-lg sm:text-xl text-smoke font-medium max-w-2xl leading-snug">
              {data.hero.solucion}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={irAlFormulario("hero")} className={GOLD_BTN}>
                {data.hero.cta}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
              <a href={waLink(data.whatsapp.mensaje)} target="_blank" rel="noopener noreferrer" onClick={clickWhatsApp("hero")} className={WA_BTN_DARK}>
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                {data.whatsapp.boton}
              </a>
            </div>
            <ul className="mt-10 grid gap-3 sm:grid-cols-3 text-sm text-smoke/80">
              {data.hero.confianza.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#C4A04A] shrink-0" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Beneficios */}
        <section className="py-14 sm:py-20" aria-labelledby="beneficios-titulo">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 id="beneficios-titulo" className="text-2xl sm:text-3xl font-semibold tracking-tight">{data.beneficios.titulo}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {data.beneficios.items.map((b) => {
                const Icono = ICONOS[b.icon];
                return (
                  <div key={b.titulo} className="bg-white border border-steel/15 p-5 sm:p-6">
                    <div className="h-11 w-11 flex items-center justify-center bg-[#0B1F3A] text-[#C4A04A]">
                      <Icono className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{b.titulo}</h3>
                    <p className="mt-2 text-[15px] text-steel leading-relaxed">{b.texto}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Cómo funciona */}
        <section className="bg-white py-14 sm:py-20 border-y border-steel/10" aria-labelledby="pasos-titulo">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 id="pasos-titulo" className="text-2xl sm:text-3xl font-semibold tracking-tight">{data.pasos.titulo}</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {data.pasos.items.map((p, i) => (
                <li key={p.titulo} className="flex sm:flex-col gap-4">
                  <span className="h-10 w-10 shrink-0 flex items-center justify-center border-2 border-[#C4A04A] text-[#0B1F3A] font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{p.titulo}</h3>
                    <p className="mt-1.5 text-[15px] text-steel leading-relaxed">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Lo que recibe: el servicio en concreto, justo antes de pedir datos */}
        <section className="py-14 sm:py-20" aria-labelledby="entregables-titulo">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 id="entregables-titulo" className="text-2xl sm:text-3xl font-semibold tracking-tight">{data.entregables.titulo}</h2>
            <ul className="mt-6 space-y-3">
              {data.entregables.items.map((t) => (
                <li key={t} className="flex items-start gap-3 bg-white border border-steel/15 px-4 py-3.5">
                  <FileCheck2 className="h-5 w-5 text-[#C4A04A] shrink-0 mt-0.5" aria-hidden />
                  <span className="text-[15px] leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5-6. Formulario corto y WhatsApp */}
        <section id="formulario" className="bg-[#0B1F3A] py-14 sm:py-20 scroll-mt-4" aria-labelledby="formulario-titulo">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            {enviado ? (
              <div ref={graciasRef} tabIndex={-1} className="bg-white p-6 sm:p-8 text-center focus:outline-none" role="status">
                <CheckCircle2 className="h-12 w-12 text-[#C4A04A] mx-auto" aria-hidden />
                <h2 id="formulario-titulo" className="mt-4 text-2xl font-semibold">{data.formulario.gracias.titulo}</h2>
                <p className="mt-3 text-steel leading-relaxed">{data.formulario.gracias.texto}</p>
                <a
                  href={waLink(mensajeGracias)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={clickWhatsApp("gracias")}
                  className={`${WA_BTN_LIGHT} mt-6 w-full`}
                >
                  <WhatsAppIcon />
                  {data.whatsapp.boton}
                </a>
              </div>
            ) : (
              <>
                <h2 id="formulario-titulo" className="text-2xl sm:text-3xl font-semibold tracking-tight text-smoke">{data.formulario.titulo}</h2>
                <p className="mt-3 text-smoke/75 leading-relaxed">{data.formulario.texto}</p>
                <form onSubmit={enviar} noValidate className="mt-6 bg-white p-5 sm:p-7 space-y-4" aria-label="Formulario de contacto">
                  <Campo id="landing-nombre" label="Nombre" error={errores.nombre}>
                    <input
                      id="landing-nombre"
                      name="nombre"
                      autoComplete="name"
                      value={form.nombre}
                      onChange={cambiar("nombre")}
                      aria-invalid={!!errores.nombre}
                      aria-describedby={errores.nombre ? "landing-nombre-error" : undefined}
                      className={inputCls(errores.nombre)}
                      maxLength={100}
                    />
                  </Campo>
                  <Campo id="landing-empresa" label="Empresa" error={errores.empresa}>
                    <input
                      id="landing-empresa"
                      name="empresa"
                      autoComplete="organization"
                      value={form.empresa}
                      onChange={cambiar("empresa")}
                      aria-invalid={!!errores.empresa}
                      aria-describedby={errores.empresa ? "landing-empresa-error" : undefined}
                      className={inputCls(errores.empresa)}
                      maxLength={150}
                    />
                  </Campo>
                  <Campo id="landing-telefono" label="Teléfono o WhatsApp" error={errores.telefono}>
                    <input
                      id="landing-telefono"
                      name="telefono"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="777 123 4567"
                      value={form.telefono}
                      onChange={cambiar("telefono")}
                      aria-invalid={!!errores.telefono}
                      aria-describedby={errores.telefono ? "landing-telefono-error" : undefined}
                      className={inputCls(errores.telefono)}
                      maxLength={25}
                    />
                  </Campo>
                  {/* Campo trampa para robots: oculto para las personas */}
                  <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor="landing-sitio">No llenar</label>
                    <input id="landing-sitio" name="sitio_web" tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={cambiar("honeypot")} />
                  </div>

                  {errorEnvio && (
                    <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">{errorEnvio}</p>
                  )}

                  <button type="submit" disabled={enviando} className={`${GOLD_BTN} w-full disabled:opacity-60`}>
                    {enviando ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                    {enviando ? "Enviando…" : data.formulario.boton}
                  </button>
                  <p className="text-xs text-steel leading-relaxed">
                    Al enviar aceptas nuestro{" "}
                    <a href="/privacidad" target="_blank" rel="noopener" className="underline hover:text-[#0B1F3A]">aviso de privacidad</a>.
                    Usamos tus datos solo para contactarte.
                  </p>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-sm text-smoke/70">¿Prefieres escribirnos?</p>
                  <a
                    href={waLink(data.whatsapp.mensaje)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={clickWhatsApp("formulario")}
                    className={`${WA_BTN_LIGHT} mt-3 w-full`}
                  >
                    <WhatsAppIcon />
                    {data.whatsapp.boton}
                  </a>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 7. Preguntas frecuentes */}
        <section className="py-14 sm:py-20" aria-labelledby="faq-titulo">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 id="faq-titulo" className="text-2xl sm:text-3xl font-semibold tracking-tight">{data.faq.titulo}</h2>
            <div className="mt-6 divide-y divide-steel/15 border-y border-steel/15">
              {data.faq.items.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none text-base font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#C4A04A] transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="pb-5 -mt-1 text-[15px] text-steel leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Cierre */}
        <section className="bg-[#0B1F3A] text-smoke py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug">{data.cierre.titulo}</h2>
            <p className="mt-4 text-smoke/75 text-lg">{data.cierre.texto}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {!enviado && (
                <button type="button" onClick={irAlFormulario("cierre")} className={GOLD_BTN}>
                  {data.formulario.boton}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </button>
              )}
              <a href={waLink(data.whatsapp.mensaje)} target="_blank" rel="noopener noreferrer" onClick={clickWhatsApp("cierre")} className={WA_BTN_DARK}>
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                {data.whatsapp.boton}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const Campo = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-[#0B1F3A] mb-1.5">{label}</label>
    {children}
    {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
  </div>
);
