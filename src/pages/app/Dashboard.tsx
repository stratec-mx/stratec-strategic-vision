import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { KpiCard } from "@/components/app/KpiCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Target, TrendingUp, CalendarCheck, Briefcase, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { GooglePublico } from "@/components/app/GooglePublico";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [kpi, setKpi] = useState({ leads: 0, pipeline: 0, conv: "0%", appts: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [trend, setTrend] = useState<{ d: string; v: number }[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: leads }, { data: deals }, { count: appts }, { data: leadsList }, { data: apptsList }] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("deals").select("value_amount, stage"),
        supabase.from("appointments").select("*", { count: "exact", head: true }).gte("starts_at", new Date().toISOString()),
        supabase.from("leads").select("id, full_name, organization, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("appointments").select("id, title, starts_at, ends_at, attendee_name, organization, location").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(5),
      ]);
      const { data: leads14 } = await supabase.from("leads").select("created_at").gte("created_at", new Date(Date.now() - 15 * 86400000).toISOString());
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
      setUpcomingAppts(apptsList ?? []);
      const diaMx = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
      const porDia = new Map<string, number>();
      for (const l of leads14 ?? []) {
        const k = diaMx(new Date(l.created_at));
        porDia.set(k, (porDia.get(k) ?? 0) + 1);
      }
      const t = Array.from({ length: 14 }, (_, i) => {
        const fecha = new Date(Date.now() - (13 - i) * 86400000);
        return {
          d: fecha.toLocaleDateString("es", { day: "2-digit", month: "short", timeZone: "America/Mexico_City" }),
          v: porDia.get(diaMx(fecha)) ?? 0,
        };
      });
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
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                <Line type="monotone" dataKey="v" name="Leads" stroke="hsl(var(--navy))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--olive))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-border bg-card p-6">
            <div className="eyebrow mb-1">— Reciente</div>
            <div className="font-display text-xl text-navy mb-4">Últimos leads</div>
            {recent.length === 0 && <div className="text-sm text-steel py-6 text-center">Sin registros aún.</div>}
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
            <Link to="/app/leads" className="mt-3 block text-xs text-olive uppercase tracking-wider hover:underline">Ver todos →</Link>
          </div>

          <div className="border border-border bg-card p-6">
            <div className="eyebrow mb-1">— Agenda</div>
            <div className="font-display text-xl text-navy mb-4">Próximas citas</div>
            {upcomingAppts.length === 0 && <div className="text-sm text-steel py-6 text-center">Sin citas programadas.</div>}
            <div className="divide-y divide-border">
              {upcomingAppts.map((a) => {
                const start = new Date(a.starts_at);
                const end = new Date(a.ends_at);
                return (
                  <div key={a.id} className="py-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-olive mb-0.5">
                      {start.toLocaleDateString("es", { weekday: "short", day: "2-digit", month: "short" })}
                    </div>
                    <div className="text-sm text-navy font-medium truncate">{a.title}</div>
                    <div className="mt-1 space-y-0.5 text-xs text-steel">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        {start.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {a.attendee_name && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 shrink-0" />
                          {a.attendee_name}{a.organization ? ` · ${a.organization}` : ""}
                        </div>
                      )}
                      {a.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {a.location}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/app/agenda" className="mt-3 block text-xs text-olive uppercase tracking-wider hover:underline">Ver agenda completa →</Link>
          </div>
        </div>
      </div>

      {isAdmin && <GooglePublico />}
    </div>
  );
};

export default Dashboard;
