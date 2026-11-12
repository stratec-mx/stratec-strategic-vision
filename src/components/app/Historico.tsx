// Histórico de leads y cotizaciones por día, mes o año, en orden cronológico.
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { agruparHistorico, type Escala, type FilaCotizacion, type FilaFecha } from "@/lib/historico";

const dinero = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const ESCALAS: { id: Escala; label: string }[] = [
  { id: "dia", label: "Día" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
];

export const Historico = ({ leads, cotizaciones }: { leads: FilaFecha[]; cotizaciones: FilaCotizacion[] }) => {
  const [escala, setEscala] = useState<Escala>("mes");
  const datos = useMemo(() => agruparHistorico(leads, cotizaciones, escala), [leads, cotizaciones, escala]);
  const otrasMonedas = cotizaciones.filter((q) => q.currency !== "MXN").length;
  const total = datos.reduce(
    (a, p) => ({ leads: a.leads + p.leads, cotizaciones: a.cotizaciones + p.cotizaciones, monto: a.monto + p.monto, aceptadas: a.aceptadas + p.aceptadas, montoAceptado: a.montoAceptado + p.montoAceptado }),
    { leads: 0, cotizaciones: 0, monto: 0, aceptadas: 0, montoAceptado: 0 },
  );

  return (
    <div className="border border-border bg-card p-6 mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="eyebrow mb-1">— Histórico</div>
          <div className="font-display text-xl text-navy">Leads y cotizaciones por {escala === "dia" ? "día (últimos 31)" : escala === "mes" ? "mes" : "año"}</div>
        </div>
        <div className="flex border border-border" role="group" aria-label="Escala del histórico">
          {ESCALAS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEscala(e.id)}
              aria-pressed={escala === e.id}
              className={`px-4 h-9 text-xs uppercase tracking-wider transition-colors ${escala === e.id ? "bg-navy text-smoke" : "text-steel hover:text-navy"}`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fontSize: 10, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="leads" name="Leads" fill="hsl(var(--olive))" />
            <Bar dataKey="cotizaciones" name="Cotizaciones" fill="hsl(var(--navy))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 max-h-96 overflow-y-auto border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow className="border-border">
              <TableHead className="text-xs uppercase tracking-wider text-steel">Periodo</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-steel text-right">Leads</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-steel text-right">Cotizaciones</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-steel text-right">Monto cotizado</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-steel text-right">Aceptadas</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-steel text-right">Monto aceptado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datos.map((p) => (
              <TableRow key={p.clave} className={`border-border ${p.leads + p.cotizaciones === 0 ? "text-steel/60" : ""}`}>
                <TableCell className="text-sm text-navy">{p.etiqueta}</TableCell>
                <TableCell className="text-sm text-right">{p.leads}</TableCell>
                <TableCell className="text-sm text-right">{p.cotizaciones}</TableCell>
                <TableCell className="text-sm text-right">{p.monto ? dinero(p.monto) : "—"}</TableCell>
                <TableCell className="text-sm text-right">{p.aceptadas}</TableCell>
                <TableCell className="text-sm text-right">{p.montoAceptado ? dinero(p.montoAceptado) : "—"}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-border bg-secondary/40 font-medium">
              <TableCell className="text-sm text-navy">Total</TableCell>
              <TableCell className="text-sm text-right">{total.leads}</TableCell>
              <TableCell className="text-sm text-right">{total.cotizaciones}</TableCell>
              <TableCell className="text-sm text-right">{dinero(total.monto)}</TableCell>
              <TableCell className="text-sm text-right">{total.aceptadas}</TableCell>
              <TableCell className="text-sm text-right">{dinero(total.montoAceptado)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-[11px] text-steel mt-2">
        Montos con IVA, solo en pesos (MXN){otrasMonedas ? `; ${otrasMonedas} cotizacion${otrasMonedas === 1 ? "" : "es"} en otra moneda no se suman` : ""}. Fechas en hora de Cuernavaca.
      </p>
    </div>
  );
};
