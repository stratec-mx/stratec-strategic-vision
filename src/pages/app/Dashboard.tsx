// Panel general (diseño aprobado). Cada número sale de la base de datos;
// las secciones de módulos que aún no tienen tablas muestran un estado vacío honesto.
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge, STATUS_LABEL } from "@/components/app/StatusBadge";
import { GooglePublico } from "@/components/app/GooglePublico";
import {
  DIAS_SIN_RESPUESTA, ZONA, agendaHoyManana, diaMx, fechaCortaMx, haceCuanto, interesLead, origenLead,
  resumenCitas, resumenCotizaciones, resumenCsv, resumenProspectos,
  type CitaFila, type CotizacionFila, type LeadFila,
} from "@/lib/panelGeneral";

const DIA_MS = 86_400_000;

type Datos = {
  corte: Date;
  leads30: Pick<LeadFila, "status" | "created_at">[] | null;
  recientes: LeadFila[] | null;
  cotizaciones: CotizacionFila[] | null;
  citas: CitaFila[] | null;
  clientes: { activos: number; total: number } | null;
  negocios: { abiertos: number; valor: number } | null;
};

const fmtMoneda = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const fechaLarga = (d: Date) => {
  const s = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const hora = (d: Date) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA });

const Seccion = ({ id, titulo, extra, children, className = "" }: { id: string; titulo: string; extra?: ReactNode; children: ReactNode; className?: string }) => (
  <section aria-labelledby={id} className={`min-w-0 overflow-hidden rounded-lg border border-pn-borde bg-white ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-pn-borde px-4 py-3.5">
      <h2 id={id} className="text-[15px] font-semibold text-pn-texto">{titulo}</h2>
      {extra}
    </div>
    {children}
  </section>
);

const Th = ({ children, right = false }: { children: ReactNode; right?: boolean }) => (
  <th scope="col" className={`whitespace-nowrap border-b border-pn-borde bg-pn-calido px-3 py-2.5 ${right ? "text-right" : "text-left"}`}>{children}</th>
);

const Vacio = ({ children }: { children: ReactNode }) => <p className="px-4 py-8 text-center text-[13px] text-pn-sub">{children}</p>;

const Dashboard = () => {
  const { isAdmin, can } = useAuth();
  const verLeads = can("leads");
  const verCotizaciones = can("quotes");
  const verAgenda = can("agenda");
  const verClientes = can("clients");
  const verNegocios = can("pipeline");
  const [d, setD] = useState<Datos | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const ahora = Date.now();
      const iso = (ms: number) => new Date(ms).toISOString();
      const nada = Promise.resolve({ data: null, error: null, count: null });
      const [leads30, recientes, cotizaciones, citasVentana, proxima, clientesAct, clientesTot, negocios] = await Promise.all([
        verLeads ? supabase.from("leads").select("status, created_at").gte("created_at", iso(ahora - 30 * DIA_MS)) : nada,
        verLeads
          ? supabase.from("leads").select("id, full_name, organization, source, status, notes, created_at").order("created_at", { ascending: false }).limit(5)
          : nada,
        // Las enviadas (por responder) y todas las de los últimos 40 días (para el mes en curso)
        verCotizaciones
          ? supabase.from("quotes").select("id, number, status, created_at, updated_at").or(`status.eq.sent,created_at.gte."${iso(ahora - 40 * DIA_MS)}"`)
          : nada,
        verAgenda
          ? supabase.from("appointments").select("id, title, starts_at, ends_at, attendee_name, organization, location")
            .gte("starts_at", iso(ahora - 36 * 3_600_000)).lte("starts_at", iso(ahora + 60 * 3_600_000)).order("starts_at")
          : nada,
        verAgenda
          ? supabase.from("appointments").select("id, title, starts_at").gte("starts_at", iso(ahora)).order("starts_at").limit(1)
          : nada,
        verClientes ? supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active") : nada,
        verClientes ? supabase.from("clients").select("id", { count: "exact", head: true }) : nada,
        verNegocios ? supabase.from("deals").select("value_amount, stage") : nada,
      ]);
      if (!vigente) return;
      const ok = <T,>(r: { data: unknown; error: unknown }, activo: boolean) => (activo && !r.error ? ((r.data ?? []) as T) : null);
      const citas = ok<CitaFila[]>(citasVentana, verAgenda);
      const prox = ok<CitaFila[]>(proxima, verAgenda) ?? [];
      const abiertos = (ok<{ value_amount: number; stage: string }[]>(negocios, verNegocios) ?? []).filter((x) => !["cierre", "perdido"].includes(x.stage));
      setD({
        corte: new Date(),
        leads30: ok(leads30, verLeads),
        recientes: ok(recientes, verLeads),
        cotizaciones: ok(cotizaciones, verCotizaciones),
        citas: citas ? [...citas, ...prox.filter((p) => !citas.some((c) => c.id === p.id))] : null,
        clientes: verClientes && !clientesAct.error && !clientesTot.error ? { activos: clientesAct.count ?? 0, total: clientesTot.count ?? 0 } : null,
        negocios: verNegocios && !negocios.error ? { abiertos: abiertos.length, valor: abiertos.reduce((s, x) => s + Number(x.value_amount), 0) } : null,
      });
    })();
    return () => { vigente = false; };
  }, [verLeads, verCotizaciones, verAgenda, verClientes, verNegocios]);

  const calc = useMemo(() => {
    if (!d) return null;
    const now = d.corte;
    return {
      prospectos: d.leads30 && resumenProspectos(d.leads30, now),
      cotizaciones: d.cotizaciones && resumenCotizaciones(d.cotizaciones, now),
      citas: d.citas && resumenCitas(d.citas, now),
      agenda: d.citas && agendaHoyManana(d.citas, now),
      tendencia: d.leads30 && Array.from({ length: 14 }, (_, i) => {
        const fecha = new Date(now.getTime() - (13 - i) * DIA_MS);
        const dia = diaMx(fecha);
        return { d: fechaCortaMx(fecha), v: d.leads30!.filter((l) => diaMx(l.created_at) === dia).length };
      }),
    };
  }, [d]);

  type Kpi = { label: string; value: string; note: string; color?: string };
  const kpis: Kpi[] = [];
  if (verLeads) {
    const p = calc?.prospectos;
    kpis.push({
      label: "Prospectos nuevos (30 días)", value: p ? String(p.nuevos) : "—",
      note: !p ? "No disponible" : p.sinContacto ? `${p.sinContacto} sin primer contacto` : "Todos con primer contacto",
      color: p?.sinContacto ? "#B42318" : undefined,
    });
  }
  if (verCotizaciones) {
    const q = calc?.cotizaciones;
    kpis.push({
      label: "Cotizaciones por responder", value: q ? String(q.porResponder) : "—",
      note: !q ? "No disponible" : q.sinRespuesta ? `${q.sinRespuesta} con más de ${DIAS_SIN_RESPUESTA} días` : `Ninguna con más de ${DIAS_SIN_RESPUESTA} días`,
      color: q?.sinRespuesta ? "#B7791F" : undefined,
    });
  }
  if (verAgenda) {
    const c = calc?.citas;
    kpis.push({ label: "Citas de hoy", value: c ? String(c.hoy) : "—", note: c ? c.nota : "No disponible" });
  }
  if (verClientes) {
    const c = d?.clientes;
    kpis.push({ label: "Clientes activos", value: c ? String(c.activos) : "—", note: c ? `${c.total} en cartera` : "No disponible" });
  }
  if (verNegocios) {
    const n = d?.negocios;
    kpis.push({ label: "Negocios abiertos", value: n ? String(n.abiertos) : "—", note: n ? `${fmtMoneda(n.valor)} en negociación` : "No disponible" });
  }

  const exportar = () => {
    if (!d || !calc) return;
    const filas: Parameters<typeof resumenCsv>[0] = [
      { seccion: "Corte", concepto: fechaLarga(d.corte), valor: `${hora(d.corte)} h` },
      ...kpis.map((k) => ({ seccion: "Indicadores", concepto: k.label, valor: k.value, detalle: k.note })),
    ];
    if (calc.cotizaciones) {
      for (const [s, n] of Object.entries(calc.cotizaciones.porEstado)) {
        filas.push({ seccion: "Cotizaciones del mes", concepto: STATUS_LABEL[s] ?? s, valor: n });
      }
    }
    for (const c of calc.agenda ?? []) {
      filas.push({ seccion: "Agenda", concepto: c.title, valor: `${c.dia === "hoy" ? "Hoy" : "Mañana"} ${c.hora}`, detalle: [c.attendee_name, c.organization, c.location].filter(Boolean).join(" · ") });
    }
    for (const l of d.recientes ?? []) {
      filas.push({ seccion: "Prospectos recientes", concepto: l.full_name, valor: STATUS_LABEL[l.status] ?? l.status, detalle: `${origenLead(l)} · ${interesLead(l)} · ${fechaCortaMx(l.created_at)}` });
    }
    const url = URL.createObjectURL(new Blob([resumenCsv(filas)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `stratec-resumen-${diaMx(d.corte)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const q = calc?.cotizaciones;
  const BARRAS = [
    { k: "draft", label: "Borrador", color: "#C9CFD8" },
    { k: "sent", label: "Enviadas", color: "#5E646E" },
    { k: "accepted", label: "Aceptadas", color: "#287A59" },
    { k: "rejected", label: "Rechazadas", color: "#B42318" },
    { k: "expired", label: "Expiradas", color: "#B7791F" },
  ] as const;
  const barras = q ? BARRAS.filter((b) => ["draft", "sent", "accepted"].includes(b.k) || q.porEstado[b.k] > 0) : [];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Encabezado de sección */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="tnum text-[13px] text-pn-sub">{d ? `${fechaLarga(d.corte)} · Corte ${hora(d.corte)} h` : "Cargando datos…"}</span>
          <span className="text-[15px] font-medium text-pn-texto">Resumen operativo de la consultoría</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportar}
            disabled={!d}
            className="h-9 rounded-md border border-pn-borde bg-white px-3.5 text-[13px] font-medium text-pn-texto hover:bg-pn-calido disabled:opacity-50"
          >
            Exportar resumen
          </button>
          <Link to="/app/proyectos" className="inline-flex h-9 items-center rounded-md border border-pn-navy bg-pn-navy px-3.5 text-[13px] font-medium text-white hover:no-underline">
            Nuevo proyecto
          </Link>
        </div>
      </div>

      {/* Indicadores */}
      {kpis.length > 0 && (
        <section aria-label="Indicadores" className="grid overflow-hidden rounded-lg border border-pn-borde bg-white [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
          {kpis.map((k) => (
            <div key={k.label} className="-mb-px flex flex-col gap-1.5 border-b border-r border-pn-borde px-[18px] py-4">
              <span className="text-xs font-medium text-pn-sub">{k.label}</span>
              <span className="tnum text-[28px] font-semibold text-pn-texto" style={{ letterSpacing: "-0.02em" }}>{d ? k.value : "…"}</span>
              <span className="text-xs font-medium" style={{ color: k.color ?? "#667085" }}>{d ? k.note : " "}</span>
            </div>
          ))}
        </section>
      )}

      {/* Fila principal */}
      <div className="flex flex-wrap items-start gap-[18px]">
        <Seccion
          id="t-proy"
          titulo="Proyectos en curso"
          className="flex-[999_1_620px]"
          extra={<span className="text-xs text-pn-sub">Módulo en preparación</span>}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Folio</Th><Th>Cliente · Sede</Th><Th>Servicio</Th><Th>Etapa</Th><Th>Riesgo</Th><Th>Avance</Th><Th>Resp.</Th><Th right>Vence</Th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
            <span className="text-[13px] font-medium text-pn-texto">Todavía no hay proyectos registrados.</span>
            <span className="max-w-md text-xs text-pn-sub">
              Aquí aparecerán los servicios contratados con su etapa, riesgo, avance y fecha de entrega cuando se habilite el módulo de Proyectos.
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-xs text-pn-sub">
            <span className="tnum">0 activos</span>
            <Link to="/app/proyectos" className="font-semibold text-pn-navy">Ver todos los proyectos</Link>
          </div>
        </Seccion>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
          <Seccion id="t-risk" titulo="Riesgos que requieren atención" extra={<Link to="/app/riesgos" className="text-xs font-semibold text-pn-navy">Ver matriz</Link>}>
            <Vacio>Sin riesgos registrados. Se mostrarán cuando se habilite el módulo de Análisis de riesgos.</Vacio>
          </Seccion>

          {verAgenda && (
            <Seccion id="t-agenda" titulo="Agenda" extra={<span className="text-xs text-pn-sub">Hoy y mañana</span>}>
              {!calc ? <Vacio>Cargando…</Vacio> : !calc.agenda ? <Vacio>No se pudo cargar la agenda.</Vacio> : calc.agenda.length === 0 ? (
                <Vacio>Sin citas hoy ni mañana.</Vacio>
              ) : (
                <ul className="py-1.5">
                  {calc.agenda.map((c) => {
                    const lugar = [c.attendee_name, c.organization, c.location].filter(Boolean).join(" · ") || "Sin lugar indicado";
                    return (
                      <li key={c.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 px-4 py-[9px]">
                        <span className="tnum text-[12.5px] font-semibold text-pn-texto">{c.dia === "hoy" ? c.hora : "Mañana"}</span>
                        <div className="flex min-w-0 flex-col gap-0.5 border-l-2 border-pn-borde pl-3">
                          <span className="text-[13px] font-medium text-pn-texto">{c.title}</span>
                          <span className="truncate text-xs text-pn-sub">{c.dia === "hoy" ? lugar : `${lugar} · ${c.hora}`}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Seccion>
          )}
        </div>
      </div>

      {/* Fila inferior */}
      {(verLeads || verCotizaciones) && (
        <div className="flex flex-wrap items-start gap-[18px]">
          {verLeads && (
            <Seccion id="t-lead" titulo="Prospectos recientes" className="flex-[999_1_620px]" extra={<Link to="/app/leads" className="text-xs font-semibold text-pn-navy">Ir a Prospectos</Link>}>
              {!d ? <Vacio>Cargando…</Vacio> : !d.recientes ? <Vacio>No se pudieron cargar los prospectos.</Vacio> : d.recientes.length === 0 ? (
                <Vacio>Aún no hay prospectos registrados.</Vacio>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead><tr><Th>Prospecto</Th><Th>Origen</Th><Th>Interés</Th><Th>Estado</Th><Th right>Recibido</Th></tr></thead>
                    <tbody>
                      {d.recientes.map((l) => (
                        <tr key={l.id}>
                          <td className="border-b border-pn-borde px-3 py-[11px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="whitespace-nowrap font-semibold text-pn-texto">{l.full_name}</span>
                              {l.organization && <span className="max-w-[220px] truncate text-xs text-pn-sub">{l.organization}</span>}
                            </div>
                          </td>
                          <td className="whitespace-nowrap border-b border-pn-borde px-3 py-[11px] text-pn-acero">{origenLead(l)}</td>
                          <td className="max-w-[240px] truncate border-b border-pn-borde px-3 py-[11px] text-pn-texto" title={interesLead(l)}>{interesLead(l)}</td>
                          <td className="border-b border-pn-borde px-3 py-[11px]"><StatusBadge status={l.status} /></td>
                          <td className="whitespace-nowrap border-b border-pn-borde px-3 py-[11px] text-right text-pn-sub">{haceCuanto(l.created_at, d.corte)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Seccion>
          )}

          {verCotizaciones && (
            <Seccion
              id="t-cot"
              titulo="Cotizaciones del mes"
              className="flex-[1_1_320px]"
              extra={q && <span className="tnum text-xs text-pn-sub">{q.mesTotal} en total</span>}
            >
              {!calc ? <Vacio>Cargando…</Vacio> : !q ? <Vacio>No se pudieron cargar las cotizaciones.</Vacio> : (
                <div className="flex flex-col gap-3.5 p-4">
                  {q.mesTotal > 0 ? (
                    <div
                      role="img"
                      aria-label={barras.map((b) => `${q.porEstado[b.k]} ${b.label.toLowerCase()}`).join(", ")}
                      className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]"
                    >
                      {barras.filter((b) => q.porEstado[b.k] > 0).map((b) => (
                        <div key={b.k} style={{ flex: `${q.porEstado[b.k]} 1 0`, background: b.color }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-pn-sub">Aún no hay cotizaciones creadas este mes.</p>
                  )}
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(barras.length, 3)}, minmax(0, 1fr))` }}>
                    {barras.map((b) => (
                      <div key={b.k} className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-xs text-pn-sub">
                          <span className="h-2 w-2 rounded-sm" style={{ background: b.color }} />{b.label}
                        </span>
                        <span className="tnum text-xl font-semibold text-pn-texto">{q.porEstado[b.k]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2.5 rounded-md border border-pn-borde bg-pn-calido px-3 py-2.5">
                    {q.sinRespuesta > 0 ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B7791F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d="M12 3l9.5 17h-19zM12 10v4M12 17h.01" /></svg>
                        <span className="text-[12.5px] text-pn-texto">
                          {q.sinRespuesta === 1
                            ? `1 cotización enviada lleva más de ${DIAS_SIN_RESPUESTA} días sin respuesta.`
                            : `${q.sinRespuesta} cotizaciones enviadas llevan más de ${DIAS_SIN_RESPUESTA} días sin respuesta.`}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#287A59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d="M5 12l5 5 9-10" /></svg>
                        <span className="text-[12.5px] text-pn-texto">Ninguna cotización enviada lleva más de {DIAS_SIN_RESPUESTA} días sin respuesta.</span>
                      </>
                    )}
                  </div>
                  <Link to="/app/quotes" className="text-xs font-semibold text-pn-navy">Ir a Cotizaciones</Link>
                </div>
              )}
            </Seccion>
          )}
        </div>
      )}

      {/* Gráfica de prospectos (14 días) */}
      {verLeads && calc?.tendencia && (
        <Seccion id="t-tend" titulo="Prospectos de los últimos 14 días" extra={<span className="tnum text-xs text-pn-sub">{calc.tendencia.reduce((s, x) => s + x.v, 0)} en total</span>}>
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calc.tendencia} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
                <CartesianGrid stroke="#DCE1E6" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #DCE1E6", borderRadius: 6, fontSize: 12 }} />
                <Line type="monotone" dataKey="v" name="Prospectos" stroke="#0B1F3A" strokeWidth={2} dot={{ r: 3, fill: "#7B7F42", stroke: "#7B7F42" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Seccion>
      )}

      {isAdmin && <GooglePublico />}
    </div>
  );
};

export default Dashboard;
