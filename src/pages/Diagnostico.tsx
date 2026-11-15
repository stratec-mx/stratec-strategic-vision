// Diagnóstico básico gratuito — entrada pública de clientes (lead magnet).
// Tres cuestionarios (src/data/diagnosticoPreguntas.ts): negocio o institución,
// casa y evento masivo. Enlaces directos: /diagnostico?tipo=casa y ?tipo=evento.
// Flujo: 10 preguntas + datos del último paso → correo y teléfono (captura de
// lead, Supabase submit-lead) → resultado en pantalla y PDF.
// El perfil viaja en las notas del lead para que la cotización se arme ya
// clasificada en el dashboard (en casa y evento, sin giro: solo los servicios).

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, MapPin, ArrowLeft, ArrowRight, Loader2, AlertTriangle, ChevronDown, FileDown, Building2, Home, Users, Lock, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SecurityMap } from "@/components/security-map/SecurityMap";
import { SecurityMarker, DEFAULT_MARKER_KINDS } from "@/components/security-map/types";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { encodeLeadProfile, type GiroId } from "@/lib/pricing";
import {
  DIAGNOSTICOS, SERVICIOS, TIPOS, PERSONAS, SUPERFICIE, datosPerfil, perfilCompleto, perfilInicial, tipoDesdeParam,
  type TipoDiagnostico,
} from "@/data/diagnosticoPreguntas";
import { DiagnosticoHero, DiagnosticoInfo, DiagnosticoFaq } from "@/components/diagnostico/DiagnosticoLanding";

const SUPABASE_URL = "https://xtfsqdwkbsghkzszpisz.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZnNxZHdrYnNnaGt6c3pwaXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODAyMjYsImV4cCI6MjA5NTY1NjIyNn0.g0lUqVc-454htPpGPCAJXovZE4hmmnsaxKzuYZUZ60A";

type Answer = "si" | "no" | "ns";

const ICONO_TIPO = { negocio: Building2, casa: Home, evento: Users } as const;

const inputCls = "h-11 px-3 border border-steel/25 bg-white text-sm text-navy focus:border-[#C4A04A] focus:outline-none w-full";

