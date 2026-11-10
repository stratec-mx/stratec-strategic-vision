// Diagnóstico de vulnerabilidad — entrada pública de clientes (lead magnet).
// Flujo: ubicar el predio en el mapa → cuestionario ISO 31000 → nivel de
// vulnerabilidad + plan de acción → captura de lead (Supabase submit-lead).

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, ArrowRight, CheckCircle2, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SecurityMap } from "@/components/security-map/SecurityMap";
import { SecurityMarker, DEFAULT_MARKER_KINDS } from "@/components/security-map/types";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";

const SUPABASE_URL = "https://xtfsqdwkbsghkzszpisz.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZnNxZHdrYnNnaGt6c3pwaXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODAyMjYsImV4cCI6MjA5NTY1NjIyNn0.g0lUqVc-454htPpGPCAJXovZE4hmmnsaxKzuYZUZ60A";

type Answer = "si" | "no" | "ns";

interface Service {
  short: string;
  url: string;
  color: string;
  bg: string;
}

const SERVICES: Record<string, Service> = {
  consultoria:  { short: "Consultoría en Seguridad", url: "/servicios/consultoria-seguridad",     color: "#0B1F3A", bg: "rgba(11,31,58,0.08)" },
  proteccion:   { short: "Protección Civil",         url: "/servicios/proteccion-civil",          color: "#7B4A1E", bg: "rgba(123,74,30,0.08)" },
  capacitacion: { short: "Capacitación",             url: "/servicios/capacitacion",              color: "#5E646E", bg: "rgba(94,100,110,0.1)" },
  revision:     { short: "Revisión de Programa Interno", url: "/servicios/revision-programa-interno", color: "#7B4A1E", bg: "rgba(123,74,30,0.08)" },
  protocolos:   { short: "Protocolos de Seguridad",  url: "/servicios/protocolos-seguridad",      color: "#0B1F3A", bg: "rgba(11,31,58,0.08)" },
  tecnologia:   { short: "Tecnología de Seguridad",  url: "/servicios/integracion-tecnologica",   color: "#9a7d2f", bg: "rgba(196,160,74,0.12)" },
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

const SECTORES = ["Gobierno / Institución pública", "Corporativo / Empresa", "Educación", "Industria / Planta", "Inmobiliario / Condominio", "Salud", "Comercio", "Otro"];

export default function Diagnostico() {
  const { toast } = useToast();
  const [markers, setMarkers] = useState<SecurityMarker[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [phase, setPhase] = useState<"quiz" | "result" | "done">("quiz");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", org: "", email: "", tel: "", sector: "", hp: "" });

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

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
      body: "Los resultados indican múltiples brechas en protocolos, protección civil, capacitación y tecnología. Se recomienda una evaluación integral urgente." };
  }, [score]);

  const failed = useMemo(() => QUESTIONS.filter((q) => answers[q.id] === "no" || answers[q.id] === "ns"), [answers]);
  const fmt = (n: number) => (n === Math.floor(n) ? n.toString() : n.toFixed(1));

  const setAnswer = (id: number, val: Answer) => setAnswers((a) => ({ ...a, [id]: val }));

  const goResult = () => {
    if (!allAnswered) {
      toast({ title: "Faltan preguntas", description: "Responde las 10 preguntas para ver tu resultado.", variant: "destructive" });
      return;
    }
    track.diagnosticoResultado(level.key);
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.org.trim() || !form.email.trim()) {
      toast({ title: "Campos requeridos", description: "Completa nombre, empresa y correo.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Correo inválido", description: "Ingresa un correo válido.", variant: "destructive" });
      return;
    }
    const servicios = [...new Set(failed.flatMap((q) => q.services))].map((s) => SERVICES[s].short).join(" · ") || "Evaluación general";
    const msg = `Diagnóstico de vulnerabilidad — Score: ${fmt(score)}/10 (${level.label}) | Sector: ${form.sector || "No especificado"} | Marcadores en mapa: ${markers.length} | Servicios sugeridos: ${servicios}`;

    setSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
        body: JSON.stringify({
          name: form.name, email: form.email, organization: form.org,
          role: form.sector, telefono: form.tel, servicio: servicios,
          message: msg, honeypot: form.hp,
        }),
      });
      // fetch solo lanza en error de red: un 4xx/5xx de la Edge Function llega
      // como respuesta "exitosa". Sin este check el lead se pierde y el usuario
      // ve "enviado".
      if (!res.ok) throw new Error(`submit-lead ${res.status}`);
      track.diagnosticoLead(level.key, form.sector);
      setPhase("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast({ title: "No se pudo enviar", description: "Intenta de nuevo en un momento, o escríbenos por WhatsApp con tu resultado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const waText = encodeURIComponent(`Hola STRATEC, hice el diagnóstico de vulnerabilidad (nivel: ${level.label}, score ${fmt(score)}/10) y quiero agendar mi evaluación.`);

  return (
    <div className="min-h-screen bg-smoke">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-wide max-w-3xl mx-auto px-4">

          {/* ── FASE CUESTIONARIO ── */}
          {phase === "quiz" && (
            <>
              <div className="eyebrow mb-3">— Diagnóstico gratuito</div>
              <h1 className="font-display text-3xl md:text-4xl text-navy font-light leading-tight mb-4">
                Identifica qué tan vulnerable te encuentras
              </h1>
              <p className="text-steel text-sm md:text-base leading-relaxed mb-8 max-w-2xl">
                Evaluación guiada basada en la metodología <strong>ISO 31000</strong> de gestión de riesgos.
                Responde 10 preguntas y obtén tu nivel de vulnerabilidad con un plan de acción priorizado. Toma unos 3 minutos.
              </p>

              {/* 1 · Cuestionario — la acción central va primero */}
              <section className="mb-10">
                <h2 className="font-display text-xl text-navy mb-1 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#C4A04A]" /> 1 · Responde el cuestionario
                </h2>
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
                          // leading-tight deja que "No estoy seguro" parta en 2 líneas sin apretarse.
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

              {/* 2 · Mapa del predio — opcional y plegado: no estorba el camino
                  principal, y Leaflet solo se carga si el usuario lo abre. */}
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
                      <span className="font-display text-lg text-navy">2 · Marca tu predio</span>
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

              <section>
                <button
                  onClick={goResult}
                  disabled={!allAnswered}
                  className="mt-8 w-full h-14 bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Ver mi nivel de vulnerabilidad <ArrowRight className="h-4 w-4" />
                </button>
              </section>
            </>
          )}

          {/* ── FASE RESULTADO + GATE ── */}
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

              {/* Vulnerabilidades detectadas */}
              {failed.length > 0 && (
                <section className="mb-10">
                  <h2 className="font-display text-lg text-navy mb-4">
                    {failed.length} área{failed.length > 1 ? "s" : ""} con vulnerabilidad detectada{failed.length > 1 ? "s" : ""}
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
                          <span className="text-[0.7rem] px-2 py-1 self-start whitespace-nowrap" style={{ color: svc.color, backgroundColor: svc.bg }}>{svc.short}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Gate de captura */}
              <section className="border border-navy/15 bg-white p-6 md:p-8">
                <h2 className="font-display text-xl text-navy mb-2">Recibe tu diagnóstico completo</h2>
                <p className="text-sm text-steel mb-6">
                  Te enviamos el reporte detallado con el plan de acción priorizado y las referencias normativas aplicables. Sin costo.
                </p>
                <form onSubmit={submitGate} className="space-y-4">
                  <input type="text" tabIndex={-1} autoComplete="off" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" aria-hidden />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input required placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 px-3 border border-steel/25 text-sm text-navy focus:border-[#C4A04A] focus:outline-none" />
                    <input required placeholder="Empresa / institución *" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} className="h-11 px-3 border border-steel/25 text-sm text-navy focus:border-[#C4A04A] focus:outline-none" />
                    <input required type="email" placeholder="Correo *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 px-3 border border-steel/25 text-sm text-navy focus:border-[#C4A04A] focus:outline-none" />
                    <input placeholder="Teléfono (opcional)" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} className="h-11 px-3 border border-steel/25 text-sm text-navy focus:border-[#C4A04A] focus:outline-none" />
                  </div>
                  <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="w-full h-11 px-3 border border-steel/25 text-sm text-navy focus:border-[#C4A04A] focus:outline-none">
                    <option value="">Sector (opcional)</option>
                    {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="submit" disabled={submitting} className="w-full h-14 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold uppercase tracking-wider text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <>Recibir mi diagnóstico <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-[0.7rem] text-steel/70 text-center">Tus datos se tratan de forma confidencial conforme a nuestra política de privacidad.</p>
                </form>
              </section>
            </motion.div>
          )}

          {/* ── FASE CONFIRMACIÓN ── */}
          {phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h1 className="font-display text-3xl text-navy font-light mb-3">Diagnóstico enviado</h1>
              <p className="text-steel max-w-lg mx-auto mb-2">
                Gracias, {form.name.split(" ")[0] || "equipo"}. Tu nivel de vulnerabilidad es <strong style={{ color: level.color }}>{level.label.toLowerCase()}</strong> (score {fmt(score)}/10).
              </p>
              <p className="text-sm text-steel/80 max-w-lg mx-auto mb-8">
                Recibirás el reporte completo en tu correo. Si quieres avanzar de inmediato, agenda tu evaluación por WhatsApp.
              </p>
              <a href={`https://wa.me/522206488688?text=${waText}`} target="_blank" rel="noopener noreferrer" onClick={() => track.whatsappClick("diagnostico")}
                 className="inline-flex items-center gap-2 bg-navy hover:bg-navy-deep text-smoke px-8 py-4 uppercase tracking-wider text-sm transition-colors">
                Agendar evaluación por WhatsApp <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
