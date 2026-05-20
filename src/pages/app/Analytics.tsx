import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { KpiCard } from "@/components/app/KpiCard";
import { TrendingUp, Target, DollarSign, Percent } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STAGE_LABEL: Record<string, string> = {
  prospeccion: "Prospección", diagnostico: "Diagnóstico", propuesta: "Propuesta",
  negociacion: "Negociación", cierre: "Cierre", perdido: "Perdido",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Nuevos", contacted: "Contactados", qualified: "Calificados",
  unqualified: "Descartados", converted: "Convertidos",
};
const SOURCE_LABEL: Record<string, string> = {
  web: "Web", referral: "Referido", event: "Evento", outbound: "Outbound", partner: "Aliado", other: "Otro",
};

const PALETTE = ["hsl(var(--navy))", "hsl(var(--olive))", "hsl(var(--steel))", "#8b9bb4", "#c9b99a", "#4a6741"];

const Analytics = () => {
  const [funnel, setFunnel] = useState<{ name: string; v: number }[]>([]);
  const [byStage, setByStage] = useState<{ name: string; v: number; amt: number }[]>([]);
  const [bySource, setBySource] = useState<{ name: string; v: number }[]>([]);
  const [kpi, setKpi] = useState({ totalLeads: 0, totalPipeline: 0, conv: 0, avgDeal: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: leads }, { data: deals }] = await Promise.all([
        supabase.from("leads").select("status, source"),
        supabase.from("deals").select("stage, value_amount"),
      ]);

      const ls = leads ?? [];
      const ds = deals ?? [];

      const fnOrder = ["new", "contacted", "qualified", "converted"];
      setFunnel(fnOrder.map(s => ({ name: STATUS_LABEL[s], v: ls.filter(l => l.status === s).length })));

      const stageOrder = ["prospeccion", "diagnostico", "propuesta", "negociacion", "cierre", "perdido"];
      setByStage(stageOrder.map(s => {
        const items = ds.filter(d => d.stage === s);
        return { name: STAGE_LABEL[s], v: items.length, amt: items.reduce((a, b) => a + Number(b.value_amount), 0) };
      }));

      const sources = Object.keys(SOURCE_LABEL);
      setBySource(sources.map(s => ({ name: SOURCE_LABEL[s], v: ls.filter(l => l.source === s).length })).filter(x => x.v > 0));

      const totalPipeline = ds.filter(d => !["cierre", "perdido"].includes(d.stage)).reduce((a, b) => a + Number(b.value_amount), 0);
      const closed = ds.filter(d => d.stage === "cierre");
      const converted = ls.filter(l => l.status === "converted").length;
      setKpi({
        totalLeads: ls.length,
        totalPipeline,
        conv: ls.length ? Math.round((converted / ls.length) * 100) : 0,
        avgDeal: closed.length ? closed.reduce((a, b) => a + Number(b.value_amount), 0) / closed.length : 0,
      });
    })();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Inteligencia"
        title="Analítica corporativa"
        description="Funnel de conversión, distribución por etapa y origen de la demanda."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Leads totales" value={String(kpi.totalLeads)} icon={Target} hint="histórico" />
        <KpiCard label="Pipeline activo" value={`$${kpi.totalPipeline.toLocaleString("en-US")}`} icon={DollarSign} hint="valor en negociación" />
        <KpiCard label="Conversión" value={`${kpi.conv}%`} icon={Percent} hint="leads → convertidos" />
        <KpiCard label="Ticket promedio" value={`$${Math.round(kpi.avgDeal).toLocaleString("en-US")}`} icon={TrendingUp} hint="deals cerrados" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card p-6">
          <div className="eyebrow mb-1">— Funnel</div>
          <div className="font-display text-xl text-navy mb-6">Conversión de leads</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 12 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                <Bar dataKey="v" fill="hsl(var(--navy))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-6">
          <div className="eyebrow mb-1">— Pipeline</div>
          <div className="font-display text-xl text-navy mb-6">Deals por etapa</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStage} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                <Bar dataKey="v" fill="hsl(var(--olive))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-6 lg:col-span-2">
          <div className="eyebrow mb-1">— Origen</div>
          <div className="font-display text-xl text-navy mb-6">Distribución por fuente de lead</div>
          {bySource.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-steel">Sin datos suficientes.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bySource} dataKey="v" nameKey="name" outerRadius={100} innerRadius={60}>
                    {bySource.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