export default function Diagnostico() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tipoUrl = tipoDesdeParam(searchParams.get("tipo"));
  const [tipo, setTipo] = useState<TipoDiagnostico>(tipoUrl);
  const cfg = DIAGNOSTICOS[tipo];
  const QUESTIONS = cfg.preguntas;
  const [markers, setMarkers] = useState<SecurityMarker[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [phase, setPhase] = useState<"quiz" | "gate" | "result">("quiz");
  const [submitting, setSubmitting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [perfil, setPerfil] = useState<Record<string, string>>(() => perfilInicial(tipoUrl));
  const [form, setForm] = useState({ name: "", org: "", email: "", tel: "", contact: false, hp: "" });

  // Paso del cuestionario: 0..9 = preguntas, 10 = datos del último paso
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const stepRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const moved = useRef(false);
  const reduceMotion = useReducedMotion();
  const onData = step >= QUESTIONS.length;
  const current = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];
  const slide = {
    enter: (d: number) => ({ opacity: 0, x: reduceMotion ? 0 : d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduceMotion ? 0 : d * -48 }),
  };

  const answeredCount = Object.keys(answers).length;
  const profileReady = perfilCompleto(tipo, perfil);
  const ready = answeredCount === QUESTIONS.length && profileReady;

  // Score de preparación 0–10 (Sí=1, No estoy seguro=0.5, No=0). Mayor = menos vulnerable.
  const score = useMemo(
    () => QUESTIONS.reduce((s, q) => s + (answers[q.id] === "si" ? 1 : answers[q.id] === "ns" ? 0.5 : 0), 0),
    [answers, QUESTIONS]
  );

  const level = useMemo(() => {
    if (score >= 8) return { key: "bajo", label: "Vulnerabilidad baja", color: "#2E7D32", badge: "Vas bien", body: cfg.niveles.bajo };
    if (score >= 5) return { key: "medio", label: "Vulnerabilidad media", color: "#C4A04A", badge: "Hay puntos por atender", body: cfg.niveles.medio };
    return { key: "alto", label: "Vulnerabilidad alta", color: "#C0392B", badge: "Riesgo alto", body: cfg.niveles.alto };
  }, [score, cfg]);

  const failed = useMemo(() => QUESTIONS.filter((q) => answers[q.id] === "no" || answers[q.id] === "ns"), [answers, QUESTIONS]);
  const passed = useMemo(() => QUESTIONS.filter((q) => answers[q.id] === "si"), [answers, QUESTIONS]);
  const recommended = useMemo(() => [...new Set(failed.flatMap((q) => q.services))].map((k) => SERVICIOS[k]), [failed]);
  const fmt = (n: number) => (n === Math.floor(n) ? n.toString() : n.toFixed(1));
  // Datos del último paso ya legibles: [etiqueta, valor]
  const datos = useMemo(() => datosPerfil(tipo, perfil), [tipo, perfil]);
  const etiqueta = (campo: string) => cfg.perfil.campos.find((c) => c.id === campo)?.options.find((o) => o.id === perfil[campo])?.label ?? "";
  const esNegocio = tipo === "negocio";
  const giroLabel = esNegocio ? etiqueta("giro") : "";
  const personasLabel = esNegocio ? etiqueta("personas") : "";
  const superficieLabel = esNegocio ? etiqueta("superficie") : "";
  const estado = perfil.estado ?? "";

  // Cambiar de cuestionario reinicia respuestas y datos (las preguntas son otras)
  const aplicarTipo = (nuevo: TipoDiagnostico) => {
    window.clearTimeout(advanceTimer.current);
    setTipo(nuevo);
    setAnswers({});
    setPerfil(perfilInicial(nuevo));
    setDir(-1);
    setStep(0);
  };
  const cambiarTipo = (nuevo: TipoDiagnostico) => {
    if (nuevo === tipo) return;
    if (Object.keys(answers).length > 0 && !window.confirm("Al cambiar de diagnóstico se borran las respuestas que llevas. ¿Quieres cambiar?")) return;
    aplicarTipo(nuevo);
    track.ctaClick(`diagnostico_tipo_${nuevo}`);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nuevo === "negocio") next.delete("tipo");
      else next.set("tipo", nuevo);
      return next;
    }, { replace: true });
  };
  // Si la dirección cambia por fuera (un enlace a ?tipo=casa con la página abierta), se sigue
  useEffect(() => {
    if (tipoUrl !== tipo) aplicarTipo(tipoUrl);
  }, [tipoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (to: number) => {
    window.clearTimeout(advanceTimer.current);
    const next = Math.max(0, Math.min(QUESTIONS.length, to));
    setDir(next >= step ? 1 : -1);
    moved.current = true;
    setStep(next);
  };
  // Responder marca la opción y, tras un instante para verla, pasa a la siguiente
  const answerAndNext = (val: Answer) => {
    const from = step;
    setAnswers((a) => ({ ...a, [current.id]: val }));
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      setDir(1);
      moved.current = true;
      setStep((s) => (s === from ? from + 1 : s));
    }, reduceMotion ? 150 : 350);
  };
  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);
  // En móvil, si la tarjeta quedó arriba de la pantalla, la vuelve a mostrar
  useEffect(() => {
    if (!moved.current) return;
    const el = stepRef.current;
    if (el && el.getBoundingClientRect().top < 64) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [step, reduceMotion]);
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const startQuiz = () => {
    track.ctaClick("diagnostico_comenzar");
    document.getElementById("cuestionario")?.scrollIntoView({ behavior: "smooth" });
  };
  const backToQuiz = () => {
    setPhase("quiz");
    // Espera a que el cuestionario vuelva a montarse
    setTimeout(() => document.getElementById("cuestionario")?.scrollIntoView(), 50);
  };

  const goGate = () => {
    if (!ready) {
      toast({ title: "Faltan datos", description: "Responde las 10 preguntas y completa los datos del último paso.", variant: "destructive" });
      return;
    }
    track.diagnosticoResultado(level.key, tipo);
    setPhase("gate");
    top();
  };

  const submitGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast({ title: "Correo inválido", description: "Ingresa un correo válido.", variant: "destructive" });
      return;
    }
    if (form.tel.replace(/\D/g, "").length < 10) {
      toast({ title: "Teléfono inválido", description: "Ingresa un teléfono de 10 dígitos.", variant: "destructive" });
      return;
    }
    const servicios = recommended.map((s) => s.short).join(" · ") || "Evaluación general";
    const codigos = recommended.map((s) => s.code);
    // Casa y evento no llevan giro ni personas: no son inmuebles que el cotizador clasifique
    const perfilLinea = esNegocio
      ? encodeLeadProfile(
          {
            giro: perfil.giro as GiroId,
            people: PERSONAS.find((x) => x.id === perfil.personas)?.value,
            area: SUPERFICIE.find((x) => x.id === perfil.superficie)?.value,
            morelos: estado === "Morelos",
          },
          codigos,
        )
      : encodeLeadProfile({ morelos: estado === "Morelos" }, codigos, tipo);
    const detalle = form.org.trim();
    const msg = [
      form.contact ? "DESEA QUE UN ASESOR LO CONTACTE" : "No pidió contacto de un asesor (solo descargó su diagnóstico)",
      esNegocio
        ? `Diagnóstico básico: ${fmt(score)}/10 (${level.label})`
        : `Diagnóstico básico de ${cfg.nombre.toLowerCase()}: ${fmt(score)}/10 (${level.label})`,
      esNegocio
        ? `Giro: ${giroLabel} | ${personasLabel} | Superficie: ${superficieLabel} | Estado: ${estado}`
        : datos.map(([k, v]) => `${k}: ${v}`).join(" | "),
      !esNegocio && detalle ? `${cfg.contacto.etiquetaNota}: ${detalle}` : "",
      `Áreas a atender: ${failed.map((q) => q.short).join(", ") || "ninguna"}`,
      markers.length ? `Marcadores en mapa: ${markers.length}` : "",
      perfilLinea,
    ].filter(Boolean).join("\n");

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
        body: JSON.stringify({
          name: form.name.trim() || "Sin nombre (diagnóstico web)",
          email: form.email.trim(),
          // En casa el campo opcional es la colonia: va en la nota, no como organización
          organization: (tipo === "casa" ? "" : detalle) || "No indicada",
          role: esNegocio ? giroLabel : cfg.nombre,
          telefono: form.tel.trim(),
          servicio: servicios.slice(0, 150),
          message: msg,
          // Datos separados para el aviso de Telegram (la nota del lead usa "message")
          diagnostico: {
            tipo,
            puntaje: fmt(score),
            nivel: level.label,
            quiereContacto: form.contact,
            giro: giroLabel,
            personas: personasLabel,
            superficie: perfil.superficie === "ns" ? "" : superficieLabel,
            estado,
            // Datos propios de casa o evento (el estado ya va aparte)
            datos: esNegocio
              ? []
              : [...datos.filter(([k]) => k !== "Estado"), ...(tipo === "casa" && detalle ? [[cfg.contacto.etiquetaNota, detalle]] : [])],
            areas: failed.map((q) => q.short),
            servicios: recommended.map((s) => `${s.code} · ${s.short}`),
            marcadores: markers.length,
          },
          honeypot: form.hp,
        }),
      });
      // fetch solo lanza en error de red: un 4xx/5xx de la Edge Function llega
      // como respuesta "exitosa". Sin este check el lead se pierde.
      if (!res.ok) throw new Error(`submit-lead ${res.status}`);
      track.diagnosticoLead(level.key, esNegocio ? perfil.giro : tipo, tipo);
      setPhase("result");
      top();
    } catch {
      toast({ title: "No se pudo generar", description: "Intenta de nuevo en un momento, o escríbenos por WhatsApp.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadDiagnosticoPdf } = await import("@/lib/diagnosticoPdf");
      await downloadDiagnosticoPdf({
        date: new Date(),
        name: form.name.trim(),
        org: tipo === "casa" ? "" : form.org.trim(),
        giro: esNegocio ? giroLabel : datos.filter(([k]) => k !== "Estado" && k !== "Fecha").map(([, v]) => v).join(" · "),
        estado,
        sujeto: cfg.sujeto,
        textos: cfg.pdf,
        score: fmt(score),
        levelLabel: level.label,
        levelBody: level.body,
        levelColor: level.color,
        failed: failed.map((q) => ({ short: q.short, riesgo: q.riesgo, service: SERVICIOS[q.services[0]].short })),
        passed: passed.map((q) => q.short),
        services: recommended.map((s) => ({ short: s.short, url: s.url })),
      });
      track.diagnosticoPdf(level.key, tipo);
    } catch (e) {
      toast({ title: "No se pudo generar el PDF", description: (e as Error)?.message ?? "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  // El bot de WhatsApp lee estos datos y solo pregunta lo que falte. Sin correo ni teléfono.
  const waPerfil = esNegocio
    ? [
        giroLabel && `Giro: ${giroLabel}`,
        personasLabel && `Personas: ${personasLabel.replace(/ personas$/, "")}`,
        perfil.superficie !== "ns" && superficieLabel && `Superficie: ${superficieLabel.replace(/^De /, "")}`,
        estado && `Estado: ${estado}`,
      ].filter(Boolean).join(" · ")
    : datos.map(([k, v]) => `${k}: ${v}`).join(" · ");
  const waText = encodeURIComponent(
    `Hola STRATEC, ${cfg.whatsapp} (nivel: ${level.label}, ${fmt(score)}/10) y quiero agendar una evaluación.` +
      (waPerfil ? ` ${waPerfil}` : ""),
  );
  const IconoPerfil = ICONO_TIPO[tipo];

  return (
    <div className="min-h-screen bg-smoke">
      <Navbar />
      <main className={phase === "quiz" ? "" : "pt-28 pb-20"}>

          {/* ── LANDING + CUESTIONARIO ── */}
          {phase === "quiz" && (
            <>
              <DiagnosticoHero onStart={startQuiz} sujeto={esNegocio ? undefined : cfg.sujeto} />
              <DiagnosticoInfo onStart={startQuiz} />
              <section id="cuestionario" className="scroll-mt-20 py-20 md:py-24 bg-smoke">
              <div className="container-wide max-w-3xl mx-auto px-4">
              <div className="eyebrow mb-3">— Tu diagnóstico</div>
              <h2 className="font-display text-3xl md:text-4xl text-navy font-light leading-tight mb-3">
                Empieza: 10 preguntas sobre {cfg.sujeto}
              </h2>
              <p className="text-steel text-sm md:text-base leading-relaxed mb-8">
                Contesta con lo que sabes hoy. Si no estás seguro, elige "No estoy seguro": también cuenta para tu resultado.
              </p>

              {/* Qué se revisa: cada opción tiene sus propias preguntas */}
              <fieldset className="mb-10">
                <legend className="text-xs uppercase tracking-wider text-steel mb-3">¿Qué quieres revisar?</legend>
                <div className="grid sm:grid-cols-3 gap-2">
                  {TIPOS.map((t) => {
                    const Icono = ICONO_TIPO[t];
                    const sel = t === tipo;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => cambiarTipo(t)}
                        aria-pressed={sel}
                        className={`min-h-[48px] sm:min-h-[64px] flex items-center gap-3 px-4 py-2.5 sm:py-3 border text-left transition-colors ${sel ? "border-navy bg-navy text-smoke" : "border-steel/25 bg-white text-navy hover:border-navy/50"}`}
                      >
                        <Icono className={`h-5 w-5 shrink-0 ${sel ? "text-[#C4A04A]" : "text-steel"}`} />
                        <span>
                          <span className="block text-sm font-medium leading-tight">{DIAGNOSTICOS[t].etiqueta}</span>
                          <span className={`hidden sm:block text-[11px] leading-snug mt-0.5 ${sel ? "text-smoke/70" : "text-steel"}`}>{DIAGNOSTICOS[t].detalle}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Avance: un segmento por pregunta y uno para los datos del negocio */}
              <div className="flex items-center justify-between text-xs text-steel mb-2">
                <span>{onData ? `Último paso: sobre ${cfg.sujeto}` : `Pregunta ${step + 1} de ${QUESTIONS.length}`}</span>
                <span>{answeredCount} de {QUESTIONS.length} respondidas</span>
              </div>
              <div className="flex gap-1 mb-6" aria-hidden>
                {[...QUESTIONS.map((q) => !!answers[q.id]), profileReady].map((done, i) => (
                  <div key={i} className={`h-1.5 flex-1 transition-colors duration-300 ${i === step ? "bg-navy" : done ? "bg-[#C4A04A]" : "bg-steel/15"}`} />
                ))}
              </div>

              <div ref={stepRef} className="scroll-mt-24 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
              {!onData ? (
                <motion.div
                  key={`q-${tipo}-${step}`}
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
                  className="border border-steel/20 bg-white p-6 md:p-8"
                >
                  <div className="flex items-center gap-2 text-[#C4A04A] mb-4">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-display text-2xl leading-none">{String(current.id).padStart(2, "0")}</span>
                  </div>
                  <p className="font-display text-xl md:text-2xl text-navy leading-snug mb-6" aria-live="polite">{current.text}</p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {([["si", "Sí"], ["no", "No"], ["ns", "No estoy seguro"]] as [Answer, string][]).map(([val, lbl]) => {
                      const sel = answers[current.id] === val;
                      // min-h 52px: objetivo táctil cómodo para el pulgar en móvil.
                      const base = "min-h-[52px] text-sm md:text-base px-3 py-2 border rounded-none transition-all ";
                      const styles = sel
                        ? val === "si" ? "border-green-600 bg-green-50 text-green-800"
                        : val === "no" ? "border-red-500 bg-red-50 text-red-700"
                        : "border-[#C4A04A] bg-[#C4A04A]/10 text-[#9a7d2f]"
                        : "border-steel/25 bg-white text-navy hover:border-navy/50";
                      return (
                        <button key={val} type="button" onClick={() => answerAndNext(val)} className={base + styles} aria-pressed={sel}>
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => goTo(step - 1)}
                      disabled={step === 0}
                      className="inline-flex items-center gap-1 text-sm text-steel hover:text-navy disabled:invisible"
                    >
                      <ArrowLeft className="h-4 w-4" /> Anterior
                    </button>
                    {answers[current.id] && (
                      <button type="button" onClick={() => goTo(step + 1)} className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
                        Siguiente <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
              <motion.div
                key={`datos-${tipo}`}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
              >
              {/* Datos del último paso: cambian según el tipo de diagnóstico */}
              <section className="mb-6 border border-steel/20 bg-white p-5">
                <h3 className="font-display text-xl text-navy mb-1 flex items-center gap-2">
                  <IconoPerfil className="h-5 w-5 text-[#C4A04A]" /> {cfg.perfil.titulo}
                </h3>
                <p className="text-sm text-steel mb-4">{cfg.perfil.ayuda}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {cfg.perfil.campos.map((c) => (
                    <label key={c.id} className="space-y-1">
                      <span className="text-xs text-steel">{c.label}{c.required ? " *" : ""}</span>
                      <select value={perfil[c.id] ?? ""} onChange={(e) => setPerfil({ ...perfil, [c.id]: e.target.value })} className={inputCls}>
                        {c.required && <option value="">Selecciona</option>}
                        {c.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </section>

              {/* 3 · Mapa del predio — opcional y plegado: Leaflet solo se carga si se abre */}
              <section className="mb-8 border border-steel/20 bg-white">
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  aria-expanded={showMap}
                  className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between gap-3 text-left"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#C4A04A] shrink-0" />
                    <span>
                      <span className="font-display text-lg text-navy">{cfg.mapa.titulo}</span>
                      <span className="block text-xs text-steel">
                        Opcional · {markers.length > 0
                          ? `${markers.length} marcador${markers.length !== 1 ? "es" : ""} colocado${markers.length !== 1 ? "s" : ""}`
                          : cfg.mapa.ayuda}
                      </span>
                    </span>
                  </span>
                  <ChevronDown className={`h-5 w-5 text-steel shrink-0 transition-transform ${showMap ? "rotate-180" : ""}`} />
                </button>
                {showMap && (
                  <div className="px-5 pb-5">
                    <SecurityMap
                      value={markers}
                      onChange={setMarkers}
                      kinds={DEFAULT_MARKER_KINDS}
                      height={380}
                      helpText="Busca tu dirección o usa tu ubicación, luego toca el mapa para colocar marcadores."
                    />
                  </div>
                )}
              </section>

              <button
                onClick={goGate}
                disabled={!ready}
                className="w-full h-14 bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Generar mi diagnóstico <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => goTo(QUESTIONS.length - 1)} className="mt-4 inline-flex items-center gap-1 text-sm text-steel hover:text-navy">
                <ArrowLeft className="h-4 w-4" /> Volver a las preguntas
              </button>
              </motion.div>
              )}
              </AnimatePresence>
              </div>
              </div>
              </section>
              <DiagnosticoFaq onStart={startQuiz} />
            </>
          )}

        <div className="container-wide max-w-3xl mx-auto px-4">

          {/* ── FASE CONTACTO (para ver y descargar) ── */}
          {phase === "gate" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-8">
                <CheckCircle2 className="h-12 w-12 text-[#C4A04A] mx-auto mb-4" />
                <h1 className="font-display text-3xl text-navy font-light mb-3">Tu diagnóstico está listo</h1>
                <p className="text-sm text-steel max-w-lg mx-auto">
                  Déjanos un correo y un teléfono de contacto para ver tu resultado y descargar tu diagnóstico básico en PDF. Es GRATIS.
                </p>
              </div>
              <section className="border border-navy/15 bg-white p-6 md:p-8">
                <form onSubmit={submitGate} className="space-y-4">
                  <input type="text" tabIndex={-1} autoComplete="off" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" aria-hidden />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input required type="email" autoComplete="email" placeholder="Correo *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                    <input required type="tel" autoComplete="tel" inputMode="tel" placeholder="Teléfono (10 dígitos) *" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} className={inputCls} />
                    <input autoComplete="name" placeholder="Nombre (opcional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                    <input autoComplete={esNegocio ? "organization" : "off"} placeholder={cfg.contacto.campo} value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} className={inputCls} />
                  </div>
                  <label className="flex items-start gap-3 border border-steel/20 bg-smoke/60 px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.checked })} className="mt-1 h-4 w-4 accent-[#0B1F3A]" />
                    <span className="text-sm text-navy">
                      Deseo que un asesor de STRATEC me contacte por teléfono o WhatsApp
                      <span className="block text-xs text-steel">Opcional. Si no la marcas, solo recibirás tu diagnóstico.</span>
                    </span>
                  </label>
                  <button type="submit" disabled={submitting} className="w-full h-14 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold uppercase tracking-wider text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</> : <>Ver y descargar mi diagnóstico <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-[0.7rem] text-steel/80 text-center flex items-center justify-center gap-1.5">
                    <Lock className="h-3 w-3 shrink-0" />
                    <span>
                      Tus datos se tratan de forma confidencial conforme a nuestro{" "}
                      <Link to="/privacidad" className="underline">aviso de privacidad</Link>.
                    </span>
                  </p>
                </form>
              </section>
              <button type="button" onClick={backToQuiz} className="mt-4 text-xs text-steel underline mx-auto block">
                Volver a mis respuestas
              </button>
            </motion.div>
          )}

          {/* ── FASE RESULTADO ── */}
          {phase === "result" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-wider mb-4" style={{ color: level.color, backgroundColor: `${level.color}14` }}>
                  <AlertTriangle className="h-3.5 w-3.5" /> {level.badge}
                </div>
                <div className="font-display text-6xl font-light mb-1" style={{ color: level.color }}>{fmt(score)}<span className="text-2xl text-steel">/10</span></div>
                <h1 className="font-display text-2xl text-navy font-light mb-3">{level.label}</h1>
                <p className="text-sm text-steel leading-relaxed max-w-xl mx-auto">{level.body}</p>
              </div>

              <button
                type="button"
                onClick={downloadPdf}
                disabled={pdfBusy}
                className="w-full h-14 mb-10 bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Descargar mi diagnóstico en PDF
              </button>

              {failed.length > 0 && (
                <section className="mb-10">
                  <h2 className="font-display text-lg text-navy mb-4">
                    {failed.length} área{failed.length > 1 ? "s" : ""} a atender
                  </h2>
                  <div className="space-y-3">
                    {failed.map((q) => {
                      const svc = SERVICIOS[q.services[0]];
                      return (
                        <div key={q.id} className="border border-steel/20 bg-white p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-navy mb-1">{q.short}</div>
                            <div className="text-xs text-steel leading-relaxed">{q.riesgo}</div>
                          </div>
                          <Link to={svc.url} className="text-[0.7rem] px-2 py-1 self-start whitespace-nowrap hover:underline" style={{ color: svc.color, backgroundColor: svc.bg }}>{svc.short}</Link>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="border border-navy/15 bg-white p-6 md:p-8 text-center">
                <h2 className="font-display text-xl text-navy mb-2">
                  {form.contact ? "Un asesor te contactará pronto" : "¿Quieres una evaluación completa?"}
                </h2>
                <p className="text-sm text-steel mb-6 max-w-lg mx-auto">
                  Este es un diagnóstico básico a partir de tus respuestas. Una evaluación con STRATEC revisa tu caso a fondo y te entrega un plan a la medida.
                </p>
                <a href={`https://wa.me/522206488688?text=${waText}`} target="_blank" rel="noopener noreferrer" onClick={() => track.whatsappClick("diagnostico")}
                   className="inline-flex items-center gap-2 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold px-8 py-4 uppercase tracking-wider text-sm transition-colors">
                  Hablar por WhatsApp <ArrowRight className="h-4 w-4" />
                </a>
              </section>
            </motion.div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
