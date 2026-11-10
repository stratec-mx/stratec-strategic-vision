// Diagnóstico básico gratuito — entrada pública de clientes (lead magnet).
// Flujo: cuestionario ISO 31000 + datos de la organización → correo y teléfono
// (captura de lead, Supabase submit-lead) → resultado en pantalla y PDF.
// El perfil (giro, personas, superficie, estado) viaja en las notas del lead
// para que la cotización se arme ya clasificada en el dashboard.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, ArrowRight, Loader2, AlertTriangle, ChevronDown, FileDown, Building2, Lock, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SecurityMap } from "@/components/security-map/SecurityMap";
import { SecurityMarker, DEFAULT_MARKER_KINDS } from "@/components/security-map/types";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { GIROS, encodeLeadProfile, type GiroId } from "@/lib/pricing";
import { DiagnosticoHero, DiagnosticoInfo, DiagnosticoFaq } from "@/components/diagnostico/DiagnosticoLanding";

const SUPABASE_URL = "https://xtfsqdwkbsghkzszpisz.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZnNxZHdrYnNnaGt6c3pwaXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODAyMjYsImV4cCI6MjA5NTY1NjIyNn0.g0lUqVc-454htPpGPCAJXovZE4hmmnsaxKzuYZUZ60A";

type Answer = "si" | "no" | "ns";

interface Service {
  short: string;
  url: string;
  /** Código del cotizador */
  code: string;
  color: string;
  bg: string;
}

const SERVICES: Record<string, Service> = {
  consultoria:  { short: "Consultoría en Seguridad", url: "/servicios/consultoria-seguridad", code: "STR-01", color: "#0B1F3A", bg: "rgba(11,31,58,0.08)" },
  proteccion:   { short: "Programa Interno de Protección Civil", url: "/servicios/programa-interno-proteccion-civil", code: "STR-02.1", color: "#7B4A1E", bg: "rgba(123,74,30,0.08)" },
  capacitacion: { short: "Capacitación", url: "/servicios/capacitacion", code: "STR-03", color: "#5E646E", bg: "rgba(94,100,110,0.1)" },
  revision:     { short: "Revisión de Programa Interno", url: "/servicios/revision-programa-interno", code: "STR-02.3", color: "#7B4A1E", bg: "rgba(123,74,30,0.08)" },
  protocolos:   { short: "Protocolos de Seguridad", url: "/servicios/protocolos-seguridad", code: "STR-01.4", color: "#0B1F3A", bg: "rgba(11,31,58,0.08)" },
  tecnologia:   { short: "Tecnología de Seguridad", url: "/servicios/integracion-tecnologica", code: "STR-04", color: "#9a7d2f", bg: "rgba(196,160,74,0.12)" },
};

interface Question {
  id: number;
  text: string;
  short: string;
  services: string[];
  riesgo: string;
}

const QUESTIONS: Question[] = [
  { id: 1, text: "¿Existe una persona responsable de coordinar emergencias dentro de la organización?", short: "Coordinador de emergencias designado", services: ["consultoria"], riesgo: "Sin coordinador designado, cualquier incidente escala sin control y puede generar responsabilidad legal directa para la dirección." },
  { id: 2, text: "¿Todos los colaboradores saben a quién reportar una amenaza, incidente o situación de riesgo?", short: "Cadena de reporte definida", services: ["protocolos", "consultoria"], riesgo: "La ausencia de cadena de reporte provoca respuestas tardías y contradictorias. Los primeros minutos determinan el impacto final." },
  { id: 3, text: "¿Los números de contacto de emergencia están visibles y actualizados en las instalaciones?", short: "Números de emergencia visibles", services: ["revision", "proteccion"], riesgo: "Los primeros 3 minutos de una emergencia son decisivos. Sin datos de contacto visibles, ese tiempo crítico se pierde." },
  { id: 4, text: "¿Las rutas de evacuación están señalizadas y permanecen libres de obstáculos?", short: "Señalización de rutas de evacuación", services: ["revision", "proteccion"], riesgo: "Incumplimiento directo de la NOM-003-SEGOB. En una evacuación real puede ser determinante para la integridad del personal." },
  { id: 5, text: "¿Los extintores son visibles, accesibles y cuentan con mantenimiento vigente?", short: "Extintores operativos y accesibles", services: ["revision", "proteccion"], riesgo: "Extintores vencidos o bloqueados son inoperantes ante un incendio y representan infracción con multa y posible cierre temporal." },
  { id: 6, text: "¿Existe un procedimiento documentado para actuar ante extorsiones, fraudes o amenazas externas?", short: "Protocolo ante extorsión y amenazas", services: ["protocolos", "consultoria"], riesgo: "Sin protocolo, la organización cede el control al agresor desde el primer momento, incrementando el daño económico y legal." },
  { id: 7, text: "¿El personal ha recibido capacitación en seguridad o gestión de emergencias durante el último año?", short: "Capacitación periódica en seguridad", services: ["capacitacion"], riesgo: "El factor humano sin entrenamiento es el principal amplificador de incidentes. Los protocolos no se aplican sin capacitación verificable." },
  { id: 8, text: "¿Los sistemas de videovigilancia y control de acceso funcionan correctamente y están monitoreados?", short: "CCTV y control de acceso operativos", services: ["tecnologia"], riesgo: "Un sistema inoperante o sin monitoreo solo documenta daños después del hecho. No previene, no disuade, no alerta." },
  { id: 9, text: "¿Se realiza respaldo periódico y verificado de la información crítica de la organización?", short: "Respaldos de información verificados", services: ["tecnologia"], riesgo: "Sin respaldos verificados la organización es altamente vulnerable ante ransomware, fallas o desastres. La recuperación puede ser imposible." },
  { id: 10, text: "¿Existe un plan para continuar operaciones después de una emergencia o interrupción significativa?", short: "Plan de continuidad operativa (BCP)", services: ["tecnologia", "consultoria"], riesgo: "Sin plan de continuidad, un incidente de 48 horas puede paralizar la organización por semanas, con pérdidas operativas y de reputación." },
];

