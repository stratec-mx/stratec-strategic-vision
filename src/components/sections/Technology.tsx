import { motion } from "framer-motion";
import { Activity, AlertTriangle, ShieldCheck, Globe2 } from "lucide-react";

const kpis = [
  { label: "Activos monitoreados", value: "12,847", delta: "+2.4%" },
  { label: "Incidentes prevenidos", value: "98.7%", delta: "+0.6%" },
  { label: "Tiempo de respuesta", value: "1.8m", delta: "−12%" },
  { label: "Cobertura institucional", value: "24/7", delta: "Global" },
];

const events = [
  { lvl: "low", text: "Verificación perimetral completada — Sector 7-A" },
  { lvl: "mid", text: "Anomalía de acceso registrada — Auditoría en curso" },
  { lvl: "low", text: "Sincronización de inteligencia regional finalizada" },
  { lvl: "high", text: "Escenario de riesgo escalado a comité ejecutivo" },
  { lvl: "low", text: "Reporte trimestral enviado al cliente institucional" },
];

const lvlColor = { low: "bg-olive", mid: "bg-amber-500", high: "bg-red-500" } as const;

export const Technology = () => {
  return (
    <section id="technology" className="py-32 bg-smoke">
      <div className="container-wide">
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-6">
            <div className="eyebrow mb-6">— Tecnología e Innovación</div>
            <h2 className="font-display text-4xl md:text-5xl font-light text-navy leading-tight text-balance">
              Tecnología de seguridad: videovigilancia IA, biometría y automatización.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
            <p className="text-steel text-lg font-light leading-relaxed">
              Integramos analítica avanzada, monitoreo continuo y visualización
              ejecutiva en una sola interfaz de control estratégico.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-navy-deep text-smoke rounded-sm shadow-elevated overflow-hidden border border-navy"
        >
          {/* Dashboard header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-smoke/10 bg-navy">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-olive animate-pulse" />
              <span className="font-mono-ibm text-xs tracking-widest uppercase text-smoke/70">STRATEC · Strategic Control Center</span>
            </div>
            <div className="hidden md:flex gap-6 text-[10px] uppercase tracking-widest text-smoke/40">
              <span>Live</span>
              <span>v 4.2.1</span>
              <span>CDMX · 18:42</span>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-smoke/5">
            {kpis.map((k) => (
              <div key={k.label} className="bg-navy-deep p-6">
                <div className="text-[10px] uppercase tracking-widest text-smoke/40">{k.label}</div>
                <div className="mt-3 text-3xl font-light">{k.value}</div>
                <div className="mt-1 text-xs text-olive">{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Chart + events */}
          <div className="grid lg:grid-cols-3 gap-px bg-smoke/5">
            <div className="lg:col-span-2 bg-navy-deep p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-smoke/60">
                  <Activity className="h-4 w-4 text-olive" /> Índice de riesgo · 30 días
                </div>
                <div className="text-xs text-smoke/40 font-mono-ibm">IDX-RISK-2025</div>
              </div>
              <ChartSvg />
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[
                  { i: Globe2, l: "Cobertura", v: "8 países" },
                  { i: ShieldCheck, l: "Sistemas", v: "Operativos" },
                  { i: AlertTriangle, l: "Alertas", v: "3 activas" },
                  { i: Activity, l: "Uptime", v: "99.98%" },
                ].map((b) => (
                  <div key={b.l} className="border-t border-smoke/10 pt-3">
                    <b.i className="h-4 w-4 text-olive mb-2" />
                    <div className="text-[10px] uppercase tracking-widest text-smoke/40">{b.l}</div>
                    <div className="text-sm text-smoke mt-1">{b.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-navy-deep p-6">
              <div className="text-xs uppercase tracking-widest text-smoke/60 mb-6">Bitácora operativa</div>
              <ul className="space-y-4">
                {events.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-smoke/70 leading-relaxed">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${lvlColor[e.lvl as keyof typeof lvlColor]}`} />
                    <span>{e.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ChartSvg = () => (
  <svg viewBox="0 0 600 160" className="w-full h-40">
    <defs>
      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="hsl(62 31% 50%)" stopOpacity="0.4" />
        <stop offset="100%" stopColor="hsl(62 31% 50%)" stopOpacity="0" />
      </linearGradient>
    </defs>
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1="0" x2="600" y1={i * 40 + 20} y2={i * 40 + 20} stroke="hsl(60 11% 97% / 0.06)" />
    ))}
    <path
      d="M0 110 L50 95 L100 105 L150 80 L200 90 L250 60 L300 75 L350 50 L400 65 L450 40 L500 55 L550 30 L600 45 L600 160 L0 160 Z"
      fill="url(#g1)"
    />
    <path
      d="M0 110 L50 95 L100 105 L150 80 L200 90 L250 60 L300 75 L350 50 L400 65 L450 40 L500 55 L550 30 L600 45"
      fill="none" stroke="hsl(62 31% 55%)" strokeWidth="1.5"
    />
  </svg>
);
