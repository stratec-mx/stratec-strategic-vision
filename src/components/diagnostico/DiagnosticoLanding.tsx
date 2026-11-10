// Secciones de la landing de /diagnostico. El cuestionario vive en la página;
// estas secciones explican qué es, qué evalúa y qué entrega.
import { Link } from "react-router-dom";
import { ArrowRight, FileDown, Users, Flame, PhoneOff, GraduationCap, Cctv, RefreshCw, ClipboardList, Mail, Download, CheckCircle2, ChevronDown } from "lucide-react";
import hero from "@/assets/hero-stratec.jpg";
import { AREAS_TEXT, INCLUDES, FAQ } from "@/data/diagnosticoLanding";

type StartProps = { onStart: () => void };

const GOLD = "#C4A04A";

/** Vista ilustrativa del PDF: no son datos de un cliente. */
const PdfMock = () => (
  <div className="relative mx-auto w-full max-w-sm" aria-hidden>
    <div className="absolute -inset-3 bg-[#C4A04A]/10 blur-2xl" />
    <div className="relative bg-white shadow-2xl rotate-[1.5deg] text-left">
      <div className="bg-navy-deep px-5 py-4 flex items-center justify-between border-b-2 border-[#C4A04A]">
        <span className="text-smoke tracking-[0.3em] text-xs">STRATEC</span>
        <span className="text-[9px] tracking-[0.2em] text-[#C4A04A]">DIAGNÓSTICO BÁSICO</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="bg-[#F8F5ED] border-l-4 border-[#C4A04A] p-4 flex items-center gap-4">
          <div className="font-display text-4xl text-[#C4A04A] leading-none">6<span className="text-base text-steel">/10</span></div>
          <div>
            <div className="text-sm font-semibold text-[#9a7d2f]">Vulnerabilidad media</div>
            <div className="h-1.5 w-32 bg-steel/15 mt-2" />
            <div className="h-1.5 w-24 bg-steel/15 mt-1.5" />
          </div>
        </div>
        <div>
          <div className="text-[9px] tracking-[0.2em] text-navy font-semibold mb-2">ÁREAS A ATENDER</div>
          {["Protocolo ante extorsión", "Cadena de reporte", "Plan de continuidad"].map((t) => (
            <div key={t} className="flex items-center justify-between py-1.5 border-b border-steel/10">
              <span className="text-xs text-navy">{t}</span>
              <span className="h-1.5 w-10 bg-[#C4A04A]/40" />
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] tracking-[0.2em] text-navy font-semibold mb-2">PLAN DE ACCIÓN</div>
          <div className="h-1.5 w-full bg-steel/15" />
          <div className="h-1.5 w-5/6 bg-steel/15 mt-1.5" />
          <div className="h-1.5 w-4/6 bg-steel/15 mt-1.5" />
        </div>
      </div>
    </div>
    <p className="relative text-center text-[11px] text-smoke/50 mt-4">Vista ilustrativa del reporte</p>
  </div>
);

export const DiagnosticoHero = ({ onStart }: StartProps) => (
  <section className="relative bg-navy-deep text-smoke overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
    <div className="absolute inset-0">
      <img src={hero} alt="" className="w-full h-full object-cover opacity-25" width={1920} height={1080} />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/90 to-navy-deep/60" />
      <div className="absolute inset-0 grid-bg-light opacity-40" />
    </div>
    <div className="relative container-wide grid lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7">
        <div className="flex flex-wrap gap-2 mb-6">
          {["Básico", "GRATIS", "PDF descargable"].map((t) => (
            <span key={t} className="text-[10px] uppercase tracking-[0.25em] px-3 py-1 border border-[#C4A04A]/50 text-[#C4A04A]">{t}</span>
          ))}
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-[1.08] text-balance">
          Genera y descarga tu diagnóstico de seguridad en PDF, <span style={{ color: GOLD }}>GRATIS</span>
        </h1>
        <p className="mt-6 text-lg text-smoke/75 max-w-xl leading-relaxed">
          Responde 10 preguntas sobre tu empresa o institución y obtén tu nivel de vulnerabilidad, las áreas a atender y un plan de acción
          priorizado. Basado en la metodología ISO 31000 de gestión de riesgos.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center justify-center gap-3 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold uppercase tracking-wider text-sm px-8 h-14 transition-colors"
          >
            <FileDown className="h-5 w-5" /> Comenzar mi diagnóstico <ArrowRight className="h-4 w-4" />
          </button>
          <a href="#que-evalua" className="inline-flex items-center justify-center gap-2 border border-smoke/25 hover:border-smoke/60 text-smoke uppercase tracking-wider text-xs px-8 h-14 transition-colors">
            Qué evalúa <ChevronDown className="h-4 w-4" />
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-smoke/60">
          {["Sin costo", "Unos 3 minutos", "Resultado inmediato"].map((t) => (
            <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#C4A04A]" /> {t}</li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-5">
        <PdfMock />
      </div>
    </div>
  </section>
);

const AREA_ICONS = [Users, Flame, PhoneOff, GraduationCap, Cctv, RefreshCw];
const AREAS = AREAS_TEXT.map((a, i) => ({ ...a, icon: AREA_ICONS[i] }));

const STEPS = [
  { icon: ClipboardList, title: "Responde", text: "10 preguntas de sí o no y algunos datos generales de tu organización." },
  { icon: Mail, title: "Deja tu contacto", text: "Un correo y un teléfono para entregarte el resultado." },
  { icon: Download, title: "Descarga tu PDF", text: "Ves tu resultado en pantalla y descargas el reporte." },
];


export const DiagnosticoInfo = ({ onStart }: StartProps) => (
  <>
    <section id="que-evalua" className="scroll-mt-24 py-20 md:py-28 bg-background">
      <div className="container-wide">
        <div className="max-w-2xl mb-12">
          <div className="eyebrow mb-3">— Qué evalúa</div>
          <h2 className="font-display text-3xl md:text-4xl text-navy font-light leading-tight">Seis áreas que deciden cómo responde tu organización ante un incidente</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-steel/15 border border-steel/15">
          {AREAS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white p-7">
              <Icon className="h-6 w-6 text-[#C4A04A] mb-4" />
              <h3 className="font-display text-lg text-navy mb-2">{title}</h3>
              <p className="text-sm text-steel leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-20 md:py-28 bg-navy-deep text-smoke relative overflow-hidden">
      <div className="absolute inset-0 grid-bg-light opacity-30" />
      <div className="relative container-wide grid lg:grid-cols-2 gap-14">
        <div>
          <div className="text-xs uppercase tracking-[0.4em] text-[#C4A04A] mb-4">— Cómo funciona</div>
          <h2 className="font-display text-3xl md:text-4xl font-light leading-tight mb-10">Tres pasos, unos 3 minutos</h2>
          <ol className="space-y-8">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-5">
                <span className="shrink-0 h-12 w-12 border border-[#C4A04A]/50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#C4A04A]" />
                </span>
                <div>
                  <div className="text-xs text-smoke/40 tracking-widest mb-1">PASO {i + 1}</div>
                  <h3 className="font-display text-xl mb-1">{title}</h3>
                  <p className="text-sm text-smoke/65">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="border border-smoke/15 bg-smoke/[0.03] p-8 md:p-10 self-start">
          <h3 className="font-display text-2xl font-light mb-6">Qué incluye tu PDF</h3>
          <ul className="space-y-4">
            {INCLUDES.map((t) => (
              <li key={t} className="flex gap-3 text-smoke/80"><CheckCircle2 className="h-5 w-5 text-[#C4A04A] shrink-0 mt-0.5" /> {t}</li>
            ))}
          </ul>
          <button type="button" onClick={onStart} className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold uppercase tracking-wider text-sm h-12 transition-colors">
            Comenzar ahora <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  </>
);


export const DiagnosticoFaq = ({ onStart }: StartProps) => (
  <>
    <section className="py-20 md:py-28 bg-background">
      <div className="container-wide max-w-3xl mx-auto px-4">
        <div className="eyebrow mb-3">— Preguntas frecuentes</div>
        <h2 className="font-display text-3xl md:text-4xl text-navy font-light leading-tight mb-10">Antes de empezar</h2>
        <div className="divide-y divide-steel/15 border-y border-steel/15">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-navy font-medium">
                {q}
                <ChevronDown className="h-4 w-4 text-steel shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-steel leading-relaxed">
                {a}
                {q.startsWith("¿Por qué") && (
                  <> <Link to="/privacidad" className="underline">Ver aviso de privacidad</Link>.</>
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
    <section className="py-16 bg-navy-deep text-smoke text-center">
      <div className="container-wide">
        <h2 className="font-display text-3xl md:text-4xl font-light mb-6">Tu diagnóstico, en unos 3 minutos</h2>
        <button type="button" onClick={onStart} className="inline-flex items-center justify-center gap-3 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold uppercase tracking-wider text-sm px-8 h-14 transition-colors">
          <FileDown className="h-5 w-5" /> Comenzar mi diagnóstico GRATIS
        </button>
      </div>
    </section>
  </>
);