// Rangos que ve el visitante → valor representativo para la clasificación interna
const PERSONAS = [
  { id: "1-15", label: "1 a 15 personas", value: 10 },
  { id: "16-50", label: "16 a 50 personas", value: 40 },
  { id: "51-250", label: "51 a 250 personas", value: 150 },
  { id: "251-1000", label: "251 a 1,000 personas", value: 600 },
  { id: "1000+", label: "Más de 1,000 personas", value: 1500 },
];
const SUPERFICIE = [
  { id: "ns", label: "No lo sé", value: 0 },
  { id: "500", label: "Hasta 500 m²", value: 300 },
  { id: "1500", label: "De 500 a 1,500 m²", value: 1000 },
  { id: "5000", label: "De 1,500 a 5,000 m²", value: 3000 },
  { id: "5000+", label: "Más de 5,000 m²", value: 8000 },
];
const ESTADOS = ["Morelos", "Ciudad de México", "Estado de México", "Puebla", "Guerrero", "Otro estado"];

const inputCls = "h-11 px-3 border border-steel/25 bg-white text-sm text-navy focus:border-[#C4A04A] focus:outline-none w-full";

export default function Diagnostico() {
  const { toast } = useToast();
  const [markers, setMarkers] = useState<SecurityMarker[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [phase, setPhase] = useState<"quiz" | "gate" | "result">("quiz");
  const [submitting, setSubmitting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [org, setOrg] = useState({ giro: "", personas: "", superficie: "ns", estado: "" });
  const [form, setForm] = useState({ name: "", org: "", email: "", tel: "", contact: false, hp: "" });

  const answeredCount = Object.keys(answers).length;
  const profileReady = !!(org.giro && org.personas && org.estado);
  const ready = answeredCount === QUESTIONS.length && profileReady;

  // Score de preparación 0–10 (Sí=1, No estoy seguro=0.5, No=0). Mayor = menos vulnerable.
  const score = useMemo(
    () => QUESTIONS.reduce((s, q) => s + (answers[q.id] === "si" ? 1 : answers[q.id] === "ns" ? 0.5 : 0), 0),
    [answers]
  );

  const level = useMemo(() => {
    if (score >= 8) return { key: "bajo", label: "Vulnerabilidad baja", color: "#2E7D32", badge: "Preparación básica adecuada",
      body: "Tu organización cumple con los elementos fundamentales. Mantén actualizados procedimientos, equipos y capacitación, y considera una auditoría periódica." };
    if (score >= 5) return { key: "medio", label: "Vulnerabilidad media", color: "#C4A04A", badge: "Vulnerabilidades identificadas",
      body: "Tienes una base, pero las áreas señaladas pueden amplificar el impacto de un incidente real. El plan prioriza las correcciones por urgencia." };
    return { key: "alto", label: "Vulnerabilidad alta", color: "#C0392B", badge: "Riesgo elevado",
      body: "Los resultados indican múltiples brechas en protocolos, protección civil, capacitación y tecnología. Se recomienda una evaluación integral." };
  }, [score]);

  const failed = useMemo(() => QUESTIONS.filter((q) => answers[q.id] === "no" || answers[q.id] === "ns"), [answers]);
  const passed = useMemo(() => QUESTIONS.filter((q) => answers[q.id] === "si"), [answers]);
  const recommended = useMemo(() => [...new Set(failed.flatMap((q) => q.services))].map((k) => SERVICES[k]), [failed]);
  const fmt = (n: number) => (n === Math.floor(n) ? n.toString() : n.toFixed(1));
  const giroLabel = GIROS.find((g) => g.id === org.giro)?.label ?? "";
  const personasLabel = PERSONAS.find((p) => p.id === org.personas)?.label ?? "";
  const superficieLabel = SUPERFICIE.find((s) => s.id === org.superficie)?.label ?? "";

  const setAnswer = (id: number, val: Answer) => setAnswers((a) => ({ ...a, [id]: val }));
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
      toast({ title: "Faltan datos", description: "Responde las 10 preguntas y completa los datos de tu organización.", variant: "destructive" });
      return;
    }
    track.diagnosticoResultado(level.key);
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
    const perfil = encodeLeadProfile(
      {
        giro: org.giro as GiroId,
        people: PERSONAS.find((p) => p.id === org.personas)?.value,
        area: SUPERFICIE.find((s) => s.id === org.superficie)?.value,
        morelos: org.estado === "Morelos",
      },
      recommended.map((s) => s.code),
    );
    const msg = [
      form.contact ? "DESEA QUE UN ASESOR LO CONTACTE" : "No pidió contacto de un asesor (solo descargó su diagnóstico)",
      `Diagnóstico básico: ${fmt(score)}/10 (${level.label})`,
      `Giro: ${giroLabel} | ${personasLabel} | Superficie: ${superficieLabel} | Estado: ${org.estado}`,
      `Áreas a atender: ${failed.map((q) => q.short).join(", ") || "ninguna"}`,
      markers.length ? `Marcadores en mapa: ${markers.length}` : "",
      perfil,
    ].filter(Boolean).join("\n");

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
        body: JSON.stringify({
          name: form.name.trim() || "Sin nombre (diagnóstico web)",
          email: form.email.trim(),
          organization: form.org.trim() || "No indicada",
          role: giroLabel,
          telefono: form.tel.trim(),
          servicio: servicios.slice(0, 150),
          message: msg,
          honeypot: form.hp,
        }),
      });
      // fetch solo lanza en error de red: un 4xx/5xx de la Edge Function llega
      // como respuesta "exitosa". Sin este check el lead se pierde.
      if (!res.ok) throw new Error(`submit-lead ${res.status}`);
      track.diagnosticoLead(level.key, org.giro);
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
        org: form.org.trim(),
        giro: giroLabel,
        estado: org.estado,
        score: fmt(score),
        levelLabel: level.label,
        levelBody: level.body,
        levelColor: level.color,
        failed: failed.map((q) => ({ short: q.short, riesgo: q.riesgo, service: SERVICES[q.services[0]].short })),
        passed: passed.map((q) => q.short),
        services: recommended.map((s) => ({ short: s.short, url: s.url })),
      });
      track.diagnosticoPdf(level.key);
    } catch (e) {
      toast({ title: "No se pudo generar el PDF", description: (e as Error)?.message ?? "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  const waText = encodeURIComponent(`Hola STRATEC, hice el diagnóstico básico (nivel: ${level.label}, ${fmt(score)}/10) y quiero agendar una evaluación.`);

  return (
    <div className="min-h-screen bg-smoke">
      <Navbar />
      <main className={phase === "quiz" ? "" : "pt-28 pb-20"}>

          {/* ── LANDING + CUESTIONARIO ── */}
          {phase === "quiz" && (
            <>
              <DiagnosticoHero onStart={startQuiz} />
              <DiagnosticoInfo onStart={startQuiz} />
              <section id="cuestionario" className="scroll-mt-20 py-20 md:py-24 bg-smoke">
              <div className="container-wide max-w-3xl mx-auto px-4">
              <div className="eyebrow mb-3">— Tu diagnóstico</div>
              <h2 className="font-display text-3xl md:text-4xl text-navy font-light leading-tight mb-3">
                Empieza: 10 preguntas sobre tu organización
              </h2>
              <p className="text-steel text-sm md:text-base leading-relaxed mb-10">
                Contesta con lo que sabes hoy. Si no estás seguro, elige "No estoy seguro": también cuenta para tu resultado.
              </p>

              {/* 1 · Cuestionario */}
              <section className="mb-10">
                <h3 className="font-display text-xl text-navy mb-1 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#C4A04A]" /> 1 · Responde el cuestionario
                </h3>
                <p className="text-sm text-steel mb-4">{answeredCount} de {QUESTIONS.length} respondidas.</p>
                <div className="h-1 bg-steel/15 mb-6">
                  <div className="h-full bg-[#C4A04A] transition-all" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
                </div>

                <div className="space-y-4">
                  {QUESTIONS.map((q) => (
                    <div key={q.id} className="border border-steel/20 bg-white p-5">
                      <div className="flex gap-3 mb-4">
                        <span className="font-display text-xl text-[#C4A04A]/40 leading-none">{String(q.id).padStart(2, "0")}</span>
                        <p className="text-sm text-navy leading-snug">{q.text}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {([["si", "Sí"], ["no", "No"], ["ns", "No estoy seguro"]] as [Answer, string][]).map(([val, lbl]) => {
                          const sel = answers[q.id] === val;
                          // min-h 44px: objetivo táctil mínimo para el pulgar en móvil.
                          const base = "min-h-[44px] text-xs sm:text-sm leading-tight px-2 py-2 border rounded-none transition-all ";
                          const styles = sel
                            ? val === "si" ? "border-green-600 bg-green-50 text-green-800"
                            : val === "no" ? "border-red-500 bg-red-50 text-red-700"
                            : "border-[#C4A04A] bg-[#C4A04A]/10 text-[#9a7d2f]"
                            : "border-steel/25 bg-white text-steel hover:border-steel/50";
                          return (
                            <button key={val} type="button" onClick={() => setAnswer(q.id, val)} className={base + styles}>
                              {lbl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2 · Datos de la organización */}
              <section className="mb-10 border border-steel/20 bg-white p-5">
                <h3 className="font-display text-xl text-navy mb-1 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#C4A04A]" /> 2 · Sobre tu organización
                </h3>
                <p className="text-sm text-steel mb-4">Para adaptar las recomendaciones a tu tipo de inmueble.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs text-steel">Giro *</span>
                    <select value={org.giro} onChange={(e) => setOrg({ ...org, giro: e.target.value })} className={inputCls}>
                      <option value="">Selecciona</option>
                      {GIROS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-steel">Personas en el inmueble (trabajadores y visitantes) *</span>
                    <select value={org.personas} onChange={(e) => setOrg({ ...org, personas: e.target.value })} className={inputCls}>
                      <option value="">Selecciona</option>
                      {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-steel">Superficie construida aproximada</span>
                    <select value={org.superficie} onChange={(e) => setOrg({ ...org, superficie: e.target.value })} className={inputCls}>
                      {SUPERFICIE.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-steel">Estado *</span>
                    <select value={org.estado} onChange={(e) => setOrg({ ...org, estado: e.target.value })} className={inputCls}>
                      <option value="">Selecciona</option>
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
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
                      <span className="font-display text-lg text-navy">3 · Marca tu predio</span>
                      <span className="block text-xs text-steel">
                        Opcional · {markers.length > 0
                          ? `${markers.length} marcador${markers.length !== 1 ? "es" : ""} colocado${markers.length !== 1 ? "s" : ""}`
                          : "señala accesos, puntos ciegos y zonas que te preocupan"}
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
                  Déjanos un correo y un teléfono de contacto para ver tu resultado y descargar tu diagnóstico básico en PDF. Es gratis.
                </p>
              </div>
              <section className="border border-navy/15 bg-white p-6 md:p-8">
                <form onSubmit={submitGate} className="space-y-4">
                  <input type="text" tabIndex={-1} autoComplete="off" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" aria-hidden />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input required type="email" autoComplete="email" placeholder="Correo *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                    <input required type="tel" autoComplete="tel" inputMode="tel" placeholder="Teléfono (10 dígitos) *" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} className={inputCls} />
                    <input autoComplete="name" placeholder="Nombre (opcional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                    <input autoComplete="organization" placeholder="Empresa o institución (opcional)" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} className={inputCls} />
                  </div>
                  <label className="flex items-start gap-3 border border-steel/20 bg-smoke/60 px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.checked })} className="mt-1 h-4 w-4 accent-[#0B1F3A]" />
                    <span className="text-sm text-navy">
                      Deseo que un asesor de STRATEC me contacte
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
                      const svc = SERVICES[q.services[0]];
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
