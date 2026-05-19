import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { KpiCard } from "@/components/app/KpiCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Target, TrendingUp, CalendarCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

const Dashboard = () => {
  const [kpi, setKpi] = useState({ leads: 0, pipeline: 0, conv: "0%", appts: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [trend, setTrend] = useState<{ d: string; v: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: leads }, { data: deals }, { count: appts }, { data: leadsList }] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("deals").select("value_amount, stage"),
        supabase.from("appointments").select("*", { count: "exact", head: true }).gte("starts_at", new Date().toISOString()),
        supabase.from("leads").select("id, full_name, organization, status, created_at").order("created_at", { ascending: false }).limit(6),
      ]);
      const pipelineValue = (deals ?? []).filter(d => !["cierre", "perdido"].includes(d.stage)).reduce((s, d) => s + Number(d.value_amount), 0);
      const closed = (deals ?? []).filter(d => d.stage === "cierre").length;
      const total = (deals ?? []).length;
      setKpi({
        leads: leads ?? 0,
        pipeline: pipelineValue,
        conv: total ? `${Math.round((closed / total) * 100)}%` : "0%",
        appts: appts ?? 0,
      });
      setRecent(leadsList ?? []);
      // mock trend (last 14 days)
      const t = Array.from({ length: 14 }, (_, i) => ({
        d: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString("es", { day: "2-digit", month: "short" }),
        v: Math.floor(Math.random() * 8) + 2,
      }));
      setTrend(t);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Panel ejecutivo"
        title="Estado operativo"
        description="Métricas consolidadas de adquisición, pipeline y agenda institucional."
        actions={<Button asChild className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10"><Link to="/app/leads">Nuevo lead</Link></Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Leads · 30d" value={String(kpi.leads)} icon={Target} hint="adquisición reciente" />
        <KpiCard label="Pipeline activo" value={`$${kpi.pipeline.toLocaleString("en-US")}`} icon={Briefcase} hint="valor en negociación" />
        <KpiCard label="Tasa de cierre" value={kpi.conv} icon={TrendingUp} hint="acumulada" />
        <KpiCard label="Citas próximas" value={String(kpi.appts)} icon={CalendarCheck} hint="agenda 14d" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border bg-card p-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="eyebrow mb-1">— Tendencia</div>
              <div className="font-display text-xl text-navy">Adquisición de leads (14d)</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 12, bottom: 5, left: -10 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                <Line type="monotone" dataKey="v" stroke="hsl(var(--navy))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--olive))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-6">
          <div className="eyebrow mb-1">— Reciente</div>
          <div className="font-display text-xl text-navy mb-4">Últimos leads</div>
          {recent.length === 0 && <div className="text-sm text-steel py-8 text-center">Sin registros aún.</div>}
          <div className="divide-y divide-border">
            {recent.map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-navy truncate">{l.full_name}</div>
                  <div className="text-xs text-steel truncate">{l.organization ?? "—"}</div>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
